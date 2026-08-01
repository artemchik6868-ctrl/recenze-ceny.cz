/**
 * Rich SEO+UX hub for `/garden-tools` (appliance shelf).
 * Generated from scripts/garden-tools-hub-seo-prompt.cs.md — competitor SERP patterns,
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
    "Na zahradní nářadí se vztahuje záruka výrobce; v balení najdete návod a záruční doklady, pokud je dodavatel přikládá. Pokud produkt dorazí poškozený, nesedí nebo neodpovídá popisu, kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
};

const HUB_TABLES: HubTable[] = [
  {
    caption: "Typ práce a nářadí — rychlé srovnání",
    headers: ["Typ práce", "Co zvolit", "Na co se dívat"],
    rows: [
      [
        "Rytí, sázení, přesun zeminy",
        "Rýč, lopata, vidle, drobná sázecí lopatka",
        "Kovaná nebo odolná hlava, délka násady podle výšky, pevné spojení čepele",
      ],
      [
        "Pletí a kypření záhonů",
        "Motyka / motyčka, ruční kultivátor, hrabičky",
        "Tvar čepele, hmotnost při delší práci, pohodlný úchop",
      ],
      [
        "Listí, trávník, úklid plochy",
        "Hrábě, hrábě na listí, strunová sekačka, případně fukar",
        "Šířka záběru, hmotnost, napájení (ruční vs aku)",
      ],
      [
        "Střih keřů a živých plotů",
        "Zahradní nůžky, nůžky na větve, plotostřih",
        "Max. průměr větve, ostrost, délka lišty u plotostřihu",
      ],
      [
        "Řez dřeva a silnějších větví",
        "Zahradní pilka, mini pila, silnější nůžky na větve",
        "Bezpečnostní pojistky, ostří / lišta, návod a ochranné pomůcky",
      ],
    ],
  },
  {
    caption: "Napájení — ruční, aku, elektro, benzín",
    headers: ["Napájení", "Výhody", "Tip před nákupem"],
    rows: [
      [
        "Ruční",
        "Kontrola, ticho, nízká údržba, nižší pořizovací cena",
        "Ideální základ pro záhony a menší plochy — investujte do kvality hlavy a násady",
      ],
      [
        "Akumulátor (aku)",
        "Volný pohyb bez kabelu, nižší hluk než benzín",
        "Kapacita Ah, výdrž vs. velikost pozemku, kompatibilita nabíječky v balení",
      ],
      [
        "Elektrické (síť)",
        "Stabilní výkon bez výměny baterie",
        "Dosah kabelu a bezpečné vedení po zahradě; vhodné u domu se zásuvkou",
      ],
      [
        "Benzínové",
        "Výkon na velké plochy a náročný porost",
        "Hluk, údržba, skladování paliva — dává smysl spíš u větších pozemků",
      ],
    ],
  },
  {
    caption: "Materiál a kvalita — kam investovat",
    headers: ["Prvek", "Kdy investovat víc", "Tip"],
    rows: [
      [
        "Rýč, lopata, motyka",
        "Intenzivní každodenní práce na záhonech",
        "Preferujte pevnou hlavu (ne tenký lisovaný plech) a stabilní násadu",
      ],
      [
        "Nůžky a střihací nářadí",
        "Pravidelný řez keřů a stromů",
        "Ostrost, převod / páka u silnějších větví, snadné čištění",
      ],
      [
        "Aku technika",
        "Střední a větší zahrady, časté sečení okrajů",
        "Porovnejte výdrž baterie a hmotnost — ne jen marketingový výkon",
      ],
      [
        "Doplňky (konev, plastové pomůcky)",
        "Občasné použití",
        "Stačí střední třída; prioritu dejte nářadí, které držíte hodiny",
      ],
    ],
  },
];

const HUB_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Zahradní nářadí", path: `${GUIDE_PATH}/garden-tools` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
  { label: "Vrácení a výměna", path: "/returns" },
  { label: "Kategorie: Zahrada a zemědělství", path: "/zahrada" },
  { label: "Kategorie: Outdoor a kempování", path: "/outdoor-kempovani" },
];

const CATEGORY_SECTIONS: ContentSection[] = [
  {
    id: "pro-koho",
    heading: "Pro koho je katalog zahradního nářadí",
    body:
      "Katalog Zahradní nářadí je pro majitele zahrad, chat a záhonů — od ručního základu po aku techniku na okraje a střih. Typicky řešíte rytí a sázení, pletí, listí, živý plot nebo sečení okrajů trávníku. Dobře zvolené nářadí šetří čas a záda při práci, kterou na pozemku opravdu děláte.",
    bullets: [
      "Začátečníci, kteří skládají první základní sadu",
      "Majitelé středních zahrad s trávníkem, keři a záhony",
      "Kutilové, kteří střídají ruční práci a aku pomocníky",
      "Kdo porovnává specifikace, záruku a cenu před objednávkou na dobírku",
    ],
  },
  {
    id: "jak-vybrat",
    heading: "Jak vybrat zahradní nářadí",
    body:
      "Nejdřív si ujasněte, co na zahradě děláte nejčastěji: rytí a sázení, pletí, úklid listí, střih keřů, nebo okraje trávníku. Pak zvolte typ nářadí a napájení. Ruční zahradní nářadí stačí na menší plochy a přesnou práci; aku zahradní nářadí a zahradní technika šetří čas na středních pozemcích. Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.",
    bullets: [
      "Typ práce: půda, střih, trávník/okraje, úklid",
      "Velikost pozemku a frekvence použití",
      "Napájení: ruční, aku, elektro, benzín",
      "Ergonomie: délka násady, hmotnost, úchop",
      "Obsah balení, návod a záruka výrobce",
    ],
  },
  {
    id: "typy-prace",
    heading: "Typy zahradního nářadí podle práce",
    body:
      "Ruční zahradní nářadí pokrývá rytí, sázení a záhony: rýč, lopata, hrábě, motyka, vidle a drobné ruční pomůcky. Pro střih keřů a plotů slouží zahradní nůžky, nůžky na větve, plotostřih a zahradní pilka. Péči o trávník a okraje řeší strunová sekačka, hrábě na listí a případně fukar. Stručný přehled podle úkolu:",
    bullets: [
      "Půda a záhony — rýč, lopata, motyka, kultivátor",
      "Střih a řezání — nůžky, plotostřih, pilka / mini pila",
      "Trávník a okraje — strunová sekačka, hrábě, fukar",
      "Úklid a přesun — hrábě na listí, kolečko (pokud je v nabídce)",
    ],
  },
  {
    id: "zakladni-sada",
    heading: "Základní sada zahradního nářadí podle velikosti zahrady",
    body:
      "Základní sada zahradního nářadí obvykle stačí na většinu sezónních prací: kvalitní rýč, lopata, hrábě, motyčka a spolehlivé zahradní nůžky. Na malé městské zahrádce často vystačíte s ručním základem. U střední zahrady (řádově stovky m²) přidejte střihací nářadí a aku pomocníka na okraje. U většího pozemku zvažte výkonnější zahradní techniku — ale pořád podle úkolů, které opravdu děláte.",
    bullets: [
      "Malá zahrádka / terasa: drobné ruční nářadí + nůžky + konev",
      "Střední zahrada: základní sada + plotostřih nebo nůžky na větve + strunová sekačka",
      "Větší pozemek: doplňte výkonnější aku / elektro / benzín podle plochy",
      "Doplňujte podle sezónních prací, které skutečně děláte",
    ],
  },
  {
    id: "napajeni",
    heading: "Ruční, aku, elektro nebo benzín?",
    body:
      "Volba napájení ovlivní hluk, dosah a údržbu. Ruční nářadí je tiché a přesné. Aku zahradní nářadí nabízí volný pohyb bez kabelu — ideální na okraje a střední plochy, pokud vás netráží výdrž baterie. Elektrické nářadí drží výkon u domu se zásuvkou. Benzínová zahradní technika zůstává volbou pro velké plochy a náročný porost, ale počítejte s hlukem a údržbou.",
    bullets: [
      "Ruční — základ záhonů a přesné práce",
      "Aku — mobilita, nižší hluk, hlídejte kapacitu baterie",
      "Elektro — stabilní výkon, pozor na kabel",
      "Benzín — velké plochy, vyšší nároky na provoz",
    ],
  },
  {
    id: "bezpecnost",
    heading: "Bezpečnost: řezání, napájení a ochranné pomůcky",
    body:
      "Před prvním použitím si přečtěte návod. U nůžek, plotostřihu, pilky a strunové sekačky používejte ochranné brýle a pevnou obuv; udržujte bezpečnou vzdálenost od ostatních osob. Aku a elektrické nářadí chraňte před vlhkostí podle pokynů výrobce; neřežte nad hlavou bez jistoty opory. Ostří udržujte čisté a suché; uvolněnou násadu nepoužívejte. Na zahradní nářadí se vztahuje záruka výrobce; při poškození nebo nespokojenosti využijte výměnu do 7 dnů.",
  },
];

const CATEGORY_FAQ: FaqItem[] = [
  {
    q: "Co patří do základní sady zahradního nářadí?",
    a: "Pro většinu zahrad začněte rýčem, lopatou, hráběmi, motyčkou a kvalitními zahradními nůžkami. Podle pozemku pak doplňte nůžky na větve, plotostřih nebo strunovou sekačku.",
  },
  {
    q: "Vyplatí se dražší ruční zahradní nářadí?",
    a: "U nástrojů, které držíte často (rýč, lopata, motyka, nůžky), se kvalita hlavy a násady projeví výdrží a pohodlím. U občasných plastových doplňků stačí střední třída.",
  },
  {
    q: "Kdy zvolit aku místo elektrického nářadí?",
    a: "Aku dává smysl, když potřebujete volný pohyb bez kabelu — okraje trávníku, živé ploty dál od zásuvky, menší až střední plochy. Elektro je praktické u stálého místa se spolehlivou zásuvkou a delší nepřetržitou prací.",
  },
  {
    q: "Jak vybrat nůžky a plotostřih?",
    a: "Podle průměru větví a délky plotu. Ruční zahradní nůžky na přesný řez, nůžky na větve na silnější výhony, plotostřih na delší živé ploty. Sledujte ostrost, hmotnost a max. průměr řezu v popisu.",
  },
  {
    q: "Stačí strunová sekačka místo velké sekačky?",
    a: "Strunová sekačka skvěle doplňuje okraje, svahy a místa kolem překážek. Na celý souvislý trávník větší plochy obvykle potřebujete jinou sekačku — strunu berte jako doplněk, ne vždy jako náhradu.",
  },
  {
    q: "Jak pečovat o zahradní nářadí po sezóně?",
    a: "Očistěte hlínu, osušte kovové části, případně lehce naolejujte proti korozi. Dřevěné násady skladujte v suchu. Ostří nůžek a pil udržujte čisté; aku baterie nabíjejte podle návodu a nenechávejte je dlouhodobě vybití.",
  },
  {
    q: "Je na zahradní nářadí záruka?",
    a: "Ano — vztahuje se záruka výrobce. Uschovejte balení a doklady; při závadě řešíme výměnu podle podmínek.",
  },
  {
    q: "Co když nářadí nesedí nebo je poškozené?",
    a: "Kontaktujte nás do 7 dnů od doručení. Zajistíme výměnu nebo vrácení peněz — podrobnosti najdete v sekci vrácení.",
  },
];

export const gardenToolsHub: CategoryContent = {
  slug: "zahradni-naradi",
  nameHi: "Zahradní nářadí",
  taglineHi:
    "Zahradní nářadí — ruční základ, střih i aku technika s dobírkou",
  shortDescHi:
    "Ruční zahradní nářadí, nůžky a plotostřihy, strunové sekačky i aku pomocníci pro záhony, trávník a keře — s doručením po České republice.",
  subtitleHi: (b) => `${b} — zahradní nářadí pro práci na pozemku`,
  productIntro: (b) =>
    `${b} — produkt z kategorie Zahradní nářadí (ruční nářadí, střihací nástroje nebo zahradní technika). Materiály, napájení a obsah balení jsou uvedeny ve specifikaci; v balení najdete návod a záruční informace výrobce.`,
  productSections: (brand) => [
    {
      heading: `Jak ${brand} zapadá do zahrady`,
      body: `${brand} patří mezi zahradní nářadí — podle typu pomáhá s půdou, střihem, okraji trávníku nebo úklidem. Před objednávkou zkontrolujte napájení (ruční, aku, elektro), rozměry a obsah balení.`,
    },
    {
      heading: "Použití a péče",
      body: "Dodržujte návod výrobce. Po práci očistěte hlínu a vlhkost; ostří a aku části skladujte v suchu. Elektrické a aku nářadí chraňte před deštěm, pokud výrobce neuvádí vyšší krytí.",
    },
    {
      heading: "Bezpečnost: provoz na zahradě",
      body: "Používejte ochranné brýle a pevnou obuv u řezání a strunových sekaček. Udržujte bezpečnou vzdálenost od ostatních. Nepřetěžujte nabíječky a prodlužovačky; děti bez dozoru k běžícímu nářadí nepouštějte.",
    },
    DELIVERY_PRODUCT,
    QUALITY_PRODUCT,
  ],
  productFaq: (brand) => [
    {
      q: `Jaká je záruka na ${brand}?`,
      a: "Záruka výrobce na zahradní nářadí. Pokyny a záruční doklady jsou součástí balení, pokud je dodavatel přikládá.",
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
    "Hledáte zahradní nářadí s doručením po České republice? V kategorii Zahradní nářadí najdete ruční základ i střihací a aku techniku: rýče, lopaty, hrábě, motyky, zahradní nůžky, plotostřihy, strunové sekačky i pilky. Porovnejte typ práce, napájení a specifikace na kartě produktu. Objednejte s platbou na dobírku; kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySectionsHi: CATEGORY_SECTIONS,
  categoryFaqHi: CATEGORY_FAQ,
  keywordsHi: [
    "zahradní nářadí",
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
  ],
  hubTables: HUB_TABLES,
  hubLinks: HUB_LINKS,
  serpLedHub: true,
};
