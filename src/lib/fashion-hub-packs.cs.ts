/**
 * Fashion hub packs for CZ non-supplement shelves (accessories, clothing).
 * Merged in getCategoryContent via withIntentFaq — overrides intro/sections/tables/links/faq.
 * Content oriented on fashion SERP competitors (Zalando / ABOUT YOU / Answear patterns), not pharmacy hubs.
 */

import type { ContentSection, FaqItem, HubLink, HubTable } from "./content.cs";
import { GUIDE_PATH } from "./site";

export type FashionHubPack = {
  categoryIntroHi: string;
  categorySectionsHi: ContentSection[];
  categoryFaqHi: FaqItem[];
  hubTables: HubTable[];
  hubLinks: HubLink[];
  keywordsHi: string[];
  taglineHi?: string;
  shortDescHi?: string;
};

const ACCESSORIES_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Doplňky", path: `${GUIDE_PATH}/accessories` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
];

const ACCESSORIES_TABLES: HubTable[] = [
  {
    caption: "Typy módních doplňků — rychlé srovnání",
    headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Tašky",
        "Každý den, práce, cestování, volný čas",
        "Objem, popruhy, kapsy, materiál, bezpečnost zipů",
      ],
      [
        "Hodinky",
        "Outfit i praktické sledování času",
        "Velikost ciferníku, řemínek, styl (sport / elegantní)",
      ],
      [
        "Sluneční brýle",
        "Slunce, řízení, sport, doplnění looku",
        "Tvar obličeje, UV ochrana, materiál obrouček",
      ],
      [
        "Opasky",
        "Doladění pasu a sjednocení outfitu",
        "Šířka, délka, spona, barva kovu vs. boty/taška",
      ],
    ],
  },
  {
    caption: "Materiály a péče",
    headers: ["Materiál", "Péče", "Kdy zvolit"],
    rows: [
      [
        "Kůže / kvalitní imitace",
        "Suchý hadřík, chránit před deštěm a teplem",
        "Elegantní i každodenní tašky a opasky",
      ],
      [
        "Textil / plátno",
        "Lehké čištění dle štítku, sušit volně",
        "Lehké shopper tašky a volnočasové modely",
      ],
      [
        "Kov / minerální sklo (hodinky, brýle)",
        "Jemně otřít; brýle do pouzdra",
        "Hodinky a sluneční brýle na časté nošení",
      ],
      [
        "Syntetika / sportovní směsi",
        "Otřít vlhkým hadříkem, nechat doschnout",
        "Aktivní den, cestování, lehčí údržba",
      ],
    ],
  },
];

const ACCESSORIES_FAQ: FaqItem[] = [
  {
    q: "Jak vybrat módní doplňky k outfitu?",
    a: "Nejdřív zvolte příležitost (práce, volný čas, večer) a dominantní barvu oblečení. Pak přidejte jeden výrazný kousek — tašku, hodinky, sluneční brýle nebo opasek — a zbytek držte jednodušší, ať celek nepůsobí přeplněně.",
  },
  {
    q: "Jak vybrat tašku na každý den?",
    a: "Spočítejte, co nosíte denně (telefon, peněženka, notebook). Hledejte dostatečný objem, pohodlné popruhy a odolný materiál. K práci se hodí pevnější konstrukce, k volnému času lehčí shopper nebo crossbody.",
  },
  {
    q: "Jak vybrat hodinky podle stylu?",
    a: "K minimalistickému šatníku volte čistý ciferník a neutrální řemínek. K výraznějším outfitům můžete sáhnout po výraznějším tvaru nebo barvě. Vždy zkontrolujte velikost ciferníku vůči zápěstí a pohodlí zapínání.",
  },
  {
    q: "Jak sladit sluneční brýle s tvarem obličeje?",
    a: "Obecně funguje kontrast: kulatější tváři prospějí hranatější obroučky, hranatější tváři jemnější nebo oválnější tvary. Důležitější než trend je, aby brýle seděly na nose a nenarážely do spánků. U slunečních modelů sledujte i UV ochranu.",
  },
  {
    q: "Jak vybrat šířku a délku opasku?",
    a: "Šířku volte podle poutka kalhot nebo šatů — opasek musí projít a pevně držet. Délku podle obvodu pasu; u nastavitelných modelů nechte rezervu. Barvu kovu spony často slaďte s hodinkami nebo bižuterií.",
  },
  {
    q: "Mohu vyměnit velikost nebo model?",
    a: "Ano — výměna je možná do 7 dnů od doručení, pokud je produkt nepoužitý a v původním stavu. Před objednáním vždy zkontrolujte rozměry a tabulku velikostí v popisu.",
  },
  {
    q: "Musím platit předem?",
    a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné zálohy ani skryté poplatky.",
  },
  {
    q: "Jak dlouho trvá doručení?",
    a: "Obvykle 2–5 pracovních dnů expresním kurýrem po celé České republice. Po odeslání vám zašleme SMS s kódem pro sledování zásilky.",
  },
];

const CLOTHING_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Oblečení", path: `${GUIDE_PATH}/clothing` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
];

const CLOTHING_TABLES: HubTable[] = [
  {
    caption: "Typy oblečení — rychlé srovnání",
    headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Šaty",
        "Práce soft-dress, večer, slavnostní příležitost",
        "Délka, výstřih, materiál, zip/zapínání, podšívka",
      ],
      [
        "Trička a topy",
        "Každý den, vrstvení, sport i volný čas",
        "Střih (slim / regular / oversize), gramáž, výstřih",
      ],
      [
        "Kalhoty a džíny",
        "Práce, město, cestování",
        "Výška pasu, šířka nohavic, stretch, délka",
      ],
      [
        "Mikiny a svetry",
        "Přechodné období, volný čas, vrstva pod bundu",
        "Hustota úpletu, kapuce/zip, srážlivost",
      ],
      [
        "Bundy a kabáty",
        "Venku, dojíždění, sezónní ochrana",
        "Izolace, délka, kapsy, vodoodpudivost",
      ],
    ],
  },
  {
    caption: "Materiály a péče",
    headers: ["Materiál", "Péče", "Kdy zvolit"],
    rows: [
      [
        "Bavlna",
        "Prát dle štítku, sušit volně, žehlit středně",
        "Denní trička, lehčí košile, pohodlí na těle",
      ],
      [
        "Bavlna + elastan",
        "Šetrný cyklus, ne sušit na vysokou teplotu",
        "Trička a kalhoty, které mají držet tvar",
      ],
      [
        "Denim",
        "Obrátit naruby, prát méně často, sušit zavěšené",
        "Džíny a denimové bundy na každodenní nošení",
      ],
      [
        "Syntetické směsi (polyester, nylon)",
        "Nízká teplota, bez agresivní aviváže",
        "Sport, cestování, rychleschnoucí vrstvy",
      ],
      [
        "Vlna / úplet",
        "Jemné praní nebo chemické čištění dle štítku",
        "Svetry a kabáty v chladnějším období",
      ],
    ],
  },
];

const CLOTHING_FAQ: FaqItem[] = [
  {
    q: "Jak vybrat dámské oblečení online?",
    a: "Nejdřív zvolte příležitost (práce, volný čas, večer) a typ kousku. Pak porovnejte střih, materiál a tabulku velikostí v kartě produktu. Neutrální barvy se snáz kombinují; výrazný kousek nechte jako dominantu outfitu.",
  },
  {
    q: "Čím se liší pánské oblečení při výběru?",
    a: "U pánských modelů sledujte hlavně střih (slim / regular / relaxed), délku rukávů a nohavic a gramáž materiálu. K práci volte čistší linie a odolnější látky; k volnému času pohodlnější úplety a stretch.",
  },
  {
    q: "Jak poznám správnou velikost?",
    a: "Změřte obvod hrudníku, pasu a boků a porovnejte je s tabulkou velikostí u produktu. Pokud jste mezi dvěma čísly, u přiléhavých střihů často sedí větší velikost; u oversize naopak držte doporučený rozměr.",
  },
  {
    q: "Jaký materiál zvolit na každý den?",
    a: "Na denní nošení funguje bavlna nebo směs s elastanem — dýchá a drží tvar. Denim obstojí na časté nošení, syntetické směsi se hodí na sport a cestování. Vždy zkontrolujte štítek péče před prvním praním.",
  },
  {
    q: "Mohu vyměnit velikost?",
    a: "Ano — výměna je možná do 7 dnů od doručení, pokud je produkt nepoužitý a v původním stavu. Před objednáním vždy zkontrolujte rozměry a tabulku velikostí v popisu.",
  },
  {
    q: "Musím platit předem?",
    a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné zálohy ani skryté poplatky.",
  },
  {
    q: "Jak dlouho trvá doručení?",
    a: "Obvykle 2–5 pracovních dnů expresním kurýrem po celé České republice. Po odeslání vám zašleme SMS s kódem pro sledování zásilky.",
  },
  {
    q: "Hodí se oblečení online i jako dárek?",
    a: "Ano — volte neutrální barvy a střední střih, ať je výměna velikosti snadná. U šatů a kalhot vždy přiložte odkaz na tabulku velikostí nebo nechte obdarovaného zvolit model podle karty produktu.",
  },
];

export const FASHION_HUB_PACKS: Record<string, FashionHubPack> = {
  obleceni: {
    taglineHi:
      "Dámské oblečení i pánské kousky — šaty, trička, kalhoty a bundy s doručením do České republiky",
    shortDescHi:
      "Oblečení online: dámské i pánské šaty, trička, kalhoty, mikiny a bundy. Objednejte s platbou na dobírku.",
    categoryIntroHi:
      "Hledáte dámské oblečení, které obstojí v práci, ve městě i večer — a zároveň chcete přehledně porovnat i pánské oblečení? V kategorii Oblečení na Recenze Ceny projdete šaty, trička, kalhoty, džíny, mikiny i bundy podle příležitosti, střihu a materiálu. Objednejte oblečení online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.\n\nSprávně zvolený střih a materiál ušetří výměny a ráno skládání outfitu. Níže najdete checklist výběru, srovnání typů a tipy k péči i velikostem.",
    categorySectionsHi: [
      {
        id: "prilezitosti",
        heading: "Oblečení podle příležitosti",
        body: "Začněte tím, kam kousek půjde nejčastěji. Do práce volte čistší linie a odolnější materiály, k volnému času pohodlné trička, džíny a mikiny. Večer a slavnostní chvíle řeší šaty nebo formálnější kalhoty a sako; na sport a pohyb sáhněte po stretchových směsích. Když víte příležitost, snáz vyberete typ i barvu.",
        bullets: [
          "Práce a dojíždění — klidné barvy, pevnější látky, pohodlný pas",
          "Volný čas a město — trička, džíny, mikiny, vrstvení",
          "Večer a slavnost — šaty, elegantnější střihy, pečlivý materiál",
          "Sport a pohyb — stretch, prodyšnost, strečové pasy",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat oblečení",
        body: "Porovnejte střih s tím, co už nosíte: slim sedí blíž tělu, regular je univerzální, oversize přidá vzduch a vrstvy. Materiál rozhoduje o pohodlí a péči — bavlna dýchá, elastan drží tvar, denim vydrží časté nošení. Barvu volte podle šatníku: neutrály se kombinují, jedna výrazná barva stačí jako dominantní kousek. Velikost vždy ověřte v tabulce u produktu, ne jen podle čísla na etiketě v jiné značce.",
        bullets: [
          "Příležitost: práce, volný čas, večer, sport",
          "Střih: slim / regular / oversize a výška pasu",
          "Materiál vs. péče a srážlivost",
          "Barva vůči zbytku šatníku",
          "Tabulka velikostí a podmínky výměny",
        ],
      },
      {
        id: "typy",
        heading: "Šaty, trička, kalhoty, mikiny a bundy",
        body: "Šaty řeší délku, výstřih a podšívku — hodí se od soft-dress worklooku po večer. Trička a topy jsou základ vrstvení; sledujte gramáž a výstřih. Kalhoty a džíny drží siluetu: výška pasu a šířka nohavic mění celý outfit. Mikiny a svetry zahřejí jako střední vrstva; bundy a kabáty řeší izolaci, délku a kapsy. V tabulkách níže rychle porovnáte, kdy který typ dává smysl.",
        bullets: [
          "Šaty — délka, výstřih, zapínání, podšívka",
          "Trička a topy — střih, gramáž, výstřih",
          "Kalhoty a džíny — pas, stretch, délka nohavic",
          "Mikiny a svetry — úplet, zip/kapuce, vrstvení",
          "Bundy a kabáty — izolace, délka, kapsy",
        ],
      },
      {
        id: "materialy",
        heading: "Materiály a péče o oblečení",
        body: "Bavlna je univerzální na denní nošení; směs s elastanem lépe drží tvar u triček a kalhot. Denim snese časté nošení, pokud ho nepřete příliš často. Syntetické směsi schnou rychleji a hodí se na sport i cestování. Vlna a hustší úplety zahřejí, ale vyžadují jemnější péči. Před prvním praním vždy zkontrolujte štítek a popis v kartě produktu — špatný cyklus zkrátí životnost víc než běžné nošení.",
      },
      {
        id: "velikosti",
        heading: "Velikosti, materiály a výměna",
        body: "Před objednáním porovnejte své míry s tabulkou velikostí v kartě produktu — to je nejrychlejší cesta, jak se vyhnout výměně. U přiléhavých šatů a kalhot buďte pečliví u obvodu pasu a boků; u bund kontrolujte i délku rukávů. Pokud kousek nesedí nebo neodpovídá popisu, řešte výměnu nebo vrácení do 7 dnů; produkt musí být nepoužitý. Podrobnosti k doručení a platbě na dobírku najdete v sekci doručení.",
      },
    ],
    hubTables: CLOTHING_TABLES,
    hubLinks: CLOTHING_LINKS,
    categoryFaqHi: CLOTHING_FAQ,
    keywordsHi: [
      "dámské oblečení",
      "pánské oblečení",
      "oblečení online",
      "šaty",
      "trička",
      "kalhoty",
      "džíny",
      "mikiny",
      "bundy",
      "platba na dobírku",
    ],
  },
  "modni-doplnky": {
    taglineHi: "Módní doplňky — tašky, hodinky, brýle a opasky s doručením do České republiky",
    shortDescHi:
      "Módní doplňky online: tašky, hodinky, sluneční brýle a opasky. Objednejte s platbou na dobírku.",
    categoryIntroHi:
      "Hledáte módní doplňky, které doladí outfit a zároveň obstojí v každodenním nošení? V kategorii Doplňky na Recenze Ceny porovnáte tašky, hodinky, sluneční brýle i opasky podle příležitosti, materiálu a pohodlí — bez zbytečné módy „za každou cenu“. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.\n\nSprávně zvolené dámské i pánské doplňky sjednotí barvy, zvýrazní siluetu a ušetří čas ráno. Níže najdete checklist výběru, srovnání typů a tipy k péči i výměně velikosti.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Doplňky“",
        body: "Katalog je určen dospělým, kteří chtějí praktické módní doplňky do práce, na cesty i do volného času. Hodí se, když sháníte jeden silný kousek k jeansům, saku nebo šatům — nebo když chcete sjednotit tašku, opasek a hodinky do jednoho celku. Nabídka dává smysl i jako dárek: u hodinek a brýlí sledujte velikost a styl obdarovaného, u tašek a opasků spíš objem a barvu šatníku.",
        bullets: [
          "Každodenní styling — taška + opasek + decentní hodinky",
          "Práce a dojíždění — pevnější tašky, čitelné ciferníky",
          "Volný čas a cestování — lehčí materiály, sluneční brýle",
          "Dárek — neutrální barvy a univerzální střihy",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat módní doplňky",
        body: "Začněte příležitostí a tím, co už nosíte. K minimalistickému šatníku stačí jeden výrazný doplněk; k vzorovanému oblečení volte klidnější tvary a barvy. U tašek řešte objem a popruhy, u hodinek velikost ciferníku, u brýlí sedění na nose, u opasků šířku poutka. Nakonec porovnejte materiál, údržbu a podmínky výměny — levnější model bez jasných rozměrů často vyjde dráž na čase.",
        bullets: [
          "Příležitost: práce, volný čas, večer, cestování",
          "Jedna dominantní barva nebo kov v outfitu",
          "Rozměry, tabulka velikostí a obsah balení",
          "Materiál vs. údržba (déšť, každodenní otěr)",
          "Cena za životnost, ne jen nejnižší cena",
        ],
      },
      {
        id: "typy",
        heading: "Tašky, hodinky, brýle a opasky — co zvolit",
        body: "Tašky řeší kapacitu a způsob nošení (shopper, crossbody, batoh, ledvinka). Hodinky doplní look a zároveň musí být čitelné a pohodlné na zápěstí. Sluneční brýle chrání oči a mění výraz obličeje — tvar obrouček volte podle obličeje a lifestyle. Opasek sjednotí pas a často i barvu s botami nebo taškou; šířka musí projít poutky. V tabulkách níže rychle porovnáte, kdy který typ dává smysl.",
        bullets: [
          "Tašky — objem, popruhy, zipy, vnitřní kapsy",
          "Hodinky — ciferník, řemínek, sport vs. elegantní",
          "Sluneční brýle — tvar, UV, pouzdro a sedění",
          "Opasky — šířka, délka, spona, barva kovu",
        ],
      },
      {
        id: "materialy",
        heading: "Materiály a péče o módní doplňky",
        body: "Kůže a kvalitní imitace působí formálněji a při základní péči déle vydrží. Textil a plátno jsou lehčí a snáz se čistí, hodí se na volný čas. U hodinek a brýlí dbejte na jemné otření a bezpečné uložení — škrábance na skle nebo obroučkách zkracují životnost víc než běžný otěr řemínku. Před praním nebo chemickým čištěním vždy zkontrolujte štítek a popis produktu.",
      },
      {
        id: "velikosti",
        heading: "Upozornění: velikosti a výměna",
        body: "Před objednáním zkontrolujte rozměry, šířku opasku, velikost ciferníku nebo tabulku velikostí v kartě produktu — to je nejrychlejší cesta, jak se vyhnout výměně. Pokud kousek nesedí nebo neodpovídá popisu, řešte výměnu nebo vrácení do 7 dnů; produkt musí být nepoužitý. Podrobnosti k doručení a platbě na dobírku najdete v sekci doručení.",
      },
    ],
    hubTables: ACCESSORIES_TABLES,
    hubLinks: ACCESSORIES_LINKS,
    categoryFaqHi: ACCESSORIES_FAQ,
    keywordsHi: [
      "módní doplňky",
      "dámské doplňky",
      "pánské doplňky",
      "tašky",
      "hodinky",
      "sluneční brýle",
      "opasky",
      "módní doplňky online",
      "platba na dobírku",
    ],
  },
};
