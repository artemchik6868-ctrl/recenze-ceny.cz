/** Map detected product facts to Slovenian labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const SL_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "naprava",
    required: ["naprava"],
    notes: ["Elektronska naprava; opiši funkcije, zaslon in napajanje. Ni prehransko dopolnilo niti zdravilo."],
  },
  cream: { form: "krema", required: ["krema"], notes: ["Krema za zunanjo uporabo; ne zamenjuj s kapsulami ali tabletami."] },
  ointment: { form: "mast", required: ["mast"], notes: ["Mast za zunanjo uporabo."] },
  balm: { form: "balzam", required: ["balzam"], notes: ["Balzam za zunanjo ali lokalno uporabo."] },
  serum: { form: "serum", required: ["serum"], notes: ["Kozmetični serum."] },
  shampoo: { form: "šampon", required: ["šampon"], notes: ["Šampon za lase."] },
  gel: { form: "gel", required: ["gel"], notes: ["Gel za zunanjo ali lokalno uporabo."] },
  spray: { form: "spray", required: ["spray"], notes: ["Spray; navedi način uporabe."] },
  drops: { form: "kapljice", required: ["kapljice"], notes: ["Kapljice; navedi način jemanja iz feeda."] },
  patch: { form: "obliž", required: ["obliž"], notes: ["Transdermalni obliž / patch."] },
  capsules: {
    form: "kapsule",
    required: ["kapsule"],
    notes: ["Kapsule za peroralno uporabo; opiši sestavo in režim jemanja. Ne imenuj kreme ali gela."],
  },
  tablets: {
    form: "tablete",
    required: ["tablete"],
    notes: ["Tablete za peroralno uporabo; opiši sestavo in režim jemanja."],
  },
  sachet: { form: "vrečice", required: ["vrečice"], notes: ["Enodozne vrečice."] },
  ampoules: { form: "ampule", required: ["ampule"], notes: ["Ampule; navedi način uporabe iz feeda."] },
  powder: { form: "prašek", required: ["prašek"], notes: ["Prašek za raztapljanje ali mešanje."] },
  syrup: { form: "sirup", required: ["sirup"], notes: ["Sirup za peroralno uporabo."] },
  tea: { form: "čaj", required: ["čaj"], notes: ["Čaj / infuzija."] },
  orthopedic: { form: "ortopedski podporni izdelek", required: ["ortoped"], notes: ["Ortopedski podporni izdelek; ni prehransko dopolnilo."] },
  massager: { form: "masažer", required: ["masaž"], notes: ["Masažer; opiši funkcije in napajanje."] },
  cosmetic: { form: "kozmetični izdelek", required: ["kozmet"], notes: ["Kozmetični izdelek za zunanjo uporabo."] },
  eye_care: { form: "izdelek za nego oči", required: ["oči"], notes: ["Izdelek za nego oči; upoštevaj obliko iz feeda."] },
  generic_item: { form: "izdelek", required: [], notes: ["Gospodinjski / praktičen izdelek; ni prehransko dopolnilo niti zdravilo."] },
  unknown: { form: "izdelek", required: [], notes: ["Opiši po feedu brez izmišljanja zdravstvenih trditev."] },
};

const GENERIC_SL: Record<string, string> = {
  сумка: "torba",
  сумку: "torba",
  рюкзак: "nahrbtnik",
  очиститель: "čistilo",
  светильник: "svetilka",
  проигрыватель: "gramofon",
  пылесос: "sesalnik",
  инструмент: "orodje",
  товар: "izdelek",
};

function slovenianizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_SL)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function requiredTermsSl(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const sl = czechizeProductFacts(facts);
  return sl.requiredTermsUk;
}

function factsNotesSl(facts: ProductFacts): string[] {
  const sl = czechizeProductFacts(facts);
  return sl.notesUk;
}

export function buildFactsBlockSl(facts: ProductFacts): string {
  if (facts.kind === "unknown") return "";
  const slFacts = czechizeProductFacts(facts);
  const required = requiredTermsSl(slFacts).join(", ") || "—";
  const notes = factsNotesSl(slFacts).map((n) => `- ${n}`).join("\n");
  return `================ DEJSTVA O IZDELKU (NAJVIŠJA PRIORITETA) ================
Dejanska oblika izdelka: ${slFacts.formLabelUk}
Besede, ki morajo biti v besedilu: ${required}
${notes}`;
}

/** Slovenian physical-form label for ProductSpecs and display titles. */
export function formLabelSl(facts: ProductFacts): string {
  return czechizeProductFacts(facts).formLabelUk || "izdelek";
}

export function czechizeProductFacts(facts: ProductFacts): ProductFacts {
  const sl = SL_BY_KIND[facts.kind];
  const formSl = (sl?.form ?? slovenianizeTerm(facts.formLabelUk)) || "izdelek";
  const requiredSl =
    sl?.required && sl.required.length > 0
      ? sl.required
      : facts.requiredTermsUk.map(slovenianizeTerm).filter(Boolean);
  const notesSl =
    sl?.notes ??
    [
      `Izdelek v obliki «${formSl}»; piši v slovenščini po feedu, brez nepodprtih zdravstvenih obljub.`,
    ];
  return {
    ...facts,
    formLabelUk: formSl,
    formLabelRu: formSl,
    requiredTermsUk: requiredSl,
    requiredTermsRu: requiredSl,
    notesUk: notesSl,
    notesRu: notesSl,
  };
}

export const WATER_PHRASES_SL = [
  "učinkovita rešitev",
  "celovita podpora",
  "podpora organizmu",
  "splošna podpora",
  "občutljivo stanje",
  "moderna formula",
  "inovativna formula",
  "edinstven izdelek",
  "naravna formula",
  "skrb za zdravje",
  "podpora zdravju",
  "moška vitalnost",
  "moško zdravje",
  "splošno dobro počutje",
  "splošna kondicija",
  "kakovost življenja",
  "naravno ravnovesje",
  "celovito delovanje",
];
