// Detect the actual product form/kind from the raw feed (title + category +
// description). The category slug drives SEO clustering; this layer drives
// what the AI is allowed to say the product physically IS.
//
// Why: a category like `blood-pressure` is a supplement bucket by default,
// but the same bucket can contain a wrist tonometer. Without this, the AI
// confidently calls a digital monitor a "dietary supplement".

import { spanishizeProductFacts, WATER_PHRASES_ES } from "./product-facts.es-labels";

export type ProductKind =
  | "device"
  | "cream"
  | "ointment"
  | "balm"
  | "serum"
  | "shampoo"
  | "gel"
  | "spray"
  | "drops"
  | "patch"
  | "capsules"
  | "tablets"
  | "sachet"
  | "ampoules"
  | "powder"
  | "syrup"
  | "tea"
  | "orthopedic"
  | "massager"
  | "cosmetic"
  | "eye_care"
  | "generic_item"
  | "unknown";

// Unicode-aware word boundary. JS native \b only treats [A-Za-z0-9_] as
// word chars, so \bкапли\b always returns false against Cyrillic text.
// Use this helper to wrap any Cyrillic/Latin token that needs a boundary.
// Usage: `${WB}капл[иеяй]${WB}` inside a /.../iu literal.
const WB = "(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}])|(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}])";
function wre(body: string): RegExp {
  // Wraps every \b in the source with the Unicode-aware boundary above.
  return new RegExp(body.replace(/\\b/g, `(?:${WB})`), "iu");
}

export type ProductFacts = {
  kind: ProductKind;
  // Short human label used inside the AI prompt and validation.
  formLabelRu: string;
  formLabelUk: string;
  // Terms that MUST appear in title/intro because they are the literal product.
  requiredTermsRu: string[];
  requiredTermsUk: string[];
  // Terms the AI must NEVER use — they would contradict the feed.
  bannedTermsRu: string[];
  bannedTermsUk: string[];
  // Free-form notes inserted into the prompt to help the model.
  notesRu: string[];
  notesUk: string[];
};

const BAN_SUPPLEMENT_RU = [
  "диетическая добавка",
  "БАД",
  "капсулы",
  "таблетки",
  "принимать внутрь",
  "курс приёма",
  "курс приема",
  "состав капсул",
  "формула капсул",
  "активное вещество",
  "активные компоненты формулы",
];
const BAN_SUPPLEMENT_UK = [
  "дієтична добавка",
  "БАД",
  "капсули",
  "таблетки",
  "приймати всередину",
  "курс прийому",
  "склад капсул",
  "формула капсул",
  "активна речовина",
  "активні компоненти формули",
];
const BAN_DEVICE_RU = ["прибор", "экран", "USB", "аккумулятор", "дисплей", "батарея", "зарядка"];
const BAN_DEVICE_UK = ["прилад", "екран", "USB", "акумулятор", "дисплей", "батарея", "зарядка"];
const BAN_ORTHO_RU = ["ортопедический корректор", "фиксатор", "шина", "силиконовая накладка"];
const BAN_ORTHO_UK = ["ортопедичний коректор", "фіксатор", "шина", "силіконова накладка"];

function has(re: RegExp, s: string): boolean {
  return re.test(s);
}

// ============================================================
// Form factories. One per physical form. Each returns a complete
// ProductFacts with required/banned terms + notes, but no niche-specific
// content (niche is layered on later via category-policy if needed).
// ============================================================
function factsCapsules(): ProductFacts {
  return {
    kind: "capsules",
    formLabelRu: "капсулы",
    formLabelUk: "капсули",
    requiredTermsRu: ["капсулы"],
    requiredTermsUk: ["капсули"],
    bannedTermsRu: [...BAN_DEVICE_RU, ...BAN_ORTHO_RU, "крем", "мазь", "бальзам", "гель", "капли", "спрей"],
    bannedTermsUk: [...BAN_DEVICE_UK, ...BAN_ORTHO_UK, "крем", "мазь", "бальзам", "гель", "краплі", "спрей"],
    notesRu: ["Это капсулы для приёма внутрь; описывайте состав, дозировку, курс приёма. Это НЕ крем/мазь/бальзам/капли — НЕ называйте средство этими словами."],
    notesUk: ["Це капсули для приймання всередину; описуйте склад, дозування, курс приймання. Це НЕ крем/мазь/бальзам/краплі — НЕ називайте засіб цими словами."],
  };
}

function factsTablets(): ProductFacts {
  return {
    kind: "tablets",
    formLabelRu: "таблетки",
    formLabelUk: "таблетки",
    requiredTermsRu: ["таблетки"],
    requiredTermsUk: ["таблетки"],
    bannedTermsRu: [...BAN_DEVICE_RU, ...BAN_ORTHO_RU, "крем", "мазь", "бальзам", "гель", "капли", "спрей", "капсулы"],
    bannedTermsUk: [...BAN_DEVICE_UK, ...BAN_ORTHO_UK, "крем", "мазь", "бальзам", "гель", "краплі", "спрей", "капсули"],
    notesRu: ["Это таблетки для приёма внутрь; описывайте дозировку, курс приёма. Это НЕ капсулы и НЕ капли."],
    notesUk: ["Це таблетки для приймання всередину; описуйте дозування, курс приймання. Це НЕ капсули і НЕ краплі."],
  };
}

function factsDrops(): ProductFacts {
  return {
    kind: "drops",
    formLabelRu: "капли",
    formLabelUk: "краплі",
    requiredTermsRu: ["капли"],
    requiredTermsUk: ["краплі"],
    bannedTermsRu: ["капсулы", "таблетки", "крем", "мазь", "бальзам", "гель", "ампулы", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "крем", "мазь", "бальзам", "гель", "ампули", ...BAN_ORTHO_UK],
    notesRu: ["Это капли; описывайте дозировку и способ применения (внутрь/наружно/в глаза — по фиду). Это НЕ капсулы и НЕ крем."],
    notesUk: ["Це краплі; описуйте дозування і спосіб застосування (всередину/зовнішньо/в очі — за фідом). Це НЕ капсули і НЕ крем."],
  };
}

function factsGel(): ProductFacts {
  return {
    kind: "gel", formLabelRu: "гель для наружного применения", formLabelUk: "гель для зовнішнього застосування",
    requiredTermsRu: ["гель"], requiredTermsUk: ["гель"],
    bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "мазь", "бальзам", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "мазь", "бальзам", ...BAN_ORTHO_UK],
    notesRu: ["Это гель для наружного применения; описывайте нанесение, впитывание, частоту. Это НЕ капсулы и НЕ крем."],
    notesUk: ["Це гель для зовнішнього застосування; описуйте нанесення, вбирання, частоту. Це НЕ капсули і НЕ крем."],
  };
}

function factsCream(): ProductFacts {
  return {
    kind: "cream", formLabelRu: "крем для наружного применения", formLabelUk: "крем для зовнішнього застосування",
    requiredTermsRu: ["крем"], requiredTermsUk: ["крем"],
    bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "мазь", "бальзам", "гель", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "мазь", "бальзам", "гель", ...BAN_ORTHO_UK],
    notesRu: ["Это крем; описывайте наружное нанесение, текстуру, активные компоненты, частоту. Это НЕ мазь и НЕ бальзам."],
    notesUk: ["Це крем; описуйте зовнішнє нанесення, текстуру, активні компоненти, частоту. Це НЕ мазь і НЕ бальзам."],
  };
}

function factsBalm(): ProductFacts {
  return {
    kind: "balm", formLabelRu: "бальзам", formLabelUk: "бальзам",
    requiredTermsRu: ["бальзам"], requiredTermsUk: ["бальзам"],
    bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "мазь", "гель", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "мазь", "гель", ...BAN_ORTHO_UK],
    notesRu: ["Это бальзам; описывайте мягкое нанесение, текстуру, активные компоненты, частоту. Это НЕ крем и НЕ мазь."],
    notesUk: ["Це бальзам; описуйте м'яке нанесення, текстуру, активні компоненти, частоту. Це НЕ крем і НЕ мазь."],
  };
}

function factsOintment(): ProductFacts {
  return {
    kind: "ointment", formLabelRu: "мазь", formLabelUk: "мазь",
    requiredTermsRu: ["мазь"], requiredTermsUk: ["мазь"],
    bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "гель", "бальзам", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "гель", "бальзам", ...BAN_ORTHO_UK],
    notesRu: ["Это мазь; описывайте плотное наружное нанесение, область, частоту. Это НЕ крем и НЕ бальзам."],
    notesUk: ["Це мазь; описуйте щільне зовнішнє нанесення, ділянку, частоту. Це НЕ крем і НЕ бальзам."],
  };
}

function factsSpray(): ProductFacts {
  return {
    kind: "spray", formLabelRu: "спрей", formLabelUk: "спрей",
    requiredTermsRu: ["спрей"], requiredTermsUk: ["спрей"],
    bannedTermsRu: ["капсулы", "таблетки", "крем", "мазь", "бальзам", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "крем", "мазь", "бальзам", ...BAN_ORTHO_UK],
    notesRu: ["Это спрей; описывайте способ распыления, область нанесения, частоту."],
    notesUk: ["Це спрей; описуйте спосіб розпилення, область нанесення, частоту."],
  };
}

function factsSachet(): ProductFacts {
  return {
    kind: "sachet", formLabelRu: "саше (порционный пакетик)", formLabelUk: "саше (порційний пакетик)",
    requiredTermsRu: ["саше"], requiredTermsUk: ["саше"],
    bannedTermsRu: ["капсулы", "таблетки", "ампулы", "капли", "крем", "гель", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "ампули", "краплі", "крем", "гель", ...BAN_ORTHO_UK],
    notesRu: ["Это саше — порционный пакетик с порошком/растворимым составом, а не капсулы и не прибор. 1 саше на приём, как разводить (вода/напиток), частоту."],
    notesUk: ["Це саше — порційний пакетик з порошком/розчинним складом, а не капсули і не прилад. 1 саше на приймання, як розводити (вода/напій), частоту."],
  };
}

function factsAmpoules(): ProductFacts {
  return {
    kind: "ampoules", formLabelRu: "ампулы", formLabelUk: "ампули",
    requiredTermsRu: ["ампулы"], requiredTermsUk: ["ампули"],
    bannedTermsRu: ["капсулы", "таблетки", "саше", "крем", "гель", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "саше", "крем", "гель", ...BAN_ORTHO_UK],
    notesRu: ["Это питьевые ампулы с жидким концентратом, а не капсулы и не инъекции."],
    notesUk: ["Це питні ампули з рідким концентратом, а не капсули й не ін'єкції."],
  };
}

function factsPowder(): ProductFacts {
  return {
    kind: "powder", formLabelRu: "порошок (растворимый)", formLabelUk: "порошок (розчинний)",
    requiredTermsRu: ["порошок"], requiredTermsUk: ["порошок"],
    bannedTermsRu: ["капсулы", "таблетки", "ампулы", "крем", "гель", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "ампули", "крем", "гель", ...BAN_ORTHO_UK],
    notesRu: ["Это растворимый порошок; описывайте дозировку мерной ложкой/саше, способ разведения, частоту."],
    notesUk: ["Це розчинний порошок; описуйте дозування мірною ложкою/саше, спосіб розведення, частоту."],
  };
}

function factsSyrup(): ProductFacts {
  return {
    kind: "syrup", formLabelRu: "сироп", formLabelUk: "сироп",
    requiredTermsRu: ["сироп"], requiredTermsUk: ["сироп"],
    bannedTermsRu: ["капсулы", "таблетки", "ампулы", "крем", "гель", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "ампули", "крем", "гель", ...BAN_ORTHO_UK],
    notesRu: ["Это сироп для приёма внутрь; описывайте дозировку ложкой, частоту, способ приёма."],
    notesUk: ["Це сироп для приймання всередину; описуйте дозування ложкою, частоту, спосіб приймання."],
  };
}

function factsPatch(): ProductFacts {
  return {
    kind: "patch", formLabelRu: "пластырь", formLabelUk: "пластир",
    requiredTermsRu: ["пластырь"], requiredTermsUk: ["пластир"],
    bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "мазь", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "мазь", ...BAN_ORTHO_UK],
    notesRu: ["Это пластырь; описывайте куда клеить, как долго носить, активные компоненты."],
    notesUk: ["Це пластир; описуйте куди клеїти, як довго носити, активні компоненти."],
  };
}

function factsShampoo(): ProductFacts {
  return {
    kind: "shampoo", formLabelRu: "шампунь", formLabelUk: "шампунь",
    requiredTermsRu: ["шампунь"], requiredTermsUk: ["шампунь"],
    bannedTermsRu: ["капсулы", "таблетки", "крем", "мазь", "капли", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "крем", "мазь", "краплі", ...BAN_ORTHO_UK],
    notesRu: ["Это шампунь для волос; описывайте нанесение на влажные волосы, частоту мытья, активные компоненты."],
    notesUk: ["Це шампунь для волосся; описуйте нанесення на вологе волосся, частоту миття, активні компоненти."],
  };
}

function factsSerum(): ProductFacts {
  return {
    kind: "serum", formLabelRu: "сыворотка", formLabelUk: "сироватка",
    requiredTermsRu: ["сыворотка"], requiredTermsUk: ["сироватка"],
    bannedTermsRu: ["капсулы", "таблетки", "крем", "мазь", "шампунь", ...BAN_ORTHO_RU],
    bannedTermsUk: ["капсули", "таблетки", "крем", "мазь", "шампунь", ...BAN_ORTHO_UK],
    notesRu: ["Это сыворотка для наружного применения; описывайте точечное нанесение, текстуру, активные компоненты, частоту."],
    notesUk: ["Це сироватка для зовнішнього застосування; описуйте точкове нанесення, текстуру, активні компоненти, частоту."],
  };
}

function factsTea(): ProductFacts {
  return {
    kind: "tea", formLabelRu: "травяной чай / сбор", formLabelUk: "трав'яний чай / збір",
    requiredTermsRu: ["чай"], requiredTermsUk: ["чай"],
    bannedTermsRu: [...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
    bannedTermsUk: [...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
    notesRu: ["Это травяной чай; описывайте состав трав, способ заваривания, частоту приёма."],
    notesUk: ["Це трав'яний чай; описуйте склад трав, спосіб заварювання, частоту приймання."],
  };
}

// ============================================================
// Map a known ProductKind → ProductFacts. Used by UI/server callers that
// already have the kind persisted (product_content.form_kind) and don't
// want to re-run the noisy regex detector against AI-generated text.
// ============================================================
const KIND_FACTORIES: Partial<Record<ProductKind, () => ProductFacts>> = {
  capsules: factsCapsules,
  tablets: factsTablets,
  drops: factsDrops,
  gel: factsGel,
  cream: factsCream,
  balm: factsBalm,
  ointment: factsOintment,
  spray: factsSpray,
  sachet: factsSachet,
  ampoules: factsAmpoules,
  powder: factsPowder,
  syrup: factsSyrup,
  patch: factsPatch,
  shampoo: factsShampoo,
  serum: factsSerum,
  tea: factsTea,
};

export function factsForKind(kind: ProductKind | string | null | undefined): ProductFacts | null {
  if (!kind) return null;
  const f = KIND_FACTORIES[kind as ProductKind];
  if (f) return f();
  // device/orthopedic/massager/eye_care/generic_item/unknown have rich
  // bodies that depend on context; for label-only consumers (ProductSpecs)
  // we return a stub with the right kind + a generic label.
  const labelByKind: Record<string, [string, string]> = {
    device: ["цифровой прибор", "цифровий прилад"],
    massager: ["массажёр / массажный прибор", "масажер / масажний прилад"],
    orthopedic: ["ортопедическое изделие", "ортопедичний виріб"],
    eye_care: ["средство для глаз", "засіб для очей"],
    cosmetic: ["косметическое средство", "косметичний засіб"],
  };
  const labels = labelByKind[kind as string];
  if (!labels) return null;
  return {
    kind: kind as ProductKind,
    formLabelRu: labels[0],
    formLabelUk: labels[1],
    requiredTermsRu: [],
    requiredTermsUk: [],
    bannedTermsRu: [],
    bannedTermsUk: [],
    notesRu: [],
    notesUk: [],
  };
}

const FORM_LABEL_ES: Partial<Record<ProductKind, string>> = {
  capsules: "cápsulas",
  tablets: "comprimidos",
  drops: "gotas",
  gel: "gel de uso externo",
  cream: "crema de uso externo",
  balm: "bálsamo",
  ointment: "ungüento",
  spray: "spray",
  sachet: "sobre monodosis",
  ampoules: "viales",
  powder: "polvo soluble",
  syrup: "jarabe",
  patch: "parche",
  shampoo: "champú",
  serum: "suero",
  tea: "té de hierbas",
  device: "dispositivo",
  massager: "masajeador",
  orthopedic: "dispositivo ortopédico",
  eye_care: "producto para los ojos",
  cosmetic: "producto cosmético",
  generic_item: "producto",
  unknown: "producto",
};

/** Spanish physical-form label for ProductSpecs and display titles. */
export function formLabelEs(facts: ProductFacts): string {
  return FORM_LABEL_ES[facts.kind] ?? "producto";
}

/** @deprecated ES storefront — use formLabelEs */
export function formLabelIt(facts: ProductFacts): string {
  return formLabelEs(facts);
}

/** Italian required form tokens for QA / prompts (IT storefront uk slot). */
export function requiredTermsIt(facts: ProductFacts): string[] {
  if (facts.kind === "unknown" || facts.kind === "generic_item") return [];
  const label = formLabelIt(facts);
  const primary = label.split(/\s+/)[0]?.toLowerCase() ?? label.toLowerCase();
  return primary ? [primary] : [];
}

function factsNotesIt(facts: ProductFacts): string[] {
  if (["cream", "gel", "balm", "ointment", "spray"].includes(facts.kind)) {
    return [
      "Prodotto per uso esterno: descrivere applicazione sulla pelle, frequenza e precauzioni — non schema di assunzione orale.",
    ];
  }
  if (["capsules", "tablets", "drops", "sachet", "powder", "syrup", "ampoules", "tea"].includes(facts.kind)) {
    return [
      "Integratore/complemento per uso orale: descrivere composizione plausibile, dosaggio e durata del ciclo.",
    ];
  }
  if (facts.kind === "device" || facts.kind === "massager" || facts.kind === "orthopedic") {
    return ["Dispositivo per uso domestico: descrivere funzioni, modalità d'uso e contenuto confezione."];
  }
  return ["Descrivi solo ciò che è plausibile dal nome prodotto e dal feed, senza promesse mediche."];
}

// (partner KPI text often contains random form-words). Order matters: more
// specific patterns first to avoid false positives. We use Unicode-aware
// boundaries because JS \b does not understand Cyrillic.
function detectExplicitFormFromTitle(titleLc: string): ProductFacts | null {
  if (!titleLc) return null;
  // drops FIRST so "Papillom Max - капли от папиллом" doesn't fall into
  // the default capsules branch when capsules check runs.
  if (wre(`\\bкапл[иеяйюіях]\\b|\\bкрапл[іиеяйюях]\\b|\\bdrops\\b|\\bkaplj\\w*\\b|\\bgotas\\b|\\bgocce\\b|\\bgtt\\b`).test(titleLc)) return factsDrops();
  // ampoules (питьевые ампулы)
  if (wre(`\\bампул[аыоиеуіїюяьа]?\\b|\\bampoule`).test(titleLc)) return factsAmpoules();
  // sachet
  if (wre(`\\bсаше\\b|\\bsachet\\b|\\bстик-?пакет`).test(titleLc)) return factsSachet();
  // syrup
  if (wre(`\\bсироп[аеуыіов]?\\b|\\bsyrup\\b`).test(titleLc)) return factsSyrup();
  // powder
  if (wre(`\\bпорош[окк][аеуіов]?\\b|\\bpowder\\b`).test(titleLc)) return factsPowder();
  // patch
  if (wre(`\\bпластыр|\\bпластир|\\bpatch\\b`).test(titleLc)) return factsPatch();
  // shampoo
  if (wre(`\\bшампун|\\bshampoo|\\bshampo\\b`).test(titleLc)) return factsShampoo();
  // serum
  if (wre(`\\bсыворотк|\\bсироватк|\\bserum\\b`).test(titleLc)) return factsSerum();
  // ointment
  if (wre(`\\bмаз[ьиью]\\b|\\bointment\\b`).test(titleLc)) return factsOintment();
  // balm
  if (wre(`\\bбальзам`).test(titleLc)) return factsBalm();
  // gel
  if (wre(`\\bгел[ьюяем]\\b|\\bgel\\b`).test(titleLc)) return factsGel();
  // spray
  if (wre(`\\bспре[йяем]\\b|\\bspray\\b`).test(titleLc)) return factsSpray();
  // tea / collection
  if (wre(`\\bча[йюя]\\b|\\bсбор\\s+трав|\\bтрав[\\u0027\u2019]?ян[аоыіий]`).test(titleLc)) return factsTea();
  // tablets (BEFORE capsules — otherwise "таблет" would never be reached
  // because the old combined regex returned capsules for both).
  if (wre(`\\bтаблет|\\btablet|\\bpill\\b`).test(titleLc)) return factsTablets();
  // capsules
  if (wre(`\\bкапсул|\\bcapsule`).test(titleLc)) return factsCapsules();
  // cream (last among forms — partner descriptions love this word)
  if (wre(`\\bкрем[аеуыоіовм]?\\b|\\bcream\\b`).test(titleLc)) return factsCream();
  return null;
}



export function detectProductFacts(
  title: string,
  feedCategory: string,
  description: string,
): ProductFacts {
  return spanishizeProductFacts(detectProductFactsCore(title, feedCategory, description));
}

function detectProductFactsCore(
  title: string,
  feedCategory: string,
  description: string,
): ProductFacts {
  const text = `${title} ${feedCategory} ${description}`.toLowerCase();
  const titleLc = (title || "").toLowerCase();

  // -------------------------------------------------------------------------
  // PRIORITY 0: explicit physical-form word in TITLE wins over niche-based
  // branches (eye_care/device/orthopedic/massager). Without this, products
  // like "Optilix - капсулы для зрения" get classified as eye_care balm/drops
  // because the eye_care branch matches "зрения" before the capsules branch
  // is reached. The form word in the title is the strongest signal we have
  // about the physical product; niche only adds context, not form.
  // -------------------------------------------------------------------------
  const explicit = detectExplicitFormFromTitle(titleLc);
  if (explicit) return explicit;

  // Liquid antiparasite SKUs are often named «… Water Parasites» (drops, not tea/capsules).
  if (/\bwater\b/i.test(titleLc) && /\bparasit/i.test(titleLc)) {
    return factsDrops();
  }

  // -------------------------------------------------------------------------
  // PRIORITY 0.5: explicit non-medical product noun in TITLE wins over niche
  // keyword heuristics. Title nouns like "очиститель кистей", "проигрыватель",
  // "светильник", "пылесос" are the strongest signal we have — niche-based
  // branches (eye_care/device/orthopedic/etc.) must NOT override them.
  // Without this, "Электрический очиститель косметических кистей" used to
  // false-trigger eye_care because the bare substring "очи" matched inside
  // "очиститель" (JS native \b does not work with Cyrillic).
  // -------------------------------------------------------------------------
  const earlyGeneric = detectGenericThingFromTitle(title);
  if (earlyGeneric) {
    return {
      kind: "generic_item",
      formLabelRu: earlyGeneric.ru,
      formLabelUk: earlyGeneric.uk,
      requiredTermsRu: [earlyGeneric.requiredRu],
      requiredTermsUk: [earlyGeneric.requiredUk],
      bannedTermsRu: [
        ...BAN_SUPPLEMENT_RU,
        "лечит", "излечивает", "лечебный эффект",
        "для наружного применения", "наружного применения",
        "крем", "мазь", "бальзам", "сыворотка", "капли", "ампулы", "саше", "сироп",
        "средство для глаз", "для глаз", "глаза", "глаз", "очей", "зрение", "усталость глаз",
        "сухость глаз", "контактные линзы", "слизистая", "веки", "глазные мышцы", "синий свет",
        "курс применения", "курсом", "нанесите", "наносите",
      ],
      bannedTermsUk: [
        ...BAN_SUPPLEMENT_UK,
        "лікує", "виліковує", "лікувальний ефект",
        "для зовнішнього застосування", "зовнішнього застосування",
        "крем", "мазь", "бальзам", "сироватка", "краплі", "ампули", "саше", "сироп",
        "засіб для очей", "для очей", "очі", "очей", "зір", "втома очей",
        "сухість очей", "контактні лінзи", "слизова", "повіки", "очні м'язи", "синє світло",
        "курс застосування", "курсом", "нанесіть", "наносьте",
      ],
      notesRu: [
        `Это бытовой / повседневный товар — «${earlyGeneric.ru}». Это НЕ диетическая добавка, НЕ лекарство, НЕ крем/мазь. Описывайте его реальное назначение, материал/комплектацию (если есть в фиде), удобство использования и для кого он подходит. Не приписывайте медицинских свойств.`,
      ],
      notesUk: [
        `Це побутовий / повсякденний товар — «${earlyGeneric.uk}». Це НЕ дієтична добавка, НЕ ліки, НЕ крем/мазь. Описуйте його реальне призначення, матеріал/комплектацію (якщо є у фіді), зручність використання і для кого він підходить. Не приписуйте медичних властивостей.`,
      ],
    };
  }





  // ---- Device: tonometers, glucometers, oximeters, monitors with display/USB ----
  if (
    has(/тонометр|глюкометр|пульсоксиметр|оксиметр/i, text) ||
    has(/blood\s*pressure\s*monitor|glucose\s*monitor|pulse\s*oximeter/i, text) ||
    (has(/монитор|monitor/i, titleLc) && has(/давлен|pressure|глюкоз|пульс/i, text))
  ) {
    const isWrist = has(/запясть|зап'?яст|wrist/i, text);
    const formRu = isWrist ? "цифровой тонометр на запястье" : "цифровой медицинский прибор";
    const formUk = isWrist ? "цифровий тонометр на зап'ясті" : "цифровий медичний прилад";
    return {
      kind: "device",
      formLabelRu: formRu,
      formLabelUk: formUk,
      requiredTermsRu: ["тонометр", "прибор"],
      requiredTermsUk: ["тонометр", "прилад"],
      bannedTermsRu: BAN_SUPPLEMENT_RU,
      bannedTermsUk: BAN_SUPPLEMENT_UK,
      notesRu: [
        "Это электронный измерительный прибор, а не средство для приёма внутрь.",
        "Описывайте: измерение давления и пульса, питание (USB / аккумулятор / батарейки), дисплей, манжета/запястье, точность, память измерений, комплектация.",
        "Прибор не лечит гипертонию, а помогает её контролировать дома.",
      ],
      notesUk: [
        "Це електронний вимірювальний прилад, а не засіб для приймання всередину.",
        "Описуйте: вимірювання тиску і пульсу, живлення (USB / акумулятор / батарейки), дисплей, манжета/зап'ястя, точність, пам'ять вимірювань, комплектацію.",
        "Прилад не лікує гіпертонію, а допомагає її контролювати вдома.",
      ],
    };
  }

  // ---- Massager / massage gun ----
  if (has(/массаж[ёе]р|массажн.*пистолет|massage\s*gun|massager/i, text)) {
    return {
      kind: "massager",
      formLabelRu: "массажёр / массажный прибор",
      formLabelUk: "масажер / масажний прилад",
      requiredTermsRu: ["массажёр"],
      requiredTermsUk: ["масажер"],
      bannedTermsRu: BAN_SUPPLEMENT_RU,
      bannedTermsUk: BAN_SUPPLEMENT_UK,
      notesRu: ["Это электрический прибор; описывайте режимы, насадки, питание, комплектацию."],
      notesUk: ["Це електричний прилад; описуйте режими, насадки, живлення, комплектацію."],
    };
  }

  // ---- Shapewear / waist trainer / corset (before orthopedic) ----
  if (
    has(/waist\s*trainer|corset|corsetto|fascia\s+modellante|shapewear|бандаж|корсет|пояс\s+для\s+похуд|shape\s*wear|bustino/i, text) ||
    has(/waist\s*trainer|corset|shapewear/i, titleLc)
  ) {
    return {
      kind: "generic_item",
      formLabelRu: "корсет / пояс для моделирования фигуры",
      formLabelUk: "corsetto / fascia modellante",
      requiredTermsRu: ["корсет", "пояс"],
      requiredTermsUk: ["corsetto", "fascia"],
      bannedTermsRu: BAN_SUPPLEMENT_RU,
      bannedTermsUk: BAN_SUPPLEMENT_UK,
      notesRu: ["Это одежда для моделирования силуэта, не ортопедическое изделие и не интегратор."],
      notesUk: ["È capo di abbigliamento modellante, non dispositivo ortopedico né integratore."],
    };
  }

  // ---- Orthopedic corrector / splint / fixator ----
  // Use wre() so stems like "шин" match "шина/шины/шину" but NOT "машина",
  // "шинель", "шиповник" — JS \b is ineffective for Cyrillic.
  if (
    (has(wre("\\b(?:коррект[\\p{L}]*|фиксатор[\\p{L}]*|шин[аыуоі][\\p{L}]*|накладк[\\p{L}]*|стельк[\\p{L}]*)\\b"), text) ||
      has(wre("\\b(?:коректор[\\p{L}]*|фіксатор[\\p{L}]*|шин[аиуої][\\p{L}]*|накладк[\\p{L}]*|устілк[\\p{L}]*)\\b"), text)) &&
    !has(wre("\\b(?:крем[\\p{L}]*|cream|гель|gel|мазь|мазі|спрей|капл[\\p{L}]*|капс[\\p{L}]*|таблет[\\p{L}]*)\\b"), titleLc)
  ) {

    return {
      kind: "orthopedic",
      formLabelRu: "ортопедическое изделие (корректор/фиксатор/накладка)",
      formLabelUk: "ортопедичний виріб (коректор/фіксатор/накладка)",
      requiredTermsRu: [],
      requiredTermsUk: [],
      bannedTermsRu: ["принимать внутрь", "капсулы", "курс приёма"],
      bannedTermsUk: ["приймати всередину", "капсули", "курс прийому"],
      notesRu: ["Это ортопедическое изделие, носится на теле; описывайте материал, размер, способ ношения."],
      notesUk: ["Це ортопедичний виріб, носиться на тілі; описуйте матеріал, розмір, спосіб носіння."],
    };
  }

  // ---- Eye-care (balm / drops / capsules for eyes) — checked BEFORE cream
  // because partner descriptions often contain the word "крем" generically.
  // IMPORTANT: match TITLE ONLY, and use Unicode-aware word boundaries via
  // wre(). JS native \b does not treat Cyrillic as word chars, so a bare
  // /очи|око|глаз|зір/ matches inside "ОЧИститель", "ОКОло", "ГЛАЗурь",
  // "ЗІРка" → false eye_care classification for unrelated household items.
  if (
    has(wre("\\b(?:ocul[\\p{L}]*|vision|optic[\\p{L}]*|eye|глаз[\\p{L}]*|очи|очей|очі|очн[\\p{L}]*|око|зір|зрен[\\p{L}]*)\\b"), titleLc) ||
    has(/для\s+(?:глаз|очей|зору|зрения)|eye\s*care|eye\s*health/iu, titleLc)
  ) {
    // Oral vision NEM (e.g. Cleaview, Optilix) — title may lack «капсулы» but
    // description/category confirms capsules; skip topical eye_care stereotype.
    const isOralVision =
      has(wre("\\b(?:капсул[аеуыіовюяь]?|capsule|kapsel|kapseln|tablet[ts]?|таблет)\\b"), text);
    if (isOralVision) {
      // fall through to capsules/tablets branches below
    } else {

    const isDrops = has(wre("\\b(?:капли|краплі|drops)\\b"), text);
    const formRu = isDrops ? "капли для глаз" : "средство для глаз (бальзам/капли)";
    const formUk = isDrops ? "краплі для очей" : "засіб для очей (бальзам/краплі)";
    return {
      kind: "eye_care",
      formLabelRu: formRu,
      formLabelUk: formUk,
      requiredTermsRu: [],
      requiredTermsUk: [],
      bannedTermsRu: [
        "крем", "мазь", "для наружного применения", "наружного применения",
        "крем для лица", "крем для тела", "капсулы", ...BAN_ORTHO_RU,
      ],
      bannedTermsUk: [
        "крем", "мазь", "для зовнішнього застосування", "зовнішнього застосування",
        "крем для обличчя", "крем для тіла", "капсули", ...BAN_ORTHO_UK,
      ],
      notesRu: [
        "Это средство для глаз (капли или бальзам), а не крем для лица/тела и не косметика общего назначения.",
        "ЗАПРЕЩЕНО называть продукт кремом или мазью и писать 'для наружного применения'. Используй слова: бальзам, капли, средство для глаз.",
        "Описывайте: что именно для глаз (усталость, сухость, нагрузка от экрана, поддержка зрения), как применять, частоту.",
      ],
      notesUk: [
        "Це засіб для очей (краплі або бальзам), а не крем для обличчя/тіла й не косметика загального призначення.",
        "ЗАБОРОНЕНО називати продукт кремом або маззю та писати 'для зовнішнього застосування'. Використовуй слова: бальзам, краплі, засіб для очей.",
        "Описуйте: що саме для очей (втома, сухість, навантаження від екрана, підтримка зору), як застосовувати, частоту.",
      ],
    };
    }
  }

  // ---- Shampoo ----
  if (has(/\bшампунь\b|\bшампуня\b|\bшампуни\b|\bшампуню\b|shampoo|shampo/iu, titleLc)) {
    return {
      kind: "shampoo",
      formLabelRu: "шампунь",
      formLabelUk: "шампунь",
      requiredTermsRu: ["шампунь"],
      requiredTermsUk: ["шампунь"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "мазь", "капли", "ампулы", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "мазь", "краплі", "ампули", ...BAN_ORTHO_UK],
      notesRu: ["Это шампунь для волос; описывайте нанесение на влажные волосы, частоту мытья, активные компоненты."],
      notesUk: ["Це шампунь для волосся; описуйте нанесення на вологе волосся, частоту миття, активні компоненти."],
    };
  }

  // ---- Serum / сыворотка ----
  if (has(/\bсыворотк[аиуеоы]\b|\bсироватк[аиуеоиою]\b|\bserum\b/iu, titleLc)) {
    return {
      kind: "serum",
      formLabelRu: "сыворотка для наружного применения",
      formLabelUk: "сироватка для зовнішнього застосування",
      requiredTermsRu: ["сыворотка"],
      requiredTermsUk: ["сироватка"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "мазь", "шампунь", "капли внутрь", "ампулы", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "мазь", "шампунь", "ампули", ...BAN_ORTHO_UK],
      notesRu: ["Это сыворотка для наружного применения; описывайте точечное нанесение, текстуру, активные компоненты, частоту."],
      notesUk: ["Це сироватка для зовнішнього застосування; описуйте точкове нанесення, текстуру, активні компоненти, частоту."],
    };
  }

  // ---- Ointment (мазь) — отдельная форма от крема и бальзама ----
  if (has(/\bмазь\b|\bмази\b|\bмаззю\b|ointment/iu, titleLc)) {
    return {
      kind: "ointment",
      formLabelRu: "мазь для наружного применения",
      formLabelUk: "мазь для зовнішнього застосування",
      requiredTermsRu: ["мазь"],
      requiredTermsUk: ["мазь"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "гель", "шампунь", "сыворотка", "капли", "ампулы", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "гель", "шампунь", "сироватка", "краплі", "ампули", ...BAN_ORTHO_UK],
      notesRu: ["Это мазь; описывайте плотное наружное нанесение, область, частоту, активные компоненты. Это НЕ крем и НЕ бальзам — называйте её именно мазью."],
      notesUk: ["Це мазь; описуйте щільне зовнішнє нанесення, ділянку, частоту, активні компоненти. Це НЕ крем і НЕ бальзам — називайте її саме маззю."],
    };
  }

  // ---- Balm (бальзам) — отдельная форма от крема и мази ----
  if (has(/\bбальзам[аеуоыіов]?\b|balm/iu, titleLc)) {
    return {
      kind: "balm",
      formLabelRu: "бальзам для наружного применения",
      formLabelUk: "бальзам для зовнішнього застосування",
      requiredTermsRu: ["бальзам"],
      requiredTermsUk: ["бальзам"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "крем", "мазь", "гель", "шампунь", "сыворотка", "ампулы", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "крем", "мазь", "гель", "шампунь", "сироватка", "ампули", ...BAN_ORTHO_UK],
      notesRu: ["Это бальзам; описывайте мягкое наружное нанесение, текстуру, активные компоненты, частоту. Это НЕ крем и НЕ мазь — называйте его именно бальзамом."],
      notesUk: ["Це бальзам; описуйте м'яке зовнішнє нанесення, текстуру, активні компоненти, частоту. Це НЕ крем і НЕ мазь — називайте його саме бальзамом."],
    };
  }

  // ---- Cream (крем) ----
  if (has(/\bкрем[аеуыоів]?\b|cream/iu, titleLc)) {
    return {
      kind: "cream",
      formLabelRu: "крем для наружного применения",
      formLabelUk: "крем для зовнішнього застосування",
      requiredTermsRu: ["крем"],
      requiredTermsUk: ["крем"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", "мазь", "бальзам", "шампунь", "сыворотка", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", "мазь", "бальзам", "шампунь", "сироватка", ...BAN_ORTHO_UK],
      notesRu: ["Это крем; описывайте нанесение наружно, текстуру, активные компоненты, частоту применения. Это НЕ мазь и НЕ бальзам — называйте его именно кремом."],
      notesUk: ["Це крем; описуйте зовнішнє нанесення, текстуру, активні компоненти, частоту застосування. Це НЕ мазь і НЕ бальзам — називайте його саме кремом."],
    };
  }

  // The remaining external-form branches (gel, spray, drops, patch, tea) only
  // trigger when the form word appears in the TITLE — partner descriptions
  // contain those words too often as generic prose.

  // ---- Gel ----
  if (has(/\bгель\b|\bgel\b/i, titleLc)) {
    return {
      kind: "gel",
      formLabelRu: "гель для наружного применения",
      formLabelUk: "гель для зовнішнього застосування",
      requiredTermsRu: ["гель"],
      requiredTermsUk: ["гель"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", ...BAN_ORTHO_UK],
      notesRu: ["Это гель для наружного применения; описывайте нанесение, впитывание, частоту."],
      notesUk: ["Це гель для зовнішнього застосування; описуйте нанесення, вбирання, частоту."],
    };
  }

  // ---- Spray ----
  if (has(/спрей|spray/i, titleLc)) {
    return {
      kind: "spray",
      formLabelRu: "спрей",
      formLabelUk: "спрей",
      requiredTermsRu: ["спрей"],
      requiredTermsUk: ["спрей"],
      bannedTermsRu: ["капсулы", "таблетки", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", ...BAN_ORTHO_UK],
      notesRu: ["Это спрей; описывайте способ распыления, область нанесения, частоту."],
      notesUk: ["Це спрей; описуйте спосіб розпилення, область нанесення, частоту."],
    };
  }

  // ---- Drops ----
  if (has(/\bкапли\b|\bкраплі\b|drops/i, titleLc)) {
    return {
      kind: "drops",
      formLabelRu: "капли",
      formLabelUk: "краплі",
      requiredTermsRu: ["капли"],
      requiredTermsUk: ["краплі"],
      bannedTermsRu: ["капсулы", "таблетки", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", ...BAN_ORTHO_UK],
      notesRu: ["Это капли; описывайте дозировку, способ приёма/закапывания."],
      notesUk: ["Це краплі; описуйте дозування, спосіб приймання/закапування."],
    };
  }

  // ---- Patch ----
  if (has(/пластыр|пластир|patch/i, titleLc)) {
    return {
      kind: "patch",
      formLabelRu: "пластырь",
      formLabelUk: "пластир",
      requiredTermsRu: ["пластырь"],
      requiredTermsUk: ["пластир"],
      bannedTermsRu: ["капсулы", "таблетки", "принимать внутрь", ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "приймати всередину", ...BAN_ORTHO_UK],
      notesRu: ["Это пластырь; описывайте куда клеить, как долго носить, активные компоненты."],
      notesUk: ["Це пластир; описуйте куди клеїти, як довго носити, активні компоненти."],
    };
  }

  // ---- Tea / herbal collection ----
  if (has(/\bчай\b|\bчаю\b|сбор\s+трав|трав'?ян/i, titleLc)) {
    return {
      kind: "tea",
      formLabelRu: "травяной чай / сбор",
      formLabelUk: "трав'яний чай / збір",
      requiredTermsRu: ["чай"],
      requiredTermsUk: ["чай"],
      bannedTermsRu: [...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: [...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: ["Это травяной чай; описывайте состав трав, способ заваривания, частоту приёма."],
      notesUk: ["Це трав'яний чай; описуйте склад трав, спосіб заварювання, частоту приймання."],
    };
  }


  // ---- Sachet (порционный пакетик с растворимым составом) ----
  if (has(/\bсаше\b|sachet|стик-?пакет/iu, text)) {
    return {
      kind: "sachet",
      formLabelRu: "саше (порционный пакетик)",
      formLabelUk: "саше (порційний пакетик)",
      requiredTermsRu: ["саше"],
      requiredTermsUk: ["саше"],
      bannedTermsRu: ["капсулы", "таблетки", "ампулы", "капли", "спрей", "крем", "гель", "пластырь", ...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "ампули", "краплі", "спрей", "крем", "гель", "пластир", ...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: [
        "Это саше — порционный пакетик с порошком/растворимым составом, а не капсулы и не прибор.",
        "Описывайте: 1 саше на приём, как разводить (вода/напиток), частоту приёма, удобство дозирования (готовая порция).",
      ],
      notesUk: [
        "Це саше — порційний пакетик з порошком/розчинним складом, а не капсули і не прилад.",
        "Описуйте: 1 саше на приймання, як розводити (вода/напій), частоту приймання, зручність дозування (готова порція).",
      ],
    };
  }

  // ---- Ampoules (питьевые ампулы / концентрат в ампуле) ----
  if (has(/\bампул[аыоіи]\b|ampoule/iu, text)) {
    return {
      kind: "ampoules",
      formLabelRu: "ампулы (питьевые / концентрат)",
      formLabelUk: "ампули (питні / концентрат)",
      requiredTermsRu: ["ампулы"],
      requiredTermsUk: ["ампули"],
      bannedTermsRu: ["капсулы", "таблетки", "саше", "капли", "спрей", "крем", "гель", "пластырь", ...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "саше", "краплі", "спрей", "крем", "гель", "пластир", ...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: [
        "Это питьевые ампулы с жидким концентратом, а не капсулы и не инъекции.",
        "Описывайте: 1 ампула на приём, как вскрывать/разводить, курс приёма, удобство готовой дозировки.",
      ],
      notesUk: [
        "Це питні ампули з рідким концентратом, а не капсули й не ін'єкції.",
        "Описуйте: 1 ампула на приймання, як розкривати/розводити, курс приймання, зручність готового дозування.",
      ],
    };
  }

  // ---- Powder (растворимый порошок) ----
  if (has(/\bпорош[окк][аеу]?\b|powder/iu, text)) {
    return {
      kind: "powder",
      formLabelRu: "порошок (растворимый)",
      formLabelUk: "порошок (розчинний)",
      requiredTermsRu: ["порошок"],
      requiredTermsUk: ["порошок"],
      bannedTermsRu: ["капсулы", "таблетки", "ампулы", "капли", "спрей", "крем", "гель", ...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "ампули", "краплі", "спрей", "крем", "гель", ...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: ["Это растворимый порошок; описывайте дозировку мерной ложкой/саше, способ разведения, частоту."],
      notesUk: ["Це розчинний порошок; описуйте дозування мірною ложкою/саше, спосіб розведення, частоту."],
    };
  }

  // ---- Syrup ----
  if (has(/\bсироп\b|syrup/iu, text)) {
    return {
      kind: "syrup",
      formLabelRu: "сироп",
      formLabelUk: "сироп",
      requiredTermsRu: ["сироп"],
      requiredTermsUk: ["сироп"],
      bannedTermsRu: ["капсулы", "таблетки", "ампулы", "крем", "гель", ...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: ["капсули", "таблетки", "ампули", "крем", "гель", ...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: ["Это сироп для приёма внутрь; описывайте дозировку ложкой, частоту, способ приёма."],
      notesUk: ["Це сироп для приймання всередину; описуйте дозування ложкою, частоту, спосіб приймання."],
    };
  }

  // ---- Drops (full feed text — before topical/capsules default) ----
  if (has(wre(`\\bкапл[иеяйюіях]\\b|\\bкрапл[іиеяйюях]\\b|\\bdrops\\b|\\bkaplj\\w*\\b|\\bgotas\\b|\\bgocce\\b|\\bgtt\\b`), text)) {
    return factsDrops();
  }

  // ---- Capsules / pills before topical defaults (partner prose often says «cream») ----
  if (has(wre(`\\b(?:капсул[аеуыіовюяь]?|capsule|kapsel|kapseln|tablet[ts]?|таблет)\\b`), text)) {
    return {
      kind: "capsules",
      formLabelRu: "капсулы",
      formLabelUk: "капсули",
      requiredTermsRu: ["капсулы"],
      requiredTermsUk: ["капсули"],
      bannedTermsRu: [...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: [...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: ["Это капсулы; описывайте состав, дозировку, курс приёма."],
      notesUk: ["Це капсули; описуйте склад, дозування, курс приймання."],
    };
  }

  // ---- Topical forms in full feed (after explicit oral form) ----
  if (has(wre(`\\bкрем[аеуыоіовм]?\\b|\\bcream\\b`), text)) {
    return factsCream();
  }
  if (has(wre(`\\bгел[ьюяем]\\b|\\bgel\\b`), text)) {
    return factsGel();
  }
  if (has(wre(`\\bмаз[ьиью]\\b|\\bointment\\b`), text)) {
    return factsOintment();
  }
  if (has(wre(`\\bбальзам`), text)) {
    return factsBalm();
  }

  // ---- Capsules / pills (fallback without explicit form word in feed) ----
  if (has(/капсул|таблет|capsule|tablet|pill/i, text)) {
    return {
      kind: "capsules",
      formLabelRu: "капсулы",
      formLabelUk: "капсули",
      requiredTermsRu: ["капсулы"],
      requiredTermsUk: ["капсули"],
      bannedTermsRu: [...BAN_DEVICE_RU, ...BAN_ORTHO_RU],
      bannedTermsUk: [...BAN_DEVICE_UK, ...BAN_ORTHO_UK],
      notesRu: ["Это капсулы; описывайте состав, дозировку, курс приёма."],
      notesUk: ["Це капсули; описуйте склад, дозування, курс приймання."],
    };
  }

  // ---- Generic everyday-thing fallback (vinyl player, garden light, brush
  // cleaner, kids toy gun, etc.). Triggers when the title contains a known
  // non-medical, non-supplement product noun. Prevents the AI from defaulting
  // to "товар" or echoing the partner category as the form name.
  const generic = detectGenericThingFromTitle(title);
  if (generic) {
    return {
      kind: "generic_item",
      formLabelRu: generic.ru,
      formLabelUk: generic.uk,
      requiredTermsRu: [generic.requiredRu],
      requiredTermsUk: [generic.requiredUk],
      bannedTermsRu: [
        ...BAN_SUPPLEMENT_RU,
        "лечит", "излечивает", "лечебный эффект",
        "для наружного применения", "наружного применения",
        "крем", "мазь", "бальзам", "сыворотка", "капли", "ампулы", "саше", "сироп",
        "средство для глаз", "для глаз", "глаза", "глаз", "очей", "зрение", "усталость глаз",
        "сухость глаз", "контактные линзы", "слизистая", "веки", "глазные мышцы", "синий свет",
        "курс применения", "курсом", "нанесите", "наносите",
      ],
      bannedTermsUk: [
        ...BAN_SUPPLEMENT_UK,
        "лікує", "виліковує", "лікувальний ефект",
        "для зовнішнього застосування", "зовнішнього застосування",
        "крем", "мазь", "бальзам", "сироватка", "краплі", "ампули", "саше", "сироп",
        "засіб для очей", "для очей", "очі", "очей", "зір", "втома очей",
        "сухість очей", "контактні лінзи", "слизова", "повіки", "очні м'язи", "синє світло",
        "курс застосування", "курсом", "нанесіть", "наносьте",
      ],
      notesRu: [
        `Это бытовой / повседневный товар — «${generic.ru}». Это НЕ дієтична добавка, НЕ лекарство, НЕ крем/мазь. Описывайте его реальное назначение, материал/комплектацию (если есть в фиде), удобство использования и для кого он подходит. Не приписывайте медицинских свойств.`,
      ],
      notesUk: [
        `Це побутовий / повсякденний товар — «${generic.uk}». Це НЕ дієтична добавка, НЕ ліки, НЕ крем/мазь. Описуйте його реальне призначення, матеріал/комплектацію (якщо є у фіді), зручність використання і для кого він підходить. Не приписуйте медичних властивостей.`,
      ],
    };
  }

  return {
    kind: "unknown",
    formLabelRu: "товар",
    formLabelUk: "товар",
    requiredTermsRu: [],
    requiredTermsUk: [],
    bannedTermsRu: [],
    bannedTermsUk: [],
    notesRu: [],
    notesUk: [],
  };
}

// Generic-thing detection: known non-medical, non-supplement product nouns.
// Each entry maps a regex (matched against the lowercase title) to a
// human-readable form label in RU/UK plus the literal noun the AI is
// required to use. Order matters: more specific phrases first.
type GenericMatch = { ru: string; uk: string; requiredRu: string; requiredUk: string };
const GENERIC_THING_RULES: { re: RegExp; m: GenericMatch }[] = [
  // multi-word specifics first
  { re: /пистолет\s+для\s+мыльных\s+пузыр|пістолет\s+для\s+мильних\s+бульб/iu,
    m: { ru: "детский пистолет для мыльных пузырей", uk: "дитячий пістолет для мильних бульбашок", requiredRu: "пистолет для мыльных пузырей", requiredUk: "пістолет для мильних бульбашок" } },
  { re: /виниловый\s+проигрыватель|віниловий\s+програвач/iu,
    m: { ru: "виниловый проигрыватель", uk: "вініловий програвач", requiredRu: "виниловый проигрыватель", requiredUk: "вініловий програвач" } },
  { re: /садов\w*\s+(?:светод\w*\s+)?(?:светильник|фонар)|садов\w*\s+(?:світлод\w*\s+)?(?:світильник|ліхтар)/iu,
    m: { ru: "садовый светильник", uk: "садовий світильник", requiredRu: "садовый светильник", requiredUk: "садовий світильник" } },
  { re: /очист\w*\s+(?:косметич\w+\s+)?кист|очищ\w*\s+(?:косметич\w+\s+)?пензл/iu,
    m: { ru: "очиститель косметических кистей", uk: "очищувач косметичних пензликів", requiredRu: "очиститель кистей", requiredUk: "очищувач пензликів" } },
  // single nouns (head form)
  { re: /\bпроигрыватель|\bпрогравач/iu, m: { ru: "проигрыватель", uk: "програвач", requiredRu: "проигрыватель", requiredUk: "програвач" } },
  { re: /\bсветильник|\bсвітильник/iu,   m: { ru: "светильник", uk: "світильник", requiredRu: "светильник", requiredUk: "світильник" } },
  { re: /\bфонар/iu,                      m: { ru: "фонарь", uk: "ліхтар", requiredRu: "фонарь", requiredUk: "ліхтар" } },
  { re: /\bколонк/iu,                     m: { ru: "колонка", uk: "колонка", requiredRu: "колонка", requiredUk: "колонка" } },
  { re: /\bнаушник|\bнавушник/iu,        m: { ru: "наушники", uk: "навушники", requiredRu: "наушники", requiredUk: "навушники" } },
  { re: /\bнасос/iu,                      m: { ru: "насос", uk: "насос", requiredRu: "насос", requiredUk: "насос" } },
  { re: /обогреват|обігрівач/iu,         m: { ru: "обогреватель", uk: "обігрівач", requiredRu: "обогреватель", requiredUk: "обігрівач" } },
  { re: /термопростин|термоковдр|електропростин|электропростын|простын.*подогрев|простинь.*підігр|heated\s*(?:mat|sheet|blanket)|подогревом|підігрівом/i,
    m: { ru: "электропростынь с подогревом", uk: "електропростирадло з підігрівом", requiredRu: "простынь", requiredUk: "простирадло" } },
  { re: /увлажнител|зволожувач/iu,       m: { ru: "увлажнитель", uk: "зволожувач", requiredRu: "увлажнитель", requiredUk: "зволожувач" } },
  { re: /\bчайник/iu,                     m: { ru: "чайник", uk: "чайник", requiredRu: "чайник", requiredUk: "чайник" } },
  { re: /кофеварк|кавоварк/iu,           m: { ru: "кофеварка", uk: "кавоварка", requiredRu: "кофеварка", requiredUk: "кавоварка" } },
  { re: /блендер/iu,                      m: { ru: "блендер", uk: "блендер", requiredRu: "блендер", requiredUk: "блендер" } },
  { re: /\bфен\b/iu,                      m: { ru: "фен", uk: "фен", requiredRu: "фен", requiredUk: "фен" } },
  { re: /\bутюг|\bпраска/iu,             m: { ru: "утюг", uk: "праска", requiredRu: "утюг", requiredUk: "праска" } },
  { re: /очистител|очищувач/iu,          m: { ru: "очиститель", uk: "очищувач", requiredRu: "очиститель", requiredUk: "очищувач" } },
  { re: /пылесос|пилосос/iu,             m: { ru: "пылесос", uk: "пилосос", requiredRu: "пылесос", requiredUk: "пилосос" } },
  { re: /\bдрел|\bдриль/iu,              m: { ru: "дрель", uk: "дриль", requiredRu: "дрель", requiredUk: "дриль" } },
  { re: /шуруповёрт|шуруповерт/iu,       m: { ru: "шуруповёрт", uk: "шуруповерт", requiredRu: "шуруповёрт", requiredUk: "шуруповерт" } },
  { re: /триммер|тример/iu,              m: { ru: "триммер", uk: "тример", requiredRu: "триммер", requiredUk: "тример" } },
  { re: /\bшланг/iu,                      m: { ru: "шланг", uk: "шланг", requiredRu: "шланг", requiredUk: "шланг" } },
  { re: /теплиц/iu,                       m: { ru: "теплица", uk: "теплиця", requiredRu: "теплица", requiredUk: "теплиця" } },
  { re: /кормушк|годівниц/iu,            m: { ru: "кормушка", uk: "годівниця", requiredRu: "кормушка", requiredUk: "годівниця" } },
  { re: /поилк|напувалк/iu,              m: { ru: "поилка", uk: "напувалка", requiredRu: "поилка", requiredUk: "напувалка" } },
  { re: /ошейник|нашийник/iu,            m: { ru: "ошейник", uk: "нашийник", requiredRu: "ошейник", requiredUk: "нашийник" } },
  { re: /поводок|повідець|повідк/iu,     m: { ru: "поводок", uk: "повідець", requiredRu: "поводок", requiredUk: "повідець" } },
  { re: /переноск/iu,                     m: { ru: "переноска", uk: "переноска", requiredRu: "переноска", requiredUk: "переноска" } },
  { re: /рюкзак/iu,                       m: { ru: "рюкзак", uk: "рюкзак", requiredRu: "рюкзак", requiredUk: "рюкзак" } },
  { re: /\bсумк/iu,                       m: { ru: "сумка", uk: "сумка", requiredRu: "сумка", requiredUk: "сумка" } },
  { re: /\bчехол|\bчохол/iu,             m: { ru: "чехол", uk: "чохол", requiredRu: "чехол", requiredUk: "чохол" } },
  { re: /держател|тримач/iu,             m: { ru: "держатель", uk: "тримач", requiredRu: "держатель", requiredUk: "тримач" } },
  { re: /штатив/iu,                       m: { ru: "штатив", uk: "штатив", requiredRu: "штатив", requiredUk: "штатив" } },
  { re: /проектор/iu,                     m: { ru: "проектор", uk: "проектор", requiredRu: "проектор", requiredUk: "проектор" } },
  { re: /телескоп/iu,                     m: { ru: "телескоп", uk: "телескоп", requiredRu: "телескоп", requiredUk: "телескоп" } },
  { re: /бинокл|бінокл/iu,               m: { ru: "бинокль", uk: "бінокль", requiredRu: "бинокль", requiredUk: "бінокль" } },
  { re: /фотоаппарат|фотоапарат/iu,      m: { ru: "фотоаппарат", uk: "фотоапарат", requiredRu: "фотоаппарат", requiredUk: "фотоапарат" } },
  { re: /отпугиват|відлякувач/iu,        m: { ru: "отпугиватель", uk: "відлякувач", requiredRu: "отпугиватель", requiredUk: "відлякувач" } },
  { re: /ловушк|пастк/iu,                m: { ru: "ловушка", uk: "пастка", requiredRu: "ловушка", requiredUk: "пастка" } },
  { re: /пистолет|пістолет/iu,           m: { ru: "пистолет", uk: "пістолет", requiredRu: "пистолет", requiredUk: "пістолет" } },
  { re: /ножниц|ножиц/iu,                m: { ru: "ножницы", uk: "ножиці", requiredRu: "ножницы", requiredUk: "ножиці" } },
  { re: /конструктор/iu,                  m: { ru: "конструктор", uk: "конструктор", requiredRu: "конструктор", requiredUk: "конструктор" } },
  { re: /\bкукл|\bляльк/iu,              m: { ru: "кукла", uk: "лялька", requiredRu: "кукла", requiredUk: "лялька" } },
  { re: /\bмашинк/iu,                     m: { ru: "машинка", uk: "машинка", requiredRu: "машинка", requiredUk: "машинка" } },
  { re: /самокат/iu,                      m: { ru: "самокат", uk: "самокат", requiredRu: "самокат", requiredUk: "самокат" } },
  { re: /велосипед/iu,                    m: { ru: "велосипед", uk: "велосипед", requiredRu: "велосипед", requiredUk: "велосипед" } },
  { re: /\bролик/iu,                      m: { ru: "ролики", uk: "ролики", requiredRu: "ролики", requiredUk: "ролики" } },
  { re: /\bкед[ыи]\b/iu,                  m: { ru: "кеды", uk: "кеди", requiredRu: "кеды", requiredUk: "кеди" } },
  { re: /кроссовк|кросівк/iu,            m: { ru: "кроссовки", uk: "кросівки", requiredRu: "кроссовки", requiredUk: "кросівки" } },
  { re: /сандали|сандал/iu,              m: { ru: "сандалии", uk: "сандалі", requiredRu: "сандалии", requiredUk: "сандалі" } },
  { re: /ботинк|черевик/iu,              m: { ru: "ботинки", uk: "черевики", requiredRu: "ботинки", requiredUk: "черевики" } },
  { re: /\bшорт/iu,                       m: { ru: "шорты", uk: "шорти", requiredRu: "шорты", requiredUk: "шорти" } },
  { re: /футболк/iu,                      m: { ru: "футболка", uk: "футболка", requiredRu: "футболка", requiredUk: "футболка" } },
  { re: /толстовк/iu,                     m: { ru: "толстовка", uk: "толстовка", requiredRu: "толстовка", requiredUk: "толстовка" } },
  { re: /\bкуртк/iu,                      m: { ru: "куртка", uk: "куртка", requiredRu: "куртка", requiredUk: "куртка" } },
  { re: /пончо/iu,                        m: { ru: "пончо", uk: "пончо", requiredRu: "пончо", requiredUk: "пончо" } },
  { re: /\bшапк/iu,                       m: { ru: "шапка", uk: "шапка", requiredRu: "шапка", requiredUk: "шапка" } },
  { re: /перчатк|рукавичк/iu,            m: { ru: "перчатки", uk: "рукавички", requiredRu: "перчатки", requiredUk: "рукавички" } },
  { re: /колготк/iu,                      m: { ru: "колготки", uk: "колготки", requiredRu: "колготки", requiredUk: "колготки" } },
  { re: /\bлампа\b|\bлампи\b|\bлампу\b/iu, m: { ru: "лампа", uk: "лампа", requiredRu: "лампа", requiredUk: "лампа" } },
  { re: /\bвесы\b|\bваги\b/iu,           m: { ru: "весы", uk: "ваги", requiredRu: "весы", requiredUk: "ваги" } },
  { re: /\bкабел/iu,                      m: { ru: "кабель", uk: "кабель", requiredRu: "кабель", requiredUk: "кабель" } },
  { re: /адаптер/iu,                      m: { ru: "адаптер", uk: "адаптер", requiredRu: "адаптер", requiredUk: "адаптер" } },
  { re: /зарядк/iu,                       m: { ru: "зарядка", uk: "зарядка", requiredRu: "зарядка", requiredUk: "зарядка" } },
  { re: /\bночник|\bнічник/iu,           m: { ru: "ночник", uk: "нічник", requiredRu: "ночник", requiredUk: "нічник" } },
];

function detectGenericThingFromTitle(title: string): GenericMatch | null {
  const t = (title || "").toLowerCase();
  if (!t) return null;
  for (const rule of GENERIC_THING_RULES) {
    if (rule.re.test(t)) return rule.m;
  }
  return null;
}

// ============================================================
// DEV-ONLY: detector sanity check. Runs once at module load in dev to
// catch regressions in form-detection regex. Logs to console.warn on
// mismatch; never throws. Add representative product titles here when
// fixing a misclassification bug.
// ============================================================
const DETECTOR_FIXTURES: { title: string; cat?: string; expect: ProductKind | ProductKind[] }[] = [
  // The bug that motivated PRIORITY 0.5 + Unicode-aware eye_care regex:
  { title: "Электрический очиститель косметических кистей для макияжа", cat: "kosmeticke-nastroje", expect: "generic_item" },
  { title: "Цифровий тонометр на зап'ясті з екраном", cat: "krevni-tlak", expect: "device" },
  { title: "Optilix - капсулы для зрения", cat: "vision", expect: "capsules" },
  { title: "Visiomax - капли для глаз", cat: "vision", expect: ["drops", "eye_care"] },
  { title: "Крем для лица с гиалуроновой кислотой", cat: "skin-care", expect: "cream" },
  { title: "Шампунь от перхоти Foltene", cat: "vypadavani-vlasu", expect: "shampoo" },
  { title: "Виниловый проигрыватель Crosley", cat: "electronics", expect: "generic_item" },
  { title: "Pantohor - капсулы для суставов", cat: "klouby", expect: "capsules" },
  { title: "Садовый светильник на солнечной батарее", cat: "garden", expect: "generic_item" },
  { title: "Эректобуст - таблетки для потенции", cat: "potence", expect: "tablets" },
  { title: "Detoxil - капли от паразитов", cat: "paraziti", expect: "drops" },
  { title: "Detoxil Water Parasites", cat: "paraziti", expect: "drops" },
];

if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
  queueMicrotask(() => {
    try {
      for (const f of DETECTOR_FIXTURES) {
        const got = detectProductFacts(f.title, f.cat ?? "", "").kind;
        const expected = Array.isArray(f.expect) ? f.expect : [f.expect];
        if (!expected.includes(got)) {
          console.warn(
            `[product-facts] detector regression: title=${JSON.stringify(f.title)} expected=${expected.join("|")} got=${got}`,
          );
        }
      }
    } catch (err) {
      console.warn("[product-facts] sanity check failed:", err);
    }
  });
}



// Build the FACTS block injected into the AI prompt.
export function buildFactsBlock(facts: ProductFacts, lang: "uk" | "ru"): string {
  if (facts.kind === "unknown") return "";
  if (lang === "uk") {
    const required = requiredTermsIt(facts).join(", ") || "—";
    const notes = factsNotesIt(facts).map((n) => `- ${n}`).join("\n");
    return `================ FATTI PRODOTTO (PRIORITÀ MASSIMA) ================
Tipo prodotto effettivo: ${formLabelIt(facts)}
Termini da usare letteralmente: ${required}
${notes}`;
  }
  const required = facts.requiredTermsRu.length ? facts.requiredTermsRu.join(", ") : "—";
  const notes = facts.notesRu.map((n) => `- ${n}`).join("\n");
  return `================ ФАКТЫ ТОВАРА (ВЫСШИЙ ПРИОРИТЕТ) ================
Фактический тип товара: ${facts.formLabelRu}
Термины, которые должны появиться буквально: ${required}
${notes}`;
}

// Validate that generated content respects product facts. Returns list of
// human-readable violations to feed back into a retry.
export function validateAgainstFacts(
  content: { title: string; subtitle: string; meta_desc: string; intro: string; sections?: { heading: string; body: string }[]; faq?: { q: string; a: string }[] },
  facts: ProductFacts,
  lang: "uk" | "ru",
): string[] {
  if (facts.kind === "unknown") return [];
  const required = lang === "uk" ? facts.requiredTermsUk : facts.requiredTermsRu;

  const violations: string[] = [];
  // Required terms: at least one of them must appear in subtitle OR first
  // sentence of intro — the most visible SEO surfaces. Anywhere-in-blob
  // is too weak (the form would still be missing from cards/snippets).
  if (required.length > 0) {
    const subtitleLc = (content.subtitle || "").toLowerCase();
    const introFirst = (content.intro || "").trim().match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.toLowerCase() ?? "";
    const titleLc = (content.title || "").toLowerCase();
    const metaLc = (content.meta_desc || "").toLowerCase();
    const visibleBlob = `${titleLc} ${subtitleLc} ${metaLc} ${introFirst}`;
    const anyPresent = required.some((t) => visibleBlob.includes(t.toLowerCase()));
    if (!anyPresent) {
      violations.push(
        lang === "uk"
          ? `In title / subtitle / meta_desc / prima frase intro manca un termine obbligatorio della forma prodotto: ${required.join(", ")}. La forma dal feed va nominata letteralmente.`
          : `в title / subtitle / meta_desc / первом предложении intro не появилось ни одного из обязательных терминов формы товара: ${required.join(", ")}. Форма товара из фида должна быть названа буквально.`,
      );
    }
  }
  return violations;
}

// ============================================================
// FEED SPECIFICS — extract concrete organs, conditions, effects,
// ingredients from the raw feed so the AI must use them instead of
// generic "water" phrases.
// ============================================================

export type FeedSpecifics = {
  organs: string[];      // organs/systems mentioned in feed (uk surface forms)
  conditions: string[];  // diseases/symptoms
  effects: string[];     // verbs/actions explicitly stated
  ingredients: string[]; // components explicitly listed
};

// Dictionaries: each entry is a regex matched against the full feed blob
// (title + description), and a normalized surface form per language.
const ORGAN_DICT: { re: RegExp; ru: string; uk: string }[] = [
  { re: /простат/iu, ru: "простата", uk: "простата" },
  { re: /потенц/iu, ru: "потенция", uk: "потенція" },
  { re: /эрекц|ерекц/iu, ru: "эрекция", uk: "ерекція" },
  { re: /либидо|лібідо/iu, ru: "либидо", uk: "лібідо" },
  { re: /печен[иь]|печінк/iu, ru: "печень", uk: "печінка" },
  { re: /почк[иа]|нирк/iu, ru: "почки", uk: "нирки" },
  { re: /сердц|серц/iu, ru: "сердце", uk: "серце" },
  { re: /сосуд|судин/iu, ru: "сосуды", uk: "судини" },
  { re: /давлен|тиск/iu, ru: "давление", uk: "тиск" },
  { re: /сустав|суглоб/iu, ru: "суставы", uk: "суглоби" },
  { re: /позвоночник|хребет/iu, ru: "позвоночник", uk: "хребет" },
  { re: /кост[еи]|кістк/iu, ru: "кости", uk: "кістки" },
  { re: /мышц|м'яз/iu, ru: "мышцы", uk: "м'язи" },
  { re: /кож[ау]|шкір/iu, ru: "кожа", uk: "шкіра" },
  { re: /ногт[еия]|нігт/iu, ru: "ногти", uk: "нігті" },
  { re: /волос/iu, ru: "волосы", uk: "волосся" },
  { re: /глаз|зрен|очі|зір|око/iu, ru: "глаза/зрение", uk: "очі/зір" },
  { re: /слух|вух/iu, ru: "слух", uk: "слух" },
  { re: /желудок|шлунок/iu, ru: "желудок", uk: "шлунок" },
  { re: /кишечник|кишківн/iu, ru: "кишечник", uk: "кишківник" },
  { re: /мочев|сеч[оі]в/iu, ru: "мочевой пузырь", uk: "сечовий міхур" },
  { re: /щитовид/iu, ru: "щитовидная железа", uk: "щитоподібна залоза" },
  { re: /иммунит|імунітет/iu, ru: "иммунитет", uk: "імунітет" },
  { re: /нерв/iu, ru: "нервная система", uk: "нервова система" },
  { re: /мозг|мозок/iu, ru: "мозг", uk: "мозок" },
];

const CONDITION_DICT: { re: RegExp; ru: string; uk: string }[] = [
  { re: /грибк|грибок|грибков|мікоз|онихомикоз|оніхомікоз/iu, ru: "грибок (микоз)", uk: "грибок (мікоз)" },
  { re: /гипертон|гіпертон/iu, ru: "гипертония", uk: "гіпертонія" },
  { re: /диабет|діабет/iu, ru: "диабет", uk: "діабет" },
  { re: /варикоз/iu, ru: "варикоз", uk: "варикоз" },
  { re: /геморр?ой|гемор[оії]й/iu, ru: "геморрой", uk: "геморой" },
  { re: /цистит/iu, ru: "цистит", uk: "цистит" },
  { re: /недержани|нетриман/iu, ru: "недержание мочи", uk: "нетримання сечі" },
  { re: /простатит/iu, ru: "простатит", uk: "простатит" },
  { re: /артрит|артроз/iu, ru: "артрит/артроз", uk: "артрит/артроз" },
  { re: /остеохондроз/iu, ru: "остеохондроз", uk: "остеохондроз" },
  { re: /псориаз|псоріаз/iu, ru: "псориаз", uk: "псоріаз" },
  { re: /паразит/iu, ru: "паразиты", uk: "паразити" },
  { re: /алкоголь|алкогол[іиь]зм|залежн|зависим/iu, ru: "алкогольная зависимость / тяга к алкоголю", uk: "алкогольна залежність / тяга до алкоголю" },
  { re: /похуд|схуд|избыточн|зайвої ваги|лишн.*вес/iu, ru: "избыточный вес", uk: "зайва вага" },
  { re: /бессонниц|безсонн|нарушени[ея] сна|порушення сну/iu, ru: "бессонница / нарушения сна", uk: "безсоння / порушення сну" },
  { re: /мигрен|мігрен|головн.*бол/iu, ru: "головная боль / мигрень", uk: "головний біль / мігрень" },
  { re: /воспал|запален/iu, ru: "воспаление", uk: "запалення" },
  { re: /сух(ост|іст)[ьі]\s+(глаз|очей)/iu, ru: "сухость глаз", uk: "сухість очей" },
  { re: /усталост[ьі]\s+(глаз|очей)|втом[аи]\s+оч/iu, ru: "усталость глаз", uk: "втома очей" },
  { re: /зуд|свербіж/iu, ru: "зуд", uk: "свербіж" },
  { re: /трещин|тріщин/iu, ru: "трещины", uk: "тріщини" },
];

const EFFECT_DICT: { re: RegExp; ru: string; uk: string }[] = [
  { re: /сниж.*давл|знижу.*тиск/iu, ru: "снижает давление", uk: "знижує тиск" },
  { re: /стабилизир.*давл|стабілізу.*тиск/iu, ru: "стабилизирует давление", uk: "стабілізує тиск" },
  { re: /укрепля.*сосуд|зміцн.*судин/iu, ru: "укрепляет сосуды", uk: "зміцнює судини" },
  { re: /восстанавл|відновл/iu, ru: "восстанавливает", uk: "відновлює" },
  { re: /очища[еє]т|очищ/iu, ru: "очищает", uk: "очищає" },
  { re: /снима.*тяг|зніма.*тяг|знижу.*потяг/iu, ru: "снимает тягу", uk: "знімає потяг" },
  { re: /уничтожа.*грибк|знищу.*грибк/iu, ru: "уничтожает грибок", uk: "знищує грибок" },
  { re: /улучша.*зрен|поліпш.*зір/iu, ru: "улучшает зрение", uk: "поліпшує зір" },
  { re: /снима.*воспал|зніма.*запален/iu, ru: "снимает воспаление", uk: "знімає запалення" },
  { re: /повыша.*потенц|підвищ.*потенц/iu, ru: "повышает потенцию", uk: "підвищує потенцію" },
  { re: /улучша.*эрекц|поліпш.*ерекц/iu, ru: "улучшает эрекцию", uk: "поліпшує ерекцію" },
  { re: /норм(ализ|алізу).*мочеиспуск|норм(ализ|алізу).*сечовип/iu, ru: "нормализует мочеиспускание", uk: "нормалізує сечовипускання" },
  { re: /увлажн|зволож/iu, ru: "увлажняет", uk: "зволожує" },
];

// Common natural ingredients — only used when explicitly mentioned in feed.
const INGREDIENT_DICT: { re: RegExp; ru: string; uk: string }[] = [
  { re: /экстракт\s+(\p{L}+)|екстракт\s+(\p{L}+)/iu, ru: "экстракт", uk: "екстракт" },
  { re: /прополис|прополіс/iu, ru: "прополис", uk: "прополіс" },
  { re: /пчелин|бджолин/iu, ru: "пчелиный продукт", uk: "бджолиний продукт" },
  { re: /женьшен[ьі]?/iu, ru: "женьшень", uk: "женьшень" },
  { re: /гинкго|гінкго/iu, ru: "гинкго билоба", uk: "гінкго білоба" },
  { re: /пальм[ыи]\s+сабаль|со\s+пальметт/iu, ru: "сереноа (со пальметто)", uk: "сереноа (со пальметто)" },
  { re: /клюкв|журавлин/iu, ru: "клюква", uk: "журавлина" },
  { re: /черник|чорниц/iu, ru: "черника", uk: "чорниця" },
  { re: /лютеин|лютеїн/iu, ru: "лютеин", uk: "лютеїн" },
  { re: /омег[аи]/iu, ru: "омега-кислоты", uk: "омега-кислоти" },
  { re: /витамин\s+[A-EК]|вітамін\s+[A-EК]/iu, ru: "витамины", uk: "вітаміни" },
  { re: /цинк/iu, ru: "цинк", uk: "цинк" },
  { re: /магний|магній/iu, ru: "магний", uk: "магній" },
  { re: /коллаген|колаген/iu, ru: "коллаген", uk: "колаген" },
  { re: /гиалурон|гіалурон/iu, ru: "гиалуроновая кислота", uk: "гіалуронова кислота" },
];

function pickDict(
  blob: string,
  dict: { re: RegExp; ru: string; uk: string }[],
  lang: "uk" | "ru",
): string[] {
  const out = new Set<string>();
  for (const e of dict) if (e.re.test(blob)) out.add(lang === "uk" ? e.uk : e.ru);
  return Array.from(out);
}

export function extractFeedSpecifics(
  title: string,
  description: string,
  lang: "uk" | "ru" = "uk",
): FeedSpecifics {
  const blob = `${title} ${description}`;
  return {
    organs: pickDict(blob, ORGAN_DICT, lang),
    conditions: pickDict(blob, CONDITION_DICT, lang),
    effects: pickDict(blob, EFFECT_DICT, lang),
    ingredients: pickDict(blob, INGREDIENT_DICT, lang),
  };
}

export function buildSpecificsBlock(spec: FeedSpecifics, lang: "uk" | "ru"): string {
  const total =
    spec.organs.length + spec.conditions.length + spec.effects.length + spec.ingredients.length;
  if (total === 0) {
    return lang === "uk"
      ? `================ FATTI CONCRETI DAL FEED ================
Nel feed non sono stati individuati organi / condizioni / effetti / componenti espliciti.
SCRIVI IN MODO MASSIMAMENTE CONCRETO in base al nome prodotto. Nessun componente nel feed — proponi un mix tipico per la categoria (3–6 componenti). Vietate frasi generiche su «supporto dell'organismo», «azione complessa».`
      : `================ КОНКРЕТНЫЕ ФАКТЫ ИЗ ФИДА ================
В фиде не удалось выделить явные органы / состояния / эффекты / компоненты.
ПИШИТЕ МАКСИМАЛЬНО КОНКРЕТНО по названию товара. Компонентов в фиде нет — предложите типичный состав для категории (3–6 компонентов). Не прибегайте к общим фразам о «поддержке организма», «комплексном действии» — они строго запрещены.`;
  }
  const fmt = (xs: string[]) => (xs.length ? xs.join(", ") : "—");
  if (lang === "uk") {
    return `================ FATTI CONCRETI DAL FEED (USA IN PRIORITÀ) ================
Organo / sistema: ${fmt(spec.organs)}
Condizione / problema: ${fmt(spec.conditions)}
Azione / effetto (letteralmente dal feed): ${fmt(spec.effects)}
Componenti (dal feed, se presenti): ${fmt(spec.ingredients)}${spec.ingredients.length === 0 ? "\nNessun componente nel feed — proponi un mix tipico per la categoria." : ""}

OBBLIGATORIO: subtitle e meta_desc devono contenere almeno 1 termine concreto da questo blocco (organo, condizione, azione o componente). Anche la prima frase dell'intro.`;
  }
  return `================ КОНКРЕТНЫЕ ФАКТЫ ИЗ ФИДА (ИСПОЛЬЗОВАТЬ В ПЕРВУЮ ОЧЕРЕДЬ) ================
Орган / система: ${fmt(spec.organs)}
Состояние / проблема: ${fmt(spec.conditions)}
Действие / эффект (буквально из фида): ${fmt(spec.effects)}
Компоненты (из фида, если есть): ${fmt(spec.ingredients)}${spec.ingredients.length === 0 ? "\nКомпонентов в фиде нет — предложите типичный состав для категории." : ""}

ОБЯЗАТЕЛЬНО: subtitle и meta_desc должны содержать хотя бы 1 конкретный термин из этого блока (орган, состояние, действие или компонент). Первое предложение intro — тоже.`;
}

// ============================================================
// ANTI-WATER VALIDATION
// ============================================================

export const WATER_PHRASES_RU = [
  "эффективное средство",
  "эффективное решение",
  "комплексная поддержка",
  "комплексной поддержки",
  "комплексная поддержка организма",
  "поддержка организма",
  "поддержки организма",
  "общая поддержка",
  "общей поддержки",
  "деликатное состояние",
  "деликатного состояния",
  "деликатных состояний",
  "восстановления деликатного",
  "для поддержания мужской силы",
  "поддержание мужской силы",
  "мужской силы и активности",
  "для женского здоровья в целом",
  "современное решение",
  "инновационная формула",
  "инновационное решение",
  "уникальный продукт",
  "уникальная формула",
  "натуральная формула",
  "решение для всей семьи",
  "забота о здоровье",
  "забота о вашем здоровье",
  // v18: generic men's-vitality / prostate filler observed in production
  "поддержание мужского здоровья",
  "поддержания мужского здоровья",
  "поддержки мужского здоровья",
  "поддержка мужского здоровья",
  "для мужского здоровья",
  "мужского здоровья и комфорта",
  "комфорт мужского организма",
  "комфорта мужского организма",
  "жизненной активности",
  "поддержание жизненной активности",
  "повышения жизненной активности",
  "поддержки жизненной активности",
  "общее самочувствие",
  "общего самочувствия",
  "общий тонус",
  "общего тонуса",
  "качество жизни",
  "качества жизни",
  "нежелательные гости",
  "нежелательных гостей",
  "нежелательные образования",
  "нежелательных образований",
  "комплексное воздействие",
  "комплексного воздействия",
  "естественное равновесие",
  "помогает восстановить естественное равновесие",
];

export const WATER_PHRASES_UK = [
  "ефективний засіб",
  "ефективне рішення",
  "комплексна підтримка",
  "комплексної підтримки",
  "комплексна підтримка організму",
  "підтримка організму",
  "підтримки організму",
  "загальна підтримка",
  "загальної підтримки",
  "делікатний стан",
  "делікатного стану",
  "делікатних станів",
  "відновлення делікатного",
  "для підтримання чоловічої сили",
  "підтримання чоловічої сили",
  "чоловічої сили та активності",
  "для жіночого здоров'я загалом",
  "сучасне рішення",
  "інноваційна формула",
  "інноваційне рішення",
  "унікальний продукт",
  "унікальна формула",
  "натуральна формула",
  "рішення для всієї родини",
  "турбота про здоров'я",
  // v18: generic men's-vitality / prostate filler observed in production
  "підтримання чоловічого здоров'я",
  "підтримки чоловічого здоров'я",
  "підтримка чоловічого здоров'я",
  "для чоловічого здоров'я",
  "чоловічого здоров'я та комфорту",
  "комфорт чоловічого організму",
  "комфорту чоловічого організму",
  "життєвої активності",
  "підтримання життєвої активності",
  "підвищення життєвої активності",
  "загальне самопочуття",
  "загального самопочуття",
  "загальний тонус",
  "загального тонусу",
  "якість життя",
  "якості життя",
  "небажані гості",
  "небажаних гостей",
  "небажані утворення",
  "небажаних утворень",
  "комплексний вплив",
  "комплексного впливу",
  "природна рівновага",
  "природну рівновагу",
];

function firstSentence(text: string): string {
  const m = text.trim().match(/^[\s\S]*?[.!?](?:\s|$)/);
  return (m ? m[0] : text).toLowerCase();
}

export function validateSpecificity(
  content: { subtitle: string; meta_desc: string; intro: string },
  spec: FeedSpecifics,
  lang: "uk" | "ru",
  extraAllowedTokens: string[] = [],
): string[] {
  const water = lang === "uk" ? WATER_PHRASES_ES : WATER_PHRASES_RU;
  const sub = (content.subtitle || "").toLowerCase();
  const meta = (content.meta_desc || "").toLowerCase();
  const intro1 = firstSentence(content.intro || "");
  const violations: string[] = [];

  const foundWater = new Set<string>();
  for (const w of water) {
    if (sub.includes(w) || meta.includes(w) || intro1.includes(w)) foundWater.add(w);
  }
  if (foundWater.size > 0) {
    violations.push(
      lang === "uk"
        ? `In subtitle / meta_desc / prima frase intro compaiono frasi «acqua»: ${Array.from(foundWater).join(", ")}. SOSTITUISCILE con termini concreti dal blocco «FATTI CONCRETI DAL FEED» o «DETTAGLI CATEGORIA».`
        : `в subtitle / meta_desc / первом предложении intro использованы «вода»-фразы: ${Array.from(foundWater).join(", ")}. ЗАМЕНИТЕ их конкретными словами из блока «КОНКРЕТНЫЕ ФАКТЫ ИЗ ФИДА» или «КОНКРЕТИКА КАТЕГОРИИ».`,
    );
  }

  const feedTokens = [...spec.organs, ...spec.conditions, ...spec.effects, ...spec.ingredients]
    .flatMap((s) => s.split(/[\s/(),]+/))
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 4);
  const extraTokens = extraAllowedTokens
    .flatMap((s) => s.split(/[\s/(),]+/))
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 4);
  const allSpecTokens = [...feedTokens, ...extraTokens];
  if (allSpecTokens.length > 0) {
    const subMetaBlob = `${sub} ${meta} ${intro1}`;
    const hit = allSpecTokens.some((tok) => subMetaBlob.includes(tok));
    if (!hit) {
      violations.push(
        lang === "uk"
          ? `In subtitle / meta_desc / prima frase intro manca un termine concreto da «FATTI CONCRETI DAL FEED» / «DETTAGLI CATEGORIA». Aggiungi almeno uno (organo, condizione, effetto o componente).`
          : `в subtitle / meta_desc / первом предложении intro не появилось ни одного конкретного термина из «КОНКРЕТНЫЕ ФАКТЫ ИЗ ФИДА» / «КОНКРЕТИКА КАТЕГОРИИ». Добавьте минимум один (орган, состояние, эффект или компонент).`,
      );
    }
  }
  return violations;
}

// ============================================================
// CATEGORY PURPOSE BANS — disabled (v52-no-forbidden-bans).
// Stubs kept for API compatibility; enforcement removed from pipeline.
// ============================================================

export function getCategoryPurposeBanLabels(_categorySlug: string, _lang: "uk" | "ru"): string[] {
  return [];
}

export function buildPurposeBansBlock(_categorySlug: string, _lang: "uk" | "ru"): string {
  return "";
}

const CYR_WORD_CLASS = "A-Za-z0-9_А-Яа-яІіЇїЄєҐґЁёЎў";
const CYR_BOUNDARY =
  `(?:(?<![${CYR_WORD_CLASS}])(?=[${CYR_WORD_CLASS}])|(?<=[${CYR_WORD_CLASS}])(?![${CYR_WORD_CLASS}]))`;
const __reFixCache = new WeakMap<RegExp, RegExp>();

export function cyrFixRegex(re: RegExp): RegExp {
  const cached = __reFixCache.get(re);
  if (cached) return cached;
  const src = re.source;
  if (!src.includes("\\b") && !src.includes("\\w")) {
    __reFixCache.set(re, re);
    return re;
  }
  const rewritten = src
    .replace(/\\b/g, CYR_BOUNDARY)
    .replace(/\\w/g, `[${CYR_WORD_CLASS}]`);
  const fixed = new RegExp(rewritten, re.flags);
  __reFixCache.set(re, fixed);
  return fixed;
}

export function findPurposeBanHits(
  _blob: string,
  _categorySlug: string,
  _lang: "uk" | "ru",
): string[] {
  return [];
}
