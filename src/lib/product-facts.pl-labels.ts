/** Map detected product facts to Polish labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const PL_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "urządzenie",
    required: ["urządzenie"],
    notes: ["Urządzenie elektroniczne; opisz funkcje, ekran i zasilanie. Nie jest suplementem diety ani lekiem."],
  },
  cream: { form: "krem", required: ["krem"], notes: ["Krem do stosowania zewnętrznego; nie zamieniaj z kapsułkami ani tabletkami."] },
  ointment: { form: "maść", required: ["maść"], notes: ["Maść do stosowania zewnętrznego."] },
  balm: { form: "balsam", required: ["balsam"], notes: ["Balsam do stosowania zewnętrznego lub miejscowego."] },
  serum: { form: "serum", required: ["serum"], notes: ["Serum kosmetyczne."] },
  shampoo: { form: "szampon", required: ["szampon"], notes: ["Szampon do włosów."] },
  gel: { form: "żel", required: ["żel"], notes: ["Żel do stosowania zewnętrznego lub miejscowego."] },
  spray: { form: "spray", required: ["spray"], notes: ["Spray; podaj sposób użycia."] },
  drops: { form: "krople", required: ["krople"], notes: ["Krople; podaj sposób przyjmowania z feedu."] },
  patch: { form: "plaster", required: ["plaster"], notes: ["Plaster transdermalny / patch."] },
  capsules: {
    form: "kapsułki",
    required: ["kapsułki"],
    notes: ["Kapsułki doustne; opisz skład i schemat dawkowania. Nie nazywaj kremu ani żelu."],
  },
  tablets: {
    form: "tabletki",
    required: ["tabletki"],
    notes: ["Tabletki doustne; opisz skład i schemat dawkowania."],
  },
  sachet: { form: "saszetki", required: ["saszetki"], notes: ["Saszetki jednorazowe."] },
  ampoules: { form: "ampułki", required: ["ampułki"], notes: ["Ampułki; podaj sposób użycia z feedu."] },
  powder: { form: "proszek", required: ["proszek"], notes: ["Proszek do rozpuszczenia lub mieszania."] },
  syrup: { form: "syrop", required: ["syrop"], notes: ["Syrop doustny."] },
  tea: { form: "herbata", required: ["herbata"], notes: ["Herbata / napar."] },
  orthopedic: { form: "produkt ortopedyczny", required: ["ortoped"], notes: ["Produkt wspierający ortopedycznie; nie jest suplementem diety."] },
  massager: { form: "masażer", required: ["masaż"], notes: ["Masażer; opisz funkcje i zasilanie."] },
  cosmetic: { form: "produkt kosmetyczny", required: ["kosmetyk"], notes: ["Produkt kosmetyczny do stosowania zewnętrznego."] },
  eye_care: { form: "produkt do pielęgnacji oczu", required: ["oczy"], notes: ["Produkt do pielęgnacji oczu; uwzględnij formę z feedu."] },
  generic_item: { form: "produkt", required: [], notes: ["Produkt gospodarstwa domowego / praktyczny; nie jest suplementem diety ani lekiem."] },
  unknown: { form: "produkt", required: [], notes: ["Opisz według feedu bez wymyślonych twierdzeń zdrowotnych."] },
};

const GENERIC_PL: Record<string, string> = {
  сумка: "torba",
  сумку: "torba",
  рюкзак: "plecak",
  очиститель: "odkurzacz",
  светильник: "lampa",
  проигрыватель: "odtwarzacz",
  пылесос: "odkurzacz",
  инструмент: "narzędzie",
  товар: "produkt",
};

function polishizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_PL)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function requiredTermsPl(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const pl = czechizeProductFacts(facts);
  return pl.requiredTermsUk;
}

/** @deprecated use requiredTermsPl */
export const requiredTermsSl = requiredTermsPl;

function factsNotesPl(facts: ProductFacts): string[] {
  const pl = czechizeProductFacts(facts);
  return pl.notesUk;
}

export function buildFactsBlockPl(facts: ProductFacts): string {
  if (facts.kind === "unknown") return "";
  const plFacts = czechizeProductFacts(facts);
  const required = requiredTermsPl(plFacts).join(", ") || "—";
  const notes = factsNotesPl(plFacts).map((n) => `- ${n}`).join("\n");
  return `================ FAKTY O PRODUKCIE (NAJWYŻSZY PRIORYTET) ================
Rzeczywista forma produktu: ${plFacts.formLabelUk}
Słowa wymagane w tekście: ${required}
${notes}`;
}

/** @deprecated use buildFactsBlockPl */
export const buildFactsBlockSl = buildFactsBlockPl;

/** Polish physical-form label for ProductSpecs and display titles. */
export function formLabelPl(facts: ProductFacts): string {
  return czechizeProductFacts(facts).formLabelUk || "produkt";
}

/** @deprecated use formLabelPl */
export const formLabelSl = formLabelPl;

export function czechizeProductFacts(facts: ProductFacts): ProductFacts {
  const pl = PL_BY_KIND[facts.kind];
  const formPl = (pl?.form ?? polishizeTerm(facts.formLabelUk)) || "produkt";
  const requiredPl =
    pl?.required && pl.required.length > 0
      ? pl.required
      : facts.requiredTermsUk.map(polishizeTerm).filter(Boolean);
  const notesPl =
    pl?.notes ??
    [
      `Produkt w formie «${formPl}»; pisz po polsku według feedu, bez nieuzasadnionych obietnic zdrowotnych.`,
    ];
  return {
    ...facts,
    formLabelUk: formPl,
    formLabelRu: formPl,
    requiredTermsUk: requiredPl,
    requiredTermsRu: requiredPl,
    notesUk: notesPl,
    notesRu: notesPl,
  };
}

export const WATER_PHRASES_PL = [
  "skuteczne rozwiązanie",
  "kompleksowe wsparcie",
  "wsparcie organizmu",
  "ogólne wsparcie",
  "delikatny stan",
  "nowoczesna formuła",
  "innowacyjna formuła",
  "unikalny produkt",
  "naturalna formuła",
  "dbałość o zdrowie",
  "wsparcie zdrowia",
  "męska witalność",
  "męskie zdrowie",
  "ogólne samopoczucie",
  "ogólna kondycja",
  "jakość życia",
  "naturalna równowaga",
  "kompleksowe działanie",
];
