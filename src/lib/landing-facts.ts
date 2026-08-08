/** Compact landing-page facts for AI feedContext (no LLM; heuristic extract). */

import { ALLOWED_SHELF_SLUGS, validateShelfSlug } from "./catalog-shelf";

export const LANDING_FACTS_MAX_JSON_CHARS = 1800;
export const LANDING_FACTS_THIN_TEXT_CHARS = 800;

export type LandingFactsLang = "cs" | "it" | "other" | "unknown";

export type CompactLandingFacts = {
  form: string | null;
  role: string | null;
  dosage: string | null;
  ingredients: string[];
  benefits: string[];
  h1: string | null;
  /** topical | oral | other */
  application: string | null;
  packSize: string | null;
  courseDays: string | null;
  usageSteps: string[];
  audience: string | null;
  warnings: string[];
  /** Shelf slug hint, e.g. joint-care */
  categoryHint: string | null;
};

export type LandingFactsStatus =
  | "ok"
  | "thin"
  | "exhausted"
  | "skip_geo"
  | "fetch_error"
  | "no_url";

export type LandingFactsExtractResult = {
  sourceUrl: string;
  langHint: LandingFactsLang;
  status: LandingFactsStatus;
  facts: CompactLandingFacts | null;
  fullTextChars: number;
  jsonChars: number;
  error?: string;
};

/** Consecutive thin outcomes before we stop LLM retries for this url_hash. */
export const THIN_EXHAUST_AFTER = 5;
/** Consecutive fetch_error outcomes before we stop retrying (mirrors image-facts). */
export const FETCH_EXHAUST_AFTER = 5;
/**
 * Partner "dead URL" codes — confirm over multiple ticks (not one-shot).
 * One-blip partner outages should not terminal-exhaust.
 */
export const FETCH_TERMINAL_HTTP_CODES = new Set([404, 410]);
/** Confirm 404/410 this many consecutive fetch outcomes before exhaust. */
export const FETCH_TERMINAL_CONFIRM_AFTER = 3;
/**
 * @deprecated 530 is no longer fast-exhausted — same streak as generic fetch.
 * Kept for backfill scripts / import stability.
 */
export const FETCH_FAST_EXHAUST_HTTP_CODES = new Set<number>();
/** @deprecated use FETCH_EXHAUST_AFTER; kept for backfill script imports. */
export const FETCH_FAST_EXHAUST_AFTER = FETCH_EXHAUST_AFTER;

export function backoffLockedUntilMinutes(failCount: number): number {
  return Math.min(360, 15 * Math.max(1, 2 ** Math.min(failCount, 5)));
}

export function backoffLockedUntilFromStreak(streak: number, now = Date.now()): string {
  const minutes = backoffLockedUntilMinutes(streak);
  return new Date(now + minutes * 60_000).toISOString();
}

/** Parse `HTTP 404` / `HTTP 530` from fetch-aggregate error messages. */
export function parseLandingFetchHttpStatus(errorMessage: string): number | null {
  const m = String(errorMessage).match(/\bHTTP\s+(\d{3})\b/i);
  if (!m) return null;
  const code = Number(m[1]);
  return Number.isFinite(code) ? code : null;
}

export type ThinOutcome = {
  status: "thin" | "exhausted";
  fail_count: number;
  locked_until: string | null;
};

/** Track consecutive thin results; after THIN_EXHAUST_AFTER → exhausted (no more drain). */
export function nextThinOutcome(
  prevStatus: string,
  prevFailCount: number,
  now = Date.now(),
): ThinOutcome {
  const thinStreak = (prevStatus === "thin" ? prevFailCount : 0) + 1;
  if (thinStreak >= THIN_EXHAUST_AFTER) {
    return { status: "exhausted", fail_count: thinStreak, locked_until: null };
  }
  return {
    status: "thin",
    fail_count: thinStreak,
    locked_until: backoffLockedUntilFromStreak(thinStreak, now),
  };
}

export type FetchErrorOutcome = {
  status: "fetch_error" | "exhausted";
  fail_count: number;
  locked_until: string | null;
};

export type NextFetchErrorOpts = {
  /** Aggregate error from fetchFirstUsableLandingHtml — used for 404/410 confirm streak. */
  errorMessage?: string;
};

/**
 * Backoff for fetch/network errors — independent from thin streak.
 * Exhausts after FETCH_EXHAUST_AFTER consecutive fetch_error.
 * 404/410 confirm after FETCH_TERMINAL_CONFIRM_AFTER (longer lock between attempts).
 * 530/5xx use the same generic streak (no fast-exhaust).
 */
export function nextFetchErrorOutcome(
  prevStatus: string,
  prevFailCount: number,
  now = Date.now(),
  opts?: NextFetchErrorOpts,
): FetchErrorOutcome {
  const streak = (prevStatus === "fetch_error" ? prevFailCount : 0) + 1;
  const httpStatus = opts?.errorMessage
    ? parseLandingFetchHttpStatus(opts.errorMessage)
    : null;

  const isDeadCode =
    httpStatus != null && FETCH_TERMINAL_HTTP_CODES.has(httpStatus);
  const exhaustAfter = isDeadCode
    ? FETCH_TERMINAL_CONFIRM_AFTER
    : FETCH_EXHAUST_AFTER;

  if (streak >= exhaustAfter) {
    return { status: "exhausted", fail_count: streak, locked_until: null };
  }

  // 404/410 mid-confirm: longer park so we don't thrash partner CDN.
  if (isDeadCode) {
    const lockMs = 24 * 60 * 60 * 1000; // 24h
    return {
      status: "fetch_error",
      fail_count: streak,
      locked_until: new Date(now + lockMs).toISOString(),
    };
  }

  return {
    status: "fetch_error",
    fail_count: streak,
    locked_until: backoffLockedUntilFromStreak(streak, now),
  };
}

/**
 * Reset fail streak when URL hash changes (mirrors image-facts hashChanged).
 */
export function landingStreakBase(
  prev: { status: string; fail_count: number; url_hash?: string | null } | null | undefined,
  currentUrlHash: string,
): { status: string; fail_count: number } {
  if (!prev) return { status: "", fail_count: 0 };
  if (prev.url_hash && prev.url_hash !== currentUrlHash) {
    return { status: "", fail_count: 0 };
  }
  return { status: prev.status, fail_count: prev.fail_count };
}

const ADAPTIVE_MARK = "\u0410\u0434\u0430\u043f\u0442\u0438\u0432"; // Адаптив

export function isAdaptiveLandingType(type: unknown): boolean {
  return String(type ?? "").includes(ADAPTIVE_MARK);
}

export function absLandingUrl(url: unknown): string | null {
  if (url == null) return null;
  const u = String(url).trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`;
}

function dedupeUrls(urls: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of urls) {
    const key = u.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}

function isCzPrefixedLandingUrl(url: string): boolean {
  const raw = url.replace(/^https?:\/\//i, "");
  return (
    /^cz/i.test(raw) ||
    /^https?:\/\/cz/i.test(url) ||
    /\.cz\b/i.test(url) ||
    /\/cz[-_/]/i.test(url)
  );
}

/**
 * All adaptive landing URLs, CZ-prefixed first, deduped.
 * Never includes transit URLs (non-adaptive).
 */
export function listAdaptiveLandingUrls(raw: {
  landings?: Array<{ type?: string; url?: string }>;
  landing_url_it?: string;
}): string[] {
  const landings = raw.landings ?? [];
  const adapts = landings
    .filter((l) => isAdaptiveLandingType(l.type) && l.url)
    .map((l) => absLandingUrl(l.url))
    .filter((u): u is string => !!u);
  const unique = dedupeUrls(adapts);
  const cz = unique.filter((u) => isCzPrefixedLandingUrl(u));
  const rest = unique.filter((u) => !isCzPrefixedLandingUrl(u));
  return [...cz, ...rest];
}

/** Prefer CZ adaptive landing; never returns transit URLs. */
export function pickAdaptiveLandingUrl(raw: {
  landings?: Array<{ type?: string; url?: string }>;
  landing_url_it?: string;
}): string | null {
  return listAdaptiveLandingUrls(raw)[0] ?? null;
}

/** All CPA.tl landings marked language_code cz/cs, deduped (feed order). */
export function listCpaTlCzLandingUrls(raw: {
  landings?: Array<{
    url?: string;
    language_code?: string;
    language?: string;
  }>;
}): string[] {
  const landings = raw.landings ?? [];
  const urls = landings
    .filter((l) => {
      const code = String(l.language_code ?? "").toLowerCase();
      return (code === "cz" || code === "cs") && String(l.url ?? "").trim();
    })
    .map((l) => absLandingUrl(l.url))
    .filter((u): u is string => !!u);
  return dedupeUrls(urls);
}

/** Prefer CPA.tl landing marked language_code cz/cs (feed geo), not host heuristic. */
export function pickCpaTlCzLandingUrl(raw: {
  landings?: Array<{
    url?: string;
    language_code?: string;
    language?: string;
  }>;
}): string | null {
  return listCpaTlCzLandingUrls(raw)[0] ?? null;
}

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clip(s: string | null | undefined, n: number): string | null {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}...`;
}

function uniq(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const k = fold(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#215;/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLang(text: string, url: string): LandingFactsLang {
  if (/euit/i.test(url)) return "it";
  if (/\b(gocce|ordina|dimagrimento|chetosi)\b/i.test(text)) return "it";
  if (/cza?-|\bcz\d/i.test(url)) return "cs";
  if (/\b(objednat|pripravek|papilom)\b/i.test(fold(text))) return "cs";
  return "unknown";
}

function detectForm(title: string, text: string): string | null {
  const hay = fold(`${title} ${text}`);
  if (/\bgel(u|em|e)?\b/.test(hay)) return "gel";
  if (/\b(kapk|gocce)\b/.test(hay)) return "kapky";
  if (/\bkaps/.test(hay)) return "kapsle";
  if (/\bkrem\b|crema/.test(hay)) return "krem";
  if (/\bsprej\b|spray/.test(hay)) return "sprej";
  if (/\btablet|pillole/.test(hay)) return "tablety";
  return null;
}

function detectRole(text: string): string | null {
  const t = fold(text);
  if (/papilom|bradavic|condilom|\bhpv\b/.test(t)) return "papilomy";
  if (/zrak|kratkozrak|dioptr|oftalm|occhi|\bvista\b/.test(t)) return "zrak";
  if (/hubnut|chetosi|dimagr|keto|peso in eccesso|w-?loss/.test(t)) return "hubnuti";
  if (/kloub|artr|hondro/.test(t)) return "klouby";
  if (/potenc|erekc|libid/.test(t)) return "potence";
  if (/hemor|prokt|procto/.test(t)) return "proctology";
  return null;
}

function extractDosage(text: string): string | null {
  const patterns = [
    /(\d+\s*[-–]?\s*\d*\s*(?:kapek|kapky|gocce)[^.]{0,80})/i,
    /(Modalit.\s*d.assunzione[^.]{0,100})/i,
    /(\d+\s*[x\times]\s*denn[^.]{0,60})/i,
    /(\d+-\d+\s*volte al giorno[^.]{0,80})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return clip(m[1], 120);
  }
  return null;
}

function extractH1(html: string, text: string): string | null {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (m) return clip(htmlToPlainText(m[1]), 120);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) return clip(htmlToPlainText(t[1]), 120);
  return clip(text.slice(0, 120), 120);
}

function extractIngredients(text: string): string[] {
  const f = fold(text);
  const catalog: Array<[string, string]> = [
    ["zazvorovy olej", "zazvorovy olej"],
    ["vytazek z kostivalu", "vytazek z kostivalu"],
    ["vytazek z medunky", "vytazek z medunky"],
    ["tokoferol", "tokoferol"],
    ["olej z vonatky citronove", "olej z vonatky citronove"],
    ["olej z cajovniku", "olej z cajovniku"],
    ["skorice", "skorice"],
    ["niacinamid", "niacinamid"],
    ["ananas", "ananas"],
    ["kumquat", "kumquat"],
    ["papaya", "papaya"],
    ["maracuja", "maracuja"],
    ["te verde", "te verde"],
    ["vitamina b6", "vitamina b6"],
  ];
  const found: string[] = [];
  for (const [needle, label] of catalog) {
    if (f.includes(fold(needle))) found.push(label);
  }
  return uniq(found).slice(0, 8);
}

function extractBenefits(text: string, role: string | null): string[] {
  const f = fold(text);
  const cands: string[] = [];
  const addIf = (needle: string, label: string) => {
    if (f.includes(fold(needle))) cands.push(clip(label, 100)!);
  };

  if (role === "papilomy") {
    addIf("potlacuje aktivitu virovych bunek", "potlacuje aktivitu virovych bunek");
    addIf("bezbolestne odstranu", "bezbolestne odstranovani utvaru");
    addIf("obnovuje poskozene casti kuze", "obnovuje poskozene casti kuze");
    addIf("48 hodin", "nici puvodce behem 48 hodin");
    addIf("blokuje aktivitu viru", "blokuje aktivitu viru + imunitni obrana");
  } else if (role === "zrak") {
    addIf("ocnich svalu", "obnova funkce ocnich svalu");
    addIf("stav cocky", "zlepseni stavu cocky");
    addIf("laserovou", "ucinek srovnatelny s laserovou korekci");
  } else if (role === "hubnuti") {
    addIf("minimizza l'assunzione di carboidrati", "minimizza assunzione carboidrati");
    addIf("riduce i livelli di glucosio", "riduce glucosio nel sangue");
    addIf("combustione dei grassi", "avvia combustione grassi");
    addIf("20 gocce", "20 gocce accelerano chetosi");
    addIf("assorbimento dei carboidrati", "blocca assorbimento carboidrati");
    addIf("hubnut", "podpora hubnuti / keto");
  }
  return uniq(cands).slice(0, 5);
}

function trimToBudget(facts: CompactLandingFacts): {
  facts: CompactLandingFacts;
  jsonChars: number;
} {
  const f: CompactLandingFacts = {
    ...facts,
    ingredients: [...facts.ingredients],
    benefits: [...facts.benefits],
    usageSteps: [...facts.usageSteps],
    warnings: [...facts.warnings],
  };
  const over = () => JSON.stringify(f).length > LANDING_FACTS_MAX_JSON_CHARS;
  if (!over()) return { facts: f, jsonChars: JSON.stringify(f).length };
  while (over() && f.warnings.length) f.warnings.pop();
  while (over() && f.benefits.length) f.benefits.pop();
  while (over() && f.usageSteps.length) f.usageSteps.pop();
  while (over() && f.ingredients.length) f.ingredients.pop();
  if (over() && f.h1) f.h1 = clip(f.h1, 60);
  if (over() && f.audience) f.audience = clip(f.audience, 60);
  return { facts: f, jsonChars: JSON.stringify(f).length };
}

export function extractCompactLandingFacts(opts: {
  html: string;
  sourceUrl: string;
  title?: string;
  /** When true, non-cs lang → status skip_geo (facts still returned for debug). */
  requireCs?: boolean;
}): LandingFactsExtractResult {
  const text = htmlToPlainText(opts.html);
  const langHint = detectLang(text, opts.sourceUrl);
  if (text.length < LANDING_FACTS_THIN_TEXT_CHARS) {
    return {
      sourceUrl: opts.sourceUrl,
      langHint,
      status: "thin",
      facts: null,
      fullTextChars: text.length,
      jsonChars: 0,
    };
  }
  if (opts.requireCs !== false && langHint !== "cs") {
    return {
      sourceUrl: opts.sourceUrl,
      langHint,
      status: "skip_geo",
      facts: null,
      fullTextChars: text.length,
      jsonChars: 0,
    };
  }

  const role = detectRole(text);
  const draft: CompactLandingFacts = {
    form: detectForm(opts.title ?? "", text),
    role,
    dosage: extractDosage(text),
    ingredients: extractIngredients(text),
    benefits: extractBenefits(text, role),
    h1: extractH1(opts.html, text),
    application: null,
    packSize: null,
    courseDays: null,
    usageSteps: [],
    audience: null,
    warnings: [],
    categoryHint: null,
  };
  const { facts, jsonChars } = trimToBudget(draft);
  const useful =
    !!facts.form ||
    !!facts.role ||
    !!facts.dosage ||
    facts.ingredients.length > 0 ||
    facts.benefits.length > 0;
  if (!useful) {
    return {
      sourceUrl: opts.sourceUrl,
      langHint,
      status: "thin",
      facts: null,
      fullTextChars: text.length,
      jsonChars: 0,
    };
  }
  return {
    sourceUrl: opts.sourceUrl,
    langHint,
    status: "ok",
    facts,
    fullTextChars: text.length,
    jsonChars,
  };
}

/** Short block for AI feedContext (Czech labels). */
export function formatLandingFactsForPrompt(facts: CompactLandingFacts): string {
  const lines: string[] = [
    "Fakta z adaptive landingu (PRIORITNÍ — strukturovaná fakta o produktu):",
  ];
  if (facts.form) lines.push(`forma: ${facts.form}`);
  if (facts.application) lines.push(`aplikace: ${facts.application}`);
  if (facts.role) lines.push(`role/indikace: ${facts.role}`);
  if (facts.categoryHint) lines.push(`kategorieHint: ${facts.categoryHint}`);
  if (facts.packSize) lines.push(`baleni: ${facts.packSize}`);
  if (facts.courseDays) lines.push(`kura: ${facts.courseDays}`);
  if (facts.dosage) lines.push(`davkovani: ${facts.dosage}`);
  if (facts.ingredients.length) {
    lines.push(`slozeni: ${facts.ingredients.join("; ")}`);
  }
  if (facts.benefits.length) {
    lines.push(`benefity: ${facts.benefits.join("; ")}`);
  }
  if (facts.usageSteps.length) {
    lines.push(`navod: ${facts.usageSteps.map((s, i) => `${i + 1}. ${s}`).join(" | ")}`);
  }
  if (facts.audience) lines.push(`proKoho: ${facts.audience}`);
  if (facts.warnings.length) {
    lines.push(`upozorneni: ${facts.warnings.join("; ")}`);
  }
  if (facts.h1) lines.push(`nadpis: ${facts.h1}`);
  return lines.join("\n");
}

/** Collapse whitespace; send full landing plain text to the LLM extract (no char cap). */
export function normalizeLandingTextForLlm(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Canonical shelf slugs for landing-facts categoryHint (excludes catch-all `other`). */
export const LANDING_FACTS_CATEGORY_HINT_SLUGS: readonly string[] = ALLOWED_SHELF_SLUGS;

/** Legacy LLM / DB aliases → canonical shelf slug. */
const LANDING_FACTS_HINT_ALIASES: Record<string, string> = {
  proctology: "hemoroidy",
  diabetes: "cukrovka",
  "potenz-libido": "potence",
  "mens-vitality": "potence",
};

export function buildLandingFactsLlmPrompt(title: string, plainText: string): string {
  const body = normalizeLandingTextForLlm(plainText);
  const categoryHintEnum = `${LANDING_FACTS_CATEGORY_HINT_SLUGS.join("|")}|other|null`;
  return `Extrahuj strukturovaná fakta o produktu z textu landing page.
Vrať POUZE JSON objekt (bez markdown) s klíči:
{
  "form": string|null,           // gel|kapsle|kapky|krem|sprej|tablety|jiné|null
  "application": string|null,    // topical|oral|other
  "role": string|null,           // krátká indikace (hemoroidy, klouby, hubnutí, potence…)
  "categoryHint": string|null,   // shelf slug: ${categoryHintEnum}
  "packSize": string|null,       // např. 50 ml, 30 kapslí
  "courseDays": string|null,     // např. 30 dní
  "dosage": string|null,         // max 120 znaků
  "ingredients": string[],       // max 8, max 60 znaků
  "benefits": string[],          // max 5, max 100 znaků
  "usageSteps": string[],        // max 5 kroků návodu, max 120 znaků
  "audience": string|null,       // pro koho, max 120 znaků
  "warnings": string[],          // max 3 jemná upozornění, max 100 znaků
  "h1": string|null              // hlavní nadpis, max 120 znaků
}

Pravidla:
- Ber jen to, co je ve textu. Nevymýšlej složení, dávkování ani účinky.
- Pokud údaj chybí, použij null / [].
- Nezesiluj medicínské sliby; formuluj neutrálně (bez „vyléčí“, „100%“).
- Všechna textová pole faktů (role, dosage, ingredients, benefits, usageSteps, audience, warnings, h1, packSize, courseDays) piš VŽDY česky. Pokud je landing v jiném jazyce, přelož do češtiny POUZE tato krátká pole ve výstupu — nepřekládej celý text landingu.
- Enum hodnoty form / application / categoryHint nech podle schématu výše (nepřekládej).
- categoryHint = kanonický shelf slug z výčtu (např. hemoroidy, cystitida, paraziti, prostata) — ne synonyma.
- usageSteps = konkrétní kroky použití (ne marketing).
- Brýle / eyewear / nastavitelné dioptrie → form "jiné", categoryHint "modni-doplnky" (NE zrak — to je pro doplňky stravy na oči).

Název produktu z feedu: ${title}

Text landingu:
"""
${body}
"""`;
}

/** Normalize/clamp LLM JSON into CompactLandingFacts. */
export function normalizeLlmLandingFacts(raw: unknown): CompactLandingFacts | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const asStr = (v: unknown, n: number): string | null => {
    if (v == null) return null;
    const t = String(v).replace(/\s+/g, " ").trim();
    if (!t || t.toLowerCase() === "null") return null;
    return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
  };
  const asList = (v: unknown, maxItems: number, maxLen: number): string[] => {
    if (!Array.isArray(v)) return [];
    const out: string[] = [];
    for (const item of v) {
      const s = asStr(item, maxLen);
      if (s) out.push(s);
      if (out.length >= maxItems) break;
    }
    return out;
  };
  let application = asStr(o.application, 20);
  if (application) {
    const a = application.toLowerCase();
    if (a.includes("top") || a.includes("vnej") || a.includes("vně") || a.includes("local") || a.includes("kůž") || a.includes("kuz")) {
      application = "topical";
    } else if (a.includes("oral") || a.includes("vnit") || a.includes("ústy") || a.includes("ust") || a.includes("polyk")) {
      application = "oral";
    } else if (a !== "topical" && a !== "oral" && a !== "other") {
      application = "other";
    }
  }
  const draft: CompactLandingFacts = {
    form: asStr(o.form, 40),
    role: asStr(o.role, 80),
    dosage: asStr(o.dosage, 120),
    ingredients: asList(o.ingredients, 8, 60),
    benefits: asList(o.benefits, 5, 100),
    h1: asStr(o.h1, 120),
    application,
    packSize: asStr(o.packSize ?? o.pack_size, 60),
    courseDays: asStr(o.courseDays ?? o.course_days, 40),
    usageSteps: asList(o.usageSteps ?? o.usage_steps, 5, 120),
    audience: asStr(o.audience, 120),
    warnings: asList(o.warnings, 3, 100),
    categoryHint: asStr(o.categoryHint ?? o.category_hint, 40),
  };
  const { facts, jsonChars: _ } = trimToBudget(draft);
  const useful =
    !!facts.form ||
    !!facts.role ||
    !!facts.dosage ||
    !!facts.application ||
    !!facts.packSize ||
    facts.ingredients.length > 0 ||
    facts.benefits.length > 0 ||
    facts.usageSteps.length > 0 ||
    !!facts.h1;
  return useful ? facts : null;
}

export function landingFactsAreRich(facts: CompactLandingFacts | null): boolean {
  if (!facts) return false;
  return (
    facts.ingredients.length > 0 ||
    facts.benefits.length > 0 ||
    facts.usageSteps.length > 0
  );
}

/** CZ adaptive host/path heuristic for inject guards. */
export function isClearlyCzLandingUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\/cz/i.test(url) || /\.cz\b/i.test(url) || /\/cz[-_/]/i.test(url);
}

/**
 * All m1.top tracking_link URLs, CZ-looking host/path first, deduped.
 * Offer is already filtered to MARKET_GEO=CZ at sync time.
 */
export function listM1TopLandingUrls(raw: {
  tracking_link?: Array<string | null | undefined> | null;
}): string[] {
  const links = (raw.tracking_link ?? [])
    .map((u) => absLandingUrl(u))
    .filter((u): u is string => !!u);
  const unique = dedupeUrls(links);
  const cz = unique.filter((u) => isClearlyCzLandingUrl(u));
  const rest = unique.filter((u) => !isClearlyCzLandingUrl(u));
  return [...cz, ...rest];
}

/** Prefer clearly CZ host/path from m1.top tracking_link[]; else first absolute URL. */
export function pickM1TopLandingUrl(raw: {
  tracking_link?: Array<string | null | undefined> | null;
}): string | null {
  return listM1TopLandingUrls(raw)[0] ?? null;
}

/**
 * Whether a fetched landing response is usable for extract (2xx + enough plain text).
 * Pure helper for unit tests and fetch fallback loop.
 */
export function isUsableLandingFetch(opts: {
  status: number;
  plainTextChars: number;
  minPlainTextChars?: number;
}): boolean {
  const min = opts.minPlainTextChars ?? LANDING_FACTS_THIN_TEXT_CHARS;
  return opts.status >= 200 && opts.status < 300 && opts.plainTextChars >= min;
}

/**
 * Pick first candidate index that would succeed given per-URL fetch outcomes.
 * Returns -1 if none usable (caller → fetch_error).
 */
export function pickFirstUsableLandingIndex(
  outcomes: Array<{ status: number; plainTextChars: number }>,
  minPlainTextChars = LANDING_FACTS_THIN_TEXT_CHARS,
): number {
  for (let i = 0; i < outcomes.length; i++) {
    const o = outcomes[i]!;
    if (isUsableLandingFetch({ ...o, minPlainTextChars })) return i;
  }
  return -1;
}

function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function landingUrlHash(url: string): string {
  return hashString(url.trim().toLowerCase());
}

const AGGRESSIVE_CLAIM_RE =
  /\b(l[eé]k|vyl[eé][cč][ií]|100\s*%|garanti|okamžit[eý]|za\s+m[eě]s[ií]c|\d+\s*[-–]\s*\d+\s*kg|navždy|navzdy|bez\s+vedlejš)/i;

function softenClaim(s: string): string | null {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (AGGRESSIVE_CLAIM_RE.test(t)) return null;
  return t;
}

/** Soft-sanitize marketing / medical overclaims before prompt inject. */
export function sanitizeLandingFacts(facts: CompactLandingFacts): CompactLandingFacts {
  return {
    ...facts,
    dosage: facts.dosage ? softenClaim(facts.dosage) : null,
    benefits: facts.benefits.map((b) => softenClaim(b)).filter((x): x is string => !!x).slice(0, 5),
    usageSteps: facts.usageSteps.map((s) => softenClaim(s)).filter((x): x is string => !!x).slice(0, 5),
    warnings: facts.warnings.map((w) => softenClaim(w)).filter((x): x is string => !!x).slice(0, 3),
    h1: facts.h1 ? softenClaim(facts.h1) ?? clip(facts.h1, 80) : null,
    ingredients: facts.ingredients.filter((ing) => {
      const f = fold(ing);
      return f && f !== "100% prirodni" && f !== "prirodni slozky" && f.length > 2;
    }),
  };
}

/** Eyewear / optics gadgets — not lutein supplements (vision-eye-care). */
export function isEyewearLandingFacts(facts: CompactLandingFacts | null): boolean {
  if (!facts) return false;
  // Oral vision supplements mention anatomical «čočky» (crystalline lens) — not eyewear.
  const hint = String(facts.categoryHint ?? "")
    .trim()
    .toLowerCase();
  if (hint === "zrak") return false;
  if (String(facts.application ?? "").trim().toLowerCase() === "oral") return false;
  const hay = fold(
    [
      facts.h1,
      facts.role,
      facts.form,
      facts.categoryHint,
      ...(facts.benefits ?? []),
      ...(facts.usageSteps ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
  // Bare «cocky»/«ocky» false-match Czech «čočky» (eye lens) after fold — require contact-lens context.
  return /bryle|dioptr|ochki|glasses|eyeglasses|eyewear|ramecek|nastavitelne dioptr|kontaktni\s+cocky|contact\s+lenses?/.test(
    hay,
  );
}

/**
 * Map landing role / categoryHint to a catalog shelf slug.
 * Returns null when unknown / other — caller keeps classifier result.
 */
export function resolveShelfFromLandingFacts(facts: CompactLandingFacts | null): string | null {
  if (!facts) return null;
  // Adjustable glasses / optics → accessories (not lutein / vision supplements).
  if (isEyewearLandingFacts(facts)) return "modni-doplnky";
  const role = fold(facts.role ?? "");
  const roleShelf = (() => {
    if (!role) return null;
    if (/hyperten|tlak|krevni tlak|blood.?pressure/.test(role)) return "krevni-tlak";
    if (/diabet|cukrov|insulin|glykem/.test(role)) return "cukrovka";
    if (/cystit|mocov/.test(role)) return "cystitida";
    if (/parasit|parazit|odcerv/.test(role)) return "paraziti";
    if (/potenc|erekc|libido/.test(role)) return "potence";
    if (/hubnut|hmotnost|tuk|weight/.test(role)) return "hubnuti";
    if (/kloub|joint|artrit/.test(role)) return "klouby";
    if (/hemor|procto|zil/.test(role)) return "hemoroidy";
    if (/papil|bradavic/.test(role)) return "papilomy";
    if (/zrak|oci|eye|vision/.test(role)) return "zrak";
    if (/omlaz|pleti|anti.?age|krem/.test(role)) return null;
    return null;
  })();
  const hint = String(facts.categoryHint ?? "")
    .trim()
    .toLowerCase();
  if (hint && hint !== "other") {
    const aliased = LANDING_FACTS_HINT_ALIASES[hint] ?? hint;
    const mapped = validateShelfSlug(aliased);
    if (mapped) {
      // LLM sometimes tags parasite cleanse as papillomas (skin/allergy cues in benefits).
      if (mapped === "papilomy" && roleShelf === "paraziti") return "paraziti";
      return mapped;
    }
  }
  return roleShelf;
}

/** Whether a DB/live extract row is safe to inject into CZ PDP feedContext. */
export function shouldInjectLandingFacts(opts: {
  status: string;
  langHint: string;
  sourceUrl: string;
  facts: CompactLandingFacts | null;
}): { inject: boolean; facts: CompactLandingFacts | null; promptBlock: string | null; shelf: string | null } {
  if (opts.status !== "ok" || !opts.facts) {
    return { inject: false, facts: null, promptBlock: null, shelf: null };
  }
  const csOk = opts.langHint === "cs" || isClearlyCzLandingUrl(opts.sourceUrl);
  if (!csOk) {
    return { inject: false, facts: null, promptBlock: null, shelf: null };
  }
  const sanitized = sanitizeLandingFacts(opts.facts);
  if (!landingFactsAreRich(sanitized)) {
    return { inject: false, facts: null, promptBlock: null, shelf: null };
  }
  return {
    inject: true,
    facts: sanitized,
    promptBlock: formatLandingFactsForPrompt(sanitized),
    shelf: resolveShelfFromLandingFacts(sanitized),
  };
}
