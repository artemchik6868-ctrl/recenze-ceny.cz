/** Map detected product facts to German labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const DE_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "Gerät",
    required: ["Gerät"],
    notes: ["Elektronisches Gerät; Funktionen, Display und Stromversorgung beschreiben. Kein Nahrungsergänzungsmittel und kein Medikament."],
  },
  cream: { form: "Creme", required: ["Creme"], notes: ["Creme zur äußerlichen Anwendung; nicht mit Kapseln oder Tabletten verwechseln.", "Bei Gelenkprodukten: topisch auftragen — nicht als Nahrungsergänzungsmittel zum Schlucken beschreiben."] },
  ointment: { form: "Salbe", required: ["Salbe"], notes: ["Salbe zur äußerlichen Anwendung."] },
  balm: { form: "Balsam", required: ["Balsam"], notes: ["Balsam zur äußerlichen oder lokalen Anwendung."] },
  serum: { form: "Serum", required: ["Serum"], notes: ["Kosmetisches Serum."] },
  shampoo: { form: "Shampoo", required: ["Shampoo"], notes: ["Haarshampoo."] },
  gel: { form: "Gel", required: ["Gel"], notes: ["Gel zur äußerlichen oder lokalen Anwendung.", "Bei Gelenkprodukten: Gel auftragen und einmassieren — nicht als Nahrungsergänzungsmittel zum Schlucken beschreiben."] },
  spray: { form: "Spray", required: ["Spray"], notes: ["Spray; Anwendungsweise angeben."] },
  drops: { form: "Tropfen", required: ["Tropfen"], notes: ["Tropfen; Einnahme aus dem Feed übernehmen.", "Bei weight-management (W-Loss, Abslim): Tropfen in Wasser — nicht Kapseln."] },
  patch: { form: "Pflaster", required: ["Pflaster"], notes: ["Transdermales Pflaster / Patch."] },
  capsules: {
    form: "Kapseln",
    required: ["Kapseln"],
    notes: ["Kapseln zum Einnehmen; Zusammensetzung und Dosierung beschreiben. Creme oder Gel nicht erwähnen."],
  },
  tablets: {
    form: "Tabletten",
    required: ["Tabletten"],
    notes: ["Tabletten zum Einnehmen; Zusammensetzung und Dosierung beschreiben."],
  },
  sachet: { form: "Beutel", required: ["Beutel"], notes: ["Einzelbeutel."] },
  ampoules: { form: "Ampullen", required: ["Ampullen"], notes: ["Ampullen; Anwendung aus dem Feed übernehmen."] },
  powder: { form: "Pulver", required: ["Pulver"], notes: ["Pulver zum Auflösen oder Mischen."] },
  syrup: { form: "Sirup", required: ["Sirup"], notes: ["Sirup zum Einnehmen."] },
  tea: { form: "Tee", required: ["Tee"], notes: ["Tee / Aufguss."] },
  orthopedic: { form: "Orthopädieprodukt", required: ["Orthopädie"], notes: ["Orthopädisches Hilfsmittel; kein Nahrungsergänzungsmittel."] },
  massager: { form: "Massagegerät", required: ["Massage"], notes: ["Massagegerät; Funktionen und Stromversorgung beschreiben."] },
  cosmetic: { form: "Kosmetikprodukt", required: ["Kosmetik"], notes: ["Kosmetikprodukt zur äußerlichen Anwendung."] },
  eye_care: { form: "Augenpflegeprodukt", required: ["Augen"], notes: ["Augenpflegeprodukt; Form aus dem Feed berücksichtigen."] },
  generic_item: { form: "Produkt", required: [], notes: ["Haushalts- oder Gebrauchsprodukt; kein Nahrungsergänzungsmittel und kein Medikament."] },
  unknown: { form: "Produkt", required: [], notes: ["Nach Feed beschreiben, ohne erfundene Gesundheitsversprechen."] },
};

const GENERIC_DE: Record<string, string> = {
  сумка: "Tasche",
  сумку: "Tasche",
  рюкзак: "Rucksack",
  очиститель: "Reiniger",
  светильник: "Leuchte",
  проигрыватель: "Player",
  пылесос: "Staubsauger",
  инструмент: "Werkzeug",
  товар: "Produkt",
};

function germanizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_DE)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function requiredTermsPl(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const de = czechizeProductFacts(facts);
  return de.requiredTermsUk;
}

/** @deprecated use requiredTermsPl */
export const requiredTermsSl = requiredTermsPl;

function factsNotesPl(facts: ProductFacts): string[] {
  const de = czechizeProductFacts(facts);
  return de.notesUk;
}

const UNKNOWN_FORM_GUIDANCE = `================ FORM AUS FEED (Priorität) ================
Form im Feed/Landing-Titel suchen, nicht erraten.
kapljice / drops / kapi / капли → Tropfen | kapsule / capsule → Kapseln | čaj / tea → Tee | spray / sprej → Spray
Beispiel GUT: W-Loss (Abnehmen) → Tropfen zur Gewichtskontrolle
Beispiel GUT: Abslim (Abnehmen) → Tropfen zur Gewichtskontrolle
Beispiel GUT: Hondro Sol (spray) → Spray für die Gelenke oder Spray bei Hallux valgus
Beispiel GUT: Promicil → Creme gegen Nagelpilz
Beispiel GUT: Removio → Gel gegen Papillome
Beispiel GUT: InsuLevel / Balansulin → NEM zur Blutzuckerregulierung
Beispiel SCHLECHT: W-Loss / Abslim → Kapseln (Form nicht im Feed)
Beispiel SCHLECHT: Hondro Sol → Kapseln/NEM wenn Feed Spray nennt
Beispiel SCHLECHT: Promicil / Removio → Kapseln wenn Feed Creme/Gel nennt
Beispiel SCHLECHT: InsuLevel → Verdauung wenn Feed Blutzucker/Diabetes nennt
Shakes weight-management (W-Loss, Abslim) → meist Tropfen, nicht Kapseln
Wenn Form unklar: «Mittel» + Einnahme aus Feed — nicht automatisch Kapseln.`;

export function buildFactsBlockPl(facts: ProductFacts): string {
  if (facts.kind === "unknown") return UNKNOWN_FORM_GUIDANCE;
  const deFacts = czechizeProductFacts(facts);
  const required = requiredTermsPl(deFacts).join(", ") || "—";
  const notes = factsNotesPl(deFacts).map((n) => `- ${n}`).join("\n");
  return `================ PRODUKTFAKTEN (HÖCHSTE PRIORITÄT) ================
Tatsächliche Produktform: ${deFacts.formLabelUk}
Pflichtwörter im Text: ${required}
${notes}`;
}

/** @deprecated use buildFactsBlockPl */
export const buildFactsBlockSl = buildFactsBlockPl;

/** German physical-form label for ProductSpecs and display titles. */
export function formLabelPl(facts: ProductFacts): string {
  return czechizeProductFacts(facts).formLabelUk || "Produkt";
}

/** @deprecated use formLabelPl */
export const formLabelSl = formLabelPl;

export function czechizeProductFacts(facts: ProductFacts): ProductFacts {
  const de = DE_BY_KIND[facts.kind];
  const formDe = (de?.form ?? germanizeTerm(facts.formLabelUk)) || "Produkt";
  const requiredDe =
    de?.required && de.required.length > 0
      ? de.required
      : facts.requiredTermsUk.map(germanizeTerm).filter(Boolean);
  const notesDe =
    de?.notes ??
    [
      `Produkt in Form «${formDe}»; auf Deutsch nach Feed schreiben, ohne unbegründete Gesundheitsversprechen.`,
    ];
  return {
    ...facts,
    formLabelUk: formDe,
    formLabelRu: formDe,
    requiredTermsUk: requiredDe,
    requiredTermsRu: requiredDe,
    notesUk: notesDe,
    notesRu: notesDe,
  };
}

export const WATER_PHRASES_DE = [
  "wirksame Lösung",
  "umfassende Unterstützung",
  "Unterstützung des Organismus",
  "allgemeine Unterstützung",
  "empfindlicher Zustand",
  "moderne Formel",
  "innovative Formel",
  "einzigartiges Produkt",
  "natürliche Formel",
  "Gesundheitsbewusstsein",
  "Gesundheitsunterstützung",
  "Potenz und Libido",
  "männliche Gesundheit",
  "allgemeines Wohlbefinden",
  "allgemeine Kondition",
  "Lebensqualität",
  "natürliches Gleichgewicht",
  "umfassende Wirkung",
];
