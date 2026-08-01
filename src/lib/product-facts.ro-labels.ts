/** Map detected product facts to Hungarian labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const CS_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "dispozitiv",
    required: ["dispozitiv"],
    notes: [
      "Dispozitiv electronic; descrie funcțiile, afișajul și alimentarea. Nu este supliment alimentar sau medicament.",
    ],
  },
  cream: {
    form: "cremă",
    required: ["cremă"],
    notes: [
      "Cremă pentru aplicare externă; nu confunda cu capsule sau comprimate.",
      "La produse pentru articulații: aplicare topică — nu descrie ca supliment de înghițat.",
    ],
  },
  ointment: { form: "unguent", required: ["unguent"], notes: ["Unguent pentru aplicare externă."] },
  balm: { form: "balsam", required: ["balsam"], notes: ["Balsam pentru aplicare externă sau locală."] },
  serum: { form: "serum", required: ["serum"], notes: ["Ser cosmetic."] },
  shampoo: { form: "șampon", required: ["șampon"], notes: ["Șampon pentru păr."] },
  gel: {
    form: "gel",
    required: ["gel"],
    notes: [
      "Gel pentru aplicare externă sau locală.",
      "La articulații: aplică și masează — nu descrie ca supliment oral.",
    ],
  },
  spray: { form: "spray", required: ["spray"], notes: ["Spray; indică modul de aplicare."] },
  drops: {
    form: "picături",
    required: ["picături"],
    notes: [
      "Picături; preia modul de administrare din feed.",
      "La weight-management (W-Loss, Abslim): picături în apă — nu capsule.",
    ],
  },
  patch: { form: "plasture", required: ["plasture"], notes: ["Plasture transdermic."] },
  capsules: {
    form: "capsule",
    required: ["capsule"],
    notes: ["Capsule de înghițit; descrie compoziția și dozajul. Nu menționa cremă sau gel."],
  },
  tablets: {
    form: "comprimate",
    required: ["comprimate"],
    notes: ["Comprimate de înghițit; descrie compoziția și dozajul."],
  },
  sachet: { form: "plic", required: ["plic"], notes: ["Plicuri individuale."] },
  ampoules: { form: "fiole", required: ["fiole"], notes: ["Fiole; aplicare conform feed-ului."] },
  powder: { form: "pulbere", required: ["pulbere"], notes: ["Pulbere de dizolvat sau amestecat."] },
  syrup: { form: "sirop", required: ["sirop"], notes: ["Sirop de înghițit."] },
  tea: { form: "ceai", required: ["ceai"], notes: ["Ceai / infuzie."] },
  orthopedic: {
    form: "produs ortopedic",
    required: ["ortopedic"],
    notes: ["Dispozitiv ortopedic; nu este supliment alimentar."],
  },
  massager: {
    form: "aparat de masaj",
    required: ["masaj"],
    notes: ["Aparat de masaj; descrie funcțiile și alimentarea."],
  },
  cosmetic: {
    form: "produs cosmetic",
    required: ["cosmetic"],
    notes: ["Produs cosmetic pentru aplicare externă."],
  },
  eye_care: {
    form: "produs pentru ochi",
    required: ["ochi"],
    notes: ["Produs pentru ochi; respectă forma din feed."],
  },
  generic_item: {
    form: "produs",
    required: [],
    notes: ["Produs de uz casnic; nu este supliment alimentar sau medicament."],
  },
  unknown: {
    form: "produs",
    required: [],
    notes: ["Descrie conform feed-ului, fără promisiuni de sănătate nefondate."],
  },
};

const GENERIC_CS: Record<string, string> = {
  сумка: "geantă",
  сумку: "geantă",
  рюкзак: "rucsac",
  очиститель: "detergent",
  светильник: "lampă",
  проигрыватель: "player",
  пылесос: "aspirator",
  инструмент: "unealtă",
  товар: "produs",
};

function czechizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_CS)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function requiredTermsRo(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const ro = czechizeProductFacts(facts);
  return ro.requiredTermsUk;
}

/** @deprecated use requiredTermsRo */
export const requiredTermsSl = requiredTermsRo;
export const requiredTermsPl = requiredTermsRo;

function factsNotesRo(facts: ProductFacts): string[] {
  return czechizeProductFacts(facts).notesUk;
}

const UNKNOWN_FORM_GUIDANCE = `================ FORMĂ DIN FEED (prioritate) ================
Caută forma în feed/titlul landing, nu ghici.
kapljice / drops / kapi / капли → picături | kapsule / capsule → capsule | čaj / tea → ceai | spray / sprej → spray
Exemplu BUN: W-Loss (slăbit) → picături pentru controlul greutății
Exemplu BUN: Abslim (slăbit) → picături pentru controlul greutății
Exemplu BUN: Hondro Sol (spray) → spray pentru articulații sau spray pentru monturi
Exemplu BUN: Promicil → cremă antifungică pentru unghii
Exemplu BUN: Removio → gel pentru papiloame
Exemplu BUN: InsuLevel / Balansulin → supliment pentru glicemie
Exemplu RĂU: W-Loss / Abslim → capsule (forma nu e în feed)
Exemplu RĂU: Hondro Sol → capsule dacă feed-ul spune spray
Exemplu RĂU: Promicil / Removio → capsule dacă feed-ul spune cremă/gel
Exemplu RĂU: InsuLevel → digestie dacă feed-ul menționează diabet/glicemie
Shakes weight-management (W-Loss, Abslim) → de obicei picături, nu capsule
Dacă forma e neclară: «produs» + administrare din feed — nu presupune automat capsule.`;

export function buildFactsBlockRo(facts: ProductFacts): string {
  if (facts.kind === "unknown") return UNKNOWN_FORM_GUIDANCE;
  const roFacts = czechizeProductFacts(facts);
  const required = requiredTermsRo(roFacts).join(", ") || "—";
  const notes = factsNotesRo(roFacts)
    .map((n) => `- ${n}`)
    .join("\n");
  return `================ FAPTE PRODUS (PRIORITATE MAXIMĂ) ================
Forma reală a produsului: ${roFacts.formLabelUk}
Cuvinte obligatorii în text: ${required}
${notes}`;
}

/** @deprecated use buildFactsBlockRo */
export const buildFactsBlockSl = buildFactsBlockRo;
export const buildFactsBlockPl = buildFactsBlockRo;

export function formLabelRo(facts: ProductFacts): string {
  return czechizeProductFacts(facts).formLabelUk || "produs";
}

/** @deprecated use formLabelRo */
export const formLabelSl = formLabelRo;
export const formLabelPl = formLabelRo;

export function czechizeProductFacts(facts: ProductFacts): ProductFacts {
  const ro = CS_BY_KIND[facts.kind];
  const formRo = (ro?.form ?? czechizeTerm(facts.formLabelUk)) || "produs";
  const requiredRo =
    ro?.required && ro.required.length > 0
      ? ro.required
      : facts.requiredTermsUk.map(czechizeTerm).filter(Boolean);
  const notesRo =
    ro?.notes ??
    [`Produs în formă «${formRo}»; scrie în română conform feed-ului, fără promisiuni nefondate.`];
  return {
    ...facts,
    formLabelUk: formRo,
    formLabelRu: formRo,
    requiredTermsUk: requiredRo,
    requiredTermsRu: requiredRo,
    notesUk: notesRo,
    notesRu: notesRo,
  };
}

export const WATER_PHRASES_CS = [
  "soluție eficientă",
  "suport cuprinzător",
  "suport al organismului",
  "suport general",
  "stare delicată",
  "formulă modernă",
  "formulă inovatoare",
  "produs unic",
  "formulă naturală",
  "conștientizare sănătate",
  "suport pentru sănătate",
  "potență și libido",
  "sănătate masculină",
  "stare generală de bine",
  "condiție generală",
  "calitatea vieții",
  "echilibru natural",
  "efect cuprinzător",
];
