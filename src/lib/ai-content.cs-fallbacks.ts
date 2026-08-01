/** Czech fallback content when AI/QA fails. */

import { getCategoryDescriptor } from "./category-descriptors.cs";
import { normalizeProductTitle } from "./brand-clean";
import { pickCzechCities } from "./ai-content.cs-prompts";
import { deliveryH2For } from "./pdp-variants";
import { czechizeProductFacts } from "./product-facts.cs-labels";
import type { ProductFacts } from "./product-facts";

type FallbackContent = {
  display_title: string;
  title: string;
  subtitle: string;
  meta_desc: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
  description_html: string;
};

type FallbackCtx = { categorySlug: string; formKind: string };

export const CS_PLACEHOLDER_MARKERS = [
  "dostepny do zamowienia",
  "produkt kosmetyczny",
  "zweck und produktform",
  "zusammensetzung und wirkungsweise",
  "haufig gestellte fragen",
] as const;

const SKLAD_BY_CATEGORY: Record<string, string[]> = {
  diabetes: ["extrakt gurmaru", "pískavice řecká", "skořice", "chrom"],
  "krevni-tlak": ["magnézium", "draslík", "ibišek", "passiflora"],
  "joint-health": ["glukosamin", "chondroitin", "MSM", "kolagen typu II"],
  "weight-loss": ["zelený čaj", "L-karnitin", "chrom", "skořice"],
  "prostata": ["saw palmetto", "zinek", "selen", "dýně"],
  "potence": ["L-arginin", "zinek", "žen-šen", "maca"],
  hemoroidy: ["aescin", "heparinoid", "alantoin", "heřmánek"],
  "vypadavani-vlasu": ["biotin", "zinek", "kopřiva", "cystein"],
  "sleep-stress": ["melatonin", "kočičí dráp", "passiflora", "magnézium"],
};

function skladHtml(categorySlug: string): string {
  const items =
    SKLAD_BY_CATEGORY[categorySlug] ??
    ["rostlinné extrakty", "vitamíny skupiny B", "minerály", "antioxidanty"];
  const lis = items
    .map((i) => `<li><strong>${i.charAt(0).toUpperCase() + i.slice(1)}</strong> — složka ve formulaci</li>`)
    .join("");
  return `<ul>${lis}</ul>`;
}

export function csPlaceholderFaq(title: string): { q: string; a: string }[] {
  return [
    {
      q: `Mohu diskrétně objednat ${title}?`,
      a: "Ano, objednávka dorazí přímo adresátovi. Poradce si vyžádá jen údaje potřebné pro doručení v České republice.",
    },
    {
      q: "Kdy lze očekávat první účinky?",
      a: "Záleží na jednotlivci a pravidelném používání. Pro stabilní výsledek dodržujte návod k produktu.",
    },
    {
      q: "Jsou nějaké vedlejší účinky?",
      a: "Produkt je obvykle dobře snášen; při chronickém onemocnění nebo užívání léků se poraďte s lékařem.",
    },
    {
      q: "Jak mohu zaplatit objednávku?",
      a: "Platba na dobírku po celé České republice podle potvrzení poradce.",
    },
    {
      q: `Jak dlouho trvá doručení ${title}?`,
      a: "Obvykle 2–5 pracovních dnů kurýrem po celé České republice po potvrzení objednávky. Platba na dobírku — bez zálohy.",
    },
  ];
}

export function csPlaceholderHtml(title: string, ctx: FallbackCtx): string {
  const cities = pickCzechCities(title.length + ctx.categorySlug.length, 6).join(", ");
  const isMedical =
    ctx.formKind !== "generic_item" && ctx.categorySlug !== "garden" && ctx.categorySlug !== "autodoplnky";
  if (!isMedical) {
    return `<h2>Informace o produktu ${title}</h2><p>${title} — produkt dostupný k objednání v České republice. Poradce potvrdí detaily a zajistí doručení na dobírku.</p><h2>Jak objednat v České republice</h2><p>Doručení po celé ČR: ${cities} a další města. Originální produkt od distributora.</p><h2>Poznámka</h2><p>Popis vychází z feed dat. Před objednávkou si u poradce ověřte vlastnosti (materiál, velikost, balení).</p>`;
  }
  return `<h2>Informace o produktu ${title}</h2><p>${title} — dostupné v České republice s kurýrním doručením a platbou na dobírku.</p><h2>Doručení v České republice</h2><p>${cities} a další města. Platba při převzetí.</p><h2>Upozornění</h2><p>Doplněk stravy nebo kosmetický produkt, ne lék. Výsledky jsou individuální. V případě potřeby se poraďte s lékařem.</p>`;
}

export function csSupplementCategoryFallback(
  categorySlug: string,
  facts: ProductFacts,
  displayTitle: string,
  seed = 0,
): FallbackContent {
  const d = getCategoryDescriptor(categorySlug);
  const brand = normalizeProductTitle(displayTitle) || displayTitle;
  const title = displayTitle || brand;
  const csFacts = czechizeProductFacts(facts);
  const form = csFacts.formLabelUk || "doplněk stravy";
  const cities = pickCzechCities(seed, 6).join(", ");
  const problem = (d?.problem ?? "").trim();
  const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const subtitle = problem ? cap1(problem) : `${cap1(form)} pro každodenní použití`;
  const meta = subtitle;
  const topical = ["cream", "gel", "balm", "ointment", "spray"].includes(facts.kind);
  const intakeH2 = topical ? "Použití: doporučený režim" : "Užívání: doporučený režim";
  const description_html = [
    `<h2>Účel a forma produktu</h2>`,
    `<p>${title} — ${form}. ${problem ? `${cap1(problem)}.` : ""} Denní podpora v kategorii ${d?.nameHi ?? categorySlug}.</p>`,
    `<p>Produkt pro zákazníky v České republice. Přečtěte si popis produktu a v případě potřeby se poraďte s lékařem.</p>`,
    `<h2>Složení a způsob účinku</h2>`,
    skladHtml(categorySlug),
    `<h2>${intakeH2}</h2>`,
    `<ul><li>Forma: ${form}</li><li>Dodržujte pokyny na obalu</li><li>Nepřekračujte doporučenou dávku</li></ul>`,
    `<h3>Upozornění</h3>`,
    `<ul><li>citlivost na složky</li><li>těhotenství, chronické onemocnění — konzultace s lékařem</li></ul>`,
    `<h2>Proč zvolit tento produkt</h2>`,
    `<p>${title} — jasný fokus v kategorii ${categorySlug}.</p>`,
    `<h2>${deliveryH2For(categorySlug, seed)}</h2>`,
    `<p>Doručení: ${cities} a další města v České republice. Platba na dobírku při převzetí balíku.</p>`,
    `<h2>Důležité před objednávkou</h2>`,
    `<p>Doplněk stravy, ne lék. Výsledky jsou individuální.</p>`,
  ].join("");
  return {
    display_title: title,
    title: title.slice(0, 80),
    subtitle,
    meta_desc: meta,
    intro: "",
    sections: [],
    description_html,
    faq: [
      { q: `Co je ${title}?`, a: `${title} — ${form} v kategorii ${categorySlug}.` },
      { q: `Jak používat ${title}?`, a: `Forma: ${form}. Dodržujte návod výrobce.` },
      {
        q: `Jak objednat ${title} v České republice?`,
        a: "Objednejte na webu — poradce potvrdí adresu a doručení s platbou na dobírku.",
      },
      {
        q: "Je to lék?",
        a: "Ne. Doplněk stravy, ne lék. Při užívání jiných léků se poraďte s lékařem.",
      },
      {
        q: `Mohu diskrétně objednat ${title}?`,
        a: "Ano, objednávka dorazí adresátovi; poradce si vyžádá jen údaje pro doručení.",
      },
    ],
  };
}

export function csGenericFallbackContent(facts: ProductFacts, title: string): FallbackContent {
  const display = normalizeProductTitle(title) || title;
  const csFacts = czechizeProductFacts(facts);
  const form = csFacts.formLabelUk || "produkt";
  const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return {
    display_title: display,
    title: `${cap1(form)} pro každodenní použití`.slice(0, 80),
    subtitle: `${cap1(form)} s jasným fokusem podle názvu produktu`,
    meta_desc: `${cap1(form)} pro praktické použití bez přehnaných slibů`,
    intro: `${display} — domácí produkt v České republice podle feed dat, bez vymyšlených vlastností.`,
    sections: [
      { heading: "Účel", body: `${cap1(form)} podle feedu, bez lékařských slibů.` },
      { heading: "Pro koho", body: "Pro ty, kdo hledají praktický produkt pro každodenní použití." },
      { heading: "Před objednávkou", body: "Ověřte si u poradce fotografie, název a podmínky doručení." },
    ],
    faq: [
      { q: "Na čem popis stojí?", a: "Na názvu a feed datech, bez vymyšlených vlastností." },
      { q: "Proč je text stručný?", a: "Upřednostňujeme přesnost před neověřenými detaily." },
      { q: "Co zkontrolovat před objednávkou?", a: "Fotografie, název, doručení a podmínky na objednávkové stránce." },
      { q: "Je to zdravotnický produkt?", a: "Ne, pokud feed neříká jinak; bez terapeutických slibů." },
    ],
    description_html: "",
  };
}
