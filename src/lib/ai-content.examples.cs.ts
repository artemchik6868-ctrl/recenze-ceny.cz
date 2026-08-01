/**
 * České referenční příklady AI obsahu — jednotný zdroj stylu a struktury.
 * Importováno: ai-content.cs-prompts (ne post-generation validátory).
 */

import { getCategoryDescriptor } from "./category-descriptors.cs";
import { problemRoleForShelf, SPECIFIC_MEDICAL_SLUGS } from "./problem-vocabulary.cs";
import {
  buildShelfTopicGuideBG,
  shelfTopicFewShots,
  SHELF_TOPIC_LEXICON,
} from "./shelf-topic.cs";

const LEXICON_SLUGS = new Set(Object.keys(SHELF_TOPIC_LEXICON));

const DEDICATED_DESCRIPTOR_SLUGS = LEXICON_SLUGS;

const MEDICAL_SHELF_BAD_PHRASES: Partial<Record<string, string>> = {
  cystitida: "obecná pohoda, vitalita, imunitní systém, adaptogen, komfort močových cest",
  "ledviny": "akutní cystitida jako hlavní téma (pokud role podpora ledvin)",
  sluch: "dýchací cesty, plíce, imunitní systém",
  papilomy: "trávení, střevo, obecná pohoda",
  paraziti: "bradavice, kůže, HPV",
  "plisen-nehtu": "anti-aging, omlazení, vrásky",
  "klouby": "obecná pohoda bez spojení s klouby",
  "odvykani-koureni": "plíce, dýchací cesty, bronchy",
  alkoholismus: "plíce, dýchací cesty, detox",
  "chrapani": "obecná pohoda, energie, vitalita",
  "vboceny-palec": "klouby, chrupavka, perorální přípravek bez nohou",
  "vypadavani-vlasu": "obecná pohoda, imunitní systém",
  "zvetseni-penisu": "potence, libido bez zvětšení penisu",
  "prostata": "obecné mužské zdraví, mužská vitalita, imunitní systém",
  "zrak": "tělesná hmotnost, hubnutí, obecná pohoda",
  "potence": "mužská vitalita, životní energie, obecná pohoda",
  "hubnuti": "dýchací cesty, plíce, imunitní systém, obecná pohoda",
  "cukrovka": "trávení, detox, obecná pohoda",
  "krevni-tlak": "obecná pohoda bez spojení s krvním oběhem",
  "krecove-zily": "obecná pohoda bez spojení s žilami",
  lupenka: "obecná pohoda bez spojení s kůží/psoriázou",
};

export type DisplayTitleExample = {
  feedTitle: string;
  goodH1: string;
  badH1: string;
};

export const DISPLAY_TITLE_EXAMPLES: DisplayTitleExample[] = [
  {
    feedTitle: "Pulsero SI",
    goodH1: "Pulsero — kapsle na potenci",
    badH1: "Pulsero — podpora mužské vitality",
  },
  {
    feedTitle: "Air conditioner SI",
    goodH1: "přenosná klimatizace",
    badH1: "Air conditioner — SI",
  },
  {
    feedTitle: "Hondrofrost SI",
    goodH1: "Hondrofrost — kloubní krém",
    badH1: "Hondrofrost SI",
  },
  {
    feedTitle: "Orosteel FullPrice",
    goodH1: "Orosteel — kloubní krém",
    badH1: "Orosteel FullPrice — kloubní krém",
  },
  {
    feedTitle: "Parazol",
    goodH1: "Parazol — čaj proti parazitům",
    badH1: "Parazol — doplněk stravy proti bradavicím",
  },
  {
    feedTitle: "detoxil Water Parasites",
    goodH1: "detoxil — proti parazitům kapky",
    badH1: "detoxil — čaj proti parazitům nebo kapsle",
  },
  {
    feedTitle: "Toxic OFF",
    goodH1: "Toxic OFF — proti parazitům kapsle",
    badH1: "Toxic OFF — doplňek stravy na podporu trávení",
  },
  {
    feedTitle: "ArtiZynt — gel za sklepe",
    goodH1: "ArtiZynt — kloubní gel",
    badH1: "ArtiZynt — tautologický gel",
  },
  {
    feedTitle: "ArtiZynt — kapsule za sklepe",
    goodH1: "ArtiZynt — kloubní kapsle",
    badH1: "ArtiZynt — kloubní gel",
  },
  {
    feedTitle: "Cortitron AT",
    goodH1: "Cortitron — proti hemoroidům kapsle",
    badH1: "Cortitron — intim komfort doplněk stravy",
  },
  {
    feedTitle: "Benaga Chaga smoking",
    goodH1: "Benaga Chaga — kapsle na odvykání kouření",
    badH1: "Benaga Chaga —  žvýkačka na odvykání kouření",
  },
  {
    feedTitle: "Smoke No More",
    goodH1: "Smoke No More — kapsle na odvykání kouření",
    badH1: "Smoke More — kapsle na odvykání kouření",
  },
  {
    feedTitle: "Aerflow — anti snoring",
    goodH1: "Aerflow — chrápání proti produkt",
    badH1: "Aerflow — komfort produkt",
  },
  {
    feedTitle: "Cleaview",
    goodH1: "Cleaview — kapsle na podporu zraku",
    badH1: "Cleaview — zlepšení zraku",
  },
  {
    feedTitle: "Ophtalmica — Vision Support Caps",
    goodH1: "Ophtalmica — kapsle na podporu zraku",
    badH1: "Ophtalmica — Vision Support Caps",
  },
  {
    feedTitle: "Proctowell",
    goodH1: "Proctowell — krém proti hemoroidům",
    badH1: "Proctowell — intim komfort doplněk stravy",
  },
  {
    feedTitle: "ProstAktiv",
    goodH1: "ProstAktiv — kapsle na prostatu",
    badH1: "ProstAktiv — krém k zevnímu použití",
  },
  {
    feedTitle: "CardioViva HighPrice",
    goodH1: "CardioViva — kapsle na krevní tlak",
    badH1: "CardioViva HighPrice — kapsle na krevní tlak",
  },
  {
    feedTitle: "Prostatricum CH",
    goodH1: "Prostatricum — kapsle na prostatu",
    badH1: "Prostatricum CH",
  },
  {
    feedTitle: "Talorix — drops potency",
    goodH1: "Talorix — kapky na potenci",
    badH1: "Talorix — kapky pro mužskou životní energii",
  },
  {
    feedTitle: "Hondro G — spray valgus",
    goodH1: "Hondro G — sprej proti vbočeným palcům",
    badH1: "Hondro G — kloubní korektor",
  },
  {
    feedTitle: "W-Loss — shujšanje / weight loss",
    goodH1: "W-Loss — kapky na kontrolu hmotnosti",
    badH1: "W-Loss — kapsle na kontrolu hmotnosti",
  },
  {
    feedTitle: "Abslim — shujšanje / weight loss",
    goodH1: "Abslim — kapky na kontrolu hmotnosti",
    badH1: "Abslim — kapsle na kontrolu hmotnosti",
  },
  {
    feedTitle: "Hondro Sol — kloubní sprej",
    goodH1: "Hondro Sol — kloubní sprej",
    badH1: "Hondro Sol — kloubní doplněk stravy",
  },
  {
    feedTitle: "Hondro Sol — spray valgus",
    goodH1: "Hondro Sol — sprej proti vbočeným palcům",
    badH1: "Hondro Sol — kloubní produkt",
  },
  {
    feedTitle: "Promicil — ciupercă unghială",
    goodH1: "Promicil — krém proti plísni nehtů",
    badH1: "Promicil — kapsle proti plísni nehtů",
  },
  {
    feedTitle: "Removio — papilloma gel",
    goodH1: "Removio — papilloma proti gel",
    badH1: "Removio — papilloma proti kapsle",
  },
  {
    feedTitle: "InsuLevel — Blutzucker",
    goodH1: "InsuLevel — doplňek stravy na regulaci hladiny cukru v krvi",
    badH1: "InsuLevel — doplňek stravy na podporu trávení",
  },
  {
    feedTitle: "Slimmatica",
    goodH1: "Slimmatica — kapsle na kontrolu hmotnosti",
    badH1: "Slimmatica — kapsle na kontrolu hmotnosti",
  },
  {
    feedTitle: "Vitality Plus Ultra",
    goodH1: "Vitality Plus Ultra — kapsle proti cystitidě",
    badH1: "Vitality Plus Ultra — kapsle proti cystitidě",
  },
  {
    feedTitle: "Vitality Plus Ultra",
    goodH1: "Vitality Plus Ultra — kapsle na prostatu",
    badH1: "Vitality Plus Ultra — kapsle na prostatu",
  },
  {
    feedTitle: "Vitality Plus Ultra",
    goodH1: "Vitality Plus Ultra — kloubní kapsle",
    badH1: "Vitality Plus Ultra — kloubní kapsle",
  },
  {
    feedTitle: "Suchý autočistič (RU feed)",
    goodH1: "Suchý autočistič — doplňek autočističe",
    badH1: "Curățător uscat auto — produkt pro sluch",
  },
  {
    feedTitle: "Mini USB vacuum",
    goodH1: "Kompaktní USB vysavač — domácí spotřebič",
    badH1: "Aspirator USB — produkt pro sluch",
  },
];

export type FormFewShot = {
  formKind: string;
  goodH1: string;
  badH1: string;
  goodRegime: string;
  badRegime: string;
};

export const FORM_FEW_SHOTS: FormFewShot[] = [
  {
    formKind: "drops",
    goodH1: "detoxil — proti parazitům kapky",
    badH1: "detoxil — čaj proti parazitům nebo kapsle",
    goodRegime: "Kapky do sklenice vody nebo na lžičku podle popisu produktu — 1–2× denně",
    badRegime: "Připravit jako čaj nebo kapsle podle návodu",
  },
  {
    formKind: "tea",
    goodH1: "Parazol — čaj proti parazitům",
    badH1: "Parazol — kapsle nebo proti parazitům kapky",
    goodRegime: "Jeden šálek horké vody podle popisu produktu — 1–2× denně po jídle",
    badRegime: "kapsle nebo kapky místo čaje",
  },
  {
    formKind: "capsules",
    goodH1: "Parazitel — proti parazitům kapsle",
    badH1: "Parazitel — tea nebo proti parazitům kapky",
    goodRegime: "Předepsaný počet kapslí spolknout s dostatkem vody — obvykle 1–2× denně",
    badRegime: "Vařit čaj nebo místo toho kapát kapky",
  },
  {
    formKind: "tablets",
    goodH1: "Helmifix — proti parazitům tablety",
    badH1: "Helmifix — kapsle nebo čaj proti parazitům",
    goodRegime: "Spolknout tabletu s vodou podle popisu produktu — obvykle 1–2× denně",
    badRegime: "Vařit čaj nebo měnit na kapsle",
  },
  {
    formKind: "cream",
    goodH1: "Hondrofrost — kloubní krém",
    badH1: "Hondrofrost — kloubní kapsle",
    goodRegime: "Tenkou vrstvu krému 2–3× denně nanést a masírovat",
    badRegime: "2 kapsle denně s vodou při jídle",
  },
  {
    formKind: "gel",
    goodH1: "ArtiZynt — kloubní gel",
    badH1: "ArtiZynt — tautologický gel",
    goodRegime: "Malé množství gelu 2–3× denně nanést a vmasírovat na postižené klouby",
    badRegime: "perorálně 1–2× denně, tautologický popis gelu, nebo H1 «kapsle» v textu kloubního gelu",
  },
  {
    formKind: "capsules_smoking",
    goodH1: "Benaga Chaga — kapsle na odvykání kouření",
    badH1: "Benaga Chaga —  žvýkačka na odvykání kouření",
    goodRegime: "1–2 kapsle denně s vodou po dobu 30 dnů — perorální kúra na odvykání",
    badRegime: "žvýkání nikotinové žvýkačky místo kapslí",
  },
  {
    formKind: "capsules_valgus",
    goodH1: "Reishield — kapsle na podporu vbočeného palce",
    badH1: "Reishield — ortopedická pomůcka / silikonová dlaha",
    goodRegime: "1–2 kapsle denně s jídlem a vodou — perorální podpora",
    badRegime: "Ortézu na prst a nosit 3–6 hodin denně",
  },
  {
    formKind: "capsules_vision",
    goodH1: "Cleaview — kapsle na podporu zraku",
    badH1: "Cleaview — topický produkt pro péči o oči",
    goodRegime: "1–2 kapsle denně s jídlem a vodou — perorální podpora zraku",
    badRegime: "místní aplikace, oční kapky, zlepšení zraku nebo brýle/čočky",
  },
  {
    formKind: "cream_intimate",
    goodH1: "Proctonic — krém proti hemoroidům",
    badH1: "Proctonic — proti hemoroidům kapsle",
    goodRegime: "Tenkou vrstvu krému 2–3× denně nanést na intimní oblast a masírovat",
    badRegime: "2 kapsle denně s vodou při jídle",
  },
  {
    formKind: "spray_valgus",
    goodH1: "Hondro G — sprej proti vbočeným palcům",
    badH1: "Hondro G — ortopedický korektor / silikonová dlaha",
    goodRegime: "Sprej podle popisu produktu na postiženou oblast — 2–3× denně",
    badRegime: "Nošení ortézy na prstu nebo perorální kapsle",
  },
  {
    formKind: "capsules_prostate",
    goodH1: "ProstAktiv — kapsle na prostatu",
    badH1: "ProstAktiv — krém k zevnímu použití",
    goodRegime: "1–2 kapsle denně s jídlem a vodou — ~30denní perorální kúra",
    badRegime: "nanášení krému, zevní aplikace na intimní oblast, topická péče místo podání",
  },
  {
    formKind: "drops_weight",
    goodH1: "W-Loss — kapky na kontrolu hmotnosti",
    badH1: "W-Loss — kapsle na kontrolu hmotnosti",
    goodRegime: "kapky ve vodě 10–15 kapek 1–2× denně před jídlem",
    badRegime: "kapsle s vodou při jídle",
  },
  {
    formKind: "drops_weight_abslim",
    goodH1: "Abslim — kapky na kontrolu hmotnosti",
    badH1: "Abslim — kapsle na kontrolu hmotnosti",
    goodRegime: "kapky ve vodě nebo na lžičku a podle popisu produktu — 1–2× denně",
    badRegime: "kapsle s vodou, vymyšlené «60 kapslí»",
  },
  {
    formKind: "capsules_joint",
    goodH1: "ArtiZynt — kloubní kapsle",
    badH1: "ArtiZynt — kloubní gel",
    goodRegime: "1–2 kapsle denně s vodou — ~30denní perorální kúra",
    badRegime: "Gel na klouby, když feed zmiňuje kapsle",
  },
  {
    formKind: "gel_joint",
    goodH1: "Hondrofrost — kloubní gel",
    badH1: "Hondrofrost — kloubní doplněk stravy",
    goodRegime: "Malé množství gelu 2–3× denně nanést a vmasírovat na postižené klouby",
    badRegime: "kapsle s vodou, «perorální podání», «spolknutí doplňku stravy»",
  },
  {
    formKind: "gel_joint_hondro_bare",
    goodH1: "Hondrofrost — kloubní gel",
    badH1: "Hondrofrost — kloubní kapsle",
    goodRegime: "Malé množství gelu 2–3× denně nanést na kolena, záda nebo ruce — h2 «Použití»",
    badRegime: "kapsle s vodou jen kvůli značce Hondrofrost nebo joint-care kategorii",
  },
  {
    formKind: "spray_joint",
    goodH1: "Hondro Sol — kloubní sprej",
    badH1: "Hondro Sol — doplněk stravy / kloubní kapsle",
    goodRegime: "Sprej podle popisu produktu na postižené klouby — 2–3× denně",
    badRegime: "kapsle s vodou, «spolknutí doplňku stravy», «60 kapslí»",
  },
  {
    formKind: "cream_fungus",
    goodH1: "Promicil — krém proti plísni nehtů",
    badH1: "Promicil — kapsle proti plísni nehtů",
    goodRegime: "Tenkou vrstvu krému 2–3× denně na nehet a nehtovou postel",
    badRegime: "kapsle s vodou, «60 kapslí», perorální podání místo topické aplikace",
  },
  {
    formKind: "gel_papillomas",
    goodH1: "Removio — papilloma proti gel",
    badH1: "Removio — papilloma proti kapsle",
    goodRegime: "Malé množství gelu 2–3× denně přímo na bradavici",
    badRegime: "kapsle s vodou, «60 kapslí», perorální kúra místo topické aplikace",
  },
];

export const FORM_UNKNOWN_GUIDE = `=== FORMA Z FEEDU (pokud v briefu «produkt» nebo není jednoznačná) ===
Přečti landing titulek a konec feedu — nevymýšlej formu.
Znaky: kapljice / drops / kapi / капли → kapky | kapsule / capsule → kapsle | čaj / tea → čaj
klouby: gel za sklepe → kloubní gel | kapsule za sklepe / capsule → kloubní kapsle

DOBŘE:
- W-Loss (shujšanje) → «kapky na kontrolu hmotnosti», h2 «Dávkování» kapky ve vodě
- Abslim (shujšanje) → «kapky na kontrolu hmotnosti», h2 «Dávkování» pipetou/kapky
- ArtiZynt (gel za sklepe) → «kloubní gel», h2 «Použití» nanášení
- ArtiZynt (kapsule za sklepe) → «kloubní kapsle», h2 «Dávkování» s vodou
- Hondrofrost (cooling gel / jen značka joint-care) → «kloubní gel», h2 «Použití» nanášení
- Hondrofrost SI / AT / DE (minimální feed titulek) → «kloubní gel», ne kapsle kvůli joint-care
- Hondro Sol (spray / sprej za sklepe) → «kloubní sprej», h2 «Použití» sprej nanášení
- Promicil (plíseň nehtů) → «krém proti plísni nehtů», h2 «Použití» na nehty
- Removio (papilloma) → «gel proti bradavicím», h2 «Použití» na bradavice
- InsuLevel / Balansulin (Blutzucker) → «doplňek stravy na regulaci hladiny cukru v krvi» — ne trávení
- Cortitron (weight loss) → «kapsle na kontrolu hmotnosti», h2 «Dávkování» s vodou
- Parazol → «čaj proti parazitům», h2 «Příprava» vaření

ŠPATNĚ:
- W-Loss → kapsle (forma není ve feedu)
- Abslim → kapsle nebo «60 kapslí» (Shakes hubnutí SKU = kapky)
- ArtiZynt → kloubní gel jen kvůli značce (gel není ve feedu)
- Hondrofrost → doplněk stravy/kapsle, pokud je produkt kloubní gel
- Hondro Sol → kapsle/doplněk stravy, pokud feed uvádí spray/sprej
- Promicil → kapsle, pokud je produkt krém proti plísni nehtů
- Removio → kapsle, pokud je produkt gel proti bradavicím
- InsuLevel / Balansulin → trávení/žaludeční střevo, pokud feed uvádí Blutzucker/Diabetes
- «čaj nebo kapsle» ve stejném textu
- Abiau-SKU automaticky jako kapsle, pokud landing uvádí kapljice/drops`;

export const COMPOSITION_THIN_FEED_GUIDE = `=== SLABÝ FEED SLOŽENÍ ===
Pokud feed neuvádí složky — otevřeně uveď, že «přesné složení není v popisu produktu», a zmíň běžné složky u podobných produktů (jako kontext kategorie, ne jako tvrzení o tomto SKU).

DOBŘE (parasites / kapsle): «Přesné složení není uvedeno. V podobných doplncích stravy se často vyskytuje pelyněk, ořech černý, extrakt neem — ověřte etiketu při doručení.»
DOBŘE (vision-eye-care / kapsle): «Popis neuvádí složky. Ve formulích pro oči se často vyskytuje lutein, zeaxantin, vitamín A, zinek.»
DOBŘE (joint-care / gel): «Složení není uvedeno. V topických kloubních gelech se často vyskytuje arnika, mentol, heřmánek.»

ŠPATNĚ (vymyšlené jako fakt):
- «500 mg glukosamin, 400 mg chondroitin obsahu»
- Komponenta A, složka 1, komponent X`;

export type DescriptorStyleFewShot = {
  context: string;
  goodExamples: readonly string[];
};

/** Golden examples: «forma proti problému» — problem-first vyhledávací jazyk. */
export const DESCRIPTOR_STYLE_FEW_SHOTS: DescriptorStyleFewShot[] = shelfTopicFewShots();

const NEUROPATHY_SIGNAL_RE = /neuropat|neuropathy|neuropatie|neurosh|neuropatsh|neuro\s+othersh|нейропат/i;

export function buildDescriptorStyleGuideCS(brief: {
  categorySlug: string;
  formLabel?: string;
  cleanBrand?: string;
  productRole?: string;
  rawTitle?: string;
  feedCleaned?: string;
  displayH1?: string;
  formKind?: string;
}): string {
  const lexiconGuide = buildShelfTopicGuideBG(brief.categorySlug, {
    formLabel: brief.formLabel,
    brand: brief.cleanBrand,
  });
  if (lexiconGuide) return lexiconGuide;

  const examples = DESCRIPTOR_STYLE_FEW_SHOTS.map(
    (s) => `- ${s.context} → ${s.goodExamples.join(", ")}`,
  ).join("\n");

  let dynamic = "";
  if (
    brief.formLabel?.trim() &&
    SPECIFIC_MEDICAL_SLUGS.has(brief.categorySlug) &&
    !DEDICATED_DESCRIPTOR_SLUGS.has(brief.categorySlug)
  ) {
    const form = brief.formLabel.trim();
    const target =
      problemRoleForShelf(brief.categorySlug, form, undefined) ??
      `${form} — ${getCategoryDescriptor(brief.categorySlug)?.short ?? brief.categorySlug}`;
    const desc = getCategoryDescriptor(brief.categorySlug);
    const gut =
      desc?.mustMention?.join(", ") ??
      desc?.primaryKeywords?.join(", ") ??
      desc?.short ??
      brief.categorySlug;
    const schlecht =
      MEDICAL_SHELF_BAD_PHRASES[brief.categorySlug] ??
      "obecná pohoda, komfortní produkt, vitalita (pokud feed uvádí jen značku)";
    dynamic +=
      `\nPro tento produkt (${brief.cleanBrand ?? "brand"} / ${brief.categorySlug}):\n` +
      `  forma: ${form} → cílový popis: «${target}»\n` +
      `  DOBŘE: ${gut}\n` +
      `  ŠPATNĚ: ${schlecht}`;
  }

  const descriptorHay = `${brief.productRole ?? ""} ${brief.rawTitle ?? ""} ${brief.displayH1 ?? ""} ${brief.feedCleaned ?? ""}`;
  if (
    NEUROPATHY_SIGNAL_RE.test(descriptorHay) ||
    (brief.categorySlug === "stres" && /neurosh|neuropatsh/i.test(descriptorHay))
  ) {
    const form = brief.formLabel?.trim() || "capsule";
    dynamic +=
      `\nPro tento produkt (${brief.cleanBrand ?? "brand"} / neuropátia):\n` +
      `  forma: ${form} → cílový popis: «${form} pro neuropatii» nebo «produkt proti neuropatii»\n` +
      `  ŠPATNĚ: «doplňek stravy pro nervovou soustavu», «doplňek proti stresu», «paměť a koncentrace»`;
  }
  if (
    brief.categorySlug === "plisen-nehtu" &&
    !/\bpromicil\b/i.test(descriptorHay) &&
    !/krem|gel|creme|krema|noht|nagel/i.test(descriptorHay) &&
    (["capsules", "tablets", "drops", "tea"].includes(brief.formKind ?? "") ||
      /kapsul|capsule|tablet|comprimat/i.test(descriptorHay))
  ) {
    const form = brief.formLabel?.trim() || "capsule";
    dynamic +=
      `\nPro tento produkt (${brief.cleanBrand ?? "brand"} / fungus oral):\n` +
      `  forma: ${form} → cílový popis: «${form} proti plísni nehtů»\n` +
      `  ŠPATNĚ: «krém proti plísni», «topický sprej», «nanášení na nehty» (pokud forma = kapsle)`;
  }

  return `=== POPISNÝ STYL (forma + konkrétní problém) ===
Piš produktovou roli, H1, podtitulek a meta_desc ve stylu «{forma} proti {problému}» — jak je zvykem na českém trhu.
Ne kategorické SEO ani eufemismy jako typ produktu.

Příklady:
${examples}
${dynamic}
Pravidlo: forma z briefu + konkrétní problém z feedu/kategorie — ne «doplňek stravy … pro komfort».`;
}

export type ContentFocusFewShot = {
  feedTitle: string;
  pageCategory: string;
  goodFocus: string;
  badFocus: string;
};

/** Golden examples: feed vs. SEO kategorie stránky. */
export const CONTENT_FOCUS_FEW_SHOTS: ContentFocusFewShot[] = [
  {
    feedTitle: "NutriMix — kapsle proti poruchám spánku",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: spánek, uvolnění před spaním a kvalita odpočinku",
    badFocus: "piš o následujícím: kontrola hmotnosti, chuť k jídlu nebo spalování tuků",
  },
  {
    feedTitle: "Otto — kapsle na paměť",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: paměť, koncentrace a mentální jasnost",
    badFocus: "piš o následujícím: hmotnost, chuť k jídlu nebo metabolismus",
  },
  {
    feedTitle: "Reishield — kapsule za spomin / memory",
    pageCategory: "stres",
    goodFocus: "piš o následujícím: paměť, koncentrace, mentální jasnost a perorální kapsle",
    badFocus: "piš o následujícím: stres, úzkost, doplňek proti stresu nebo vnitřní klid",
  },
  {
    feedTitle: "Reishield — neuropat / neuropatie",
    pageCategory: "stres",
    goodFocus: "piš o následujícím: neuropatie, periferní nervová diskomfort, brnění",
    badFocus: "piš o následujícím: stres, úzkost, doplňky proti stresu nebo spánek",
  },
  {
    feedTitle: "Cordyceps — neuropat / neurosh",
    pageCategory: "stres",
    goodFocus: "piš o následujícím: neuropatie, periferní nervová diskomfort, brnění",
    badFocus: "piš o následujícím: doplňek pro nervovou soustavu, stres, obecná paměť nebo úzkost",
  },
  {
    feedTitle: "Reishield — kapsle proti plísni",
    pageCategory: "plisen-nehtu",
    goodFocus: "piš o následujícím: perorální kapsle, plíseň nehtů, podání s vodou",
    badFocus: "piš o následujícím: krém proti plísni, topický sprej nebo nanášení na nehty",
  },
  {
    feedTitle: "Nefro Aktiv — nápoj na ledviny",
    pageCategory: "cystitida",
    goodFocus: "piš o následujícím: ledviny, močové cesty a obecná pohoda vylučovacího systému",
    badFocus: "výhradně piš o následujícím: cystitida, pálení při močení nebo akutní cystitida",
  },
  {
    feedTitle: "Deep Inhale — čaj na plíce",
    pageCategory: "stres",
    goodFocus: "piš o následujícím: plíce, dýchání, bylinný čaj a dýchací cesty",
    badFocus: "piš o následujícím: nervová soustava, stres, úzkost nebo paměť",
  },
  {
    feedTitle: "ZFimuno — doplněk stravy na imunitu",
    pageCategory: "stres",
    goodFocus: "piš o následujícím: imunitní systém, ochrana, zinek a vitamíny",
    badFocus: "piš o následujícím: paměť, koncentrace, stres nebo nervová soustava",
  },
  {
    feedTitle: "Hondroine — Gel/kloubní krém",
    pageCategory: "klouby",
    goodFocus: "piš o následujícím: nanášení na kůži, místní aplikace, masáž — krém nebo gel",
    badFocus: "piš o následujícím: perorální kapsle, podání s vodou nebo «2 kapsle denně»",
  },
  {
    feedTitle: "Wormax — proti parazitům kapsle",
    pageCategory: "papilomy",
    goodFocus: "piš o následujícím: trávení, paraziti, střeva a perorální kapsle",
    badFocus: "piš o následujícím: bradavice, mateřská znaménka nebo kůže (ani v negaci «nemíchej s bradavicemi»)",
  },
  {
    feedTitle: "Uromexil — kapsle (popis: mužská potence)",
    pageCategory: "krevni-tlak",
    goodFocus: "piš o následujícím: potence, erekce, libido a perorální kapsle",
    badFocus: "piš o následujícím: krevní tlak, vysoký krevní tlak nebo zdraví kardiovaskulárního systému",
  },
  {
    feedTitle: "Reishield — kloubní produkt",
    pageCategory: "jatra",
    goodFocus: "piš o následujícím: klouby, chrupavka, pohyblivost a kloubní komfort",
    badFocus: "piš o následujícím: játra, Reishi, detox jater",
  },
  {
    feedTitle: "Para Clean — proti parazitům kapsle",
    pageCategory: "domaci-potreby",
    goodFocus: "piš o následujícím: perorální kapsle, trávení a paraziti",
    badFocus: "piš o následujícím: domácí úklid, povrchy, nástroj nebo domácí čištění",
  },
  {
    feedTitle: "Toxic OFF — antiparasitic capsules",
    pageCategory: "traveni",
    goodFocus: "paraziti, čištění střev, perorální kapsle, pelyněk/černý ořech",
    badFocus: "trávení, trávicí systém, žaludeční střevo, doplněk stravy na trávení",
  },
  {
    feedTitle: "Otto — kapsle na paměť",
    pageCategory: "detox",
    goodFocus: "piš o následujícím: paměť, koncentrace a mentální jasnost",
    badFocus: "piš o následujícím: čištění, toxiny nebo detox těla",
  },
  {
    feedTitle: "Reishield — kapsle na vbočený palec",
    pageCategory: "vboceny-palec",
    goodFocus: "piš o následujícím: perorální kapsle, podání s vodou, podpora nohou",
    badFocus: "piš o následujícím: silikonová dlaha, ortopedická pomůcka nebo nošení na prstu",
  },
  {
    feedTitle: "Hemorolok — proti hemoroidům kapsle",
    pageCategory: "hemoroidy",
    goodFocus: "piš o následujícím: hemoroidy, citlivé oblasti, diskomfort při sezení a kapsle",
    badFocus: "piš o následujícím: intimní komfort nebo obecné intimní problémy (eufemismy)",
  },
  {
    feedTitle: "NOKTAL GEL — roztok proti plísni",
    pageCategory: "anti-aging",
    goodFocus: "piš o následujícím: plíseň nehtů/kůže, nanášení gelu a antimykotická péče",
    badFocus: "piš o následujícím: anti-aging, vrásky, omlazení nebo anti-aging péče",
  },
  {
    feedTitle: "gel na nehty proti plísni (topický)",
    pageCategory: "anti-aging",
    goodFocus: "piš o následujícím: místní aplikace, nehty, plísňová infekce a infekce",
    badFocus: "piš o následujícím: omlazení pleti, vrásky nebo stárnutí",
  },
  {
    feedTitle: "Reishield — hubnutí kapsle",
    pageCategory: "dychaci-cesty",
    goodFocus: "piš o následujícím: tělesná hmotnost, chuť k jídlu, metabolismus a kapsle",
    badFocus: "piš o následujícím: plíce, dýchací cesty, dýchání nebo bronchy",
  },
  {
    feedTitle: "Cordyceps Pulse — ochi / Sehkraft / vision support",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: zdraví očí, zrak, lutein a perorální kapsle",
    badFocus: "piš o následujícím: kontrola hmotnosti, chuť k jídlu, metabolismus nebo hubnutí",
  },
  {
    feedTitle: "Cordyceps Pulse — ochi / vision support",
    pageCategory: "zrak",
    goodFocus: "piš o následujícím: lutein, zrak, únava očí z obrazovky a perorální kapsle pro oči",
    badFocus: "piš o následujícím: kontrola hmotnosti, chuť k jídlu nebo topická péče o oči / oční kapky",
  },
  {
    feedTitle: "Cordyceps — Behandlung zur Gewichtsabnahme",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: tělesná hmotnost, snížení chuti k jídlu a metabolismus",
    badFocus: "piš o následujícím: zdraví očí, zrak nebo lutein",
  },
  {
    feedTitle: "Cleaview — kapsle na podporu zraku",
    pageCategory: "zrak",
    goodFocus: "piš o následujícím: lutein, zrak, perorální podání, únava očí z obrazovky a zdraví očí",
    badFocus: "piš o následujícím: topická aplikace, zlepšení zraku, brýle/čočky nebo oční kapky",
  },
  {
    feedTitle: "Talorix — kapky na potenci",
    pageCategory: "potence",
    goodFocus: "piš o následujícím: potence, erekce, libido a kapky k podání",
    badFocus: "piš o následujícím: mužská vitalita, energie, výdrž nebo obecná pohoda bez potence",
  },
  {
    feedTitle: "Cordyceps — (jen značka)",
    pageCategory: "cystitida",
    goodFocus:
      "piš o následujícím: zánět močového měchýře, pálení při močení a infekce močových cest",
    badFocus:
      "piš o následujícím: imunitní systém, vitalita, adaptogen nebo obecná pohoda",
  },
  {
    feedTitle: "Reishield — kapsle (jen značka)",
    pageCategory: "prostata",
    goodFocus: "piš o následujícím: prostatu, noční močení a časté močení",
    badFocus: "piš o následujícím: obecné mužské zdraví, vitalita nebo imunitní systém",
  },
  {
    feedTitle: "Benaga — produkt (jen značka)",
    pageCategory: "cystitida",
    goodFocus: "piš o následujícím: zánět močového měchýře, komfort močového měchýře a pálení při močení",
    badFocus: "piš o následujícím: detox, čištění jater nebo obecná pohoda",
  },
  {
    feedTitle: "Balancio — (jen značka, balancioloss landing)",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: kontrola hmotnosti, metabolismus, chuť k jídlu a perorální kapsle",
    badFocus: "piš o následujícím: každodenní pohoda, domácí použití, úklid nebo domácí produkt",
  },
  {
    feedTitle: "Neoflorax — (jen značka, othersh landing)",
    pageCategory: "traveni",
    goodFocus: "piš o následujícím: trávení, trávicí trakt, komfort trávení a kapsle",
    badFocus: "piš o následujícím: každodenní pohoda, obecná pohoda nebo wellness produkt",
  },
  {
    feedTitle: "Cordyceps Pulse — (jen značka, rejuvsh landing)",
    pageCategory: "anti-aging",
    goodFocus: "piš o následujícím: anti-aging, vrásky, omlazení a doplněk stravy",
    badFocus: "piš o následujícím: každodenní pohoda, obecná vitalita nebo wellness produkt",
  },
  {
    feedTitle: "Cordyceps Pulse — omlazující kapsle",
    pageCategory: "anti-aging",
    goodFocus: "piš o následujícím: perorální anti-aging kapsle, podání s vodou, vrásky a omlazení",
    badFocus: "piš o následujícím: make-up základ, make-up krém, BB cushion nebo make-up",
  },
  {
    feedTitle: "Cordyceps — kapsle proti hemoroidům",
    pageCategory: "hemoroidy",
    goodFocus: "piš o následujícím: perorální kapsle proti hemoroidům, podání s vodou",
    badFocus: "piš o následujícím: krém, topický gel, zevní aplikace nebo krém proti hemoroidům",
  },
  {
    feedTitle: "DM-Norm — glicemie",
    pageCategory: "cukrovka",
    goodFocus: "piš o následujícím: regulace hladiny cukru v krvi, metabolismus glukózy, perorální podání",
    badFocus: "piš o následujícím: imunita, ochrana organismu, vitamín C nebo obecná imunita",
  },
  {
    feedTitle: "Neoflorax — trávení othersh",
    pageCategory: "traveni",
    goodFocus: "piš o následujícím: trávení, komfort trávení, žaludeční střevo a kapsle",
    badFocus: "piš o následujícím: každodenní pohoda, obecná pohoda, wellness produkt nebo pohoda",
  },
  {
    feedTitle: "Cordyceps — trávení othersh",
    pageCategory: "traveni",
    goodFocus: "piš o následujícím: doplněk stravy na trávení, zlepšení trávení, komfort střev",
    badFocus: "piš o následujícím: každodenní pohoda, wellness produkt nebo obecný wellness popis",
  },
  {
    feedTitle: "kulma — žehlička na vlasy (RU feed)",
    pageCategory: "sluch",
    goodFocus: "piš o následujícím: kulma, styling, kudrny a způsob použití",
    badFocus: "piš o následujícím: sluch, uši, tinnitus, kapsle na sluch nebo doplněk stravy na sluch",
  },
  {
    feedTitle: "natáčky na vlasy bigudi (RU feed)",
    pageCategory: "sluch",
    goodFocus: "piš o následujícím: kulma, účes, kudrny bez tepla",
    badFocus: "piš o následujícím: sluch, kapsle na sluch nebo zdraví uší",
  },
  {
    feedTitle: "AirCalm — aroma zvlhčovač (RU feed)",
    pageCategory: "sluch",
    goodFocus: "piš o následujícím: zvlhčovač, aromaterapie, provoz a domácí použití",
    badFocus: "piš o následujícím: sluch, kapsle na sluch, tinnitus nebo doplněk stravy na uši",
  },
  {
    feedTitle: "DIY-Clock — ceas de designer",
    pageCategory: "dychaci-cesty",
    goodFocus: "piš o následujícím: nástěnné hodiny, DIY design, montáž a domácí dekorace",
    badFocus: "piš o následujícím: plíce, dýchací cesty, dýchání nebo bronchy",
  },
  {
    feedTitle: "Laser — proiector laser",
    pageCategory: "dychaci-cesty",
    goodFocus: "piš o následujícím: laserový projektor, dekorativní osvětlení, způsob použití",
    badFocus: "piš o následujícím: plíce, dýchací cesty, dýchání nebo bronchy",
  },
  {
    feedTitle: "RGB LED Lent — bandă LED",
    pageCategory: "dychaci-cesty",
    goodFocus: "piš o následujícím: LED pásek, dekorativní osvětlení, napájení a montáž",
    badFocus: "piš o následujícím: plíce, dýchací cesty nebo doplněk stravy na dýchání",
  },
  {
    feedTitle: "BRANDCAMP — lopată multifuncțională",
    pageCategory: "dychaci-cesty",
    goodFocus: "piš o následujícím: multifunkční lopata, zahradničení, venkovní nástroje",
    badFocus: "piš o následujícím: plíce, dýchací cesty, dýchání nebo bronchy",
  },
  {
    feedTitle: "sigilant găuri — sealant",
    pageCategory: "dychaci-cesty",
    goodFocus: "piš o následujícím: těsnění děr, domácí opravy, aplikace",
    badFocus: "piš o následujícím: plíce, dýchací cesty nebo dýchání",
  },
  {
    feedTitle: "Stubble Beard — zastřihovač vousů (RU feed)",
    pageCategory: "sluch",
    goodFocus: "piš o následujícím: zastřihovač vousů, mužská péče o pleť",
    badFocus: "piš o následujícím: sluch, kapsle na sluch nebo produkt na uši",
  },
  {
    feedTitle: "ProstAktiv — kapsle na prostatu",
    pageCategory: "prostata",
    goodFocus: "piš o následujícím: perorální kapsle, podání, prostatu, časté močení a mužská pohoda",
    badFocus: "piš o následujícím: krém, zevní aplikace, topická péče nebo intimní krém",
  },
  {
    feedTitle: "W-Loss — shujšanje / weight loss",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: kapky na kontrolu hmotnosti, podání ve vodě, chuť k jídlu a metabolismus",
    badFocus: "piš o následujícím: kapsle, «60 kapslí», plíce nebo dýchací cesty",
  },
  {
    feedTitle: "Abslim — shujšanje / weight loss",
    pageCategory: "hubnuti",
    goodFocus: "piš o následujícím: kapky na kontrolu hmotnosti, pipeta, podání podle popisu produktu a hubnutí",
    badFocus: "piš o následujícím: spolknutí kapslí, «60 kapslí» nebo dýchací cesty",
  },
  {
    feedTitle: "Hondro Sol — kloubní sprej",
    pageCategory: "klouby",
    goodFocus: "piš o následujícím: sprej nanášení na klouby, h2 «Použití», místní podpora pohyblivosti",
    badFocus: "piš o následujícím: perorální kapsle, spolknutí doplňku stravy nebo «60 kapslí»",
  },
  {
    feedTitle: "Promicil — krém proti plísni nehtů",
    pageCategory: "plisen-nehtu",
    goodFocus: "piš o následujícím: nanášení krému na nehet a nehtovou postel, antimykotická topická aplikace",
    badFocus: "piš o následujícím: spolknutí kapslí, perorální podání nebo «60 kapslí»",
  },
  {
    feedTitle: "Removio — papilloma gel",
    pageCategory: "papilomy",
    goodFocus: "piš o následujícím: nanášení gelu na bradavice/papilomy, topická aplikace, kožní změny",
    badFocus: "piš o následujícím: spolknutí kapslí, perorální kúra nebo «60 kapslí»",
  },
  {
    feedTitle: "Hondro Sol — spray valgus",
    pageCategory: "vboceny-palec",
    goodFocus: "piš o následujícím: sprej proti vbočeným palcům, noha, oblast prstů, h2 «Použití»",
    badFocus: "piš o následujícím: kloubní produkt, kloubní komfort nebo kloubní kapsle",
  },
  {
    feedTitle: "InsuLevel — Blutzucker / diabetes",
    pageCategory: "traveni",
    goodFocus: "piš o následujícím: hladina cukru v krvi, glukóza, podpora diabetu, perorální kapsle na regulaci cukru",
    badFocus: "piš o následujícím: trávení, žaludeční střevo, trávicí systém nebo žaludeční střevo",
  },
  {
    feedTitle: "Balansulin — control de azúcar",
    pageCategory: "traveni",
    goodFocus: "piš o následujícím: regulace hladiny cukru v krvi, metabolismus glukózy a podpora diabetu",
    badFocus: "piš o následujícím: doplněk stravy na trávení, komfort střev nebo žaludeční střevo",
  },
];

export const SHORT_FIELDS_EXAMPLE = {
  brand: "Artrosteel",
  productRole: "kloubní krém",
  title: "Artrosteel — kloubní krém",
  subtitle: "Krém k zevnímu použití, podporuje kloubní komfort",
  meta_desc: "Krém k zevnímu použití, každodenní kloubní komfort",
  badTitle: "Artrosteel — kloubní produkt",
  badSubtitle: "Místní nanášení na oblast napětí a ztuhnutí",
  badMetaDesc: "krém k zevnímu použití pro každodenní kloubní komfort",
};

export const SHORT_FIELDS_INTIMATE_EXAMPLE = {
  brand: "Proctowell",
  productRole: "krém proti hemoroidům",
  title: "Proctowell — krém proti hemoroidům",
  subtitle: "Zmírňuje hemoroidy a diskomfort citlivé intimní oblasti",
  meta_desc: "krém k zevnímu použití na hemoroidy",
  badSubtitle: "intimní komfort a intimní pohoda",
  badMetaDesc: "intim komfort doplněk stravy",
};

export const SHORT_FIELDS_VISION_EXAMPLE = {
  brand: "Cleaview",
  productRole: "kapsle na podporu zraku",
  title: "Cleaview — kapsle na podporu zraku",
  subtitle: "Perorální podpora při dlouhé práci u obrazovky",
  meta_desc: "Doplňkové kapsle pro zdraví očí a každodenní zrak",
  badTitle: "Cleaview — zlepšení zraku",
  badSubtitle: "Perorální podpora zraku při práci u obrazovky",
  badMetaDesc: "oční kapky na zrak",
};

export const SHORT_FIELDS_PROSTATE_EXAMPLE = {
  brand: "ProstAktiv",
  productRole: "kapsle na prostatu",
  title: "ProstAktiv — kapsle na prostatu",
  subtitle: "Perorální podpora prostaty a nočního močení",
  meta_desc: "Doplňkové kapsle pro komfort prostaty a mužskou pohodu",
  badTitle: "ProstAktiv — krém k zevnímu použití",
  badSubtitle: "Topická péče na intimní oblasti",
  badMetaDesc: "krém k zevnímu použití na prostatu",
};

export const SHORT_FIELDS_WEIGHT_DROPS_EXAMPLE = {
  brand: "W-Loss",
  productRole: "kapky na kontrolu hmotnosti",
  title: "W-Loss — kapky na kontrolu hmotnosti",
  subtitle: "Podporuje metabolismus a kontrolu chuti k jídlu",
  meta_desc: "kapky na kontrolu hmotnosti, podání ve vodě podle popisu produktu",
  badTitle: "W-Loss — kapsle na kontrolu hmotnosti",
  badSubtitle: "denně 60 kapslí s vodou při jídle",
  badMetaDesc: "kapsle doplňku stravy na hubnutí, balení 60 kapslí",
};

export const SHORT_FIELDS_JOINT_SPRAY_EXAMPLE = {
  brand: "Hondro Sol",
  productRole: "kloubní sprej",
  title: "Hondro Sol — kloubní sprej",
  subtitle: "Místní sprej pro kloubní komfort a pohyblivost",
  meta_desc: "Sprej k zevnímu použití na klouby podle popisu produktu",
  badTitle: "Hondro Sol — kloubní doplněk stravy",
  badSubtitle: "denně 60 kapslí s vodou při jídle",
  badMetaDesc: "kloubní kapsle doplňku stravy, 30denní perorální kúra",
};

export const SHORT_FIELDS_JOINT_GEL_EXAMPLE = {
  brand: "Hondrofrost",
  productRole: "kloubní gel",
  title: "Hondrofrost — kloubní gel",
  subtitle: "Gel k zevnímu použití pro kloubní komfort a pohyblivost",
  meta_desc: "Kloubní gel, zevní aplikace na kolena, záda nebo ruce",
  badTitle: "Hondrofrost — kloubní kapsle",
  badSubtitle: "Gel k zevnímu použití pro kloubní komfort",
  badMetaDesc: "kloubní kapsle doplňku stravy, 30denní perorální kúra",
};

export const SHORT_FIELDS_FUNGUS_CREAM_EXAMPLE = {
  brand: "Promicil",
  productRole: "krém proti plísni nehtů",
  title: "Promicil — krém proti plísni nehtů",
  subtitle: "Topický krém na podporu proti plísni nehtů",
  meta_desc: "krém proti plísni nehtů, nanášení na nehet a nehtovou postel",
  badTitle: "Promicil — kapsle proti plísni nehtů",
  badSubtitle: "kapsle s vodou při jídle",
  badMetaDesc: "kapsle doplňku stravy proti plísni nehtů, balení 60 kapslí",
};

export const SHORT_FIELDS_NEUROPATHY_EXAMPLE = {
  brand: "Cordyceps Pulse",
  productRole: "kapsle proti neuropatii",
  title: "Cordyceps Pulse — kapsle proti neuropatii",
  subtitle: "Podpora periferní nervové diskomfortu a brnění",
  meta_desc: "Kapsle proti neuropatii, perorální podání podle popisu produktu",
  badTitle: "Cordyceps Pulse — doplněk stravy pro nervovou soustavu",
  badSubtitle: "Podpora pohyblivosti a komfortu kloubů",
  badMetaDesc: "Doplňek stravy pro nervovou soustavu, vnitřní klid",
};

export const SHORT_FIELDS_FUNGUS_CAPSULES_EXAMPLE = {
  brand: "Reishield",
  productRole: "kapsle proti plísni nehtů",
  title: "Reishield — kapsle proti plísni nehtů",
  subtitle: "Perorální podpora proti plísni nehtů",
  meta_desc: "Kapsle proti plísni nehtů, podání s vodou podle popisu produktu",
  badTitle: "Reishield — krém proti plísni nehtů",
  badSubtitle: "Topický krém, nanášení na nehty",
  badMetaDesc: "sprej proti plísni, zevní nanášení na nehty",
};

export const SHORT_FIELDS_PAPILLOMA_GEL_EXAMPLE = {
  brand: "Removio",
  productRole: "papilloma proti gel",
  title: "Removio — papilloma proti gel",
  subtitle: "Topický gel na podporu bradavic a papilomů",
  meta_desc: "Gel proti bradavicím, přímé nanášení na bradavice",
  badTitle: "Removio — papilloma proti kapsle",
  badSubtitle: "denně 60 kapslí s vodou při jídle",
  badMetaDesc: "papilloma proti doplněk stravy kapsle, perorálně kúra",
};

export const SHORT_FIELDS_VALGUS_SPRAY_EXAMPLE = {
  brand: "Hondro Sol",
  productRole: "sprej proti vbočeným palcům",
  title: "Hondro Sol — sprej proti vbočeným palcům",
  subtitle: "Místní sprej aplikace proti vbočenému palci",
  meta_desc: "sprej proti vbočenému palci, místní aplikace podle popisu produktu",
  badTitle: "Hondro Sol — kloubní produkt",
  badSubtitle: "kloubní komfort a pohyblivost kolen",
  badMetaDesc: "kloubní doplněk stravy, spolknutí kapsle",
};

export const SHORT_FIELDS_DIABETES_EXAMPLE = {
  brand: "InsuLevel",
  productRole: "doplňek stravy na regulaci hladiny cukru v krvi",
  title: "InsuLevel — doplňek stravy na regulaci hladiny cukru v krvi",
  subtitle: "Podporuje regulaci hladiny cukru v krvi a hladinu glukózy",
  meta_desc: "doplňek stravy na regulaci hladiny cukru v krvi, perorální podání podle popisu produktu",
  badTitle: "InsuLevel — doplňek stravy na podporu trávení",
  badSubtitle: "podpora trávicího systému a žaludku a střev",
  badMetaDesc: "doplněk stravy na trávení, střevní komfort",
};

/** Oral vision capsules — h2 Zweck + administrare snippet. */
export const VISION_CAPSULES_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Cleaview</strong> je doplněk stravy ve formě kapslí k perorálnímu podání. Cílovou skupinou jsou dospělí, kteří chtějí podporovat zdraví očí a každodenní zrak — např. při práci u obrazovky.</p>
<p>Balení obsahuje kapsle k podání s vodou; ne oční kapky ani produkt k zevnímu použití.</p>
<h2>Užívání: doporučené schéma</h2>
<ul>
<li>1–2 kapsle denně s vodou při jídle</li>
<li>Pravidelné užívání po dobu 30 dní podle popisu produktu</li>
<li>Nenahrazuje lékařské řešení zraku ani předpis brýlí</li>
</ul>`;

/** Oral prostate capsules — h2 Zweck + administrare snippet. */
export const PROSTATE_CAPSULES_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>ProstAktiv</strong> je doplněk stravy ve formě kapslí k perorálnímu podání. Cílovou skupinou jsou muži, kteří chtějí podporovat komfort prostaty a noční močení.</p>
<p>Balení obsahuje kapsle k podání s vodou; ne krém ani produkt k zevnímu použití.</p>
<h2>Užívání: doporučené schéma</h2>
<ul>
<li>1–2 kapsle denně s vodou při jídle</li>
<li>Pravidelné užívání po dobu 30 dní podle popisu produktu</li>
<li>Nenahrazuje lékařskou diagnózu ani předepsanou léčbu</li>
</ul>`;

/** Oral cystitis capsules — aligned shelf (not kidney mismatch). */
export const CYSTITIS_ORAL_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>CystiCare</strong> je doplněk stravy ve formě kapslí k perorálnímu podání. Cílovou skupinou jsou dospělí, kteří chtějí zmírnit opakující se diskomfort močového měchýře, pálení při močení nebo infekce močových cest.</p>
<p>Balení obsahuje kapsle k podání s vodou — ne čaj, ne gel ani produkt k zevnímu použití.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>Extrakt z brusinek</strong> — tradiční složka ve formulích na močové cesty</li>
<li><strong>brusinky</strong> — rostlinná složka při diskomfortu močového měchýře</li>
<li><strong>Vitamin C</strong> — podporuje normální funkci imunitního systému v kontextu močových cest</li>
</ul>
<p>Kapsle nenahrazují lékařskou diagnózu ani antibiotickou léčbu akutního zánětu močového měchýře.</p>
<h2>Užívání: doporučené schéma</h2>
<ul>
<li>1–2 kapsle denně s vodou při jídle</li>
<li>Pravidelné užívání po dobu 30 dní podle popisu produktu</li>
<li>Při horečce, krvi v moči nebo silné bolesti se obraťte na lékaře</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>CystiCare spojuje perorální formu kapslí, praktické užívání a zaměření na komfort močového měchýře. Mnoho uživatelů jej používá při opakovaném diskomfortu močových cest v běžném dni.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy, ne lék. Při akutním zánětu močového měchýře s horečkou nebo krví v moči je nutná lékařská konzultace.</p>`;

/** Weight-management drops — h2 Zweck + administrare snippet. */
export const WEIGHT_DROPS_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>W-Loss</strong> je doplněk stravy ve formě kapek k perorálnímu podání. Cílovou skupinou jsou dospělí, kteří chtějí podporovat kontrolu hmotnosti a metabolismus při vyváženém životním stylu.</p>
<p>Balení obsahuje pipetu nebo lahvičku s kapkami — ne kapsle ani tablety.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>extrakt ze zeleného čaje</strong> — rostlinná složka ve formulích na hubnutí</li>
<li><strong>Chrom</strong> — stopový prvek pro metabolismus</li>
<li><strong>L-Karnitin</strong> — aminokyselina v doplňcích na kontrolu hmotnosti</li>
</ul>
<h2>Dávkování: doporučené schéma</h2>
<ul>
<li>10–15 kapek do sklenice vody nebo na lžičku podle popisu produktu</li>
<li>1–2× denně před jídlem</li>
<li>Pravidelné užívání ~30 dní podle popisu produktu</li>
<li>Nenahrazuje vyváženou stravu ani lékařskou konzultaci</li>
</ul>`;

/** Full supplement description_html — h2 românesc, no FAQ. */
export const SUPPLEMENT_DESCRIPTION_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Artrosteel</strong> je krém k zevnímu použití na kůži. Cílovou skupinou jsou osoby, které po každodenní zátěži hledají větší komfort kloubů a svalů.</p>
<p>Balení umožňuje cílené nanášení na kolena, záda nebo ruce bez změny každodenní rutiny.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>Extrakt z arniky</strong> — tradiční složka v topických formulích</li>
<li><strong>mentol</strong> — chladivý pocit při nanášení</li>
<li><strong>heřmánek</strong> — rostlinná složka v kosmetice</li>
<li><strong>Vitamin E</strong> — péče o pokožku v místě nanášení</li>
</ul>
<p>Krém jemně masírujte; nenahrazuje lékařskou konzultaci ani předepsanou léčbu.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Malé množství nanášejte 2–3× denně</li>
<li>Masírujte až do úplného vstřebání</li>
<li>Pravidelné nanášení 2–4 týdny podle potřeby</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nenanášejte na otevřené rány ani sliznice</li>
<li>Při podráždění přerušte aplikaci a poraďte se s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Artrosteel spojuje lehkou konzistenci, místní aplikaci a praktickou krémovou formu. Mnoho uživatelů jej používá po fyzické zátěži nebo lehkém sportu.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy, ne lék. Pokud užíváte léky nebo máte chronické onemocnění, poraďte se s lékařem před aplikací.</p>`;

/** Topical antifungal gel — ciupercă unghială, not anti-aging. */
export const FUNGUS_GEL_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>NOKTAL</strong> je antimykotický gel k zevnímu použití na nehet a nehtovou postel. Cílovou skupinou jsou osoby, které na nehtu kvůli plísňové infekci pozorují změnu barvy nebo struktury.</p>
<p>Balení umožňuje přesné nanášení přímo na postižený nehet bez perorálního podání.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>Aktivní antimykotické složky</strong> — podpora při plísni nehtů</li>
<li><strong>gelový základ</strong> — snadné nanášení a vstřebání do nehtové ploténky</li>
</ul>
<p>Gel nenahrazuje lékařskou konzultaci ani předepsanou antimykotickou léčbu.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Tenkou vrstvu gelu nanášejte 2–3× denně na postižený nehet</li>
<li>Po nanesení nechte působit — nesmývejte ihned</li>
<li>Pravidelné nanášení 4–8 týdnů podle popisu produktu</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nenanášejte na otevřené rány ani sliznice</li>
<li>Při zhoršení infekce se poraďte s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>NOKTAL spojuje gelovou formu, místní aplikaci a praktické nanášení na nehty. Mnoho uživatelů jej používá jako součást každodenní péče při plísni nehtů.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Kosmetický přípravek k zevnímu použití, ne lék. Při přetrvávající plísni nehtů se poraďte s lékařem.</p>`;

/** Joint spray — Hondro Sol, not oral supliment. */
export const SPRAY_JOINT_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Hondro Sol</strong> je sprej k zevnímu použití na klouby. Cílovou skupinou jsou osoby, které po zátěži hledají větší kloubní komfort a pohyblivost v kolenou, zádech nebo rukou.</p>
<p>Balení obsahuje sprej k přímému nanášení na kůži — ne kapsle ani perorální doplněk stravy.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>Extrakt z arniky</strong> — tradiční složka v topických formulích</li>
<li><strong>mentol</strong> — chladivý pocit při nanášení</li>
<li><strong>heřmánek</strong> — rostlinná složka v kosmetice</li>
</ul>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Sprej nanášejte podle popisu produktu 2–3× denně na postižené klouby</li>
<li>Jemně masírujte až do vstřebání</li>
<li>Pravidelné nanášení 2–4 týdny podle potřeby</li>
</ul>
<h2>Důležité před objednávkou</h2>
<p>Kosmetický přípravek k zevnímu použití, ne lék. Nenahrazuje lékařskou konzultaci.</p>`;

/** Joint gel — Hondrofrost / ArtiZynt topical, not oral supliment. */
export const GEL_JOINT_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Hondrofrost</strong> je kloubní gel aplikovaný zevně na kůži. Cílovou skupinou jsou osoby, které po každodenní zátěži hledají větší kloubní a svalový komfort.</p>
<p>Balení je určeno k cílenému nanášení na kolena, záda nebo ruce — ne kapsle ani perorální doplněk stravy.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>Extrakt z arniky</strong> — tradiční složka v topických formulích</li>
<li><strong>Mentol</strong> — chladivý pocit při nanášení</li>
<li><strong>heřmánek</strong> — rostlinná složka v kosmetice</li>
</ul>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Naneste malé množství gelu 2–3× denně na postižené klouby</li>
<li>Jemně masírujte až do vstřebání</li>
<li>Pravidelné nanášení 2–4 týdny podle potřeby</li>
</ul>
<h2>Důležité před objednávkou</h2>
<p>Kosmetický přípravek k zevnímu použití, ne lék. Nenahrazuje lékařskou konzultaci.</p>`;

/** Fungus cream — Promicil, not capsules. */
export const FUNGUS_CREAM_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Promicil</strong> je krém k zevnímu použití na nehet a oblast nehtové postele. Cílovou skupinou jsou osoby, které na nehtu kvůli plísňové infekci pozorují změnu barvy nebo struktury.</p>
<p>Balení umožňuje přesné nanášení přímo na postižený nehet — bez perorálního podání a bez kapslí.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Tenkou vrstvu krému 2–3× denně na nehet a nehtovou postel</li>
<li>Po nanesení nechte působit — nesmývejte ihned</li>
<li>Pravidelné nanášení 4–8 týdnů podle popisu produktu</li>
</ul>
<h2>Důležité před objednávkou</h2>
<p>Kosmetický přípravek k zevnímu použití, ne lék. Při přetrvávající plísni nehtů se poraďte s lékařem.</p>`;

/** Papilloma gel — Removio, not oral capsules. */
export const PAPILLOMA_GEL_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Removio</strong> je gel k zevnímu použití na papilomy a bradavice. Cílovou skupinou jsou osoby, které chtějí ošetřit místní kožní změny.</p>
<p>Balení umožňuje cílené nanášení přímo na bradavici — ne kapsle ani perorální podání.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Malé množství gelu 2–3× denně přímo na bradavici</li>
<li>Po nanesení nechte působit</li>
<li>Pravidelné nanášení 2–4 týdny podle popisu produktu</li>
</ul>
<h2>Důležité před objednávkou</h2>
<p>Kosmetický přípravek k zevnímu použití, ne lék. Při podezřelých změnách na kůži se poraďte s lékařem.</p>`;

/** Valgus spray — Hondro Sol/Hondro G, not joint generic. */
export const VALGUS_SPRAY_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Hondro Sol</strong> je sprej k zevnímu použití proti vbočenému palci. Cílovou skupinou jsou osoby, které hledají místní podporu v oblasti postiženého prstu.</p>
<p>Balení obsahuje sprej k aplikaci na nohu — ne ortopedickou pomůcku k nošení a bez kapslí.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Sprej nanášejte podle popisu produktu na postiženou oblast nohy a palce</li>
<li>Používejte pravidelně 2–3× denně</li>
<li>Nenahrazuje silikonovou ortézu ani ortopedickou konzultaci</li>
</ul>
<h2>Důležité před objednávkou</h2>
<p>Kosmetický přípravek k zevnímu použití, ne lék. Při výrazném hallux valgusu konzultujte ortopeda.</p>`;

/** Parasites tea / anthelmintic supplement — digestie, not negi. */
export const PARASITES_TEA_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Parazol</strong> je bylinný čaj k vnitřnímu podání. Cílovou skupinou jsou osoby, které chtějí podporovat trávení a obecný komfort střev při zdravém životním stylu.</p>
<p>Balení umožňuje přípravu jednoho šálku čaje jako součást každodenní rutiny — bez slibů «parazitární očisty» nebo léčby bradavic.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>semínka pelyňku</strong> — tradiční rostlinná složka ve formulích na trávení</li>
<li><strong>fenyklová semínka</strong> — rostlinná složka pro komfort břicha</li>
<li><strong>extrakt z rozmarýnu</strong> — přirozená podpora trávicích procesů</li>
</ul>
<p>Nenahrazuje lékařskou konzultaci ani předepsanou léčbu parazitárních infekcí.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Jeden šálek s horkou vodou podle popisu produktu</li>
<li>1–2× denně po jídle</li>
<li>Při pravidelném užívání mnoho uživatelů dodržuje schéma 2–4 týdny</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Během těhotenství nebo kojení nepoužívejte bez lékařské konzultace</li>
<li>Při přetrvávajících trávicích potížích se poraďte s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Parazol spojuje praktickou formu čaje a rostlinné složky pro každodenní podporu trávení. Nemíchej s produkty proti bradavicím nebo akné — čaj proti parazitům / podpora trávení.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy k vnitřnímu užití, ne lék. Nepiš o následujícím: bradavice, akné nebo HPV — tématem je trávení a paraziti v kontextu doplňku stravy.</p>`;

/** Parasites drops — liquid oral form, not tea or capsules. */
export const PARASITES_DROPS_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>detoxil</strong> je tekutý doplněk stravy ve formě kapek k perorálnímu podání. Cílovou skupinou jsou osoby, které chtějí podporovat trávení a obecný komfort střev při zdravém životním stylu.</p>
<p>Lahvička s pipetou umožňuje přesné dávkování — bez přípravy čaje nebo kapslí.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>extrakt z pelyňku</strong> — tradiční složka ve formulích na trávení</li>
<li><strong>artyčok</strong> — rostlinná složka spojená s podporou jater</li>
<li><strong>fenyklová semínka</strong> — podpora komfortu břicha</li>
</ul>
<p>Kapky se rozpouštějí ve vodě nebo podávají přímo podle popisu produktu. Nenahrazuje lékařskou konzultaci.</p>
<h2>Dávkování: doporučené schéma</h2>
<ul>
<li>Doporučený počet kapek (např. 10–15) nakapejte do sklenice vody nebo na lžičku</li>
<li>1–2× denně, ideálně před jídlem</li>
<li>Při pravidelném užívání mnoho uživatelů dodržuje schéma 2–4 týdny</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nepřekračujte doporučený počet kapek za den</li>
<li>Během těhotenství nebo kojení se poraďte s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>detoxil spojuje tekutou formu kapek a praktické dávkování pro každodenní podporu trávení. Nemíchej s bradavicemi nebo kožními výrůstky — kapky proti parazitům / podpora trávení.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy ve formě kapek, ne lék. Nepiš o následujícím: bradavice, akné nebo HPV — tématem je trávení a paraziti.</p>`;

/** Parasites capsules — oral solid form. */
export const PARASITES_CAPSULES_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Parazitel</strong> je doplněk stravy ve formě kapslí k perorálnímu podání. Cílovou skupinou jsou osoby, které chtějí podporu trávení a obecného komfortu střev.</p>
<p>Balení obsahuje kapsle ke spolknutí s vodou — ne čaj a ne kapky.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>semínka pelyňku</strong> — tradiční složka ve formulích na trávení</li>
<li><strong>černý ořech</strong> — rostlinná složka v antiparazitárních formulích</li>
<li><strong>extrakt z pelyňku</strong> — přirozená podpora trávicích procesů</li>
</ul>
<p>Stačí spolknout kapsli s vodou; nenahrazuje lékařskou konzultaci.</p>
<h2>Dávkování: doporučené schéma</h2>
<ul>
<li>1–2 kapsle s vodou podle popisu produktu při jídle</li>
<li>1–2× denně, ideálně při jídle</li>
<li>Při pravidelném užívání mnoho uživatelů dodržuje kúru 2–4 týdny</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nepřekračujte doporučenou denní dávku kapslí</li>
<li>Během těhotenství se poraďte s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Parazitel spojuje praktickou formu kapslí a rostlinné složky pro každodenní podporu trávení. Nemíchej s bradavicemi nebo kožními výrůstky — kapsle proti parazitům.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy ve formě kapslí, ne lék. Nepiš o následujícím: bradavice nebo akné — tématem je trávení a paraziti.</p>`;

/** Short oral-form examples for tablets, sachet, syrup. */
export const ORAL_TABLETS_HTML_EXAMPLE = `<h2>Cíl a forma produktu</h2>
<p><strong>Helmifix</strong> je doplněk stravy ve formě tablet k perorálnímu podání. Tablety spolkněte s vodou podle popisu produktu.</p>
<h2>Dávkování: doporučené schéma</h2>
<ul>
<li>Předepsaný počet tablet s vodou 1–2× denně při jídle</li>
<li>Při pravidelném užívání dodržujte schéma 2–4 týdny</li>
</ul>`;

export const PARASITES_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma pro čaj Parazol a jak dlouho ho pít?",
    a: "Jeden šálek s horkou vodou podle popisu produktu a 1–2× denně po jídle. Při pravidelném užívání mnoho lidí dodržuje 2–4 týdny a pak se podle komfortu trávení rozhodne, zda pokračovat.",
  },
  {
    q: "Léčí Parazol bradavice nebo akné?",
    a: "Ne. Parazol je bylinný čaj na podporu trávení a celkové pohody. Není určen na bradavice, akné ani jiné kožní změny — v takových případech se poraďte s lékařem.",
  },
];

/** Full appliance description_html — h2 românesc, home-climate style. */
export const APPLIANCE_DESCRIPTION_HTML_EXAMPLE = `<h2>Přístroj a provoz</h2>
<p><strong>Přenosná klimatizace</strong> chladí nebo větrá místnost pomocí kompaktního oběhu. Je vhodná do malých místností, do kanceláře nebo obytného vozu, když je potřeba tepelný komfort bez pevné instalace.</p>
<ul>
<li>Režim chlazení a ventilace podle modelu</li>
<li>dálkový ovladač nebo ovládací panel pro teplotu a rychlost</li>
<li>vyměnitelný prachový filtr pro snadnou údržbu</li>
<li>spotřeba energie přizpůsobená dlouhodobému domácímu používání</li>
</ul>
<h2>Použití</h2>
<ul>
<li>Umístěte podle návodu blízko okna nebo výstupu vzduchu</li>
<li>Připojte do sítě a zvolte požadovanou teplotu</li>
<li>Vyprázdněte nádobu na kondenzát, když to signalizuje displej</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nezakrývejte vstupní a výstupní mřížky</li>
<li>Držte mimo zdroje vody; u malých dětí používejte pod dohledem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Přenosná forma, bez stavebních prací a s přímým doručením do České republiky. Vhodné, pokud chcete klimatizovat místnost bez pevné klimatizace.</p>
<h2>Doručení po celé České republice</h2>
<p>Kurýrní doručení do Prahy, Brna, Ostravy, Plzně, Liberce a po celé České republice. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Elektrospotřebič pro klimatizaci, ne lék. Po potvrzení objednávky si rozměry, výkon a sady příslušenství ověřte s konzultantem.</p>`;

export const FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak a jak často se Artrosteel nanáší?",
    a: "Tenkou vrstvu nanášejte na čistou, suchou pokožku 2–3× denně a jemně masírujte. Při pravidelném používání mnoho uživatelů dodržuje schéma 2–4 týdny a pak se podle pocitu komfortu rozhodne, zda pokračovat.",
  },
  {
    q: "Mohu Artrosteel používat, když už užívám léky na klouby?",
    a: "Artrosteel je určen k zevnímu použití a nenahrazuje lékařskou léčbu. Pokud užíváte protizánětlivé léky, antikoagulancia nebo máte diagnostikované onemocnění kloubů, poraďte se před kombinací s lékařem.",
  },
];

export function buildDisplayTitleExamplesBlock(): string {
  return DISPLAY_TITLE_EXAMPLES.map(
    (e) =>
      `- feed «${e.feedTitle}» → H1 DOBŘE: «${e.goodH1}» | ŠPATNĚ: «${e.badH1}»`,
  ).join("\n");
}

export function buildSupplementHtmlExampleBlock(): string {
  return `=== ÚPLNÝ PŘÍKLAD description_html (doplněk stravy / krém) ===
Zkopíruj strukturu a styl (h2 v češtině, konkrétní odstavce). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${SUPPLEMENT_DESCRIPTION_HTML_EXAMPLE}`;
}

export function buildParasitesTeaHtmlExampleBlock(): string {
  return `=== ÚPLNÝ PŘÍKLAD description_html (čaj / doplněk stravy proti parazitům) ===
Zkopíruj strukturu a styl. Piš o trávení a střevech, NE o bradavicích nebo akné. Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${PARASITES_TEA_HTML_EXAMPLE}`;
}

const SINGLE_FORM_NOTE =
  "Používej POUZE formu z briefu (forma: …) — jednu formu, bez «čaj nebo kapsle» nebo jiných kombinací.\n";

function parasitesContextNote(categorySlug?: string): string {
  if (categorySlug === "paraziti" || categorySlug === "papilomy" || categorySlug === "domaci-potreby") {
    return "Piš o trávení a střevech, NE o bradavicích nebo akné. ";
  }
  return "";
}

const PARASITE_TITLE_RE =
  /toxic\s*off|detoxic|toxofil|parazit|anthelmint|helmint|gleste|wormax|proti\s+parazit|vermifug|antiparasit/i;

export function matchesAntiparasiticTitleHint(hint: string): boolean {
  return PARASITE_TITLE_RE.test(hint);
}

const FUNGUS_TITLE_RE =
  /protiglivi|proti\s+glivic|antifung|antimicot|\bnoktal\b|\bpromicil\b|glivic.*noht|onychomyc/i;

const VISION_TITLE_RE =
  /(?:cleaview|ocularix|visiomax|optilix)|(?:eye|vision|aug(?:en)?|seh|ocular|зрен|глаз|oko|lutein|sehverm)/i;

function parasitesOnWrongshelf(categorySlug?: string, titleHint?: string): boolean {
  if (!categorySlug || !titleHint) return categorySlug === "paraziti";
  if (categorySlug === "paraziti") return true;
  if (categorySlug === "papilomy" || categorySlug === "domaci-potreby") {
    return PARASITE_TITLE_RE.test(titleHint);
  }
  if (categorySlug === "traveni" || categorySlug === "detox") {
    return PARASITE_TITLE_RE.test(titleHint);
  }
  return false;
}

function fungusOnWrongshelf(categorySlug?: string, titleHint?: string): boolean {
  if (!categorySlug || !titleHint) return categorySlug === "plisen-nehtu";
  if (categorySlug === "plisen-nehtu") return true;
  if (categorySlug === "anti-aging") return FUNGUS_TITLE_RE.test(titleHint);
  return false;
}

function visionOnWrongshelf(categorySlug?: string, titleHint?: string): boolean {
  if (!categorySlug || !titleHint) return categorySlug === "zrak";
  if (categorySlug === "zrak") return true;
  if (
    categorySlug === "hubnuti" ||
    categorySlug === "dychaci-cesty" ||
    categorySlug === "stres"
  ) {
    return (
      VISION_TITLE_RE.test(titleHint) &&
      !/gewicht|abiau|odchud|weight\s*loss|fat\s*burn|schlank|huj[šs]an/i.test(titleHint)
    );
  }
  return false;
}

export function buildTopicalFungusHtmlExampleBlock(): string {
  return `=== ÚPLNÝ PŘÍKLAD description_html (antimykotický gel na nehty) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (nanášení gelu na nehty — ŽÁDNÉ kapsle, ŽÁDNÉ omlazení, ŽÁDNÁ anti-aging péče). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${FUNGUS_GEL_HTML_EXAMPLE}`;
}

export function buildOralFormHtmlExampleBlock(
  formKind: string,
  categorySlug?: string,
  titleHint?: string,
  briefExtra?: Partial<FormExemplarBrief>,
): string {
  const briefHint: FormExemplarBrief = {
    categorySlug,
    formKind,
    rawTitle: titleHint,
    cleanBrand: titleHint,
    displayH1: titleHint,
    ...briefExtra,
  };
  if (isWeightDropsBrief(briefHint)) {
    return `=== ÚPLNÝ PŘÍKLAD description_html (kapky na kontrolu hmotnosti) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (kapky, pipeta, rozpuštění ve vodě — ŽÁDNÉ kapsle, ŽÁDNÝCH «60 kapslí»). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${WEIGHT_DROPS_HTML_EXAMPLE}`;
  }
  if (isJointSprayBrief(briefHint)) {
    return `=== ÚPLNÝ PŘÍKLAD description_html (kloubní sprej) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (sprej na klouby — ŽÁDNÉ kapsle, ŽÁDNÝ perorální doplněk). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${SPRAY_JOINT_HTML_EXAMPLE}`;
  }
  if (isJointTopicalBrief(briefHint)) {
    return `=== ÚPLNÝ PŘÍKLAD description_html (kloubní gel — topický, ne perorální) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (gel na klouby — ŽÁDNÉ kapsle, ŽÁDNÝ perorální doplněk). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${GEL_JOINT_HTML_EXAMPLE}`;
  }
  if (isValgusSprayBrief(briefHint)) {
    return `=== ÚPLNÝ PŘÍKLAD description_html (sprej proti vbočeným palcům) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (sprej na nohu — ŽÁDNÉ kapsle, ŽÁDNÝ kloubní produkt). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${VALGUS_SPRAY_HTML_EXAMPLE}`;
  }
  if (isFungusCreamBrief(briefHint)) {
    return `=== ÚPLNÝ PŘÍKLAD description_html (krém proti plísni nehtů) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (nanášení krému na nehty — ŽÁDNÉ kapsle). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${FUNGUS_CREAM_HTML_EXAMPLE}`;
  }
  if (isPapillomaGelBrief(briefHint)) {
    return `=== ÚPLNÝ PŘÍKLAD description_html (gel proti papilomům) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (nanášení gelu na bradavici — ŽÁDNÉ kapsle). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${PAPILLOMA_GEL_HTML_EXAMPLE}`;
  }
  const ctx = parasitesContextNote(
    parasitesOnWrongshelf(categorySlug, titleHint) ? "paraziti" : categorySlug,
  );
  const useParasitesCapsulesExample =
    formKind === "capsules" && parasitesOnWrongshelf(categorySlug, titleHint);

  switch (formKind) {
    case "drops":
      return `=== ÚPLNÝ PŘÍKLAD description_html (kapky${categorySlug === "paraziti" ? " proti parazitům" : ""}) ===
${ctx}${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (kapky, pipeta, rozpuštění ve vodě — ŽÁDNÝ šálek čaje, ŽÁDNÉ kapsle). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${PARASITES_DROPS_HTML_EXAMPLE}`;
    case "capsules":
      if (useParasitesCapsulesExample) {
        return `=== ÚPLNÝ PŘÍKLAD description_html (kapsle proti parazitům) ===
${ctx}${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (kapsle s vodou — ŽÁDNÝ čaj, ŽÁDNÉ kapky, ŽÁDNÉ bradavice). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${PARASITES_CAPSULES_HTML_EXAMPLE}`;
      }
      if (visionOnWrongshelf(categorySlug, titleHint)) {
        return `=== ÚPLNÝ PŘÍKLAD description_html (kapsle na podporu zraku) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (perorální kapsle s vodou — ŽÁDNÉ oční kapky, ŽÁDNÁ zevní aplikace, ŽÁDNÉ zlepšení zraku, ŽÁDNÉ hubnutí). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${VISION_CAPSULES_HTML_EXAMPLE}`;
      }
      if (categorySlug === "zrak") {
        return `=== ÚPLNÝ PŘÍKLAD description_html (kapsle na podporu zraku) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (perorální kapsle s vodou — ŽÁDNÉ oční kapky, ŽÁDNÁ zevní aplikace, ŽÁDNÉ zlepšení zraku). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${VISION_CAPSULES_HTML_EXAMPLE}`;
      }
      if (categorySlug === "prostata") {
        return `=== ÚPLNÝ PŘÍKLAD description_html (kapsle na prostatu) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (perorální kapsle s vodou — ŽÁDNÝ krém, ŽÁDNÁ zevní aplikace). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${PROSTATE_CAPSULES_HTML_EXAMPLE}`;
      }
      if (
        categorySlug === "cystitida" &&
        !(titleHint && /nefro|kidney|ledvic|renal/i.test(titleHint))
      ) {
        return `=== ÚPLNÝ PŘÍKLAD description_html (kapsle proti cystitidě) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (perorální kapsle s vodou — piš o cystitidě/zánětu močového měchýře, NE o imunitním systému/vitalitě/adaptogenu). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${CYSTITIS_ORAL_HTML_EXAMPLE}`;
      }
      return `=== ÚPLNÝ PŘÍKLAD description_html (kapsle${categorySlug === "paraziti" ? " proti parazitům" : ""}) ===
${ctx}${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (kapsle s vodou — ŽÁDNÝ čaj, ŽÁDNÉ kapky). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${PARASITES_CAPSULES_HTML_EXAMPLE}`;
    case "tablets":
      return `=== ÚPLNÝ PŘÍKLAD description_html (tablety) ===
${ctx}${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (tablety s vodou). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${ORAL_TABLETS_HTML_EXAMPLE}`;
    case "tea":
      return buildParasitesTeaHtmlExampleBlock();
    case "cream":
    case "gel":
    case "balm":
    case "ointment":
      if (fungusOnWrongshelf(categorySlug, titleHint)) {
        return buildTopicalFungusHtmlExampleBlock();
      }
      return `=== ÚPLNÝ PŘÍKLAD description_html (${formKind} k zevnímu použití) ===
${SINGLE_FORM_NOTE}Zkopíruj strukturu a styl (nanášení na kůži, masáž — ŽÁDNÉ kapsle, ŽÁDNÉ tablety, ŽÁDNÝ čaj). Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${buildSupplementHtmlExampleBlock()}`;
    case "sachet":
    case "syrup":
    case "ampoules":
    case "powder":
      return `=== ÚPLNÝ PŘÍKLAD description_html (${formKind}) ===
${ctx}${SINGLE_FORM_NOTE}Zkopíruj strukturu perorální formy «${formKind}» z briefu. Jedna forma — bez míchání s jinými formami.
${buildSupplementHtmlExampleBlock()}`;
    default:
      if (categorySlug === "paraziti") {
        return `=== ÚPLNÝ PŘÍKLAD description_html (perorální doplněk stravy) ===
${ctx}${SINGLE_FORM_NOTE}zvol formu z briefu (forma: …) a v celém textu ji konzistentně dodržuj — ne «čaj nebo kapsle».
${buildParasitesTeaHtmlExampleBlock()}`;
      }
      return `${SINGLE_FORM_NOTE}${buildSupplementHtmlExampleBlock()}`;
  }
}

export function buildMultiSkuBrandFamilyBlockBG(brief?: {
  cleanBrand?: string;
  productRole?: string;
  categorySlug?: string;
}): string {
  const dynamic = brief?.productRole?.trim()
    ? `\n«${brief.cleanBrand ?? "brand"}» na polici «${brief.categorySlug ?? "stránky"}»: piš jako «${brief.productRole}» — ne jako obecný partnerský bucket.`
    : "";

  return `=== ZNAČKA S VÍCE SKU (stejná značka, jiná role z landing page) ===
Reishield, Cordyceps a Benaga mají mnoho SKU — role je v konci feedu / v titulku landing page, NE v názvu značky a NE v obecném bucketu «dýchací cesty».

Plné mini-karty (title · subtitle · meta — piš takto):

1) Reishield — hemorrhoids / hemoroid
   DOBŘE: «Reishield — proti hemoroidům kapsle» · «Úleva při hemoroidech a diskomfortu při sezení» · «proti hemoroidům doplněk stravy kapsle»
   ŠPATNĚ: «dýchací produkt», «podpůrná pomůcka», «intimní komfort»

2) Cordyceps — hearing / sluch
   DOBŘE: «Cordyceps — kapsle na sluch» · «podpora sluchu a komfortu uší» · «doplňek stravy na sluch»
   ŠPATNĚ: «dýchací produkt», «plíce», «dýchání»

3) Benaga — alcoholism / alkohol
   DOBŘE: «Benaga — kapsle na podporu odvykání alkoholu» · «detox a snížení konzumace alkoholu» · «doplňek stravy proti alkoholu»
   ŠPATNĚ: «podpůrná pomůcka», «obecná pohoda», «dýchací cesty»

4) Reishield — papillomas / papilloma
   DOBŘE: «Reishield — kapsle proti bradavicím» · «podpora bradavic a papilomů» · «doplňek stravy proti bradavicím»
   ŠPATNĚ: «dýchací produkt», «plíce»

5) Cordyceps — vision-eye-care / zrak
   DOBŘE: «Cordyceps — kapsle na podporu zraku» · «Perorálně zrakpodpora» · «zdraví očí doplněk stravy»
   ŠPATNĚ: «kapsle na kontrolu hmotnosti» (značka «Pulse» ≠ hubnutí SKU), «zlepšení zraku»

6) Hondro G — valgus / spray
   DOBŘE: «Hondro G — sprej proti vbočeným palcům» · «sprej nanášení na postiženou oblast nohy» · «sprej proti vbočeným palcům»
   ŠPATNĚ: «vložka», «silikonová dlaha», «nositelná ortopedická pomůcka»

7) Verdexedil — hair-care / spray
   DOBŘE: «Verdexedil — sprej na vlasy» · «sprej na podporu růstu vlasů» · «sprej na vlasy pro řídnoucí vlasy»
   ŠPATNĚ: «doplněk stravy», «spolknutí kapslí»

8) Rhino — penis-enlargement / gel
   DOBŘE: «Rhino — gel na zvětšení penisu» · «topický gel na podporu mužské velikosti» · «gel na zvětšení penisu»
   ŠPATNĚ: «mužský produkt», «mužský doplněk stravy», «obecná pohoda»

9) BAE — oblečení (ne boty)
   DOBŘE: «BAE — legíny» · «formující legíny na každý den» · «pohodlné legíny»
   ŠPATNĚ: «boty», «pohodlné boty»

10) ArtiZynt — gel za sklepe / joint-care
   DOBŘE: «ArtiZynt — kloubní gel» · «kloubní pohyblivost podpora» · «kloubní gel k zevnímu použití»
   ŠPATNĚ: «spolknutí kapslí», «kloubní gel jen kvůli značce bez gelu ve feedu»

11) ArtiZynt — kapsule za sklepe / joint-care
   DOBŘE: «ArtiZynt — kloubní kapsle» · «Perorálně kloubní podpora» · «kloubní doplněk stravy kapsle»
   ŠPATNĚ: «nanášení kloubního gelu», «kloubní gel jen kvůli značce ArtiZynt»

12) Hondrofrost — cooling gel / joint-care
   DOBŘE: «Hondrofrost — kloubní gel» · «gel k zevnímu použití na klouby» · h2 «Použití»
   ŠPATNĚ: «doplněk stravy», «spolknutí kapslí», «perorálně kúra»

13) Hondrofrost — kapsule za sklepe (pokud feed explicitně uvádí)
   DOBŘE: «Hondrofrost — kloubní kapsle» · h2 «Dávkování» · s vodou
   ŠPATNĚ: «nanášení kloubního gelu» jen kvůli značce Hondrofrost

14) W-Loss — shujšanje / weight-management
   DOBŘE: «W-Loss — kapky na kontrolu hmotnosti» · «podpora hubnutí a kontroly chuti k jídlu» · «kapky ve vodě podle popisu produktu»
   ŠPATNĚ: «kapsle na kontrolu hmotnosti», «60 kapslí», «kapsle s vodou»

15) Abslim — shujšanje / weight-management
   DOBŘE: «Abslim — kapky na kontrolu hmotnosti» · «kapky metabolismus podporara» · h2 «Dávkování» pipettával
   ŠPATNĚ: «kapsle na kontrolu hmotnosti», «60 kapslí», hubnutí SKU automaticky jako kapsle

16) Hondro Sol — spray za sklepe / joint-care
   DOBŘE: «Hondro Sol — kloubní sprej» · «Spray místní kloubní aplikacera» · h2 «Použití»
   ŠPATNĚ: «kloubní doplněk stravy», «spolknutí kapslí», «60 kapslí»

17) Promicil — plíseň nehtů / fungus
   DOBŘE: «Promicil — krém proti plísni nehtů» · «Topický krém na nehet» · h2 «Použití»
   ŠPATNĚ: «kapsle proti plísni nehtů», perorálně podání, «60 kapslí»

18) Removio — papillomas / gel
   DOBŘE: «Removio — papilloma proti gel» · «nanášení gelu na bradavice» · h2 «Použití»
   ŠPATNĚ: «papilloma proti kapsle», «60 kapslí», perorálně kúra

19) Hondro Sol — spray valgus / valgus
   DOBŘE: «Hondro Sol — sprej proti vbočeným palcům» · «sprej na postiženou oblast nohy» · h2 «Použití»
   ŠPATNĚ: «kloubní produkt», «kloubní komfort», kapsle

20) InsuLevel / Balansulin — digestive bucket
   DOBŘE: «InsuLevel — doplňek stravy na regulaci hladiny cukru v krvi» · «podpora hladiny cukru a glukózy» · téma diabetu
   ŠPATNĚ: «trávení doplněk stravy», žaludeční střevo, trávicí systém
${dynamic}
Pravidlo: konec titulku ve feedu + kategorie stránky → konkrétní role; partnerský bucket «dýchací cesty» jen jako SEO kontext.`;
}

export function buildContentFocusExamplesBlock(): string {
  return CONTENT_FOCUS_FEW_SHOTS.map(
    (s) =>
      `- «${s.feedTitle}» (SEO: ${s.pageCategory}) → DOBŘE: ${s.goodFocus}\n` +
      `    ŠPATNĚ: ${s.badFocus}`,
  ).join("\n");
}

/** Soft routing: weight-management picături context (W-Loss, Abslim, kapljice) — not post-gen QA. */
export function isWeightDropsBrief(brief: {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
}): boolean {
  if (brief.categorySlug !== "hubnuti") return false;
  const hay = `${brief.cleanBrand ?? ""} ${brief.rawTitle ?? ""} ${brief.displayH1 ?? ""} ${brief.productRole ?? ""}`;
  if (/\b(?:w[- ]?loss|abslim)\b/i.test(hay)) return true;
  if (/kapljic|picură|\bdrops\b|kapi\b/i.test(hay)) return true;
  if (brief.formKind === "drops") return true;
  if (brief.formKind === "unknown" || !brief.formKind) return true;
  return false;
}

function briefHaystack(brief: {
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
  feedCleaned?: string;
}): string {
  return `${brief.cleanBrand ?? ""} ${brief.rawTitle ?? ""} ${brief.displayH1 ?? ""} ${brief.productRole ?? ""} ${brief.feedCleaned ?? ""}`;
}

export type FormExemplarBrief = {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
  feedCleaned?: string;
  formExemplarLane?: string;
};

function hasExplicitJointOralSignal(hay: string): boolean {
  return (
    /(?:kapsul|capsule|tablet|tablets).*(?:sklep|joint|stav|gelenk|artrit|glucosamin)|(?:sklep|joint|stav|gelenk|artrit|glucosamin).*(?:kapsul|capsule|tablet)|kapsule\s+za\s+sklepe|joint\s+capsule|kapseln?\s+fur\s+(?:die\s+)?gelenk/i.test(
      hay,
    )
  );
}

/** Soft routing: joint-care Gel/cremă (Hondrofrost, ArtiZynt gel) — not post-gen QA. */
export function isJointTopicalBrief(brief: FormExemplarBrief): boolean {
  if (brief.categorySlug !== "klouby") return false;
  if (isJointSprayBrief(brief)) return false;
  const hay = briefHaystack(brief);
  if (hasExplicitJointOralSignal(hay)) return false;
  if (["cream", "gel", "balm", "ointment"].includes(brief.formKind ?? "")) return true;
  if (/gel\s+za\s+sklepe|cooling\s+gel|gelenk(?:gel|creme)|topic/i.test(hay)) return true;
  if (/\b(?:hondrofrost|hondroine|fortuflex)\b/i.test(hay) && !/(?:kapsul|capsule|tablet)/i.test(hay)) {
    return true;
  }
  if (/gelenkgel|gelenkcreme|gel zur externen/i.test(brief.productRole ?? "")) return true;
  return false;
}

/** Pick one exemplar lane for form few-shots (role beats noisy formKind from partner bucket). */
export function resolveFormExemplarLane(brief: FormExemplarBrief): string {
  const formKind = brief.formKind || "unknown";
  const categorySlug = brief.categorySlug;
  const hay = briefHaystack(brief);

  if (isValgusSprayBrief(brief)) return "spray_valgus";
  if (isJointSprayBrief(brief)) return "spray_joint";
  if (isNeuropathyBrief(brief)) return "neuropathy_oral";
  if (isFungusCreamBrief(brief)) return "cream_fungus";
  if (isFungusOralBrief(brief)) return "capsules_fungus";
  if (isPapillomaGelBrief(brief)) return "gel_papillomas";

  if (categorySlug === "klouby") {
    if (hasExplicitJointOralSignal(hay)) return "capsules_joint";
    if (isJointTopicalBrief(brief)) {
      if (/\bhondrofrost\b/i.test(hay) && !/gel|cream|krem|cooling/i.test(hay)) {
        return "gel_joint_hondro_bare";
      }
      return "gel_joint";
    }
    if (["capsules", "tablets", "drops", "tea"].includes(formKind)) return "capsules_joint";
    if (["cream", "gel", "balm", "ointment"].includes(formKind)) return "gel_joint";
  }

  if (
    categorySlug === "odvykani-koureni" &&
    ["capsules", "tablets", "unknown"].includes(formKind)
  ) {
    return "capsules_smoking";
  }
  if (
    categorySlug === "vboceny-palec" &&
    !isValgusSprayBrief(brief) &&
    ["capsules", "tablets", "drops", "tea", "unknown"].includes(formKind)
  ) {
    return "capsules_valgus";
  }
  if (
    categorySlug === "zrak" &&
    ["capsules", "tablets", "unknown"].includes(formKind)
  ) {
    return "capsules_vision";
  }
  if (
    categorySlug === "prostata" &&
    ["capsules", "tablets", "unknown"].includes(formKind)
  ) {
    return "capsules_prostate";
  }
  if (isWeightDropsBrief(brief)) {
    return /\babslim\b/i.test(hay) ? "drops_weight_abslim" : "drops_weight";
  }

  return formKind;
}

export function buildJointHondroFamilyBlockBG(brief?: {
  cleanBrand?: string;
  productRole?: string;
  categorySlug?: string;
}): string {
  if (brief?.categorySlug !== "klouby") return "";
  const brand = brief?.cleanBrand ?? "";
  if (!/\bhondro/i.test(brand) && !/\bhondro/i.test(brief?.productRole ?? "")) return "";

  const dynamic = brief?.productRole?.trim()
    ? `\n«${brand || "Hondro"}» nyní: piš jako «${brief.productRole}».`
    : "";

  return `=== RODINA ZNAČKY HONDRO (joint-care — forma podle feedu/landingu, ne z bucketu) ===
10) ArtiZynt — gel za sklepe
   DOBŘE: «ArtiZynt — kloubní gel» · h2 «Použití» · nanášení gelu
   ŠPATNĚ: spolknutí kapslí jen kvůli značce ArtiZynt

11) ArtiZynt — kapsule za sklepe
   DOBŘE: «ArtiZynt — kloubní kapsle» · h2 «Dávkování» · s vodou
   ŠPATNĚ: nanášení gelu bez gelu ve feedu

12) Hondrofrost — cooling gel / minimální titulek (SI, AT, Shakes)
   DOBŘE: «Hondrofrost — kloubní gel» · «gel k zevnímu použití na klouby» · h2 «Použití»
   ŠPATNĚ: «kloubní kapsle», «spolknutí doplňku stravy», «60 kapslí» — jen kvůli kategorii joint-care

13) Hondrofrost — kapsule za sklepe (pouze pokud feed explicitně uvádí)
   DOBŘE: «Hondrofrost — kloubní kapsle» · h2 «Dávkování»
   ŠPATNĚ: nanášení gelu jen kvůli značce Hondrofrost

14) Hondro Sol — spray za sklepe
   DOBŘE: «Hondro Sol — kloubní sprej» · h2 «Použití»
   ŠPATNĚ: kapsle, perorálně doplněk stravy${dynamic}`;
}

/** Soft routing: joint-care Spray (Hondro Sol) — not post-gen QA. */
export function isJointSprayBrief(brief: {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
}): boolean {
  if (brief.categorySlug !== "klouby") return false;
  const hay = briefHaystack(brief);
  if (/\bhondro\s*sol\b/i.test(hay) && /spray|sprej/i.test(hay)) return true;
  if (brief.formKind === "spray") return true;
  if ((brief.formKind === "unknown" || !brief.formKind) && /spray|sprej/i.test(hay)) return true;
  return false;
}

/** Soft routing: fungus cremă/gel (Promicil) — not post-gen QA. */
export function isFungusCreamBrief(brief: {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
  feedCleaned?: string;
}): boolean {
  if (brief.categorySlug !== "plisen-nehtu") return false;
  const hay = briefHaystack(brief);
  if (/\bpromicil\b/i.test(hay)) return true;
  if (["cream", "gel"].includes(brief.formKind ?? "")) return true;
  if ((brief.formKind === "unknown" || !brief.formKind) && /krem|gel|creme|krema|noht|nagel/i.test(hay)) {
    return true;
  }
  return false;
}

const ORAL_FORM_KINDS_BRIEF = new Set([
  "capsules", "tablets", "drops", "tea", "syrup", "powder", "sachet", "ampoules",
]);

function isOralFormBrief(brief: FormExemplarBrief): boolean {
  if (ORAL_FORM_KINDS_BRIEF.has(brief.formKind ?? "")) return true;
  const hay = briefHaystack(brief);
  if ((brief.formKind === "unknown" || !brief.formKind) && /kapsul|capsule|tablet|kapljic|picătur|comprimat/i.test(hay)) {
    return true;
  }
  return false;
}

/** Soft routing: neuropatie (Reishield/Cordyceps neurosh) — not post-gen QA. */
export function isNeuropathyBrief(brief: FormExemplarBrief): boolean {
  const hay = briefHaystack(brief);
  if (NEUROPATHY_SIGNAL_RE.test(hay)) return true;
  if (brief.categorySlug === "stres" && isOralFormBrief(brief)) {
    if (/\b(?:reishield|cordyceps)\b.*(?:neuropat|neurosh)/i.test(hay)) return true;
    if (/neurosh|neuropatsh/i.test(hay)) return true;
  }
  return false;
}

/** Soft routing: fungus capsule orală (Reishield) — not post-gen QA. */
export function isFungusOralBrief(brief: FormExemplarBrief): boolean {
  if (brief.categorySlug !== "plisen-nehtu") return false;
  if (isFungusCreamBrief(brief)) return false;
  return isOralFormBrief(brief);
}

/** Soft routing: papillomas Gel (Removio) — not post-gen QA. */
export function isPapillomaGelBrief(brief: {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
}): boolean {
  if (brief.categorySlug !== "papilomy") return false;
  const hay = briefHaystack(brief);
  if (/\bremovio\b/i.test(hay)) return true;
  if (["gel", "cream"].includes(brief.formKind ?? "")) return true;
  if ((brief.formKind === "unknown" || !brief.formKind) && /gel|krem|creme|krema/i.test(hay)) return true;
  return false;
}

/** Soft routing: valgus Spray (Hondro G/Sol) — not post-gen QA. */
export function isValgusSprayBrief(brief: {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
}): boolean {
  if (brief.categorySlug !== "vboceny-palec") return false;
  const hay = briefHaystack(brief);
  if (brief.formKind === "spray") return true;
  if (/\bhondro\s*(?:g|sol)\b/i.test(hay) && /spray|sprej|valgus|hallux/i.test(hay)) return true;
  if ((brief.formKind === "unknown" || !brief.formKind) && /spray|sprej/i.test(hay)) return true;
  return false;
}

/** Soft routing: diabetes intent (InsuLevel, Balansulin, Blutzucker) — not post-gen QA. */
export function isDiabetesIntentBrief(brief: {
  categorySlug?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
}): boolean {
  const hay = briefHaystack(brief);
  if (/\b(?:insulevel|balansulin|betasulin|insulinorm|diabexan|diaform)\b/i.test(hay)) return true;
  if (/blutzucker|zuckerregul|blood\s*sugar|glucose\s*control|glukose|azúcar|azucar|diabet/i.test(hay)) {
    return true;
  }
  return false;
}

export function buildFormFewShotsBlock(
  formKind: string,
  categorySlug?: string,
  titleHint?: string,
  briefExtra?: Partial<FormExemplarBrief>,
): string {
  const brief: FormExemplarBrief = {
    categorySlug,
    formKind,
    rawTitle: titleHint,
    cleanBrand: titleHint,
    displayH1: titleHint,
    ...briefExtra,
  };
  const lane = resolveFormExemplarLane(brief);
  const shot =
    FORM_FEW_SHOTS.find((f) => f.formKind === lane) ??
    FORM_FEW_SHOTS.find((f) => f.formKind === formKind);
  if (!shot) {
    if (formKind === "unknown" || !formKind) {
      return FORM_UNKNOWN_GUIDE;
    }
    const topicalHint = " Pokud je v briefu krém/gel — piš o nanášení, ne o kapslích.";
    return `=== FORMA PRODUKTU ===
Zvol jednu formu z briefu (forma: …) a konzistentně ji dodržuj. ŠPATNĚ: «čaj nebo kapsle» nebo míchání různých forem v témže textu.${topicalHint}`;
  }
  return `=== PŘÍKLADY FOREM (${lane}) ===
DOBŘE H1: «${shot.goodH1}»
ŠPATNĚ H1: «${shot.badH1}» (formy nemíchej)
DOBŘE schéma: «${shot.goodRegime}»
ŠPATNĚ schéma: «${shot.badRegime}»`;
}

export function buildApplianceHtmlExampleBlock(): string {
  return `=== ÚPLNÝ PŘÍKLAD description_html (přístroj / klimatizace) ===
Zkopíruj strukturu a styl. Nekopíruj produkt z příkladu — přizpůsob ho produktu z briefu.
${APPLIANCE_DESCRIPTION_HTML_EXAMPLE}`;
}

export function buildShortFieldsExampleBlock(brief?: {
  categorySlug?: string;
  formKind?: string;
  cleanBrand?: string;
  rawTitle?: string;
  displayH1?: string;
  productRole?: string;
  feedCleaned?: string;
}): string {
  if (isNeuropathyBrief(brief ?? {})) {
    const s = SHORT_FIELDS_NEUROPATHY_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (neuropatie / perorální kapsle) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isFungusOralBrief(brief ?? {})) {
    const s = SHORT_FIELDS_FUNGUS_CAPSULES_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (fungus / perorální kapsle) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isJointSprayBrief(brief ?? {})) {
    const s = SHORT_FIELDS_JOINT_SPRAY_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (joint-care / sprej) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isJointTopicalBrief(brief ?? {})) {
    const s = SHORT_FIELDS_JOINT_GEL_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (joint-care / kloubní gel) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isFungusCreamBrief(brief ?? {})) {
    const s = SHORT_FIELDS_FUNGUS_CREAM_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (fungus / krém) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isPapillomaGelBrief(brief ?? {})) {
    const s = SHORT_FIELDS_PAPILLOMA_GEL_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (papillomas / gel) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isValgusSprayBrief(brief ?? {})) {
    const s = SHORT_FIELDS_VALGUS_SPRAY_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (valgus / sprej) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (brief?.categorySlug === "traveni" && isDiabetesIntentBrief(brief)) {
    const s = SHORT_FIELDS_DIABETES_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (diabetes intent na digestive) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (brief?.categorySlug === "hemoroidy") {
    const s = SHORT_FIELDS_INTIMATE_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (hemorrhoids / hemoroidy) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: «${s.badSubtitle}», «${s.badMetaDesc}»`;
  }
  if (
    brief?.categorySlug === "zrak" &&
    ["capsules", "tablets", "unknown"].includes(brief.formKind ?? "unknown")
  ) {
    const s = SHORT_FIELDS_VISION_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (vision-eye-care / perorální kapsle) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (
    brief?.categorySlug === "prostata" &&
    ["capsules", "tablets", "unknown"].includes(brief.formKind ?? "unknown")
  ) {
    const s = SHORT_FIELDS_PROSTATE_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (prostate-health / perorální kapsle) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  if (isWeightDropsBrief(brief ?? {})) {
    const s = SHORT_FIELDS_WEIGHT_DROPS_EXAMPLE;
    return `=== PŘÍKLAD KRÁTKÝCH POLÍ (weight-management / kapky) ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
  }
  const s = SHORT_FIELDS_EXAMPLE;
  return `=== PŘÍKLAD KRÁTKÝCH POLÍ ===
DOBŘE:
- title: «${s.title}»
- subtitle: «${s.subtitle}» (bez značky, konkrétní přínos)
- meta_desc: «${s.meta_desc}» (bez značky, 30–110 znaků)
ŠPATNĚ: title «${s.badTitle}», subtitle «${s.badSubtitle}», meta_desc «${s.badMetaDesc}»`;
}

export const JOINT_ON_LIVER_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí Reishield při bolestech kloubů?",
    a: "Doporučujeme 1–2 kapsle denně při jídle se sklenicí vody, pravidelně po dobu 30 dní. Jedno balení obsahuje 60 kapslí. Pravidelné užívání podporuje kloubní komfort a pohyblivost — nenahrazuje lékařskou léčbu.",
  },
  {
    q: "Zmírňuje Reishield ztuhlost kloubů při každodenním pohybu?",
    a: "Reishield je určen dospělým, kteří hledají větší kloubní komfort a pohyblivost. Mnoho uživatelů uvádí snazší pohyb po 2–3 týdnech pravidelného užívání. Při diagnostikovaném zánětu kloubů se poraďte s lékařem.",
  },
];

export const PARASITES_ON_PAPILLOMAS_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí Wormax?",
    a: "Wormax se užívá 1–2× denně podle popisu produktu, obvykle po dobu 30 dní. Kapsle podporují trávení a komfort střev. Při chronických potížích se před zahájením poraďte s lékařem.",
  },
  {
    q: "Jak Wormax podporuje zdraví střev a trávení?",
    a: "Aktivní složky vytvářejí prostředí, které podporuje přirozenou rovnováhu střev a trávicí komfort. Pravidelné užívání v doporučené kúře je důležité pro pocit lehkosti a stabilní trávení.",
  },
];

export const PARASITES_ON_DIGESTIVE_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí Toxic OFF?",
    a: "Toxic OFF se užívá 1–2× denně podle popisu produktu s vodou, obvykle po dobu 30 dní. Perorální forma podporuje střeva při zamoření parazity — není to doplněk pro obecné trávení.",
  },
  {
    q: "K čemu je Toxic OFF určen?",
    a: "Toxic OFF je koncipován jako kapsle proti parazitům a pro podporu očisty střev. Piš o parazitech, střevech a perorálním užívání — ne o trávicích potížích nebo «doplňku na trávení».",
  },
];

export const KIDNEY_ON_CYSTITIS_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma přípravku Nefro Aktiv na ledviny?",
    a: "Nefro Aktiv se užívá dvakrát denně podle popisu produktu, pravidelně alespoň 30 dní. Tekutá forma podporuje ledviny a močové cesty — nenahrazuje léčbu akutního zánětu močového měchýře.",
  },
  {
    q: "Nahrazuje Nefro Aktiv léky proti zánětu močového měchýře?",
    a: "Ne. Nefro Aktiv je určen k podpoře ledvin a celkového komfortu močového systému, ne k léčbě akutního zánětu močového měchýře. Piš o ledvinách a vylučování — ne o pálení při močení nebo cystitidě.",
  },
];

export const CYSTITIS_ALIGNED_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí na zánět močového měchýře?",
    a: "1–2 kapsle denně s vodou při jídle, pravidelně po dobu 30 dní. Piš o zánětu močového měchýře a pálení při močení — ne o imunitním systému, vitalitě nebo adaptogenu.",
  },
  {
    q: "Pomáhá doplněk při opakovaných infekcích močových cest?",
    a: "Je koncipován jako doplněk stravy na podporu močových cest a komfortu močového měchýře. Nenahrazuje léčbu antibiotiky; při akutních příznacích s horečkou se poraďte s lékařem.",
  },
  {
    q: "Mohu ho užívat při pálení při močení?",
    a: "Mnoho uživatelů ho používá při mírném diskomfortu močového měchýře v rámci 30denní kúry podle popisu produktu. Při silné bolesti, krvi v moči nebo horečce je nutná lékařská konzultace.",
  },
  {
    q: "Je Cordyceps v kapslích adaptogen pro celkovou pohodu?",
    a: "Na této stránce je produkt zaměřen na zánět močového měchýře. Piš o zánětu močového měchýře a močových cestách — ne o celkové vitalitě nebo imunitě bez souvislosti s močovým měchýřem.",
  },
];

export const RESPIRATORY_ON_NERVOUS_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak se připravuje čaj Deep-Inhale na plíce a jak se pije?",
    a: "Připravte šálek s horkou vodou, nechte 5–7 minut louhovat a pijte 1–2× denně, pravidelně po dobu 30 dní. Čaj podporuje dýchací cesty a plíce — nepiš o následujícím: stres nebo nervový systém.",
  },
  {
    q: "Zmírňuje čaj Deep-Inhale stres a podporuje nervový systém?",
    a: "Ne. Deep Inhale je bylinný čaj pro dýchací cesty a plíce, ne doplněk na paměť nebo úzkost. Účinek je založen na podpoře dýchacího systému a snazším dýchání.",
  },
];

export const ALCOHOLISM_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí na podporu při závislosti na alkoholu?",
    a: "1–2 kapsle denně s vodou při jídle, pravidelně po dobu 30 dní. Piš o závislosti na alkoholu a detoxikaci — ne o plících nebo dýchacích cestách.",
  },
  {
    q: "Podporuje tento doplněk plíce a usnadňuje dýchání?",
    a: "Ne. V tomto SKU jde o doplněk na podporu při závislosti na alkoholu, ne o produkt pro dýchací cesty. Piš o detoxikaci a změně návyků — ne o průduškách nebo plících.",
  },
];

export const SMOKING_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí na odvykání kouření?",
    a: "1–2 kapsle denně s vodou při jídle, pravidelně po dobu 30 dní. Piš o odvykání kouření a závislosti na nikotinu — ne o plících nebo dýchacích cestách.",
  },
  {
    q: "Usnadňuje tento doplněk dýchání a podporuje průdušky?",
    a: "Ne. V tomto SKU jde o doplněk na odvykání kouření, ne o produkt pro dýchací cesty. Piš o odvykání kouření a detoxikaci — ne o plících nebo dýchání.",
  },
];

export const HEARING_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí Cordyceps na sluch?",
    a: "1–2 kapsle denně s vodou při jídle po dobu 30 dní. Formule podporuje sluch a komfort uší — nepiš o plících nebo dýchacích cestách.",
  },
  {
    q: "Usnadňuje Cordyceps dýchání a podporuje průdušky?",
    a: "Ne. V tomto SKU je Cordyceps doplněk na sluch a uši, ne produkt pro dýchací cesty. Piš o schopnosti slyšet a komfortu uší — ne o plících nebo dýchání.",
  },
];

export const PAPILLOMAS_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí proti papilomům?",
    a: "1–2 kapsle denně s vodou při jídle, pravidelně po dobu 30 dní. Piš o papilomech, bradavicích a podpoře při HPV — ne o plících nebo dýchacích cestách.",
  },
  {
    q: "Podporuje tento doplněk plíce a usnadňuje dýchání?",
    a: "Ne. V tomto SKU jde o papilomy a doplněk stravy proti bradavicím, ne o produkt pro dýchací cesty. Piš o kožních změnách a papilomech — ne o plících nebo zánětu průdušek.",
  },
];

export const INTIMATE_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí na hemoroidy?",
    a: "1–2 kapsle denně s vodou při jídle, pravidelně po dobu 30 dní. Piš o hemoroidech a intimní oblasti — ne o plících nebo dýchacích cestách.",
  },
  {
    q: "Usnadňuje tento doplněk dýchání a podporuje průdušky?",
    a: "Ne. V tomto SKU jde o doplněk na hemoroidy, ne o produkt pro dýchací cesty. Piš o hemoroidech a diskomfortu při sezení — ne o plících nebo dýchání.",
  },
];

export const WEIGHT_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí na kontrolu hmotnosti?",
    a: "1–2 kapsle denně s vodou při jídle, pravidelně po dobu 30 dní. Piš o kontrole hmotnosti — ne o plících nebo dýchacích cestách.",
  },
  {
    q: "Podporuje tento doplněk plíce a usnadňuje dýchání?",
    a: "Ne. V tomto SKU jde o doplněk na kontrolu hmotnosti, ne o produkt pro dýchací cesty. Piš o chuti k jídlu, metabolismu a hmotnosti — ne o průduškách nebo plících.",
  },
];

export const WEIGHT_DROPS_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak užívat kapky W-Loss na kontrolu hmotnosti?",
    a: "Doporučený počet kapek (např. 10–15) nakapejte do sklenice vody nebo podle popisu produktu na lžičku — 1–2× denně před jídlem. Pravidelné užívání ~30 dní podporuje kontrolu chuti k jídlu a metabolismus — nenahrazuje vyváženou stravu.",
  },
  {
    q: "Obsahuje balení kapsle nebo kapky?",
    a: "W-Loss je doplněk stravy ve formě kapek, s pipetou nebo lahvičkou s kapátkem — bez kapslí. Kapky se užívají perorálně, rozpuštěné ve vodě nebo přímo na lžičce.",
  },
  {
    q: "Jak často se má Abslim užívat?",
    a: "Kapky Abslim podle popisu produktu 1–2× denně před jídlem — rozpuštěné ve vodě nebo přímo na lžičce. Nepiš «60 kapslí» ani perorální užívání kapslí.",
  },
];

export function buildWeightDropsFaqExampleBlock(): string {
  return WEIGHT_DROPS_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export const JOINT_SPRAY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak nanáším sprej Hondro Sol na klouby?",
    a: "Sprej Hondro Sol se nanáší podle popisu produktu 2–3× denně na postižené klouby a jemně se vmasíruje. Je to sprej k zevnímu použití — bez kapslí a ne perorální doplněk stravy.",
  },
  {
    q: "Obsahuje balení kapsle nebo sprej?",
    a: "Hondro Sol je sprej k místní aplikaci na klouby, bez kapslí. Nepiš «60 kapslí» ani «s vodou» — piš o následujícím: nanášení spreje a sekce «Použití».",
  },
];

export const FUNGUS_CREAM_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak správně nanášet krém Promicil na postižené nehty?",
    a: "Tenkou vrstvu krému nanášejte 2–3× denně přímo na nehet a oblast nehtu. Po nanesení nechte působit. Pravidelné nanášení po dobu 4–8 týdnů je při plísni nehtů klíčové — nepolykejte kapsle.",
  },
  {
    q: "Obsahuje Promicil kapsle nebo krém?",
    a: "Promicil je krém k místní aplikaci na nehty, bez kapslí. Piš o nanášení na nehet — ne o «60 kapslích» nebo perorálním užívání.",
  },
];

export const PAPILLOMA_GEL_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak nanáším gel Removio proti papilomům?",
    a: "Malé množství gelu 2–3× denně přímo na bradavici a nechte působit. Removio je topický gel — bez kapslí a bez perorální kúry s vodou.",
  },
  {
    q: "Obsahuje Removio kapsle nebo gel?",
    a: "Removio je gel k zevnímu použití na papilomy a bradavice, bez kapslí. Nepiš «60 kapslí denně» — piš o nanášení gelu a sekci h2 «Použití».",
  },
];

export const VALGUS_SPRAY_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak nanáším sprej Hondro Sol proti vbočeným palcům?",
    a: "Sprej nanášejte podle popisu produktu 2–3× denně na postiženou oblast nohy a palce. Hondro Sol je sprej proti vbočeným palcům — ne kloubní produkt a bez kapslí.",
  },
  {
    q: "Nahrazuje sprej Hondro Sol silikonovou ortézu nebo kapsle?",
    a: "Ne. V této formě jde o sprej k místní aplikaci na nohu, bez silikonové ortézy k nošení a bez perorálních kapslí. Piš o nanášení spreje a hallux valgus — ne o kloubech nebo «60 kapslích».",
  },
];

export const DIABETES_ON_DIGESTIVE_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma přípravku InsuLevel na regulaci hladiny cukru v krvi?",
    a: "InsuLevel se užívá 1–2× denně podle popisu produktu s vodou, většinou po dobu 30 dní. Perorální forma podporuje hladinu cukru a glukózy v krvi — ne jako doplněk na trávení.",
  },
  {
    q: "Podporuje InsuLevel trávicí trakt a zdraví žaludku a střev?",
    a: "Ne. InsuLevel je doplněk stravy na regulaci hladiny cukru v krvi a podporu při diabetu. Piš o hladině cukru, glukóze a regulaci cukru — ne o trávení, střevech nebo žaludku.",
  },
];

export function buildJointSprayFaqExampleBlock(): string {
  return JOINT_SPRAY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export function buildFungusCreamFaqExampleBlock(): string {
  return FUNGUS_CREAM_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export function buildPapillomaGelFaqExampleBlock(): string {
  return PAPILLOMA_GEL_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export function buildValgusSprayFaqExampleBlock(): string {
  return VALGUS_SPRAY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export function buildDiabetesOnDigestiveFaqExampleBlock(): string {
  return DIABETES_ON_DIGESTIVE_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export const IMMUNITY_ON_NERVOUS_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma přípravku ZFimuno na imunitní systém?",
    a: "1–2 kapsle denně při jídle s vodou, pravidelně po dobu 30–60 dní. Zinek, vitamin D3 a vitamin C podporují imunitní systém — nepiš o paměti nebo koncentraci.",
  },
  {
    q: "Zlepšuje ZFimuno paměť a koncentraci v souvislosti s nervovým systémem?",
    a: "Ne. ZFimuno je doplněk stravy na imunitní systém a obranyschopnost, ne na paměť nebo stres. Piš o obranyschopnosti, únavě a vitaminech — ne o nervovém systému.",
  },
];

export const FUNGUS_ON_ANTIAGING_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jak správně nanášet gel NOKTAL na postižené nehty?",
    a: "Tenkou vrstvu antimykotického gelu nanášejte 2–3× denně přímo na nehet a oblast nehtu. Po nanesení nechte působit. Pravidelné nanášení po dobu 4–8 týdnů je při plísni nehtů klíčové.",
  },
  {
    q: "Nahrazuje gel NOKTAL anti-aging péči nebo krémy proti vráskám?",
    a: "Ne. NOKTAL je antimykotický gel k místní aplikaci na nehty, bez anti-aging krému na pokožku. Piš o plísňové infekci a infekci nehtů — ne o anti-aging péči nebo vráskách.",
  },
];

export const VALGUS_CAPSULES_FAQ_EXAMPLE_PAIRS = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí Reishield na vbočený palec?",
    a: "Reishield 1–2 kapsle denně s vodou, ideálně při jídle, pravidelně po dobu 30 dní. Jedno balení obsahuje 60 kapslí. Perorální užívání podporuje nohu zevnitř — nenahrazuje ortopedické pomůcky.",
  },
  {
    q: "Nahrazují kapsle Reishield silikonovou ortézu nebo noční pomůcku?",
    a: "Ne. Reishield jsou v této formě perorální kapsle, bez silikonové ortézy k nošení na palci. Užívají se s vodou podle návodu; účinek je založen na složkách pro podporu při hallux valgus, ne na zevní podpoře.",
  },
];

const ORAL_FORM_KINDS_FAQ = new Set([
  "capsules", "tablets", "drops", "tea", "syrup", "powder", "sachet", "ampoules",
]);

function isOralFormKindForFaq(formKind?: string): boolean {
  return formKind ? ORAL_FORM_KINDS_FAQ.has(formKind) : false;
}

export function buildFaqExampleBlockForFocus(
  focusSlug: string,
  pageSlug: string,
  formKind?: string,
): string {
  if (pageSlug === "jatra" && focusSlug === "klouby") {
    return JOINT_ON_LIVER_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "papilomy" && focusSlug === "paraziti") {
    return PARASITES_ON_PAPILLOMAS_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "traveni" && focusSlug === "paraziti") {
    return PARASITES_ON_DIGESTIVE_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "traveni" && focusSlug === "cukrovka") {
    return DIABETES_ON_DIGESTIVE_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "anti-aging" && focusSlug === "plisen-nehtu") {
    return FUNGUS_ON_ANTIAGING_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "cystitida" && focusSlug === "ledviny") {
    return KIDNEY_ON_CYSTITIS_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "cystitida" && focusSlug === "cystitida") {
    return CYSTITIS_ALIGNED_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "stres" && focusSlug === "dychaci-cesty") {
    return RESPIRATORY_ON_NERVOUS_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "dychaci-cesty" && focusSlug === "alkoholismus") {
    return ALCOHOLISM_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "dychaci-cesty" && focusSlug === "odvykani-koureni") {
    return SMOKING_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "dychaci-cesty" && focusSlug === "sluch") {
    return HEARING_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "dychaci-cesty" && focusSlug === "papilomy") {
    return PAPILLOMAS_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "dychaci-cesty" && focusSlug === "hemoroidy") {
    return INTIMATE_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "dychaci-cesty" && focusSlug === "hubnuti") {
    return WEIGHT_ON_RESPIRATORY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "stres" && focusSlug === "imunita") {
    return IMMUNITY_ON_NERVOUS_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "vboceny-palec" && formKind === "spray") {
    return VALGUS_SPRAY_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "vboceny-palec" && isOralFormKindForFaq(formKind)) {
    return VALGUS_CAPSULES_FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
  }
  if (pageSlug === "hubnuti" && focusSlug === "hubnuti") {
    return buildWeightDropsFaqExampleBlock();
  }
  return FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export function buildFaqExampleBlock(): string {
  return FAQ_EXAMPLE_PAIRS.map((p) => `F: ${p.q}\nA: ${p.a}`).join("\n\n");
}

export type FaqPair = { q: string; a: string };

export type shelfArchetype =
  | "oral-medical"
  | "topical-medical"
  | "oral-lifestyle"
  | "potency"
  | "appliance";

const TOPICAL_FORM_KINDS = new Set([
  "cream", "gel", "ointment", "balm", "spray", "lotion", "patch", "serum",
]);

const ORAL_MEDICAL_SLUGS = new Set([
  "zrak",
  "krevni-tlak",
  "cukrovka",
  "prostata",
  "cystitida",
  "ledviny",
  "sluch",
  "stres",
  "imunita",
  "dychaci-cesty",
  "jatra",
  "chrapani",
]);

const TOPICAL_MEDICAL_SLUGS = new Set([
  "anti-aging",
  "hemoroidy",
  "plisen-nehtu",
  "krecove-zily",
  "papilomy",
  "vypadavani-vlasu",
  "klouby",
  "lupenka",
  "vboceny-palec",
]);

const ORAL_LIFESTYLE_SLUGS = new Set([
  "hubnuti",
  "alkoholismus",
  "odvykani-koureni",
  "paraziti",
  "detox",
  "traveni",
]);

const APPLIANCE_SLUGS = new Set([
  "domaci-klima",
  "masazni-pristroje",
  "autodoplnky",
  "domaci-vychytavky",
  "kosmeticke-nastroje",
  "domaci-potreby",
  "zahradni-naradi",
  "hracky",
  "optika",
  "obleceni",
  "modni-doplnky",
  "other",
]);

const VISION_GOLDEN_HTML = `<h2>Cíl a forma produktu</h2>
<p><strong>Cleaview</strong> je doplněk stravy ve formě kapslí na podporu zraku. Formule je určena těm, kdo hodně pracují u obrazovky, večer řídí nebo po dlouhé práci cítí únavu očí.</p>
<p>Typické balení obsahuje 60 kapslí k perorálnímu podání každý den podle popisu produktu.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>lutein</strong> — běžný karotenoid v očních formulích</li>
<li><strong>zeaxantin</strong> — doplňková složka k luteinu</li>
<li><strong>vitamin A</strong> — přispívá k udržení normálního zraku</li>
<li><strong>extrakt z borůvek</strong> — rostlinná složka v očních doplňcích stravy</li>
</ul>
<p>Kapsle se polykají s vodou; nenahrazují oční vyšetření ani předepsané řešení zraku.</p>
<h2>Dávkování: doporučené schéma</h2>
<ul>
<li>1–2 kapsle denně, ideálně při jídle, se sklenicí vody</li>
<li>Pravidelné užívání 30–60 dní, poté zhodnoťte vizuální komfort</li>
<li>Nepřekračujte dávku uvedenou na balení</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Malým dětem se bez doporučení lékaře nedoporučuje</li>
<li>Během těhotenství nebo kojení se před užíváním poraďte s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Perorální forma umožňuje snadné užívání doma nebo v kanceláři. Mnoho lidí doplněk kombinuje s pravidelnými přestávkami od obrazovky a vhodným osvětlením.</p>
<h2>Doručení a platba v České republice</h2>
<p>Objednávka s doručením do Prahy, Brna, Ostravy, Plzně, Liberce, Olomouce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy, ne lék. Pokud užíváte léky nebo máte diagnostikované oční potíže, poraďte se před užíváním s lékařem.</p>`;

const VISION_GOLDEN_FAQ: FaqPair[] = [
  {
    q: "Jak užívat kapsle Cleaview na podporu zraku?",
    a: "Cleaview se užívá perorálně: obvykle 1–2 kapsle denně s vodou při jídle. Typická lahvička obsahuje 60 kapslí, což vystačí na 30–60 dní podle dávkování. Dodržujte schéma uvedené na balení a bez doporučení lékaře nekombinujte s jinými očními doplňky.",
  },
  {
    q: "Mohu Cleaview užívat, když už nosím brýle nebo kontaktní čočky?",
    a: "Ano, mnozí lidé používající optickou korekci současně užívají oční doplněk. Cleaview nenahrazuje předepsané brýle ani čočky. Po nedávné operaci nebo při onemocnění očí se před užíváním poraďte s očním lékařem.",
  },
  {
    q: "Za kolik dní je cítit větší komfort u obrazovky?",
    a: "Zkušenost se u každého liší, ale mnoho uživatelů hlásí větší komfort po 2–4 týdnech pravidelného užívání, zvláště pokud omezí i nucený čas u monitoru. Konzistentní schéma je důležitější než občasné velké dávky.",
  },
  {
    q: "Jak funguje doručení Cleaview v České republice?",
    a: "Objednávku doručuje kurýrní služba do většiny míst v České republice, včetně Prahy, Brna, Ostravy a Plzně. Platba na dobírku při převzetí zásilky. Odhadovaná doba závisí na místě a skladových zásobách.",
  },
  {
    q: "Nahrazuje Cleaview předepsanou oční léčbu?",
    a: "Ne. Cleaview je doplněk stravy na podporu zraku, ne lék. Nepřerušujte předepsanou léčbu a neměňte dioptrie bez lékařské kontroly. Při nových příznacích nebo bolesti očí se obraťte na specialistu.",
  },
];

const BLOOD_PRESSURE_GOLDEN_HTML = `<h2>Cíl a forma produktu</h2>
<p><strong>Cardiotensive</strong> je doplněk stravy ve formě kapslí na podporu srdce a cévního systému. Cílovou skupinou jsou dospělí, kteří vedou vyvážený životní styl a hledají dodatečnou podporu v oblasti krevního tlaku a krevního oběhu.</p>
<p>Balení je určeno k perorálnímu podání každý den podle pokynů na etiketě.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>extrakt z hlohu</strong> — běžná rostlinná složka v doplňcích na srdce</li>
<li><strong>hořčík</strong> — minerál, který se podílí na funkci svalů</li>
<li><strong>draslík</strong> — minerál ve formulích pro elektrolytovou rovnováhu</li>
<li><strong>vitamin B6</strong> — přispívá k normálnímu energetickému metabolismu</li>
</ul>
<p>Kapsle se polykají s vodou; nenahrazují léky na snížení krevního tlaku předepsané lékařem.</p>
<h2>Dávkování: doporučené schéma</h2>
<ul>
<li>1–2 kapsle denně s vodou, ideálně ve stejnou dobu</li>
<li>Pravidelná kúra 30 dní, při chronické léčbě poté zhodnocení po konzultaci s lékařem</li>
<li>Nepřekračujte dávku uvedenou na balení</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nepřerušujte předepsané léky bez konzultace s lékařem</li>
<li>Při nízkém krevním tlaku nebo selhání ledvin se před užíváním poraďte s lékařem</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Forma kapslí se snadno začlení do každodenní rutiny. Mnoho lidí ji kombinuje s omezením soli a pravidelným pohybem.</p>
<h2>Doručení a platba v České republice</h2>
<p>Doručení do Prahy, Brna, Ostravy, Plzně, Liberce a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Doplněk stravy, ne lék. Pravidelně si měřte krevní tlak a při hypertenzi se řiďte doporučeními kardiologa.</p>`;

const BLOOD_PRESSURE_GOLDEN_FAQ: FaqPair[] = [
  {
    q: "Jaké je doporučené dávkovací schéma kapslí Cardiotensive?",
    a: "Obvykle 1–2 kapsle denně s vodou při stejném jídle, alespoň 30 dní. Dodržujte dávku uvedenou na balení. Pokud už užíváte léky na snížení krevního tlaku, poraďte se před přidáním doplňku s lékařem.",
  },
  {
    q: "Mohu Cardiotensive užívat spolu s léky na snížení krevního tlaku?",
    a: "Kombinaci by měl posoudit lékař, zvláště při užívání diuretik, betablokátorů nebo jiných léků na srdce. Cardiotensive je doplněk, ne náhrada léčby. Neupravujte předepsané dávky bez lékařské konzultace.",
  },
  {
    q: "Za jak dlouho je cítit změna v komfortu srdce a cév?",
    a: "Mnoho uživatelů hlásí subjektivní změnu po 3–4 týdnech pravidelného užívání při vyvážené stravě a pohybu. Výsledky jsou individuální; doplněk nezaručuje konkrétní hodnoty krevního tlaku.",
  },
  {
    q: "Jak mohu Cardiotensive zaplatit a jak se doručuje v České republice?",
    a: "Platba na dobírku hotově nebo způsobem, který kurýr přijímá. Doručení pokrývá velká města (Praha, Brno, Ostrava) i mnoho menších obcí.",
  },
  {
    q: "Je Cardiotensive vhodný při velmi nízkém krevním tlaku?",
    a: "Osoby s nízkým krevním tlakem nebo užívající léky na snížení tlaku by se měly před užíváním poradit s lékařem. Doplněk nenahrazuje akutní léčbu; při nebezpečných hodnotách okamžitě vyhledejte lékařskou pomoc.",
  },
];

const ANTI_AGING_GOLDEN_HTML = `<h2>Cíl a forma produktu</h2>
<p><strong>Elesse</strong> je krém pro péči o zralou pleť. Formule je určena těm, kdo na obličeji a krku pozorují jemné vrásky, ztrátu pevnosti nebo suchou pokožku.</p>
<p>Krémová textura je určena k nanášení na čistou pokožku ráno a večer, k pravidelné každodenní aplikaci.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>kyselina hyaluronová</strong> — běžná složka v kosmetice proti vráskám</li>
<li><strong>hydrolyzovaný kolagen</strong> — složka ve zpevňujících formulích</li>
<li><strong>vitamin E</strong> — antioxidant v péči o pleť</li>
<li><strong>jojobový olej</strong> — zvláčňující složka pro hydrataci</li>
</ul>
<p>Krém se nanáší místně; nenahrazuje dermatologické zákroky ani předepsanou léčbu.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Tenkou vrstvu na obličej, krk a dekolt ráno a večer</li>
<li>Jemná masáž až do vstřebání, po očištění</li>
<li>Pravidelné používání 4–8 týdnů pro zhodnocení vzhledu pleti</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Vyhněte se kontaktu s očima; při podráždění používání přerušte</li>
<li>U citlivé pleti nejprve otestujte na malé ploše kůže</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Formule spojuje hydrataci a složky spojené s mladistvým vzhledem. Mnozí ji používají jako stálý krok v péči o pleť spolu s ochranou před sluncem.</p>
<h2>Doručení a platba v České republice</h2>
<p>Doručení do Prahy, Brna, Ostravy, Plzně a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Kosmetika k zevnímu použití. Ne lék a bez léčivého účinku. Při známé alergii zkontrolujte seznam složek na balení.</p>`;

const ANTI_AGING_GOLDEN_FAQ: FaqPair[] = [
  {
    q: "Jak správně nanášet krém Elesse na obličej a krk?",
    a: "Po očištění naneste tenkou vrstvu na obličej, krk a dekolt ráno a večer. Jemně vmasírujte až do vstřebání. Vyhněte se okolí očí. Pro viditelný výsledek se doporučuje 4–8 týdnů pravidelného používání.",
  },
  {
    q: "Mohu Elesse používat pod make-up nebo s jinými přípravky?",
    a: "Ano, po vstřebání můžete nanést make-up. Pokud používáte přípravek s kyselinou, naneste nejprve ten a poté Elesse. U citlivé pleti zavádějte postupně a sledujte reakci v prvních dnech.",
  },
  {
    q: "Za kolik týdnů je cítit hydratovanější pleť?",
    a: "Hydrataci lze pocítit během několika dní, hladší vzhled jemných vrásek často po 4–6 týdnech každodenního používání. Výsledek závisí na typu pleti a celkové péči.",
  },
  {
    q: "Jak se Elesse doručuje v České republice a jak mohu zaplatit?",
    a: "Objednávku doručuje kurýr do většiny míst, včetně Prahy a Brna. Platba na dobírku. Balení je diskrétní, vhodné pro online objednávku kosmetiky.",
  },
  {
    q: "Je Elesse vhodný pro velmi citlivou pleť nebo aktivní akné?",
    a: "Před použitím na větší ploše otestujte na malé ploše kůže. Při zánětlivém akné nebo aktivní dermatologické léčbě se poraďte s lékařem. Elesse je anti-aging krém, ne přípravek na akné.",
  },
];

const INTIMATE_GOLDEN_HTML = `<h2>Cíl a forma produktu</h2>
<p><strong>Proctowell</strong> je krém k zevnímu použití na anální a perianální oblast. Formule je určena při diskomfortu, svědění nebo místním podráždění způsobeném hemoroidy.</p>
<p>Textura je určena k jemnému nanášení po hygieně, perorálně se neužívá.</p>
<h2>Složení a mechanismus účinku</h2>
<ul>
<li><strong>extrakt z vilínu</strong> — běžná rostlinná složka v perianálních produktech</li>
<li><strong>aloe vera</strong> — zklidňující složka na podrážděnou pokožku</li>
<li><strong>oxid zinečnatý</strong> — složka používaná v ochranných formulích na pokožku</li>
<li><strong>tea tree olej</strong> — v kosmetice určené pro citlivé oblasti</li>
</ul>
<p>Krém se nanáší místně; nenahrazuje proktologické vyšetření ani předepsanou léčbu.</p>
<h2>Použití: doporučené schéma</h2>
<ul>
<li>Tenkou vrstvu na čistou, suchou pokožku 2–3× denně</li>
<li>Po stolici oblast jemně očistěte a naneste čistou rukou</li>
<li>Pravidelné používání 1–2 týdny, poté zhodnoťte příznaky</li>
</ul>
<h3>Upozornění</h3>
<ul>
<li>Nezavádějte produkt do análního kanálu, pokud balení neobsahuje vnitřní aplikátor</li>
<li>Při přetrvávajícím nebo silném krvácení a intenzivní bolesti se obraťte na lékaře</li>
</ul>
<h2>Proč právě tento produkt</h2>
<p>Krémová forma umožňuje domácí místní aplikaci bez složitých postupů. Mnozí ji kombinují se stravou bohatou na vlákninu a dostatečným příjmem tekutin.</p>
<h2>Doručení a platba v České republice</h2>
<p>Diskrétní doručení do Prahy, Brna, Ostravy, Plzně a dalších měst. Platba na dobírku při převzetí.</p>
<h2>Důležité před objednávkou</h2>
<p>Produkt k zevnímu použití, ne lék. Při závažných nebo přetrvávajících příznacích vyhledejte lékařské posouzení; neodkládejte proktologické vyšetření.</p>`;

const INTIMATE_GOLDEN_FAQ: FaqPair[] = [
  {
    q: "Jak nanášet krém Proctowell při vnějších hemoroidech?",
    a: "Po místní hygieně pokožku jemně osušte a poté 2–3× denně naneste tenkou vrstvu zvenku. Použijte čistou ruku nebo aplikátor přiložený v balení. Vyhněte se silnému tření; při zhoršujícím se diskomfortu snižte četnost a poraďte se s lékařem.",
  },
  {
    q: "Mohu Proctowell používat spolu s předepsanými čípky?",
    a: "Kombinaci je třeba konzultovat s lékařem. Obvykle se čípek používá podle předpisu a krém lze nanášet na vnější podrážděnou oblast, pokud to specialista nezakazuje. Nenahrazujte jím sám o sobě předepsanou léčbu.",
  },
  {
    q: "Za kolik dní se může zmírnit diskomfort při sezení?",
    a: "Mnoho uživatelů hlásí větší komfort po 3–7 dnech pravidelné aplikace při stravě bohaté na vlákninu a dostatečné hydrataci. Pokud příznaky přetrvávají i po dvou týdnech nebo se objeví krvácení, obraťte se na lékaře.",
  },
  {
    q: "Jak se Proctowell doručuje v České republice?",
    a: "Zásilku doručuje kurýr, ve velkých městech obvykle do 2–5 pracovních dní, například do Prahy a Brna. Platba na dobírku. Balení jasně nenaznačuje obsah.",
  },
  {
    q: "Je Proctowell vhodný během těhotenství nebo kojení?",
    a: "Během těhotenství a kojení je třeba použití jakéhokoli perianálního produktu konzultovat se souhlasem gynekologa nebo proktologa. Proctowell je místní krém, ale složky mohou v tomto období vyžadovat individuální posouzení.",
  },
];

export const SHELF_GOLDEN_PACKAGES: Record<
  shelfArchetype,
  { html: string; faq: FaqPair[] }
> = {
  "oral-medical": { html: VISION_GOLDEN_HTML, faq: VISION_GOLDEN_FAQ },
  "topical-medical": { html: ANTI_AGING_GOLDEN_HTML, faq: ANTI_AGING_GOLDEN_FAQ },
  "oral-lifestyle": { html: BLOOD_PRESSURE_GOLDEN_HTML, faq: BLOOD_PRESSURE_GOLDEN_FAQ },
  potency: { html: BLOOD_PRESSURE_GOLDEN_HTML, faq: BLOOD_PRESSURE_GOLDEN_FAQ },
  appliance: { html: ANTI_AGING_GOLDEN_HTML, faq: ANTI_AGING_GOLDEN_FAQ },
};

const CATEGORY_GOLDEN_OVERRIDES: Partial<
  Record<string, { html: string; faq: FaqPair[] }>
> = {
  "zrak": { html: VISION_GOLDEN_HTML, faq: VISION_GOLDEN_FAQ },
  "krevni-tlak": { html: BLOOD_PRESSURE_GOLDEN_HTML, faq: BLOOD_PRESSURE_GOLDEN_FAQ },
  "anti-aging": { html: ANTI_AGING_GOLDEN_HTML, faq: ANTI_AGING_GOLDEN_FAQ },
  "hemoroidy": { html: INTIMATE_GOLDEN_HTML, faq: INTIMATE_GOLDEN_FAQ },
};

function isTopicalFormKind(formKind?: string): boolean {
  return formKind ? TOPICAL_FORM_KINDS.has(formKind) : false;
}

export function resolveShelfArchetype(categorySlug: string, formKind?: string): shelfArchetype {
  if (APPLIANCE_SLUGS.has(categorySlug)) return "appliance";
  if (categorySlug === "potence") return "potency";
  if (TOPICAL_MEDICAL_SLUGS.has(categorySlug) && isTopicalFormKind(formKind)) {
    return "topical-medical";
  }
  if (ORAL_LIFESTYLE_SLUGS.has(categorySlug)) return "oral-lifestyle";
  if (ORAL_MEDICAL_SLUGS.has(categorySlug) || !isTopicalFormKind(formKind)) {
    return "oral-medical";
  }
  return "topical-medical";
}

export function getShelfGoldenPackage(
  categorySlug: string,
  formKind?: string,
): { html: string; faq: FaqPair[] } {
  const override = CATEGORY_GOLDEN_OVERRIDES[categorySlug];
  if (override) return override;
  const archetype = resolveShelfArchetype(categorySlug, formKind);
  return SHELF_GOLDEN_PACKAGES[archetype];
}

export function buildShelfGoldenBlockBG(categorySlug: string, formKind?: string): string {
  const pkg = getShelfGoldenPackage(categorySlug, formKind);
  return `=== REFERENČNÍ PŘÍKLAD (struktura + styl pro tuto kategorii) ===
Zkopíruj strukturu h2/h3 a věcný tón. Aplikuj na produkt z briefu — nekopíruj doslovně názvy nebo složky z příkladu, pokud feed naznačuje něco jiného.

${pkg.html}`;
}

export function buildShelfGoldenFaqBlockBG(categorySlug: string, formKind?: string): string {
  const pkg = getShelfGoldenPackage(categorySlug, formKind);
  const lines = pkg.faq.map((p) => `K: ${p.q}\nV: ${p.a}`).join("\n\n");
  return `=== PŘÍKLAD FAQ (stejný styl, pro SKU z briefu) ===
Napiš 5 UNIKÁTNÍCH otázek k produktu z briefu ve stejném konkrétním stylu — nekopíruj doslovně následující.

${lines}`;
}

/** Static FAQ fallback when the LLM call returns too few items. */
export function getShelfGoldenFaqFallback(
  categorySlug: string,
  formKind: string | undefined,
  brand: string,
): { q: string; a: string }[] {
  const pkg = getShelfGoldenPackage(categorySlug, formKind);
  const token = brand.trim() || "produkt";
  return pkg.faq.map((p) => ({
    q: p.q.replace(/\{brand\}/gi, token).replace(/Cleaview|Hondrofrost|Parazol/gi, token),
    a: p.a.replace(/\{brand\}/gi, token).replace(/Cleaview|Hondrofrost|Parazol/gi, token),
  }));
}

export type GoldenBundle = {
  exampleBlock: string;
  thinFeedBlock: string;
  shortFieldsBlock: string;
};

/** One contextual example bundle per product lane (slim prompt). */
export function pickGoldenBundle(input: {
  brief?: FormExemplarBrief & { formLabel?: string };
  categorySlug: string;
  formKind?: string;
  mode: "supplement" | "appliance";
  feedHasContent: boolean;
  feedIsThin: boolean;
}): GoldenBundle {
  const { brief, categorySlug, formKind, mode, feedHasContent, feedIsThin } = input;
  const exampleBlock = buildShelfGoldenBlockBG(categorySlug, formKind);
  let thinFeedBlock = "";
  if (!feedHasContent || feedIsThin) {
    thinFeedBlock =
      mode === "appliance"
        ? `=== SLABÝ FEED — PŘÍKLADY ===
DOBŘE: «Přesné specifikace nejsou v popisu uvedeny. U takových přístrojů se často vyskytuje: napájení USB/220 V, materiály plast/kov — ověřte na balení při doručení.»
ŠPATNĚ: «1500 W, certifikát CE» (vymyšlená čísla vydávaná za fakta)`
        : COMPOSITION_THIN_FEED_GUIDE;
  }

  const exemplarBrief: FormExemplarBrief | undefined = brief
    ? {
        categorySlug,
        formKind: formKind ?? brief.formKind,
        cleanBrand: brief.cleanBrand,
        rawTitle: brief.rawTitle,
        displayH1: brief.displayH1,
        productRole: brief.productRole,
        feedCleaned: brief.feedCleaned,
        formExemplarLane: brief.formExemplarLane,
      }
    : undefined;

  const shortFieldsBlock =
    brief && mode === "supplement"
      ? [
          buildDescriptorStyleGuideCS({
            categorySlug,
            formLabel: brief.formLabel,
            cleanBrand: brief.cleanBrand,
            productRole: brief.productRole,
            rawTitle: brief.rawTitle,
            feedCleaned: brief.feedCleaned,
            displayH1: brief.displayH1,
            formKind: formKind ?? brief.formKind,
          }),
          buildShortFieldsExampleBlock(exemplarBrief ?? { categorySlug, formKind, cleanBrand: brief.cleanBrand }),
          `=== KRÁTKÁ POLE (title, subtitle, meta_desc) ===
Cílový styl: «${brief.cleanBrand} — ${brief.productRole || brief.formLabel || "konkrétní popisek"}»
meta_desc: 120–155 znaků, informativní, bez značky, s diskrétní CTA.`,
        ].join("\n\n")
      : brief
        ? `=== KRÁTKÁ POLE ===
title: značka + konkrétní použití z feedu; meta_desc: 120–155 znaků, bez značky.`
        : "";
  return { exampleBlock, thinFeedBlock, shortFieldsBlock };
}
