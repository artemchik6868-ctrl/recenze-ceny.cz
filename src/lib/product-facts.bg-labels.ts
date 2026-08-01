/** Map detected product facts to Hungarian labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const CS_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "устройство",
    required: ["устройство"],
    notes: [
      "Електронно устройство; опиши функциите, дисплея и захранването. Това не е хранителна добавка и не е лекарство.",
    ],
  },
  cream: {
    form: "крем",
    required: ["крем"],
    notes: [
      "Крем за външно приложение; не го бъркай с капсули или таблетки.",
      "При продукти за стави: локално приложение — не го описвай като орална добавка.",
    ],
  },
  ointment: { form: "унгвент", required: ["унгвент"], notes: ["Унгвент за външно приложение."] },
  balm: { form: "балсам", required: ["балсам"], notes: ["Балсам за външно или локално приложение."] },
  serum: { form: "серум", required: ["серум"], notes: ["Козметичен серум."] },
  shampoo: { form: "шампоан", required: ["шампоан"], notes: ["Шампоан за коса."] },
  gel: {
    form: "гел",
    required: ["гел"],
    notes: [
      "Гел за външно или локално приложение.",
      "При ставни продукти: нанася се и се масажира — не го описвай като орална добавка.",
    ],
  },
  spray: { form: "спрей", required: ["спрей"], notes: ["Спрей; уточни начина на приложение."] },
  drops: {
    form: "капки",
    required: ["капки"],
    notes: [
      "Капки; вземи начина на прием от feed-а.",
      "При контрол на теглото (W-Loss, Abslim): капки във вода — не капсули.",
    ],
  },
  patch: { form: "пластир", required: ["пластир"], notes: ["Трансдермален пластир."] },
  capsules: {
    form: "капсули",
    required: ["капсули"],
    notes: ["Капсули за прием през устата; опиши състава и дозировката. Не споменавай крем или гел."],
  },
  tablets: {
    form: "таблетки",
    required: ["таблетки"],
    notes: ["Таблетки за прием през устата; опиши състава и дозировката."],
  },
  sachet: { form: "пакетче", required: ["пакетче"], notes: ["Индивидуални пакетчета."] },
  ampoules: { form: "ампули", required: ["ампули"], notes: ["Ампули; приложение според фийда."] },
  powder: { form: "прах", required: ["прах"], notes: ["Прах за разтваряне или смесване."] },
  syrup: { form: "сироп", required: ["сироп"], notes: ["Сироп за пиене."] },
  tea: { form: "чай", required: ["чай"], notes: ["Чай / инфузия."] },
  orthopedic: {
    form: "ортопедичен продукт",
    required: ["ортопедичен"],
    notes: ["Ортопедично изделие; не е хранителна добавка."],
  },
  massager: {
    form: "масажен уред",
    required: ["масаж"],
    notes: ["Масажен уред; опиши функциите и захранването."],
  },
  cosmetic: {
    form: "козметичен продукт",
    required: ["козметичен"],
    notes: ["Козметичен продукт за външно приложение."],
  },
  eye_care: {
    form: "продукт за очи",
    required: ["очи"],
    notes: ["Продукт за очи; спазвай формата, посочена във фийда."],
  },
  generic_item: {
    form: "продукт",
    required: [],
    notes: ["Домакински продукт; не е хранителна добавка и не е лекарство."],
  },
  unknown: {
    form: "продукт",
    required: [],
    notes: ["Описвай според feed-а, без недоказани здравни обещания."],
  },
};

const GENERIC_CS: Record<string, string> = {
  сумка: "чанта",
  сумку: "чанта",
  рюкзак: "раница",
  очиститель: "почистващ препарат",
  светильник: "лампа",
  проигрыватель: "плейър",
  пылесос: "прахосмукачка",
  инструмент: "инструмент",
  товар: "продукт",
};

function czechizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_CS)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function requiredTermsBg(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const bg = czechizeProductFacts(facts);
  return bg.requiredTermsUk;
}

/** @deprecated use requiredTermsBg */
export const requiredTermsRo = requiredTermsBg;
/** @deprecated use requiredTermsBg */
export const requiredTermsSl = requiredTermsBg;
/** @deprecated use requiredTermsBg */
export const requiredTermsPl = requiredTermsBg;

function factsNotesBg(facts: ProductFacts): string[] {
  return czechizeProductFacts(facts).notesUk;
}

const UNKNOWN_FORM_GUIDANCE = `================ ФОРМА ОТ FEED-А (приоритет) ================
Търси формата в feed-а и landing title-а, не гадай.
kapljice / drops / kapi / капли → капки | kapsule / capsule → капсули | čaj / tea → чай | spray / sprej → спрей
Добър пример: W-Loss (отслабване) → капки за контрол на теглото
Добър пример: Abslim (отслабване) → капки за контрол на теглото
Добър пример: Hondro Sol (spray) → спрей за стави или спрей за халукс валгус
Добър пример: Promicil → противогъбичен крем за нокти
Добър пример: Removio → гел срещу папиломи
Добър пример: InsuLevel / Balansulin → добавка за контрол на кръвната захар
Лош пример: W-Loss / Abslim → капсули (ако формата не е в feed-а)
Лош пример: Hondro Sol → капсули, ако feed-ът казва spray
Лош пример: Promicil / Removio → капсули, ако feed-ът казва крем/гел
Лош пример: InsuLevel → храносмилане, ако feed-ът сочи диабет/кръвна захар
При weight-management от Shakes (W-Loss, Abslim) обичайно са капки, не капсули.
Ако формата е неясна: използвай «продукт» + начин на прием от feed-а — не приемай автоматично, че са капсули.`;

export function buildFactsBlockBg(facts: ProductFacts): string {
  if (facts.kind === "unknown") return UNKNOWN_FORM_GUIDANCE;
  const bgFacts = czechizeProductFacts(facts);
  const required = requiredTermsBg(bgFacts).join(", ") || "—";
  const notes = factsNotesBg(bgFacts)
    .map((n) => `- ${n}`)
    .join("\n");
  return `================ ФАКТИ ЗА ПРОДУКТА (МАКСИМАЛЕН ПРИОРИТЕТ) ================
Реалната форма на продукта: ${bgFacts.formLabelUk}
Задължителни думи в текста: ${required}
${notes}`;
}

/** @deprecated use buildFactsBlockBg */
export const buildFactsBlockRo = buildFactsBlockBg;
/** @deprecated use buildFactsBlockBg */
export const buildFactsBlockSl = buildFactsBlockBg;
/** @deprecated use buildFactsBlockBg */
export const buildFactsBlockPl = buildFactsBlockBg;

export function formLabelBg(facts: ProductFacts): string {
  return czechizeProductFacts(facts).formLabelUk || "продукт";
}

/** @deprecated use formLabelBg */
export const formLabelRo = formLabelBg;
/** @deprecated use formLabelBg */
export const formLabelSl = formLabelBg;
/** @deprecated use formLabelBg */
export const formLabelPl = formLabelBg;

export function czechizeProductFacts(facts: ProductFacts): ProductFacts {
  const bg = CS_BY_KIND[facts.kind];
  const formBg = (bg?.form ?? czechizeTerm(facts.formLabelUk)) || "продукт";
  const requiredBg =
    bg?.required && bg.required.length > 0
      ? bg.required
      : facts.requiredTermsUk.map(czechizeTerm).filter(Boolean);
  const notesBg =
    bg?.notes ??
    [`Продукт във форма «${formBg}»; пиши на български според фийда, без недоказани обещания.`];
  return {
    ...facts,
    formLabelUk: formBg,
    formLabelRu: formBg,
    requiredTermsUk: requiredBg,
    requiredTermsRu: requiredBg,
    notesUk: notesBg,
    notesRu: notesBg,
  };
}

export const WATER_PHRASES_CS = [
  "ефективно решение",
  "цялостна подкрепа",
  "обща подкрепа",
  "деликатно състояние",
  "модерна формула",
  "иновативна формула",
  "уникален продукт",
  "естествена формула",
  "грижа за здравето",
  "подкрепа за здравето",
  "потентност и либидо",
  "мъжко здраве",
  "общо благополучие",
  "добро общо състояние",
  "качество на живот",
  "естествен баланс",
  "цялостен ефект",
];
