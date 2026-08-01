/**
 * Rich SEO+UX hub for `/home-textile` (appliance shelf).
 * Generated from scripts/home-textile-hub-seo-prompt.cs.md — competitor SERP patterns,
 * not niche templates or other site hubs. Assortment: deky, přehozy, přikrývky, povlečení, polštáře.
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
    "Na bytový textil se vztahuje záruka výrobce; v balení najdete pokyny k péči a záruční doklady, pokud je dodavatel přikládá. Pokud produkt dorazí poškozený, nesedí rozměr nebo neodpovídá popisu, kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
};

const HUB_TABLES: HubTable[] = [
  {
    caption: "Bytový textil podle typu — rychlé srovnání",
    headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Deka",
        "Zahřátí na gauči, v křesle nebo jako lehký přehoz přes den",
        "Gramáž, rozměr, materiál (mikroplyš, fleece, bavlna), snadné praní",
      ],
      [
        "Přehoz",
        "Doladění postele nebo pohovky a ochrana ložního prádla",
        "Šířka lůžka / sedací soupravy, design, hustota tkaniny, praní",
      ],
      [
        "Přikrývka",
        "Hlavní vrstva na spaní podle sezóny a teploty v ložnici",
        "Výplň, gramáž / hřejivost, potah, vhodnost pro alergiky",
      ],
      [
        "Povlečení / ložní prádlo",
        "Obnova vzhledu postele a hygieny spánku",
        "Materiál (bavlna, krep, satén, flanel), rozměr peřiny a polštáře, zapínání",
      ],
      [
        "Polštář",
        "Opora hlavy a krku nebo dekorační doplněk",
        "Výška / tuhost, výplň, potah, možnost praní, rozměr povlaku",
      ],
    ],
  },
  {
    caption: "Materiál a gramáž — na co se dívat",
    headers: ["Materiál / prvek", "Kdy dává smysl", "Tip"],
    rows: [
      [
        "Bavlna / krepové povlečení",
        "Celoroční spaní, snadná údržba, citlivá pokožka",
        "Sledujte složení (ideálně 100 % bavlna) a rozměr peřiny i polštáře",
      ],
      [
        "Satén / flanel",
        "Satén pro hebký pocit; flanel na chladnější měsíce",
        "Flanel je hřejivější — v létě může být moc; satén dobře větrejte",
      ],
      [
        "Mikroplyšová deka",
        "Rychlé zahřátí na gauči, dětský pokoj, chata",
        "Gramáž kolem 200–350 g/m²; pračka podle štítku, nízké otáčky",
      ],
      [
        "Syntetická výplň přikrývky",
        "Alergici, časté praní, celoroční použití",
        "Gramáž: léto nižší, zima vyšší; potah musí sedět na rozměr peřiny",
      ],
      [
        "Péřová / přírodní výplň",
        "Vysoká hřejivost a lehkost při pečlivé údržbě",
        "Náročnější praní; při silné alergii raději duté vlákno",
      ],
    ],
  },
  {
    caption: "Problém doma → typ bytového textilu",
    headers: ["Problém", "Typ textilu", "Praktický tip"],
    rows: [
      [
        "V noci se potíte",
        "Prodyšné povlečení + lehčí přikrývka",
        "Volte bavlnu / krep a nižší gramáž výplně; vyhněte se hutnému flanelu",
      ],
      [
        "V ložnici je zima",
        "Teplejší přikrývka nebo mikroplyšová deka navíc",
        "Vyšší gramáž výplně; deku můžete použít jen v nejchladnějších nocích",
      ],
      [
        "Gauč vypadá prázdně / špiní se",
        "Přehoz nebo deka na sedací soupravu",
        "Změřte šířku sedáku a zvolte snadno pratelný materiál",
      ],
      [
        "Polštář nesedí nebo se propadá",
        "Nový polštář + správný povlak",
        "Tuhost podle spánkové polohy; povlak musí sedět na rozměr výplně",
      ],
    ],
  },
];

const HUB_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Domácí textil", path: `${GUIDE_PATH}/home-textile` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
  { label: "Vrácení a výměna", path: "/returns" },
  { label: "Kategorie: Domácí potřeby", path: "/domaci-potreby" },
  { label: "Kategorie: Domácí klima", path: "/domaci-klima" },
];

const CATEGORY_SECTIONS: ContentSection[] = [
  {
    id: "pro-koho",
    heading: "Pro koho je bytový textil v tomto katalogu",
    body:
      "Katalog Domácí textil je pro dospělé, kteří chtějí lepší spánek a útulnější interiér — ne další „designový“ kus bez praktického smyslu. Typický zákazník řeší deku na gauč, přehoz na postel, přikrývku podle sezóny, povlečení / ložní prádlo nebo polštář s rozumnou oporou. Bytový textil dává smysl tam, kde materiál, rozměr a údržba sedí k vašemu lůžku a stylu bydlení.",
    bullets: [
      "Domácnosti obnovující ložní prádlo a přikrývky",
      "Lidé hledající deku nebo přehoz na gauč a postel",
      "Kdo řeší gramáž, výplň a alergie před nákupem online",
      "Kdo porovnává rozměry a péči a objednává s dobírkou",
    ],
  },
  {
    id: "jak-vybrat",
    heading: "Jak vybrat bytový textil",
    body:
      "Nejdřív si ujasněte účel: spaní, zahřátí na gauči, nebo doladění vzhledu postele? Pak změřte lůžko nebo sedací soupravu a zvolte typ — deka, přehoz, přikrývka, povlečení nebo polštář. Domácí textil má smysl jen tehdy, když sedí rozměr, materiál a režim praní. Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.",
    bullets: [
      "Účel: spaní, gauč, sezónní hřejivost, nebo vzhled ložnice",
      "Rozměry peřiny, polštáře, postele nebo sedáku",
      "Materiál, výplň a gramáž podle teploty a alergie",
      "Pokyny k praní a zapínání (zip / knoflíky)",
      "Obsah balení, český popis a záruka výrobce",
    ],
  },
  {
    id: "typy-textilu",
    heading: "Typy bytového textilu: deka, přehoz, přikrývka, povlečení",
    body:
      "Deka slouží hlavně k rychlému zahřátí a jako měkký doplněk na gauč. Přehoz chrání a stylově zakrývá postel nebo pohovku. Přikrývka je nosná vrstva na spaní — rozhoduje výplň a gramáž. Povlečení a ložní prádlo určují pocit na kůži a vzhled lůžka; polštář drží výšku a tuhost hlavy. Vyberte typ podle místnosti a frekvence praní — tabulky níže shrnují orientaci.",
    bullets: [
      "Deka — gauč, chata, lehká vrstva přes den",
      "Přehoz — postel a sedací souprava, vzhled + ochrana",
      "Přikrývka — sezónní hřejivost a typ výplně",
      "Povlečení / ložní prádlo — materiál a rozměr peřiny",
      "Polštář — opora a rozměr povlaku",
    ],
  },
  {
    id: "material-gramaz",
    heading: "Materiál a gramáž: na co se dívat",
    body:
      "U bytového textilu rozhoduje materiál a gramáž víc než barva na fotce. Bavlněné a krepové povlečení je univerzální; flanel hřeje víc, satén působí hebčeji. U dek sledujte mikroplyš versus bavlnu a snadnost praní. U přikrývek kombinujte typ výplně s gramáží: nižší na léto a pro ty, kdo se potí, vyšší na zimu. Investujte víc do textilu, který používáte každou noc.",
    bullets: [
      "Každodenní spaní → kvalitní povlečení a přikrývka",
      "Alergie → pratelná syntetická výplň a prodyšný potah",
      "Gauč a občasné použití → mikroplyšová deka se snadnou údržbou",
      "Gramáž výplně čtěte spolu s teplotou ložnice — ne izolovaně",
    ],
  },
  {
    id: "bezpecnost",
    heading: "Bezpečnost: praní, alergie a záruka",
    body:
      "Před prvním použitím dodržujte štítek péče — teplota praní, sušení a žehlení. Textil s drobnými díly (zipy, knoflíky) kontrolujte u dětí; malé části držte mimo dosah batolat. Při citlivé pokožce nebo alergii volte pratelné materiály a pravidelně větrejte peřiny. Elektrické deky a topná řešení patří do kategorie Domácí klima — tuto kategorii tvoří klasický bytový textil bez topného prvku. Na produkty se vztahuje záruka výrobce; při poškození nebo nespokojenosti využijte výměnu do 7 dnů.",
  },
];

const CATEGORY_FAQ: FaqItem[] = [
  {
    q: "Čím se liší deka, přehoz a přikrývka?",
    a: "Deka slouží hlavně k zahřátí na gauči nebo jako lehká vrstva. Přehoz spíš zakrývá a chrání postel či pohovku. Přikrývka je nosná vrstva na spaní — u ní sledujte výplň a gramáž.",
  },
  {
    q: "Jakou gramáž přikrývky zvolit?",
    a: "Nižší gramáž se hodí na léto a pro ty, kdo se v noci potí. Střední gramáž bývá celoroční volba při běžné teplotě ložnice. Vyšší gramáž zvolte, když vám bývá zima. Vždy čtěte i typ výplně — ne jen číslo.",
  },
  {
    q: "Jaký materiál povlečení je nejlepší?",
    a: "Univerzální je bavlna a krep — prodyšné a snadno se perou. Satén působí hebčeji; flanel hřeje víc a hodí se spíš na chladnější měsíce. Rozhodujte podle teploty spánku a frekvence praní.",
  },
  {
    q: "Hodí se bytový textil pro alergiky?",
    a: "Často ano — zejména pratelné povlečení a přikrývky se syntetickou výplní. Pravidelně perte podle štítku a větrejte. Při silné alergii na peří volte duté vlákno místo přírodní výplně.",
  },
  {
    q: "Jak prát deku nebo mikroplyšovou deku?",
    a: "Dodržujte štítek: obvykle jemnější program, nižší teplota a šetrné otáčky. Nepřetěžujte buben; sušte podle pokynů výrobce, aby materiál neztratil hebkost.",
  },
  {
    q: "Jaký rozměr povlečení a přikrývky potřebuji?",
    a: "Změřte peřinu a polštáře — ne jen matraci. Povlak musí sedět na výplň; u přikrývky počítejte s přesahem přes šířku lůžka. Rozměry vždy ověřte na kartě produktu.",
  },
  {
    q: "Je na bytový textil záruka?",
    a: "Ano — na produkty v katalogu se vztahuje záruka výrobce. Uschovejte balení a doklady; v případě závady řešíme výměnu podle podmínek.",
  },
  {
    q: "Kde najdu elektrické deky a topení?",
    a: "Elektrické deky a zařízení pro teplotu v místnosti jsou v kategorii Domácí klima. Tato kategorie Domácí textil se soustředí na klasické deky, přehozy, přikrývky, povlečení a polštáře.",
  },
];

export const homeTextileHub: CategoryContent = {
  slug: "domaci-textil",
  nameHi: "Domácí textil",
  taglineHi: "Bytový textil — deky, povlečení a přikrývky s dobírkou",
  shortDescHi:
    "Deky, přehozy, přikrývky, povlečení a polštáře — bytový textil s doručením po České republice a platbou na dobírku.",
  subtitleHi: (b) => `${b} — bytový textil pro útulný domov`,
  productIntro: (b) =>
    `${b} — produkt z kategorie Domácí textil (deka, přehoz, přikrývka, povlečení nebo polštář). Materiál, rozměry a pokyny k péči jsou uvedeny ve specifikaci; v balení najdete návod a záruční informace výrobce.`,
  productSections: (brand) => [
    {
      heading: `Jak ${brand} zapadá do domácnosti`,
      body: `${brand} patří mezi bytový textil — podle typu slouží ke spaní, zahřátí nebo doladění ložnice a obýváku. Před objednávkou zkontrolujte rozměry, materiál a režim praní.`,
    },
    {
      heading: "Použití a péče",
      body: "Dodržujte štítek výrobce. Povlečení a deky perte doporučenou teplotou; přikrývky a polštáře sušte a větrejte podle pokynů. Zip a knoflíky zapínejte před praním, aby se netřely o tkaninu.",
    },
    {
      heading: "Bezpečnost: praní a provoz",
      body: "Textil používejte podle návodu. Drobné části a zipy hlídejte u malých dětí. Elektrické topné deky nejsou součástí této kategorie — viz Domácí klima.",
    },
    DELIVERY_PRODUCT,
    QUALITY_PRODUCT,
  ],
  productFaq: (brand) => [
    {
      q: `Jaká je záruka na ${brand}?`,
      a: "Záruka výrobce na bytový textil. Pokyny k péči a záruční doklady jsou součástí balení, pokud je dodavatel přikládá.",
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
    "Hledáte bytový textil s doručením po České republice? V kategorii Domácí textil najdete praktická řešení pro spánek i útulný interiér: deky, přehozy, přikrývky, povlečení a ložní prádlo i polštáře. Porovnejte typ, materiál, gramáž a rozměry na kartě produktu. Objednejte s platbou na dobírku; kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySectionsHi: CATEGORY_SECTIONS,
  categoryFaqHi: CATEGORY_FAQ,
  keywordsHi: [
    "bytový textil",
    "domácí textil",
    "povlečení",
    "ložní prádlo",
    "deka",
    "přehoz",
    "přikrývka",
    "polštář",
    "mikroplyšová deka",
    "bavlněné povlečení",
    "platba na dobírku",
  ],
  hubTables: HUB_TABLES,
  hubLinks: HUB_LINKS,
  serpLedHub: true,
};
