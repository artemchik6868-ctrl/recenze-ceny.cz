import { SUPPLEMENT_PRIMARY_KW } from "./supplement-serp-keywords.cs";

export type CategoryDescriptor = {
  short: string;
  long: string;
  problem: string;
  primaryKeywords?: string[];
  mustMention?: string[];
  keyEffects?: string[];
  audience?: string;
};

type RawEntry = { short: string; long: string };

const RAW: Record<string, RawEntry> = {
  "cukrovka": {
    short: "péče o cukrovku",
    long: "doplňky stravy na cukrovku a podporu metabolismu glukózy",
  },
  "krevni-tlak": {
    short: "krevní tlak",
    long: "doplňky stravy na krevní tlak a podporu srdce a cév",
  },
  paraziti: { short: "paraziti", long: "doplňky stravy na parazity a bylinné kúry pro podporu střev" },
  "klouby": {
    short: "kloubní výživa",
    long: "kolagen, glukosamin i topické přípravky pro pohyblivost a komfort kloubů",
  },
  "potence": { short: "mužská potence", long: "doplňky stravy pro podporu mužské potence a libida" },
  "hubnuti": { short: "kontrola hmotnosti", long: "doplňky stravy pro kontrolu hmotnosti" },
  "prostata": { short: "zdraví prostaty", long: "doplňky stravy na prostatu a podporu močových cest" },
  "zrak": {
    short: "péče o zrak",
    long: "doplňky stravy na zrak, lutein a vitamíny na oči při práci u monitoru",
  },
  "hemoroidy": {
    short: "na hemoroidy",
    long: "doplňky stravy na hemoroidy, kapsle a krémy pro podporu komfortu citlivé oblasti a žilního tonu",
  },
  "zdravi-zen": { short: "ženské zdraví", long: "doplňky stravy pro ženské zdraví" },
  "anti-aging": {
    short: "proti stárnutí",
    long: "doplňky stravy anti-aging a péče o pleť proti stárnutí",
  },
  traveni: { short: "trávení", long: "doplňky stravy pro zdraví trávicího systému" },
  "jatra": {
    short: "zdraví jater",
    long: "doplňky stravy pro podporu a přirozenou očistu jater",
  },
  papilomy: {
    short: "papilomy",
    long: "lokální přípravky a gely na papilomy a bradavice",
  },
  cystitida: {
    short: "zánět močového měchýře",
    long: "doplňky stravy pro podporu při zánětu močového měchýře a problémech s močovými cestami",
  },
  "plisen-nehtu": {
    short: "plíseň nehtů",
    long: "doplňky stravy a lokální přípravky na plíseň nehtů — gel, krém, roztok i kapsle",
  },
  "krecove-zily": {
    short: "křečové žíly",
    long: "gely, masti a doplňky stravy při těžkých nohou, otocích a podpoře žil",
  },
  lupenka: {
    short: "lupénka",
    long: "doplňky stravy a lokální přípravky na lupénku — krém, mast, gel i kapsle",
  },
  alkoholismus: {
    short: "při odvykání alkoholu",
    long: "doplňky stravy a přírodní podporu při snižování alkoholu — ne náhradu léčby závislosti",
  },
  "odvykani-koureni": { short: "odvykání kouření", long: "kapsle a přírodní podporu při snižování chuti na cigaretu" },
  sluch: { short: "sluch", long: "doplňky stravy pro zdraví sluchu" },
  "chrapani": {
    short: "proti chrápání",
    long: "přípravky proti chrápání a podpora klidnějšího spánku — sprej, kapky, náplast i kapsle",
  },
  "dychaci-cesty": { short: "pro dýchací cesty", long: "podporuje plíce a volné dýchání" },
  "stres": { short: "proti stresu", long: "podporuje nervový systém, spánek a vnitřní klid" },
  imunita: { short: "podpora imunity", long: "posiluje obranyschopnost" },
  "ledviny": {
    short: "zdraví ledvin",
    long: "doplňky stravy pro podporu ledvin a močového systému",
  },
  "detox": {
    short: "detoxikace a očista",
    long: "doplňky stravy na detoxikaci organismu — podpora jater, střev a přirozené očisty",
  },
  "vboceny-palec": {
    short: "na vbočený palec",
    long: "krém, sprej nebo kapsle pro podporu komfortu při vbočeném palci (hallux valgus)",
  },
  "vypadavani-vlasu": {
    short: "péče o vlasy",
    long: "vitamíny na vlasy a doplňky stravy při řídnutí a lámavosti vlasů",
  },
  "zahrada": { short: "zahradní produkt", long: "produkt pro zahradu a záhony" },
  "zahradni-naradi": {
    short: "zahradní nářadí",
    long: "ruční zahradní nářadí, nůžky, plotostřihy, strunové sekačky a aku technika pro zahradu a záhony",
  },
  "zvetseni-penisu": {
    short: "pro zvětšení penisu",
    long: "přípravky na zvětšení penisu — gely, krémy i kapsle / doplňky stravy",
  },
  "zvetseni-prsou": { short: "ženský doplněk", long: "doplňky stravy pro ženské zdraví" },
  "osobni-pece": {
    short: "přístroje pro osobní péči",
    long: "zastřihovač vousů, holicí strojek, epilátor, kulma, čistič uší nebo pomůcky pro úsměv a bělení zubů",
  },
  optika: { short: "optika", long: "dalekohled, monokulár, funkční brýle nebo teleskop pro pozorování a cestování" },
  "vyhrivane-obleceni": { short: "vyhřívané oblečení", long: "bunda nebo vesta s integrovanými topnými prvky" },
  "masazni-pristroje": { short: "masážní přístroj", long: "elektrický masážní přístroj, masážní pistole nebo masážní podložka na krk, záda a tělo" },
  "domaci-klima": { short: "kamna nebo topení", long: "elektrická kamna nebo přenosné topení do místnosti, NE bojler" },
  "kosmeticke-nastroje": { short: "nástroj na čištění obličeje", long: "elektrický kartáč, epilátor nebo čistič kartáčů pro péči o obličej" },
  "lekarske-pristroje": { short: "zdravotnické prostředky", long: "tlakoměr, glukometr nebo jiné domácí monitorovací zařízení" },
  autodoplnky: {
    short: "autodoplňky",
    long: "doplňky do auta, autopříslušenství a autoelektronika pro péči, komfort a cesty",
  },
  obleceni: {
    short: "dámské oblečení",
    long: "šaty, trička, kalhoty, džíny, mikiny nebo bundy pro každý den i zvláštní příležitost",
  },
  boty: { short: "boty", long: "pohodlné boty pro každý den" },
  "modni-doplnky": {
    short: "módní doplňky",
    long: "tašky, hodinky, sluneční brýle a opasky pro každodenní styling",
  },
  "hracky": { short: "hračky", long: "dětské hračky: RC, bublifuk, puzzle nebo hra" },
  "domaci-vychytavky": {
    short: "užitečné vychytávky do domácnosti",
    long: "kompaktní elektronika a praktické pomůcky — Bluetooth, USB, LED, mini čerpadla a úspora energie",
  },
  "domaci-potreby": {
    short: "domácí potřeby",
    long: "úklidové potřeby, organizéry, úložné boxy, potřeby do kuchyně a drobní domácí pomocníci",
  },
  "domaci-textil": {
    short: "bytový textil",
    long: "deky, přehozy, přikrývky, povlečení a polštáře pro útulný domov",
  },
  "outdoor-kempovani": { short: "venkovní vybavení", long: "stan, svítilna nebo vybavení pro kempování a rybaření" },
  other: { short: "produkt pro pohodu", long: "produkt pro každodenní pohodu" },
};

const CS_META: Partial<
  Record<
    string,
    Pick<CategoryDescriptor, "mustMention" | "keyEffects" | "audience" | "primaryKeywords">
  >
> = {
  "klouby": {
    mustMention: ["klouby", "chrupavka", "kloubní výživa", "glukosamin"],
    primaryKeywords: [
      "doplňky stravy na klouby",
      "kloubní výživa",
      "kolagen na klouby",
      "glukosamin",
      "kloubní gel",
    ],
    keyEffects: ["podpora pohyblivosti", "komfort po zátěži", "podpora chrupavky"],
    audience: "dospělí se ztuhlostí kloubů, sportovci i senioři pečující o hybnost",
  },
  "krevni-tlak": {
    mustMention: ["krevní tlak", "srdce", "doplněk stravy", "hloh"],
    primaryKeywords: [
      "doplňky stravy na krevní tlak",
      "doplňky na vysoký krevní tlak",
      "byliny na tlak",
      "hloh na krevní tlak",
      "bylinné kapky na tlak",
    ],
    keyEffects: [
      "podpora srdce a cév",
      "podpora krevního tlaku",
      "odolnost vůči stresu",
    ],
    audience:
      "dospělí se zvýšeným nebo hraničním krevním tlakem pod lékařským dohledem",
  },
  "cukrovka": {
    mustMention: ["cukrovka", "glukóza", "doplněk stravy", "chrom"],
    primaryKeywords: [
      "doplňky stravy na cukrovku",
      "doplňky stravy na hladinu cukru",
      "doplňky stravy pro diabetiky",
      "chrom a skořice",
      "gurmar",
    ],
    keyEffects: [
      "podpora metabolismu glukózy",
      "udržení normální hladiny glukózy",
      "denní komfort při režimu",
    ],
    audience:
      "dospělí s prediabetem nebo diabetem 2. typu pod lékařským dohledem",
  },
  "krecove-zily": {
    mustMention: ["křečové žíly", "těžké nohy", "žíly"],
    primaryKeywords: [
      "přípravky na křečové žíly",
      "gel na křečové žíly",
      "doplňky stravy na žíly a cévy",
      "těžké nohy",
      "venotonika",
    ],
    keyEffects: ["úleva při těžkých nohou", "podpora žil", "komfort nohou"],
    audience: "dospělí s pocitem těžkých nohou, otoky nebo viditelnými žilkami",
  },
  "prostata": {
    mustMention: ["prostata", "močení", "močové cesty", "saw palmetto"],
    primaryKeywords: [
      "doplňky stravy na prostatu",
      "přípravky na prostatu",
      "zdraví prostaty",
      "saw palmetto",
      "noční močení",
    ],
    keyEffects: [
      "komfort při močení",
      "podpora prostaty a močových cest",
      "každodenní podpora u mužů nad 40 let",
    ],
    audience: "muži nad 40 let s diskomfortem močových cest nebo prevencí ve středním věku",
  },
  "potence": {
    mustMention: ["potence", "libido", "erekce"],
    primaryKeywords: [
      "doplňky stravy na potenci",
      "prášky na erekci",
      "kapsle na potenci",
      "přípravky na potenci",
      "erekce",
      "libido",
    ],
    keyEffects: ["podpora erektilní funkce", "zvýšení sexuální touhy"],
    audience: "muži ve věku 30–60 let",
  },
  "zvetseni-penisu": {
    mustMention: ["zvětšení penisu", "přípravky", "prokrvení", "doplněk stravy"],
    primaryKeywords: [
      "přípravky na zvětšení penisu",
      "gel na zvětšení penisu",
      "krém na zvětšení penisu",
      "kapsle na zvětšení penisu",
      "prokrvení penisu",
    ],
    keyEffects: ["podpora prokrvení", "výběr formy podle režimu", "diskrétní nákup online"],
    audience: "dospělí muži srovnávající širokou nabídku přípravků na zvětšení penisu",
  },
  "anti-aging": {
    mustMention: ["anti-aging", "pleť", "kolagen", "kyselina hyaluronová"],
    primaryKeywords: [
      "doplňky stravy anti-aging",
      "doplňky stravy proti stárnutí",
      "anti-aging krém",
      "kolagen na pleť",
      "kyselina hyaluronová",
    ],
    keyEffects: ["podpora hydratace pleti", "podpora pružnosti", "krása zevnitř"],
    audience: "dospělí pečující o pleť a realistickou anti-aging rutinu",
  },
  "hubnuti": {
    mustMention: ["váha", "chuť k jídlu", "kalorický deficit"],
    primaryKeywords: ["doplňky stravy na hubnutí", "prášky na hubnutí", "kontrola hmotnosti"],
  },
  paraziti: {
    mustMention: ["trávení", "zdraví střev", "doplněk stravy", "bylinná kúra"],
    primaryKeywords: [
      "doplňky stravy na parazity",
      "přípravky proti parazitům",
      "kapsle proti parazitům",
      "antiparazitární doplněk stravy",
    ],
    audience: "dospělí zvažující bylinnou kúru jako podporu střev — ne náhradu diagnózy",
  },
  "detox": {
    mustMention: [
      "detoxikace organismu",
      "očista organismu",
      "ostropestřec",
      "játra",
      "doplněk stravy",
    ],
    primaryKeywords: [
      "detoxikace organismu",
      "očista organismu",
      "doplňky stravy na detoxikaci",
      "doplňky stravy na detoxikaci organismu",
      "jaterní očista",
      "odvodnění organismu",
    ],
    keyEffects: [
      "podpora přirozené očisty",
      "podpora normální funkce jater",
      "střevní komfort při vláknině",
    ],
    audience:
      "dospělí po svátcích nebo při jarní úpravě režimu, kteří hledají jemnou podporu očisty — ne agresivní kúru",
  },
  autodoplnky: {
    mustMention: ["autodoplňky", "kompatibilita", "napájení"],
    primaryKeywords: [
      "autodoplňky",
      "doplňky do auta",
      "autopříslušenství",
      "autoelektronika",
      "kompresor do auta",
    ],
  },
  obleceni: {
    mustMention: ["střih", "velikost", "materiál", "šaty", "trička", "kalhoty"],
    primaryKeywords: [
      "dámské oblečení",
      "pánské oblečení",
      "oblečení online",
      "šaty",
      "trička",
      "kalhoty",
      "džíny",
      "mikiny",
      "bundy",
    ],
  },
  "hracky": {
    mustMention: ["hračky", "děti"],
    primaryKeywords: ["dětské hračky", "hra"],
    audience: "rodiče dětí předškolního a mladšího školního věku",
  },
  boty: {
    mustMention: ["velikost", "pohodlí"],
    primaryKeywords: ["boty", "pohodlné boty"],
  },
  optika: {
    mustMention: ["pozorování", "viditelnost"],
    primaryKeywords: ["optika", "funkční brýle", "dalekohled"],
  },
  "modni-doplnky": {
    mustMention: ["tašky", "hodinky", "sluneční brýle", "opasky"],
    primaryKeywords: ["módní doplňky", "dámské doplňky", "tašky", "hodinky"],
  },
  "domaci-klima": {
    mustMention: ["topení", "atmosféra", "místnost"],
    primaryKeywords: ["kamna", "pokojové topení", "topení"],
  },
  "domaci-vychytavky": {
    mustMention: ["Bluetooth", "USB", "napájení", "záruka"],
    primaryKeywords: [
      "užitečné vychytávky do domácnosti",
      "domácí vychytávky",
      "chytré vychytávky do domácnosti",
      "USB doplňky do domácnosti",
      "Bluetooth reproduktor",
    ],
    audience: "dospělí hledající praktickou kompaktní elektroniku do bytu — ne celý smart-home systém",
  },
  "osobni-pece": {
    mustMention: ["zastřihovač", "epilátor", "Wet&Dry", "záruka"],
    primaryKeywords: [
      "přístroje pro osobní péči",
      "zastřihovač vousů",
      "holicí strojek",
      "epilátor",
      "čistič uší",
      "zubní fasety",
    ],
    audience: "dospělí hledající domácí přístroje na holení, epilaci, styling, hygienu uší nebo dočasnou estetiku úsměvu",
  },
  hemoroidy: {
    mustMention: ["hemoroidy", "hemeroidy"],
    primaryKeywords: ["hemoroidy", "kapsle na hemoroidy", "krém na hemoroidy", "hemeroidy"],
    keyEffects: ["komfort citlivé oblasti", "podpora žilního tonu", "diskrétní každodenní péče"],
    audience: "dospělí s mírným diskomfortem v oblasti konečníku, kteří hledají doplněk režimu — ne náhradu lékaře",
  },
  "chrapani": {
    mustMention: ["chrápání", "spánek", "přípravky proti chrápání"],
    primaryKeywords: [
      "přípravky proti chrápání",
      "chrápání",
      "sprej proti chrápání",
      "kapky proti chrápání",
      "klidný spánek",
    ],
    keyEffects: [
      "zmírnění nočního chrápání",
      "komfortnější dýchání ve spánku",
      "klidnější noci pro vás i partnera",
    ],
    audience:
      "dospělí, které ruší chrápání — vlastní nebo partnerovo — a hledají realistické volně prodejné možnosti před odborným vyšetřením",
  },
  "dychaci-cesty": {
    mustMention: ["dýchací cesty", "plíce"],
    primaryKeywords: ["dýchací cesty", "dýchání", "plíce"],
  },
  "stres": {
    mustMention: ["stres", "spánek", "nervový systém"],
    primaryKeywords: ["stres", "nervový systém", "vnitřní klid", "usínání"],
  },
  cystitida: {
    mustMention: [
      "zánět močového měchýře",
      "močové cesty",
      "D-manóza",
      "brusinky",
      "pálení při močení",
    ],
    primaryKeywords: [
      "zánět močového měchýře",
      "cystitida",
      "pálení při močení",
      "D-manóza",
      "brusinky",
      "doplňky na močové cesty",
    ],
    keyEffects: [
      "komfort při močení",
      "podpora močových cest",
      "podpora při prevenci recidiv",
    ],
    audience:
      "dospělí — často ženy — s opakovaným diskomfortem močového měchýře nebo recidivující cystitidou, kteří hledají doplněk stravy vedle režimu a lékařské péče",
  },
  "ledviny": {
    mustMention: ["ledviny", "močové cesty"],
    primaryKeywords: ["ledviny", "podpora ledvin", "močový systém"],
    keyEffects: ["podpora funkce ledvin", "komfort močových cest"],
    audience: "dospělí, kteří chtějí podpořit své ledviny a vylučovací systém",
  },
  "odvykani-koureni": {
    mustMention: ["odvykání kouření", "abstinenční příznaky", "doplněk stravy", "kudzu"],
    primaryKeywords: [
      "doplňky stravy na odvykání kouření",
      "kapsle na odvykání kouření",
      "přírodní prostředek proti kouření",
      "přípravky na odvykání kouření",
      "nikotinová substituční terapie",
    ],
    keyEffects: [
      "podpora při snižování spotřeby",
      "zvládání chuti na cigaretu v rámci režimu",
      "podpora při abstinenčních příznacích",
    ],
    audience:
      "dospělí, kteří chtějí přestat kouřit nebo snížit spotřebu a hledají doplněk stravy vedle režimu a případně NRT",
  },
  "zahradni-naradi": {
    mustMention: [
      "zahradní nářadí",
      "ruční zahradní nářadí",
      "zahradní nůžky",
      "strunová sekačka",
      "zahrada",
      "záhony",
    ],
    primaryKeywords: ["zahradní nářadí"],
  },
  "domaci-potreby": {
    mustMention: ["domácí potřeby", "úklid", "organizéry", "záruka"],
    primaryKeywords: [
      "domácí potřeby",
      "potřeby pro domácnost",
      "úklidové potřeby",
      "organizéry do domácnosti",
      "úložné boxy",
    ],
    audience:
      "dospělí hledající praktické domácí potřeby pro úklid, pořádek a drobné domácí úkoly — ne celý smart-home systém",
  },
  "domaci-textil": {
    mustMention: ["bytový textil", "deka", "povlečení", "přikrývka", "záruka"],
    primaryKeywords: [
      "bytový textil",
      "domácí textil",
      "povlečení",
      "ložní prádlo",
      "deka",
      "přehoz",
      "přikrývka",
    ],
    audience:
      "dospělí hledající bytový textil pro spánek a útulný interiér — deky, přehozy, přikrývky, povlečení a polštáře",
  },
};

const DESCRIPTORS: Record<string, CategoryDescriptor> = Object.fromEntries(
  Object.entries(RAW).map(([slug, d]) => {
    const meta = CS_META[slug] ?? {};
    const serp = SUPPLEMENT_PRIMARY_KW[slug];
    const primaryKeywords = serp
      ? [...new Set([serp, ...(meta.primaryKeywords ?? [])])]
      : meta.primaryKeywords;
    return [
      slug,
      {
        ...d,
        problem: d.long.charAt(0).toUpperCase() + d.long.slice(1),
        ...meta,
        ...(primaryKeywords ? { primaryKeywords } : {}),
      },
    ];
  }),
);

export function getCategoryDescriptorCS(slug: string): CategoryDescriptor | null {
  return DESCRIPTORS[slug] ?? DESCRIPTORS.other;
}

export function getCategoryDescriptor(slug: string): CategoryDescriptor | null {
  return getCategoryDescriptorCS(slug);
}