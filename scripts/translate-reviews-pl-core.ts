/**
 * Core: LLM batch translate review *.pl.ts → native *.pl.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { CATEGORY_PL_BODIES } from "../src/data/review-templates-cat.pl";
import { REVIEW_SLOTS_BY_THEME } from "../src/data/review-templates-theme.pl";
import { NICHE_TEMPLATES_PL } from "../src/data/review-templates-niche.pl";
import type { ReviewSlot } from "../src/data/review-templates";
import { buildReviewVoiceGuidePL } from "../src/lib/review-voice.pl";
import { getCategoryDescriptorPL } from "../src/lib/category-descriptors.pl";
import { REVIEW_THEME_FEW_SHOTS } from "../src/lib/review-themes.pl";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-reviews-pl");

const SLUG_THEME_REEXPORTS: Record<string, string> = {
  sluch: "sluch",
  "stres": "stress-nerves",
  "chrapani": "sleep",
  "vypadavani-vlasu": "hair",
  paraziti: "paraziti",
  papilomy: "papilomy",
  alkoholismus: "addiction",
  "vboceny-palec": "foot",
};

const SLUG_INLINE = [
  "cystitida",
  "intimate-comfort",
  "anti-aging",
  "lupenka",
  "traveni",
  "jatra",
  "detox",
  "zvetseni-prsou",
  "zdravi-zen",
];

const THEME_LABELS: Record<string, string> = {
  sluch: "audición y acúfenos",
  "stress-nerves": "estrés y nervios",
  sleep: "sueño y ronquidos",
  traveni: "digestión e intestino",
  urinary: "salud urinaria",
  skin: "piel y anti-edad",
  hair: "cuidado del cabello",
  paraziti: "parásitos intestinales",
  papilomy: "papilomas",
  womens: "salud femenina",
  addiction: "adicción al alcohol",
  foot: "pie y juanetes",
};

const FEMININE_MARKERS = [
  /\bsegura\b/i,
  /\bcontenta\b/i,
  /\bsatisfecha\b/i,
  /\btomada\b/i,
  /\bsentada\b/i,
  /\bretirada\b/i,
  /\bvuelta\b/i,
  /\bquedada\b/i,
];

const MASCULINE_MARKERS = [
  /\bseguro\b/i,
  /\bcontento\b/i,
  /\bsatisfecho\b/i,
  /\btomado\b/i,
  /\bsentado\b/i,
  /\bretirado\b/i,
  /\bvuelto\b/i,
  /\bquedado\b/i,
];

const ES_MARKERS = /\b(España|español|mensajería|¿|¡| en España|Pedido|envío|contento|contenta|seguro|segura|contrassegno|corriere|integratore)\b/i;

const BROKEN_TOKENS = /\b(espaldesde|desdeesde|Tomadesde|secondesde|Pagamento|Non |Niente |Primi |Mio |Lei |Istruzioni chiare)\b/i;

const CYRILLIC = /[\u0400-\u04FF]/;

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1].trim()] = v;
  }
}

function parseArgs() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg
    ? onlyArg
        .slice(7)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  return {
    only,
    dryRun: process.argv.includes("--dry-run"),
    force: process.argv.includes("--force"),
  };
}

function escapeTs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

function slotText(slot: ReviewSlot): string {
  return (slot.text_es ?? slot.text_es ?? "").trim();
}

function genderWarnings(gender: "m" | "f", text: string): string[] {
  const w: string[] = [];
  const markers = gender === "m" ? FEMININE_MARKERS : MASCULINE_MARKERS;
  const label = gender === "m" ? "feminine" : "masculine";
  for (const re of markers) {
    if (re.test(text)) w.push(`${label} marker ${re}`);
  }
  return w;
}

function validateReviewSl(g: "m" | "f", text: string): string[] {
  const errs: string[] = [];
  if (!text || text.length < 25) errs.push("too short");
  if (text.length > 280) errs.push("too long");
  if (CYRILLIC.test(text)) errs.push("cyrillic");
  if (ES_MARKERS.test(text)) errs.push("spanish marker");
  if (BROKEN_TOKENS.test(text)) errs.push("broken token");
  errs.push(...genderWarnings(g, text));
  return errs;
}

function contextFor(kind: string, key: string): string {
  if (kind === "cat" || kind === "slug") {
    const d = getCategoryDescriptorPL(key);
    if (d) return `Categoría: ${key}. ${d.short}. Tema: ${d.problem}`;
  }
  if (kind === "theme") {
    const label = THEME_LABELS[key] ?? key;
    const shot = REVIEW_THEME_FEW_SHOTS.find((s) => s.theme === key);
    return `Tema reseñas: ${label}.${shot ? ` Ejemplo bueno: «${shot.good}». NO: «${shot.bad}».` : ""}`;
  }
  if (kind === "niche") {
    return `Nicho producto (reseñas genéricas de pedido/entrega): ${key}`;
  }
  return key;
}

function parseJsonLoose(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const trimmed = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error(`invalid JSON: ${raw.slice(0, 300)}`);
    }
  }
}

async function callLLM(
  system: string,
  user: string,
  apiKey: string,
  url: string,
  model: string,
): Promise<{ reviews: Array<{ i: number; g: "m" | "f"; sl: string }> }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://recenze-ceny.cz",
          "X-Title": "recenze-ceny-pl-translate",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          max_tokens: 16384,
          temperature: 0.4,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LLM ${res.status}: ${body.slice(0, 400)}`);
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error("empty LLM response");
      const parsed = parseJsonLoose(content) as {
        reviews?: Array<{ i: number; g: "m" | "f"; pl?: string; sl?: string; es?: string }>;
      };
      if (!parsed.reviews?.length) throw new Error("missing reviews array");
      const reviews = parsed.reviews.map((r) => ({
        i: r.i,
        g: r.g,
        sl: (r.pl ?? r.sl ?? r.es ?? "").trim(),
      }));
      if (reviews.some((r) => !r.sl)) throw new Error("empty review text in LLM response");
      return { reviews };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function translateBatch(
  kind: string,
  key: string,
  items: Array<{ i: number; g: "m" | "f"; es: string }>,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
  priorErrors?: string[],
): Promise<Array<{ i: number; g: "m" | "f"; sl: string }>> {
  const cacheFile = path.join(CACHE_DIR, `${kind}-${key}.json`);
  if (!force && fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as {
      reviews: Array<{ i: number; g: "m" | "f"; sl: string }>;
    };
    if (cached.reviews?.length === items.length) return cached.reviews;
  }

  const voiceGuide = buildReviewVoiceGuidePL();
  const ctx = contextFor(kind, key);
  const system = `Jesteś autorem autentycznych opinii klientów dla sklepu w Polsce (płatność przy odbiorze, dostawa).
Przetłumacz każdą słoweńską opinię na naturalny polski (cs-CZ).
ZASADY: tylko polski; bez cyrylicy; bez słoweńskich słów; zachowaj ton (osobiste doświadczenie, ręce, dostawa).
Używaj «Polska», «płatność przy odbiorze», «dostawa» gdzie oryginał wspomina płatność/dostawę.
Długość 40–220 znaków — NIGDY pusty tekst.`;

  const userParts = [
    voiceGuide,
    "",
    ctx,
    "",
    "Input (JSON):",
    JSON.stringify(items),
    "",
    priorErrors?.length
      ? `CORRIGE estos errores del intento anterior:\n${priorErrors.join("\n")}`
      : "",
    "",
    "Zwróć JSON: { \"reviews\": [{ \"i\": number, \"g\": \"m\"|\"f\", \"pl\": string }, ...] }",
    "Ta sama kolejność, to samo g, to samo i. Tylko naturalny polski.",
  ];

  const parsed = await callLLM(system, userParts.filter(Boolean).join("\n"), apiKey, url, model);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(parsed, null, 2), "utf8");
  return parsed.reviews;
}

async function translateWithRetry(
  kind: string,
  key: string,
  items: Array<{ i: number; g: "m" | "f"; es: string }>,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<Array<{ i: number; g: "m" | "f"; sl: string }>> {
  const fullCache = path.join(CACHE_DIR, `${kind}-${key}.json`);
  if (!force && fs.existsSync(fullCache)) {
    const cached = JSON.parse(fs.readFileSync(fullCache, "utf8")) as {
      reviews: Array<{ i: number; g: "m" | "f"; sl: string }>;
    };
    if (cached.reviews?.length === items.length) return cached.reviews;
  }

  const CHUNK = 1;
  if (items.length <= CHUNK) {
    return translateWithRetryChunk(kind, key, items, apiKey, url, model, force);
  }
  const merged: Array<{ i: number; g: "m" | "f"; sl: string }> = [];
  for (let start = 0; start < items.length; start += CHUNK) {
    const chunk = items.slice(start, start + CHUNK);
    const subKey = `${key}-${Math.floor(start / CHUNK)}`;
    const part = await translateWithRetryChunk(kind, subKey, chunk, apiKey, url, model, force);
    merged.push(...part);
  }
  const sorted = merged.sort((a, b) => a.i - b.i);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CACHE_DIR, `${kind}-${key}.json`),
    JSON.stringify({ reviews: sorted }, null, 2),
    "utf8",
  );
  return sorted;
}

async function translateWithRetryChunk(
  kind: string,
  key: string,
  items: Array<{ i: number; g: "m" | "f"; es: string }>,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<Array<{ i: number; g: "m" | "f"; sl: string }>> {
  let errors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const reviews = await translateBatch(
      kind,
      key,
      items,
      apiKey,
      url,
      model,
      attempt > 0 ? true : force,
      errors.length ? errors : undefined,
    );
    errors = [];
    for (const item of items) {
      const r = reviews.find((x) => x.i === item.i);
      if (!r) errors.push(`missing index ${item.i}`);
      else if (r.g !== item.g) errors.push(`index ${item.i}: g mismatch ${r.g} vs ${item.g}`);
      else errors.push(...validateReviewSl(r.g, r.sl).map((e) => `index ${item.i}: ${e}`));
    }
    if (!errors.length) return reviews;
    console.warn(`  retry ${attempt + 1} for ${kind}:${key} — ${errors.slice(0, 3).join("; ")}`);
  }
  throw new Error(`validation failed for ${kind}:${key}: ${errors.join("; ")}`);
}

function shouldRun(key: string, only: string[] | null): boolean {
  if (!only?.length) return true;
  return only.includes(key);
}

type SlotRow = {
  rating: 4 | 5;
  daysAgo: number;
  gender: "m" | "f";
  noPhoto: boolean;
  text: string;
};

function slotsFromReviewSlots(slots: ReviewSlot[]): SlotRow[] {
  return slots.map((s) => ({
    rating: s.rating,
    daysAgo: s.daysAgo,
    gender: s.gender,
    noPhoto: s.noPhoto ?? false,
    text: slotText(s),
  }));
}

function formatSlotCall(s: SlotRow): string {
  const noPhoto = s.noPhoto ? ", true" : "";
  return `slot(${s.rating}, ${s.daysAgo}, "${s.gender}", "${escapeTs(s.text)}"${noPhoto})`;
}

function writeCatSl(bodies: Record<string, Array<{ g: "m" | "f"; text: string }>>) {
  const lines = [
    "/**",
    " * Polish review bodies keyed by category slug (parallel to CATEGORY_TEMPLATES slot order).",
    " * Generated by scripts/translate-reviews-pl.mjs (LLM from ES).",
    " */",
    "",
    "export type PlReviewBody = { g: \"m\" | \"f\"; text: string };",
    "",
    "export function sl(g: \"m\" | \"f\", text: string): PlReviewBody {",
    "  return { g, text };",
    "}",
    "",
    "export const CATEGORY_PL_BODIES: Record<string, PlReviewBody[]> = {",
  ];
  for (const [slug, arr] of Object.entries(bodies)) {
    const key = slug === "_default" ? "_default" : `"${slug}"`;
    lines.push(`  ${key}: [`);
    for (const b of arr) {
      lines.push(`    sl("${b.g}", "${escapeTs(b.text)}"),`);
    }
    lines.push("  ],");
  }
  lines.push("};", "");
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-cat.pl.ts"), lines.join("\n"), "utf8");
}

function writeThemeSl(themes: Record<string, SlotRow[]>) {
  const lines = [
    "/** Polish review slots by health/theme. Generated by translate-reviews-pl.mjs */",
    "",
    "import type { ReviewSlot } from \"./review-templates\";",
    "import type { ReviewTheme } from \"@/lib/review-themes.pl\";",
    "",
    "function slot(",
    "  rating: 4 | 5,",
    "  daysAgo: number,",
    "  gender: \"m\" | \"f\",",
    "  text_es: string,",
    "  noPhoto = false,",
    "): ReviewSlot {",
    "  return { rating, daysAgo, noPhoto, gender, text_uk: \"\", text_ru: \"\", text_es };",
    "}",
    "",
    "export const REVIEW_SLOTS_BY_THEME: Record<ReviewTheme, ReviewSlot[]> = {",
  ];
  for (const [theme, slots] of Object.entries(themes)) {
    const key = theme.includes("-") ? `"${theme}"` : theme;
    lines.push(`  ${key}: [`);
    for (const s of slots) {
      lines.push(`    ${formatSlotCall(s)},`);
    }
    lines.push("  ],");
  }
  lines.push("};", "");
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-theme.pl.ts"), lines.join("\n"), "utf8");
}

function writeNicheSl(niches: Record<string, SlotRow[]>) {
  const lines = [
    "/** Polish review slot texts by niche. Generated by translate-reviews-pl.mjs */",
    "",
    "import type { ReviewSlot } from \"./review-templates\";",
    "",
    "function slot(",
    "  rating: 4 | 5,",
    "  daysAgo: number,",
    "  gender: \"m\" | \"f\",",
    "  text_es: string,",
    "  noPhoto = false,",
    "): ReviewSlot {",
    "  return { rating, daysAgo, noPhoto, gender, text_uk: \"\", text_ru: \"\", text_es };",
    "}",
    "",
    "export const NICHE_TEMPLATES_PL: Record<string, ReviewSlot[]> = {",
  ];
  for (const [niche, slots] of Object.entries(niches)) {
    lines.push(`  ${niche}: [`);
    for (const s of slots) {
      lines.push(`    ${formatSlotCall(s)},`);
    }
    lines.push("  ],");
  }
  lines.push("};", "");
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-niche.pl.ts"), lines.join("\n"), "utf8");
}

function themeRef(theme: string): string {
  return theme.includes("-")
    ? `REVIEW_SLOTS_BY_THEME["${theme}"]`
    : `REVIEW_SLOTS_BY_THEME.${theme}`;
}

function writeSlugSl(inline: Record<string, SlotRow[]>) {
  const lines = [
    "/** Polish review slots keyed by category slug. Generated by translate-reviews-pl.mjs */",
    "",
    "import type { ReviewSlot } from \"./review-templates\";",
    "import { REVIEW_SLOTS_BY_THEME } from \"./review-templates-theme.pl\";",
    "",
    "function slot(",
    "  rating: 4 | 5,",
    "  daysAgo: number,",
    "  gender: \"m\" | \"f\",",
    "  text_es: string,",
    "  noPhoto = false,",
    "): ReviewSlot {",
    "  return { rating, daysAgo, noPhoto, gender, text_uk: \"\", text_ru: \"\", text_es };",
    "}",
    "",
    "export const REVIEW_SLOTS_BY_SLUG: Record<string, ReviewSlot[]> = {",
  ];
  for (const [slug, theme] of Object.entries(SLUG_THEME_REEXPORTS)) {
    const slugKey = slug.includes("-") ? `"${slug}"` : slug;
    lines.push(`  ${slugKey}: ${themeRef(theme)},`);
  }
  for (const slug of SLUG_INLINE) {
    lines.push(`  ${slug.includes("-") ? `"${slug}"` : slug}: [`);
    for (const s of inline[slug] ?? []) {
      lines.push(`    ${formatSlotCall(s)},`);
    }
    lines.push("  ],");
  }
  lines.push("};", "");
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-slug.pl.ts"), lines.join("\n"), "utf8");
}

async function main() {
  loadEnv();
  const { only, dryRun, force } = parseArgs();
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }
  const url = process.env.AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";

  if (dryRun) {
    const catCount = Object.keys(CATEGORY_PL_BODIES).length;
    const themeCount = Object.keys(REVIEW_SLOTS_BY_THEME).length;
    const nicheCount = Object.keys(NICHE_TEMPLATES_PL).length;
    console.log("dry-run — batches:", { catCount, themeCount, nicheCount, only: only?.join(",") ?? "all" });
    return;
  }

  const catOut: Record<string, Array<{ g: "m" | "f"; text: string }>> = {};
  const themeOut: Record<string, SlotRow[]> = {};
  const nicheOut: Record<string, SlotRow[]> = {};
  const slugInlineOut: Record<string, SlotRow[]> = {};

  // Categories
  for (const [slug, bodies] of Object.entries(CATEGORY_PL_BODIES)) {
    if (!shouldRun(slug, only)) continue;
    console.log(`translate cat:${slug} (${bodies.length})`);
    const items = bodies.map((b, i) => ({ i, g: b.g, es: b.text }));
    const translated = await translateWithRetry("cat", slug, items, apiKey, url, model, force);
    catOut[slug] = translated.map((r) => ({ g: r.g, text: r.sl.trim() }));
  }

  // Themes
  for (const [theme, slots] of Object.entries(REVIEW_SLOTS_BY_THEME)) {
    if (!shouldRun(theme, only)) continue;
    console.log(`translate theme:${theme} (${slots.length})`);
    const items = slots.map((s, i) => ({ i, g: s.gender, es: slotText(s) }));
    const translated = await translateWithRetry("theme", theme, items, apiKey, url, model, force);
    themeOut[theme] = slots.map((s, i) => {
      const r = translated.find((x) => x.i === i)!;
      return {
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: r.sl.trim(),
      };
    });
  }

  // Niches
  for (const [niche, slots] of Object.entries(NICHE_TEMPLATES_PL)) {
    if (!shouldRun(niche, only)) continue;
    console.log(`translate niche:${niche} (${slots.length})`);
    const items = slots.map((s, i) => ({ i, g: s.gender, es: slotText(s) }));
    const translated = await translateWithRetry("niche", niche, items, apiKey, url, model, force);
    nicheOut[niche] = slots.map((s, i) => {
      const r = translated.find((x) => x.i === i)!;
      return {
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: r.sl.trim(),
      };
    });
  }

  const { REVIEW_SLOTS_BY_SLUG } = await import("../src/data/review-templates-slug.pl");
  for (const slug of SLUG_INLINE) {
    if (!shouldRun(slug, only)) continue;
    const slots = REVIEW_SLOTS_BY_SLUG[slug];
    if (!slots?.length) continue;
    console.log(`translate slug:${slug} (${slots.length})`);
    const items = slots.map((s, i) => ({ i, g: s.gender, es: slotText(s) }));
    const translated = await translateWithRetry("slug", slug, items, apiKey, url, model, force);
    slugInlineOut[slug] = slots.map((s, i) => {
      const r = translated.find((x) => x.i === i)!;
      return {
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: r.sl.trim(),
      };
    });
  }

  if (dryRun) {
    console.log("dry-run — cache updated, *.pl.ts not written");
    return;
  }

  if (only?.length) {
    console.log("--only: cache updated; run without --only to regenerate all *.pl.ts files");
    return;
  }

  const fullCat: Record<string, Array<{ g: "m" | "f"; text: string }>> = {};
  for (const slug of Object.keys(CATEGORY_PL_BODIES)) {
    fullCat[slug] = catOut[slug] ?? JSON.parse(
      fs.readFileSync(path.join(CACHE_DIR, `cat-${slug}.json`), "utf8"),
    ).reviews.map((r: { g: "m" | "f"; sl: string }) => ({ g: r.g, text: r.sl }));
  }

  const fullTheme: Record<string, SlotRow[]> = {};
  for (const [theme, slots] of Object.entries(REVIEW_SLOTS_BY_THEME)) {
    const rows = themeOut[theme];
    if (rows) fullTheme[theme] = rows;
    else {
      const cached = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, `theme-${theme}.json`), "utf8"),
      ) as { reviews: Array<{ sl: string }> };
      fullTheme[theme] = slots.map((s, i) => ({
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: cached.reviews[i].pl,
      }));
    }
  }

  const fullNiche: Record<string, SlotRow[]> = {};
  for (const [niche, slots] of Object.entries(NICHE_TEMPLATES_PL)) {
    const rows = nicheOut[niche];
    if (rows) fullNiche[niche] = rows;
    else {
      const cached = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, `niche-${niche}.json`), "utf8"),
      ) as { reviews: Array<{ sl: string }> };
      fullNiche[niche] = slots.map((s, i) => ({
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: cached.reviews[i].pl,
      }));
    }
  }

  const fullSlugInline: Record<string, SlotRow[]> = {};
  for (const slug of SLUG_INLINE) {
    const slots = REVIEW_SLOTS_BY_SLUG[slug];
    const rows = slugInlineOut[slug];
    if (rows) fullSlugInline[slug] = rows;
    else {
      const cached = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, `slug-${slug}.json`), "utf8"),
      ) as { reviews: Array<{ sl: string }> };
      fullSlugInline[slug] = slots.map((s, i) => ({
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: cached.reviews[i].pl,
      }));
    }
  }

  writeCatSl(fullCat);
  writeThemeSl(fullTheme);
  writeNicheSl(fullNiche);
  writeSlugSl(fullSlugInline);

  console.log("Done — review *.pl.ts files written.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
