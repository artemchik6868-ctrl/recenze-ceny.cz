import { SITE } from "./site";

export type CityFaq = { q: string; a: string };

export type CityEtaPoint = { t: string; b: string };

export type CityPage = {
  slug: string;
  name: string;
  h1: string;
  lead: string;
  /** Short line for /delivery index cards */
  etaSummary: string;
  /** Soft city-specific note under ETA band */
  etaNote: string;
  etaPoints: CityEtaPoint[];
  productsH: string;
  faq: CityFaq[];
  metaTitle: string;
  metaDescription: string;
};

export const CITIES: readonly CityPage[] = [
  {
    slug: "praha",
    name: "Praha",
    h1: "Doručení na dobírku do Prahy",
    lead:
      "Kurýr přiveze balíček na pražskou adresu v diskrétním obalu; platíte hotově nebo kartou až při převzetí.",
    etaSummary: "Hlavní město · obvykle 1–3 pracovní dny",
    etaNote:
      "V Praze a okolí většina zásilek dorazí za 1–3 pracovní dny; v špičce nebo na okraji města až do 5 pracovních dnů.",
    etaPoints: [
      {
        t: "1–3 pracovní dny",
        b: "Typická doba expresního doručení v Praze.",
      },
      {
        t: "Okraj města",
        b: "V rušných dnech nejpozději do 5 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Na vnějším obalu není název produktu ani značka.",
      },
    ],
    productsH: "Často prohlížené v Praze",
    faq: [
      {
        q: "Za kolik dní dorazí objednávka do Prahy?",
        a: "Po potvrzení obvykle 1–3 pracovní dny. V rušném období nebo na okraji města až 5 pracovních dnů.",
      },
      {
        q: "Je v Praze platba na dobírku?",
        a: "Ano. Nevyžadujeme platbu předem; kurýrovi zaplatíte hotově nebo kartou při převzetí.",
      },
      {
        q: "Platí stejná pravidla pro všechny části Prahy?",
        a: "Ano — stejná pravidla. Adresu upřesníme při telefonickém potvrzení.",
      },
      {
        q: "Co je napsáno na balíčku?",
        a: "Používáme neutrální obal; zvenku není možné poznat obsah.",
      },
    ],
    metaTitle: `Praha — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Prahy: diskrétní balení, telefonické potvrzení, obvykle 1–3 pracovní dny. Vyberte z katalogu Recenze Ceny.",
  },
  {
    slug: "brno",
    name: "Brno",
    h1: "Doručení na dobírku do Brna",
    lead:
      "Kurýr doručí na brněnskou adresu; zboží nejdřív uvidíte, teprve potom platíte — bez čísla karty a bez zálohy.",
    etaSummary: "Jižní Morava · obvykle 2–4 pracovní dny",
    etaNote:
      "V Brně a okolí je standard 2–4 pracovní dny; vzdálenější obce kraje až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–4 pracovní dny",
        b: "Typická doba expresního kurýra v Brně.",
      },
      {
        t: "Okresní obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Neutrální obal — bez názvu značky venku.",
      },
    ],
    productsH: "Často prohlížené v Brně",
    faq: [
      {
        q: "Jak rychle doručíte do Brna?",
        a: "Většina objednávek dorazí za 2–4 pracovní dny. Ve vzdálenějších obcích až 7 pracovních dnů.",
      },
      {
        q: "Přijímáte v Brně dobírku?",
        a: "Ano. Platbu bereme jen při převzetí — hotově nebo kartou.",
      },
      {
        q: "Jak ověřujete adresu?",
        a: "Po objednávce operátor zavolá do 15 minut; ověří jméno, telefon a adresu doručení.",
      },
      {
        q: "Kolik stojí doprava?",
        a: "Přesnou částku sdělíme při telefonickém potvrzení; závisí na adrese a hmotnosti balíku.",
      },
    ],
    metaTitle: `Brno — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Brna: 2–4 pracovní dny, diskrétní balení, telefonické potvrzení adresy. Katalog Recenze Ceny.",
  },
  {
    slug: "ostrava",
    name: "Ostrava",
    h1: "Doručení na dobírku do Ostravy",
    lead:
      "Stejný tok dobírky pro Ostravu a okolí: vyberete, potvrdíte telefonem, zaplatíte až u dveří.",
    etaSummary: "Moravskoslezský kraj · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Ostravě často 2–5 pracovních dnů; ve vzdálenějších obcích kraje až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Typické okno doručení v Ostravě.",
      },
      {
        t: "Vzdálenější obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Obsah není na vnějším obalu uveden.",
      },
    ],
    productsH: "Často prohlížené v Ostravě",
    faq: [
      {
        q: "Jaká je doba doručení do Ostravy?",
        a: "Obvykle 2–5 pracovních dnů. Ve vzdálenějších lokalitách až 7 pracovních dnů.",
      },
      {
        q: "Platím v Ostravě jen na dobírku?",
        a: "Ano — předem kartu ani převod nevyžadujeme; platba je při převzetí.",
      },
      {
        q: "Můžu více produktů v jednom balíku?",
        a: "Ano. Při hovoru sloučíme do jedné zásilky a ušetříte na dopravě.",
      },
      {
        q: "Mám právo na vrácení?",
        a: "Pokud je obal neporušený, můžete vrátit do 14 dnů od převzetí.",
      },
    ],
    metaTitle: `Ostrava — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Ostravy: diskrétní balení, 2–5 pracovních dnů, telefonické potvrzení. Katalog Recenze Ceny.",
  },
  {
    slug: "plzen",
    name: "Plzeň",
    h1: "Doručení na dobírku do Plzně",
    lead:
      "Do Plzně dorazíme expresním kurýrem; balíček nejdřív uvidíte, teprve potom platíte — bez předplatného.",
    etaSummary: "Západní Čechy · obvykle 2–4 pracovní dny",
    etaNote:
      "V Plzni a blízkém okolí je běžných 2–4 pracovní dny; vzdálenější obce až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–4 pracovní dny",
        b: "Standardní doba ve městě Plzeň.",
      },
      {
        t: "Okresní obce",
        b: "Doručení nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Neutrální krabice — venku bez údajů o produktu.",
      },
    ],
    productsH: "Často prohlížené v Plzni",
    faq: [
      {
        q: "Kdy dorazí objednávka do Plzně?",
        a: "Po potvrzení většina zásilek za 2–4 pracovní dny; ve vzdálenějších obcích až 7 dnů.",
      },
      {
        q: "Je v Plzni dobírka?",
        a: "Ano. Platíte kurýrovi při převzetí.",
      },
      {
        q: "Můžu objednávku zrušit?",
        a: "Dokud balíček neodejde, při hovoru s operátorem lze zrušit nebo změnit adresu.",
      },
      {
        q: "Jsou produkty originální?",
        a: "Ano. Odesíláme po kontrole šarže a expirace; doplňky stravy nejsou léčiva.",
      },
    ],
    metaTitle: `Plzeň — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Plzně: 2–4 pracovní dny, diskrétní balení, telefonické potvrzení. Recenze Ceny.",
  },
  {
    slug: "liberec",
    name: "Liberec",
    h1: "Doručení na dobírku do Liberce",
    lead:
      "Do Liberce a okolí stejná jistota: diskrétní balení, dobírka, telefonické potvrzení.",
    etaSummary: "Liberecký kraj · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Liberci je typických 2–5 pracovních dnů; v horských a vzdálenějších obcích až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Častá doba doručení v Liberci.",
      },
      {
        t: "Horské obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Neutrální obal je standard.",
      },
    ],
    productsH: "Často prohlížené v Liberci",
    faq: [
      {
        q: "Jak dlouho trvá doručení do Liberce?",
        a: "Obvykle 2–5 pracovních dnů. Ve vzdálenějších obcích až 7 pracovních dnů.",
      },
      {
        q: "Doručíte na adresu v horách nebo na chatě?",
        a: "Ano — krátkodobé adresy upřesníme při telefonickém potvrzení.",
      },
      {
        q: "Platí v Liberci dobírka?",
        a: "Ano. Platba předem není; platíte při převzetí.",
      },
      {
        q: "Je obsah balíčku zvenku vidět?",
        a: "Ne. Na vnějším obalu není název produktu ani značka.",
      },
    ],
    metaTitle: `Liberec — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Liberce: diskrétní balení, 2–5 pracovních dnů, telefonické potvrzení. Katalog Recenze Ceny.",
  },
  {
    slug: "olomouc",
    name: "Olomouc",
    h1: "Doručení na dobírku do Olomouce",
    lead:
      "Kurýr přiveze na olomouckou adresu; výběr z katalogu, platba až u dveří.",
    etaSummary: "Střední Morava · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Olomouci je běžných 2–5 pracovních dnů; v okolních obcích kraje až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Typická doba ve městě Olomouc.",
      },
      {
        t: "Okresní obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Obsah zvenku nelze přečíst.",
      },
    ],
    productsH: "Často prohlížené v Olomouci",
    faq: [
      {
        q: "Jak dlouho trvá zásilka do Olomouce?",
        a: "Většina balíčků dorazí za 2–5 pracovních dnů; ve vzdálenějších obcích až 7 dnů.",
      },
      {
        q: "Je v Olomouci dobírka?",
        a: "Ano — hotově nebo kartou při převzetí.",
      },
      {
        q: "Proč voláte telefonem?",
        a: "Kvůli ověření adresy a produktu. Číslo karty ani CVV nikdy nechceme.",
      },
      {
        q: "Jak probíhá vrácení?",
        a: "Do 14 dnů při neporušeném obalu; detaily na stránce /returns.",
      },
    ],
    metaTitle: `Olomouc — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Olomouce: 2–5 pracovních dnů, diskrétní balení, potvrzení operátorem. Recenze Ceny.",
  },
  {
    slug: "usti-nad-labem",
    name: "Ústí nad Labem",
    h1: "Doručení na dobírku do Ústí nad Labem",
    lead:
      "Do Ústí nad Labem stejná celorepubliková pravidla: dobírka, diskrétní balení, sledování zásilky.",
    etaSummary: "Ústecký kraj · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Ústí nad Labem většina zásilek dorazí za 2–5 pracovních dnů; ve vzdálenějších obcích až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Častá doba expresního doručení v Ústí.",
      },
      {
        t: "Vzdálenější obce",
        b: "Doručení nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Standard neutrální krabice.",
      },
    ],
    productsH: "Často prohlížené v Ústí nad Labem",
    faq: [
      {
        q: "Jaká je doba doručení do Ústí nad Labem?",
        a: "Obvykle 2–5 pracovních dnů; ve vzdálenějších lokalitách až 7 pracovních dnů.",
      },
      {
        q: "Platí v Ústí dobírka?",
        a: "Ano. Platbu předem nebereme.",
      },
      {
        q: "Dostanu sledovací kód?",
        a: "Jakmile balíček předáme kurýrovi, pošleme informace SMS nebo e-mailem.",
      },
      {
        q: "Lze sloučit produkty?",
        a: "Ano — při hovoru vytvoříme jednu zásilku.",
      },
    ],
    metaTitle: `Ústí nad Labem — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Ústí nad Labem: diskrétní balení, 2–5 pracovních dnů, telefonické potvrzení. Katalog Recenze Ceny.",
  },
  {
    slug: "hradec-kralove",
    name: "Hradec Králové",
    h1: "Doručení na dobírku do Hradce Králové",
    lead:
      "Produkty z katalogu doručíme do Hradce Králové na dobírku — bez skrytých poplatků, nejdřív potvrzení.",
    etaSummary: "Východní Čechy · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Hradci Králové je typických 2–5 pracovních dnů; v širším kraji až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Běžná doba ve městě Hradec Králové.",
      },
      {
        t: "Širší kraj",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Venku nejsou údaje o produktu.",
      },
    ],
    productsH: "Často prohlížené v Hradci Králové",
    faq: [
      {
        q: "Za kolik dní dorazí objednávka do Hradce Králové?",
        a: "Většina zásilek za 2–5 pracovních dnů; ve vzdálenějších obcích až 7 dnů.",
      },
      {
        q: "Je v Hradci Králové dobírka?",
        a: "Ano. Platíte při převzetí.",
      },
      {
        q: "Je cena dopravy známá předem?",
        a: "Přesnou částku řekne operátor při potvrzení; závisí na adrese.",
      },
      {
        q: "Co když je balíček poškozený?",
        a: "Při poškození sepište s kurýrem zápis; výměnu nebo vrácení řešíme přes podporu.",
      },
    ],
    metaTitle: `Hradec Králové — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Hradce Králové: 2–5 pracovních dnů, diskrétní balení, telefonické potvrzení adresy. Recenze Ceny.",
  },
  {
    slug: "ceske-budejovice",
    name: "České Budějovice",
    h1: "Doručení na dobírku do Českých Budějovic",
    lead:
      "Do Českých Budějovic dorazíme expresním kurýrem; zboží nejdřív uvidíte, kartu nesdílíte.",
    etaSummary: "Jižní Čechy · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Českých Budějovicích je běžných 2–5 pracovních dnů; v okolních obcích až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Typická doba ve městě České Budějovice.",
      },
      {
        t: "Okresní obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Neutrální obal — soukromí je standard.",
      },
    ],
    productsH: "Často prohlížené v Českých Budějovicích",
    faq: [
      {
        q: "Jak dlouho trvá doručení do Českých Budějovic?",
        a: "Obvykle 2–5 pracovních dnů; ve vzdálenějších obcích až 7 pracovních dnů.",
      },
      {
        q: "Je v Budějovicích dobírka?",
        a: "Ano — hotově nebo kartou při převzetí.",
      },
      {
        q: "Objednávka do 16:00 odejde tentýž den?",
        a: "Ve většině případů ano; přesný odchod závisí na potvrzení operátorem.",
      },
      {
        q: "Kdo je lékařský poradce?",
        a: "Popisy kontroluje praktický lékař; detaily na stránce /medical-expert.",
      },
    ],
    metaTitle: `České Budějovice — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Českých Budějovic: diskrétní balení, 2–5 pracovních dnů, telefonické potvrzení. Produkty Recenze Ceny.",
  },
  {
    slug: "pardubice",
    name: "Pardubice",
    h1: "Doručení na dobírku do Pardubic",
    lead:
      "Stejný model dobírky i do Pardubic: vyberete, potvrdíte, zaplatíte až u dveří.",
    etaSummary: "Východní Čechy · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Pardubicích je typických 2–5 pracovních dnů; ve vzdálenějších obcích až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Běžná doba ve městě Pardubice.",
      },
      {
        t: "Vzdálenější obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Venku není název značky ani produktu.",
      },
    ],
    productsH: "Často prohlížené v Pardubicích",
    faq: [
      {
        q: "Za kolik dní dorazí objednávka do Pardubic?",
        a: "Obvykle 2–5 pracovních dnů; ve vzdálenějších obcích až 7 dnů.",
      },
      {
        q: "Je v Pardubicích dobírka?",
        a: "Ano. Platbu předem nevyžadujeme.",
      },
      {
        q: "Můžu zvolit výdejní místo?",
        a: "Možnosti doručení na adresu nebo vhodné místo probereme při telefonickém potvrzení.",
      },
      {
        q: "Jsou produkty doplňky stravy?",
        a: "Katalog obsahuje doplňky a spotřební zboží — nejsou léčiva. Při pochybách se poraďte s lékařem.",
      },
    ],
    metaTitle: `Pardubice — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Pardubic: 2–5 pracovních dnů, diskrétní balení, potvrzení operátorem. Recenze Ceny.",
  },
  {
    slug: "zlin",
    name: "Zlín",
    h1: "Doručení na dobírku do Zlína",
    lead:
      "Do Zlína posíláme se stejnými zárukami jako v celé ČR: diskrétní balení, dobírka, sledovací kód.",
    etaSummary: "Zlínský kraj · obvykle 2–5 pracovních dnů",
    etaNote:
      "Ve Zlíně většina balíčků dorazí za 2–5 pracovních dnů; ve vzdálenějších obcích až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Typické okno expresního doručení ve Zlíně.",
      },
      {
        t: "Vzdálenější obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Neutrální obal je povinný standard.",
      },
    ],
    productsH: "Často prohlížené ve Zlíně",
    faq: [
      {
        q: "Jaká je doba doručení do Zlína?",
        a: "Obvykle 2–5 pracovních dnů; ve vzdálenějších lokalitách nejpozději 7 pracovních dnů.",
      },
      {
        q: "Platí ve Zlíně dobírka?",
        a: "Ano — platbu bereme jen při převzetí.",
      },
      {
        q: "Můžu změnit adresu?",
        a: "Dokud balíček neodejde, změnu uděláte při hovoru s operátorem nebo přes podporu.",
      },
      {
        q: "Co je diskrétní balení?",
        a: "Na vnější krabici není produkt ani značka; obsah znáte jen vy.",
      },
    ],
    metaTitle: `Zlín — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Zlína: diskrétní balení, 2–5 pracovních dnů, telefonické potvrzení. Katalog Recenze Ceny.",
  },
  {
    slug: "karlovy-vary",
    name: "Karlovy Vary",
    h1: "Doručení na dobírku do Karlových Varů",
    lead:
      "Kurýr doručí na adresu v Karlových Varech; nejdřív zboží uvidíte, teprve potom platíte — bez předplatného.",
    etaSummary: "Karlovarský kraj · obvykle 2–5 pracovních dnů",
    etaNote:
      "V Karlových Varech je běžných 2–5 pracovních dnů; v okolních obcích až do 7 pracovních dnů.",
    etaPoints: [
      {
        t: "2–5 pracovních dnů",
        b: "Typická doba ve městě Karlovy Vary.",
      },
      {
        t: "Okresní obce",
        b: "Nejpozději do 7 pracovních dnů.",
      },
      {
        t: "Diskrétní balení",
        b: "Neutrální krabice — obsah zůstává skrytý.",
      },
    ],
    productsH: "Často prohlížené v Karlových Varech",
    faq: [
      {
        q: "Kdy dorazí objednávka do Karlových Varů?",
        a: "Většina zásilek za 2–5 pracovních dnů; ve vzdálenějších obcích až 7 dnů.",
      },
      {
        q: "Je v Karlových Varech dobírka?",
        a: "Ano. Hotově nebo kartou při převzetí.",
      },
      {
        q: "Doručíte do hotelu nebo na krátkodobou adresu?",
        a: "Ano — přesnou adresu a příjemce uvedete při telefonickém potvrzení.",
      },
      {
        q: "Jaká je lhůta na vrácení?",
        a: "14 dnů od převzetí, pokud je obal neporušený.",
      },
    ],
    metaTitle: `Karlovy Vary — doručení a dobírka | ${SITE.name}`,
    metaDescription:
      "Doručení na dobírku do Karlových Varů: 2–5 pracovních dnů, diskrétní balení, telefonické potvrzení. Recenze Ceny.",
  },
] as const;

const BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

export function getCityBySlug(slug: string): CityPage | undefined {
  return BY_SLUG.get(slug);
}

export function cityPath(slug: string): string {
  return `/delivery/${slug}`;
}

export function siblingCities(slug: string): CityPage[] {
  return CITIES.filter((c) => c.slug !== slug);
}
