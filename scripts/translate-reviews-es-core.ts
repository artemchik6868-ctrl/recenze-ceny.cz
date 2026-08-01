/**
 * Core: LLM batch translate review *.it.ts → native *.es.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { CATEGORY_IT_BODIES } from "../src/data/review-templates-cat.it";
import { REVIEW_SLOTS_BY_THEME } from "../src/data/review-templates-theme.it";
import { NICHE_TEMPLATES_IT } from "../src/data/review-templates-niche.it";
import type { ReviewSlot } from "../src/data/review-templates";
import { buildReviewVoiceGuideES } from "../src/lib/review-voice.es";
import { getCategoryDescriptor } from "../src/lib/category-descriptors.es";
import { REVIEW_THEME_FEW_SHOTS } from "../src/lib/review-themes.es";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-reviews-es");

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

const IT_MARKERS =
  /\b(contrassegno|corriere|settimane|settimana|dopo il|perché|anche|molto|dovevo|quasi|prima|ancora|gentile|consulente|imballaggio|spedizione|ordine|integratore|stelle|mattina|notte|primo|secondo|bruciore|fastidio|effetto|prodotto)\b/i;

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
  return (slot.text_it ?? slot.text_es ?? "").trim();
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

function validateReview(g: "m" | "f", text: string): string[] {
  const errs: string[] = [];
  if (!text || text.length < 25) errs.push("too short");
  if (text.length > 280) errs.push("too long");
  if (CYRILLIC.test(text)) errs.push("cyrillic");
  if (IT_MARKERS.test(text)) errs.push("italian marker");
  if (BROKEN_TOKENS.test(text)) errs.push("broken token");
  errs.push(...genderWarnings(g, text));
  return errs;
}

function contextFor(kind: string, key: string): string {
  if (kind === "cat" || kind === "slug") {
    const d = getCategoryDescriptor(key);
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

async function callLLM(
  system: string,
  user: string,
  apiKey: string,
  url: string,
  model: string,
): Promise<{ reviews: Array<{ i: number; g: "m" | "f"; es: string }> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
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
  const parsed = JSON.parse(content) as { reviews?: Array<{ i: number; g: "m" | "f"; es: string }> };
  if (!parsed.reviews?.length) throw new Error("missing reviews array");
  return parsed;
}

async function translateBatch(
  kind: string,
  key: string,
  items: Array<{ i: number; g: "m" | "f"; it: string }>,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
  priorErrors?: string[],
): Promise<Array<{ i: number; g: "m" | "f"; es: string }>> {
  const cacheFile = path.join(CACHE_DIR, `${kind}-${key}.json`);
  if (!force && fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as {
      reviews: Array<{ i: number; g: "m" | "f"; es: string }>;
    };
    if (cached.reviews?.length === items.length) return cached.reviews;
  }

  const voiceGuide = buildReviewVoiceGuideES();
  const ctx = contextFor(kind, key);
  const system = `Eres copywriter de reseñas de clientes para un marketplace en España (pago contra reembolso, mensajería).
Traduce cada reseña italiana a español nativo de España.
REGLAS: solo español; sin cirílico; sin palabras italianas residuales; mantén el mismo tono (experiencia personal, plazos, entrega).
Usa «España», «mensajería», «pago contra reembolso» cuando el original menciona entrega/pago.
Longitud similar al original (40–220 caracteres).`;

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
    "Devuelve JSON: { \"reviews\": [{ \"i\": number, \"g\": \"m\"|\"f\", \"es\": string }, ...] }",
    "Mismo orden, mismo g, mismo i. Solo español nativo.",
  ];

  const parsed = await callLLM(system, userParts.filter(Boolean).join("\n"), apiKey, url, model);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(parsed, null, 2), "utf8");
  return parsed.reviews;
}

async function translateWithRetry(
  kind: string,
  key: string,
  items: Array<{ i: number; g: "m" | "f"; it: string }>,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<Array<{ i: number; g: "m" | "f"; es: string }>> {
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
      else errors.push(...validateReview(r.g, r.es).map((e) => `index ${item.i}: ${e}`));
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

function writeCatEs(bodies: Record<string, Array<{ g: "m" | "f"; text: string }>>) {
  const lines = [
    "/**",
    " * Spanish review bodies keyed by category slug (parallel to CATEGORY_TEMPLATES slot order).",
    " * Authoring: see buildReviewVoiceGuideES() in review-voice.es.ts",
    " * Generated by scripts/translate-reviews-es.mjs (LLM from IT).",
    " */",
    "",
    "export type EsReviewBody = { g: \"m\" | \"f\"; text: string };",
    "",
    "export function es(g: \"m\" | \"f\", text: string): EsReviewBody {",
    "  return { g, text };",
    "}",
    "",
    "export const CATEGORY_ES_BODIES: Record<string, EsReviewBody[]> = {",
  ];
  for (const [slug, arr] of Object.entries(bodies)) {
    const key = slug === "_default" ? "_default" : `"${slug}"`;
    lines.push(`  ${key}: [`);
    for (const b of arr) {
      lines.push(`    es("${b.g}", "${escapeTs(b.text)}"),`);
    }
    lines.push("  ],");
  }
  lines.push("};", "");
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-cat.es.ts"), lines.join("\n"), "utf8");
}

function writeThemeEs(themes: Record<string, SlotRow[]>) {
  const lines = [
    "/** Spanish review slots by health/theme (for categories without CATEGORY_TEMPLATES). */",
    "/** Generated by scripts/translate-reviews-es.mjs (LLM from IT). */",
    "",
    "import type { ReviewSlot } from \"./review-templates\";",
    "import type { ReviewTheme } from \"@/lib/review-themes.es\";",
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
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-theme.es.ts"), lines.join("\n"), "utf8");
}

function writeNicheEs(niches: Record<string, SlotRow[]>) {
  const lines = [
    "/** Spanish review slot texts by niche (non-category-specific categories). */",
    "/** Generated by scripts/translate-reviews-es.mjs (LLM from IT). */",
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
    "export const NICHE_TEMPLATES_ES: Record<string, ReviewSlot[]> = {",
  ];
  for (const [niche, slots] of Object.entries(niches)) {
    lines.push(`  ${niche}: [`);
    for (const s of slots) {
      lines.push(`    ${formatSlotCall(s)},`);
    }
    lines.push("  ],");
  }
  lines.push("};", "");
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-niche.es.ts"), lines.join("\n"), "utf8");
}

function themeRef(theme: string): string {
  return theme.includes("-")
    ? `REVIEW_SLOTS_BY_THEME["${theme}"]`
    : `REVIEW_SLOTS_BY_THEME.${theme}`;
}

function writeSlugEs(inline: Record<string, SlotRow[]>) {
  const lines = [
    "/** Spanish review slots keyed by category slug (1:1 — no shared theme pools at runtime). */",
    "/** Generated by scripts/translate-reviews-es.mjs (LLM from IT). */",
    "",
    "import type { ReviewSlot } from \"./review-templates\";",
    "import { REVIEW_SLOTS_BY_THEME } from \"./review-templates-theme.es\";",
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
  fs.writeFileSync(path.join(ROOT, "src/data/review-templates-slug.es.ts"), lines.join("\n"), "utf8");
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

  const catOut: Record<string, Array<{ g: "m" | "f"; text: string }>> = {};
  const themeOut: Record<string, SlotRow[]> = {};
  const nicheOut: Record<string, SlotRow[]> = {};
  const slugInlineOut: Record<string, SlotRow[]> = {};

  // Categories
  for (const [slug, bodies] of Object.entries(CATEGORY_IT_BODIES)) {
    if (!shouldRun(slug, only)) continue;
    console.log(`translate cat:${slug} (${bodies.length})`);
    const items = bodies.map((b, i) => ({ i, g: b.g, it: b.text }));
    const translated = await translateWithRetry("cat", slug, items, apiKey, url, model, force);
    catOut[slug] = translated.map((r) => ({ g: r.g, text: r.es.trim() }));
  }

  // Themes
  for (const [theme, slots] of Object.entries(REVIEW_SLOTS_BY_THEME)) {
    if (!shouldRun(theme, only)) continue;
    console.log(`translate theme:${theme} (${slots.length})`);
    const items = slots.map((s, i) => ({ i, g: s.gender, it: slotText(s) }));
    const translated = await translateWithRetry("theme", theme, items, apiKey, url, model, force);
    themeOut[theme] = slots.map((s, i) => {
      const r = translated.find((x) => x.i === i)!;
      return {
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: r.es.trim(),
      };
    });
  }

  // Niches
  for (const [niche, slots] of Object.entries(NICHE_TEMPLATES_IT)) {
    if (!shouldRun(niche, only)) continue;
    console.log(`translate niche:${niche} (${slots.length})`);
    const items = slots.map((s, i) => ({ i, g: s.gender, it: slotText(s) }));
    const translated = await translateWithRetry("niche", niche, items, apiKey, url, model, force);
    nicheOut[niche] = slots.map((s, i) => {
      const r = translated.find((x) => x.i === i)!;
      return {
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: r.es.trim(),
      };
    });
  }

  // Slug inline blocks — import from niche.it file path for inline slugs
  const { REVIEW_SLOTS_BY_SLUG } = await import("../src/data/review-templates-slug.it");
  for (const slug of SLUG_INLINE) {
    if (!shouldRun(slug, only)) continue;
    const slots = REVIEW_SLOTS_BY_SLUG[slug];
    if (!slots?.length) continue;
    console.log(`translate slug:${slug} (${slots.length})`);
    const items = slots.map((s, i) => ({ i, g: s.gender, it: slotText(s) }));
    const translated = await translateWithRetry("slug", slug, items, apiKey, url, model, force);
    slugInlineOut[slug] = slots.map((s, i) => {
      const r = translated.find((x) => x.i === i)!;
      return {
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: r.es.trim(),
      };
    });
  }

  if (dryRun) {
    console.log("dry-run — cache updated, *.es.ts not written");
    return;
  }

  if (only?.length) {
    console.log("--only: cache updated; run without --only to regenerate all *.es.ts files");
    return;
  }

  const fullCat: Record<string, Array<{ g: "m" | "f"; text: string }>> = {};
  for (const slug of Object.keys(CATEGORY_IT_BODIES)) {
    fullCat[slug] = catOut[slug] ?? JSON.parse(
      fs.readFileSync(path.join(CACHE_DIR, `cat-${slug}.json`), "utf8"),
    ).reviews.map((r: { g: "m" | "f"; es: string }) => ({ g: r.g, text: r.es }));
  }

  const fullTheme: Record<string, SlotRow[]> = {};
  for (const [theme, slots] of Object.entries(REVIEW_SLOTS_BY_THEME)) {
    const rows = themeOut[theme];
    if (rows) fullTheme[theme] = rows;
    else {
      const cached = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, `theme-${theme}.json`), "utf8"),
      ) as { reviews: Array<{ es: string }> };
      fullTheme[theme] = slots.map((s, i) => ({
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: cached.reviews[i].es,
      }));
    }
  }

  const fullNiche: Record<string, SlotRow[]> = {};
  for (const [niche, slots] of Object.entries(NICHE_TEMPLATES_IT)) {
    const rows = nicheOut[niche];
    if (rows) fullNiche[niche] = rows;
    else {
      const cached = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, `niche-${niche}.json`), "utf8"),
      ) as { reviews: Array<{ es: string }> };
      fullNiche[niche] = slots.map((s, i) => ({
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: cached.reviews[i].es,
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
      ) as { reviews: Array<{ es: string }> };
      fullSlugInline[slug] = slots.map((s, i) => ({
        rating: s.rating,
        daysAgo: s.daysAgo,
        gender: s.gender,
        noPhoto: s.noPhoto ?? false,
        text: cached.reviews[i].es,
      }));
    }
  }

  writeCatEs(fullCat);
  writeThemeEs(fullTheme);
  writeNicheEs(fullNiche);
  writeSlugEs(fullSlugInline);

  console.log("Done — review *.es.ts files written.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
