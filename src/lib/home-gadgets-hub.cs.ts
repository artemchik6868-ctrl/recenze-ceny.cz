/**
 * Rich SEO+UX hub for `/home-gadgets` (appliance shelf).
 * Generated from scripts/home-gadgets-hub-seo-prompt.cs.md — competitor SERP patterns,
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
    "Na elektroniku a domácí vychytávky se vztahuje záruka výrobce; v balení najdete návod a záruční doklady, pokud je dodavatel přikládá. Pokud produkt dorazí poškozený, nesedí nebo neodpovídá popisu, kontaktujte nás do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
};

const HUB_TABLES: HubTable[] = [
  {
    caption: "Typy domácích vychytávek — rychlé srovnání",
    headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
    rows: [
      [
        "Bluetooth audio / přehrávače",
        "Hudba nebo podcasty bez kabelů v bytě i na terase",
        "Výdrž baterie, dosah párování, hlasitost, případně odolnost vůči vlhkosti",
      ],
      [
        "USB doplňky a nabíjení",
        "Pořádek v kabelech, rychlé nabíjení u stolu nebo TV",
        "USB-A vs USB-C, výkon (W), počet portů, délka kabelu",
      ],
      [
        "LED pásky / laserové projektory",
        "Atmosféra, dekorace, ambientní světlo za TV nebo ve večerním režimu",
        "Způsob napájení, režimy barev, bezpečná vzdálenost u laseru, vhodné místo montáže",
      ],
      [
        "Úspora energie / vypínání standby",
        "Snížit zbytečný odběr TV boxů, audio a drobné elektroniky",
        "Vypínač na prodlužovačce, měření spotřeby, časovač, jednoduchá obsluha",
      ],
      [
        "Mini čerpadla a kompaktní USB pomocníci",
        "Cestování, auto, drobné domácí úkony bez velké techniky",
        "Napájení (USB / baterie), výkon, hlučnost, obsah balení",
      ],
    ],
  },
  {
    caption: "Napájení a připojení — co vyhoví vašemu bytu",
    headers: ["Připojení", "Výhody", "Tip před nákupem"],
    rows: [
      ["USB (A / C)", "Snadné napájení z PC, TV nebo adaptéru", "Ověřte výkon portu — slabý USB výstup = slabší nabíjení"],
      ["Bluetooth", "Bez kabelů k telefonu nebo tabletu", "Dosah cca 8–10 m v interiéru; zeď a Wi-Fi rušení snižují stabilitu"],
      ["Síť 230 V", "Stabilní výkon u stálého umístění", "Volné zásuvky a bezpečná prodlužovačka s vypínačem"],
      ["Baterie / akumulátor", "Přenosnost bez kabelu", "Udávaná výdrž vs. reálné používání na střední hlasitosti"],
    ],
  },
];

const HUB_LINKS: HubLink[] = [
  { label: "Průvodce výběrem: Domácí vychytávky", path: `${GUIDE_PATH}/domaci-vychytavky` },
  { label: "Doručení a platba na dobírku", path: "/delivery" },
  { label: "Vrácení a výměna", path: "/returns" },
  { label: "Kategorie: Domácí klima", path: "/domaci-klima" },
  { label: "Kategorie: Pro domácnost", path: "/domaci-potreby" },
];

const CATEGORY_SECTIONS: ContentSection[] = [
  {
    id: "pro-koho",
    heading: "Pro koho jsou užitečné vychytávky do domácnosti",
    body:
      "Katalog Domácí vychytávky je pro dospělé, kteří chtějí praktické drobnosti — ne další „zázrak z reklamy“. Typický zákazník řeší kabely u sedačky, hudbu bez drátů, ambientní světlo, drobné USB pomocníky nebo zbytečný odběr ve standby. Domácí vychytávky dávají smysl tam, kde malé zařízení šetří čas, místo nebo kilowatthodiny, aniž byste budovali celý smart-home systém.",
    bullets: [
      "Byty a domácnosti, kde chybí praktické USB, audio nebo světlo „po ruce“",
      "Lidé, kteří chtějí snížit standby spotřebu bez velké investice",
      "Cestující a motoristé hledající kompaktní USB / mini čerpadla",
      "Kdo porovnává cenu, obsah balení a záruku před objednávkou na dobírku",
    ],
  },
  {
    id: "jak-vybrat",
    heading: "Jak vybrat užitečné vychytávky do domácnosti",
    body:
      "Nejdřív si ujasněte problém: chybí nabíjení u gauče, chcete Bluetooth reproduktor, dekorativní LED, nebo vypínat spotřebiče ve standby? Pak zvolte typ a zkontrolujte napájení. Chytré vychytávky do domácnosti mají smysl jen tehdy, když sedí do vašeho prostoru — ne když jen vypadají dobře na fotce. Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.",
    bullets: [
      "Cíl použití: audio, USB, světlo, úspora energie, nebo kompaktní pomocník",
      "Napájení a konektory: USB-A/C, Bluetooth, 230 V, baterie",
      "Rozměry, hmotnost a kde bude zařízení stát nebo viset",
      "Obsah balení, český návod a záruka výrobce",
      "Reálná spotřeba / výdrž — ne jen marketingový slogan",
    ],
  },
  {
    id: "typy-vychytavek",
    heading: "Typy domácích vychytávek v katalogu",
    body:
      "Praktické pomůcky do domácnosti v této polici zahrnují hlavně kompaktní elektroniku. Bluetooth reproduktory a přehrávače řeší hudbu bez kabelů. USB doplňky do domácnosti zkracují cestu mezi kabelem a energií. LED pásky a laserové projektory tvoří atmosféru. Mini čerpadla a drobní USB pomocníci se hodí na cesty i do auta. Zařízení na úsporu energie a chytré vypínání cílí na zbytečný odběr ve standby. Vyberte typ podle místnosti a frekvence použití — tabulky níže shrnují orientaci.",
    bullets: [
      "Bluetooth audio — dosah, výdrž, hlasitost do obýváku nebo na terasu",
      "USB huby, nabíjení a drobné USB spotřebiče — výkon ve wattech",
      "LED / laserové světlo — montáž, režimy, bezpečná vzdálenost",
      "Úspora energie — vypínač, časovač, měření spotřeby",
      "Mini čerpadla a kompaktní pomocníci — výkon vs. hlučnost",
    ],
  },
  {
    id: "uspora-energie",
    heading: "Úspora energie: standby a drobné vychytávky",
    body:
      "Mnoho TV boxů, audio a nabíječek bere proud i v pohotovostním režimu. Užitečné vychytávky do domácnosti v této oblasti nejsou o „vypnutí celého bytu“, ale o jednoduchém vypínání a přehledu spotřeby. Prodlužovačka s vypínačem, zásuvka s časovačem nebo zařízení na úsporu energie pomáhají zkrátit dobu, po kterou elektronika „spí“ v síti. V EU platí přísnější limity pro standby — praxe je stejná: čím méně hodin ve standby, tím nižší účet. Nečekejte zázrak u každé koruny; největší efekt mají často používané spotřebiče, které necháváte stále v zásuvce.",
    bullets: [
      "Vypínejte úplně, ne jen uspávejte — zejména boxy a audio",
      "Časovač nebo vypínač na prodlužovačce u TV stěny",
      "Měření spotřeby pomůže najít „žrouty“ ve standby",
      "LED osvětlení s nižším odběrem než staré žárovky v dekoraci",
    ],
  },
  {
    id: "bezpecnost",
    heading: "Bezpečnost: napájení, materiály a záruka",
    body:
      "Před prvním použitím si přečtěte návod a zkontrolujte napájení. USB a síťové vychytávky používejte jen s vhodným adaptérem; nepřetěžujte prodlužovačky. U laserových projektorů a silného světla dodržujte doporučenou vzdálenost a nikdy nesměrujte paprsek do očí — zejména u dětí. Elektroniku chraňte před vlhkostí, pokud výrobce neuvádí vyšší krytí. Textilní součásti (pokud jsou) perte podle štítku; elektroniku čistěte suchým hadříkem. Na domácí elektroniku se vztahuje záruka výrobce; při poškození nebo nespokojenosti využijte výměnu do 7 dnů.",
  },
];

const CATEGORY_FAQ: FaqItem[] = [
  {
    q: "Jaký typ domácí vychytávky mám vybrat jako první?",
    a: "Začněte problémem, který řešíte nejčastěji: nabíjení u sedačky (USB), hudba bez kabelů (Bluetooth), atmosféra (LED/laser), nebo zbytečný odběr ve standby (vypínání / energy helper). Až potom porovnejte specifikace a cenu.",
  },
  {
    q: "Stačí Bluetooth reproduktor do obýváku, nebo potřebuji větší systém?",
    a: "Do běžného bytu často stačí kompaktní Bluetooth model s rozumnou výdrží a hlasitostí. Větší sestavy dávají smysl při častém poslechu ve větší místnosti nebo venku — vždy ověřte dosah párování a výdrž baterie v popisu.",
  },
  {
    q: "Na co si dát pozor u USB doplňků do domácnosti?",
    a: "Hlavně na typ portu (USB-A vs USB-C), maximální výkon ve wattech a počet současně nabíjených zařízení. Slabý port nabíjí pomalu; u notebooků hledejte vyšší Power Delivery, pokud to produkt uvádí.",
  },
  {
    q: "Jsou laserové projektory bezpečné pro děti?",
    a: "Používejte je podle návodu, mimo přímý pohled do paprsku a mimo dosah malých dětí. Laser a silné LED světlo nejsou hračka — při pochybnostech zvolte jemnější ambientní LED pásek.",
  },
  {
    q: "Pomůže zařízení na úsporu energie opravdu snížit účet?",
    a: "Nejvíce ušetříte tam, kde spotřebiče běží dlouho ve standby. Vypínání a měření spotřeby dávají smysl u TV stěny, audio a nabíječek. Nejde o zázračný „šetřič“ místo výměny starých velkých spotřebičů.",
  },
  {
    q: "Je na elektroniku záruka?",
    a: "Ano — na domácí elektroniku a vychytávky se vztahuje záruka výrobce. Uschovejte balení a doklady; v případě závady řešíme výměnu podle podmínek.",
  },
  {
    q: "Co když produkt nesedí nebo nefunguje jak čekám?",
    a: "Kontaktujte nás do 7 dnů od doručení. Zajistíme výměnu nebo vrácení peněz bez zbytečných poplatků — podrobnosti najdete v sekci vrácení.",
  },
  {
    q: "Potřebuji celý smart-home systém, abych měl užitek?",
    a: "Ne. Domácí vychytávky v tomto katalogu jsou záměrně drobné a samostatné — USB, Bluetooth, světlo nebo vypínání standby. Velké klimatizační nebo topné systémy patří spíš do kategorie domácího klimatu.",
  },
];

export const homeGadgetsHub: CategoryContent = {
  slug: "domaci-vychytavky",
  nameHi: "Domácí vychytávky",
  taglineHi:
    "Užitečné vychytávky do domácnosti — Bluetooth, USB, LED a drobné pomocníky s dobírkou",
  shortDescHi:
    "Kompaktní elektronika a praktické pomůcky: Bluetooth reproduktory, USB doplňky, LED a laserové světlo, mini čerpadla i zařízení na úsporu energie — s doručením po České republice.",
  subtitleHi: (b) => `${b} — domácí vychytávka pro každodenní použití`,
  productIntro: (b) =>
    `${b} — produkt z kategorie Domácí vychytávky (kompaktní elektronika a praktické pomůcky). Materiály, napájení a obsah balení jsou uvedeny ve specifikaci; v balení najdete návod a záruční informace výrobce.`,
  productSections: (brand) => [
    {
      heading: `Jak ${brand} zapadá do domácnosti`,
      body: `${brand} patří mezi praktické domácí vychytávky — kompaktní elektroniku, která šetří čas, místo nebo energii. Před objednávkou zkontrolujte napájení (USB, Bluetooth, síť nebo baterie), rozměry a obsah balení.`,
    },
    {
      heading: "Použití a péče",
      body: "Dodržujte návod výrobce. Elektroniku chraňte před vlhkostí, pokud není uvedeno vyšší krytí. Čistěte suchým hadříkem; textilní součásti (pokud jsou) perte podle štítku.",
    },
    {
      heading: "Bezpečnost: napájení a provoz",
      body: "Nepřetěžujte prodlužovačky. U laserového nebo silného světla dodržujte bezpečnou vzdálenost a nesměrujte paprsek do očí. Zařízení není hračka pro malé děti bez dozoru.",
    },
    DELIVERY_PRODUCT,
    QUALITY_PRODUCT,
  ],
  productFaq: (brand) => [
    {
      q: `Jaká je záruka na ${brand}?`,
      a: "Záruka výrobce na elektroniku. Pokyny a záruční doklady jsou součástí balení, pokud je dodavatel přikládá.",
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
    "Hledáte užitečné vychytávky do domácnosti s doručením po České republice? V kategorii Domácí vychytávky najdete praktické drobnosti, které šetří čas, místo i energii: Bluetooth reproduktory a přehrávače, USB doplňky do domácnosti, LED pásky a laserové projektory, mini čerpadla i zařízení na úsporu energie. Nejde o lifehacky z octu a sody — jde o kompaktní elektroniku, kterou můžete porovnat podle napájení, rozměrů a záruky. Objednejte s platbou na dobírku; kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySectionsHi: CATEGORY_SECTIONS,
  categoryFaqHi: CATEGORY_FAQ,
  keywordsHi: [
    "užitečné vychytávky do domácnosti",
    "domácí vychytávky",
    "chytré vychytávky do domácnosti",
    "praktické pomůcky do domácnosti",
    "USB doplňky do domácnosti",
    "Bluetooth reproduktor",
    "LED pásek",
    "laserový projektor",
    "zařízení na úsporu energie",
    "platba na dobírku",
  ],
  hubTables: HUB_TABLES,
  hubLinks: HUB_LINKS,
};
