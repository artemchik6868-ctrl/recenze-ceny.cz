/**
 * Rich SEO+UX hub for `/household` (appliance shelf).
 * Generated from scripts/household-hub-seo-prompt.cs.md — competitor SERP patterns,
 * not niche templates or other site hubs. Broad assortment (expanding shelf).
 */

import type { CategoryContent, ContentSection, FaqItem, HubLink, HubTable } from "./content.cs";
import { GUIDE_PATH } from "./site";

const DELIVERY_PRODUCT: ContentSection = {
  heading: "Objednávka, doprava a platba",
  body:
    "Po odeslání objednávky vás kontaktuje operátor pro potvrzení adresy a termínu. Doručujeme expresním kurýrem po celé České republice obvykle do 2–5 pracovních dnů; platíte při převzetí balíčku — bez zálohy a skrytých poplatků.",
};

const QUALITY_PRODUCT: ContentSection = {
  heading: "Záruka, vrácení a výměna",
  body:
    "Na domácí potřeby a drobné pomocníky se vztahuje záruka výrobce; v balení najdete návod a záruční doklady, pokud je dodavatel přikládá. Pokud produkt dorazí poškozený, nesedí nebo neodpovídá popisu, kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
};

const HUB_TABLES: HubTable[] = [
  {
    caption: "Domácí potřeby podle zóny — rychlé srovnání",
    headers: ["Zóna / typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Úklidové potřeby",
        "Pravidelný úklid kuchyně, koupelny a podlah",
        "Materiál hadříků a mopů, sada vs. jednotlivé kusy, snadné čištění a výměna",
      ],
      [
        "Organizéry a úložné boxy",
        "Chaos ve skříních, zásuvkách, spíži nebo předsíni",
        "Rozměry police, průhlednost, víko / stohovatelnost, nosnost",
      ],
      [
        "Potřeby do kuchyně",
        "Skladování potravin, příprava a drobný provoz u dřezu",
        "Potravinářský materiál, těsnění, snadné mytí, velikost porcí",
      ],
      [
        "Drobní domácí pomocníci",
        "Malý byt, chata, cestování nebo doplněk k velkému spotřebiči",
        "Kapacita / výkon, napájení, hlučnost, obsah balení, realistická očekávání",
      ],
    ],
  },
  {
    caption: "Materiál a kvalita — kam investovat",
    headers: ["Prvek", "Kdy investovat víc", "Tip"],
    rows: [
      [
        "Úložné boxy a organizéry",
        "Denní otevírání, stohování, děti v domácnosti",
        "Pevné hrany, stabilní víko a rozměry přesně podle police",
      ],
      [
        "Úklidové textilie a mopovací sady",
        "Častý úklid tvrdých podlah a kuchyně",
        "Vyměnitelné hlavy, mycí odolnost, délka násady podle výšky",
      ],
      [
        "Dózy a kuchyně",
        "Opakované skladování potravin",
        "Těsnění, vhodnost do myčky / mrazáku podle popisu, bezpečný materiál",
      ],
      [
        "Kompaktní pomocníci (např. mini praní)",
        "Občasné použití v malém prostoru",
        "Není plná náhrada velké pračky — sledujte kapacitu, vypouštění a návod",
      ],
    ],
  },
  {
    caption: "Problém doma → typ domácích potřeb",
    headers: ["Problém", "Typ potřeby", "Praktický tip"],
    rows: [
      [
        "Špinavé podlahy a dřez",
        "Úklidové potřeby",
        "Začněte sadou, kterou opravdu použijete 2–3× týdně — ne největší výbavou",
      ],
      [
        "Plné zásuvky a skříně",
        "Organizéry do domácnosti / úložné boxy",
        "Nejdřív změřte polici, pak kupujte box — ne naopak",
      ],
      [
        "Zmatek u potravin",
        "Potřeby do kuchyně",
        "Jednotná velikost dóz šetří místo lépe než náhodná směs",
      ],
      [
        "Málo místa na velký spotřebič",
        "Drobní domácí pomocníci",
        "Porovnejte rozměry ve složeném stavu a reálnou kapacitu v popisu",
      ],
    ],
  },
];

const HUB_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Domácí potřeby", path: `${GUIDE_PATH}/household` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
  { label: "Vrácení a výměna", path: "/returns" },
  { label: "Kategorie: Domácí vychytávky", path: "/domaci-vychytavky" },
  { label: "Kategorie: Domácí textil", path: "/domaci-textil" },
];

const CATEGORY_SECTIONS: ContentSection[] = [
  {
    id: "pro-koho",
    heading: "Pro koho jsou domácí potřeby v tomto katalogu",
    body:
      "Katalog Domácí potřeby je pro dospělé, kteří chtějí méně chaosu a méně zbytečné práce doma — ne další „zázrak z reklamy“. Typický zákazník řeší úklid, pořádek ve skříních, skladování v kuchyni nebo drobného pomocníka do malého bytu, na chatu či koleje. Domácí potřeby dávají smysl tam, kde praktická pomůcka šetří čas, místo nebo nervy, aniž byste přestavovali celý interiér.",
    bullets: [
      "Byty a domácnosti, kde chybí základní úklidové a úložné řešení",
      "Lidé, kteří chtějí organizéry do domácnosti podle rozměrů police",
      "Malé domácnosti a chaty hledající drobné domácí pomocníky",
      "Kdo porovnává materiál, obsah balení a záruku před objednávkou na dobírku",
    ],
  },
  {
    id: "jak-vybrat",
    heading: "Jak vybrat domácí potřeby",
    body:
      "Nejdřív si ujasněte problém: špinavé podlahy, plné zásuvky, zmatek u potravin, nebo chybějící kompaktní pomocník? Pak zvolte zónu a zkontrolujte rozměry. Potřeby pro domácnost mají smysl jen tehdy, když sedí do vašeho prostoru a frekvence použití — ne když jen vypadají dobře na fotce. Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.",
    bullets: [
      "Cíl: úklid, organizace, kuchyně, nebo drobný pomocník",
      "Rozměry místa (police, skříň, koupelna, kuchyňská linka)",
      "Materiál, mytí a odolnost při každodenním použití",
      "Obsah balení, český návod a záruka výrobce",
      "Realistická očekávání u kompaktních zařízení vs. velké spotřebiče",
    ],
  },
  {
    id: "typy-zony",
    heading: "Typy domácích potřeb podle zóny",
    body:
      "Úklidové potřeby pokrývají hadříky, mopovací sady a drobné pomůcky na každodenní čistotu. Organizéry do domácnosti a úložné boxy řeší chaos ve skříních, zásuvkách a spíži. Potřeby do kuchyně pomáhají se skladováním a přípravou. Drobní domácí pomocníci — včetně kompaktních řešení na menší dávky prádla — se hodí do malých prostor, na chatu nebo jako doplněk, ne jako vždy plná náhrada velkého spotřebiče. Vyberte typ podle místnosti a frekvence použití — tabulky níže shrnují orientaci.",
    bullets: [
      "Úklid — mop, hadříky, sady na podlahu a dřez",
      "Organizace — úložné boxy, organizéry do zásuvek a skříní",
      "Kuchyně — dózy, sítka, drobné pomůcky u linky",
      "Drobní pomocníci — kompaktní zařízení do malého bytu nebo na cesty",
    ],
  },
  {
    id: "material-zivotnost",
    heading: "Materiál a životnost: na co se dívat",
    body:
      "U praktických pomůcek do domácnosti rozhoduje materiál a frekvence použití víc než marketingový slogan. U organizérů sledujte pevnost stěn a víka; u úklidu výměnu hlav a odolnost při mytí; u kuchyně těsnění a vhodnost pro potraviny. U drobných pomocníků čtěte kapacitu, napájení a omezení v návodu. Investujte víc do věcí, které používáte denně — u občasných doplňků stačí střední třída.",
    bullets: [
      "Denní použití → pevnější materiál a vyměnitelné díly",
      "Úložné boxy → změřte polici před nákupem",
      "Kuchyně → potravinářský materiál a těsnění",
      "Kompaktní pomocníci → kapacita a návod > „zázračný“ popis",
    ],
  },
  {
    id: "bezpecnost",
    heading: "Bezpečnost: použití, materiály a záruka",
    body:
      "Před prvním použitím si přečtěte návod a zkontrolujte materiál i napájení. Chemii a úklidové prostředky (pokud jsou v balení) používejte jen podle pokynů; chraňte oči a pokožku. Elektronické drobné pomocníky chraňte před vlhkostí, pokud výrobce neuvádí vyšší krytí; nepřetěžujte prodlužovačky. Malé díly a kabely držte mimo dosah malých dětí. Na domácí potřeby a drobnou elektroniku se vztahuje záruka výrobce; při poškození nebo nespokojenosti využijte výměnu do 7 dnů.",
  },
];

const CATEGORY_FAQ: FaqItem[] = [
  {
    q: "Jaký typ domácích potřeb mám vybrat jako první?",
    a: "Začněte problémem, který řešíte nejčastěji: úklid podlah, chaos ve skříních, skladování v kuchyni, nebo chybějící kompaktní pomocník. Až potom porovnejte rozměry, materiál a cenu.",
  },
  {
    q: "Čím se liší úklidové potřeby a organizéry do domácnosti?",
    a: "Úklidové potřeby slouží k čištění povrchů a podlah. Organizéry a úložné boxy řeší pořádek a přístup k věcem. Často potřebujete obojí — nejdřív uklidit, pak uložit.",
  },
  {
    q: "Na co si dát pozor u úložných boxů?",
    a: "Hlavně na vnitřní rozměry police, stohovatelnost, víko a nosnost. Průhledný box šetří čas při hledání; pevné hrany vydrží denní otevírání lépe než tenký plast.",
  },
  {
    q: "Stačí drobný domácí pomocník místo velkého spotřebiče?",
    a: "Kompaktní pomocníci (např. na menší dávky prádla) dávají smysl v malém bytě, na chatě nebo jako doplněk. Plnohodnotný velký spotřebič nenahradí ve všech situacích — sledujte kapacitu a omezení v popisu.",
  },
  {
    q: "Jak poznám kvalitní potřeby pro domácnost?",
    a: "Podle materiálu, obsahu balení, jasného návodu a záruky. U věcí na denní použití se vyplatí pevnější konstrukce; u občasných doplňků stačí střední třída.",
  },
  {
    q: "Je na domácí potřeby záruka?",
    a: "Ano — na produkty v katalogu se vztahuje záruka výrobce. Uschovejte balení a doklady; v případě závady řešíme výměnu podle podmínek.",
  },
  {
    q: "Co když produkt nesedí nebo nefunguje jak čekám?",
    a: "Kontaktujte nás do 7 dnů od doručení. Zajistíme výměnu nebo vrácení peněz bez zbytečných poplatků — podrobnosti najdete v sekci vrácení.",
  },
  {
    q: "Kde najdu elektronické vychytávky (Bluetooth, USB, LED)?",
    a: "Kompaktní elektroniku a zařízení na úsporu energie najdete v kategorii Domácí vychytávky. Tato kategorie Domácí potřeby se soustředí na úklid, organizaci, kuchyni a drobné domácí pomocníky.",
  },
];

export const householdHub: CategoryContent = {
  slug: "domaci-potreby",
  nameHi: "Domácí potřeby",
  taglineHi:
    "Domácí potřeby — úklid, organizace a drobní pomocníci s dobírkou",
  shortDescHi:
    "Úklidové potřeby, organizéry a úložné boxy, praktické pomůcky do kuchyně i drobní domácí pomocníci — s doručením po České republice.",
  subtitleHi: (b) => `${b} — domácí potřeba pro každodenní použití`,
  productIntro: (b) =>
    `${b} — produkt z kategorie Domácí potřeby (úklid, organizace, kuchyně nebo drobný domácí pomocník). Materiály, rozměry a obsah balení jsou uvedeny ve specifikaci; v balení najdete návod a záruční informace výrobce.`,
  productSections: (brand) => [
    {
      heading: `Jak ${brand} zapadá do domácnosti`,
      body: `${brand} patří mezi domácí potřeby — podle typu pomáhá s úklidem, pořádkem, kuchyní nebo drobným domácím úkolem. Před objednávkou zkontrolujte rozměry, materiál a obsah balení.`,
    },
    {
      heading: "Použití a péče",
      body: "Dodržujte návod výrobce. Textilní a mopovací součásti čistěte podle štítku; plastové boxy a dózy myjte doporučeným způsobem. Elektroniku chraňte před vlhkostí, pokud není uvedeno vyšší krytí.",
    },
    {
      heading: "Bezpečnost: použití a provoz",
      body: "Chemii a ostré pomůcky používejte podle návodu. Elektronické pomocníky nepřetěžujte a chraňte před vodou mimo určené podmínky. Malé díly držte mimo dosah dětí.",
    },
    DELIVERY_PRODUCT,
    QUALITY_PRODUCT,
  ],
  productFaq: (brand) => [
    {
      q: `Jaká je záruka na ${brand}?`,
      a: "Záruka výrobce na domácí potřeby a drobné pomocníky. Pokyny a záruční doklady jsou součástí balení, pokud je dodavatel přikládá.",
    },
    {
      q: "Jak zaplatím a obdržím objednávku?",
      a: "Expresním kurýrem do České republiky obvykle do 2–5 pracovních dnů. Platba na dobírku — bez zálohy.",
    },
    {
      q: "Co když se mi produkt nelíbí?",
      a: "Kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
    },
  ],
  categoryIntroHi:
    "Hledáte domácí potřeby s doručením po České republice? V kategorii Domácí potřeby najdete praktické řešení pro úklid, pořádek i každodenní provoz: úklidové potřeby, organizéry do domácnosti a úložné boxy, potřeby do kuchyně i drobné domácí pomocníky. Porovnejte zónu použití, materiál a specifikace na kartě produktu. Objednejte s platbou na dobírku; kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySectionsHi: CATEGORY_SECTIONS,
  categoryFaqHi: CATEGORY_FAQ,
  keywordsHi: [
    "domácí potřeby",
    "potřeby pro domácnost",
    "úklidové potřeby",
    "praktické pomůcky do domácnosti",
    "organizéry do domácnosti",
    "úložné boxy",
    "potřeby do kuchyně",
    "drobní domácí pomocníci",
    "platba na dobírku",
  ],
  hubTables: HUB_TABLES,
  hubLinks: HUB_LINKS,
  serpLedHub: true,
};
