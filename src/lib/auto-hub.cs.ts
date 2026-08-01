/**
 * Rich SEO+UX hub for `/auto` (appliance shelf; auto-electronics → auto).
 * Generated from scripts/auto-hub-seo-prompt.cs.md — competitor SERP patterns,
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
    "Na autodoplňky a autoelektroniku se vztahuje záruka výrobce; v balení najdete návod a záruční doklady, pokud je dodavatel přikládá. Pokud produkt dorazí poškozený, nesedí k vozu nebo neodpovídá popisu, kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
};

const HUB_TABLES: HubTable[] = [
  {
    caption: "Typy autodoplňků — rychlé srovnání podle účelu",
    headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Péče a ochrana (autokosmetika, lak)",
        "Lesk, ochrana laku, drobné škrábance, sezónní údržba",
        "Návod k použití, typ povrchu (lak / sklo / plast), obsah balení",
      ],
      [
        "Komfort interiéru",
        "Pořádek, držák mobilu, clony, praktické drobnosti na cestu",
        "Způsob uchycení, rozměry, zda nebrání airbagům a výhledu",
      ],
      [
        "Autoelektronika",
        "Parkování, tlak v pneu, nabíjení, kompresor, senzory",
        "Napájení 12 V / USB, odběr proudu, kompatibilita a montáž",
      ],
      [
        "Cesty a povinná výbava",
        "Dovolená, zima, nouzové situace, základní výbava vozu",
        "Platné předpisy v ČR, velikost balení, snadné uložení v kufru",
      ],
    ],
  },
  {
    caption: "Napájení — 12 V, USB, akku nebo bez napájení",
    headers: ["Napájení", "Výhody", "Tip před nákupem"],
    rows: [
      [
        "12 V (zapalovač)",
        "Stabilní výkon u běžících vozů, typické pro kompresory a nabíječky",
        "Ověřte délku kabelu a zda port zůstává pod napětím po vypnutí motoru",
      ],
      [
        "USB (A / C)",
        "Snadné připojení k autorádiu nebo adapteru, nižší odběr",
        "Sledujte výkon portu (W) — slabý výstup = pomalé nabíjení",
      ],
      [
        "Akumulátor / powerbanka",
        "Použití i mimo zapalovač, nouzové startování u některých sad",
        "Kapacita, bezpečnostní pojistky, doba nabíjení dle návodu",
      ],
      [
        "Bez napájení",
        "Clony, organizéry, kosmetika, mechanické doplňky — žádný odběr",
        "Rozměry, materiál a způsob uchycení — nic nesmí bránit výhledu",
      ],
    ],
  },
  {
    caption: "Kompatibilita a montáž — na co myslet před objednávkou",
    headers: ["Kontrola", "Proč je důležitá", "Tip"],
    rows: [
      [
        "Rok a typ vozu",
        "Univerzální vs. modelové díly — špatný rozměr = výměna",
        "Porovnejte specifikaci na kartě produktu s TP a rozměry vozu",
      ],
      [
        "Místo montáže",
        "Palubní deska, sklo, kufr, nárazník — různé úchyty",
        "Zkontrolujte, že doplněk neblokuje airbagy, kamery ani senzory",
      ],
      [
        "Odběr proudu",
        "Dlouhé stání se zařízením v zapalovači může vybít baterii",
        "Při delším stání odpojte, nebo použijte port, který se vypne s motorem",
      ],
    ],
  },
];

const HUB_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Autodoplňky", path: `${GUIDE_PATH}/auto` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
  { label: "Vrácení a výměna", path: "/returns" },
  { label: "Kategorie: Domácí vychytávky", path: "/domaci-vychytavky" },
  { label: "Kategorie: Outdoor a kempování", path: "/outdoor-kempovani" },
];

const CATEGORY_SECTIONS: ContentSection[] = [
  {
    id: "pro-koho",
    heading: "Pro koho je katalog autodoplňků",
    body:
      "Katalog Autodoplňky je pro řidiče a spolujezdce, kteří chtějí praktické doplňky do auta — ne další zbytečnou hračku. Typicky řešíte ochranu laku, pořádek v interiéru, autoelektroniku na cesty nebo základní výbavu do kufru. Dobře zvolené autopříslušenství šetří čas na cestě a snižuje riziko nepříjemných situací — od vybité baterie po špatný výhled.",
    bullets: [
      "Každodenní dojíždění — držáky, nabíjení, clony, drobná péče o lak",
      "Rodinné a víkendové cesty — organizéry, kompresor, praktická výbava",
      "Kutilové, kteří montují sami podle návodu (Plug & Play)",
      "Kdo porovnává specifikace, záruku a cenu před objednávkou na dobírku",
    ],
  },
  {
    id: "jak-vybrat",
    heading: "Jak vybrat autodoplňky",
    body:
      "Nejdřív si ujasněte účel: péče o lak, komfort interiéru, autoelektronika, nebo výbava na cesty. Pak ověřte kompatibilitu s vozem a typ napájení. Doplňky do auta dávají smysl jen tehdy, když sedí rozměry, úchyt a odběr proudu. Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.",
    bullets: [
      "Účel: péče / komfort / elektronika / cesty a výbava",
      "Kompatibilita: rok, model, místo montáže, rozměry",
      "Napájení: 12 V zapalovač, USB, akku, nebo bez napájení",
      "Montáž: samostatně vs. servis; obsah balení a návod",
      "Záruka výrobce a možnost výměny do 7 dnů",
    ],
  },
  {
    id: "typy-ucelu",
    heading: "Typy autodoplňků podle účelu",
    body:
      "Autodoplňky pokrývají péči a ochranu (autokosmetika, ochrana laku), komfort interiéru (držák mobilu do auta, clony, organizéry), autoelektroniku (parkovací senzory, kompresor do auta, nabíjení) i povinnou výbavu a cestovní praktické drobnosti. Stručný přehled podle toho, co v autě řešíte nejčastěji:",
    bullets: [
      "Péče a ochrana — autokosmetika, ochrana laku, údržba povrchů",
      "Komfort — držáky, clony, pořádek v kabině",
      "Autoelektronika — senzory, kompresory, nabíjení 12 V / USB",
      "Cesty a výbava — povinná výbava, nouzové a sezónní doplňky",
    ],
  },
  {
    id: "napajeni",
    heading: "Napájení: 12 V, USB, akku nebo bez proudu?",
    body:
      "Volba napájení ovlivní, zda doplněk funguje jen za jízdy, nebo i při stání. 12 V zapalovač zvládne kompresory a silnější nabíječky. USB je praktické pro telefony a drobnou elektroniku. Akku / powerbanka pomůže mimo zapalovač. Mechanické doplňky a kosmetika napájení nepotřebují — u nich rozhodují rozměry a bezpečné uchycení.",
    bullets: [
      "12 V — výkonnější zařízení, hlídejte odběr při stání",
      "USB — nízký odběr, ověřte výkon portu",
      "Akku — mobilita a nouzové situace",
      "Bez napájení — clony, organizéry, péče o lak",
    ],
  },
  {
    id: "bezpecnost",
    heading: "Bezpečnost: montáž, provoz a baterie",
    body:
      "Před montáží si přečtěte návod. Doplněk nesmí omezovat výhled, airbagy, kamery ani parkovací senzory. Kabely veďte tak, aby nepřekážely pedálům a řazení. Zařízení v zapalovači při delším stání odpojte, pokud port zůstává pod napětím — zbytečný odběr může vybít autobaterii. Elektroniku chraňte před vlhkostí podle pokynů výrobce. Na autodoplňky se vztahuje záruka výrobce; při poškození nebo nespokojenosti využijte výměnu do 7 dnů.",
  },
];

const CATEGORY_FAQ: FaqItem[] = [
  {
    q: "Jak vybrat správné autodoplňky pro mé auto?",
    a: "Začněte účelem (péče, komfort, elektronika, cesty), pak zkontrolujte kompatibilitu: rok vozu, místo montáže, rozměry a napájení 12 V nebo USB. Specifikace najdete na kartě produktu.",
  },
  {
    q: "Jak ověřím kompatibilitu s vozem?",
    a: "Porovnejte rok výroby, typ úchytu a rozměry v popisu s vaším vozem. U elektroniky sledujte napájení a odběr. Pokud doplněk nesedí, řešíme výměnu do 7 dnů.",
  },
  {
    q: "Zvládnu instalaci sám?",
    a: "Většina praktických doplňků a Plug & Play elektroniky se montuje podle návodu v balení. U zásahu do kabeláže nebo karoserie zvažte odborný servis.",
  },
  {
    q: "Vybíjí doplněk autobaterii?",
    a: "Při jízdě obvykle ne. Problém nastává, když zařízení zůstane v zapalovači pod napětím při dlouhém stání. Odpojte ho, nebo použijte port, který se vypne s motorem.",
  },
  {
    q: "Je na autoelektroniku záruka?",
    a: "Ano — vztahuje se záruka výrobce. Uschovejte balení a doklady; při závadě řešíme výměnu podle podmínek.",
  },
  {
    q: "Jak poznám spolehlivého dodavatele?",
    a: "Spolupracujeme s oficiálními dodavateli; u elektroniky a péče o auto očekávejte návod a záruční informace v balení. Při pochybnostech nás kontaktujte před objednávkou.",
  },
  {
    q: "Co když autodoplněk nesedí nebo je poškozený?",
    a: "Kontaktujte nás do 7 dnů od doručení. Zajistíme výměnu nebo vrácení peněz — podrobnosti najdete v sekci vrácení.",
  },
  {
    q: "Liší se autodoplňky od autoelektroniky?",
    a: "Autoelektronika je součást širší kategorie autodoplňků — senzory, kompresory, nabíjení. Mechanické a pečující doplňky (clony, kosmetika) patří do stejného katalogu, ale bez napájení.",
  },
];

export const autoHub: CategoryContent = {
  slug: "autodoplnky",
  nameHi: "Autodoplňky",
  taglineHi: "Autodoplňky — péče, komfort i autoelektronika s dobírkou",
  shortDescHi:
    "Doplňky do auta a autopříslušenství: ochrana laku, komfort interiéru, autoelektronika i výbava na cesty — s doručením po České republice.",
  subtitleHi: (b) => `${b} — autodoplněk pro použití ve vozidle`,
  productIntro: (b) =>
    `${b} — produkt z kategorie Autodoplňky (péče, komfort, autoelektronika nebo výbava na cesty). Napájení, rozměry a obsah balení jsou uvedeny ve specifikaci; v balení najdete návod a záruční informace výrobce.`,
  productSections: (brand) => [
    {
      heading: `Jak ${brand} zapadá do auta`,
      body: `${brand} patří mezi autodoplňky — podle typu pomáhá s péčí o vůz, komfortem v kabině, elektronikou nebo výbavou na cesty. Před objednávkou zkontrolujte kompatibilitu, napájení (12 V / USB) a způsob montáže.`,
    },
    {
      heading: "Použití a údržba",
      body: "Dodržujte návod výrobce. Elektroniku chraňte před vlhkostí; kabely veďte mimo pedály a výhled. Kosmetiku a pečující přípravky aplikujte na čistý povrch podle pokynů na obalu.",
    },
    {
      heading: "Bezpečnost: provoz ve vozidle",
      body: "Doplněk nesmí omezovat výhled, airbagy ani senzory. Při delším stání odpojte zařízení ze zapalovače, pokud port zůstává pod napětím. Děti nenechávejte s elektronikou bez dozoru.",
    },
    DELIVERY_PRODUCT,
    QUALITY_PRODUCT,
  ],
  productFaq: (brand) => [
    {
      q: `Jaká je záruka na ${brand}?`,
      a: "Záruka výrobce na autodoplňky. Pokyny a záruční doklady jsou součástí balení, pokud je dodavatel přikládá.",
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
    "Hledáte autodoplňky s doručením po České republice? V kategorii Autodoplňky najdete doplňky do auta a autopříslušenství: péči o lak, komfort interiéru, autoelektroniku i praktickou výbavu na cesty. Porovnejte účel, kompatibilitu s vozem a napájení (12 V / USB) na kartě produktu. Objednejte s platbou na dobírku; kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySectionsHi: CATEGORY_SECTIONS,
  categoryFaqHi: CATEGORY_FAQ,
  keywordsHi: [
    "autodoplňky",
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
  hubTables: HUB_TABLES,
  hubLinks: HUB_LINKS,
  serpLedHub: true,
};
