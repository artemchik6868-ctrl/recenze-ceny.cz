/** Linear 7-step AI content pipeline prompts for the CZ storefront. */

import { CATEGORY_CONTENT, NEW_CATEGORY_NAMES_CS, getCategoryContent } from "./content.cs";
import { ALLOWED_SHELF_SLUGS } from "./catalog-shelf";
import { cleanForSource } from "./source-cleaners";
import { formatDisplayPrice } from "./market";
import { deliveryH2For } from "./pdp-variants";
import { getNicheType, type NicheType } from "./niche-types";
import { splitBrandAndTail } from "./brand-clean";
import { T as CS } from "./i18n.cs";
import { inferProductRoleCs } from "./product-role.cs";
import type { OfferSource } from "./types";

/** Raw feed price passed to prompts (displayed as CZK, no FX conversion). */
export type FeedPrice = { amount: number; currency: string };

export function feedPriceFromParts(amount: unknown, currency: unknown): FeedPrice | null {
  if (amount == null || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return null;
  const cur = String(currency ?? "").trim();
  return { amount: n, currency: cur || "EUR" };
}

export function formatFeedPriceForPrompt(price: FeedPrice | null | undefined): string {
  if (!price) return "";
  if (price.amount === 0) return "0 (bezplatná objednávka)";
  return formatDisplayPrice(price.amount);
}

export type Step1Result = { headline: string };
export type Step2Result = { display_title_cs: string };
export type Step3Result = { category: string };
export type Step4Result = { title: string };
export type Step5Result = { meta_desc: string };
export type Step6Result = { html: string };
export type Step6bResult = { expert_opinion: string };
export type Step7Result = { faq: { q: string; a: string }[] };

/** Stored in product_content.sections_uk heading field. */
export const EXPERT_OPINION_SECTION_HEADING = "expert_opinion";

export const STEP6B_OPINION_MIN_CHARS = 80;
export const STEP6B_OPINION_MAX_CHARS = 2500;

export function validateStep6bOpinion(text: string): void {
  const t = text.trim();
  if (t.length < STEP6B_OPINION_MIN_CHARS) {
    throw new Error(`Step 6b opinion too short: ${t.length} chars (min ${STEP6B_OPINION_MIN_CHARS})`);
  }
  if (t.length > STEP6B_OPINION_MAX_CHARS) {
    throw new Error(`Step 6b opinion too long: ${t.length} chars (max ${STEP6B_OPINION_MAX_CHARS})`);
  }
  if (/```/.test(t) || /<\/?[a-z]/i.test(t)) {
    throw new Error("Step 6b opinion must be plain text, no HTML or markdown");
  }
}

export type FeedContextExtra = {
  category?: string;
  goals?: string;
  info?: string;
  feedPrice?: FeedPrice | null;
};

export function buildPricePromptLine(feedPrice: FeedPrice | null | undefined): string {
  if (feedPrice == null) {
    return "Cena: není ve feedu — nevymýšlej čísla; použij obecné formulace («na dotaz», «aktuální cena na stránce produktu»).";
  }
  const label = formatFeedPriceForPrompt(feedPrice);
  if (feedPrice.amount === 0) {
    return `Cena z feedu: ${label} — můžeš zmínit akci nebo bezplatné doručení.`;
  }
  return `Cena z feedu: ${label}. Uveď ji přirozeně, kde to dává smysl (např. «cena ${label}»). Nepoužívej «od», pokud je cena pevná.`;
}

const GEO_MARKERS =
  "EU, PT, LT, ES, SK, PL, RO, DE, FR, IT, UK, US, UA, RU, FREE, LOW, HIGH, TOP, HOLD, бесплатно, 2.0, gratis, hold, low price";

const STEP1_EXAMPLES = `Diaform - капсулы от диабета,
Rectin - гель от геморроя,
Beauty Age Skin - средство для омоложения,
Eudalie - крем для омоложения,
Eudalie - омолаживающий крем,
NIAPEPT - антивозрастной крем,
Pulsero - средство для потенции,
Pulsero - препарат для повышения потенции,
Gigant - гель для увеличения полового члена,
Rhino Gold - гель для увеличения члена,
UltraVix - средство для суставов,
ABslim - капли для похудения,
HeatCore - портативный обогреватель,
NightVision Pro - очки для ночного вождения,
LeatherBag Milano - кожаная сумка через плечо,
SmartWatch Fit - фитнес-браслет,
GardenGrow - удобрение для сада,
Reishield - средство от никотиновой зависимости,
Reishield - средство для памяти,
Reishield - средство от стресса,
Reishield - препарат от грибка,
Benaga Chaga - средство от курения,
Benaga Chaga - средство для похудения,
Benaga Chaga - средство от гипертонии,
Benaga Chaga - средство от грибка,
Cordyceps Pulse - средство от курения,
Cordyceps Pulse - средство от гипертонии,
Cordyceps Pulse - средство от грибка`;

export function buildCategoryPromptList(): string {
  return ALLOWED_SHELF_SLUGS.map((slug) => {
    const name =
      CATEGORY_CONTENT[slug]?.nameHi ??
      NEW_CATEGORY_NAMES_CS[slug]?.name ??
      getCategoryContent(slug).nameHi;
    return `${slug} — ${name}`;
  }).join("\n");
}

export function buildFeedContextBlock(
  source: OfferSource,
  rawDescription: string,
  extra: FeedContextExtra = {},
): string {
  const { cleaned } = cleanForSource(source, rawDescription);
  const parts: string[] = [];
  if (extra.category?.trim()) {
    parts.push(`Kategorie z feedu: ${extra.category.trim()}`);
  }
  if (extra.goals?.trim()) parts.push(`Cíle/indikace z feedu: ${extra.goals.trim()}`);
  if (extra.info?.trim()) parts.push(extra.info.trim());
  if (extra.feedPrice != null) {
    parts.push(`Cena z feedu: ${formatFeedPriceForPrompt(extra.feedPrice)}`);
  }
  if (cleaned.trim()) parts.push(cleaned.trim());
  return parts.join("\n\n").trim();
}

export function buildFeedContextPromptSection(feedContext: string): string {
  if (!feedContext.trim()) return "";
  return `
Informace o produktu (feed + strukturovaná fakta):
"""
${feedContext}
"""

Priorita při psaní:
1) Bloky «Fakta z adaptive landingu» a «Fakta z produktového obrázku» — spolehlivá fakta. Respektuj formu, aplikaci (topical/oral), text na obalu, dávkování a složení z těchto bloků.
2) Zbývající text feedu je jen orientační (může být UA/RU/EN). Nekopíruj bloky webmasterů, KPI, affiliate podmínek ani traffic textů.
`.trim();
}

export function parseJsonFromLlm<T>(raw: string): T {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence?.[1] ?? trimmed).trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    try {
      return JSON.parse(repairMultilineJsonStrings(candidate)) as T;
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const slice = candidate.slice(start, end + 1);
        try {
          return JSON.parse(slice) as T;
        } catch {
          return JSON.parse(repairMultilineJsonStrings(slice)) as T;
        }
      }
      throw new Error(`Failed to parse LLM JSON: ${candidate.slice(0, 200)}`);
    }
  }
}

/** Escape raw newlines inside JSON string literals (common LLM mistake). */
function repairMultilineJsonStrings(input: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
      result += "\\n";
      continue;
    }
    result += ch;
  }
  return result;
}

const STEP6_HTML_CLOSERS = ["</table>", "</ul>", "</p>", "</h3>", "</h2>"];

function trimTrailingNonHtml(html: string): string {
  const lower = html.toLowerCase();
  let lastEnd = -1;
  for (const tag of STEP6_HTML_CLOSERS) {
    const idx = lower.lastIndexOf(tag);
    if (idx >= 0) lastEnd = Math.max(lastEnd, idx + tag.length);
  }
  return lastEnd > 0 ? html.slice(0, lastEnd).trim() : html.trim();
}

/** Extract product HTML from step 6 LLM output (raw HTML, fenced, or legacy JSON). */
export function parseHtmlFromLlm(raw: string): string {
  let trimmed = raw.trim();
  const fence = trimmed.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) trimmed = fence[1].trim();

  if (trimmed.startsWith("{")) {
    try {
      const parsed = parseJsonFromLlm<{ html?: string }>(trimmed);
      if (parsed.html?.trim()) {
        return trimTrailingNonHtml(parsed.html.trim());
      }
    } catch {
      // fall through to HTML extraction
    }
  }

  const h2Idx = trimmed.search(/<h2[\s>]/i);
  const tagIdx = trimmed.indexOf("<");
  const start = h2Idx >= 0 ? h2Idx : tagIdx;
  if (start < 0) {
    throw new Error(`Failed to parse LLM HTML: ${trimmed.slice(0, 200)}`);
  }

  return trimTrailingNonHtml(trimmed.slice(start));
}

export type HtmlParseTrace = {
  after_fence_chars: number | null;
  slice_start_offset: number;
  before_trim_chars: number;
  after_trim_chars: number;
  trim_removed_chars: number;
  before_trim_h2_count: number;
  parsed_h2_count: number;
  html: string;
};

/** Same extraction as parseHtmlFromLlm, with per-stage sizes for diagnostics. */
export function traceParseHtmlFromLlm(raw: string): HtmlParseTrace {
  let trimmed = raw.trim();
  let afterFenceChars: number | null = null;
  const fence = trimmed.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    trimmed = fence[1].trim();
    afterFenceChars = trimmed.length;
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = parseJsonFromLlm<{ html?: string }>(trimmed);
      if (parsed.html?.trim()) {
        const inner = parsed.html.trim();
        const beforeTrim = inner.length;
        const html = trimTrailingNonHtml(inner);
        const beforeTrimH2 = (inner.match(/<h2[\s>]/gi) ?? []).length;
        return {
          after_fence_chars: afterFenceChars,
          slice_start_offset: 0,
          before_trim_chars: beforeTrim,
          after_trim_chars: html.length,
          trim_removed_chars: beforeTrim - html.length,
          before_trim_h2_count: beforeTrimH2,
          parsed_h2_count: (html.match(/<h2[\s>]/gi) ?? []).length,
          html,
        };
      }
    } catch {
      // fall through to HTML extraction
    }
  }

  const h2Idx = trimmed.search(/<h2[\s>]/i);
  const tagIdx = trimmed.indexOf("<");
  const start = h2Idx >= 0 ? h2Idx : tagIdx;
  if (start < 0) {
    throw new Error(`Failed to parse LLM HTML: ${trimmed.slice(0, 200)}`);
  }

  const sliced = trimmed.slice(start);
  const beforeTrim = sliced.length;
  const html = trimTrailingNonHtml(sliced);
  const beforeTrimH2 = (sliced.match(/<h2[\s>]/gi) ?? []).length;
  return {
    after_fence_chars: afterFenceChars,
    slice_start_offset: start,
    before_trim_chars: beforeTrim,
    after_trim_chars: html.length,
    trim_removed_chars: beforeTrim - html.length,
    before_trim_h2_count: beforeTrimH2,
    parsed_h2_count: (html.match(/<h2[\s>]/gi) ?? []).length,
    html,
  };
}

export const STEP6_HTML_MIN_CHARS = 1800;
export const STEP6_HTML_MIN_H2 = 9;
/** Max LLM calls when step 6 HTML fails validateStep6Html (short / too few h2). */
export const STEP6_HTML_MAX_ATTEMPTS = 5;

export function validateStep6Html(html: string): void {
  if (html.length < STEP6_HTML_MIN_CHARS) {
    throw new Error(`Step 6 HTML too short: ${html.length} chars (min ${STEP6_HTML_MIN_CHARS})`);
  }
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  if (h2Count < STEP6_HTML_MIN_H2) {
    throw new Error(`Step 6 HTML needs at least ${STEP6_HTML_MIN_H2} h2 tags, got ${h2Count}`);
  }
  if (/```/.test(html) || html.includes('{"html"')) {
    throw new Error("Step 6 HTML still contains JSON or markdown wrapper");
  }
}

const TOPICAL_FORM_KINDS = new Set([
  "cream", "gel", "balm", "ointment", "spray", "serum", "shampoo", "patch", "cosmetic", "eye_care",
]);

const ORAL_DESCRIPTOR_RE =
  /potenc|parazit|kapsl|tablet|kapk|diabet|prostata|hemoroid|hubnut|plís|houb/i;

export type PipelineFormHint = {
  formKind: string;
  formLabelCs: string;
  expectedDescriptorCs?: string | null;
};

export function buildFormHintBlock(hint: PipelineFormHint | null | undefined): string {
  if (!hint || hint.formKind === "unknown") return "";
  const topical = TOPICAL_FORM_KINDS.has(hint.formKind);
  const lines = [`Ve feedu potvrzená forma: ${hint.formLabelCs} (${hint.formKind}).`];
  if (topical) {
    lines.push(
      "Místně aplikovatelný produkt — na kůži. NE kapsle, NE tablety, NE potence, NE paraziti.",
    );
  } else if (hint.formKind === "drops") {
    lines.push("Orální kapky — pipeta nebo kapky do vody, ne kapsle.");
  } else if (hint.formKind === "capsules") {
    lines.push("Orální kapsle — s vodou, ne kapky.");
  }
  if (hint.expectedDescriptorCs?.trim()) {
    lines.push(`Doporučený popis: ${hint.expectedDescriptorCs.trim()}`);
  }
  return lines.join("\n");
}

const BRAND_FORM_LOCKS_CS: ReadonlyArray<{
  test: RegExp;
  formKind: "gel" | "spray" | "drops" | "capsules";
  descriptorCs?: string;
  descriptorValgusCs?: string;
}> = [
  { test: /\bremovio\b/i, formKind: "gel", descriptorCs: "gel proti bradavicím" },
  { test: /\bhondroine\b/i, formKind: "gel", descriptorCs: "kloubní gel" },
  {
    test: /\bhondro\s*sol\b/i,
    formKind: "spray",
    descriptorCs: "kloubní sprej",
    descriptorValgusCs: "sprej proti vbočeným palcům",
  },
  { test: /\bicexin\b/i, formKind: "gel", descriptorCs: "kloubní gel" },
  { test: /\bhondrofrost\b/i, formKind: "gel", descriptorCs: "kloubní gel" },
  { test: /\bredusizer\b/i, formKind: "drops", descriptorCs: "kapky na hubnutí" },
  { test: /\bshi\s*vital\b/i, formKind: "capsules" },
];

export function brandFormLockCs(
  rawTitle: string,
  brand?: string | null,
  categorySlug?: string | null,
): PipelineFormHint | null {
  const hay = `${brand ?? ""} ${rawTitle}`;
  for (const row of BRAND_FORM_LOCKS_CS) {
    if (!row.test.test(hay)) continue;
    const expectedDescriptorCs =
      categorySlug === "vboceny-palec" && row.descriptorValgusCs
        ? row.descriptorValgusCs
        : row.descriptorCs;
    return {
      formKind: row.formKind,
      formLabelCs: csFormLabel(row.formKind),
      expectedDescriptorCs: expectedDescriptorCs?.trim() || undefined,
    };
  }
  return null;
}

function csFormLabel(formKind: string): string {
  switch (formKind) {
    case "cream":
      return "Krém";
    case "gel":
      return "Gel";
    case "serum":
      return "Sérum";
    case "spray":
      return "Sprej";
    case "balm":
      return "Balzám";
    case "ointment":
      return "Mast";
    case "shampoo":
      return "Šampon";
    case "drops":
      return "Kapky";
    case "capsules":
      return "Kapsle";
    case "tablets":
      return "Tablety";
    case "tea":
      return "Čaj";
    default:
      return "Produkt";
  }
}

/** Map Czech form / application strings from landing or vision facts → pipeline formKind. */
export function formKindFromStructuredFact(opts: {
  form?: string | null;
  application?: string | null;
  releaseForm?: string | null;
}): string | null {
  const hay = `${opts.form ?? ""} ${opts.releaseForm ?? ""}`.toLowerCase();
  if (/gel/.test(hay)) return "gel";
  if (/krém|krem|cream/.test(hay)) return "cream";
  if (/mast|ointment/.test(hay)) return "ointment";
  if (/balzám|balzam|balm/.test(hay)) return "balm";
  if (/sérum|serum/.test(hay)) return "serum";
  if (/sprej|spray/.test(hay)) return "spray";
  if (/šampon|sampon|shampoo/.test(hay)) return "shampoo";
  if (/kapky|kapek|drops/.test(hay)) return "drops";
  if (/kapsl/.test(hay)) return "capsules";
  if (/tablet/.test(hay)) return "tablets";
  if (/čaj|caj|tea/.test(hay)) return "tea";
  if (opts.application === "topical") return "gel";
  if (opts.application === "oral") return "capsules";
  return null;
}

export function formHintFromStructuredFacts(opts: {
  form?: string | null;
  application?: string | null;
  releaseForm?: string | null;
}): PipelineFormHint | null {
  const formKind = formKindFromStructuredFact(opts);
  if (!formKind) return null;
  const label =
    opts.releaseForm?.trim() ||
    opts.form?.trim() ||
    csFormLabel(formKind);
  return {
    formKind,
    formLabelCs: label,
  };
}

/**
 * Prefer brand lock, then structured landing/vision form, then heuristic formHint.
 */
export function preferStructuredFormHint(
  current: PipelineFormHint | null,
  structured: PipelineFormHint | null,
  brandLocked: boolean,
): PipelineFormHint | null {
  if (brandLocked && current) return current;
  if (structured) return structured;
  return current;
}

function formKindFromInferredRole(role: string): string | null {
  const lc = role.toLowerCase();
  if (/\bkapky\b/.test(lc)) return "drops";
  if (/\bkapsl/.test(lc)) return "capsules";
  if (/\btablet/.test(lc)) return "tablets";
  if (/\bsprej\b/.test(lc)) return "spray";
  if (/\bgel\b/.test(lc)) return "gel";
  if (/\bčaj\b/.test(lc)) return "tea";
  return null;
}

export function buildPipelineFormHint(input: {
  formKind: string | null | undefined;
  categorySlug?: string | null;
  rawTitle?: string | null;
  feedSnippet?: string | null;
  brand?: string | null;
}): PipelineFormHint | null {
  let formKind =
    input.formKind && input.formKind !== "unknown" ? input.formKind : null;

  const hasFeedContext = Boolean(
    input.rawTitle?.trim() || input.feedSnippet?.trim() || input.brand?.trim(),
  );
  const inferredRole = hasFeedContext
    ? inferProductRoleCs(
        input.rawTitle ?? "",
        input.brand ?? undefined,
        input.feedSnippet ?? undefined,
      )
    : null;

  if (!formKind && inferredRole) {
    formKind = formKindFromInferredRole(inferredRole);
  }

  if (!formKind || formKind === "unknown") return null;

  let expectedDescriptorCs: string | null = null;
  if (input.categorySlug === "anti-aging") {
    if (formKind === "cream") expectedDescriptorCs = "anti-aging krém";
    else if (formKind === "serum") expectedDescriptorCs = "anti-aging sérum";
    else if (TOPICAL_FORM_KINDS.has(formKind)) {
      expectedDescriptorCs = "anti-aging produkt";
    }
  } else if (formKind === "drops") {
    if (inferredRole?.includes("kapky")) {
      expectedDescriptorCs = inferredRole;
    } else if (input.categorySlug === "hubnuti") {
      expectedDescriptorCs = "kapky na hubnutí";
    }
  } else if (
    (formKind === "capsules" || formKind === "tablets") &&
    inferredRole &&
    /\bkapsl|\btablet/i.test(inferredRole)
  ) {
    expectedDescriptorCs = inferredRole;
  } else if (formKind === "spray" && inferredRole?.includes("sprej")) {
    expectedDescriptorCs = inferredRole;
  } else if (formKind === "gel" && inferredRole?.includes("gel na zvětšení penisu")) {
    expectedDescriptorCs = "gel na zvětšení penisu";
  }

  return {
    formKind,
    formLabelCs: csFormLabel(formKind),
    expectedDescriptorCs,
  };
}

export function reconcileDisplayTitleWithForm(
  displayTitle: string,
  formKind: string | null | undefined,
  expectedDescriptorCs: string | null | undefined,
): string {
  if (!formKind || !TOPICAL_FORM_KINDS.has(formKind) || !expectedDescriptorCs?.trim()) {
    return displayTitle;
  }
  if (!ORAL_DESCRIPTOR_RE.test(displayTitle)) return displayTitle;
  const dash = displayTitle.match(/^(.+?)\s*[–—-]\s+/);
  const brand = dash?.[1]?.trim() || displayTitle.split(/\s+/)[0]?.trim();
  if (!brand) return displayTitle;
  return `${brand} – ${expectedDescriptorCs.trim()}`;
}

export function buildStep1Prompt(
  rawTitle: string,
  rawDescription: string,
  formHint?: PipelineFormHint | null,
): string {
  const formBlock = buildFormHintBlock(formHint);
  return `Vyčisti název produktu z feedu. Odstraň geo markery, affiliate ceny, HOLD/FREE/TOP a další artefakty: ${GEO_MARKERS}.

Vrať JEDEN řádek pro H1: značka (brand, bez překladu) + krátký popis produktu.
Chybí-li nebo je popis slabý, přepiš podle jazyka feedu (RU/UA/EN).
Formát: «Brand – popis» (jedna pomlčka, značku neopakuj v popisu).
${formBlock ? `\n${formBlock}\n` : ""}
Příklady:
${STEP1_EXAMPLES}

Data z feedu:
Název: ${rawTitle}
Popis: ${rawDescription.slice(0, 1500)}

Pouze JSON odpověď:
{"headline":"..."}`;
}

export function buildStep2Prompt(
  headline: string,
  formHint?: PipelineFormHint | null,
  opts?: { qaHint?: string | null },
): string {
  const formBlock = buildFormHintBlock(formHint);
  const qaBlock = opts?.qaHint?.trim()
    ? `\nPředchozí QA chyba (${opts.qaHint}): vrať platný český popis produktu ve formátu «Brand – popis»; vyhni se cizím/anglickým slovům v popisu.\n`
    : "";
  return `Přelož řádek H1 do češtiny (cs-CZ). Značku ponech beze změny (latinka, bez překladu).

Vrať CELÝ řádek pro zobrazení H1. Značka musí být v řádku jen JEDNOU.
${formBlock ? `\n${formBlock}\n` : ""}${qaBlock}
Vstup:
${headline}

Pouze JSON odpověď:
{"display_title_cs":"..."}`;
}

export function buildStep3Prompt(
  productTitle: string,
  feedSnippet: string,
): string {
  return `Vyber JEDNU kategorii ze seznamu — nejpřesnější pro tento produkt. Vrať jen slug (latinka, s pomlčkami).

Název/H1 produktu je hlavní zdroj; obecná kategorie z feedu («Здоровье», «Health», «Beauty») je jen sekundární kontext — nepoužívej ji, pokud odporuje popisu.

Produkt: ${productTitle}
${feedSnippet ? `Kontext z feedu:\n${feedSnippet.slice(0, 600)}` : ""}

Seznam kategorií:
${buildCategoryPromptList()}

Pouze JSON odpověď:
{"category":"vybrany-slug"}`;
}

export function buildStep4Prompt(
  productTitle: string,
  feedPrice: FeedPrice | null,
): string {
  const priceLine = buildPricePromptLine(feedPrice);
  const priceExample = feedPrice && feedPrice.amount > 0 ? formatFeedPriceForPrompt(feedPrice) : "cena";
  return `Napiš meta tag TITLE česky (cs-CZ). Maximum 65 znaků. Použij pokud možno: recenze, cena, nákup, složení, návod k použití.

Produkt: ${productTitle}
${priceLine}

Pokud je ve feedu konkrétní cena, uveď ji přesně (např. «${priceExample}»). Nevymýšlej čísla.
Zapracuj klíčová slova přirozeně, bez násilí.
Můžeš použít 1 relevantní emoji k produktu (na začátku nebo konci); emoji se počítá do 65 znaků.

Pouze JSON odpověď:
{"title":"..."}`;
}

export function buildStep5Prompt(
  productTitle: string,
  feedPrice: FeedPrice | null,
): string {
  const priceLine = buildPricePromptLine(feedPrice);
  return `Napiš meta tag Description česky (cs-CZ). Maximum 155 znaků. Použij pokud možno: recenze, cena, nákup, složení, návod k použití.

Produkt: ${productTitle}
${priceLine}

Pokud je ve feedu konkrétní cena, zmíň ji. Nevymýšlej čísla, pokud cena není k dispozici.
Zapracuj klíčová slova přirozeně.

Pouze JSON odpověď:
{"meta_desc":"..."}`;
}

/** Mid + commerce H2 blocks (4–10) before disclaimer — niche-adapted; brand-only in named H2s. */
function buildStep6MidAndCommerceBlocks(
  productTitle: string,
  niche: NicheType,
  deliveryH2: string,
  isEyewear: boolean,
): { midBlocks: string; commerceBlocks: string } {
  const isSupplement = niche === "supplement";
  const isDevice = niche === "device";
  const isYmylLane = isSupplement || isDevice;
  const brandForH2 =
    splitBrandAndTail(productTitle).brand.trim() || productTitle.trim();

  const block4 = isYmylLane
    ? `4. blok: Očekávané výsledky užívání
(h2 — čistý text; musí obsahovat «Očekávané výsledky» nebo «výsledky». Realistický časový rámec; výsledky se mohou lišit.)`
    : `4. blok: Co očekávat při používání
(h2 — čistý text; musí obsahovat «očekávat» nebo «používání». Praktický efekt produktu — ne «léčba».)`;

  const block5 = `5. blok: Návod k použití
(h2 — čistý text; musí obsahovat «Návod k použití» nebo «Použití». Jasný seznam ul/li s dávkováním/aplikací${isEyewear ? " — nasazení a nastavení dioptrií, ne polykání kapslí" : ""}.)`;

  const block6 = isSupplement
    ? `6. blok: Kontraindikace a opatření
(h2 — čistý text; musí obsahovat «Kontraindikace» nebo «opatření». Kdy produkt neužívat; konzultace s odborníkem.)`
    : isDevice
      ? `6. blok: Bezpečnost a opatření
(h2 — čistý text; musí obsahovat «Bezpečnost» nebo «opatření». Bezpečné používání zařízení.)`
      : `6. blok: Na co si dát pozor
(h2 — čistý text; musí obsahovat «pozor» nebo «opatření». Bezpečné používání — ne medical kontraindikace.)`;

  const block7 = isYmylLane
    ? `7. blok: ${brandForH2} — je to podvod a je nebezpečný?
(h2 — čistý text; musí obsahovat «podvod» nebo «nebezpečn». Originalita, rizika, bez paniky. V h2 použij jen značku, ne celý H1 s deskriptorem.)`
    : `7. blok: ${brandForH2} — jak poznat originál?
(h2 — čistý text; musí obsahovat «originál» nebo «podvod». Falzifikáty / kvalita — bez zdravotnické rétoriky. V h2 použij jen značku, ne celý H1 s deskriptorem.)`;

  const block8 = `8. blok: Cena ${brandForH2}
(h2 — čistý text; musí obsahovat «Cena» a značku. Orientační cena z feedu, pokud je k dispozici; dobírka / online platba. Negarantuj «nejnižší cenu». V h2 použij jen značku, ne celý H1 s deskriptorem.)`;

  const block9 = isSupplement
    ? `9. blok: Kde ho lze koupit v lékárnách, na oficiálních stránkách nebo na Amazonu
(h2 — čistý text; bez značky v nadpisu. V textu: jsme oficiální distributor v ČR; produkt NENÍ dostupný v lékárnách; nákup přes oficiální objednávku na webu / kurýr. Neuváděj falešné adresy lékáren ani Amazon jako jediný sklad, pokud to feed neříká.)`
    : `9. blok: Kde ho lze koupit
(h2 — čistý text; bez značky. V textu: jsme oficiální distributor / oficiální e-shop v ČR; nákup online, ne v lékárnách.)`;

  const block10 = `10. blok: ${deliveryH2}
(h2 — čistý text; použij přesně tento text nebo velmi blízkou variantu se slovy «doručení», «dobírka», «objednat». Uveď alespoň 4 města: Praha, Brno, Ostrava, Plzeň, Liberec. Logistika a platba; detailní cenu rozveď v bloku 8.)`;

  return {
    midBlocks: `${block4}

${block5}

${block6}

${block7}`,
    commerceBlocks: `${block8}

${block9}

${block10}`,
  };
}

export function buildStep6Prompt(
  productTitle: string,
  feedContext: string,
  feedPrice: FeedPrice | null,
  feedCategory?: string | null,
  categorySlug?: string | null,
  formHint?: PipelineFormHint | null,
  formGuideBlock?: string | null,
): string {
  const feedBlock = buildFeedContextPromptSection(feedContext);
  const priceLine = buildPricePromptLine(feedPrice);
  const formBlock = buildFormHintBlock(formHint);
  const guideBlock = formGuideBlock?.trim() ? `${formGuideBlock.trim()}\n\n` : "";
  const categoryLine = feedCategory?.trim()
    ? `Kategorie z feedu: ${feedCategory.trim()}`
    : "";
  const niche = getNicheType(categorySlug ?? "other");
  const deliveryH2 = deliveryH2For(categorySlug ?? "other", productTitle.length);
  const eyewearHay = `${productTitle}\n${feedContext}\n${categorySlug ?? ""}`.toLowerCase();
  const isEyewear =
    categorySlug === "modni-doplnky" ||
    /brýle|bryle|dioptr|очки|glasses|eyewear|nastavitel/.test(eyewearHay);

  const block3 = isEyewear
    ? `3. blok: Konstrukce a vlastnosti
(h2 — čistý text; musí obsahovat «Konstrukce» nebo «Vlastnosti». Popiš mechaniku (kolečko/dioptrie), rozsah nastavení, praktické výhody. NEVYMÝŠLEJ lutein, byliny ani «složení» jako u doplňku stravy — jde o brýle/příslušenství.)`
    : `3. blok: Složení a vlastnosti
(h2 — čistý text; musí obsahovat slovo «Složení» nebo «složek». Seznam ul/li s výhodami složek.)`;

  const block2 = isEyewear
    ? `2. blok: Pro koho a kdy se hodí
(h2 — čistý text. Pro koho jsou brýle vhodné a v jakých situacích. Seznam ul/li nebo krátké odstavce. Neříkej «indikace» jako u léku.)`
    : `2. blok: Indikace k použití
(h2 — čistý text. Pro koho je vhodný a v jakých situacích se používá. Seznam ul/li nebo krátké odstavce.)`;

  const ymyl = isEyewear
    ? `YMYL: Jde o optické příslušenství, ne o doplněk stravy. Nepiš o luteinu/zeaxanthinu, kapslích ani «léčbě zraku». Bez falešných klinických studií.`
    : `YMYL: Bez vymyšlených klinických studií a falešných lékařů. Piš o známých vlastnostech složek, bez přehánění.`;

  const { midBlocks, commerceBlocks } = buildStep6MidAndCommerceBlocks(
    productTitle,
    niche,
    deliveryH2,
    isEyewear,
  );

  return `Napiš HTML obsah produktové stránky česky (cs-CZ) pro zákazníky v České republice.

Produkt (H1): ${productTitle}
${categoryLine ? `${categoryLine}\n` : ""}${priceLine}

${feedBlock ? `${feedBlock}\n` : ""}${formBlock ? `${formBlock}\n\n` : ""}${guideBlock}V blocích 1 a 2 musí cíl a indikace odpovídat popisu${categoryLine ? " a kategorii z feedu" : ""}; nenahrazuj je obecnými formulacemi o «pohodě», pokud popis říká něco jiného.
${categoryLine ? "Použij kategorii z feedu jako další vodítko pro fokus textu.\n\n" : "\n"}
SEO (rozprostři přirozeně, bez násilí):
Hlavní klíčová slova (1–2×): [vyber česky]
LSI (každé jednou): recenze, cena, nákup, doručení, Česko, 2026 atd.

${ymyl}

Formát: čisté HTML — pouze h2, h3, ul, li, p, table. Bez externího CSS.
Nadpisy h2/h3: čistý text, měkký a jasný tón — bez emoji a bez ikon v HTML.

Struktura (generuj přesně tyto bloky — dodrž pořadí a klíčová slova v h2):

1. blok: Co je produkt a k čemu slouží
(h2 — čistý text. 2–3 krátké odstavce: pro koho je produkt a jaké problémy cílí.)

${block2}

${block3}

${midBlocks}

${commerceBlocks}

11. blok: Důležité upozornění
(Krátké upozornění: výsledky se mohou lišit; informace jsou orientační, nenahrazují radu odborníka${isEyewear ? "; při vážných zrakových potížích navštivte očního lékaře" : ""}.)

NEPŘIDÁVEJ FAQ do HTML.

Pouze čistá HTML odpověď. První znak musí být «<» (začni <h2>).
Bez JSON a markdown, bez textu před nebo za HTML.`;
}

export function buildStep6bPrompt(productTitle: string, feedContext: string): string {
  const feedBlock = buildFeedContextPromptSection(feedContext);
  const expert = CS.medicalExpert;
  return `Napiš osobní lékařský názor česky (cs-CZ) — v první osobě, mužský rod, 1–2 krátké odstavce.

Autor: ${expert.name}, praktický lékař. Text jsou jeho slova — jako by je napsal on. Ne ženský lékař, ne ženský rod. Tvé jméno je na webu, nepiš ho do textu.

Produkt: ${productTitle}
${feedBlock ? `\n${feedBlock}\n` : ""}
Už jsi prostudoval data o produktu. Promysli si charakter produktu, složení a cílovou skupinu — napiš jedinečnou odbornou závěrečnou myšlenku, která podpoří rozhodnutí zákazníka. Nekopíruj šablony; u každého produktu jiný důraz.

Pouze prostý text, odstavce oddělené prázdným řádkem.

Pouze JSON odpověď:
{"expert_opinion":"..."}`;
}

export function buildStep7Prompt(
  productTitle: string,
  feedContextShort: string,
  formHint?: PipelineFormHint | null,
  formGuideBlock?: string | null,
): string {
  const feedBlock = feedContextShort.trim()
    ? `\nReference (strukturovaná fakta mají prioritu; nezmiň webmastera ani affiliate partnera):\n"""\n${feedContextShort}\n"""`
    : "";
  const formBlock = buildFormHintBlock(formHint);
  const guideBlock = formGuideBlock?.trim() ? `\n${formGuideBlock.trim()}\n` : "";
  return `Vygeneruj 5 častých dotazů česky (cs-CZ) pro produktovou stránku.

Produkt: ${productTitle}${feedBlock}
${formBlock ? `\n${formBlock}\n` : ""}${guideBlock}

Směr: promysli si, jaké otázky by měl skutečný zákazník — použití, účinek, doručení, platba, originalita. Vyber 5 nejrelevantnějších; nepoužívej u každého produktu stejný fixní seznam.

Použij data z feedu, pokud pomohou; nezmiň webmastera ani affiliate podmínky.
Odpovídej přímo, jako ochotný prodavač.

Pouze JSON odpověď:
{"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}`;
}

export const PIPELINE_SYSTEM =
  "Jsi asistent pro generování obsahu českého online obchodu. Pouze platná JSON odpověď, bez markdown a komentářů.";

export const PIPELINE_STEP6_SYSTEM =
  "Jsi copywriter českého online obchodu. Pouze platná HTML odpověď (h2, p, ul, li). Bez JSON, markdown a komentářů.";
