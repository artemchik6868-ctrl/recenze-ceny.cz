/** Search-intent vocabulary injected into CZ AI prompts (PDP + FAQ). */

import { getCategoryDescriptor } from "./category-descriptors.cs";
import { SUPPLEMENT_PRIMARY_KW } from "./supplement-serp-keywords.cs";

export type CategorySeoIntent = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailPatterns: string[];
  searchIntent: "commercial" | "transactional" | "informational";
  paaQuestions: string[];
  h2Variants: string[][];
};

const DEFAULT_PAA = [
  "Jak dlouho trvá doručení v České republice?",
  "Mohu platit na dobírku?",
  "Jak ověřím originalitu produktu?",
];

const SUPPLEMENT_H2_BASE = [
  "Účel a forma produktu",
  "Složení a způsob účinku",
  "Užívání: doporučené schéma (+ h3 Upozornění)",
  "Proč zvolit tento produkt",
  "Důležité před objednávkou",
];

const SUPPLEMENT_H2_VARIANTS: string[][] = [
  SUPPLEMENT_H2_BASE,
  [
    "Co je produkt a pro koho je určen",
    "Složky a způsob účinku",
    "Jak užívat (+ h3 Upozornění)",
    "Praktické výhody",
    "Co zkontrolovat před objednávkou",
  ],
  [
    "Forma produktu a cíl",
    "Podrobné složení",
    "Denní režim užívání (+ h3 Upozornění)",
    "Pro koho je vhodný",
    "Informace před nákupem",
  ],
  [
    "Role produktu v každodenním životě",
    "Složení a mechanismus",
    "Způsob užívání (+ h3 Upozornění)",
    "Proč stojí za pozornost",
    "Upozornění před objednávkou",
  ],
];

const APPLIANCE_H2_VARIANTS: string[][] = [
  [
    "Zařízení a fungování",
    "Použití (+ h3 Upozornění)",
    "Proč zvolit tento produkt",
    "Důležité před objednávkou",
  ],
  [
    "Co zařízení dělá",
    "Praktické použití (+ h3 Upozornění)",
    "Profily uživatelů",
    "Co zkontrolovat před objednávkou",
  ],
  [
    "Funkce a specifikace",
    "Způsob použití (+ h3 Upozornění)",
    "Pro koho je vhodný",
    "Informace před nákupem",
  ],
];

const OPENING_ANGLES = [
  "problem-first: začni nepohodlím kategorie nebo nákupním záměrem",
  "how-it-works: vysvětli mechanismus nebo konkrétní použití",
  "who-is-it-for: popiš typický profil českého zákazníka",
  "comparison: porovnej s obecnými alternativami (bez konkurentů)",
] as const;

function slugKeyword(slug: string, d: ReturnType<typeof getCategoryDescriptor>): string {
  const serp = SUPPLEMENT_PRIMARY_KW[slug];
  if (serp) return serp.toLowerCase();
  const pk = d?.primaryKeywords?.[0];
  if (pk) return pk.toLowerCase();
  const short = d?.short?.replace(/^(pro|na|proti)\s+/i, "").trim();
  if (short) return short.toLowerCase();
  return slug.replace(/-/g, " ");
}

function buyerLongTail(primary: string): string[] {
  return [
    `{brand} originální?`,
    `{brand} jak užívat?`,
    `kde koupit {brand} v České republice`,
    `{brand} ${primary}`,
    `jak dlouho vystačí balení {brand}`,
  ];
}

function buildIntent(slug: string, overrides: Partial<CategorySeoIntent> = {}): CategorySeoIntent {
  const d = getCategoryDescriptor(slug);
  const primary = (overrides.primaryKeyword ?? slugKeyword(slug, d)).toLowerCase();
  const secondary = [
    ...(d?.primaryKeywords ?? []).slice(0, 4),
    ...(d?.mustMention ?? []).slice(0, 2),
    "doručení v České republice",
    "platba na dobírku",
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase())
    .filter((s) => s !== primary);
  const { primaryKeyword: _pk, secondaryKeywords: secOv, ...rest } = overrides;
  return {
    primaryKeyword: primary,
    secondaryKeywords: secOv?.length
      ? secOv
      : [...new Set(secondary)].slice(0, 8),
    longTailPatterns: buyerLongTail(primary),
    searchIntent: "commercial",
    paaQuestions: DEFAULT_PAA,
    h2Variants: SUPPLEMENT_H2_VARIANTS,
    ...rest,
  };
}

const INTENTS: Record<string, CategorySeoIntent> = {
  "klouby": buildIntent("klouby", {
    primaryKeyword: "doplňky stravy na klouby",
    secondaryKeywords: [
      "kloubní výživa",
      "kolagen na klouby",
      "glukosamin",
      "chondroitin",
      "MSM",
      "kyselina hyaluronová",
      "bolest kloubů doplněk",
      "kloubní gel",
      "doručení v České republice",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Jak dlouho užívat kloubní výživu, než hodnotím účinek?",
      "Je lepší kolagen, glukosamin, chondroitin, nebo MSM?",
      "Stačí kloubní gel, nebo potřebuji doplněk stravy?",
      "Pomůže kloubní výživa bez pohybu?",
      "Lze kombinovat s protizánětlivými léky?",
      "Jaká je bezpečná orientační dávka glukosaminu?",
      "Nahrazuje kloubní výživa vyšetření u lékaře?",
      ...DEFAULT_PAA,
    ],
  }),
  "prostata": buildIntent("prostata", {
    paaQuestions: [
      "Fungují doplňky stravy na prostatu, nebo je lepší hned lék z lékárny?",
      "Jak vybrat přípravek na prostatu podle složení?",
      "Pomáhají doplňky při nočním močení?",
      "Je doplněk na prostatu vhodný pro muže nad 50 let?",
      "Jak dlouho užívat doplňky stravy na prostatu?",
      "Saw palmetto samotné, nebo komplex s kopřivou a zinkem?",
      "Na co se dívat u standardizace saw palmetta?",
      "Kdy místo doplňku rovnou k urologovi?",
      ...DEFAULT_PAA,
    ],
  }),
  paraziti: buildIntent("paraziti", {
    secondaryKeywords: [
      "přípravky proti parazitům",
      "prostředek proti parazitům",
      "kapsle proti parazitům",
      "antiparazitární doplněk stravy",
      "bylinná kúra proti parazitům",
      "očista od parazitů",
      "střevní paraziti doplněk",
      "pelyněk pravý",
      "ořešák královský",
      "hřebíček",
      "česnek",
      "papája",
      "kurkuma",
      "dýňová semínka",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Jak dlouho trvá kúra proti parazitům?",
      "Nahrazuje doplněk stravy lék na odčervení?",
      "Jaké byliny bývají v přípravcích proti parazitům?",
      "Lze užívat společně s jinými přípravky?",
      "Je kategorie Paraziti totéž co detoxikace?",
      "Kdy místo doplňku rovnou k lékaři?",
      ...DEFAULT_PAA,
    ],
  }),
  "plisen-nehtu": buildIntent("plisen-nehtu", {
    secondaryKeywords: [
      "plíseň nehtů",
      "mykóza nehtů",
      "onychomykóza",
      "gel na plíseň nehtů",
      "krém na plíseň nehtů",
      "roztok proti plísni",
      "sprej proti plísni",
      "plíseň nehtů na nohou",
      "přípravky na plíseň nehtů",
      "hygiena nohou",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jak dlouho aplikovat gel nebo krém na plíseň nehtů?",
      "Funguje přípravek i na kůži, nebo jen na nehty?",
      "Gel, roztok nebo kapsle — co zvolit při plísni nehtů?",
      "Jak poznám pokročilou mykózu nehtů?",
      "Pomáhá hygiena nohou stejně jako přípravek?",
      "Kdy raději k dermatologovi než po další balení?",
      ...DEFAULT_PAA,
    ],
  }),
  papilomy: buildIntent("papilomy", {
    searchIntent: "commercial",
    secondaryKeywords: [
      "gel na papilomy",
      "gel na bradavice",
      "přípravky na bradavice",
      "odstranění papilomů doma",
      "papilomy na krku",
      "papilomy v podpaží",
      "kožní výrůstky",
      "vlaštovičník na bradavice",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Lze odstranit papilomy bez lékaře?",
      "Jak dlouho aplikovat gel na papilomy nebo bradavice?",
      "Je gel na bradavice vhodný i na papilomy na krku?",
      "Mohu přípravek použít na obličej?",
      "Proč se nedoporučuje stříhat papilomy doma?",
      ...DEFAULT_PAA,
    ],
  }),
  "zvetseni-penisu": buildIntent("zvetseni-penisu", {
    searchIntent: "commercial",
    primaryKeyword: "přípravky na zvětšení penisu",
    secondaryKeywords: [
      "zvětšení penisu",
      "gel na zvětšení penisu",
      "krém na zvětšení penisu",
      "kapsle na zvětšení penisu",
      "prokrvení penisu",
      "pumpa na zvětšení penisu",
      "L-arginin",
      "diskrétní balení",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jaké formy přípravků na zvětšení penisu existují?",
      "Jak vybrat mezi lokální péčí a kapslemi?",
      "Co reálně očekávat od přípravků na zvětšení penisu?",
      "Je zásilka diskrétní a mohu platit na dobírku?",
      "Kdy raději k lékaři než po další balení?",
      ...DEFAULT_PAA,
    ],
  }),
  "potence": buildIntent("potence", {
    searchIntent: "transactional",
    secondaryKeywords: [
      "prášky na erekci",
      "prášky na erekci bez předpisu",
      "tablety na erekci",
      "kapsle na potenci",
      "přípravky na potenci",
      "prostředky na potenci",
      "doplňky stravy pro erekci",
      "libido",
      "kotvičník zemní",
      "L-arginin",
      "maca",
      "ženšen",
      "zinek",
      "platba na dobírku",
      "diskrétní doručení",
    ],
    paaQuestions: [
      "Jsou prášky na erekci bez předpisu totéž co Viagra?",
      "Zvolit nárazovou podporu, nebo dlouhodobou kúru?",
      "Jak dlouho trvá kúra doplňků na potenci?",
      "Lze kombinovat s léky na tlak nebo srdce?",
      "Kapsle, kapky nebo gel — co je lepší?",
      "Jaké složky doplňky na potenci často obsahují?",
      ...DEFAULT_PAA,
    ],
  }),
  "hubnuti": buildIntent("hubnuti", {
    secondaryKeywords: [
      "prášky na hubnutí",
      "kapky na hubnutí",
      "kapsle na hubnutí",
      "spalovač tuků",
      "tlumič hladu",
      "doplňky na hubnutí",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Fungují prášky na hubnutí, nebo je to vyhozené peníze?",
      "Jak vybrat prášky na hubnutí a na co si dát pozor?",
      "Je nutná kombinace s dietou a pohybem?",
      "Kapky nebo kapsle na hubnutí — co je lepší?",
      "Jak dlouho užívat doplňky na hubnutí?",
      "Mohu kombinovat tlumič hladu se spalovačem tuků?",
      ...DEFAULT_PAA,
    ],
  }),
  sluch: buildIntent("sluch", {
    primaryKeyword: "doplňky stravy na sluch",
    secondaryKeywords: [
      "doplňky na sluch",
      "kapsle na sluch",
      "podpora sluchu",
      "tinnitus",
      "šumění v uších",
      "pískání v uších",
      "hučení v uších",
      "ginkgo biloba tinnitus",
      "hořčík tinnitus",
      "co na šumění v uších",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Pomáhají doplňky stravy při tinnitu (šumění / pískání v uších)?",
      "Jaký je rozdíl mezi doplňkem na sluch a naslouchátkem?",
      "Má smysl ginkgo biloba na sluch nebo tinnitus?",
      "Jak dlouho užívat kapsle na podporu sluchu?",
      "Kdy raději k ORL než po doplněk?",
      "Mohu kombinovat doplněk na sluch s léky na předpis?",
      "Obnoví doplněk stravy poškozený sluch?",
      ...DEFAULT_PAA,
    ],
  }),
  "zrak": buildIntent("zrak", {
    primaryKeyword: "doplňky stravy na zrak",
    secondaryKeywords: [
      "doplňky stravy pro oči a zrak",
      "doplňky stravy na ochranu očí",
      "vitamíny na oči",
      "kapsle na oči",
      "lutein",
      "zeaxantin",
      "zeaxanthin",
      "zinek na zrak",
      "omega-3 DHA oči",
      "extrakt z borůvek",
      "únava očí z monitoru",
      "modré světlo",
      "doručení v České republice",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Nahrazují doplňky stravy na zrak oční vyšetření?",
      "Jak dlouho užívat kapsle na oči?",
      "Kolik luteinu mívají doplňky stravy?",
      "Kapsle, oční kapky, nebo brýle?",
      "Je lepší užívat lutein s jídlem?",
      "Pomohou doplňky při únavě očí z monitoru?",
      "Kdy raději k očaři než po doplněk?",
      ...DEFAULT_PAA,
    ],
  }),
  "vboceny-palec": buildIntent("vboceny-palec", {
    primaryKeyword: "přípravky na vbočený palec",
    secondaryKeywords: [
      "hallux valgus",
      "vbočený palec",
      "krém na vbočený palec",
      "krém na hallux valgus",
      "sprej na hallux valgus",
      "lokální péče při hallux valgus",
      "korektor vbočeného palce",
      "noční bandáž",
      "široká obuv",
      "ortoped",
      "platba na dobírku",
      "doručení Česká republika",
    ],
    paaQuestions: [
      "Krém na vbočený palec, nebo korektor — co zvolit?",
      "Narovná krém nebo sprej kostní deformitu hallux valgus?",
      "Aplikovat krém ráno, nebo večer?",
      "Jak dlouho používat přípravek na vbočený palec?",
      "Kdy raději k ortopedovi než po další balení?",
      ...DEFAULT_PAA,
    ],
  }),
  hemoroidy: buildIntent("hemoroidy", {
    primaryKeyword: "doplňky stravy na hemoroidy",
    secondaryKeywords: [
      "kapsle na hemoroidy",
      "krém na hemoroidy",
      "co pomáhá na hemoroidy",
      "mast na hemoroidy",
      "gel na hemoroidy",
      "hemeroidy",
      "dubová kůra hemoroidy",
      "diosmin hesperidin",
      "diskrétní balení",
      "doručení v České republice",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Kapsle nebo krém — jaká forma?",
      "Co pomáhá na hemoroidy kromě přípravku?",
      "Jak dlouho trvá kúra doplňku na hemoroidy?",
      "Nahrazují doplňky stravy na hemoroidy návštěvu lékaře?",
      "Mohu užívat doplněk spolu s mastí z lékárny?",
      ...DEFAULT_PAA,
    ],
  }),
  "chrapani": buildIntent("chrapani", {
    primaryKeyword: "přípravky proti chrápání",
    secondaryKeywords: [
      "doplňky stravy proti chrápání",
      "sprej proti chrápání",
      "kapky proti chrápání",
      "náplast proti chrápání",
      "kapsle na spánek",
      "prostředky proti chrápání",
      "jak se zbavit chrápání",
      "jak přestat chrápat",
      "spánková apnoe",
      "klidný spánek",
      "doručení v České republice",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Pomáhají volně prodejné přípravky proti chrápání opravdu?",
      "Sprej, kapky nebo náplast — co zvolit?",
      "Jak dlouho zkoušet přípravek proti chrápání?",
      "Jak poznám spánkovou apnoe od běžného chrápání?",
      "Nahrazuje doplněk stravy vyšetření u lékaře?",
      "Co pomáhá na chrápání kromě přípravku?",
      ...DEFAULT_PAA,
    ],
  }),
  "krevni-tlak": buildIntent("krevni-tlak", {
    primaryKeyword: "doplňky stravy na krevní tlak",
    secondaryKeywords: [
      "doplňky na vysoký krevní tlak",
      "byliny na tlak",
      "bylinné kapky na tlak",
      "hloh na krevní tlak",
      "přírodní prostředky na vysoký krevní tlak",
      "hořčík a draslík na tlak",
      "olivový list krevní tlak",
      "hypertenze doplněk stravy",
      "podpora krevního tlaku",
      "doručení v České republice",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Lze užívat doplňky stravy na krevní tlak s předepsanými léky?",
      "Jaké hodnoty krevního tlaku jsou vysoké?",
      "Jak dlouho sledovat účinek doplňku?",
      "Pomáhají byliny na vysoký krevní tlak místo léků?",
      "Potřebuji tonometr, když beru doplněk na tlak?",
      "Je lepší hloh v kapkách, nebo v kapslích?",
      ...DEFAULT_PAA,
    ],
  }),
  "krecove-zily": buildIntent("krecove-zily", {
    primaryKeyword: "přípravky na křečové žíly",
    secondaryKeywords: [
      "gel na křečové žíly",
      "mast na křečové žíly",
      "doplňky stravy na žíly a cévy",
      "těžké nohy",
      "otoky nohou",
      "venotonika",
      "diosmin hesperidin",
      "koňský kaštan",
      "kompresní punčochy",
      "jak na křečové žíly",
      "doručení v České republice",
      "platba na dobírku",
    ],
    paaQuestions: [
      "Gel na křečové žíly, nebo tablety / kapsle?",
      "Jak dlouho lze přípravky na křečové žíly používat?",
      "Pomáhají doplňky stravy na otoky nohou?",
      "Co je venotonikum v kontextu doplňků stravy?",
      "Nahradí gel kompresní punčochy?",
      ...DEFAULT_PAA,
    ],
  }),
  lupenka: buildIntent("lupenka", {
    searchIntent: "commercial",
    secondaryKeywords: [
      "krém na lupénku",
      "mast na lupénku",
      "gel na lupénku",
      "kapsle na lupénku",
      "přípravky na lupénku",
      "přírodní péče při psoriáze",
      "omega-3 lupénka",
      "vitamin D lupénka",
      "probiotika pokožka",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Krém, mast nebo kapsle — co zvolit při lupénce?",
      "Je doplněk stravy totéž co léčba lupénky?",
      "Jak dlouho aplikovat krém na lupénku?",
      "Pomáhají omega-3 nebo vitamin D při lupénce?",
      "Co spouští vzplanutí lupénky?",
      "Kdy raději k dermatologovi než po další balení?",
      ...DEFAULT_PAA,
    ],
  }),
  "odvykani-koureni": buildIntent("odvykani-koureni", {
    searchIntent: "commercial",
    secondaryKeywords: [
      "kapsle na odvykání kouření",
      "přírodní prostředek proti kouření",
      "přípravky na odvykání kouření",
      "prostředek proti kouření",
      "abstinenční příznaky",
      "chuť na cigaretu",
      "nikotinová substituční terapie",
      "cytisin",
      "kudzu",
      "chaga",
      "meduňka",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jak dlouho trvá kúra doplňku na odvykání kouření?",
      "Lze kombinovat doplněk s nikotinovými náplastmi?",
      "Je doplněk stravy totéž co lék s cytisinem?",
      "Jaké byliny bývají v přírodních prostředcích proti kouření?",
      "Pomůže doplněk sám bez změny návyků?",
      "Kdy místo doplňku rovnou k lékaři?",
      ...DEFAULT_PAA,
    ],
  }),
  alkoholismus: buildIntent("alkoholismus", {
    searchIntent: "commercial",
    secondaryKeywords: [
      "přípravky na odvykání alkoholu",
      "přírodní prostředky proti alkoholu",
      "kapsle na odvykání alkoholu",
      "kapky proti alkoholismu",
      "vitaminy skupiny B alkohol",
      "thiamin",
      "ostropestřec",
      "silymarin",
      "kudzu",
      "hepatoprotektiva",
      "odvykací příznaky",
      "hořčík",
      "zinek",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Je doplněk stravy totéž co léčba alkoholismu?",
      "Kdy stačí doplněk a kdy je nutný lékař?",
      "K čemu jsou disulfiram, naltrexon nebo acamprosát?",
      "Proč se při odvykání zmiňují vitaminy B a ostropestřec?",
      "Jak poznám vhodnou formu — kapsle nebo kapky?",
      "Může rodina koupit přípravek místo terapie?",
      "Jak dlouho má smysl užívat podpůrný přípravek?",
      ...DEFAULT_PAA,
    ],
  }),
  "anti-aging": buildIntent("anti-aging", {
    searchIntent: "transactional",
    primaryKeyword: "doplňky stravy anti-aging",
    secondaryKeywords: [
      "doplňky stravy proti stárnutí",
      "anti-aging krém",
      "krém proti stárnutí",
      "krém proti vráskám",
      "kolagen na pleť",
      "kyselina hyaluronová",
      "hydrolyzovaný kolagen",
      "krása zevnitř",
      "koenzym Q10",
      "vitamin C na pleť",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jak rychle uvidím změnu u anti-aging péče?",
      "Stačí anti-aging krém bez SPF a režimu?",
      "Je lepší kolagen zevnitř, nebo lokální krém?",
      "Jak dlouho užívat doplňky stravy proti stárnutí?",
      "Jsou doplňky stravy anti-aging totéž co lék nebo filler?",
      "Kdy místo krému rovnou k dermatologovi?",
      ...DEFAULT_PAA,
    ],
  }),
  "cukrovka": buildIntent("cukrovka", {
    primaryKeyword: "doplňky stravy na cukrovku",
    secondaryKeywords: [
      "doplňky stravy na hladinu cukru",
      "doplňky stravy pro diabetiky",
      "přírodní prostředky na cukrovku",
      "doplněk na cukr v krvi",
      "chrom a skořice",
      "gurmar",
      "berberin cukrovka",
      "kyselina alfa-lipoová diabetes",
      "prediabetes doplněk",
      "doručení v České republice",
      "platba na dobírku",
    ],
    searchIntent: "commercial",
    paaQuestions: [
      "Nahrazují doplňky stravy na cukrovku předepsané léky?",
      "Lze kombinovat doplněk s inzulinem nebo metforminem?",
      "Jak dlouho užívat doplňky stravy na hladinu cukru?",
      "Je lepší chrom a skořice, nebo gurmar?",
      "Potřebuji glukometr, když beru doplněk na cukrovku?",
      "Pomáhají přírodní prostředky na cukrovku místo diety?",
      ...DEFAULT_PAA,
    ],
  }),
  cystitida: buildIntent("cystitida", {
    paaQuestions: [
      "Pomáhá doplněk stravy při akutní cystitidě, nebo jen při komfortu?",
      "Je lepší D-manóza, nebo brusinky s PAC?",
      "Jak dlouho užívat doplňky stravy na cystitidu?",
      "Mohu užívat doplňky na močové cesty v těhotenství?",
      "Nahradí doplněk antibiotika na zánět močových cest?",
      "Kdy raději k lékaři než po doplněk na cystitidu?",
      ...DEFAULT_PAA,
    ],
  }),
  "stres": buildIntent("stres", {
    paaQuestions: [
      "Pomáhají doplňky stravy na stres při nespavosti?",
      "Lze kombinovat s léky na úzkost nebo depresi?",
      "Jak dlouho užívat doplňky na klid a nervy?",
      "Je doplněk stravy totéž co lék na úzkost?",
      "Zvolit přípravek na denní klid, nebo na večerní spánek?",
      "Kdy raději k lékaři než po doplněk?",
      ...DEFAULT_PAA,
    ],
  }),
  "detox": buildIntent("detox", {
    primaryKeyword: "detoxikace organismu",
    secondaryKeywords: [
      "doplňky stravy na detoxikaci",
      "doplňky stravy na detoxikaci organismu",
      "očista organismu",
      "detox těla",
      "jaterní očista",
      "detoxikace jater",
      "očista střev",
      "odvodnění organismu",
      "bylinná detox kúra",
      "ostropestřec",
      "silymarin",
      "chlorella",
      "spirulina",
      "artyčok",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Nahrazuje doplněk stravy lékařskou očistu organismu?",
      "Podle čeho poznám, jestli mám sáhnout po játrech, střevech, nebo odvodnění?",
      "Kolik dnů má trvat bylinná detox kúra?",
      "Co očekávat od ostropestřce a silymarinu u detoxikace jater?",
      "Jde kombinovat detox s léky, těhotenstvím nebo kojením?",
      "Musím při detoxikaci organismu hladovět nebo pít jen šťávy?",
      "Kdy raději k lékaři než po doplněk?",
      ...DEFAULT_PAA,
    ],
  }),
  traveni: buildIntent("traveni", {
    secondaryKeywords: [
      "doplňky stravy na podporu trávení",
      "probiotika na trávení",
      "trávicí enzymy",
      "prebiotika",
      "nadýmání a plynatost",
      "vláknina",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Pomáhá při nadýmání a pomalém trávení?",
      "Probiotika, enzymy nebo byliny — co zvolit?",
      "Jakou roli hraje vláknina u trávení?",
      "Jak podpořit trávení po těžším jídle?",
      "Jak dlouho trvá kúra doplňku na trávení?",
      "Kdy raději k lékaři než po doplněk?",
      ...DEFAULT_PAA,
    ],
  }),
  "modni-doplnky": buildIntent("modni-doplnky", {
    primaryKeyword: "módní doplňky",
    secondaryKeywords: [
      "dámské doplňky",
      "pánské doplňky",
      "tašky",
      "hodinky",
      "sluneční brýle",
      "opasky",
      "módní doplňky online",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jak vybrat módní doplňky k outfitu?",
      "Jak vybrat tašku na každý den?",
      "Jak vybrat hodinky podle stylu?",
      "Jak sladit sluneční brýle s tvarem obličeje?",
      "Jak vybrat šířku a délku opasku?",
      "Mohu vyměnit velikost nebo model?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
  }),
  autodoplnky: buildIntent("autodoplnky", {
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "transactional",
    primaryKeyword: "autodoplňky",
    secondaryKeywords: [
      "doplňky do auta",
      "autopříslušenství",
      "autoelektronika",
      "držák mobilu do auta",
      "kompresor do auta",
      "parkovací senzory",
      "ochrana laku",
      "autokosmetika",
      "povinná výbava",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jak vybrat správné autodoplňky pro mé auto?",
      "Jak ověřím kompatibilitu s vozem?",
      "Zvládnu instalaci sám?",
      "Vybíjí doplněk autobaterii?",
      "Je na autoelektroniku záruka?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
  }),
  "domaci-klima": buildIntent("domaci-klima", { h2Variants: APPLIANCE_H2_VARIANTS }),
  "domaci-vychytavky": buildIntent("domaci-vychytavky", {
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
    primaryKeyword: "užitečné vychytávky do domácnosti",
    secondaryKeywords: [
      "domácí vychytávky",
      "chytré vychytávky do domácnosti",
      "praktické pomůcky do domácnosti",
      "USB doplňky do domácnosti",
      "Bluetooth reproduktor",
      "LED pásek",
      "laserový projektor",
      "mini čerpadlo",
      "zařízení na úsporu energie",
      "chytrá zásuvka",
      "standby spotřeba",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jaký typ domácí vychytávky mám vybrat jako první?",
      "Na co si dát pozor u USB doplňků do domácnosti?",
      "Jsou laserové projektory bezpečné pro děti?",
      "Pomůže zařízení na úsporu energie opravdu snížit účet?",
      "Je na elektroniku záruka?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
  }),
  "zahradni-naradi": buildIntent("zahradni-naradi", {
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
    primaryKeyword: "zahradní nářadí",
    secondaryKeywords: [
      "ruční zahradní nářadí",
      "aku zahradní nářadí",
      "zahradní technika",
      "zahradní nůžky",
      "plotostřih",
      "strunová sekačka",
      "hrábě",
      "rýč",
      "motyka",
      "základní sada zahradního nářadí",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Co patří do základní sady zahradního nářadí?",
      "Vyplatí se dražší ruční zahradní nářadí?",
      "Kdy zvolit aku místo elektrického nářadí?",
      "Jak vybrat nůžky a plotostřih?",
      "Stačí strunová sekačka místo velké sekačky?",
      "Jak pečovat o zahradní nářadí po sezóně?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
  }),
  "osobni-pece": buildIntent("osobni-pece", {
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
    primaryKeyword: "přístroje pro osobní péči",
    secondaryKeywords: [
      "zastřihovač vousů",
      "holicí strojek",
      "epilátor",
      "kulma",
      "čistič uší",
      "zubní fasety",
      "snap on smile",
      "bělení zubů",
      "voděodolný trimmer",
      "Wet&Dry",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jaký přístroj pro osobní péči zvolit jako první?",
      "Čím se liší zastřihovač vousů a holicí strojek?",
      "Epilátor, IPL, nebo depilace — co zvolit?",
      "Je spirálový čistič uší bezpečnější než vatové tyčinky?",
      "Jsou zubní fasety typu snap on smile trvalé řešení?",
      "Je na přístroje záruka?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
  }),
  "domaci-potreby": buildIntent("domaci-potreby", {
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
    primaryKeyword: "domácí potřeby",
    secondaryKeywords: [
      "potřeby pro domácnost",
      "úklidové potřeby",
      "praktické pomůcky do domácnosti",
      "organizéry do domácnosti",
      "úložné boxy",
      "potřeby do kuchyně",
      "drobní domácí pomocníci",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jaký typ domácích potřeb mám vybrat jako první?",
      "Čím se liší úklidové potřeby a organizéry do domácnosti?",
      "Na co si dát pozor u úložných boxů?",
      "Stačí drobný domácí pomocník místo velkého spotřebiče?",
      "Je na domácí potřeby záruka?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
  }),
  "domaci-textil": buildIntent("domaci-textil", {
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
    primaryKeyword: "bytový textil",
    secondaryKeywords: [
      "domácí textil",
      "povlečení",
      "ložní prádlo",
      "deka",
      "přehoz",
      "přikrývka",
      "polštář",
      "prostěradlo",
      "mikroplyšová deka",
      "bavlněné povlečení",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Čím se liší deka, přehoz a přikrývka?",
      "Jakou gramáž přikrývky zvolit?",
      "Jaký materiál povlečení je nejlepší?",
      "Hodí se bytový textil pro alergiky?",
      "Jak prát deku nebo mikroplyšovou deku?",
      "Jaký rozměr povlečení a přikrývky potřebuji?",
      "Je na bytový textil záruka?",
      "Mohu platit na dobírku?",
    ],
  }),
  "masazni-pristroje": buildIntent("masazni-pristroje", { h2Variants: APPLIANCE_H2_VARIANTS }),
  obleceni: buildIntent("obleceni", {
    primaryKeyword: "dámské oblečení",
    secondaryKeywords: [
      "pánské oblečení",
      "oblečení online",
      "šaty",
      "trička",
      "kalhoty",
      "džíny",
      "mikiny",
      "bundy",
      "platba na dobírku",
      "doručení v České republice",
    ],
    paaQuestions: [
      "Jak vybrat dámské oblečení online?",
      "Čím se liší pánské oblečení při výběru?",
      "Jak poznám správnou velikost?",
      "Jaký materiál zvolit na každý den?",
      "Mohu vyměnit velikost?",
      "Hodí se oblečení online i jako dárek?",
      "Jak dlouho trvá doručení v České republice?",
      "Mohu platit na dobírku?",
    ],
    h2Variants: APPLIANCE_H2_VARIANTS,
    searchIntent: "commercial",
  }),
};

function defaultIntent(slug: string): CategorySeoIntent {
  const nicheAppliance = [
    "autodoplnky",
    "domaci-klima",
    "domaci-vychytavky",
    "masazni-pristroje",
    "kosmeticke-nastroje",
    "osobni-pece",
    "lekarske-pristroje",
    "zahradni-naradi",
    "zahrada",
    "outdoor-kempovani",
    "optika",
    "hracky",
    "obleceni",
    "boty",
    "modni-doplnky",
    "vyhrivane-obleceni",
    "domaci-potreby",
    "domaci-textil",
  ].includes(slug);
  return buildIntent(slug, {
    h2Variants: nicheAppliance ? APPLIANCE_H2_VARIANTS : SUPPLEMENT_H2_VARIANTS,
  });
}

export function getCategorySeoIntent(slug: string): CategorySeoIntent {
  return INTENTS[slug] ?? defaultIntent(slug);
}

export function pickH2Variant(slug: string, seed: number, mode: "supplement" | "appliance"): string[] {
  const intent = getCategorySeoIntent(slug);
  const variants =
    mode === "appliance" ? APPLIANCE_H2_VARIANTS : intent.h2Variants.length ? intent.h2Variants : SUPPLEMENT_H2_VARIANTS;
  const idx = Math.abs(seed) % variants.length;
  return variants[idx]!.slice();
}

export function pickOpeningAngle(seed: number): string {
  return OPENING_ANGLES[Math.abs(seed) % OPENING_ANGLES.length]!;
}

export function buildSeoIntentPromptBlock(categorySlug: string, seed: number): string {
  const intent = getCategorySeoIntent(categorySlug);
  const angle = pickOpeningAngle(seed);
  return `=== NÁKUPNÍ ZÁMĚR (Česko) ===
Hlavní téma: «${intent.primaryKeyword}»
Užitečný kontext: ${intent.secondaryKeywords.join(", ")}
Skutečné dotazy (přizpůsob značce): ${intent.longTailPatterns.join("; ")}
Typ záměru: ${intent.searchIntent}
První odstavec (description_html): ${angle}
Odpověz na nákupní záměr — hlavní klíčové slovo jen pokud přirozeně zapadá do textu.`;
}

export function buildFaqPaaHintBlock(categorySlug: string): string {
  const intent = getCategorySeoIntent(categorySlug);
  if (intent.paaQuestions.length === 0) return "";
  return `PAA dotazy k adaptaci (min. 2, se značkou v textu):\n${intent.paaQuestions.map((q) => `- ${q}`).join("\n")}`;
}
