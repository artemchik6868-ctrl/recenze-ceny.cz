/**
 * Rich SEO+UX hub for `/personal-grooming` (device shelf).
 * Generated from scripts/personal-grooming-hub-seo-prompt.cs.md — competitor SERP patterns,
 * not niche templates or other site hubs.
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
    "Na přístroje pro osobní péči se vztahuje záruka výrobce; v balení najdete návod a záruční doklady, pokud je dodavatel přikládá. Pokud produkt dorazí poškozený, nesedí nebo neodpovídá popisu, kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
};

const HUB_TABLES: HubTable[] = [
  {
    caption: "Typy přístrojů pro osobní péči — rychlé srovnání",
    headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Zastřihovač vousů / multigroom",
        "Strniště, kontury, vousy i tělo v jedné sadě",
        "Rozsah mm, počet nástavců, výdrž baterie, voděodolnost",
      ],
      [
        "Holicí strojek",
        "Každodenní hladké holení obličeje",
        "Wet&Dry, typ hlavy, citlivost pokožky, čištění",
      ],
      [
        "Epilátor (pinzeta / IPL / depilace)",
        "Delší efekt hladké pokožky na těle nebo obličeji",
        "Metoda (vytržení vs světlo vs sestřižení), Wet&Dry, nástavce",
      ],
      [
        "Kulma / styling vlasů",
        "Domácí úprava vln, kudrlin nebo tvarování",
        "Teplotní stupně, průměr, ochrana vlasů, napájení",
      ],
      [
        "Čistič uší",
        "Hygiena zvukovodu bez vatových tyčinek",
        "Měkké nástavce, návod, kdy raději k ORL",
      ],
      [
        "Úsměv / zuby (fasety, bělení)",
        "Dočasná estetika úsměvu nebo domácí bělení",
        "Kompatibilita s chrupem, realismus očekávání, péče",
      ],
    ],
  },
  {
    caption: "Parametry před nákupem — proč na nich záleží",
    headers: ["Parametr", "Proč záleží", "Tip před objednávkou"],
    rows: [
      [
        "Wet&Dry / voděodolnost",
        "Holení ve sprše a snadné opláchnutí pod vodou",
        "Ověřte v popisu, zda lze mokrý provoz i čištění vodou",
      ],
      [
        "Výdrž baterie",
        "Komfort bez kabelu a cestovní použití",
        "Porovnejte minuty provozu a dobu nabíjení, ne jen marketing",
      ],
      [
        "Nástavce a rozsah mm",
        "Jeden přístroj na vousy, tělo nebo kontury",
        "Čím více smysluplných nástavců, tím méně dalších nákupů",
      ],
      [
        "Citlivá pokožka",
        "Méně podráždění při častém holení nebo epilaci",
        "Hledejte režimy pro citlivou pokožku a dodržujte návod",
      ],
      [
        "Obsah balení + záruka",
        "Víte, co dostanete a jak řešit závadu",
        "Návod, nabíječka/nástavce a záruční podmínky v kartě produktu",
      ],
    ],
  },
];

const HUB_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Osobní péče", path: `${GUIDE_PATH}/personal-grooming` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
  { label: "Vrácení a výměna", path: "/returns" },
  { label: "Kategorie: Beauty nástroje", path: "/kosmeticke-nastroje" },
  { label: "Kategorie: Anti-aging", path: "/anti-aging" },
];

const CATEGORY_SECTIONS: ContentSection[] = [
  {
    id: "pro-koho",
    heading: "Pro koho jsou přístroje pro osobní péči",
    body:
      "Katalog Osobní péče je pro dospělé, kteří chtějí doma řešit holení, zastřihování, epilaci, styling vlasů, hygienu uší nebo dočasnou estetiku úsměvu — bez další návštěvy salonu při každé drobnosti. Přístroje pro osobní péči dávají smysl, když víte, jaký výsledek potřebujete (hladká tvář, kontury vousů, delší efekt epilace, čistší pocit v uších, dočasný úsměv) a jste ochotni porovnat parametry, ne jen fotku.",
    bullets: [
      "Muži a ženy, kteří pravidelně upravují vousy, tělo nebo obličej",
      "Kdo hledá epilátor místo častého holení žiletkou",
      "Domácí styling vlasů (kulma) bez salonní rezervace",
      "Hygiena uší bez vatových tyčinek — se zdravým rozumem",
      "Dočasné řešení úsměvu nebo domácí bělení zubů s realistickými očekáváními",
    ],
  },
  {
    id: "jak-vybrat",
    heading: "Jak vybrat přístroje pro osobní péči",
    body:
      "Nejdřív si ujasněte cíl: hladké holení, úprava vousů, delší epilace, styling, péče o uši, nebo estetika zubů? Teprve pak volte typ přístroje. U holení a zastřihování rozhoduje Wet&Dry, výdrž baterie a nástavce. U epilace nejdřív metoda (pinzeta / IPL / depilace sestřižením). U uší a úsměvu čtěte návod a limity — nejde o náhradu odborné péče. Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.",
    bullets: [
      "Účel: vousy, tělo, obličej, vlasy, uši, nebo zuby",
      "Citlivost pokožky a frekvence používání",
      "Wet&Dry / voděodolnost a snadné čištění",
      "Baterie: minuty provozu vs. doba nabíjení",
      "Nástavce, rozsah mm a obsah balení",
      "Záruka výrobce a český návod",
    ],
  },
  {
    id: "typy",
    heading: "Typy přístrojů v katalogu osobní péče",
    body:
      "V polici najdete několik rodin zařízení. Zastřihovač vousů a multigroom řeší strniště, kontury i tělo. Holicí strojek cílí na každodenní hladký výsledek. Epilátor pokrývá pinzetové vytržení, IPL světlo i rychlou depilaci sestřižením — metody se liší délkou efektu i komfortem. Kulma patří ke stylingovým pomůckám na vlasy. Spirálový čistič uší je hygiena zvukovodu, ne lékařský zákrok. Zubní fasety typu snap on smile a bělení zubů slouží dočasné estetice — ne náhradě stomatologie. Tabulka níže pomůže zvolit typ podle situace.",
    bullets: [
      "Holení a zastřihování — hladkost vs. délka vousů",
      "Epilace — pinzeta, IPL nebo depilace podle očekávané výdrže",
      "Styling vlasů — teplota a průměr kulmy",
      "Péče o uši — měkké nástavce a bezpečné používání",
      "Úsměv a zuby — fasety / bělení s realistickým cílem",
    ],
  },
  {
    id: "parametry",
    heading: "Na co se dívat: baterie, Wet&Dry a nástavce",
    body:
      "Při výběru rozhodují konkrétní parametry, ne jen fotka v katalogu. Voděodolný trimmer nebo holicí strojek s Wet&Dry usnadní holení ve sprše a opláchnutí. Výdrž baterie rozhoduje u cestování a delších sezení. Počet a smysl nástavců určuje, zda jeden přístroj nahradí další. U epilátorů sledujte metodu a režimy pro citlivou pokožku. U čističů uší a fasety čtěte limity použití a údržbu. Druhá tabulka shrnuje, proč jednotlivé parametry mění spokojenost po nákupu.",
    bullets: [
      "Wet&Dry = mokré holení + snazší údržba",
      "Baterie: reálné minuty, ne jen „dlouhý chod“ v sloganu",
      "Nástavce: mm rozsah a účel (vousy / tělo / kontury)",
      "Citlivá pokožka: jemnější režimy a správná příprava",
      "Balení: nabíječka, návod, náhradní nástavce",
    ],
  },
  {
    id: "bezpecnost",
    heading: "Bezpečnost: pokožka, uši a záruka",
    body:
      "Přístroje pro osobní péči jsou určené pro domácí použití podle návodu. Nepoužívejte je na poškozenou, zanícenou nebo čerstvě ošetřenou pokožku. Spirálový čistič uší není náhradou vyšetření u ORL — při bolesti, výtoku nebo trvalém zalehnutí vyhledejte odborníka. Zubní fasety a domácí bělení nenahrazují stomatologickou péči; při bolesti, uvolnění zubu nebo nestabilitě fasety přestaňte používat a konzultujte zubaře. Elektroniku chraňte před poškozením; čistěte podle návodu. Na zařízení se vztahuje záruka výrobce; při poškození při dopravě nebo nespokojenosti využijte výměnu do 7 dnů.",
  },
];

const CATEGORY_FAQ: FaqItem[] = [
  {
    q: "Jaký přístroj pro osobní péči zvolit jako první?",
    a: "Začněte problémem, který řešíte nejčastěji: vousy a kontury (zastřihovač), hladké holení (holicí strojek), delší efekt na těle (epilátor), vlasy (kulma), hygiena uší, nebo dočasná estetika úsměvu. Až potom porovnejte baterii, nástavce a Wet&Dry.",
  },
  {
    q: "Čím se liší zastřihovač vousů a holicí strojek?",
    a: "Zastřihovač nastavuje délku a tvary (strniště, kontury, tělo). Holicí strojek cílí na maximálně hladký výsledek. Mnoho sad kombinuje obojí přes výměnné nástavce — vždy ověřte rozsah mm a typ hlavy v popisu.",
  },
  {
    q: "Epilátor, IPL, nebo depilace — co zvolit?",
    a: "Pinzetový epilátor vytrhává chloupky s kořínkem a efekt obvykle vydrží déle. IPL používá světelné pulzy pro dlouhodobější redukci růstu při opakování. Depilace sestřižením je rychlá jako holení, ale chloupky dorůstají dříve. Volte podle tolerance bolesti, času a očekávané výdrže.",
  },
  {
    q: "Je spirálový čistič uší bezpečnější než vatové tyčinky?",
    a: "Vatové tyčinky často zatlačují maz hlouběji. Spirálový čistič s měkkými nástavci je určený k šetrnému vyjímání mazu podle návodu. Nejde o léčbu zánětu ani o náhradu ORL — při bolesti nebo výtoku přístroj nepoužívejte.",
  },
  {
    q: "Jsou zubní fasety typu snap on smile trvalé řešení?",
    a: "Ne. Jde o dočasnou estetickou pomůcku, která zakryje vzhled zubů při správném nasazení. Nenahrazují korunky, rovnátka ani ošetření u stomatologa. Před nákupem si ujasněte, že očekáváte kosmetický efekt, ne lékařský zákrok.",
  },
  {
    q: "Potřebuji voděodolný trimmer s Wet&Dry?",
    a: "Pokud holíte ve sprše nebo chcete hlavici snadno opláchnout, Wet&Dry výrazně zvyšuje komfort. Pro suché cestovní použití stačí často dobrá baterie a pouzdro — voděodolnost je bonus, ne nutnost.",
  },
  {
    q: "Je na přístroje záruka?",
    a: "Ano — na elektroniku a přístroje pro osobní péči se vztahuje záruka výrobce. Uschovejte balení a doklady; při závadě řešíme výměnu podle podmínek.",
  },
  {
    q: "Co když produkt nesedí nebo nefunguje jak čekám?",
    a: "Kontaktujte nás do 7 dnů od doručení. Zajistíme výměnu nebo vrácení peněz — podrobnosti najdete v sekci vrácení.",
  },
];

export const personalGroomingHub: CategoryContent = {
  slug: "osobni-pece",
  nameHi: "Osobní péče",
  taglineHi:
    "Přístroje pro osobní péči — zastřihovače, epilátory, styling i hygiena s dobírkou",
  shortDescHi:
    "Zastřihovače vousů, holicí strojky, epilátory, kulmy, čističe uší i pomůcky pro úsměv a bělení zubů — s doručením po České republice.",
  subtitleHi: (b) => `${b} — přístroj pro osobní péči pro domácí použití`,
  productIntro: (b) =>
    `${b} — produkt z kategorie Osobní péče (přístroje a pomůcky pro hygienu a úpravu vzhledu). Materiály, napájení a obsah balení jsou uvedeny ve specifikaci; v balení najdete návod a záruční informace výrobce.`,
  productSections: (brand) => [
    {
      heading: `Jak ${brand} zapadá do osobní péče`,
      body: `${brand} patří mezi přístroje pro osobní péči — zařízení pro domácí hygienu a úpravu vzhledu. Před objednávkou zkontrolujte účel (vousy, tělo, vlasy, uši, zuby), napájení, nástavce a obsah balení.`,
    },
    {
      heading: "Použití a péče",
      body: "Dodržujte návod výrobce. Po použití očistěte hlavici nebo nástavce podle pokynů; u voděodolných modelů využijte opláchnutí, u ostatních suché čištění. Nepoužívejte na poškozenou pokožku.",
    },
    {
      heading: "Bezpečnost: provoz a limity",
      body: "Přístroj je určen pro domácí použití, není diagnostickým nástrojem ani náhradou odborné péče. U péče o uši a zuby respektujte limity v návodu. Chraňte elektroniku před pádem a nesprávným nabíjením.",
    },
    DELIVERY_PRODUCT,
    QUALITY_PRODUCT,
  ],
  productFaq: (brand) => [
    {
      q: `Jaká je záruka na ${brand}?`,
      a: "Záruka výrobce na elektroniku a přístroje pro osobní péči. Pokyny a záruční doklady jsou součástí balení, pokud je dodavatel přikládá.",
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
    "Hledáte přístroje pro osobní péči s doručením po České republice? V kategorii Osobní péče najdete zařízení pro domácí hygienu a úpravu vzhledu: zastřihovač vousů a holicí strojek, epilátor, kulmu na styling vlasů, spirálový čistič uší i pomůcky pro úsměv a bělení zubů. Nejde o kosmetický regál drogerie — jde o praktické přístroje, které porovnáte podle účelu, baterie, Wet&Dry a nástavců. Objednejte s platbou na dobírku; kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySectionsHi: CATEGORY_SECTIONS,
  categoryFaqHi: CATEGORY_FAQ,
  keywordsHi: [
    "přístroje pro osobní péči",
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
  ],
  hubTables: HUB_TABLES,
  hubLinks: HUB_LINKS,
};
