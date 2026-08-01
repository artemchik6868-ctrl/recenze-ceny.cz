/** Czech product-title descriptor translation — few-shots for LLM guidance. */

import { getCategoryDescriptor } from "./category-descriptors.cs";
import { problemRoleForShelf } from "./problem-vocabulary.cs";

const NON_MEDICAL_SHELF_HINT_SLUGS = new Set([
  "optika",
  "domaci-vychytavky",
  "kosmeticke-nastroje",
  "osobni-pece",
  "autodoplnky",
  "obleceni",
  "boty",
  "modni-doplnky",
  "hracky",
  "domaci-potreby",
  "domaci-textil",
  "outdoor-kempovani",
  "masazni-pristroje",
  "domaci-klima",
  "vyhrivane-obleceni",
  "lekarske-pristroje",
]);

export type TitleTranslateFewShot = {
  input: string;
  output: string;
};

/** Good CZ descriptors (2–6 words). Input may be RU/EN/DE feed tail after mechanical clean. */
export const TITLE_TRANSLATE_FEW_SHOTS: TitleTranslateFewShot[] = [
  { input: "капсулы для потенции", output: "kapsle na potenci" },
  { input: "capsules for potency", output: "kapsle na potenci" },
  { input: "Kapseln für die Potenz", output: "kapsle na potenci" },
  { input: "гель для суставов", output: "kloubní gel" },
  { input: "joint gel / gel za sklepe", output: "kloubní gel" },
  { input: "Gelenkgel", output: "kloubní gel" },
  { input: "средство для похудения", output: "produkt na hubnutí" },
  { input: "weight loss capsules", output: "kapsle na hubnutí" },
  { input: "крем от геморроя", output: "krém proti hemoroidům" },
  { input: "hemorrhoid cream", output: "krém proti hemoroidům" },
  { input: "спрей от грибка", output: "sprej proti plísním" },
  { input: "antifungal spray", output: "sprej proti plísním" },
  { input: "от нейропатии / neuropat", output: "kapsle proti neuropatii" },
  { input: "neuropathy support capsules", output: "kapsle proti neuropatii" },
  { input: "kapsule protiv glivic / antifung capsules", output: "kapsle proti plísni nehtů" },
  { input: "ANTIFUNGAL SOLUTION", output: "kapsle proti plísni nehtů" },
  { input: "antifungal solution", output: "kapsle proti plísni nehtů" },
  { input: "portable heater / handy heater", output: "přenosné elektrické topidlo" },
  { input: "night driving glasses", output: "brýle na noční jízdu" },
  { input: "Nachtfahrbrille", output: "brýle na noční jízdu" },
  { input: "от простатита", output: "kapsle na prostatu" },
  { input: "prostate support capsules", output: "kapsle na prostatu" },
  { input: "мармелад для похудения", output: "gumové bonbony na hubnutí" },
  { input: "vision support capsules", output: "kapsle na podporu zraku" },
  { input: "Kapseln für die Augen", output: "kapsle na podporu zraku" },
  { input: "spray valgus / hallux", output: "sprej proti vbočeným palcům" },
  { input: "smoking cessation capsules", output: "kapsle na odvykání kouření" },
  { input: "smoking", output: "kapsle na odvykání kouření" },
  { input: "hair growth supplement", output: "produkt na růst vlasů" },
  { input: "massage mat", output: "masážní podložka" },
  { input: "shaping leggings", output: "formující legíny" },
  { input: "capsules for weight control", output: "kapsle na kontrolu hmotnosti" },
  { input: "for cystitis / bladder", output: "kapsle proti cystitidě" },
  { input: "joint support capsules", output: "kloubní kapsle" },
  { input: "anti-aging capsules", output: "anti-aging kapsle" },
  { input: "rejuvenation supplement capsules", output: "anti-aging doplněk stravy" },
  { input: "digestive support capsules", output: "kapsle na podporu trávení" },
  { input: "gastrointestinal comfort supplement", output: "produkt na podporu trávení" },
  { input: "Verdauungsmittel Kapseln", output: "kapsle na podporu trávení" },
  { input: "diabetes glucose control capsules", output: "kapsle na podporu hladiny cukru" },
  { input: "DM-Norm glucose support", output: "produkt na podporu hladiny cukru" },
  { input: "capsule pentru — cistită", output: "kapsle proti cystitidě" },
  { input: "capsule pentru controlul — greutății", output: "kapsle na kontrolu hmotnosti" },
  { input: "сухой очиститель для автомобиля", output: "suchý autočistič" },
  { input: "dry car cleaner", output: "suchý autočistič" },
  { input: "ARTHRITIS PRODUCT", output: "kloubní produkt" },
  { input: "ARTHR IS P DUCT", output: "kloubní produkt" },
  { input: "JOINT GEL", output: "kloubní gel" },
  { input: "JOINT CARE GEL", output: "kloubní gel" },
  { input: "HONDRO GEL", output: "kloubní gel" },
  { input: "SUGAR CONTROL SUPPLEMENT", output: "produkt na podporu hladiny cukru" },
  { input: "SUGAR CONTROL SUP EM T", output: "produkt na podporu hladiny cukru" },
  { input: "ARTHRITIS RELIEF CREAM", output: "kloubní krém" },
  { input: "JOINT SUPPORT FORMULA", output: "kloubní produkt" },
  { input: "monocular", output: "monokulár" },
  { input: "Monocular", output: "monokulár" },
  { input: "binocular", output: "binokulár" },
  { input: "telescope", output: "dalekohled" },
  { input: "fond de ten", output: "make-up základ" },
  { input: "foundation makeup", output: "make-up základ" },
  { input: "BB cream", output: "BB krém" },
  { input: "кушон / BB cushion / makeup cushion", output: "cushion make-up" },
  { input: "ultrasonic rodent repellent", output: "ultrazvukový odpuzovač hlodavců" },
  { input: "Pest Reject", output: "ultrazvukový odpuzovač hlodavců" },
  { input: "epilator", output: "epilátor" },
  { input: "trimmer", output: "zastřihovač" },
  { input: "night vision glasses", output: "brýle na noční jízdu" },
  { input: "knee brace", output: "kolenní ortéza" },
  { input: "средство для суставов", output: "kloubní produkt" },
];

const PRODUCT_FORM_TAIL_RULES: { pattern: RegExp; output: string }[] = [
  { pattern: /\bmonocular\b/i, output: "monokulár" },
  { pattern: /\bbinocular\b/i, output: "binokulár" },
  { pattern: /\btelescope\b/i, output: "dalekohled" },
  { pattern: /\bfond\s*de\s*ten\b/i, output: "make-up základ" },
  { pattern: /\bfoundation\b/i, output: "make-up základ" },
  { pattern: /\bbb\s*cream\b/i, output: "BB krém" },
  { pattern: /кушон/i, output: "cushion make-up" },
  { pattern: /\b(?:bb|makeup)\s*cushion\b/i, output: "cushion make-up" },
  { pattern: /\bpest\s*reject\b/i, output: "ultrazvukový odpuzovač hlodavců" },
  { pattern: /\bultrasonic.*rodent/i, output: "ultrazvukový odpuzovač hlodavců" },
  { pattern: /\brhino[\s\-]*correct\b/i, output: "nosní korektor" },
  { pattern: /\bepilator\b/i, output: "epilátor" },
  { pattern: /\btrimmer\b/i, output: "zastřihovač" },
  { pattern: /\blaser\s*projector\b/i, output: "laserový projektor" },
  { pattern: /\bproiector\s*laser\b/i, output: "laserový projektor" },
  { pattern: /\bproiector\b/i, output: "projektor" },
  { pattern: /\bdepilator\b/i, output: "epilátor" },
  { pattern: /\bmonokular\b/i, output: "monokulár" },
];

export const TITLE_CARD_STYLE_EXAMPLES = [
  "Hondrofrost — kloubní gel",
  "Hondroine — kloubní gel",
  "Reishield — kapsle proti neuropatii",
  "Artizynt — kloubní kapsle",
  "Toxic OFF — sprej proti plísním",
  "Smoke No More — kapsle na odvykání kouření",
  "ClearVision — kapsle na podporu zraku",
  "SlimFit — kapsle na hubnutí",
  "ProstaRelief — kapsle na prostatu",
  "ValgusFix — sprej proti vbočeným palcům",
  "Pest Reject — ultrazvukový odpuzovač hlodavců",
  "VENZEN — cushion make-up",
  "Rhino Correct — nosní korektor",
];

export const TITLE_TRANSLATE_BAD_EXAMPLES = [
  "Pulsero RO LOW — affiliate markery v názvu",
  "Mittel für die Potenz — německý deskriptor",
  "Produkt — prázdný deskriptor",
  "Gel für die Gel — tautologie / useknuté slovo",
  "Smoke More — chybějící slovo z brandu Smoke No More",
  "kapsle — cystitida (pomlčka uvnitř deskriptoru)",
  "kontrola hmotnosti — kapsle (pomlčka uvnitř deskriptoru)",
  "Brand — kapsle na potenci (duplicitní brand v deskriptoru)",
  "sluchový produkt místo autočističe",
  "Reishield — ARTHR IS P DUCT",
  "Hondrofrost — JOINT GEL",
  "Brand — SUGAR CONTROL SUP EM T",
  "Brand — ARTHRITIS PRODUCT",
  "Rozbitá anglická velká písmena jako deskriptor — CPA feed artefakt",
  "FullVision — kapsle na zrak (monokulár není perorální doplněk)",
  "Monokulár místo kapslí na zrak — optics ≠ vision-eye-care",
  "VENZEN / make-up jako sluchový produkt",
  "cushion make-up → polštář (chyba — makeup, ne textil)",
  "Pest Reject → wellness produkt (chyba — odpuzovač hlodavců)",
  "Balancio → denní wellness (chyba — kontrola hmotnosti)",
  "Neoflorax → denní wellness (chyba — trávení)",
  "žehlička na vlasy → sluchové kapsle (chyba — vlasový přístroj)",
  "kulma → sluchové kapsle (chyba — vlasový přístroj)",
  "AirCalm → sluchové kapsle (chyba — zvlhčovač)",
];

export function buildTitleTranslateSystemPrompt(brand?: string): string {
  const good = TITLE_TRANSLATE_FEW_SHOTS.map((s) => `- ${s.input} → ${s.output}`).join("\n");
  const bad = TITLE_TRANSLATE_BAD_EXAMPLES.map((s) => `- ${s}`).join("\n");
  const cardStyle = TITLE_CARD_STYLE_EXAMPLES.map((s) => `- ${s}`).join("\n");
  const brandNote = brand
    ? `\nZnačka «${brand}» zůstává beze změny — překládej jen popisnou část.`
    : "";

  return (
    "Přelož krátký popis produktu do češtiny (2–6 slov). " +
    "Vrať jen český popis — bez uvozovek, názvu značky a komentářů. " +
    "Výstup musí být česká latinka, bez cyrilice. " +
    "Neuváděj cenu, měnu ani feed markery (FREE, HOLD, EU, RO, LOW, HIGH, 2.0). " +
    "Celý zdrojový popis nahraď; nepřidávej překlad za ruský nebo německý text. " +
    "Víceslovné značky beze změny (Smoke No More, Toxic OFF) — překládej jen část za značkou. " +
    "Jediná em dash (—) patří jen do celého karty názvu mezi značkou a popisem — nikdy uvnitř popisu. " +
    "Přirozená čeština; nevkládej «—» mezi výrazy (ŠPATNĚ: «kapsle — cystitida», «kontrola — hmotnost»). " +
    "CPA feedy někdy obsahují rozbitá slova nebo velká písmena — sestav skutečnou roli produktu přirozeně česky (2–6 slov); nekopíruj rozbité feed tokeny. " +
    "Pokud popis označuje formu produktu (monokulár, make-up, epilátor, projektor), přelož samotnou formu — neměň na perorální doplněk, pokud feed neříká kapsle/tablety." +
    brandNote +
    "\n\nStyl celého názvu karty (značka beze změny — jen reference):\n" +
    cardStyle +
    "\n\nDobré příklady (jen popis):\n" +
    good +
    "\n\nŠpatný styl (vyhni se):\n" +
    bad
  );
}

export const CS_FORM_LABEL: Record<string, string> = {
  capsules: "kapsle",
  tablets: "tablety",
  cream: "krém",
  ointment: "mast",
  balm: "balzám",
  gel: "gel",
  spray: "sprej",
  drops: "kapky",
  syrup: "sirup",
  powder: "prášek",
  tea: "čaj",
  shampoo: "šampon",
  serum: "sérum",
  patch: "náplast",
  device: "zařízení",
  massager: "masážní přístroj",
  cosmetic: "kosmetický produkt",
  orthopedic: "ortopedický produkt",
  generic_item: "produkt",
  unknown: "produkt",
};

/** @deprecated use CS_FORM_LABEL */
export const HU_FORM_LABEL = CS_FORM_LABEL;
/** @deprecated use CS_FORM_LABEL */
export const BG_FORM_LABEL = CS_FORM_LABEL;

export function csFormLabel(formKind: string | null | undefined): string | null {
  if (!formKind?.trim()) return null;
  return CS_FORM_LABEL[formKind.trim()] ?? null;
}

/** @deprecated use csFormLabel */
export const huFormLabel = csFormLabel;
/** @deprecated use csFormLabel */
export const bgFormLabel = csFormLabel;
/** @deprecated use csFormLabel */
export const roFormLabel = csFormLabel;

export function joinCsDisplayTitle(brand: string, descriptor: string): string {
  const b = brand.trim();
  const d = normalizeDescriptorTail(descriptor);
  if (!b) return d;
  if (!d) return b;
  return `${b} — ${d}`;
}

/** @deprecated use joinCsDisplayTitle */
export const joinHuDisplayTitle = joinCsDisplayTitle;
/** @deprecated use joinCsDisplayTitle */
export const joinBgDisplayTitle = joinCsDisplayTitle;
/** @deprecated use joinCsDisplayTitle */
export const joinRoDisplayTitle = joinCsDisplayTitle;

export const BARE_GENERIC_DESCRIPTORS = new Set([
  "produkt",
  "gel",
  "sprej",
  "krém",
  "mast",
  "kapsle",
  "kapsule",
  "tablety",
  "tableta",
  "kapky",
  "kapka",
  "sirup",
  "prášek",
  "balzám",
  "sérum",
  "náplast",
  "zařízení",
  "šampon",
  "čaj",
]);

export function isGenericCsDescriptor(tail: string | null | undefined): boolean {
  const t = (tail ?? "").trim().toLowerCase();
  if (!t) return true;
  if (/^produkt\s+(proti|na|pro)\b/i.test(t)) return true;
  if (BARE_GENERIC_DESCRIPTORS.has(t)) return true;
  if (/^(produkt|gel|sprej)$/i.test(t)) return true;
  if (/^(produkt|gel|sprej|krém|kapsle?|tablety?)$/i.test(t) && !/proti|na|pro|kloub|zrak|prostata/i.test(t)) {
    return true;
  }
  return false;
}

/** @deprecated use isGenericCsDescriptor */
export const isGenericHuDescriptor = isGenericCsDescriptor;
/** @deprecated use isGenericCsDescriptor */
export const isGenericBgDescriptor = isGenericCsDescriptor;
/** @deprecated use isGenericCsDescriptor */
export const isGenericRoDescriptor = isGenericCsDescriptor;

export function translateFormTailToCs(tail: string): string | null {
  const trimmed = tail.trim();
  if (!trimmed) return null;
  for (const { pattern, output } of PRODUCT_FORM_TAIL_RULES) {
    if (pattern.test(trimmed)) return output;
  }
  if (/^monocular$/i.test(trimmed)) return "monokulár";
  if (/^binocular$/i.test(trimmed)) return "binokulár";
  return null;
}

/** @deprecated use translateFormTailToCs */
export const translateFormTailToHu = translateFormTailToCs;
/** @deprecated use translateFormTailToCs */
export const translateFormTailToBg = translateFormTailToCs;
/** @deprecated use translateFormTailToCs */
export const translateFormTailToRo = translateFormTailToCs;

export function textContainsProductForm(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (translateFormTailToCs(t)) return true;
  return PRODUCT_FORM_TAIL_RULES.some((r) => r.pattern.test(t));
}

export function translateFormFromFeedBlob(feedSnippet: string): string | null {
  const blob = feedSnippet.trim();
  if (!blob) return null;
  for (const { pattern, output } of PRODUCT_FORM_TAIL_RULES) {
    if (pattern.test(blob)) return output;
  }
  return null;
}

export type MechanicalDescriptorOptions = {
  formKind?: string | null;
  seed?: string;
};

export function pickWeightLossGeneric(seed: string): "produkt" | "přípravek" {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "produkt" : "přípravek";
}

export function detectFormInTail(tail: string): string | null {
  const t = tail.trim();
  if (!t) return null;
  if (/\bcapsules?\b|\bkapseln\b|\bcomprimate\b|\bkapsul/i.test(t)) return "kapsle";
  if (/\bdrops\b|\bpic[aă]turi\b|\bkapk/i.test(t)) return "kapky";
  if (/\bpowder\b|\bpudr[aă]\b|\bpulbere\b|\bpr[aá]šek\b/i.test(t)) return "prášek";
  return null;
}

function normalizeFormForWeightLoss(form: string | null | undefined): string | null {
  if (!form?.trim()) return null;
  const f = form.trim();
  if (BARE_GENERIC_DESCRIPTORS.has(f.toLowerCase())) return null;
  return f;
}

export function mechanicalWeightLossDescriptor(
  tail: string,
  options?: MechanicalDescriptorOptions,
): string | null {
  const trimmed = tail.trim();
  if (!trimmed) return null;
  if (!/\bweight\s*loss\b|\bw-?loss\b|\bsl[aă]bit\b|\bhubnut/i.test(trimmed)) return null;

  if (/\bcontrolul\s+greut|kontrol.*hmotnost|weight\s*control/i.test(trimmed)) {
    const formFromTail = detectFormInTail(trimmed);
    const formFromKind = options?.formKind ? csFormLabel(options.formKind) : null;
    const form = formFromKind ?? formFromTail;
    if (form) return `${form} na kontrolu hmotnosti`;
  }

  const formFromTail = detectFormInTail(trimmed);
  const formFromKind = options?.formKind ? normalizeFormForWeightLoss(csFormLabel(options.formKind)) : null;
  const form = formFromTail ?? formFromKind;
  if (form) return `${form} na hubnutí`;

  const seed = options?.seed?.trim() || trimmed;
  return `${pickWeightLossGeneric(seed)} na hubnutí`;
}

export function mechanicalRomanianDescriptorToCs(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const rules: ReadonlyArray<readonly [RegExp, string]> = [
    [/pic[aă]turi\s+pentru\s+controlul\s+greut[aăț]/i, "kapky na kontrolu hmotnosti"],
    [/pic[aă]turi\s+împotriva\s+parazi[tț]ilor?/i, "kapky proti parazitům"],
    [/gel\s+pentru\s+articula[tț]ii/i, "kloubní gel"],
    [/gel\s+împotriva\s+papiloamelor/i, "gel proti bradavicím"],
    [/capsule\s+pentru\s+poten[tț][aă]/i, "kapsle na potenci"],
    [/capsule\s+pentru\s+sl[aă]bit/i, "kapsle na hubnutí"],
    [/capsule\s+pentru\s+cistit[aă]/i, "kapsle proti cystitidě"],
    [/produs\s+pentru\s+cistit[aă]/i, "produkt proti cystitidě"],
    [/produs\s+împotriva\s+hemoroizilor/i, "produkt proti hemoroidům"],
    [/crem[aăeă]\s+împotriva\s+hemoroizilor/i, "krém proti hemoroidům"],
    [/crem[aă]\s+pentru\s+întinerirea\s+fe[tț]ei/i, "omlazující krém"],
    [/spray\s+pentru\s+articula[tț]ii/i, "kloubní sprej"],
    [/supliment\s+pentru\s+articula[tț]ii/i, "kloubní produkt"],
    [/b[aă]utur[aă]\s+pentru\s+suport\s+renal/i, "nápoj na podporu ledvin"],
    [/solu[tț]ie\s+pentru\s+p[aă]r/i, "sérum na vlasy"],
    [/înc[aă]lzitor\s+portabil/i, "přenosné topidlo"],
    [/cur[aă][tț][aă]tor\s+auto/i, "autočistič"],
    [/\bpentru\s+digestie\b/i, "na podporu trávení"],
    [/\bpentru\s+suport\s+renal\b/i, "na podporu ledvin"],
  ];
  for (const [re, out] of rules) {
    if (re.test(t)) return out;
  }
  return null;
}

/** @deprecated use mechanicalRomanianDescriptorToCs */
export const mechanicalRomanianDescriptorToHu = mechanicalRomanianDescriptorToCs;
/** @deprecated use mechanicalRomanianDescriptorToCs */
export const mechanicalRomanianDescriptorToBg = mechanicalRomanianDescriptorToCs;

export function mechanicalDescriptorToCs(
  tail: string,
  options?: MechanicalDescriptorOptions,
): string | null {
  const trimmed = tail.trim();
  if (!trimmed) return null;

  const weightLoss = mechanicalWeightLossDescriptor(trimmed, options);
  if (weightLoss) return weightLoss;

  const formCs = translateFormTailToCs(trimmed);
  if (formCs) return formCs;

  const roMapped = mechanicalRomanianDescriptorToCs(trimmed);
  if (roMapped) return roMapped;

  const key = trimmed.toLowerCase();
  for (const shot of TITLE_TRANSLATE_FEW_SHOTS) {
    if (shot.input.toLowerCase() === key) return shot.output;
    if (key.includes(shot.input.toLowerCase()) && shot.input.length >= 6) return shot.output;
  }
  if (/^smoking$/i.test(trimmed)) return "kapsle na odvykání kouření";
  if (/^gelenkgel$/i.test(trimmed)) return "kloubní gel";
  if (/^kapseln\b/i.test(trimmed)) return "kloubní kapsle";
  if (/^mittel\b/i.test(trimmed)) return null;
  if (/\barthr/i.test(trimmed) && /\b(duct|product)\b/i.test(trimmed)) return "kloubní produkt";
  if (/\bjoint\s*(care\s*)?gel\b/i.test(trimmed)) return "kloubní gel";
  if (/\bsugar\s*control\b/i.test(trimmed)) return "produkt na podporu hladiny cukru";
  return null;
}

/** @deprecated use mechanicalDescriptorToCs */
export const mechanicalDescriptorToHu = mechanicalDescriptorToCs;
/** @deprecated use mechanicalDescriptorToCs */
export const mechanicalDescriptorToBg = mechanicalDescriptorToCs;
/** @deprecated use mechanicalDescriptorToCs */
export const mechanicalDescriptorToRo = mechanicalDescriptorToCs;

export function normalizeDescriptorTail(tail: string): string {
  if (!tail?.trim()) return "";
  return tail
    .replace(/\s*[—–-]\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export type TitleTranslateContext = {
  brand: string;
  categorySlug?: string;
  formKind?: string | null;
  feedSnippet?: string;
};

export function buildTitleTranslateUserMessage(tail: string, ctx: TitleTranslateContext): string {
  const lines: string[] = [];
  if (ctx.brand) lines.push(`Brand (do not translate): ${ctx.brand}`);
  if (ctx.categorySlug) {
    lines.push(`Category: ${ctx.categorySlug}`);
    const blob = `${tail} ${ctx.feedSnippet ?? ""}`;
    const skipMedicalHint = textContainsProductForm(blob);
    let shelfHint: string | null = null;
    if (!skipMedicalHint) {
      shelfHint = problemRoleForShelf(ctx.categorySlug, null, ctx.formKind);
    }
    if (!shelfHint && NON_MEDICAL_SHELF_HINT_SLUGS.has(ctx.categorySlug)) {
      shelfHint = getCategoryDescriptor(ctx.categorySlug)?.short?.trim() ?? null;
    }
    if (shelfHint && !skipMedicalHint) {
      lines.push(`Nápověda kategorie (${ctx.categorySlug}): ${shelfHint}`);
    }
  }
  if (ctx.formKind) lines.push(`Product form: ${ctx.formKind}`);
  if (ctx.feedSnippet?.trim()) {
    lines.push(`Feed excerpt:\n"""${ctx.feedSnippet.trim().slice(0, 200)}"""`);
  }
  lines.push(`Descriptor to translate: ${tail.trim()}`);
  return lines.join("\n");
}

export const TRANSLATE_SYSTEM_CS = buildTitleTranslateSystemPrompt();
