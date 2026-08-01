/**
 * LLM translate content.pl + niche-content.pl → native content.pl + niche-content.pl (Poland)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { CATEGORY_CONTENT, NEW_CATEGORY_NAMES_SL } from "../src/lib/content.pl";
import { buildNicheContentPL } from "../src/lib/niche-content.pl";
import type { FaqItem, ContentSection } from "../src/lib/content.pl";
import type { NicheType } from "../src/lib/niche-types";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-content-pl");
const ES_CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-content-pl");

const BRAND = "__B__";
const NAME = "__NAME__";
const SHORT = "__SHORT__";

const CAT_VARS: Record<string, string> = {
  "cukrovka": "diabetes",
  "krevni-tlak": "hypertension",
  "detox": "detox",
  "klouby": "joints",
  "potence": "vitality",
  "hubnuti": "weight",
  "prostata": "prostate",
  "zrak": "vision",
  "intimate-comfort": "intimate",
  "zdravi-zen": "womens",
};

const NICHE_SLUGS: Record<NicheType, string> = {
  supplement: "klouby",
  device: "lekarske-pristroje",
  garden: "zahradni-naradi",
  autodoplnky: "autodoplnky",
  home: "domaci-potreby",
  fashion: "boty",
  generic: "optika",
};

const ES_MARKERS = /\b(España|español|mensajería|contrassegno|corriere|¿|¡| en España|toda España|Productos para la salud|complemento alimenticio|Cómo elegir|Aquí encuentras|Selección curada)\b/i;

const CYRILLIC = /[\u0400-\u04FF]/;

type TextItem = { key: string; es: string };

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

function escapeTs(s: string | undefined | null): string {
  if (s == null) return "";
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function tplBrand(s: string): string {
  return s.split(BRAND).join("${b}");
}

function tplNameKey(s: string, namePh: string): string {
  const key = namePh.toLowerCase();
  return s.replaceAll(key, "${key}").replaceAll(namePh, "${name}");
}

const SL_MARKERS = /\b(Slovenija|Sloveniji|naročilo|plačilo ob prevzemu|dostava v Sloveniji|prehransko dopolnilo|zdravnik|delovnih dneh|kurirjem po vsej)\b/i;

function validatePl(key: string, esSrc: string, pl: string): string[] {
  const errs: string[] = [];
  if (!pl?.trim()) errs.push(`${key}: empty`);
  if (CYRILLIC.test(pl)) errs.push(`${key}: cyrillic`);
  if (ES_MARKERS.test(pl)) errs.push(`${key}: spanish marker`);
  if (SL_MARKERS.test(pl)) errs.push(`${key}: slovenian marker`);
  for (const ph of ["${b}", "${name}", "${topic}", "${key}", "${brand}", "${lc(name)}"]) {
    if (esSrc.includes(ph) && !pl.includes(ph)) errs.push(`${key}: missing placeholder ${ph}`);
  }
  if (esSrc.includes(BRAND) && !pl.includes("${b}") && !pl.includes("${brand}"))
    errs.push(`${key}: missing brand placeholder`);
  if (esSrc.includes(NAME) && !pl.includes("${name}")) errs.push(`${key}: missing name placeholder`);
  return errs;
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
): Promise<Record<string, string>> {
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
          temperature: 0.35,
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
        items?: Array<{ key: string; pl?: string; sl?: string; es?: string }>;
      };
      if (!parsed.items?.length) throw new Error(`missing items array: ${content.slice(0, 200)}`);
      const out: Record<string, string> = {};
      for (const row of parsed.items) {
        const pl = row.pl ?? row.sl ?? row.es;
        if (!pl) throw new Error(`missing pl for key ${row.key}`);
        out[row.key] = pl;
      }
      return out;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function translateItems(
  batchId: string,
  items: TextItem[],
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
  context?: string,
  priorErrors?: string[],
): Promise<Record<string, string>> {
  const cacheFile = path.join(CACHE_DIR, `${batchId}.json`);
  if (!force && fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as {
      items: Record<string, string>;
    };
    const cachedItems = cached.items ?? {};
    const missing = items.filter((i) => !cachedItems[i.key]?.trim());
    if (!missing.length) return cachedItems;
    if (missing.length < items.length) {
      const partial = await translateItems(
        `${batchId}-partial`,
        missing,
        apiKey,
        url,
        model,
        force,
        context,
        priorErrors,
      );
      const merged = { ...cachedItems, ...partial };
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify({ items: merged }, null, 2), "utf8");
      return merged;
    }
  }

  const system = `Jesteś copywriterem SEO dla sklepu na rynku polskim (płatność przy odbiorze, dostawa w Polsce).
Przetłumacz każdy słoweński tekst źródłowy na naturalny polski (cs-CZ).
ZASADY:
- Tylko polski; bez cyrylicy; bez słoweńskich słów (Slovenija, naročilo, plačilo ob prevzemu).
- Używaj «Polska», «płatność przy odbiorze», «dostawa w Polsce», marka «Recenze Ceny».
- ZACHOWAJ placeholders: \${b}, \${brand}, \${name}, \${topic}, \${key}, \${lc(name)}.
- Zachowaj łamania linii \\n w listach.
- Podobna długość jak oryginał.`;

  const user = [
    context ?? "",
    "Input (JSON array de {key, es}):",
    JSON.stringify(items),
    priorErrors?.length ? `POPRAW: ${priorErrors.join("; ")}` : "",
    'Zwróć JSON: { "items": [{ "key": string, "de": string }, ...] }',
  ]
    .filter(Boolean)
    .join("\n");

  const mapped = await callLLM(system, user, apiKey, url, model);
  for (const item of items) {
    if (!mapped[item.key]) throw new Error(`${batchId}: missing key ${item.key}`);
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify({ items: mapped }, null, 2), "utf8");
  return mapped;
}

async function translateWithRetry(
  batchId: string,
  items: TextItem[],
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
  context?: string,
): Promise<Record<string, string>> {
  const CHUNK = 30;
  if (!force) {
    const merged: Record<string, string> = {};
    let complete = true;
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunkFile = path.join(CACHE_DIR, `${batchId}-${Math.floor(i / CHUNK)}.json`);
      if (!fs.existsSync(chunkFile)) {
        complete = false;
        break;
      }
      const cached = JSON.parse(fs.readFileSync(chunkFile, "utf8")) as {
        items: Record<string, string>;
      };
      Object.assign(merged, cached.items ?? {});
    }
    if (complete && Object.keys(merged).length === items.length) return merged;
  }

  if (items.length <= CHUNK) {
    return translateWithRetryChunk(batchId, items, apiKey, url, model, force, context);
  }
  const merged: Record<string, string> = {};
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const subId = `${batchId}-${Math.floor(i / CHUNK)}`;
    const part = await translateWithRetryChunk(subId, chunk, apiKey, url, model, force, context);
    Object.assign(merged, part);
  }
  return merged;
}

async function translateWithRetryChunk(
  batchId: string,
  items: TextItem[],
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
  context?: string,
): Promise<Record<string, string>> {
  let errors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const mapped = await translateItems(
      batchId,
      items,
      apiKey,
      url,
      model,
      attempt > 0 ? true : force,
      context,
      errors.length ? errors : undefined,
    );
    errors = [];
    for (const item of items) {
      errors.push(...validatePl(item.key, item.es, mapped[item.key]));
    }
    if (!errors.length) return mapped;
    console.warn(`  retry ${attempt + 1} ${batchId}: ${errors.slice(0, 3).join("; ")}`);
  }
  throw new Error(`validation failed ${batchId}: ${errors.join("; ")}`);
}

function extractCommonItems(): TextItem[] {
  const c = CATEGORY_CONTENT["cukrovka"];
  const sections = c.productSections(BRAND);
  const faqs = c.productFaq(BRAND).slice(-3);
  const items: TextItem[] = [];
  const addSection = (prefix: string, s: ContentSection) => {
    items.push({ key: `${prefix}.heading`, es: s.heading });
    items.push({ key: `${prefix}.body`, es: s.body });
  };
  addSection("safety", sections[2]);
  addSection("delivery", sections[3]);
  addSection("quality", sections[4]);
  faqs.forEach((f, i) => {
    items.push({ key: `faq.${i}.q`, es: f.q });
    items.push({ key: `faq.${i}.a`, es: f.a });
  });
  return items;
}

type CatExtract = {
  slug: string;
  usesBrandInSubtitle: boolean;
  usesBrandInIntro: boolean;
  usesBrandInUniqueFaq: boolean;
  usesBrandInUniqueSectionHeading: boolean;
  usesBrandInHowToUse: boolean;
  items: TextItem[];
};

function extractCategory(slug: string): CatExtract {
  const c = CATEGORY_CONTENT[slug];
  const sections = c.productSections(BRAND);
  const faqs = c.productFaq(BRAND);
  const uniqueFaq = faqs.slice(0, faqs.length - 3);
  const catSections = c.categorySectionsHi.filter(
    (s) => !/sicurezza e avvertenze/i.test(s.heading),
  );

  const subtitle = c.subtitleHi(BRAND);
  const intro = c.productIntro(BRAND);
  const items: TextItem[] = [
    { key: "name", es: c.nameHi },
    { key: "tagline", es: c.taglineHi },
    { key: "shortDesc", es: c.shortDescHi },
    { key: "subtitle", es: tplBrand(subtitle) },
    { key: "productIntro", es: tplBrand(intro) },
    { key: "uniqueSection.heading", es: tplBrand(sections[0].heading) },
    { key: "uniqueSection.body", es: sections[0].body },
    { key: "howToUse.heading", es: sections[1].heading },
    { key: "howToUse.body", es: tplBrand(sections[1].body) },
    { key: "categoryIntro", es: c.categoryIntroHi },
  ];

  uniqueFaq.forEach((f, i) => {
    items.push({ key: `uniqueFaq.${i}.q`, es: tplBrand(f.q) });
    items.push({ key: `uniqueFaq.${i}.a`, es: f.a });
  });
  catSections.forEach((s, i) => {
    items.push({ key: `catSection.${i}.heading`, es: s.heading });
    items.push({ key: `catSection.${i}.body`, es: s.body });
  });
  c.keywordsHi.forEach((k, i) => items.push({ key: `keyword.${i}`, es: k }));

  return {
    slug,
    usesBrandInSubtitle: subtitle.includes(BRAND),
    usesBrandInIntro: intro.includes(BRAND),
    usesBrandInUniqueFaq: uniqueFaq.some((f) => f.q.includes(BRAND) || f.a.includes(BRAND)),
    usesBrandInUniqueSectionHeading: sections[0].heading.includes(BRAND),
    usesBrandInHowToUse: sections[1].body.includes(BRAND),
    items,
  };
}

function extractNewCategoryItems(): TextItem[] {
  const items: TextItem[] = [];
  for (const [slug, { name, short }] of Object.entries(NEW_CATEGORY_NAMES_SL)) {
    items.push({ key: `${slug}.name`, es: name });
    items.push({ key: `${slug}.short`, es: short });
  }
  return items;
}

function extractNicheItems(niche: NicheType): TextItem[] {
  const slug = NICHE_SLUGS[niche];
  const built = buildNicheContentPL(slug, NAME, SHORT);
  const sections = built.productSections(BRAND);
  const safety = sections[0];
  const delivery = sections[1];
  const quality = sections[2];
  const intro = tplNameKey(built.categoryIntroHi, NAME);
  const whatsInside = built.categorySectionsHi[0];
  const howToChoose = built.categorySectionsHi[1];
  const nicheFaqs = built.categoryFaqHi;
  const baseFaqs = nicheFaqs.slice(-3);
  const extraFaqs = nicheFaqs.slice(0, nicheFaqs.length - 3);
  const productFaqs = built.productFaq(BRAND);

  const items: TextItem[] = [
    { key: "delivery.heading", es: delivery.heading },
    { key: "delivery.body", es: delivery.body },
    { key: "quality.heading", es: quality.heading },
    { key: "quality.body", es: quality.body },
    { key: "safety.heading", es: safety.heading },
    { key: "safety.body", es: safety.body },
    { key: "intro", es: intro },
    { key: "whatsInside.heading", es: tplNameKey(whatsInside.heading, NAME) },
    { key: "whatsInside.bodyPrefix", es: `Qui trovi ${SHORT}.` },
    { key: "howToChoose.heading", es: howToChoose.heading.replace(lc(NAME), "${lc(name)}") },
    { key: "howToChoose.body", es: howToChoose.body },
    { key: "productIntro", es: tplNameKey(tplBrand(built.productIntro(BRAND)), NAME) },
    { key: "productSubtitle", es: tplNameKey(tplBrand(built.subtitleHi(BRAND)), NAME) },
    { key: "tagline", es: tplNameKey(built.taglineHi, NAME) },
  ];

  const closingMed =
    niche === "supplement" || niche === "device"
      ? "Nella selezione trovi soluzioni in diverse fasce di prezzo, per scegliere l'opzione più adatta alle tue esigenze."
      : "Non è un integratore né un farmaco — è un articolo per uso domestico: controlla materiali, dimensioni e contenuto della confezione in ogni scheda.";
  items.push({ key: "whatsInside.closing", es: closingMed });

  extraFaqs.forEach((f, i) => {
    items.push({ key: `faqExtra.${i}.q`, es: tplNameKey(f.q, NAME) });
    items.push({ key: `faqExtra.${i}.a`, es: f.a });
  });
  baseFaqs.forEach((f, i) => {
    items.push({ key: `faqBase.${i}.q`, es: f.q });
    items.push({ key: `faqBase.${i}.a`, es: f.a });
  });

  productFaqs.forEach((f, i) => {
    items.push({ key: `productFaq.${i}.q`, es: tplBrand(tplNameKey(f.q, NAME)) });
    items.push({ key: `productFaq.${i}.a`, es: f.a });
  });

  return items;
}

function normPlaceholders(s: string): string {
  return s
    .replace(/\$\{b\}/g, "${brand}")
    .replace(/__SHORT__/g, "${topic}")
    .replace(/__NAME__/g, "${name}");
}

function lc(s: string): string {
  return s.toLowerCase();
}

function writeSectionConst(name: string, heading: string, body: string): string {
  return `const ${name}: ContentSection = {\n  heading: "${escapeTs(heading)}",\n  body:\n    "${escapeTs(body)}",\n};`;
}

function writeFaqItems(faqs: FaqItem[], indent = "    "): string {
  const qLit = (q: string) =>
    q.includes("${") ? `\`${q.replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\`` : `"${escapeTs(q)}"`;
  return faqs
    .map(
      (f) =>
        `${indent}{\n${indent}  q: ${qLit(f.q)},\n${indent}  a: "${escapeTs(f.a)}",\n${indent}},`,
    )
    .join("\n");
}

function writeContentSl(
  common: Record<string, string>,
  categories: Record<string, Record<string, string>>,
  newCats: Record<string, string>,
  extracts: CatExtract[],
): void {
  const faqs: FaqItem[] = [0, 1, 2].map((i) => ({
    q: common[`faq.${i}.q`],
    a: common[`faq.${i}.a`],
  }));

  const lines: string[] = [
    "// Polish content templates for the Poland market.",
    "// Each category provides: name, tagline, product subtitle template, long-form",
    "// SEO sections, and FAQ. The shape uses `*Hi` field names purely as legacy",
    "// string holders so the same components/SEO builders work across locales.",
    "// Generated by scripts/translate-content-pl.mjs (LLM from IT).",
    "",
    "import { buildNicheContentPL } from \"./niche-content.pl\";",
    "",
    "export type ContentSection = { heading: string; body: string };",
    "export type FaqItem = { q: string; a: string };",
    "",
    "export type CategoryContent = {",
    "  slug: string;",
    "  nameHi: string;",
    "  taglineHi: string;",
    "  shortDescHi: string;",
    "  subtitleHi: (brand: string) => string;",
    "  productIntro: (brand: string) => string;",
    "  productSections: (brand: string) => ContentSection[];",
    "  productFaq: (brand: string) => FaqItem[];",
    "  categoryIntroHi: string;",
    "  categorySectionsHi: ContentSection[];",
    "  categoryFaqHi: FaqItem[];",
    "  keywordsHi: string[];",
    "};",
    "",
    writeSectionConst("COMMON_DELIVERY", common["delivery.heading"], common["delivery.body"]),
    "",
    writeSectionConst("COMMON_SAFETY", common["safety.heading"], common["safety.body"]),
    "",
    writeSectionConst("COMMON_QUALITY", common["quality.heading"], common["quality.body"]),
    "",
    "const COMMON_FAQ: FaqItem[] = [",
    writeFaqItems(faqs),
    "];",
    "",
    "type Builder = {",
    "  slug: string;",
    "  name: string;",
    "  tagline: string;",
    "  shortDesc: string;",
    "  subtitle: (b: string) => string;",
    "  productIntro: (b: string) => string;",
    "  uniqueSection: (b: string) => ContentSection;",
    "  howToUse: (b: string) => ContentSection;",
    "  uniqueFaq: (b: string) => FaqItem[];",
    "  categoryIntro: string;",
    "  categorySections: ContentSection[];",
    "  categoryFaq: FaqItem[];",
    "  keywords: string[];",
    "};",
    "",
    "function compose(b: Builder): CategoryContent {",
    "  return {",
    "    slug: b.slug,",
    "    nameHi: b.name,",
    "    taglineHi: b.tagline,",
    "    shortDescHi: b.shortDesc,",
    "    subtitleHi: b.subtitle,",
    "    productIntro: b.productIntro,",
    "    productSections: (brand) => [",
    "      b.uniqueSection(brand),",
    "      b.howToUse(brand),",
    "      COMMON_SAFETY,",
    "      COMMON_DELIVERY,",
    "      COMMON_QUALITY,",
    "    ],",
    "    productFaq: (brand) => [...b.uniqueFaq(brand), ...COMMON_FAQ],",
    "    categoryIntroHi: b.categoryIntro,",
    "    categorySectionsHi: b.categorySections,",
    "    categoryFaqHi: b.categoryFaq,",
    "    keywordsHi: b.keywords,",
    "  };",
    "}",
    "",
  ];

  for (const ex of extracts) {
    const t = categories[ex.slug];
    const varName = CAT_VARS[ex.slug];
    const uniqueFaqCount = ex.items.filter((i) => i.key.startsWith("uniqueFaq.")).length / 2;
    const uniqueFaqs: FaqItem[] = [];
    for (let i = 0; i < uniqueFaqCount; i++) {
      uniqueFaqs.push({ q: t[`uniqueFaq.${i}.q`], a: t[`uniqueFaq.${i}.a`] });
    }
    const catSectionCount = ex.items.filter((i) => i.key.startsWith("catSection.")).length / 2;
    const catSections: ContentSection[] = [];
    for (let i = 0; i < catSectionCount; i++) {
      catSections.push({
        heading: t[`catSection.${i}.heading`],
        body: t[`catSection.${i}.body`],
      });
    }
    catSections.push({
      heading: common["safety.heading"],
      body: common["safety.body"],
    });

    const keywords = ex.items
      .filter((i) => i.key.startsWith("keyword."))
      .map((i) => t[i.key]);

    const faqFn =
      ex.usesBrandInUniqueFaq
        ? `(b) => [\n${writeFaqItems(uniqueFaqs)}\n  ]`
        : `() => [\n${writeFaqItems(uniqueFaqs)}\n  ]`;

    lines.push(
      `const ${varName} = compose({`,
      `  slug: "${ex.slug}",`,
      `  name: "${escapeTs(t.name)}",`,
      `  tagline: "${escapeTs(t.tagline)}",`,
      `  shortDesc:\n    "${escapeTs(t.shortDesc)}",`,
      `  subtitle: (b) => \`${t.subtitle}\`,`,
      `  productIntro: (b) =>\n    \`${t.productIntro}\`,`,
      `  uniqueSection: (b) => ({`,
      `    heading: \`${t["uniqueSection.heading"]}\`,`,
      `    body:\n      "${escapeTs(t["uniqueSection.body"])}",`,
      `  }),`,
      `  howToUse: (b) => ({`,
      `    heading: "${escapeTs(t["howToUse.heading"])}",`,
      `    body:\n      "${escapeTs(t["howToUse.body"])}",`,
      `  }),`,
      `  uniqueFaq: ${faqFn},`,
      `  categoryIntro:\n    "${escapeTs(t.categoryIntro)}",`,
      `  categorySections: [`,
      ...catSections.map(
        (s) =>
          `    {\n      heading: "${escapeTs(s.heading)}",\n      body:\n        "${escapeTs(s.body)}",\n    },`,
      ),
      `  ],`,
      `  categoryFaq: COMMON_FAQ,`,
      `  keywords: [${keywords.map((k) => `"${escapeTs(k)}"`).join(", ")}],`,
      `});`,
      "",
    );
  }

  lines.push(
    "export const CATEGORY_CONTENT: Record<string, CategoryContent> = {",
    Object.entries(CAT_VARS)
      .map(([slug, varName]) => `  "${slug}": ${varName},`)
      .join("\n"),
    "};",
    "",
    "export const NEW_CATEGORY_NAMES_PL: Record<string, { name: string; short: string }> = {",
    Object.entries(NEW_CATEGORY_NAMES_SL)
      .map(
        ([slug]) =>
          `  ${JSON.stringify(slug)}: { name: "${escapeTs(newCats[`${slug}.name`])}", short: "${escapeTs(newCats[`${slug}.short`])}" },`,
      )
      .join("\n"),
    "};",
    "",
    "const THIN_CATEGORY_SECTIONS = new Set<string>([",
    "  \"diabetes-care\", \"blood-pressure\", \"detox-cleanse\", \"joint-care\",",
    "  \"potence-libido\", \"weight-management\", \"prostate-health\", \"vision-eye-care\",",
    "  \"intimate-comfort\", \"womens-health\",",
    "]);",
    "",
    "export function getCategoryContent(slug: string): CategoryContent {",
    "  const exact = CATEGORY_CONTENT[slug];",
    "  if (exact) {",
    "    if (THIN_CATEGORY_SECTIONS.has(slug)) {",
    "      const rich = buildNicheContentPL(slug, exact.nameHi, exact.shortDescHi);",
    "      return {",
    "        ...exact,",
    "        categoryIntroHi: rich.categoryIntroHi,",
    "        categorySectionsHi: rich.categorySectionsHi,",
    "        categoryFaqHi: rich.categoryFaqHi,",
    "        keywordsHi: rich.keywordsHi,",
    "      };",
    "    }",
    "    return exact;",
    "  }",
    "  const named = NEW_CATEGORY_NAMES_PL[slug];",
    "  if (named) return buildNicheContentPL(slug, named.name, named.short);",
    "  return {",
    "    slug,",
    "    nameHi: \"Izdelki za zdravje\",",
    "    taglineHi: \"Izbrani izdelki za dobro počutje\",",
    "    shortDescHi: \"Wybrane produkty zdrowotne z dostawą w całej Polsce.\",",
    "    subtitleHi: (b) => `${b} — naravno dopolnilo`,",
    "    productIntro: (b) =>",
    "      `${b} — naravno dopolnilo, ki podpira vaše vsakodnevno počutje.`,",
    "    productSections: () => [COMMON_SAFETY, COMMON_DELIVERY, COMMON_QUALITY],",
    "    productFaq: () => COMMON_FAQ,",
    "    categoryIntroHi:",
    "      \"Wybrane produkty zdrowotne z dostawą w całej Polsce.\",",
    "    categorySectionsHi: [COMMON_SAFETY],",
    "    categoryFaqHi: COMMON_FAQ,",
    "    keywordsHi: [\"suplement diety zdrowie\", \"naturalne kapsułki Polska\"],",
    "  };",
    "}",
    "",
  );

  fs.writeFileSync(path.join(ROOT, "src/lib/content.pl.ts"), lines.join("\n"), "utf8");
}

function writeNicheSl(nicheData: Record<NicheType, Record<string, string>>): void {
  const d = (niche: NicheType, key: string) => nicheData[niche][key];

  const writeNicheBlock = (niche: NicheType) => {
    const extraCount = Object.keys(nicheData[niche]).filter((k) => k.startsWith("faqExtra.")).length / 2;
    const extraFaqs: FaqItem[] = [];
    for (let i = 0; i < extraCount; i++) {
      extraFaqs.push({
        q: d(niche, `faqExtra.${i}.q`),
        a: d(niche, `faqExtra.${i}.a`),
      });
    }
    const baseFaqs: FaqItem[] = [0, 1, 2].map((i) => ({
      q: d(niche, `faqBase.${i}.q`),
      a: d(niche, `faqBase.${i}.a`),
    }));
    const productFaqCount =
      Object.keys(nicheData[niche]).filter((k) => k.startsWith("productFaq.")).length / 2;
    const productFaqs: FaqItem[] = [];
    for (let i = 0; i < productFaqCount; i++) {
      productFaqs.push({
        q: d(niche, `productFaq.${i}.q`),
        a: d(niche, `productFaq.${i}.a`),
      });
    }
    return { extraFaqs, baseFaqs, productFaqs };
  };

  const supplement = writeNicheBlock("supplement");
  const device = writeNicheBlock("device");
  const garden = writeNicheBlock("garden");
  const auto = writeNicheBlock("autodoplnky");
  const home = writeNicheBlock("home");
  const fashion = writeNicheBlock("fashion");

  const lines: string[] = [
    "// SEO-richer fallback builder for categories without a hand-written compose()",
    "// block — Polish mirror of niche-content.pl.ts (Poland market).",
    "// Generated by scripts/translate-content-pl.mjs (LLM from IT).",
    "",
    "import type { CategoryContent, ContentSection, FaqItem } from \"./content.pl\";",
    "import type { CategoryDescriptor } from \"./category-descriptors.pl\";",
    "import { getCategoryDescriptor } from \"./category-descriptors.pl\";",
    "import { getNicheType, type NicheType } from \"./niche-types\";",
    "",
    writeSectionConst("DELIVERY_PL", d("supplement", "delivery.heading"), d("supplement", "delivery.body")),
    "",
    writeSectionConst("QUALITY_PL", d("supplement", "quality.heading"), d("supplement", "quality.body")),
    "",
    writeSectionConst("SAFETY_SUPPLEMENT", d("supplement", "safety.heading"), d("supplement", "safety.body")),
    "",
    writeSectionConst("SAFETY_DEVICE", d("device", "safety.heading"), d("device", "safety.body")),
    "",
    writeSectionConst("SAFETY_GARDEN", d("garden", "safety.heading"), d("garden", "safety.body")),
    "",
    writeSectionConst("SAFETY_AUTO", d("autodoplnky", "safety.heading"), d("autodoplnky", "safety.body")),
    "",
    writeSectionConst("SAFETY_HOME", d("home", "safety.heading"), d("home", "safety.body")),
    "",
    writeSectionConst("SAFETY_FASHION", d("fashion", "safety.heading"), d("fashion", "safety.body")),
    "",
    "function safetyFor(niche: NicheType): ContentSection {",
    "  switch (niche) {",
    "    case \"supplement\":",
    "      return SAFETY_SUPPLEMENT;",
    "    case \"device\":",
    "      return SAFETY_DEVICE;",
    "    case \"garden\":",
    "      return SAFETY_GARDEN;",
    "    case \"auto\":",
    "      return SAFETY_AUTO;",
    "    case \"home\":",
    "      return SAFETY_HOME;",
    "    case \"fashion\":",
    "      return SAFETY_FASHION;",
    "    default:",
    "      return QUALITY_PL;",
    "  }",
    "}",
    "",
    "const lc = (s: string) => s.toLowerCase();",
    "",
    "function intro(name: string, shortDesc: string, niche: NicheType): string {",
    "  const topic = shortDesc || lc(name);",
    "  const key = lc(name);",
    "  switch (niche) {",
    "    case \"supplement\":",
    `      return \`${normPlaceholders(d("supplement", "intro"))}\`;`,
    "    case \"device\":",
    `      return \`${normPlaceholders(d("device", "intro"))}\`;`,
    "    case \"garden\":",
    `      return \`${normPlaceholders(d("garden", "intro"))}\`;`,
    "    case \"auto\":",
    `      return \`${normPlaceholders(d("autodoplnky", "intro"))}\`;`,
    "    case \"home\":",
    `      return \`${normPlaceholders(d("home", "intro"))}\`;`,
    "    case \"fashion\":",
    `      return \`${normPlaceholders(d("fashion", "intro"))}\`;`,
    "    default:",
    `      return \`${normPlaceholders(d("generic", "intro"))}\`;`,
    "  }",
    "}",
    "",
    "function whatsInsideSection(name: string, shortDesc: string, niche: NicheType): ContentSection {",
    "  const topic = shortDesc || lc(name);",
    "  const headingByNiche: Record<NicheType, string> = {",
    `    supplement: \`${d("supplement", "whatsInside.heading")}\`,`,
    `    device: \`${d("device", "whatsInside.heading")}\`,`,
    `    garden: \`${d("garden", "whatsInside.heading")}\`,`,
    `    autodoplnky: \`${d("autodoplnky", "whatsInside.heading")}\`,`,
    `    home: \`${d("home", "whatsInside.heading")}\`,`,
    `    fashion: \`${d("fashion", "whatsInside.heading")}\`,`,
  ];

  const genericHeading = d("generic", "whatsInside.heading");
  lines.push(
    `    generic: \`${genericHeading}\`,`,
    "  };",
    "  const intoMed = niche === \"supplement\" || niche === \"device\";",
    "  const closing = intoMed",
    `    ? "${escapeTs(d("supplement", "whatsInside.closing"))}"`,
    `    : "${escapeTs(d("home", "whatsInside.closing"))}";`,
    "  return {",
    "    heading: headingByNiche[niche],",
    "    body: `Tukaj najdete ${topic}. ${closing}`,",
    "  };",
    "}",
    "",
    "function howToChooseSection(name: string, niche: NicheType): ContentSection {",
    "  const body =",
    "    niche === \"supplement\"",
    `      ? "${escapeTs(d("supplement", "howToChoose.body"))}"`,
    "      : niche === \"device\"",
    `      ? "${escapeTs(d("device", "howToChoose.body"))}"`,
    "      : niche === \"garden\"",
    `      ? "${escapeTs(d("garden", "howToChoose.body"))}"`,
    "      : niche === \"auto\"",
    `      ? "${escapeTs(d("autodoplnky", "howToChoose.body"))}"`,
    "      : niche === \"fashion\"",
    `      ? "${escapeTs(d("fashion", "howToChoose.body"))}"`,
    `      : "${escapeTs(d("home", "howToChoose.body"))}";`,
    "  return { heading: `Kako izbrati «${lc(name)}»`, body };",
    "}",
    "",
  );

  const writeNicheFaqFn = (niche: NicheType, extra: FaqItem[], base: FaqItem[]) => {
    lines.push(`    ${niche}: [`, writeFaqItems(extra, "      "), `    ],`);
  };

  lines.push(
    "function nicheFaq(name: string, niche: NicheType): FaqItem[] {",
    "  const base: FaqItem[] = [",
    writeFaqItems(supplement.baseFaqs, "    "),
    "  ];",
    "  const nicheQuestions: Record<NicheType, FaqItem[]> = {",
  );
  writeNicheFaqFn("supplement", supplement.extraFaqs, supplement.baseFaqs);
  writeNicheFaqFn("device", device.extraFaqs, device.baseFaqs);
  writeNicheFaqFn("garden", garden.extraFaqs, garden.baseFaqs);
  writeNicheFaqFn("autodoplnky", auto.extraFaqs, auto.baseFaqs);
  writeNicheFaqFn("home", home.extraFaqs, home.baseFaqs);
  writeNicheFaqFn("fashion", fashion.extraFaqs, fashion.baseFaqs);
  lines.push("    generic: [],", "  };", "  return [...nicheQuestions[niche], ...base];", "}", "");

  lines.push(
    "function keywordsFor(name: string, d: CategoryDescriptor): string[] {",
    "  const base = [",
    "    lc(name),",
    "    `${lc(name)} slovenija`,",
    "    `${lc(name)} kupiti`,",
    "    `${lc(name)} cena`,",
    "    `${lc(name)} dostava`,",
    "  ];",
    "  return Array.from(new Set([...(d.primaryKeywords ?? []), ...base])).slice(0, 10);",
    "}",
    "",
    "function productIntroFor(brand: string, niche: NicheType, name: string, shortDesc: string): string {",
    "  const topic = shortDesc || lc(name);",
    "  switch (niche) {",
    "    case \"supplement\":",
    `      return \`${normPlaceholders(d("supplement", "productIntro"))}\`;`,
    "    case \"device\":",
    `      return \`${normPlaceholders(d("device", "productIntro"))}\`;`,
    "    case \"garden\":",
    `      return \`${normPlaceholders(d("garden", "productIntro"))}\`;`,
    "    case \"auto\":",
    `      return \`${normPlaceholders(d("autodoplnky", "productIntro"))}\`;`,
    "    case \"fashion\":",
    `      return \`${normPlaceholders(d("fashion", "productIntro"))}\`;`,
    "    case \"home\":",
    `      return \`${normPlaceholders(d("home", "productIntro"))}\`;`,
    "    default:",
    `      return \`${normPlaceholders(d("generic", "productIntro"))}\`;`,
    "  }",
    "}",
    "",
    "function productSubtitleFor(brand: string, niche: NicheType, name: string): string {",
    "  switch (niche) {",
    "    case \"supplement\":",
    `      return \`${normPlaceholders(d("supplement", "productSubtitle"))}\`;`,
    "    case \"device\":",
    `      return \`${normPlaceholders(d("device", "productSubtitle"))}\`;`,
    "    case \"garden\":",
    `      return \`${normPlaceholders(d("garden", "productSubtitle"))}\`;`,
    "    case \"auto\":",
    `      return \`${normPlaceholders(d("autodoplnky", "productSubtitle"))}\`;`,
    "    case \"fashion\":",
    `      return \`${normPlaceholders(d("fashion", "productSubtitle"))}\`;`,
    "    case \"home\":",
    `      return \`${normPlaceholders(d("home", "productSubtitle"))}\`;`,
    "    default:",
    `      return \`${normPlaceholders(d("generic", "productSubtitle"))}\`;`,
    "  }",
    "}",
    "",
    "function productFaqFor(brand: string, niche: NicheType): FaqItem[] {",
    "  switch (niche) {",
    "    case \"supplement\":",
    "      return [",
    writeFaqItems(supplement.productFaqs, "        "),
    "      ];",
    "    case \"device\":",
    "      return [",
    writeFaqItems(device.productFaqs, "        "),
    "      ];",
    "    case \"auto\":",
    "      return [",
    writeFaqItems(auto.productFaqs, "        "),
    "      ];",
    "    case \"fashion\":",
    "      return [",
    writeFaqItems(fashion.productFaqs, "        "),
    "      ];",
    "    default:",
    "      return [",
    writeFaqItems(home.productFaqs, "        "),
    "      ];",
    "  }",
    "}",
    "",
    "export function buildNicheContentPL(slug: string, name: string, shortDesc: string): CategoryContent {",
    "  const d = getCategoryDescriptor(slug);",
    "  const niche = getNicheType(slug);",
    "  const safety = safetyFor(niche);",
    "  return {",
    "    slug,",
    "    nameHi: name,",
    "    taglineHi:",
    "      niche === \"supplement\"",
    `        ? \`${d("supplement", "tagline")}\``,
    "        : niche === \"device\"",
    `        ? \`${d("device", "tagline")}\``,
    "        : niche === \"garden\"",
    `        ? \`${d("garden", "tagline")}\``,
    "        : niche === \"auto\"",
    `        ? \`${d("autodoplnky", "tagline")}\``,
    "        : niche === \"fashion\"",
    `        ? \`${d("fashion", "tagline")}\``,
    `        : \`${d("home", "tagline")}\`,`,
    "    shortDescHi: shortDesc,",
    "    subtitleHi: (b) => productSubtitleFor(b, niche, name),",
    "    productIntro: (b) => productIntroFor(b, niche, name, shortDesc),",
    "    productSections: () => [safety, DELIVERY_PL, QUALITY_PL],",
    "    productFaq: (b) => productFaqFor(b, niche),",
    "    categoryIntroHi: intro(name, shortDesc, niche),",
    "    categorySectionsHi: [",
    "      whatsInsideSection(name, shortDesc, niche),",
    "      howToChooseSection(name, niche),",
    "      DELIVERY_PL,",
    "      safety,",
    "    ],",
    "    categoryFaqHi: nicheFaq(name, niche),",
    "    keywordsHi: keywordsFor(name, d),",
    "  };",
    "}",
    "",
  );

  fs.writeFileSync(path.join(ROOT, "src/lib/niche-content.pl.ts"), lines.join("\n"), "utf8");
}

function shouldRun(key: string, only: string[] | null): boolean {
  if (!only?.length) return true;
  return only.some((o) => key === o || key.endsWith(`:${o}`) || key === `cat:${o}`);
}

function itemsFromEsCache(batchId: string): TextItem[] | null {
  const file = path.join(ES_CACHE_DIR, `${batchId}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { items?: Record<string, string> };
  if (!raw.items) return null;
  return Object.entries(raw.items).map(([key, es]) => ({ key, es }));
}

function mergeWithExtracted(exItems: TextItem[], cached: TextItem[] | null): TextItem[] {
  if (!cached?.length) return exItems;
  const map = Object.fromEntries(cached.map((i) => [i.key, i.es]));
  return exItems.map((i) => ({ key: i.key, es: map[i.key] ?? i.es }));
}

export async function main() {
  loadEnv();
  const { only, dryRun, force } = parseArgs();

  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  const url =
    process.env.AI_GATEWAY_URL ??
    "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";

  if (!apiKey) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }

  console.log("translate-content-pl — batches:", only?.join(",") ?? "all");

  const commonItems = itemsFromEsCache("common") ?? extractCommonItems();
  const catExtracts = Object.keys(CAT_VARS).map(extractCategory);
  const newCatItems = itemsFromEsCache("new-categories") ?? extractNewCategoryItems();
  const nicheTypes: NicheType[] = [
    "supplement",
    "device",
    "garden",
    "autodoplnky",
    "home",
    "fashion",
    "generic",
  ];
  const nicheExtracts = Object.fromEntries(
    nicheTypes.map((n) => [n, extractNicheItems(n)]),
  ) as Record<NicheType, TextItem[]>;

  if (dryRun) {
    console.log("dry-run — items:", {
      common: commonItems.length,
      categories: catExtracts.map((c) => c.items.length),
      newCategories: newCatItems.length,
      niches: Object.fromEntries(nicheTypes.map((n) => [n, nicheExtracts[n].length])),
    });
    return;
  }

  const common =
    shouldRun("common", only)
      ? await translateWithRetry("common", commonItems, apiKey, url, model, force)
      : JSON.parse(fs.readFileSync(path.join(CACHE_DIR, "common.json"), "utf8")).items;

  const categories: Record<string, Record<string, string>> = {};
  for (const ex of catExtracts) {
    const batchId = `cat-${ex.slug}`;
    if (!shouldRun(batchId, only) && !shouldRun(ex.slug, only)) continue;
    const items = mergeWithExtracted(ex.items, itemsFromEsCache(batchId));
    categories[ex.slug] = await translateWithRetry(
      batchId,
      items,
      apiKey,
      url,
      model,
      force,
      `Kategorija zdravje/proizvod: ${ex.slug}`,
    );
  }

  const newCats = shouldRun("new-categories", only)
    ? await translateWithRetry(
        "new-categories",
        newCatItems,
        apiKey,
        url,
        model,
        force,
        "Krótkie nazwy kategorii dla sklepu Polska",
      )
    : JSON.parse(fs.readFileSync(path.join(CACHE_DIR, "new-categories.json"), "utf8")).items;

  const nicheData = {} as Record<NicheType, Record<string, string>>;
  for (const niche of nicheTypes) {
    const batchId = `niche-${niche}`;
    if (!shouldRun(batchId, only) && !shouldRun(niche, only)) {
      nicheData[niche] = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, `${batchId}.json`), "utf8"),
      ).items;
      continue;
    }
    const nicheItems = itemsFromEsCache(batchId) ?? nicheExtracts[niche];
    nicheData[niche] = await translateWithRetry(
      batchId,
      nicheItems,
      apiKey,
      url,
      model,
      force,
      `Treść niszy: ${niche} (Polska, płatność przy odbiorze)`,
    );
  }

  writeContentSl(common, categories, newCats, catExtracts);
  writeNicheSl(nicheData);
  console.log("Written src/lib/content.pl.ts and src/lib/niche-content.pl.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
