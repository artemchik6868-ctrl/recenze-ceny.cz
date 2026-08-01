/** Map detected product facts to Italian labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const IT_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "dispositivo",
    required: ["dispositivo"],
    notes: ["È un dispositivo elettronico; descrivi funzioni, display, alimentazione. Non è integratore né farmaco."],
  },
  cream: { form: "crema", required: ["crema"], notes: ["Crema per uso esterno; non confondere con capsule o compresse."] },
  ointment: { form: "unguento", required: ["unguento"], notes: ["Unguento per uso esterno."] },
  balm: { form: "balsamo", required: ["balsamo"], notes: ["Balsamo per uso esterno o locale."] },
  serum: { form: "siero", required: ["siero"], notes: ["Siero cosmetico."] },
  shampoo: { form: "shampoo", required: ["shampoo"], notes: ["Shampoo per capelli."] },
  gel: { form: "gel", required: ["gel"], notes: ["Gel per uso esterno o locale."] },
  spray: { form: "spray", required: ["spray"], notes: ["Spray; indica modalità d'uso."] },
  drops: { form: "gocce", required: ["gocce"], notes: ["Gocce; indica via di somministrazione dal feed."] },
  patch: { form: "cerotto", required: ["cerotto"], notes: ["Cerotto / patch transdermica."] },
  capsules: {
    form: "capsule",
    required: ["capsule"],
    notes: ["Capsule per uso orale; descrivi composizione e schema di assunzione. Non chiamarlo crema o gel."],
  },
  tablets: {
    form: "compresse",
    required: ["compresse"],
    notes: ["Compresse per uso orale; descrivi composizione e schema di assunzione."],
  },
  sachet: { form: "bustine", required: ["bustine"], notes: ["Bustine monodose."] },
  ampoules: { form: "fiale", required: ["fiale"], notes: ["Fiale; indica modalità d'uso dal feed."] },
  powder: { form: "polvere", required: ["polvere"], notes: ["Polvere da sciogliere o miscelare."] },
  syrup: { form: "sciroppo", required: ["sciroppo"], notes: ["Sciroppo per uso orale."] },
  tea: { form: "tè", required: ["tè"], notes: ["Tè / infuso."] },
  orthopedic: { form: "supporto ortopedico", required: ["ortopedic"], notes: ["Supporto ortopedico; non è integratore."] },
  massager: { form: "massaggiatore", required: ["massaggi"], notes: ["Massaggiatore; descrivi funzioni e alimentazione."] },
  cosmetic: { form: "cosmetico", required: ["cosmetico"], notes: ["Prodotto cosmetico per uso esterno."] },
  eye_care: { form: "prodotto per occhi", required: ["occhi"], notes: ["Prodotto per la cura degli occhi; rispetta la forma dal feed."] },
  generic_item: { form: "prodotto", required: [], notes: ["Articolo domestico / pratico; non integratore né farmaco."] },
  unknown: { form: "prodotto", required: [], notes: ["Descrivi in base al feed senza inventare proprietà mediche."] },
};

const GENERIC_IT: Record<string, string> = {
  сумка: "borsa",
  сумку: "borsa",
  рюкзак: "zaino",
  очиститель: "pulitore",
  светильник: "lampada",
  проигрыватель: "giradischi",
  пылесос: "aspirapolvere",
  инструмент: "attrezzo",
  товар: "prodotto",
};

function italianizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_IT)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function italianizeProductFacts(facts: ProductFacts): ProductFacts {
  const it = IT_BY_KIND[facts.kind];
  const formIt = (it?.form ?? italianizeTerm(facts.formLabelUk)) || "prodotto";
  const requiredIt =
    it?.required && it.required.length > 0
      ? it.required
      : facts.requiredTermsUk.map(italianizeTerm).filter(Boolean);
  const notesIt =
    it?.notes ??
    [
      `Prodotto in forma «${formIt}»; descrivi in italiano in base al feed, senza promesse mediche non supportate.`,
    ];
  return {
    ...facts,
    formLabelUk: formIt,
    formLabelRu: formIt,
    requiredTermsUk: requiredIt,
    requiredTermsRu: requiredIt,
    notesUk: notesIt,
    notesRu: notesIt,
  };
}

export const WATER_PHRASES_IT = [
  "soluzione efficace",
  "supporto completo",
  "supporto dell'organismo",
  "supporto generale",
  "stato delicato",
  "soluzione moderna",
  "formula innovativa",
  "prodotto unico",
  "formula naturale",
  "cura della salute",
  "supporto della salute",
  "vitalità maschile",
  "salute maschile",
  "benessere generale",
  "tono generale",
  "qualità della vita",
  "equilibrio naturale",
  "azione complessa",
];
