// České šablony obsahu pro trh CZ.

import { autoHub } from "./auto-hub.cs";
import { buildNicheContentCS } from "./niche-content.cs";
import { mergeCategoryFaq } from "./category-faq.cs";
import { FASHION_HUB_PACKS } from "./fashion-hub-packs.cs";
import { gardenToolsHub } from "./garden-tools-hub.cs";
import { homeGadgetsHub } from "./home-gadgets-hub.cs";
import { homeTextileHub } from "./home-textile-hub.cs";
import { householdHub } from "./household-hub.cs";
import { personalGroomingHub } from "./personal-grooming-hub.cs";
import { SUPPLEMENT_HUB_PACKS } from "./supplement-hub-packs.cs";

export type ContentSection = {
  heading: string;
  body: string;
  bullets?: string[];
  /** Anchor id for TOC; auto-slugified from heading when omitted. */
  id?: string;
};

export type FaqItem = { q: string; a: string };

/** Static comparison matrix rendered in category hub editorial. */
export type HubTable = {
  caption: string;
  headers: string[];
  rows: string[][];
};

/** Internal CTA links (path relative to site root, e.g. /delivery). */
export type HubLink = { label: string; path: string };

export type CategoryContent = {
  slug: string;
  nameHi: string;
  taglineHi: string;
  shortDescHi: string;
  subtitleHi: (brand: string) => string;
  productIntro: (brand: string) => string;
  productSections: (brand: string) => ContentSection[];
  productFaq: (brand: string) => FaqItem[];
  categoryIntroHi: string;
  categorySectionsHi: ContentSection[];
  categoryFaqHi: FaqItem[];
  keywordsHi: string[];
  hubTables?: HubTable[];
  hubLinks?: HubLink[];
  /** Skip forced hub chrome (how-to-choose, Přehledové tabulky H2, shipping H2, aboutCat). */
  serpLedHub?: boolean;
};

const COMMON_DELIVERY: ContentSection = {
  heading: "Objednávka, doprava a platba",
  body:
    "Po odeslání objednávky vás bude kontaktovat operátor za účelem potvrzení adresy, množství a doby dodání. Zásilka je doručována v diskrétním balení; název produktu není zvenčí viditelný. Doručujeme expresním kurýrem po celé České republice do 2-5 pracovních dnů; platba probíhá při převzetí balíčku.",
};

const COMMON_SAFETY: ContentSection = {
  heading: "Bezpečnost a upozornění",
  body:
    "Tento produkt je doplněk stravy, nikoli lék. Není určen k diagnostice, léčbě nebo prevenci nemocí. Pokud užíváte léky na předpis, jste těhotná, kojíte nebo trpíte chronickým onemocněním, poraďte se před použitím se svým lékařem. Nedoporučuje se pro osoby mladší 18 let.",
};

const COMMON_QUALITY: ContentSection = {
  heading: "Proč nám důvěřovat?",
  body:
    "Recenze Ceny je pečlivě vybraná platforma pro přírodní produkty. Spolupracujeme výhradně s dodavateli, kteří mají platné certifikáty kvality a jsou schopni poskytnout dokumentaci k šaržím. Pokud vaše objednávka dorazí poškozená, kontaktujte nás do 7 dnů; zajistíme bezplatnou výměnu.",
};

const COMMON_FAQ: FaqItem[] = [
    {
      q: "Musím platit předem?",
      a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
    },
    {
      q: "Jak dlouho trvá doručení?",
      a: "Obvykle 2-5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS zprávou po odeslání.",
    },
    {
      q: "Je produkt originální?",
      a: "Ano, spolupracujeme výhradně s oficiálními dodavateli. Na každém balení je uvedeno číslo šarže a datum spotřeby.",
    },
];

type Builder = {
  slug: string;
  name: string;
  tagline: string;
  shortDesc: string;
  subtitle: (b: string) => string;
  productIntro: (b: string) => string;
  uniqueSection: (b: string) => ContentSection;
  howToUse: (b: string) => ContentSection;
  uniqueFaq: (b: string) => FaqItem[];
  categoryIntro: string;
  categorySections: ContentSection[];
  categoryFaq: FaqItem[];
  keywords: string[];
  hubTables?: HubTable[];
  hubLinks?: HubLink[];
};

function compose(b: Builder): CategoryContent {
  return {
    slug: b.slug,
    nameHi: b.name,
    taglineHi: b.tagline,
    shortDescHi: b.shortDesc,
    subtitleHi: b.subtitle,
    productIntro: b.productIntro,
    productSections: (brand) => [
      b.uniqueSection(brand),
      b.howToUse(brand),
      COMMON_SAFETY,
      COMMON_DELIVERY,
      COMMON_QUALITY,
    ],
    productFaq: (brand) => [...b.uniqueFaq(brand), ...COMMON_FAQ],
    categoryIntroHi: b.categoryIntro,
    categorySectionsHi: b.categorySections,
    categoryFaqHi: b.categoryFaq,
    keywordsHi: b.keywords,
    hubTables: b.hubTables,
    hubLinks: b.hubLinks,
  };
}

const diabetes = compose({
  slug: "cukrovka",
  name: "Péče o cukrovku",
  tagline:
    "Doplňky stravy na cukrovku — podpora metabolismu glukózy vedle režimu a lékaře, ne místo léků",
  shortDesc:
    "Kapsle a bylinné formule pro dospělé, kteří porovnávají doplňky stravy na hladinu cukru, chrom, gurmar i další složky — vždy jako podporu, ne náhradu léčby.",
  subtitle: (b) => `${b} — přírodní kapsle pro podporu regulace hladiny cukru v krvi`,
  productIntro: (b) =>
    `${b} je fytofarmakologická formule vyvinutá pro dospělé, kteří aktivně pracují na regulaci hladiny cukru v krvi. Obsahuje extrakty z gurmaru, hořké okurky a pískavice řecké seno, které se tradičně používají ve fytoterapii. ${b} nenahrazuje léky na předpis – je to denní doplněk stravy, který by měl být kombinován s vyváženou stravou a aktivním životním stylem.`,
  uniqueSection: (b) => ({
    heading: `Jak ${b} funguje`,
    body:
      "Formule působí na třech úrovních: (1) zmírňuje výkyvy hladiny cukru v krvi po jídle, (2) podporuje přirozenou citlivost na inzulín, (3) podporuje stabilní energii a zdravý metabolismus. Mnoho uživatelů zaznamenává stabilnější hladinu energie již po 4–6 týdnech pravidelného užívání. Výsledek závisí na stravě, fyzické aktivitě a případných souběžných onemocněních.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "2x denně 1 kapsle – 20–30 minut před snídaní a večeří, zapít sklenicí vody. Nekousejte. Během užívání ${b} je nutné omezit sladkosti, smažená jídla a vysoce zpracované potraviny – nízkosacharidová dieta zlepšuje výsledky. Doporučený cyklus: 12 týdnů, dále dle doporučení lékaře.",
  }),
  uniqueFaq: (b) => [
    {
      q: `Může ${b} nahradit mé léky na cukrovku?`,
      a: "Ne. Jedná se o doplněk stravy, nikoli lék. Nikdy nepřestávejte užívat předepsané léky na vlastní uvážení – jakékoli změny konzultujte se svým lékařem.",
    },
    {
      q: "Je vhodný pro diabetes 1. typu?",
      a: "Diabetes 1. typu je závislý na inzulínu; použití je možné pouze pod dohledem endokrinologa.",
    },
  ],
  categoryIntro:
    "Hledáte doplňky stravy na cukrovku s doručením po České republice? V kategorii Péče o cukrovku porovnáte doplňky stravy na hladinu cukru — kapsle s chromem a skořicí, gurmar (gymnema), berberin, kyselinu alfa-lipoovou i formule s morušovníkem nebo pískavicí. Cílem je podpora metabolismu glukózy a denního komfortu vedle stravy, pohybu a předepsané léčby, nikoli místo inzulinu či metforminu. Hodnoty si ověřujte glukometrem; objednejte s platbou na dobírku, kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySections: [
    {
      id: "pro-koho",
      heading: "Pro koho jsou doplňky stravy pro diabetiky",
      body:
        "Katalog cílí na dospělé s prediabetem nebo diabetem 2. typu pod lékařským dohledem, kteří chtějí doplnit režim o přírodní prostředky na cukrovku. Typický zákazník zapisuje glykémii, řeší chuť na sladké po jídle, nebo hledá doplněk na cukr v krvi ke stávající terapii po dohodě s lékařem. Diabetes 1. typu, těhotenství, kojení a akutní výkyvy cukru patří výhradně do rukou lékaře — doplněk stravy není diagnostický ani léčebný nástroj.",
      bullets: [
        "Prediabetes nebo DM 2 s cílem podpořit režim, ne nahradit léky",
        "Zájem o chrom a skořici, gurmar, berberin nebo kyselinu alfa-lipoovou",
        "Ochota konzultovat kombinaci s inzulinem, metforminem či dalšími antidiabetiky",
      ],
    },
    {
      id: "jak-vybrat",
      heading: "Jak vybrat doplňky stravy na cukrovku",
      body:
        "Nejdřív si ujasněte cíl: denní podpora metabolismu glukózy (chrom, skořice), chuť na sladké (gurmar), podpora po jídle (vláknina, morušovník), nebo komfort při brnění končetin (kyselina alfa-lipoová — vždy jen jako doplněk, ne léčba neuropatie). Pak zvolte formu a zkontrolujte dávku na etiketě. Tabulky níže shrnují orientační hodnoty, formy i typické složky.",
      bullets: [
        "Léky na předpis: před kombinací se zeptejte lékaře — riziko hypoglykémie",
        "Glukometr a zápis hodnot — ne jen subjektivní pocit energie",
        "Transparentní složení, dávka chromu/extraktu a délka kúry",
        "Cena za denní dávku a obsah cukru v pomocných látkách",
      ],
    },
    {
      id: "hodnoty-glykemie",
      heading: "Orientační hodnoty glykémie a HbA1c",
      body:
        "Glykémie nalačno a HbA1c pomáhají oddělit „pocit“ od čísel — nejde o samodiagnózu. Orientačně: kolem 3,9–5,5 mmol/l nalačno bývá běžný rámec u dospělých; vyšší opakované hodnoty a HbA1c v pásmu prediabetu nebo diabetu vyžadují lékařské posouzení. Domácí glukometr, stejná denní doba měření a zápis výsledků dávají smysl i při užívání doplňku. Urgentní vzorce (velmi vysoká glukóza s žízní, zvracením nebo zmateností) řešte ihned s lékařem, ne samoléčbou doplňkem.",
    },
    {
      id: "slozky",
      heading: "Chrom, gurmar, berberin a další složky v katalogu",
      body:
        "V doplňcích stravy na hladinu cukru se nejčastěji objevují minerály s oficiálně uznanou rolí u chromu a tradiční rostliny. Chrom a skořice patří k běžným kombinacím; gurmar (Gymnema sylvestre) se spojuje s chutí na sladké; berberin a kyselina alfa-lipoová se řeší spíš v odbornějších formulích. Morušovník, pískavice, hořčík a vitamin D doplňují nabídku podle cíle. Vždy jde o podporu — ne o zaručené snížení HbA1c bez režimu a lékaře.",
      bullets: [
        "Chrom — přispívá k udržení normální hladiny glukózy v krvi (dle schválených tvrzení)",
        "Skořice, gurmar, pískavice, morušovník — bylinný základ mnoha kapslí",
        "Berberin a kyselina alfa-lipoová — časté v komplexech; pozor na interakce",
        "Hořčík / vitamin D — smysl hlavně při laboratorně potvrzeném deficitu",
      ],
    },
    {
      id: "rezim",
      heading: "Režim vedle doplňku: strava, pohyb a měření",
      body:
        "Přírodní prostředky na cukrovku dávají největší smysl vedle režimu, ne místo něj. Omezte vysoce zpracované sacharidy a slazené nápoje, zařaďte vlákninu a pravidelný pohyb většinu dní v týdnu a chraňte spánek. Doplněk stravy nevyřeší opakované noční přejídání ani vynechaná měření. Detailní checklist výběru najdete v průvodci; zde jde o každodenní rámec kolem katalogu.",
      bullets: [
        "Stabilní strava a pohyb — základ před jakýmkoli doplňkem",
        "Měřit glykémii ve stejnou denní dobu a zapisovat výsledky",
        "Při změně léků nebo silném výkyvu cukru nejdřív lékař",
      ],
    },
    {
      id: "bezpecnost",
      heading: "Bezpečnost a kdy k lékaři",
      body:
        "Doplněk stravy na cukrovku není lék na diabetes a nenahrazuje inzulin, metformin ani jiná antidiabetika. Nepřestávejte užívat předepsané léky bez souhlasu lékaře. Při pocení, třesu, zmatenosti nebo podezření na hypoglykémii — zejména po přidání berberinu, gurmaru či kyseliny alfa-lipoové k inzulinu nebo derivátům sulfonylurey — vyhledejte pomoc. Těhotenství, kojení, diabetes 1. typu a onemocnění jater nebo ledvin vyžadují individuální konzultaci před jakýmkoli doplňkem.",
    },
  ],
  hubTables: [
    {
      caption: "Orientační hodnoty glukózy a HbA1c (vzdělávací rámec)",
      headers: ["Kategorie", "Glykémie nalačno", "HbA1c (orientace)", "Co dělat"],
      rows: [
        ["Běžný rámec u dospělých", "cca 3,9–5,5 mmol/l", "pod pásmem prediabetu", "Udržovat režim a občasné měření"],
        ["Prediabetes (orientace)", "opakovaně vyšší hodnoty", "pásmo prediabetu dle laboratoře", "Režim, opakované testy, poradit se s lékařem"],
        ["Diabetes (orientace)", "opakovaně vysoké hodnoty", "pásmo diabetu dle laboratoře", "Lékařské vedení; doplněk jen jako podpora"],
        ["Urgentní varování", "velmi vysoká glukóza + příznaky", "nečekat na doplněk", "Okamžitě vyhledat lékařskou pomoc"],
      ],
    },
    {
      caption: "Formy produktů — rychlé srovnání",
      headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
      rows: [
        ["Kapsle / tablety", "Stabilní denní rutina vedle režimu a léků", "Dávka chromu/extraktu, délka kúry, cukr v pomocných látkách"],
        ["Kapky / tinktura", "Flexibilní dávkování bylinných směsí", "Obsah alkoholu, chuť, návod"],
        ["Vláknina (např. psyllium)", "Podpora po jídle a sytost", "Tekutiny, dávkování, interakce s léky"],
        ["Komplexní formule", "Více složek v jedné kúře", "Přehledné složení místo marketingového komplexu"],
      ],
    },
    {
      caption: "Časté složky v doplňcích na cukrovku",
      headers: ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      rows: [
        ["Chrom", "Přispívá k normální hladině glukózy a metabolismu makroživin", "Není náhradou antidiabetik; držte se dávky na etiketě"],
        ["Skořice (extrakt)", "Častá kombinace s chromem v doplňcích na cukr", "Cassia může obsahovat kumarin — opatrnost u jater"],
        ["Gurmar (Gymnema)", "Tradiční podpora při chuti na sladké", "Možné zesílení účinku léků — konzultace"],
        ["Berberin", "Rostlinná složka ve formulech na metabolismus glukózy", "Interakce s léky; nevhodné v těhotenství"],
        ["Kyselina alfa-lipoová", "Často u komfortu nervů při diabetu", "Může ovlivnit glykémii; sledujte měření"],
        ["Morušovník / pískavice", "Bylinné komplexy na podporu po jídle", "Transparentní dávka extraktu; lékař při lécích"],
        ["Hořčík / vitamin D", "Doplnění při deficitu a celkovém metabolismu", "Smysl hlavně po laboratorním potvrzení"],
      ],
    },
  ],
  hubLinks: [
    { label: "Průvodce výběrem: Péče o cukrovku", path: "/pruvodce/cukrovka" },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
    { label: "Kategorie: Vysoký krevní tlak", path: "/krevni-tlak" },
    { label: "Kategorie: Kontrola hmotnosti", path: "/hubnuti" },
  ],
  categoryFaq: [
    {
      q: "Nahrazují doplňky stravy na cukrovku předepsané léky?",
      a: "Ne. Doplněk stravy podporuje režim a může doplnit péči, ale nenahrazuje inzulin, metformin ani jiná antidiabetika. Změny medikace patří vždy lékaři.",
    },
    {
      q: "Lze kombinovat doplněk s inzulinem nebo metforminem?",
      a: "Jen po konzultaci. Některé složky (berberin, gurmar, kyselina alfa-lipoová) mohou zesílit pokles glukózy. Sledujte glykémii a při příznacích hypoglykémie vyhledejte pomoc.",
    },
    {
      q: "Jak dlouho užívat doplňky stravy na hladinu cukru?",
      a: "Počítejte s několika týdny pravidelného užívání podle návodu a zápisem měření. Účinek je individuální; při zhoršení hodnot kontaktujte lékaře dříve.",
    },
    {
      q: "Je lepší chrom a skořice, nebo gurmar?",
      a: "Záleží na cíli: chrom se často volí pro denní podporu metabolismu glukózy, gurmar spíš při chuti na sladké. Složení, dávka a kompatibilita s léky jsou důležitější než jedna zázračná bylina.",
    },
    {
      q: "Potřebuji glukometr, když beru doplněk na cukrovku?",
      a: "Ano — bez měření nepoznáte, zda režim a doplněk dávají smysl. Domácí glukometr, stejná denní doba a zápis hodnot jsou praktický základ.",
    },
    {
      q: "Pomáhají přírodní prostředky na cukrovku místo diety?",
      a: "Ne. Strava, pohyb a spánek zůstávají základem. Doplněk stravy je podpora katalogu, ne náhrada režimu ani lékařské péče.",
    },
    ...COMMON_FAQ,
  ],
  keywords: [
    "doplňky stravy na cukrovku",
    "doplňky stravy na hladinu cukru",
    "doplňky stravy pro diabetiky",
    "přírodní prostředky na cukrovku",
    "doplněk na cukr v krvi",
    "chrom a skořice",
    "gurmar",
    "berberin cukrovka",
    "kyselina alfa-lipoová diabetes",
    "prediabetes doplněk",
  ],
});


const hypertension = compose({
  slug: "krevni-tlak",
  name: "Vysoký krevní tlak",
  tagline:
    "Doplňky stravy na krevní tlak — podpora srdce a cév vedle režimu a lékařské péče, ne místo léků",
  shortDesc:
    "Bylinné kapky, kapsle i minerální formule pro dospělé, kteří chtějí přehledně porovnat přírodní podporu krevního tlaku a srdce.",
  subtitle: (b) => `${b} — přírodní kapsle pro zdravý krevní tlak`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro dospělé s hraničním krevním tlakem. Obsahuje extrakty z arjuny, ashwagandhy a hořčíku, které podporují normální funkci srdečního svalu a odolnost vůči stresu.`,
  uniqueSection: (b) => ({
    heading: `Jak ${b} pomáhá`,
    body:
      "Formule se zaměřuje na udržení zdravého tonusu cévních stěn a normálního srdečního rytmu. Pravidelní uživatelé často zaznamenávají stabilnější ranní puls a lepší celkový stav po 3-4 týdnech – reakce je individuální.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "2x denně 1 kapsle – se snídaní a večeří, zapít vodou. Omezte sůl, kouření a nadměrnou konzumaci kofeinu. Denní 20-30 minutová rychlá chůze zvyšuje účinek. Doporučený cyklus: 8-12 týdnů.",
  }),
  uniqueFaq: (b) => [
    {
      q: `Mohu přestat užívat léky na krevní tlak kvůli ${b}?`,
      a: "Ne – nikdy nepřestávejte užívat léky na krevní tlak bez lékařské konzultace. Tento doplněk stravy by měl být užíván s nimi, nikoli místo nich.",
    },
  ],
  categoryIntro:
    "Hledáte doplňky stravy na krevní tlak s doručením po České republice? V této kategorii porovnáte přírodní prostředky na vysoký krevní tlak — bylinné kapky na tlak, kapsle s hlohem či olivovým listem, formule s hořčíkem a draslíkem i omega-3. Cílem je podpora krevního tlaku a každodenní komfort srdce a cév vedle režimu a předepsané léčby, nikoli místo nich. Hodnoty si ověřujte tonometrem; objednejte s platbou na dobírku, kurýr obvykle doručí do 2–5 pracovních dnů.",
  categorySections: [
    {
      id: "pro-koho",
      heading: "Pro koho jsou doplňky na vysoký krevní tlak",
      body:
        "Katalog cílí na dospělé s mírně zvýšeným nebo hraničním tlakem, kteří chtějí doplnit méně soli, pohyb a spánek o byliny na tlak nebo minerální podporu. Typický zákazník zapisuje ranní měření, řeší stres v práci, nebo hledá hypertenze doplněk stravy ke stávající terapii po dohodě s lékařem. Při hodnotách nad 140/90 mmHg patří rozhodnutí o léčbě vždy k lékaři — doplněk stravy není antihypertenzivum.",
      bullets: [
        "Hraniční nebo mírně zvýšené hodnoty při pravidelném měření",
        "Zájem o bylinné kapky, hloh na krevní tlak nebo minerály (hořčík a draslík)",
        "Ochota konzultovat kombinaci s léky na předpis",
      ],
    },
    {
      id: "jak-vybrat",
      heading: "Jak vybrat doplněk stravy na krevní tlak",
      body:
        "Nejdřív si ujasněte cíl: podpora cév a srdce (hloh, olivový list, česnek), zklidnění při stresu (meduňka, srdečník), minerální rovnováha (hořčík a draslík na tlak), nebo aminokyseliny podporující vazodilataci (L-arginin). Pak zvolte formu — kapsle pro denní rutinu, bylinné kapky na tlak pro flexibilní dávkování, čaj jako doplněk pitného režimu. Tabulky níže shrnují hodnoty mmHg, formy i typické složky.",
      bullets: [
        "Léky na předpis: před kombinací se zeptejte lékaře nebo lékárníka — některé byliny mohou zesílit účinek",
        "Tonometr a zápis hodnot — ne jen subjektivní pocit",
        "Transparentní složení, dávka a délka kúry (obvykle několik týdnů)",
        "Cena za denní dávku a obsah alkoholu u tinktur",
      ],
    },
    {
      id: "priznaky-a-hodnoty",
      heading: "Hodnoty tlaku a proč se hypertenzi říká tichý zabiják",
      body:
        "Krevní tlak se uvádí ve dvou číslech (systolický / diastolický) v mmHg. Orientace: kolem 120/80 je běžný klidový rámec, hodnoty od 140/90 se obvykle považují za vysoké a vyžadují lékařské posouzení. Hypertenze často dlouho nebolí — proto se jí říká tichý zabiják. Varovné signály mohou zahrnovat bolesti hlavy, závratě, bušení srdce, šum v uších nebo dušnost; bez měření je ale snadné je přehlédnout. Domácí tonometr a tabulka hodnot níže pomáhají oddělit „pocit“ od čísel.",
    },
    {
      id: "byliny-a-mineraly",
      heading: "Byliny, minerály a další složky v katalogu",
      body:
        "V doplňcích na vysoký krevní tlak se nejčastěji objevují tradiční byliny na tlak i minerály s oficiálně uznanou rolí u draslíku. Hloh na krevní tlak a podporu srdce, jmelí, česnek, olivový list, ibišek, srdečník a meduňka patří k typickým fytokomponentám. Hořčík a draslík, omega-3 a koenzym Q10 doplňují dlouhodobou péči o cévy; L-arginin a citrulin se objevují ve formulech zaměřených na produkci oxidu dusnatého. Vždy jde o podporu — ne o zaručené snížení tlaku bez režimu a lékaře.",
      bullets: [
        "Hloh, jmelí, česnek, olivový list, ibišek — bylinný základ mnoha kapek i kapslí",
        "Hořčík a draslík — minerální podpora; draslík přispívá k udržení normálního tlaku krve",
        "Omega-3 a CoQ10 — dlouhodobý kardiovaskulární komfort",
        "L-arginin / citrulin — doplňky pro podporu vazodilatace u vybraných formulí",
      ],
    },
    {
      id: "rezim",
      heading: "Režim vedle doplňku: sůl, pohyb, spánek a stres",
      body:
        "Přírodní prostředky na vysoký krevní tlak dávají největší smysl vedle režimu, ne místo něj. Omezte sůl a vysoce zpracované potraviny, zařaďte potraviny bohaté na draslík, hýbejte se alespoň střední intenzitou většinu dní v týdnu a chraňte spánek. Stres a nadměrný kofein či alkohol mohou hodnoty zvedat — doplněk stravy to nevyřeší sám. Detailní checklist výběru najdete v průvodci; zde jde o každodenní rámec kolem katalogu.",
      bullets: [
        "Méně soli, více pohybu a pravidelný spánek",
        "Omezit kouření, nadměrný alkohol a stimulační nápoje",
        "Měřit ve stejnou denní dobu a zapisovat výsledky",
      ],
    },
    {
      id: "bezpecnost",
      heading: "Bezpečnost a kdy k lékaři",
      body:
        "Doplněk stravy na krevní tlak není lék na hypertenzi a nenahrazuje předepsaná antihypertenziva. Nepřestávejte užívat léky bez souhlasu lékaře. Při bolesti na hrudi, náhlé silné bolesti hlavy, dušnosti, poruše řeči nebo hodnotách kolem 180/120 mmHg vyhledejte okamžitě lékařskou pomoc. Těhotenství, kojení a chronická onemocnění vyžadují individuální konzultaci před jakýmkoli doplňkem.",
    },
  ],
  hubTables: [
    {
      caption: "Orientační hodnoty krevního tlaku (mmHg)",
      headers: ["Kategorie", "Systolický", "Diastolický", "Co dělat"],
      rows: [
        ["Orientace v klidu", "kolem 120", "kolem 80", "Udržovat režim a občasné měření"],
        ["Zvýšený / hraniční", "130–139", "85–89", "Režim, opakované měření, poradit se s lékařem"],
        ["Vysoký (hypertenze)", "≥ 140", "≥ 90", "Lékařské posouzení; doplněk jen jako podpora"],
        ["Urgentní varování", "kolem 180", "kolem 120", "Okamžitě vyhledat pomoc"],
      ],
    },
    {
      caption: "Formy produktů — rychlé srovnání",
      headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
      rows: [
        ["Kapsle / tablety", "Stabilní denní rutina vedle režimu a léků", "Složení, dávka, délka kúry"],
        ["Bylinné kapky / tinktura", "Flexibilní dávkování, tradiční směsi", "Obsah alkoholu, chuť, návod"],
        ["Čaj / bylinná směs", "Doplněk k pitnému režimu", "Frekvence, kombinace bylin (hloh, jmelí…)"],
        ["Minerály a omega-3", "Dlouhodobá podpora srdce a cév", "Forma hořčíku/draslíku, kvalita oleje"],
      ],
    },
    {
      caption: "Časté složky v doplňcích na krevní tlak",
      headers: ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      rows: [
        ["Hloh", "Tradiční podpora srdce a oběhu", "Není náhradou antihypertenziv"],
        ["Jmelí / srdečník / meduňka", "Součást bylinných kapek na tlak", "Konzultace při lécích na srdce"],
        ["Česnek / olivový list / ibišek", "Bylinné formule na podporu tlaku a cév", "Možné interakce — lékař nebo lékárník"],
        ["Hořčík a draslík", "Minerální podpora; draslík k normálnímu tlaku krve", "Dávka a forma; pozor u ledvinových onemocnění"],
        ["L-arginin / citrulin", "Podpora vazodilatace u vybraných produktů", "Není univerzální řešení hypertenze"],
        ["Omega-3 / CoQ10", "Dlouhodobý kardiovaskulární komfort", "Kvalita oleje, realistická očekávání"],
      ],
    },
  ],
  hubLinks: [
    { label: "Průvodce výběrem: Vysoký krevní tlak", path: "/pruvodce/krevni-tlak" },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
    { label: "Kategorie: Křečové žíly", path: "/krecove-zily" },
  ],
  categoryFaq: [
    {
      q: "Lze užívat doplňky stravy na krevní tlak s předepsanými léky?",
      a: "Často ano jako doplněk, ale ne bez konzultace — hloh, jmelí, česnek, olivový list i některé minerály mohou ovlivnit účinek léků. Zeptejte se lékaře nebo lékárníka a sledujte hodnoty tonometrem.",
    },
    {
      q: "Jaké hodnoty krevního tlaku jsou vysoké?",
      a: "Orientace: kolem 120/80 mmHg v klidu je běžný rámec; hodnoty od 140/90 mmHg se obvykle považují za vysoké a patří k lékaři. Domácí měření doplňte odborným posouzením, pokud jsou hodnoty opakovaně zvýšené.",
    },
    {
      q: "Jak dlouho sledovat účinek doplňku?",
      a: "Počítejte s několika týdny pravidelného užívání a zápisem měření. Doplněk není rychlá náhrada antihypertenziv; při zhoršení hodnot kontaktujte lékaře dříve.",
    },
    {
      q: "Pomáhají byliny na vysoký krevní tlak místo léků?",
      a: "Ne. Bylinné doplňky stravy a přírodní prostředky mohou podporovat srdce a cévy, ale neléčí hypertenzi a nenahrazují předepsanou léčbu ani změnu životního stylu.",
    },
    {
      q: "Potřebuji tonometr, když beru doplněk na tlak?",
      a: "Ano — bez měření nepoznáte, zda režim a doplněk dávají smysl. Domácí tlakoměr, stejná denní doba měření a zápis hodnot jsou praktický základ.",
    },
    {
      q: "Je lepší hloh v kapkách, nebo v kapslích?",
      a: "Záleží na preferenci: bylinné kapky nabízejí flexibilní dávkování (sledujte alkohol), kapsle pohodlnou denní rutinu. Složení, dávka a kompatibilita s léky jsou důležitější než forma samotná.",
    },
    ...COMMON_FAQ,
  ],
  keywords: [
    "doplňky stravy na krevní tlak",
    "doplňky na vysoký krevní tlak",
    "byliny na tlak",
    "bylinné kapky na tlak",
    "hloh na krevní tlak",
    "přírodní prostředky na vysoký krevní tlak",
    "hořčík a draslík na tlak",
    "olivový list krevní tlak",
    "hypertenze doplněk stravy",
    "podpora krevního tlaku",
  ],
});

const detox = compose({
  slug: "detox",
  name: "Detoxikace a čištění",
  tagline: "Jemné bylinné formule pro klidné trávení",
  shortDesc:
    "Doplňky stravy pro podporu přirozeného čištění trávicího systému a zdravé střevní flóry.",
  subtitle: (b) => `${b} — bylinné kapsle pro jemné čištění střev`,
  productIntro: (b) =>
    `${b} je jemná bylinná formule, která pomáhá dospělým udržovat každodenní čistotu trávicího systému a zdravý mikrobiom. Obsahuje extrakty z granátového jablka, fenyklu a dalších tradičních fyto-složek.`,
  uniqueSection: (b) => ({
    heading: `Jak ${b} funguje`,
    body:
      "Formule podporuje vyvážený mikrobiom a normální peristaltiku. Upozornění: Produkt neprovádí „zázračné čištění“, ale podporuje přirozené procesy těla.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "1x denně 2 kapsle – po večeři, zapít teplou vodou. Během cyklu je nutné pít alespoň 2 litry vody denně. Jeden cyklus trvá 30 dní.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Lze užívat dlouhodobě?",
      a: "Ne – doporučujeme 30denní cyklus, po kterém následuje minimálně 2měsíční přestávka.",
    },
  ],
categoryIntro:
    "Když trávení funguje klidně, energie se vrací sama. Tento výběr se zaměřuje na jemné bylinné doplňky, které podporují zdraví střev, normální trávení a přirozené procesy čištění těla.",
  categorySections: [
    {
      heading: "Jemné čištění trávení",
      body:
        "Doplňky v této kategorii podporují přirozené procesy trávení — nejsou to agresivní detox kúry. Důležitá je hydratace a vyvážená strava.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["Detoxikační kapsle", "Čištění střev", "Doplňky pro trávení"],
});

const joints = compose({
  slug: "klouby",
  name: "Klouby",
  tagline: "Kloubní výživa i lokální gely — výběr podle cíle, složení a ceny za den",
  shortDesc:
    "Doplňky stravy na klouby, kloubní výživa s kolagenem a glukosaminem i kloubní gely — porovnejte formy a doručení po České republice.",
  subtitle: (b) => `${b} – podpora pohyblivosti a každodenního komfortu kloubů`,
  productIntro: (b) =>
    `${b} patří do nabídky péče o klouby: podle formy podporuje vnitřní výživu chrupavky, nebo lokální komfort po zátěži. Vždy jde o doplněk stravy nebo topický přípravek, nikoli o lék na artritidu.`,
  uniqueSection: (_b) => ({
    heading: "Jak pomáhá",
    body:
      "Cílem je podpora běžné pohyblivosti a pocitu pohodlí v kloubech jako součást režimu (pohyb, váha, regenerace). Účinek bývá individuální; u vnitřní kloubní výživy se změny hodnotí spíš po týdnech než po dnech.",
  }),
  howToUse: (_b) => ({
    heading: "Návod k použití",
    body:
      "Dodržujte schéma na etiketě konkrétního produktu (kapsle/prášek vs. gel/sprej). U vnitřních přípravků bývá typická kúra v řádu týdnů; při lécích na předpis se předem poraďte s lékařem nebo lékárníkem.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Léčí artritidu?",
      a: "Ne — jde o doplněk stravy nebo topický přípravek, nikoli o lék na artritidu či artózu. Může doplňovat režim doporučený lékařem, ale nenahrazuje diagnózu ani léčbu.",
    },
  ],
  categoryIntro:
    "Hledáte doplňky stravy na klouby nebo kloubní výživu s doručením po České republice? V kategorii Klouby srovnáte vnitřní přípravky (kapsle, tablety, prášky s kolagenem, glukosaminem, chondroitinem či MSM) i lokální kloubní gely, krémy a spreje pro každodenní komfort. Cíl je praktický: vybrat formu a složení podle zátěže kolen, kyčlí nebo ramen — ne hledat zázračný lék na artritidu. Objednávejte online s platbou na dobírku; zásilka obvykle dorazí expresním kurýrem do 2–5 pracovních dnů.",
  categorySections: [
    {
      id: "pro-koho",
      heading: "Pro koho je kloubní výživa vhodná",
      body:
        "Katalog míří na dospělé, kteří chtějí udržet volný pohyb a snížit ranní ztuhlost nebo nepohodlí po schodech, tréninku či dlouhém sezení. Doplněk stravy na klouby dává smysl jako součást režimu — ne jako náhrada vyšetření u lékaře.",
      bullets: [
        "Senioři a lidé 45+: prevence ztuhlosti a podpora běžné hybnosti",
        "Sportovci a hobby aktivní: regenerace po běhu, posilovně nebo kolektivních sportech",
        "Sedavé zaměstnání: kolena a bedra po celodenním sezení u počítače",
        "Po zátěži nebo sezóně: lokální gel/sprej na krátkodobý komfort + vnitřní kúra dlouhodobě",
      ],
    },
    {
      id: "jak-vybrat",
      heading: "Jak vybrat kloubní výživu",
      body:
        "Nejdřív rozhodněte, zda potřebujete vnitřní podporu chrupavky, lokální úlevu, nebo obojí. Chrupavka nemá vlastní cévy — živiny se k ní dostávají hlavně pohybem a zátěží, proto samotná tableta bez rozumné aktivity nestačí. Pak srovnejte dávky na etiketě, délku kúry a cenu za denní porci.",
      bullets: [
        "Transparentní mg/g účinných látek — ne jen marketingový „komplex“",
        "Cena za den a délka kúry (často 8–12 týdnů), ne jen cena balení",
        "Alergie (korýši u glukosaminu) a interakce s léky — ověřte u lékárníka",
        "Pohyb a kontrola hmotnosti zesilují smysl kloubní výživy víc než výměna značky",
      ],
    },
    {
      id: "vnitrni-vs-lokalni",
      heading: "Vnitřní vs. lokální formy péče o klouby",
      body:
        "Vnitřní kloubní výživa (kapsle, tablety, drink) cílí na dlouhodobou podporu chrupavky a pojivové tkáně. Kloubní gel, krém nebo sprej řeší lokální komfort po zátěži a dá se použít cíleně na koleno, kyčel nebo rameno. V naší nabídce najdete oba směry — tabulky níže pomáhají zvolit podle cíle, ne podle reklamy.",
    },
    {
      id: "co-ocekavat",
      heading: "Co očekávat od kúry",
      body:
        "U perorální kloubní výživy se subjektivní změny často hodnotí až po 6–12 týdnech pravidelného užívání (orientačně 2–3 měsíce). Lokální přípravky mohou přinést rychlejší pocit úlevy, ale nenahrazují dlouhodobou péči o chrupavku. Po kúře zhodnoťte pohyb, bolest a případně pokračování s lékařem.",
      bullets: [
        "Týdny 1–3: návyk na dávkování, zatím spíš malé změny",
        "Týdny 4–8: častější horizont pro hodnocení komfortu u vnitřních přípravků",
        "Po 2–3 měsících: rozhodnutí o pokračování, pauze nebo změně složení",
      ],
    },
    {
      id: "bezpecnost",
      heading: "Bezpečnost a kdy k lékaři",
      body:
        "Doplňky stravy na klouby a topické přípravky nejsou léky na artritidu, artózu ani akutní zánět. Při náhlém otoku, zarudnutí, horečce, noční bolesti nebo omezení chůze vyhledejte lékaře. Těhotné, kojící a osoby s chronickým onemocněním nebo léky na předpis konzultují užívání předem.",
    },
  ],
  hubTables: [
    {
      caption: "Formy produktů — kdy kterou zvolit",
      headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
      rows: [
        ["Kapsle / tablety", "Dlouhodobá vnitřní kloubní výživa", "Dávky glukosaminu, kolagenu; délka kúry"],
        ["Prášek / drink", "Vyšší denní dávka, sportovní režim", "Chuť, rozpustnost, cena za den"],
        ["Gel / krém", "Lokální komfort po zátěži", "Frekvence nanášení, citlivost kůže"],
        ["Sprej", "Rychlá lokální aplikace", "Obsah balení, návod, omezení použití"],
      ],
    },
    {
      caption: "Účinné látky — orientační dávky (vždy dle etikety)",
      headers: ["Látka", "Orientační denní dávka", "Tip při výběru"],
      rows: [
        ["Glukosamin (sulfát)", "cca 1 500 mg", "Častý základ kloubní výživy; ověřte zdroj (korýši)"],
        ["Chondroitin (sulfát)", "cca 800 mg", "Často v kombinaci s glukosaminem"],
        ["Hydrolyzovaný kolagen", "cca 8–10 g", "Kolagen na klouby — typ I/II a vstřebatelnost"],
        ["MSM", "dle etikety (v literatuře i g dávky)", "Součást komplexů; sledujte snášenlivost"],
        ["Kyselina hyaluronová", "dle etikety", "Lubrikace / hydratace — doplněk, ne injekce"],
        ["Vitamin C", "dle RHP na etiketě", "Přispívá k normální tvorbě kolagenu"],
        ["Boswellia / kurkumin", "standardizovaný extrakt", "Bylinná podpora komfortu — ne jen název byliny"],
      ],
    },
    {
      caption: "Cíl uživatele × doporučená forma",
      headers: ["Cíl", "Doporučená forma", "Proč"],
      rows: [
        ["Dlouhodobá podpora chrupavky", "Kapsle / prášek", "Stabilní denní dávky chondroprotektiv"],
        ["Komfort po tréninku", "Gel / sprej ± vnitřní kúra", "Lokální úleva + systémová podpora"],
        ["Ranní ztuhlost ve vyšším věku", "Vnitřní komplex 8–12 týdnů", "Vyžaduje trpělivost a pohyb"],
        ["Citlivost na polykání tablet", "Drink / prášek nebo gel", "Snazší užívání bez velkých tablet"],
      ],
    },
  ],
  hubLinks: [
    { label: "Průvodce výběrem: Klouby", path: "/pruvodce/klouby" },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
    { label: "Kategorie: Kontrola hmotnosti", path: "/hubnuti" },
  ],
  categoryFaq: [
    {
      q: "Jak dlouho užívat kloubní výživu, než hodnotím účinek?",
      a: "U vnitřních přípravků je realistický horizont obvykle 6–12 týdnů (cca 2–3 měsíce) pravidelného užívání dle etikety. Lokální gely mohou přinést rychlejší subjektivní úlevu, ale nenahrazují dlouhodobou kúru.",
    },
    {
      q: "Je lepší kolagen, glukosamin, chondroitin, nebo MSM?",
      a: "Záleží na cíli a snášenlivosti. Kolagen na klouby a glukosamin/chondroitin se často volí pro podporu chrupavky; MSM bývá v komplexech. Srovnejte konkrétní dávky a alergie — ne marketingový název „nejlepší kloubní výživa“.",
    },
    {
      q: "Stačí kloubní gel, nebo potřebuji doplněk stravy?",
      a: "Gel nebo sprej řeší lokální komfort. Doplněk stravy na klouby cílí na dlouhodobější vnitřní podporu. Mnoho lidí kombinuje obojí: gel po zátěži a vnitřní kúru podle etikety.",
    },
    {
      q: "Pomůže kloubní výživa bez pohybu?",
      a: "Samotný doplněk má omezený smysl. Chrupavka je bezcévní — rozumný pohyb a přiměřená zátěž pomáhají „dostat“ živiny k tkáni. Ideální je výživa + mobilita, případně kontrola hmotnosti.",
    },
    {
      q: "Lze kombinovat s protizánětlivými léky?",
      a: "Často ano, ale závisí na přípravku (např. kurkumin, vysoké dávky MSM) a vašich lécích. Před kombinací se zeptejte lékaře nebo lékárníka.",
    },
    {
      q: "Jaká je bezpečná orientační dávka glukosaminu?",
      a: "V literatuře a odborných textech se často uvádí kolem 1 500 mg glukosamin-sulfátu denně — vždy ale platí dávkování na konkrétní etiketě. Při alergiích na korýše nebo chronických onemocněních konzultujte lékaře.",
    },
    {
      q: "Nahrazuje kloubní výživa vyšetření u lékaře?",
      a: "Ne. Doplňky stravy a topické přípravky nenahrazují diagnózu ani léčbu. Při otoku, zarudnutí, horečce nebo bolesti omezující chůzi vyhledejte lékaře.",
    },
  ],
  keywords: [
    "doplňky stravy na klouby",
    "kloubní výživa",
    "kolagen na klouby",
    "glukosamin",
    "chondroitin",
    "MSM",
    "kyselina hyaluronová",
    "bolest kloubů doplněk",
    "kloubní gel",
    "jak vybrat kloubní výživu",
    "platba na dobírku",
  ],
});

const vitality = compose({
  slug: "potence",
  name: "Potence a libido",
  tagline: "Diskrétní produkty pro mužskou potenci – kapsle, kapky a gel",
  shortDesc:
    "Přírodní doplňky stravy pro mužskou potenci, erekci a libido – diskrétní balení a doprava po České republice.",
  subtitle: (b) => `${b} – kapsle pro mužskou potenci`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro dospělé muže pro udržení potence, erekce a libida. Obsahuje bylinné složky pro každodenní použití a nevyžaduje lékařský předpis.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje erektilní funkci, sexuální touhu a sebevědomí v intimním životě. Výsledky se dostavují při pravidelném užívání po několik týdnů.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "Užívejte dle příbalového letáku – obvykle 1–2 kapsle nebo kapky denně s vodou. Doporučený cyklus: 30 dní. Nepřekračujte.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Bude název produktu viditelný na obalu?",
      a: "Ne – používáme zcela diskrétní balení. Zvenčí bude viditelná pouze vaše adresa.",
    },
  ],
  categoryIntro:
    "V kategorii Potence a libido najdete doplňky stravy pro mužskou potenci, erekci a libido – kapsle, kapky a gel. Všechny objednávky doručujeme diskrétně s platbou na dobírku po celé České republice.",
  categorySections: [
    {
      heading: "Potence a libido",
      body:
        "Produkty v této kategorii jsou určeny pro muže, kteří chtějí přirozeně podpořit svou potenci, erekci a libido. Jedná se o formule s bylinnými extrakty, nikoli léky na předpis.",
    },
    {
      heading: "Diskrétní doručení",
      body:
        "Všechny zásilky odesíláme v neutrálním balení bez označení obsahu. Platit můžete na dobírku kdekoli v České republice.",
    },
    {
      heading: "Bezpečnost a upozornění",
      body:
        "Tento produkt je doplněk stravy, nikoli lék. Není určen k diagnostice, léčbě nebo prevenci nemocí. Pokud užíváte léky na předpis, poraďte se před použitím se svým lékařem. Nedoporučuje se pro osoby mladší 18 let.",
    },
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["Přípravky na zvýšení potence", "Zlepšení potence", "Erekce", "Libido", "Kapsle na mužskou potenci"],
});

const weight = compose({
  slug: "hubnuti",
  name: "Kontrola hmotnosti",
  tagline: "Bylinné formule pro dosažení zdravé hmotnosti",
  shortDesc:
    "Doplňky stravy pro podporu zdravé kontroly hmotnosti, v kombinaci s vyváženou stravou a fyzickou aktivitou.",
  subtitle: (b) => `${b} – kapsle pro zdravou kontrolu hmotnosti`,
  productIntro: (b) =>
    `${b} je bylinný doplněk stravy vyvinutý jako podpora při dosahování zdravé hmotnosti. Obsahuje extrakt ze zelené kávy, garcinie a trifaly.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje normální metabolismus, vyvážené signály chuti k jídlu a každodenní energii. Není to „zázračný spalovač tuků“ – výsledek závisí na vyvážené stravě a fyzické aktivitě.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "2x denně 1 kapsle – 20 minut před snídaní a obědem. Neužívejte po 18:00 (mírný stimulační účinek). Kombinujte s vyváženou stravou a minimálně 150 minutami fyzické aktivity týdně.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Kolik kilogramů zhubnu?",
      a: "Nezaručujeme. Výsledek závisí na stravě, aktivitě, věku a metabolismu. Mnoho uživatelů uvádí úbytek 2–4 kg během 8týdenního cyklu.",
    },
  ],
  categoryIntro:
    "Zdravá hmotnost je cesta, nikoli jednorázová událost. V této nabídce najdete doplňky stravy, které fungují v kombinaci s vyváženou stravou a pravidelnou aktivitou, nikoli místo nich.",
  categorySections: [
    {
      heading: "Realistická očekávání",
      body:
        "Doplňky podporují metabolismus a chuť k jídlu, ale nejsou náhradou stravy ani pohybu. Výsledek závisí na celkovém životním stylu.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["Kapsle na hubnutí", "Spalování tuků Česká republika", "Přírodní kontrola hmotnosti"],
});

const prostate = compose({
  slug: "prostata",
  name: "Prostata",
  tagline: "Speciální podpora pro prostatu a močové cesty",
  shortDesc:
    "Doplňky stravy pro udržení zdraví prostaty a močových cest u mužů středního a staršího věku.",
  subtitle: (b) => `${b} – kapsle pro prostatu a močové cesty`,
  productIntro: (b) =>
    `${b} je přírodní doplněk stravy pro udržení normálního zdraví prostaty a močových cest u mužů nad 40 let. Obsahuje palmu sabalovou, dýňová semínka a zinek.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje normální průtok moči, vyvážený počet nočních návštěv toalety a každodenní zdraví prostatické tkáně.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "2x denně 1 kapsle – s jídlem. Doporučený cyklus: 8–12 týdnů.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Je to lék na rakovinu prostaty?",
      a: "Ne. Pokud vám lékař předepíše testy PSA nebo jiné vyšetření, neignorujte je; doplňky stravy nenahrazují diagnostiku.",
    },
  ],
  categoryIntro:
    "S přibývajícím věkem se péče o prostatu stává ještě důležitější. V této nabídce najdete doplňky stravy, které denně podporují prostatu a močové cesty.",
  categorySections: [
    {
      heading: "Pro muže nad 40 let",
      body:
        "Produkty cílí na podporu prostaty a močových cest. Při náhlých potížích s močením nebo bolesti vyhledejte urologa.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["Kapsle na prostatu", "Problémy s močením", "Palma sabalová v České republice"],
});

const vision = compose({
  slug: "zrak",
  name: "Zrak",
  tagline: "Prospěšné živiny pro zdravé oči a zrak",
  shortDesc:
    "Doplňky stravy pro udržení normálního zdraví očí v době obrazovek.",
  subtitle: (b) => `${b} – kapsle pro zdravé oči a zrak`,
  productIntro: (b) =>
    `${b} je doplněk stravy, který podporuje normální zdraví očí v moderním životě plném obrazovek. Obsahuje lutein, zeaxanthin, extrakt z borůvek a vitamín A.`,
uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body: "Podporuje normální strukturu sítnice, přirozenou adaptaci očí na modré světlo a každodenní komfort vidění.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "1 kapsle denně – s jídlem. Každých 20 minut se podívejte do dálky na 20 sekund (pravidlo 20-20-20). Doporučený cyklus: 12 týdnů.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Pomůže mi to, abych nemusel nosit brýle?",
      a: "Ne – ohledně korekce zraku se prosím poraďte s očním lékařem. Tento doplněk stravy pouze podporuje správnou výživu očí.",
    },
  ],
  categoryIntro:
    "Vzhledem k tomu, že nás obrazovky obklopují všude, je péče o oči důležitější než kdy jindy. V tomto výběru najdete doplňky stravy, které podporují každodenní výživu očí a dobrý komfort vidění.",
  categorySections: [
    {
      heading: "Péče o oči v digitální době",
      body:
        "Doplňky s luteinem a zeaxanthinem doplňují výživu očí při dlouhém sledování obrazovek — nenahrazují oční vyšetření.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["kapsle na oči", "lutein v České republice", "doplněk na zrak"],
});

const intimate = compose({
  slug: "hemoroidy",
  name: "Hemoroidy",
  tagline: "Jemná bylinná úleva pro citlivé oblasti",
  shortDesc:
    "Přírodní doplňky stravy, které pomáhají při každodenních problémech s hemoroidy.",
  subtitle: (b) => `${b} — kapsle na úlevu od hemoroidů`,
  productIntro: (b) =>
    `${b} je přírodní doplněk stravy pro dospělé, kteří se potýkají s každodenními problémy s hemoroidy. Obsahuje Triphalu, Haritaki a další tradiční bylinné složky.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje normální peristaltiku, zdravou cévní tkáň a každodenní komfort v citlivých oblastech. V případě silného krvácení nebo akutní bolesti okamžitě vyhledejte lékaře.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "2x denně 1 kapsle – s jídlem, zapít dostatečným množstvím vody. Strava bohatá na vlákninu a omezení kořeněných/tučných jídel zlepšuje výsledky.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Je balení diskrétní?",
      a: "Ano – zasíláme v naprosto neutrálním balení, na kterém je viditelná pouze vaše adresa.",
    },
  ],
  categoryIntro:
    "Mluvit o problémech s hemoroidy je často nepříjemné. V tomto výběru najdete přírodní doplňky stravy, které podporují každodenní komfort a normální zdraví střev, a to v naprosto diskrétním balení.",
  categorySections: [
    {
      heading: "Diskrétní objednávka",
      body:
        "Zásilky odesíláme v neutrálním balení. Při silném krvácení nebo akutní bolesti okamžitě kontaktujte lékaře.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["kapsle na hemoroidy", "přírodní lék na hemoroidy", "doplněk na hemoroidy"],
});

const womens = compose({
  slug: "zdravi-zen",
  name: "Zdraví žen",
  tagline: "Pečlivě vybrané nabídky pro ženy všech věkových kategorií",
  shortDesc:
    "Doplňky stravy pro podporu hormonální rovnováhy, energie a každodenní pohody žen.",
  subtitle: (b) => `${b} — kapsle pro zdraví a rovnováhu žen`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro podporu celkové hormonální rovnováhy, každodenní energie a komfortu během menstruačního cyklu u dospělých žen. Obsahuje Shatavari, kůru Ashoka a důležité mikroelementy, včetně železa.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje komfort během menstruačního cyklu, normální hormonální rovnováhu a každodenní energii.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "2x denně 1 kapsle – s jídlem. Doporučený cyklus: 8–12 týdnů.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Lze užívat v těhotenství?",
      a: "Ne – doplňky stravy by se neměly užívat během těhotenství nebo kojení bez výslovného souhlasu lékaře.",
    },
  ],
  categoryIntro:
    "Pohoda žen je rovnováha výživy, odpočinku a péče o sebe. V tomto výběru najdete doplňky stravy, které podporují hormonální rovnováhu, energii a každodenní pohodu.",
  categorySections: [
    COMMON_SAFETY,
    {
      heading: "Bezpečnost a upozornění",
      body:
        "Tento produkt je doplněk stravy, nikoli lék. Není určen k diagnostice, léčbě nebo prevenci nemocí. Pokud užíváte léky na předpis, jste těhotná, kojíte nebo trpíte chronickým onemocním, poraďte se před použitím se svým lékařem. Nedoporučuje se pro osoby mladší 18 let.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["kapsle pro zdraví žen", "Shatavari v České republice", "hormonální rovnováha"],
});

const nervousSystem = compose({
  slug: "stres",
  name: "Proti stresu",
  tagline: "Klid, spánek a podpora nervového systému",
  shortDesc:
    "Doplňky stravy pro snížení stresu, úzkosti a podporu kvalitního spánku — bez lékařských slibů.",
  subtitle: (b) => `${b} — kapsle pro klid a spánek`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro dospělé, kteří chtějí podpořit klid, spánek a odolnost vůči každodennímu stresu. Obsahuje bylinné extrakty pro nervový systém.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje uvolnění, kvalitnější spánek a každodenní odolnost vůči stresu. Není to lék na depresi ani úzkost — při dlouhodobých potížích vyhledejte psychiatra nebo praktického lékaře.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "Užívejte dle příbalového letáku — obvykle večer před spaním nebo rozděleně během dne. Neužívejte s alkoholem.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Pomůže při nespavosti?",
      a: "Může podpořit uvolnění před spaním, ale nenahrazuje léčbu chronické nespavosti. Při dlouhodobých potížích se poraďte s lékařem.",
    },
  ],
  categoryIntro:
    "Stres a špatný spánek ovlivňují energii i soustředění. V tomto výběru najdete doplňky pro klid, spánek a podporu nervového systému — vždy jako doplněk zdravého režimu, nikoli náhradu terapie.",
  categorySections: [
    {
      heading: "Stres, spánek a paměť",
      body:
        "Produkty cílí na každodenní klid a spánek. Pro úzkost, depresi nebo chronickou nespavost je nutná lékařská péče.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["proti stresu", "klid a spánek", "doplňky na nervy", "úzkost přírodně"],
});

const cystitisHub = compose({
  slug: "cystitida",
  name: "Cystitida",
  tagline: "Podpora při zánětu močového měchýře a nepohodlí při močení",
  shortDesc:
    "Doplňky stravy pro podporu močových cest a komfort při cystitidě — ne náhrada antibiotické léčby.",
  subtitle: (b) => `${b} — kapsle pro močové cesty`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro dospělé s opakovaným nepohodlím močových cest. Podporuje komfort při močení — při akutní infekci s horečkou vyhledejte lékaře.`,
  uniqueSection: (b) => ({
    heading: `Jak pomáhá`,
    body:
      "Podporuje zdraví močových cest a snižuje pocit pálení při močení u mírných potíží. Při krvi v moči, horečce nebo silné bolesti v podbřišku okamžitě kontaktujte lékaře.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "Užívejte dle schématu na obalu a pijte dostatek vody. Během akutní infekce dodržujte lékařskou terapii.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Pomáhá při akutní cystitidě?",
      a: "Může podpořit komfort, ale akutní bakteriální infekce vyžaduje lékařskou léčbu. Nepřerušujte předepsaná antibiotika.",
    },
  ],
  categoryIntro:
    "Pálení při močení a opakované potíže s močovým měchýřem jsou časté. Zde najdete doplňky pro podporu močových cest — rozlišujte komfortní podporu od akutní infekce, která vyžaduje lékaře.",
  categorySections: [
    {
      heading: "Akutní infekce vs. komfortní podpora",
      body:
        "Doplňky stravy nejsou antibiotika. Při horečce, krvi v moči nebo prudké bolesti vyhledejte lékaře do 24 hodin.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["zánět močového měchýře", "cystitida", "pálení při močení", "močové cesty"],
});

const parasitesHub = compose({
  slug: "paraziti",
  name: "Paraziti",
  tagline: "Bylinné kúry pro podporu střev — porovnejte složení, délku cyklu a formu",
  shortDesc:
    "Doplňky stravy na parazity: bylinné kapsle a kúry pro podporu střevního komfortu — doplňují, nenahrazují lékařskou diagnostiku.",
  subtitle: (b) => `${b} — bylinná kúra`,
  productIntro: (b) =>
    `${b} je bylinný doplněk stravy pro dospělé, kteří chtějí podpořit střevní komfort a očistu organismu. Typická kúra trvá několik týdnů.`,
  uniqueSection: (b) => ({
    heading: `Jak funguje kúra`,
    body:
      "Formule podporuje trávení a střevní prostředí během antiparazitární kúry. Výsledek závisí na délce užívání a stravě — není to náhrada laboratorní diagnostiky.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "Užívejte podle schématu na obalu (obvykle 2–4 týdny). Pijte dostatek vody a dodržujte hygienická opatření.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Jak dlouho trvá kúra proti parazitům?",
      a: "Obvykle 2–4 týdny pravidelného užívání. Po kúře je vhodná přestávka; při přetrvávajících potížích konzultujte lékaře.",
    },
  ],
  categoryIntro:
    "Parazitární kúry jsou oblíbené jako doplněk péče o střeva. V katalogu porovnávejte délku kúry, složení a formu — paraziti vs. detox: tato kategorie cílí na antiparazitární bylinné formule.",
  categorySections: [
    {
      heading: "Paraziti vs. detox",
      body:
        "Antiparazitární kúry se liší od obecných detox produktů — sledujte účinné byliny a doporučenou délku cyklu v popisu.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: [
    "doplňky stravy na parazity",
    "přípravky proti parazitům",
    "kapsle proti parazitům",
    "bylinná kúra proti parazitům",
    "očista od parazitů",
  ],
});

const fungusHub = compose({
  slug: "plisen-nehtu",
  name: "Plíseň nehtů",
  tagline: "Gel, krém, roztok i kapsle — výběr podle místa a délky kúry",
  shortDesc:
    "Doplňky stravy na plíseň nehtů: lokální gely a krémy, roztoky i spreje a kapsle jako vnitřní podpora.",
  subtitle: (b) => `${b} — gel nebo kapsle proti plísni`,
  productIntro: (b) =>
    `${b} je produkt pro dospělé s plísňovými projevy na nehtech nebo kůži. Forma volíte podle místa aplikace — gel na nehty, kapsle pro vnitřní podporu.`,
  uniqueSection: (b) => ({
    heading: `Gel vs. kapsle`,
    body:
      "Gel nebo krém se aplikuje přímo na postižený nehet nebo kůži; kapsle podporují organismus zevnitř. Důsledná aplikace po dobu týdnů až měsíců je klíčová.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "U gelu nanášejte tenkou vrstvu 1–2× denně na čistý nehet. U kapslí užívejte dle schématu na obalu. Při infekci bez zlepšení navštivte dermatologa.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Funguje gel i na kůži?",
      a: "Ano — mnoho gelů je určeno i pro kůži kolem nehtu. Zkontrolujte určení v popisu konkrétního produktu.",
    },
  ],
  categoryIntro:
    "Plíseň nehtů je vytrvalá — vyžaduje pravidelnou aplikaci. Porovnejte gel vs. kapsle, složení (např. tea tree) a délku kúry podle závažnosti.",
  categorySections: [
    {
      heading: "Lokální vs. perorální podpora",
      body:
        "U rozsáhlých infekcí kombinujte lokální péči s vnitřní podporou. Při diabetu nebo imunitních potížích konzultujte lékaře.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["plíseň nehtů", "gel na plíseň", "kapsle proti plísni"],
});

const hearingHub = compose({
  slug: "sluch",
  name: "Podpora sluchu",
  tagline: "Doplňky pro komfort uší a podporu sluchu",
  shortDesc:
    "Produkty pro podporu sluchu a komfort uší — nenahrazují ORL vyšetření.",
  subtitle: (b) => `${b} — kapsle pro sluch`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro dospělé, kteří chtějí podpořit zdraví sluchu a komfort uší. Při tinnitu nebo náhlém zhoršení sluchu vyhledejte ORL specialistu.`,
  uniqueSection: (b) => ({
    heading: `Sluch a tinnitus`,
    body:
      "Doplňky mohou podporovat výživu sluchového aparátu, ale nenahrazují audiometrii. Při hučení v uších (tinnitus) nebo bolesti konzultujte lékaře.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "Užívejte dle schématu na obalu — obvykle 8–12 týdnů. Vyhněte se hlasité hudbě v sluchátkách.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Pomáhá při tinnitu?",
      a: "Některé složky podporují cévní zdraví uší, ale tinnitus má mnoho příčin — ORL vyšetření je důležité.",
    },
  ],
  categoryIntro:
    "Sluch je citlivý na hluk i věk. V katalogu najdete doplňky pro podporu sluchu — vždy jako doplněk, ne náhrada sluchových aparátů ani lékařské péče.",
  categorySections: [
    {
      heading: "Kdy k ORL specialistovi",
      body:
        "Náhlé zhoršení sluchu, bolest ucha nebo závratě vyžadují okamžitou návštěvu lékaře — neodkládejte kvůli doplňkům stravy.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["podpora sluchu", "tinnitus", "doplňky na sluch", "zdraví uší"],
});

const digestiveHub = compose({
  slug: "traveni",
  name: "Trávení",
  tagline: "Probiotika, enzymy, vláknina i byliny — výběr podle cíle a složení",
  shortDesc:
    "Doplňky stravy na trávení: probiotika, prebiotika, trávicí enzymy, vláknina a bylinné přípravky pro střevní komfort.",
  subtitle: (b) => `${b} — kapsle na trávení`,
  productIntro: (b) =>
    `${b} je doplněk stravy pro dospělé s nepohodlím trávení nebo nepravidelnou stoličkou. Obsahuje bylinné a probiotické složky pro střeva.`,
  uniqueSection: (b) => ({
    heading: `Trávení a střeva`,
    body:
      "Podporuje normální trávení a střevní komfort. Při krvi ve stolici, silné bolesti břicha nebo dlouhotrvajícím průjmu vyhledejte gastroenterologa.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body: "Užívejte s jídlem nebo dle schématu na obalu. Dostatečný příjem vody a vlákniny zlepšuje výsledky.",
  }),
  uniqueFaq: (_b) => [
    {
      q: "Pomáhá při nadýmání?",
      a: "Mnoho produktů cílí na střevní komfort a nadýmání — výsledek je individuální; zkuste 4–6 týdnů pravidelného užívání.",
    },
  ],
  categoryIntro:
    "Trávení ovlivňuje energii i náladu. V této kategorii porovnávejte probiotika, enzymy, vlákninu a bylinné kapsle podle hlavního cíle — nadýmání, těžkost po jídle nebo nepravidelná stolička.",
  categorySections: [
    {
      heading: "Střeva a každodenní režim",
      body:
        "Doplňky fungují nejlépe spolu s vyváženou stravou a pitným režimem. Nejsou náhradou léčby zánětlivých onemocnění střev.",
    },
    COMMON_SAFETY,
  ],
  categoryFaq: COMMON_FAQ,
  keywords: ["trávení", "střeva", "probiotika", "doplňky na trávení"],
});

const varicoseVeins = compose({
  slug: "krecove-zily",
  name: "Křečové žíly",
  tagline:
    "Gely, krémy a doplňky stravy pro pocit lehčích nohou — vedle režimu a lékaře, ne místo zákroku",
  shortDesc:
    "Přípravky na křečové žíly: gely, masti a doplňky stravy na žíly a cévy při těžkých nohou a otocích — s doručením po České republice a platbou na dobírku.",
  subtitle: (b) => `${b} — přípravky na křečové žíly a péči o nohy`,
  productIntro: (b) =>
    `${b} je přípravek zaměřený na podporu žil a každodenní komfort nohou. Podle formy (gel, krém nebo kapsle) slouží k lokální péči nebo vnitřní podpoře — vždy jako doplněk režimu, nikoli jako náhrada lékařské péče ani kompresní terapie.`,
  uniqueSection: (b) => ({
    heading: `Jak ${b} zapadá do péče o žíly`,
    body:
      "Formule cílí na pocit těžkých nohou, otoky po dlouhém stání a vizuální diskomfort spojený s unavenými žílami. Účinek je individuální; gel ani doplněk stravy neodstraní již vzniklé varixy. Při bolesti, zarudnutí nebo podezření na zánět žil navštivte lékaře dříve než dlouhodobou domácí kúru.",
  }),
  howToUse: (b) => ({
    heading: "Návod k použití",
    body:
      "Gel nebo krém nanášejte podle návodu na čistou pokožku, obvykle 1–2× denně směrem od kotníku vzhůru. Kapsle užívejte s jídlem a vodou dle dávkování na obalu. Kombinujte s pohybem, elevací nohou a vhodnou kompresí dle lékaře; doporučený cyklus často 4–8 týdnů.",
  }),
  uniqueFaq: (b) => [
    {
      q: `Nahradí ${b} kompresní punčochy nebo zákrok?`,
      a: "Ne — jde o doplňkovou péči. Kompresní terapie a indikační zákroky řeší lékař; přípravek může podpořit komfort, ne nahradit diagnózu ani odstranit křečové žíly.",
    },
  ],
  categoryIntro:
    "Hledáte přípravky na křečové žíly — gel na křečové žíly, mast nebo doplňky stravy na žíly a cévy při těžkých nohou? V této kategorii porovnáte lokální péči i perorální venotonickou podporu podle formy, složení a denního režimu. Primární záměr je srozumitelný výběr pro každodenní komfort nohou; gel ani doplněk stravy nevyléčí již vzniklé varixy a nenahrazují lékaře. Objednejte s platbou na dobírku; doručení po České republice obvykle do 2–5 pracovních dnů v diskrétním balení.",
  categorySections: [
    {
      id: "pro-koho",
      heading: "Pro koho jsou přípravky na křečové žíly",
      body:
        "Katalog ocení dospělí s pocitem těžkých nohou po práci vestoje nebo vsedě, večerními otoky kotníků, metličkami či viditelnými žilkami. Časté rizikové profily odpovídají tomu, co lidé hledají u lékárenských hubů — genetika, těhotenství v anamnéze, nadváha, horké dny a dlouhé stání.",
      bullets: [
        "Sedavé nebo stojavé zaměstnání a večerní tíha v lýtkách",
        "Viditelné metličky nebo začínající křečové žíly bez akutní bolesti",
        "Prevence diskomfortu při cestování a horkém počasí",
        "Bolest, zarudnutí nebo náhlý jednostranný otok — nejdřív lékař",
      ],
    },
    {
      id: "jak-vybrat",
      heading: "Jak vybrat přípravky na křečové žíly",
      body:
        "Nejdřív rozhodněte formu: lokální gel či mast na křečové žíly pro rychlý pocit úlevy, nebo kapsle / tablety jako doplňky stravy na žíly a cévy pro delší vnitřní podporu. Kompresní punčochy a pohyb zůstávají základem konzervativní péče — přípravek je doplněk, ne náhrada. Tabulky níže shrnují typické volby.",
      bullets: [
        "Cíl: okamžitý komfort vs. dlouhodobější vnitřní podpora",
        "Složení a dávka na etiketě (flavonoidy, jírovec, rutin…)",
        "Režim: elevace nohou, procházky, méně dlouhého stání",
        "Délka kúry a orientační cena za denní použití",
      ],
    },
    {
      id: "priznaky",
      heading: "Příznaky těžkých nohou a počínajících varixů",
      body:
        "Časné signály žilního diskomfortu se často překrývají s tím, proč lidé hledají přípravky na křečové žíly a péči při otocích nohou. Domácí katalog pomáhá při mírných projevech; zhoršující se nebo jednostranné potíže patří k vyšetření.",
      bullets: [
        "Pocit tíhy, pnutí nebo unavených lýtek večer",
        "Otoky kotníků po dlouhém dni",
        "Svědění, pálení nebo noční křeče v lýtkách",
        "Metličkové žilky a viditelné rozšířené žíly",
        "V pokročilejším stadiu změny kůže — vždy konzultujte lékaře",
      ],
    },
    {
      id: "gely-a-doplnky",
      heading: "Gely, masti a perorální přípravky na žíly",
      body:
        "Lokální gel nebo mast na křečové žíly se hodí při unavených nohou a potřebě chladivého komfortu. Perorální doplňky stravy na žíly a cévy (často s diosminem, hesperidinem, aescinem z jírovce nebo rutinem) cílí na dlouhodobější podporu žilního tonu. Preferujte transparentní složení před obecným „krémem na nohy“ — a pamatujte: lokální péče neodstraní již vzniklé varixy.",
      bullets: [
        "Gel / mast: frekvence nanášení, citlivost kůže, chladivý efekt",
        "Kapsle: dávka flavonoidů či extraktů, délka cyklu",
        "Kombinace s kompresí a pohybem dle doporučení odborníka",
      ],
    },
    {
      id: "rezim",
      heading: "Režimová opatření při těžkých nohou",
      body:
        "Stejně jako u silných lékárenských hubů platí: samotný přípravek nestačí. Režim podporuje žilní návrat a snižuje večerní diskomfort — přípravky na křečové žíly ho jen doplňují.",
      bullets: [
        "Pravidelná chůze nebo plavání místo dlouhého stání na místě",
        "Elevace nohou nad úroveň srdce několikrát denně",
        "Kompresní punčochy správné třídy — dle lékaře nebo lékárníka",
        "Dostatek tekutin, méně soli a méně dlouhého sezení bez pauzy",
      ],
    },
    {
      id: "bezpecnost",
      heading: "Bezpečnost a kdy k lékaři",
      body:
        "Doplněk stravy ani gel nejsou léky na křečové žíly a nenahrazují diagnostiku chronické žilní nedostatečnosti. Při silné bolesti, jednostranném otoku, zarudnutí, dušnosti nebo známkách zánětu žil vyhledejte lékařskou pomoc. Na poškozenou kůži gel neaplikujte. Těhotenství, kojení a léky na předpis konzultujte před kúrou.",
    },
  ],
  hubTables: [
    {
      caption: "Formy péče o žíly — rychlé srovnání",
      headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
      rows: [
        ["Gel / mast", "Těžké nohy, lokální diskomfort, chladivý efekt", "Frekvence, citlivost kůže, návod"],
        ["Kapsle / tablety (doplněk)", "Dlouhodobější vnitřní podpora žil", "Složení flavonoidů / extraktů, kúra"],
        ["Kompresní punčochy", "Základ konzervativní péče dle lékaře", "Kompresní třída, velikost, doba nošení"],
        ["Režim (pohyb, elevace)", "Každodenní prevence únavy nohou", "Pravidelnost — doplňuje, nenahrazuje přípravek"],
      ],
    },
    {
      caption: "Časté látky v přípravcích na žíly a cévy",
      headers: ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      rows: [
        ["Diosmin + hesperidin", "Časté ve venotonické podpoře", "Doplněk ≠ registrovaný lék — čtěte obal"],
        ["Aescin / jírovec (koňský kaštan)", "Podpora při pocitu těžkých nohou", "Dávka, kontraindikace, citlivost žaludku"],
        ["Rutin / vitamin C", "Podpora cévní stěny v doplňcích", "Délka užívání dle návodu"],
        ["Vinná réva / gotu kola", "Rostlinná podpora žilního komfortu", "Standardizace extraktu, ne zázračný účinek"],
        ["Chladivý gel (mentol aj.)", "Okamžitý pocit úlevy na pokožce", "Není léčba ani odstranění varixů"],
      ],
    },
    {
      caption: "Příznak → co zkusit (orientačně)",
      headers: ["Situace", "Lokálně", "Vnitřně / režim"],
      rows: [
        ["Večerní tíha v lýtkách", "Gel / mast 1–2× denně", "Procházka, elevace nohou"],
        ["Otoky kotníků po stání", "Chladivý gel, volnější obuv", "Komprese dle lékaře, méně soli"],
        ["Metličky bez bolesti", "Lokální péče dle etikety", "Doplněk na žíly + pohyb; při nejistotě lékař"],
        ["Bolest / zarudnutí / jednostranný otok", "Nepokračovat v samoléčbě", "Okamžitě odborné vyšetření"],
      ],
    },
  ],
  hubLinks: [
    { label: "Průvodce výběrem: Křečové žíly", path: "/pruvodce/krecove-zily" },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
    { label: "Kategorie: Hemoroidy", path: "/hemoroidy" },
  ],
  categoryFaq: [
    {
      q: "Gel na křečové žíly, nebo tablety / kapsle?",
      a: "Gel či mast jsou praktické při těžkých nohou a lokálním diskomfortu; kapsle volí lidé hledající dlouhodobější vnitřní podporu žil. Často se kombinují s pohybem a kompresí — ne jako náhrada lékaře ani zákroku.",
    },
    {
      q: "Jak dlouho lze přípravky na křečové žíly používat?",
      a: "Řiďte se návodem výrobce; běžně se hodnotí cyklus několika týdnů (často 4–8). Pokud se potíže zhoršují, přerušte kúru a konzultujte odborníka.",
    },
    {
      q: "Pomáhají doplňky stravy na otoky nohou?",
      a: "Mohou podpořit komfort při unavených nohou, ale otok má více příčin. Trvalé nebo jednostranné otoky vždy vyšetřete — doplněk není diagnostický nástroj.",
    },
    {
      q: "Co je venotonikum v kontextu doplňků stravy?",
      a: "Obvykle jde o perorální přípravky s flavonoidy nebo rostlinnými extrakty zaměřené na podporu žil. Stále platí: doplněk stravy není lék na varixy a nevyléčí křečové žíly.",
    },
    {
      q: "Nahradí gel kompresní punčochy?",
      a: "Ne. Kompresní punčochy jsou zdravotnická pomůcka a základ konzervativní péče; gel doplňuje pocit úlevy na pokožce, ale nesupluje správnou třídu komprese doporučenou lékařem.",
    },
    ...COMMON_FAQ,
  ],
  keywords: [
    "přípravky na křečové žíly",
    "gel na křečové žíly",
    "mast na křečové žíly",
    "doplňky stravy na žíly a cévy",
    "těžké nohy",
    "venotonika",
    "otoky nohou",
    "jak na křečové žíly",
  ],
});

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "cukrovka": diabetes,
  "krevni-tlak": hypertension,
  "detox": detox,
  "klouby": joints,
  "potence": vitality,
  "hubnuti": weight,
  "prostata": prostate,
  "zrak": vision,
  "hemoroidy": intimate,
  "zdravi-zen": womens,
  "stres": nervousSystem,
  cystitida: cystitisHub,
  paraziti: parasitesHub,
  "plisen-nehtu": fungusHub,
  sluch: hearingHub,
  traveni: digestiveHub,
  "krecove-zily": varicoseVeins,
  "domaci-vychytavky": homeGadgetsHub,
  "zahradni-naradi": gardenToolsHub,
  "osobni-pece": personalGroomingHub,
  "domaci-potreby": householdHub,
  "domaci-textil": homeTextileHub,
  autodoplnky: autoHub,
};

export const NEW_CATEGORY_NAMES_CS: Record<string, { name: string; short: string }> = {
  "krecove-zily": { name: "Křečové žíly", short: "Přípravky na křečové žíly — gely, masti a doplňky při těžkých nohou." },
  "lupenka": {
    name: "Psoriáza",
    short: "Krém, mast, gel i doplňky stravy při lupénce — srovnání forem a složení.",
  },
  "alkoholismus": { name: "Alkoholismus", short: "Doplňky stravy a přírodní přípravky pro podporu při odvykání alkoholu." },
  "odvykani-koureni": { name: "Odvykání kouření", short: "Podpora pro zbavení se závislosti na tabáku." },
  "vboceny-palec": { name: "Vbočený palec", short: "Lokální péče a přípravky při vbočeném palci (hallux valgus)." },
  "vypadavani-vlasu": { name: "Péče o vlasy", short: "Produkty proti vypadávání vlasů a pro podporu zdravé pokožky hlavy." },
  "zvetseni-penisu": {
    name: "Zvětšení penisu",
    short: "Gely, krémy i kapsle pro muže, kteří řeší velikost a komfort — s realistickými očekáváními.",
  },
  "zvetseni-prsou": { name: "Zvětšení prsou", short: "Produkty pro ženy pro zvětšení a zpevnění prsou." },
  "papilomy": {
    name: "Papilomy",
    short: "Lokální gely a přípravky na papilomy a bradavice — s důrazem na bezpečný výběr.",
  },
  "anti-aging": { name: "Anti-aging", short: "Anti-aging krémy a podpora pleti — bez slibů věčného mládí." },
  "jatra": { name: "Zdraví jater", short: "Doplňky stravy pro podporu a přirozené čištění jater." },
  "ledviny": { name: "Ledviny", short: "Doplňky stravy pro podporu ledvin a močového systému." },
  "dychaci-cesty": { name: "Dýchací cesty", short: "Čaje a doplňky stravy pro dýchací cesty, plíce a dýchání." },
  "imunita": { name: "Imunita", short: "Doplňky stravy pro podporu imunitního systému a obranyschopnosti." },
  "chrapani": { name: "Spánek a chrápání", short: "Přípravky proti chrápání — sprej, kapky, náplast i kapsle na spánek." },
  "zahrada": { name: "Zahrada a zemědělství", short: "Hnojiva a produkty pro zahradu, dvůr a venkovní prostory." },
  "domaci-potreby": {
    name: "Domácí potřeby",
    short:
      "Úklidové potřeby, organizéry, úložné boxy, potřeby do kuchyně a drobní domácí pomocníci.",
  },
  "autodoplnky": {
    name: "Autodoplňky",
    short:
      "Doplňky do auta a autopříslušenství: péče o lak, komfort, autoelektronika i výbava na cesty.",
  },
  "boty": { name: "Boty", short: "Dámské a pánské boty s doručením po České republice." },
  "obleceni": {
    name: "Oblečení",
    short: "Dámské i pánské oblečení online — šaty, trička, kalhoty a bundy s platbou na dobírku.",
  },
  "modni-doplnky": { name: "Doplňky", short: "Módní doplňky: tašky, hodinky, sluneční brýle a opasky." },
  "kosmeticke-nastroje": { name: "Kosmetické nástroje", short: "Elektrické zubní kartáčky, čističe kartáčků a kosmetické doplňky." },
  "lekarske-pristroje": { name: "Lékařské přístroje", short: "Měřiče krevního tlaku, glukometry a další přístroje pro domácí použití." },
  "masazni-pristroje": { name: "Masážní přístroje", short: "Elektrické masážní přístroje na krk, záda a celé tělo." },
  "domaci-klima": { name: "Domácí klima", short: "Topení, klimatizace, zvlhčovače a elektrické deky." },
  "domaci-textil": { name: "Domácí textil", short: "Přikrývky, přehozy, ložní prádlo a polštáře pro útulný domov." },
  "outdoor-kempovani": { name: "Outdoor a kempování", short: "Stany, rybářské sítě, kempingové lampy a vybavení." },
  "hracky": { name: "Hračky", short: "Hračky pro děti předškolního a mladšího školního věku." },
  "domaci-vychytavky": {
    name: "Domácí vychytávky",
    short:
      "Užitečné vychytávky do domácnosti — Bluetooth, USB, LED, mini čerpadla a zařízení na úsporu energie.",
  },
  "zahradni-naradi": {
    name: "Zahradní nářadí",
    short:
      "Ruční zahradní nářadí, nůžky, plotostřihy, strunové sekačky a aku technika pro záhony, trávník a keře.",
  },
  "osobni-pece": {
    name: "Osobní péče",
    short:
      "Zastřihovače, holicí strojky, epilátory, kulmy, čističe uší i pomůcky pro úsměv a bělení zubů.",
  },
  "optika": { name: "Optika", short: "Dalekohledy, monokuláry, teleskopy a lupy." },
  "vyhrivane-obleceni": { name: "Vyhřívané oblečení", short: "Bundy, vesty a oblečení s integrovaným vyhříváním." },
};

const THIN_CATEGORY_SECTIONS = new Set<string>([]);

function withIntentFaq(content: CategoryContent): CategoryContent {
  const pack = SUPPLEMENT_HUB_PACKS[content.slug] ?? FASHION_HUB_PACKS[content.slug];
  const merged: CategoryContent = pack
    ? {
        ...content,
        taglineHi: pack.taglineHi ?? content.taglineHi,
        shortDescHi: pack.shortDescHi ?? content.shortDescHi,
        categoryIntroHi: pack.categoryIntroHi,
        categorySectionsHi: pack.categorySectionsHi,
        categoryFaqHi: pack.categoryFaqHi,
        hubTables: pack.hubTables,
        hubLinks: pack.hubLinks,
        keywordsHi: pack.keywordsHi.length ? pack.keywordsHi : content.keywordsHi,
        serpLedHub: pack.serpLedHub === true,
      }
    : content;
  return {
    ...merged,
    categoryFaqHi: mergeCategoryFaq(merged.slug, merged.nameHi, merged.categoryFaqHi),
  };
}

export function getCategoryContent(slug: string): CategoryContent {
  const exact = CATEGORY_CONTENT[slug];
  if (exact) {
    if (THIN_CATEGORY_SECTIONS.has(slug)) {
      const rich = buildNicheContentCS(slug, exact.nameHi, exact.shortDescHi);
      return withIntentFaq({
        ...exact,
        categoryFaqHi: rich.categoryFaqHi,
        keywordsHi: rich.keywordsHi,
      });
    }
    return withIntentFaq(exact);
  }
  const named = NEW_CATEGORY_NAMES_CS[slug];
  if (named) return withIntentFaq(buildNicheContentCS(slug, named.name, named.short));
  return {
    slug,
    nameHi: "Zdravotní produkty",
    taglineHi: "Vybrané produkty pro vaši pohodu",
    shortDescHi: "Vybrané zdravotní produkty s doručením po celé České republice.",
    subtitleHi: (b) => `${b} — přírodní doplněk stravy`,
    productIntro: (b) =>
      `${b} — přírodní doplněk stravy pro podporu každodenní pohody.`,
    productSections: () => [COMMON_SAFETY, COMMON_DELIVERY, COMMON_QUALITY],
    productFaq: () => COMMON_FAQ,
    categoryIntroHi:
      "Vybrané zdravotní produkty s doručením po celé České republice.",
    categorySectionsHi: [COMMON_SAFETY],
    categoryFaqHi: COMMON_FAQ,
    keywordsHi: ["doplňky stravy zdraví", "přírodní kapsle Česká republika"],
  };
}