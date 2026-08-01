import type { CategoryContent, ContentSection, FaqItem, HubLink, HubTable } from "./content.cs";
import type { CategoryDescriptor } from "./category-descriptors.cs";
import { getCategoryDescriptor } from "./category-descriptors.cs";
import { getNicheType, type NicheType } from "./niche-types";
import { problemRoleForShelf } from "./problem-vocabulary.cs";
import { GUIDE_PATH } from "./site";

const DELIVERY_CS: ContentSection = {
  heading: "Objednávka, doručení a platba",
  body:
    "Po odeslání objednávky Vás bude kontaktovat náš pracovník pro potvrzení adresy, množství a doby doručení. Doručujeme expresním kurýrem po celé České republice do 2-5 pracovních dnů; platíte při převzetí balíčku. Žádné zálohy ani skryté poplatky.",
};

const QUALITY_CS: ContentSection = {
  heading: "Záruka, vrácení a výměna",
  body:
    "Pokud produkt dorazí poškozený, nesedí nebo neodpovídá popisu, kontaktujte nás do 7 dnů od doručení. Zajistíme výměnu nebo vrácení peněz bez dalších nákladů. Spolupracujeme výhradně s oficiálními dodavateli, kteří mohou poskytnout dokumentaci ke každé položce.",
};

const SAFETY_SUPPLEMENT: ContentSection = {
  heading: "Bezpečnost a upozornění",
  body:
    "Tento produkt je doplněk stravy, nikoli lék. Není určen k diagnostice, léčbě nebo prevenci nemocí. Pokud užíváte léky na předpis, jste těhotná, kojíte nebo máte chronické onemocnění, poraďte se před použitím se svým lékařem. Nedoporučuje se osobám mladším 18 let.",
};

const SAFETY_DEVICE: ContentSection = {
  heading: "Bezpečné používání zařízení",
  body:
    "Toto zařízení je určeno pro domácí použití, pro kontrolu a pohodlí vašeho domova. Nenahrazuje lékařskou návštěvu a není diagnostickým nástrojem: v případě trvalých nebo zjevných příznaků se obraťte na odborníka. Před použitím si přečtěte pokyny, dodržujte doporučenou dobu používání a nepoužívejte na poškozenou pokožku. Kryto zárukou výrobce; české pokyny jsou součástí balení.",
};

const SAFETY_GARDEN: ContentSection = {
  heading: "Použití a údržba",
  body:
    "Produkty v této kategorii jsou určeny pro zahradu, záhony nebo venkovní prostory. Zkontrolujte kompatibilitu s podmínkami místnosti (vlhkost, teplota, sluneční světlo) a dodržujte pokyny k instalaci. Bateriové a elektronické předměty skladujte v zimě na suchém místě. Záruka výrobce na všechny produkty.",
};

const SAFETY_AUTO: ContentSection = {
  heading: "Kompatibilita a instalace",
  body:
    "Před nákupem zkontrolujte kompatibilitu s vaším vozem: rok výroby, typ napájení (12V zapalovač cigaret, USB), rozměry a způsob upevnění. Většinu produktů lze instalovat samostatně – pokyny jsou součástí balení. Pokud nesedí, vyměníme. Záruka výrobce na elektroniku.",
};

const SAFETY_HOME: ContentSection = {
  heading: "Materiály, péče a záruka",
  body:
    "Zkontrolujte materiál, rozměry a obsah balení v popisu produktu. Textilní výrobky se perou podle štítku výrobce. Na elektroniku a domácí spotřebiče se vztahuje oficiální záruka. Pokud produkt nesedí, výměna nebo vrácení peněz do 7 dnů.",
};

const SAFETY_FASHION: ContentSection = {
  heading: "Velikosti, materiály a výměna",
  body:
    "Před objednáním zkontrolujte tabulku velikostí v popisu produktu – to je nejrychlejší způsob, jak se vyhnout výměně. Složení, materiál a pokyny k péči jsou podrobně popsány. Špatná velikost nebo model: výměna nebo vrácení peněz do 7 dnů od doručení.",
};

function safetyFor(niche: NicheType): ContentSection {
  switch (niche) {
    case "supplement":
      return SAFETY_SUPPLEMENT;
    case "device":
      return SAFETY_DEVICE;
    case "garden":
      return SAFETY_GARDEN;
    case "auto":
      return SAFETY_AUTO;
    case "home":
      return SAFETY_HOME;
    case "fashion":
      return SAFETY_FASHION;
    default:
      return QUALITY_CS;
  }
}

const lc = (s: string) => s.toLowerCase();

/** Strip trailing punctuation so templates don't produce «…Česká republika..». */
function cleanTopic(s: string): string {
  return s.trim().replace(/[.…,;:]+$/u, "").trim();
}

function intro(name: string, shortDesc: string, niche: NicheType): string {
  const topic = cleanTopic(shortDesc || name);
  switch (niche) {
    case "supplement":
      return `${name} – vybrané přírodní doplňky stravy pro ${topic}. Doručujeme expresním kurýrem po celé České republice; platíte při převzetí balíčku, bez zálohy.`;
    case "device":
      return `${name} – domácí zařízení a masážní přístroje: ${topic}. Doručení expresním kurýrem po celé České republice; platíte při převzetí balíčku.`;
    case "garden":
      return `${name} – produkty pro zahradu a venkovní prostory: ${topic}. Doručení do 2-5 pracovních dnů po celé České republice; platíte při převzetí balíčku.`;
    case "auto":
      return `${name} – autodoplňky: ${topic}. Doručení expresním kurýrem po celé České republice; platíte při převzetí balíčku.`;
    case "home":
      return `${name} – produkty pro domácnost a každodenní použití: ${topic}. Doručení po celé České republice; platíte při převzetí balíčku.`;
    case "fashion":
      return `${name} – výběr s doručením do České republiky: ${topic}. Platíte při převzetí balíčku; výměna velikosti do 7 dnů.`;
    default:
      return `${name} – produkty pro domácnost a každodenní použití: ${topic}. Doručení po celé České republice; platíte při převzetí balíčku.`;
  }
}

function whatsInsideSection(name: string, shortDesc: string, niche: NicheType): ContentSection {
  const topic = cleanTopic(shortDesc || name);
  const headingByNiche: Record<NicheType, string> = {
    supplement: `Jaké produkty najdete v kategorii „${name}“?`,
    device: `Jaká zařízení najdete v kategorii „${name}“?`,
    garden: `Jaké produkty najdete v kategorii „${name}“?`,
    auto: `Jaké produkty najdete v kategorii „${name}“?`,
    home: `Jaké produkty najdete v kategorii „${name}“?`,
    fashion: `Co najdete v kategorii „${name}“?`,
    generic: `Jaké produkty najdete v kategorii „${name}“?`,
  };
  const intoMed = niche === "supplement" || niche === "device";
  const closing = intoMed
    ? "V nabídce najdete řešení v různých cenových kategoriích, abyste si mohli vybrat tu nejvhodnější variantu pro vaše potřeby."
    : "Toto není doplněk stravy ani lék – jedná se o produkt pro domácí použití: zkontrolujte materiály, rozměry a obsah balení na každé kartě produktu.";
  return {
    id: "produkty-v-kategorii",
    heading: headingByNiche[niche],
    body: `Zde najdete produkty pro ${topic}. ${closing}`,
  };
}

function howToChooseSection(name: string, niche: NicheType): ContentSection {
  const bullets =
    niche === "supplement"
      ? [
          "Složení a koncentrace účinných látek",
          "Forma: kapsle, kapky, krém nebo gel",
          "Délka kúry a cena za dávku",
          "Kompatibilita s léky — konzultace s lékařem",
        ]
      : niche === "device"
      ? [
          "Určení přístroje a napájení (220 V, USB, baterie)",
          "Provozní režimy a obsah balení",
          "Český návod a záruční list",
        ]
      : niche === "garden"
      ? [
          "Venkovní podmínky (déšť, mráz, slunce)",
          "Napájení (solární panel, baterie, síť)",
          "Materiál a odolnost krytu",
        ]
      : niche === "auto"
      ? [
          "Kompatibilita s vozem (rok, model, konektor)",
          "Napájení 12 V / USB a rozměry",
          "Způsob instalace",
        ]
      : niche === "fashion"
      ? [
          "Tabulka velikostí a rozměry",
          "Složení materiálu a péče",
          "Podmínky výměny velikosti",
        ]
      : [
          "Kvalita materiálu a zpracování",
          "Rozměry a hmotnost",
          "Obsah balení a záruka",
        ];
  const body =
    niche === "supplement"
      ? `Vyberte podle cíle a formy. Sledujte transparentní složení a realistickou délku kúry — doplněk stravy není lék.`
      : niche === "device"
      ? `Zkontrolujte určení, napájení a obsah balení. Domácí přístroj nenahrazuje lékařskou diagnózu.`
      : `Porovnejte specifikace na kartě produktu a podmínky doručení po České republice.`;
  return {
    id: "jak-vybrat",
    heading: `Jak vybrat produkt ${name.toLowerCase()}`,
    body,
    bullets,
  };
}

function proKohoSection(name: string, shortDesc: string, niche: NicheType): ContentSection {
  const topic = cleanTopic(shortDesc || name);
  return {
    id: "pro-koho",
    heading: `Pro koho je kategorie „${name}“`,
    body:
      niche === "supplement"
        ? `Katalog ocení dospělé, kteří hledají podporu v oblasti „${topic}“. Doplňky stravy jsou součástí režimu — při akutních příznacích navštivte lékaře.`
        : `Výběr produktů pro „${topic}“ s doručením po České republice a platbou na dobírku.`,
  };
}

function defaultHubTable(name: string, niche: NicheType): HubTable {
  if (niche === "supplement") {
    return {
      caption: `Formy v kategorii „${name}“ — rychlé srovnání`,
      headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
      rows: [
        ["Kapsle / tablety", "Denní vnitřní podpora", "Dávka, délka kúry, složení"],
        ["Kapky / tinktura", "Flexibilní dávkování", "Chuť, obsah alkoholu, návod"],
        ["Gel / krém", "Lokální aplikace", "Frekvence nanášení, citlivost kůže"],
      ],
    };
  }
  if (niche === "device") {
    return {
      caption: `Zařízení „${name}“ — na co se dívat`,
      headers: ["Kritérium", "Proč záleží", "Tip"],
      rows: [
        ["Napájení", "Domácí použití", "220 V / USB / baterie"],
        ["Režimy", "Komfort a bezpečnost", "Český návod v balení"],
        ["Záruka", "Ochrana nákupu", "Záruční list výrobce"],
      ],
    };
  }
  return {
    caption: `Jak porovnat produkty „${name}“`,
    headers: ["Kritérium", "Proč záleží", "Tip"],
    rows: [
      ["Specifikace", "Aby produkt seděl", "Rozměry, materiál, obsah balení"],
      ["Cena", "Poměr cena/užitek", "Nejen akční balení"],
      ["Doručení", "Rychlost a pohodlí", "Dobírka, 2–5 pracovních dnů"],
    ],
  };
}

function defaultHubLinks(slug: string, name: string): HubLink[] {
  return [
    { label: `Průvodce výběrem: ${name}`, path: `${GUIDE_PATH}/${slug}` },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
  ];
}

function safetyAsHubSection(safety: ContentSection): ContentSection {
  return {
    ...safety,
    id: safety.id ?? "bezpecnost",
    heading: safety.heading.includes("Bezpečnost")
      ? safety.heading
      : `Bezpečnost a kdy k lékaři`,
  };
}

export function editorialHowToChooseBody(slug: string, name: string): string {
  return howToChooseSection(name, getNicheType(slug)).body.replace(/\n/g, " ");
}

function nicheFaq(name: string, niche: NicheType): FaqItem[] {
  const base: FaqItem[] = [
    {
      q: "Musím platit předem?",
      a: "Ne. Všechny objednávky zasíláme expresním kurýrem do České republiky a platba probíhá při převzetí balíčku.",
    },
    {
      q: "Jak dlouho trvá doručení?",
      a: "Obvykle 2-5 pracovních dnů expresním kurýrem po celé České republice. Po odeslání Vám zašleme SMS s kódem pro sledování zásilky.",
    },
    {
      q: "Co když se mi produkt nelíbí?",
      a: "Kontaktujte nás do 7 dnů – zajistíme výměnu nebo vrácení peněz bez dalších nákladů.",
    },
  ];
  const nicheQuestions: Record<NicheType, FaqItem[]> = {
    supplement: [
      {
        q: `Nahrazuje produkt „${name}“ léky?`,
        a: "Ne. Jedná se o doplněk stravy, nikoli lék. Pokud užíváte léky na předpis, pokračujte v terapii a poraďte se se svým lékařem o kompatibilitě.",
      },
      {
        q: "Je vhodný pro těhotné ženy nebo nezletilé?",
        a: "Nedoporučuje se osobám mladším 18 let, těhotným nebo kojícím ženám bez specifické lékařské konzultace.",
      },
      {
        q: `Jak dlouho trvá kúra v kategorii „${name}“?`,
        a: "Obvykle 4-12 týdnů pravidelného užívání podle schématu uvedeného na obalu. První známky se obvykle objevují po 2-3 týdnech; pro stabilní účinek se doporučuje dokončit kúru.",
      },
      {
        q: "Má vedlejší účinky?",
        a: "Složení je přírodní, ale je možná individuální citlivost na rostlinné extrakty. Před použitím si pečlivě přečtěte složení, zejména v případě alergií nebo užívání léků na předpis.",
      },
    ],
    device: [
      {
        q: "Je na zařízení záruka?",
        a: "Ano – na všechna zařízení se vztahuje záruka výrobce. V balení najdete pokyny a záruční list.",
      },
      {
        q: "Nahrazuje zařízení lékaře?",
        a: "Ne. Jedná se o zařízení pro domácí kontrolu nebo pohodlí, nikoli diagnostický přístroj. V případě trvalých nebo zjevných příznaků se obraťte na lékaře.",
      },
      {
        q: "Jak často se může používat?",
        a: "Dodržujte dobu a frekvenci uvedenou v pokynech. Mezi sekcemi jsou nutné přestávky, aby se tělo mohlo přizpůsobit.",
      },
      {
        q: "Co je součástí balení?",
        a: "Zařízení, kabel/napájecí adaptér (pokud je součástí), české pokyny a záruční list. Podrobnosti v popisu každého produktu.",
      },
    ],
    garden: [
      {
        q: "Lze jej používat venku i v zimě?",
        a: "Většina produktů je určena pro teplé období. Před mrazem skladujte bateriové a elektronické produkty na suchém místě – dodržujte pokyny výrobce.",
      },
      {
        q: "Je nutné připojení k síti?",
        a: "Mnoho produktů funguje na solární energii nebo baterii – bez připojení 220 V. Zkontrolujte vlastnosti na stránce produktu.",
      },
      {
        q: "Je chráněn proti dešti?",
        a: "Stupeň ochrany (IP44/IP65 atd.) je uveden na stránce produktu. Kryt je odolný proti povětrnostním vlivům; připojení musí být chráněno.",
      },
      {
        q: "Jak dlouho trvá nabíjení?",
        a: "Obvykle 6–12 hodin, v závislosti na modelu a provozním režimu. U solárních produktů se baterie nabíjí 6–8 hodin na slunci.",
      },
    ],
    auto: [
      {
        q: "Je kompatibilní s mým autem?",
        a: "Na stránce produktu najdete kompatibilní modely, typ napájení (12 V nebo USB) a rozměry. Pokud nesedí, vyměníme.",
      },
      {
        q: "Je obtížné ho nainstalovat sám?",
        a: "Většina produktů je Plug & Play: připojení k zapalovači cigaret nebo USB. Pokyny jsou v balení.",
      },
      {
        q: "Vybíjí baterii auta?",
        a: "Spotřeba proudu v pohotovostním režimu je minimální. Při delším stání odpojte ze zapalovače cigaret nebo použijte USB port, který se vypne při vypnutí motoru.",
      },
      {
        q: "Je na elektroniku záruka?",
        a: "Ano, záruka výrobce. Uschovejte si balení a účtenku – v případě závady bez problémů vyměníme.",
      },
    ],
    home: [
      {
        q: "Z jakých materiálů je vyroben?",
        a: "Složení látky, typ plastu a obsah balení jsou uvedeny v detailech produktu. Pokud chybí důležité informace, zeptejte se operátora při potvrzení objednávky.",
      },
      {
        q: "Lze prát?",
        a: "U textilií a doplňků dodržujte štítek. Elektronická zařízení čistěte suchým hadříkem.",
      },
      {
        q: "Je bezpečný pro děti?",
        a: "Většina produktů je určena pro dospělé a děti pod dohledem. Věková hranice je uvedena v popisu – zkontrolujte před objednáním.",
      },
      {
        q: "Jak dlouho produkt vydrží?",
        a: "Závisí na použití a péči. Na domácí elektroniku se vztahuje záruka výrobce; textilie a doplňky lze při správné péči používat roky.",
      },
    ],
    fashion: [
      {
        q: "Jak vybrat velikost?",
        a: "Použijte tabulku velikostí v popisu produktu – podle délky chodidla, obvodu nebo výšky. V případě nejistoty zvolte o půl čísla větší.",
      },
      {
        q: "Lze vyměnit velikost?",
        a: "Ano – výměna velikosti do 7 dnů od doručení. Produkt musí být nepoužitý, s originálními štítky.",
      },
      {
        q: "Jaké je složení látky?",
        a: "Složení je uvedeno v detailech každého produktu. Dbejte na sezónnost – letní modely z lehkého materiálu, zimní modely s podšívkou nebo výplní.",
      },
      {
        q: "Odpovídá barva obrázkům?",
        a: "Fotografie byly pořízeny za přirozeného světla. Může se vyskytnout malá odchylka kvůli nastavení obrazovky; barva je popsána i textově, aby se předešlo nedorozuměním.",
      },
    ],
    generic: [],
  };
  return [...nicheQuestions[niche], ...base];
}

function keywordsFor(name: string, d: CategoryDescriptor): string[] {
  const base = [
    lc(name),
    `${lc(name)} česká republika`,
    `${lc(name)} nákup`,
    `${lc(name)} cena`,
    `${lc(name)} doprava`,
  ];
  return Array.from(new Set([...(d.primaryKeywords ?? []), ...base])).slice(0, 10);
}

function productIntroFor(
  brand: string,
  niche: NicheType,
  name: string,
  shortDesc: string,
  categorySlug?: string,
): string {
  const topic = shortDesc || lc(name);
  switch (niche) {
    case "supplement": {
      const shelfRole = categorySlug ? problemRoleForShelf(categorySlug, null, "capsules") : null;
      const focus = shelfRole ?? topic;
      return `${brand} – přírodní doplněk stravy (${focus}). Není lék – před použitím se poraďte se svým lékařem.`;
    }
    case "device":
      return `${brand} – zařízení pro domácí použití (${topic}). Balení obsahuje pokyny a záruku výrobce.`;
    case "garden":
      return `${brand} – zahradní a venkovní produkt (${topic}). Pro venkovní použití dle pokynů.`;
    case "auto":
      return `${brand} — autodoplněk (${topic}). Zkontrolujte kompatibilitu a napájení (12V / USB) ve specifikaci.`;
    case "fashion":
      return `${brand} — model z kategorie „${name}“ (${topic}). Před objednáním zkontrolujte tabulku velikostí.`;
    case "home":
      return `${brand} — produkt pro domácnost (${topic}). Materiály a obsah balení jsou uvedeny ve specifikaci.`;
    default:
      return `${brand} — produkt pro domácnost (${topic}). Materiály a obsah balení jsou uvedeny ve specifikaci.`;
  }
}

function productSubtitleFor(brand: string, niche: NicheType, name: string): string {
  switch (niche) {
    case "supplement":
      return `${brand} — přírodní doplněk stravy (${lc(name)})`;
    case "device":
      return `${brand} — zařízení pro domácí použití`;
    case "garden":
      return `${brand} — zahradní a venkovní produkt`;
    case "auto":
      return `${brand} — autodoplněk`;
    case "fashion":
      return `${brand} — ${lc(name)} s doručením do České republiky`;
    case "home":
      return `${brand} — produkt pro domácnost`;
    default:
      return `${brand} — ${lc(name)}`;
  }
}

function productFaqFor(brand: string, niche: NicheType): FaqItem[] {
  switch (niche) {
    case "supplement":
      return [
        {
          q: `Nahrazuje ${brand} léky?`,
          a: "Ne, jedná se o doplněk stravy. Nepřerušujte předepsanou terapii bez lékařské rady.",
        },
        {
          q: "Jak zaplatím a obdržím objednávku?",
          a: "Doručujeme po celé České republice do 2–5 pracovních dnů. Platba na dobírku — bez zálohy.",
        },
        {
          q: "Co když se mi produkt nelíbí?",
          a: "Napište nám do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
        },
      ];
    case "device":
      return [
        {
          q: `Jaká je záruka na zařízení ${brand}?`,
          a: "Záruka výrobce. Pokyny a záruční list jsou součástí balení.",
        },
        {
          q: "Jak zaplatím a obdržím objednávku?",
          a: "Expresním kurýrem do České republiky do 2–5 pracovních dnů. Platba na dobírku – bez zálohy.",
        },
        {
          q: "Co když se mi produkt nelíbí?",
          a: "Kontaktujte nás do 7 dnů – zajistíme výměnu nebo vrácení peněz.",
        },
      ];
    case "auto":
      return [
        {
          q: `Je ${brand} kompatibilní s mým autem?`,
          a: "Zkontrolujte kompatibilní modely a napájení ve specifikaci. Pokud nesedí, vyměníme.",
        },
        {
          q: "Jak zaplatím a obdržím objednávku?",
          a: "Kurýrem doručujeme do České republiky do 2–5 pracovních dnů. Platba na dobírku — bez zálohy.",
        },
        {
          q: "Co když se mi produkt nelíbí?",
          a: "Napište nám do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
        },
      ];
    case "fashion":
      return [
        {
          q: "Jak vybrat velikost?",
          a: "Použijte tabulku velikostí na stránce produktu. V případě nejistoty zvolte o půl čísla větší.",
        },
        {
          q: "Jak zaplatím a obdržím objednávku?",
          a: "Doručení do České republiky do 2–5 pracovních dnů. Platba na dobírku – bez zálohy.",
        },
        {
          q: "Co když se mi produkt nelíbí?",
          a: "Kontaktujte nás do 7 dnů – zajistíme výměnu nebo vrácení peněz.",
        },
      ];
    default:
      return [
        {
          q: "Jak zaplatím a obdržím objednávku?",
          a: "Doručujeme po celé České republice do 2–5 pracovních dnů. Platba na dobírku — bez zálohy.",
        },
        {
          q: "Co když produkt není vhodný?",
          a: "Napište nám do 7 dnů — zajistíme výměnu nebo vrácení peněz.",
        },
      ];
  }
}

export function buildNicheContentCS(slug: string, name: string, shortDesc: string): CategoryContent {
  const d = getCategoryDescriptor(slug);
  const niche = getNicheType(slug);
  const safety = safetyFor(niche);
  const hubSafety = safetyAsHubSection(safety);
  return {
    slug,
    nameHi: name,
    taglineHi:
      niche === "supplement"
        ? `${name} — pečlivě vybrané přírodní doplňky stravy`
        : niche === "device"
        ? `${name} — zařízení pro domácnost`
        : niche === "garden"
        ? `${name} — produkty pro zahradu a venkovní prostory`
        : niche === "auto"
        ? `${name} — užitečné autodoplňky`
        : niche === "fashion"
        ? `${name} — výběr s doručením do České republiky`
        : `${name} — produkty pro domácnost a každodenní použití`,
    shortDescHi: shortDesc,
    subtitleHi: (b) => productSubtitleFor(b, niche, name),
    productIntro: (b) => productIntroFor(b, niche, name, shortDesc, slug),
    productSections: () => [safety, DELIVERY_CS, QUALITY_CS],
    productFaq: (b) => productFaqFor(b, niche),
    categoryIntroHi: intro(name, shortDesc, niche),
    categorySectionsHi: [
      proKohoSection(name, shortDesc, niche),
      howToChooseSection(name, niche),
      hubSafety,
    ],
    categoryFaqHi: nicheFaq(name, niche),
    keywordsHi: keywordsFor(name, d),
    hubTables: [defaultHubTable(name, niche)],
    hubLinks: defaultHubLinks(slug, name),
  };
}