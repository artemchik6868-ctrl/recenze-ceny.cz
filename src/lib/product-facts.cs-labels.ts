/** Map detected product facts to Czech labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const CS_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "zařízení",
    required: ["zařízení"],
    notes: [
      "Elektronické zařízení; popište funkce, displej a napájení. Není to doplněk stravy ani lék.",
    ],
  },
  cream: {
    form: "krém",
    required: ["krém"],
    notes: [
      "Krém k vnějšímu použití; nezaměňujte s kapslemi nebo tabletami.",
      "U kloubních produktů: místní aplikace — nepopisujte jako doplněk stravy k užití perorálně.",
    ],
  },
  ointment: { form: "mast", required: ["mast"], notes: ["Mast k vnějšímu použití."] },
  balm: { form: "balzám", required: ["balzám"], notes: ["Balzám k vnějšímu nebo místnímu použití."] },
  serum: { form: "sérum", required: ["sérum"], notes: ["Kosmetické sérum."] },
  shampoo: { form: "šampon", required: ["šampon"], notes: ["Vlasový šampon."] },
  gel: {
    form: "gel",
    required: ["gel"],
    notes: [
      "Gel k vnějšímu nebo místnímu použití.",
      "U kloubních produktů: nanést a vmasírovat — nepopisujte jako doplněk stravy k užití perorálně.",
    ],
  },
  spray: { form: "sprej", required: ["sprej"], notes: ["Sprej; upřesněte způsob aplikace."] },
  drops: {
    form: "kapky",
    required: ["kapky"],
    notes: [
      "Kapky; převezměte způsob užívání z feedu.",
      "U kontroly hmotnosti (W-Loss, Abslim): kapky do vody — ne kapsle.",
    ],
  },
  patch: { form: "náplast", required: ["náplast"], notes: ["Transdermální náplast."] },
  capsules: {
    form: "kapsle",
    required: ["kapsle"],
    notes: ["Kapsle k perorálnímu užití; popište složení a dávkování. Nezmiňujte krém ani gel."],
  },
  tablets: {
    form: "tablety",
    required: ["tablety"],
    notes: ["Tablety k perorálnímu užití; popište složení a dávkování."],
  },
  sachet: { form: "sáčky", required: ["sáčky"], notes: ["Jednorázové sáčky."] },
  ampoules: { form: "ampule", required: ["ampule"], notes: ["Ampule; aplikace podle feedu."] },
  powder: { form: "prášek", required: ["prášek"], notes: ["Prášek k rozpouštění nebo míchání."] },
  syrup: { form: "sirup", required: ["sirup"], notes: ["Sirup k perorálnímu užití."] },
  tea: { form: "čaj", required: ["čaj"], notes: ["Čaj / nálev."] },
  orthopedic: {
    form: "ortopedický produkt",
    required: ["ortoped"],
    notes: ["Ortopedická pomůcka; není doplněk stravy."],
  },
  massager: {
    form: "masážní přístroj",
    required: ["masáž"],
    notes: ["Masážní přístroj; popište funkce a napájení."],
  },
  cosmetic: {
    form: "kosmetický produkt",
    required: ["kosmetik"],
    notes: ["Kosmetický produkt k vnějšímu použití."],
  },
  eye_care: {
    form: "produkt pro péči o oči",
    required: ["oči"],
    notes: ["Produkt pro péči o oči; respektujte formu uvedenou ve feedu."],
  },
  generic_item: {
    form: "produkt",
    required: [],
    notes: ["Domácí nebo praktický produkt; není doplněk stravy ani lék."],
  },
  unknown: {
    form: "produkt",
    required: [],
    notes: ["Popište podle feedu bez vymyšlených zdravotních tvrzení."],
  },
};

const GENERIC_CS: Record<string, string> = {
  сумка: "taška",
  сумку: "taška",
  рюкзак: "batoh",
  очиститель: "čistič",
  светильник: "lampa",
  проигрыватель: "přehrávač",
  пылесос: "vysavač",
  инструмент: "nástroj",
  товар: "produkt",
};

function czechizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_CS)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function requiredTermsHu(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const cs = czechizeProductFacts(facts);
  return cs.requiredTermsUk;
}

/** @deprecated use requiredTermsHu */
export const requiredTermsBg = requiredTermsHu;
/** @deprecated use requiredTermsHu */
export const requiredTermsRo = requiredTermsHu;
/** @deprecated use requiredTermsBg */
export const requiredTermsSl = requiredTermsBg;
/** @deprecated use requiredTermsBg */
export const requiredTermsPl = requiredTermsBg;

function factsNotesBg(facts: ProductFacts): string[] {
  return czechizeProductFacts(facts).notesUk;
}

const UNKNOWN_FORM_GUIDANCE = `================ FORMA Z FEEDU (priorita) ================
Hledejte formu ve feedu a v landing title, nehádejte.
kapljice / drops / kapi / kapky → kapky | kapsule / capsule → kapsle | čaj / tea → čaj | spray / sprej → sprej
Příklad DOBŘE: W-Loss (hubnutí) → kapky pro kontrolu hmotnosti
Příklad DOBŘE: Abslim (hubnutí) → kapky pro kontrolu hmotnosti
Příklad DOBŘE: Hondro Sol (spray) → sprej pro klouby nebo sprej na hallux valgus
Příklad DOBŘE: Promicil → krém proti plísním nehtů
Příklad DOBŘE: Removio → gel proti bradavicím
Příklad DOBŘE: InsuLevel / Balansulin → doplněk stravy pro hladinu cukru v krvi
Příklad ŠPATNĚ: W-Loss / Abslim → kapsle (forma není ve feedu)
Příklad ŠPATNĚ: Hondro Sol → kapsle, pokud feed uvádí sprej
Příklad ŠPATNĚ: Promicil / Removio → kapsle, pokud feed uvádí krém/gel
Příklad ŠPATNĚ: InsuLevel → trávení, pokud feed odkazuje na cukrovku/cukr v krvi
Shakes weight-management (W-Loss, Abslim) → obvykle kapky, ne kapsle.
Pokud forma není jasná: «produkt» + způsob užívání z feedu — nepředpokládejte automaticky kapsle.`;

export function buildFactsBlockBg(facts: ProductFacts): string {
  if (facts.kind === "unknown") return UNKNOWN_FORM_GUIDANCE;
  const csFacts = czechizeProductFacts(facts);
  const required = requiredTermsBg(csFacts).join(", ") || "—";
  const notes = factsNotesBg(csFacts)
    .map((n) => `- ${n}`)
    .join("\n");
  return `================ FAKTA O PRODUKTU (NEJVYŠŠÍ PRIORITA) ================
Skutečná forma produktu: ${csFacts.formLabelUk}
Povinná slova v textu: ${required}
${notes}`;
}

/** @deprecated use buildFactsBlockBg */
export const buildFactsBlockRo = buildFactsBlockBg;
/** @deprecated use buildFactsBlockBg */
export const buildFactsBlockSl = buildFactsBlockBg;
/** @deprecated use buildFactsBlockBg */
export const buildFactsBlockPl = buildFactsBlockBg;

export function formLabelBg(facts: ProductFacts): string {
  return czechizeProductFacts(facts).formLabelUk || "produkt";
}

/** @deprecated use formLabelBg */
export const formLabelRo = formLabelBg;
/** @deprecated use formLabelBg */
export const formLabelSl = formLabelBg;
/** @deprecated use formLabelBg */
export const formLabelPl = formLabelBg;

export function czechizeProductFacts(facts: ProductFacts): ProductFacts {
  const cs = CS_BY_KIND[facts.kind];
  const formCs = (cs?.form ?? czechizeTerm(facts.formLabelUk)) || "produkt";
  const requiredCs =
    cs?.required && cs.required.length > 0
      ? cs.required
      : facts.requiredTermsUk.map(czechizeTerm).filter(Boolean);
  const notesCs =
    cs?.notes ??
    [`Produkt ve formě «${formCs}»; pište česky podle feedu, bez nepodložených slibů.`];
  return {
    ...facts,
    formLabelUk: formCs,
    formLabelRu: formCs,
    requiredTermsUk: requiredCs,
    requiredTermsRu: requiredCs,
    notesUk: notesCs,
    notesRu: notesCs,
  };
}

export const WATER_PHRASES_CS = [
  "účinné řešení",
  "komplexní podpora",
  "podpora organismu",
  "obecná podpora",
  "citlivý stav",
  "moderní formule",
  "inovativní formule",
  "jedinečný produkt",
  "přírodní formule",
  "pečující o zdraví",
  "podpora zdraví",
  "potence a libido",
  "mužské zdraví",
  "celková pohoda",
  "obecný stav",
  "kvalita života",
  "přirozená rovnováha",
  "komplexní účinek",
];
