export const T = {
  siteName: "Recenze Ceny",
  tagline: "Nezávislý katalog cen a recenzí — s doručením po celé České republice",
  taglineShort: "Ceny · recenze · Praha",
  siteDescription:
    "Recenze Ceny je český katalog produktů s ověřenými popisy, jasnými cenami a doručením na dobírku. Objednávku potvrdíme telefonicky — platíte až při převzetí.",

  nav: {
    home: "Domů",
    categories: "Kategorie",
    products: "Produkty",
    about: "O nás",
    delivery: "Doručení",
    payment: "Platba",
    faq: "Nápověda",
    contact: "Kontakt",
    services: "Služby",
    blog: "Články",
  },
  badges: {
    cod: "Platba na dobírku",
    delivery: "Kurýr 2–5 dní",
    discreet: "Diskrétní balení",
    replacement: "14 dní na vrácení",
    verified: "Originál od výrobce",
    callBack: "Zpětné volání do 15 minut",
  },
  trustBar: [
    "Platba až při převzetí",
    "Doručení kurýrem zdarma",
    "14 dní na vrácení",
    "Diskrétní balení",
    "Originál od výrobce",
  ],
  home: {
    heroEyebrowFn: (_cats: number) => `Recenze Ceny · katalog pro Českou republiku`,
    heroTitleFn: (_n: number) =>
      `Recenze Ceny — přehledný katalog produktů a doplňků stravy v ČR`,
    heroLeadFn: (n: number, cats: number, fromEUR: number | null) =>
      `Prohlédněte si ${n}+ položek v ${cats} kategoriích${
        fromEUR ? ` (od ${fromEUR} Kč)` : ""
      }. Objednávku potvrdíme hovorem, balíček doveze kurýr — zaplatíte až u dveří.`,
    browseCategories: "Prohlédnout kategorie",
    bestsellers: "Aktuální výběr",
    statProductsFn: (n: number) => `${n}+ položek`,
    statCategoriesFn: (n: number) => `${n} kategorií`,
    statCitiesAll: "Celá ČR",
    statCod: "Dobírka",
    shopByNeed: "Podle potřeby",
    categoriesH: "Kam se podívat dřív",
    explore: "Otevřít kategorii",
    curatedForItaly: "Výběr redakce",
    deliveryEyebrow: "Doručení v ČR",
    heroViewProduct: "Detail produktu",
    heroVerified: "Lékařská revize obsahu",
    heroExpertBio: "Popisy kontroluje MUDr. Jan Novák, praktický lékař v Praze",
    heroReturns: "Vrácení",
    heroDeliveryDays: "Doručení",
    bestsellersH: "Co právě sledujeme",
    why: "Proč Recenze Ceny",
    aboutTitle: "Proč nám věří Praha a kraje",
    aboutBody:
      "Nejsme lékárna ani zázračný e-shop. Jsme katalog s ověřenými popisy, jasnou cenou a českým způsobem nákupu: zavoláme, dovezeme, zaplatíte až při převzetí. Bez předplatného a bez údajů o kartě.",
    howH: "Jak to funguje",
    howSub: "Od výběru k dobírce",
    howSteps: [
      {
        n: "01",
        t: "Vyberte položku",
        b: "Porovnejte cenu, formu a popis — bez marketingového šumu.",
      },
      {
        n: "02",
        t: "Nechte si zavolat",
        b: "Stačí jméno a telefon. Potvrdíme adresu do 15 minut.",
      },
      {
        n: "03",
        t: "Zaplaťte u dveří",
        b: "Kurýr dorazí za 2–5 dnů. Hotově nebo kartou při převzetí.",
      },
    ],
    citiesH: "Dobírka a doručení po České republice",
    citiesLead:
      "Stejná pravidla od Prahy po Ostravu: diskrétní balení, platba až při převzetí, 14 dní na vrácení neporušeného balíčku.",
    cities: [
      "Praha",
      "Brno",
      "Ostrava",
      "Plzeň",
      "Liberec",
      "Olomouc",
      "Ústí nad Labem",
      "Hradec Králové",
      "České Budějovice",
      "Pardubice",
      "Zlín",
      "Karlovy Vary",
    ],
    codH: "Dobírka bez překvapení",
    codLead:
      "V Česku je platba při převzetí pořád nejsrozumitelnější jistota. Proto nebereme peníze předem — balíček nejdřív uvidíte.",
    codPoints: [
      { t: "Žádná platba předem", b: "Nepožadujeme číslo karty ani zálohu." },
      { t: "Potvrzení hovorem", b: "Konzultant ověří jméno, telefon a adresu." },
      { t: "Kurýr 2–5 dnů", b: "Expresní doručení domů po celé republice." },
    ],
    faqH: "Než objednáte",
    faqKicker: "Otázky",
    faqViewAll: "Všechny otázky a odpovědi →",
    faq: [
      {
        q: "Jak probíhá platba?",
        a: "Jen při převzetí — hotově nebo kartou kurýrovi. Předem nic neplatíte.",
      },
      {
        q: "Jak rychle dorazí balíček?",
        a: "Obvykle 2–5 pracovních dnů po potvrzení. Objednávky do 16:00 často odesíláme ještě tentýž den.",
      },
      {
        q: "Je zboží originální?",
        a: "Ano. Spolupracujeme s výrobci a distributory; před odesláním kontrolujeme šarži, expiraci a pečeť.",
      },
      {
        q: "Mohu zboží vrátit?",
        a: "Do 14 dnů od převzetí, pokud je obal a pečeť neporušené. Zpětnou dopravu domluvíme individuálně.",
      },
      {
        q: "Proč mi voláte?",
        a: "Jen kvůli potvrzení jména, telefonu a adresy. Nikdy nežádáme CVV ani údaje o kartě.",
      },
      {
        q: "Lze spojit více produktů?",
        a: "Ano — během hovoru sestavíme jednu zásilku a ušetříte na dopravě.",
      },
    ],
    testimonialsH: "Hlasy zákazníků",
    testimonialsRating: "Hodnocení 4,8 / 5",
    testimonials: [
      {
        name: "Anna K.",
        city: "Praha",
        text: "Balíček přišel za čtyři dny, konzultant mluvil věcně. Žádný nátlak.",
        rating: 5,
      },
      {
        name: "Petr R.",
        city: "Brno",
        text: "Dobírka mi sedí. Produkt odpovídá popisu, objednám znovu.",
        rating: 5,
      },
      {
        name: "Magdalena B.",
        city: "Ostrava",
        text: "Zodpověděli otázky trpělivě. Doporučila jsem sestře.",
        rating: 5,
      },
    ],
    eat: {
      h: "Na čem stojíme",
      items: [
        {
          t: "Jasné popisy",
          b: "Složení, použití a omezení uvádíme přímo — bez zázračných slibů.",
          link: null as null | { href: string; label: string },
        },
        {
          t: "Lékařská revize",
          b: "Obsah kontroluje MUDr. Jan Novák, praktický lékař v Praze.",
          link: { href: "/medical-expert", label: "Profil poradce →" },
        },
        {
          t: "Česká dobírka",
          b: "Platíte až u dveří. Konzultant nikdy nepožaduje údaje o kartě.",
          link: null as null | { href: string; label: string },
        },
      ],
    },
    metaTitleFn: (_n: number) => `Katalog produktů a recenzí v ČR · Ceny a dobírka`,
    metaDescFn: (_n: number, _cats: number, _fromEUR: number | null) =>
      `Přehledný katalog produktů a doplňků stravy v ČR. Ověřené recenze, jasné ceny a doručení na dobírku do 2–5 dnů. Zaplaťte až při převzetí bez platby předem.`,
    seoContent: {
      sections: [
        {
          h: "Online katalog produktů s jasnou cenou a ověřenými popisy",
          paragraphs: [
            "Vítáme vás na portálu Recenze Ceny. Náš <strong>katalog produktů</strong> vznikl pro všechny, kteří hledají přehledné informace o oblíbených zbožích bez zbytečného tlaku a přehnaných reklamních slibů. Zaměřujeme se na kvalitní doplňky stravy — od péče o klouby a pohybový aparát přes podporu metabolismu při hubnutí až po produkty pro udržení optimálního krevního tlaku či zdravého zraku. Součástí naší nabídky jsou také užitečné potřeby pro domácnost.",
            "Věříme, že informovaný zákazník dělá nejlepší rozhodnutí. Všechny popisy u nás proto staví na reálných faktech. Podrobně rozebíráme složení jednotlivých preparátů, jejich účinné látky i praktické zkušenosti uživatelů. Naším cílem je nabízet jen ověřené recenze a přehledné ceny, abyste přesně věděli, co kupujete a jaké výhody vám daný produkt může přinést.",
          ],
        },
        {
          h: "Pohodlné nakupování na dobírku po celé České republice",
          paragraphs: [
            "Nákup přes náš katalog je maximálně jednoduchý a bezpečný. Zapomeňte na složité zadávání údajů z platební karty nebo platby předem na účet. U nás nakupujete v klidu a bez rizika — standardem pro všechny objednávky je <strong>platba na dobírku</strong>. Jak to funguje? Po odeslání krátkého formuláře vás telefonicky kontaktuje náš specialista, který s vámi potvrdí doručovací adresu a odpoví na vaše dotazy.",
            "Peníze předáváte až ve chvíli, kdy máte balíček fyzicky v rukou. Doručení kurýrem probíhá spolehlivě po celé České republice, ať už se nacházíte v Praze, Brně, Ostravě, Plzni nebo v té nejmenší obci. Svou zásilku můžete zaplatit hotově nebo kartou přímo u doručovatele, obvykle během 2 až 5 pracovních dnů od potvrzení.",
          ],
        },
        {
          h: "Odborná kontrola obsahu a garance originality",
          paragraphs: [
            "Vaše zdraví a spokojenost jsou pro nás na prvním místě. Spolupracujeme výhradně s certifikovanými distributory, díky čemuž máte jistotu, že získáte 100% originální zboží v odpovídající kvalitě. Abychom zajistili vysokou odbornou úroveň publikovaných informací, prochází naše texty a popisy odbornou revizí, kterou zaštiťuje MUDr. Jan Novák.",
            "Bezpečnost a transparentnost jsou základními pilíři naší práce. Je však důležité mít na paměti, že doplňky stravy slouží jako vhodná podpora zdravého životního stylu a pestré stravy, nikoli jako náhrada odborné lékařské péče či předepsané léčby. V případě jakýchkoli zdravotních potíží vždy doporučujeme konzultaci s vaším ošetřujícím lékařem.",
          ],
        },
      ],
    },
  },
  product: {
    crumbHome: "Domů",
    placeOrder: "Objednat",
    detailPrice: "Detail ceny",
    quickOrder: "Rychlá objednávka — platba na dobírku",
    quickOrderSub: "Pouze jméno a telefon — konzultant vám zavolá do 15 minut.",
    stickyCta: "Objednat",
    inclTaxes: "Včetně všech daní · Doprava zdarma",
    onRequest: "Cena na vyžádání",
    youMayLike: "Mohlo by se vám líbit",
    aboutThis: "Informace o produktu",
    faqH: "Často kladené otázky",
    faqKicker: "Otázky",
    urgencyToday: "Objednejte ještě dnes — zavoláme vám do 15 minut",
    deliveryEtaPrefix: "Objednejte ještě dnes — doručení",
    deliveryEtaShort: (date: string) => `🚚 Doručení do ${date}`,
    inStock: "Skladem",
    outOfStock: "Dočasně vyprodáno",
    reviewsLabel: (n: number) =>
      `${n} ${n === 1 ? "recenze" : n >= 2 && n <= 4 ? "recenze" : "recenzí"}`,
    gotoReviews: "K recenzím",
    verifiedByDoctor: "Ověřeno lékařem",
    doctorSub: "MUDr. Jan Novák, praktický lékař",
    expertOpinionEyebrow: "Lékařský posudek",
    expertOpinionH: "Odborný posudek",
    expertProfileLink: "Profil našeho lékařského poradce →",
    original: "Originál",
    originalSub: "Oficiální distributor",
    returnsDays: "14 dní",
    returnsSub: "právo na vrácení",
    paymentLabel: "Platba",
    paymentSub: "při převzetí",
    deliveryLabel: "Doručení",
    deliveryCitiesEyebrow: "Doručení",
    deliveryCitiesH: "Města doručení",
    allCities: "Všechna města →",
    coursePrice: "Při nákupu kúry",
    questionsH: "Máte dotazy?",
    questionsBody:
      "Zanechte své jméno a telefonní číslo – konzultant vám zavolá do 15 minut bez závazků.",
    orderCall: "Vyžádat hovor",
    productFallbackTitle: (site: string) => `Produkt — ${site}`,
    benefits: {
      cod: "💸 Platba na dobírku",
      ship: "🚚 Expresní kurýr 2–5 pracovních dnů",
      discreet: "🔒 Diskrétní balení",
      call: "📞 Hovor do 15 minut",
    },
    specs: {
      eyebrow: "Specifikace",
      h: "Vlastnosti produktu",
      brand: "Značka",
      form: "Forma",
      category: "Kategorie",
      reviewed: "Ověřeno",
      reviewedBy: "Lékařský poradce",
      productName: "Název produktu",
      updated: "Aktualizováno",
      productType: "Typ produktu",
      application: "Způsob užití",
      applicationTopical: "lokálně (na kůži)",
      applicationOral: "perorálně",
      packaging: "Obal",
      detectedText: "Text na obalu",
      briefDescription: "Popis",
    },
    promoModal: {
      close: "Zavřít",
      badge: "Speciální nabídka",
      lead: "Pouze dnes – objednejte za speciální cenu.",
    },
  },
  form: {
    name: "Vaše jméno",
    namePh: "např. Novák Jan",
    phone: "Telefonní číslo",
    phonePh: "777 123 456",
    submit: "Objednat",
    submitWithPrice: (price: number) => `Objednat za ${price.toLocaleString("cs-CZ")} Kč →`,
    submitting: "Odesílání objednávky…",
    thankYou: "Děkujeme! 🎉",
    thankYouBody: (id: string) =>
      `Vaše objednávka #${id} byla přijata. Konzultant vám zavolá do 15 minut, aby potvrdil podrobnosti a doručovací adresu. Platba při převzetí.`,
    privacy: {
      before: "Vaše údaje jsou důvěrné. Stisknutím tlačítka souhlasíte s našimi ",
      anchor: "Zásadami ochrany osobních údajů",
      after: ".",
    },
    errors: {
      generic: "Zkontrolujte prosím své údaje a zkuste to znovu.",
      name: "Zadejte prosím své jméno (alespoň 2 znaky).",
      phone: "Zadejte prosím platné české mobilní telefonní číslo (např. 777 123 456).",
    },
  },
  reviews: {
    title: "Recenze od zákazníků",
    sub: "Zkušenosti skutečných kupujících",
    avgLabel: (avg: string, count: number) =>
      `Průměr ${avg} z 5 · ${count} ${count === 1 ? "recenze" : count >= 2 && count <= 4 ? "recenze" : "recenzí"}`,
    verified: "✓ Ověřený kupující",
    age: "Věk",
    footer: "Recenze jsou zasílány zákazníky po převzetí objednávky",
    stars: (n: number) => `${n} z 5`,
    timeAgo: (days: number) => {
      if (days < 7) return days === 1 ? "před 1 dnem" : `před ${days} dny`;
      if (days < 30) {
        const w = Math.floor(days / 7);
        return w === 1 ? "před 1 týdnem" : `před ${w} týdny`;
      }
      const m = Math.floor(days / 30);
      return m === 1 ? "před 1 měsícem" : `před ${m} měsíci`;
    },
  },
  category: {
    crumb: "Kategorie",
    productsAvailable: (n: number) =>
      `${n} ${n === 1 ? "produkt" : n >= 2 && n <= 4 ? "produkty" : "produktů"} k dispozici`,
    empty: "V této kategorii momentálně nejsou žádné produkty. Prosím, vraťte se brzy.",
    aboutCat: "Informace o této kategorii",
    faqH: "Často kladené otázky",
    otherCategories: "Další kategorie",
    otherCategoriesLead:
      "Další kategorie zdravotních produktů – všechny dostupné s platbou na dobírku (expresní kurýr).",
    topInItaly: (name: string, year: number) => `Nejpopulárnější ${name.toLowerCase()} (${year})`,
    topPopular: (name: string, year: number) => `Nejpopulárnější ${name.toLowerCase()} (${year})`,
    bestProducts: (keyword: string, year: number) => `Nejlepší ${keyword} (${year})`,
    editorialCatalogLine: (site: string, countLabel: string, name: string) =>
      `Na ${site} najdete ${countLabel} v kategorii „${name}“, s doručením po celé České republice a platbou na dobírku.`,
    editorialProductCount: (n: number) =>
      n > 0
        ? `${n} ${n === 1 ? "produkt" : n >= 2 && n <= 4 ? "produkty" : "produktů"}`
        : "vybrané produkty",
    editorialHowToChooseH: "Jak vybrat správně",
    editorialHowToChooseP:
      "Zkontrolujte formu produktu (kapsle, gel, sprej, přístroj), uvedené složení a recenze zákazníků. Porovnávejte cenu za dávku nebo jednotku, nejen propagační balení.",
    editorialShippingH: "Doprava a platba v České republice",
    editorialShippingP:
      "Objednejte online bez platby předem: expresní kurýr doručí zásilku do 2–5 pracovních dnů, platba na dobírku po celé České republice, diskrétní balení.",
    editorialTopProductsH: (name: string) => `Nejlepší produkty — ${name}`,
    editorialTopProductsLead: "Redakční výběr — porovnejte formu a cenu před objednávkou.",
    editorialTableProduct: "Produkt",
    editorialTableForm: "Forma",
    editorialTablePrice: "Orientační cena",
    metaDescFallback: "přírodní zdravotní produkty s platbou na dobírku",
    metaDescPadding: "Záruka kvality a 100% originální produkt.",
    metaPriceLine: (min: string, max: string, count: number) =>
      ` Ceny: ${min}–${max}, ${count} ${count === 1 ? "produkt" : count >= 2 && count <= 4 ? "produkty" : "produktů"}.`,
    h1WithKeyword: (name: string, keyword: string) => `${name} — ${keyword}`,
    allCategoriesCrumb: "Všechny kategorie",
    codBadge: "💸 Platba na dobírku (expresní kurýr)",
    allTitle: (site: string) => `Všechny kategorie — přírodní zdravotní produkty | ${site}`,
    allDesc: (site: string) =>
      `Všechny kategorie na ${site}: diabetes, krevní tlak, klouby, zdraví mužů, kontrola hmotnosti a mnoho dalšího. Platba na dobírku s expresním kurýrem po celé České republice.`,
    allHeading: "Všechny kategorie",
    allLead: (site: string) =>
      `Všechny kategorie přírodních zdravotních produktů na ${site}. Platba na dobírku, diskrétní balení.`,
    seoContent: {
      intro:
        "Vítejte na hlavní stránce, kde najdete kompletní <strong>katalog produktů</strong> nezávislého portálu Recenze Ceny. Na jednom místě jsme pro vás shromáždili přehledně uspořádané <strong>přírodní doplňky stravy</strong> i praktické pomocníky pro péči o tělo, krásu a celkový životní komfort. Naším cílem je usnadnit vám orientaci na českém trhu a pomoci vám vybrat ta nejvhodnější řešení pro dlouhodobou vitalitu a pohodu napříč celou <strong>Českou republikou</strong>.",
      sections: [
        {
          h: "Kompletní přehled kategorií pro vaše zdraví a každodenní život",
          paragraphs: [
            "Náš <strong>katalog zboží</strong> je rozdělen do logických sekcí tak, abyste snadno našli přesně to, co právě potřebujete. Nabízíme přehled produktů zaměřených na nejrůznější oblasti lidského zdraví – ať už vás trápí citlivé <strong>klouby</strong>, kolísavý <strong>krevní tlak</strong>, nebo je vaší prioritou efektivní <strong>kontrola hmotnosti</strong>. Kromě specializovaných doplňků zde najdete také řešení zaměřená na <strong>péči o tělo</strong>, podporu imunity, krásu a věci pro každodenní domácí pohodlí. U každé z 34 kategorií pečlivě vybíráme aktuální produkty a doplňujeme je o detailní popisy a hodnocení.",
          ],
        },
        {
          h: "Spolehlivý nákup s doručením a platbou na dobírku",
          paragraphs: [
            "Nakupování přes náš portál je navrženo s důrazem na maximální bezpečnost a pohodlí zákazníků. Samozřejmostí je <strong>bez platby předem</strong> – standardem je pohodlná <strong>platba na dobírku</strong> až při převzetí zásilky. Po odeslání poptávky vás telefonicky kontaktuje operátor pro potvrzení detailů a následně probíhá rychlé <strong>doručení v ČR</strong> (Praha, Brno, Ostrava a další města). Všechny nabídky staví na transparentnosti a ověřených uživatelských zkušenostech (<strong>ověřené recenze</strong>).",
          ],
        },
      ],
      disclaimer:
        "Upozornění: Prezentované produkty a doplňky stravy slouží jako podpora zdravého životního stylu a nenahrazují odbornou lékařskou péči ani předepsanou léčbu.",
    },
    productsTitle: (site: string) => `Všechny produkty — Katalog přírody | ${site}`,
    productsDesc: (site: string) =>
      `Kompletní katalog ${site} — ověřené přírodní produkty. Platba na dobírku, doprava zdarma po celé České republice.`,
    productsHeading: "Všechny produkty",
    productsLead: (site: string, n: number) =>
      `Kompletní katalog ${site} — ${n} ověřených přírodních produktů. Platba na dobírku, doprava zdarma.`,
    buyingGuideLink: (name: string) => `Průvodce nákupem: ${name}`,
  },
  guide: {
    breadcrumb: "Průvodce",
    recommendedProducts: "Doporučené produkty",
    viewAllInCategory: (name: string) => `Zobrazit všechny produkty v kategorii ${name}`,
    pageTitle: (name: string, site: string) =>
      `Průvodce nákupem: ${name} v České republice | ${site}`,
    pageDesc: (keyword: string) =>
      `Průvodce nákupem — ${keyword}: na co se zaměřit, srovnání a ověřené produkty. Doručení a platba na dobírku po celé České republice.`,
    h1: (name: string) => `Jak vybrat produkt v kategorii ${name}`,
    lead: (name: string) =>
      `Informační průvodce pro kategorii „${name}“ — bez lékařských slibů, s důrazem na formu, složení a diskrétní doručení.`,
    checklistH: "Kontrolní seznam před nákupem",
    checklistP: (keyword: string) =>
      `Před objednávkou v kategorii ${keyword} si projděte tyto body — ušetříte čas a vyberete vhodnější variantu.`,
    whenDoctorH: "Kdy navštívit lékaře",
    compareH: "Jak porovnat produkty v katalogu",
    compareP: (name: string) =>
      `V kategorii „${name}“ porovnávejte formu (kapsle, gel, přístroj), složení, délku kúry a cenu za dávku — ne jen propagační balení.`,
  },
  blog: {
    breadcrumb: "Články",
    navLabel: "Články",
    indexTitle: (site: string) => `Články o zdraví a produktech — ${site}`,
    indexDesc:
      "Srozumitelné články o zdraví a doplňcích stravy: kontext k kategoriím katalogu, tipy a odkazy na ověřené produkty s doručením po České republice.",
    indexH1: "Články",
    indexLead:
      "Krátké texty k tématům, která se prolínají s našimi kategoriemi — s odkazy na průvodce a produkty v katalogu.",
    empty: "Zatím tu nejsou žádné publikované články.",
    loadMore: "Načíst další",
    loadMoreLoading: "Načítám…",
    relatedPostsTitle: "Další články",
    categoryPostsTitle: "Články k tématu",
    homePostsTitle: "Nové články",
    allPostsLink: "Všechny články",
    relatedCategory: "Související kategorie",
    relatedCategoryLead: (name: string) =>
      `Porovnejte doplňky v kategorii „${name}“ — forma, cena a doručení po České republice.`,
    relatedCategoryCta: (name: string) => `Prohlédnout kategorii ${name}`,
    productsTitle: "Produkty z katalogu",
    productsLead:
      "Výběr položek z katalogu k tématu článku — srovnejte formu, cenu a popis před objednávkou.",
    productsTrust: "Dobírka · 2–5 dní · 14 dní na vrácení",
    productsAllInCategory: (name: string) => `Všechny produkty: ${name}`,
    softCtaProducts: (name: string) => `Produkty v kategorii ${name}`,
    softCtaGuide: "Jak vybrat",
    midCtaEyebrow: "Katalog · Dobírka",
    midCtaTitle: (name: string) =>
      `Připravené produkty pro „${name}“ — vyberte v našem katalogu`,
    midCtaLead:
      "Porovnejte formu a cenu, objednávku potvrdíme telefonicky. Platíte až při převzetí — doručení po celé ČR.",
    midCtaButton: "Ukázat výběr",
    midCtaCategoryLink: (name: string) => `Celá kategorie ${name}`,
    stickyCompare: (n: number) => `Porovnat ${n} produktů`,
    stickyCategory: "Kategorie",
    faqTitle: "Časté otázky",
    sourceLabel: "Zdroj",
    publishedLabel: "Publikováno",
    disclaimer:
      "Článek slouží pouze k informaci a nenahrazuje lékařskou péči. Před užíváním doplňků stravy se poraďte se svým lékařem.",
    expertLink: "O lékařském poradci",
    expertStripLead: "Odborný rámec obsahu katalogu",
    readMore: "Číst článek",
    pageTitle: (title: string, site: string) => `${title} — ${site}`,
  },
  medicalExpert: {
    breadcrumb: "Lékařský poradce",
    eyebrow: "Lékařský poradce · Klinický recenzent",
    name: "MUDr. Jan Novák",
    title: "Praktický lékař, Praha",
    headlineRole: "Lékařský poradce a klinický recenzent",
    subtitle: (years: number) =>
      `Praktický lékař Praha | ${years}+ let klinické praxe | ČLK № 2005-12345`,
    regNo: "ČLK № 2005-12345",
    city: "Praha, Česká republika",
    experienceLabel: (years: number) => `${years}+ let klinické praxe`,
    badges: [
      "Lékařská fakulta Univerzity Karlovy",
      "Preventivní medicína",
      "Všeobecné lékařství",
      "Metabolické poruchy",
      "Funkční výživa",
    ],
    bio: (_site: string) =>
      "MUDr. Jan Novák je uznávaný praktický lékař Praha s více než 18letou aktivní klinickou praxí v oblasti ambulantní medicíny. Je absolventem prestižní instituce Lékařská fakulta Univerzity Karlovy v Praze. Ve své každodenní praxi i odborné činnosti se specializuje na obory, jako je preventivní medicína, všeobecné lékařství, metabolické poruchy, kardiovaskulární zdraví a funkční výživa. Díky svému hlubokému odbornému zázemí garantuje vysokou úroveň lékařského dohledu nad publikovaným obsahem a odbornými recenzemi.",
    roleH: "Role lékařského poradce na portálu Recenze Ceny",
    roleLead: (site: string) =>
      `Dnešní trh s doplňky stravy je přehlcen nepřeberným množstvím produktů, což často vede k šíření zavádějících, neúplných nebo neodborných informací. Hlavním úkolem nezávislého odborného poradce na portálu ${site} je zajistit, aby doplňky stravy a zdravotní produkty byly prezentovány objektivně, bezpečně a na základě vědecky podložených faktů.`,
    roleIntro: "Klíčové náplně práce lékařského recenzenta zahrnují:",
    roleItems: [
      {
        title: "Detailní analýza složení",
        body: "Důkladný přezkum všech aktivních složek jednotlivých produktů a posouzení jejich vzájemných interakcí s ohledem na farmakologickou kompatibilitu.",
      },
      {
        title: "Eliminace zavádějících tvrzení",
        body: "Nekompromisní filtrování a zamítání nekalých marketingových slibů výrobců o „zázračném vyléčení“ či nereálných účincích.",
      },
      {
        title: "Dodržování evropských standardů",
        body: "Přísná bezpečnost a kontraindikace v souladu s normami a předpisy Evropského úřadu pro bezpečnost potravin (EFSA).",
      },
    ],
    reviewProcessH: "Čtyřstupňový proces ověřování obsahu",
    reviewProcessLead: (_site: string) =>
      "Pro zajištění maximální odborné přesnosti podléhá každý text na portálu přísnému čtyřstupňovému kontrolnímu procesu:",
    processSteps: [
      {
        title: "Klinická revize složení a dávek",
        body: "Důkladná prověrka dávkování účinných látek a jejich porovnání s doporučenými denními dávkami a aktuálními klinickými standardy.",
      },
      {
        title: "Kontrola kontraindikací a bezpečnostních varování",
        body: "Analýza rizik a ověření varování pro specifické skupiny osob – těhotné a kojící ženy, pacienty s chronickým onemocněním či osoby užívající léky na předpis.",
      },
      {
        title: "Odborný dohled nad sekcí FAQ a recenzemi",
        body: "Lékařská kontrola správnosti a věcné přesnosti odpovědí na časté dotazy uživatelů a hodnocení produktů.",
      },
      {
        title: "Průběžná aktualizace podle nových poznatků",
        body: "Pravidelná revize a aktualizace produktových karet na základě nejnovějších dat z klinických studií a lékařských výzkumů.",
      },
    ],
    responsibilities: [
      "Klinická revize složení a dávek",
      "Kontrola kontraindikací a bezpečnostních varování",
      "Odborný dohled nad sekcí FAQ a recenzemi",
      "Průběžná aktualizace podle nových poznatků",
    ],
    principlesH: "Principy odpovědného užívání doplňků stravy",
    principleHighlight:
      "Fundamentální pravidlo: Doplňky stravy neslouží jako náhrada pestré a vyvážené stravy ani nenahrazují léčbu předepsanou ošetřujícím lékařem.",
    principles: [
      {
        title: "Lékařská konzultace",
        body: "Před zahájením užívání jakýchkoliv nových doplňků nebo vitamínových komplexů je vždy nezbytné poradit se se svým ošetřujícím lékařem, který zná váš celkový zdravotní stav a anamnézu.",
      },
      {
        title: "Jak správně vybrat produkt",
        body: "Při výběru věnujte pozornost složení na etiketě. Vyhledávejte produkty s transparentně uvedeným množstvím účinných látek, certifikací původu a vyhýbejte se výrobkům s nejasným složením nebo nereálně vysokými sliby.",
      },
    ],
    reviewedH: "Kategorie a průvodce pod odborným dohledem",
    reviewedLead:
      "MUDr. Jan Novák pravidelně reviduje obsah v kategoriích a nákupních průvodcích, které odpovídají jeho odbornému zaměření — preventivní medicína, metabolické poruchy, kardiovaskulární zdraví a funkční výživa:",
    reviewedGuidesH: "Průvodce výběrem",
    reviewedCategories: [
      { slug: "krevni-tlak", label: "Doplňky na krevní tlak" },
      { slug: "hubnuti", label: "Kontrola hmotnosti" },
      { slug: "cukrovka", label: "Péče o cukrovku" },
      { slug: "traveni", label: "Trávení a funkční výživa" },
      { slug: "jatra", label: "Zdraví jater" },
      { slug: "klouby", label: "Kloubní výživa" },
    ],
    reviewedGuides: [
      { slug: "krevni-tlak", label: "Průvodce: doplňky na krevní tlak" },
      { slug: "hubnuti", label: "Průvodce: kontrola hmotnosti" },
      { slug: "cukrovka", label: "Průvodce: péče o cukrovku" },
      { slug: "traveni", label: "Průvodce: trávení" },
    ],
    reviewedMore: [
      { path: "/category", label: "Všechny kategorie produktů" },
      { path: "/sluzby", label: "Online nástroje pro zdraví a hubnutí" },
    ],
    reviewedProductsH: "Příklady produktů s lékařskou revizí",
    reviewedProductsLead:
      "Níže jsou ukázky produktových karet z kategorií, které procházejí klinickou kontrolou složení, dávek a bezpečnostních upozornění:",
    disclaimerH: "Důležité právní a zdravotní upozornění",
    disclaimer:
      "Veškeré informace, recenze a odborné materiály publikované na portálu Recenze Ceny mají pouze informativní a vzdělávací charakter. Odborná revize prováděná MUDr. Janem Novákem potvrzuje věcnou správnost a odbornou přesnost uvedených dat o produktech, nejedná se však o individuální lékařskou konzultaci, stanovení diagnózy ani předpis léčby. V případě zdravotních problémů vždy vyhledejte osobní péči kvalifikovaného lékaře.",
    metaTitle: (site: string) =>
      `MUDr. Jan Novák — Lékařský poradce a klinický recenzent | ${site}`,
    metaDesc: (site: string, years: number) =>
      `MUDr. Jan Novák, praktický lékař Praha s ${years}+ lety praxe, reviduje doplňky stravy na ${site}: složení, kontraindikace a odbornou přesnost obsahu.`,
    jobTitle: "Lékařský poradce a klinický recenzent",
    credentialFamily: "Všeobecné lékařství",
    credentialNutrition: "Preventivní medicína",
    credentialOrg: "Lékařská fakulta Univerzity Karlovy v Praze",
    knowsAbout: [
      "Všeobecné lékařství",
      "Preventivní medicína",
      "Metabolické poruchy",
      "Kardiovaskulární zdraví",
      "Funkční výživa",
      "Doplňky stravy",
    ],
  },
  services: {
    breadcrumb: "Služby",
    hubEyebrow: "Online nástroje",
    hubTitle: "Online nástroje a kalkulačky pro vaše zdraví a hubnutí",
    hubLead:
      "Úspěšné a trvalé snížení hmotnosti se neopírá o drastické diety ani extrémní odříkání, ale o vědecky podložený a systematický přístup. Abyste dosáhli svých cílů bezpečně a bez obávaného jojo-efektu, připravili jsme pro vás chytré online nástroje hubnutí.",
    hubLead2:
      "Pomohou vám porozumět potřebám vašeho těla, přesně nastavit denní příjem energie a vybrat správnou podporu pro váš metabolismus. Všechny naše kalkulačky pro hubnutí jsou 100% zdarma, bez nutnosti registrace a výsledky získáte okamžitě. Udělejte první krok k vysněné postavě a lepší kondici ještě dnes!",
    hubMetaTitle: (site: string) => `Online kalkulačky a nástroje pro hubnutí zdarma | ${site}`,
    hubMetaDesc:
      "Využijte naše bezplatné online kalkulačky pro hubnutí: výpočet kalorií a makroživin, osobní test pro výběr doplňků stravy a pitný režim. Začněte ještě dnes!",
    toolsSectionH: "Naše bezplatné online nástroje",
    tools: {
      calories: {
        name: "Kalkulačka kalorií a makroživin",
        desc: "Zjistěte svůj bazální metabolismus (BMR) a doporučený denní příjem kalorií, bílkovin, tuků a sacharidů pro efektivní chudnutí.",
        cta: "Spočítat kalorie",
      },
      quiz: {
        name: "Osobní asistent pro výběr doplňků",
        desc: "Krátký interaktivní test, který na základě vašich cílů a životního stylu doporučí vhodné doplňky stravy.",
        cta: "Spustit test",
      },
      water: {
        name: "Kalkulačka pitného režimu",
        desc: "Vypočítejte si optimální denní příjem tekutin s ohledem na vaši hmotnost, fyzickou aktivitu a prostředí.",
        cta: "Spočítat pitný režim",
      },
    },
    hubSeo: {
      h: "Jak efektivně hubnout: Proč samotné počítání kalorií nestačí?",
      p1: "Nastavení kalorického deficitu je základním stavebním kamenem každé redukce hmotnosti. Kvalitní kalkulačka kalorií zdarma vám dá přesný číselný rámec, nicméně lidské tělo je složitý organismus a pouhá matematika k dlouhodobému úspěchu často nestačí.",
      p2: "Pokud chcete vědět, jak efektivně hubnout, musíte se zaměřit také na kvalitu stravy, správnou funkci metabolismu a regeneraci. Během sníženého příjmu potravy tělu často chybí klíčové mikroživiny, což může vést k únavě, zpomalení spalování tuků nebo neodolatelným chutím na sladké.",
      tipLabel: "Náš tip:",
      tipBefore:
        "Pro dosažení nejlepších výsledků je vhodné tělo podpořit zevnitř. Správně zvolené ",
      tipLink: "doplňky stravy na hubnutí",
      tipAfter:
        " mohou pomoci nastartovat pomalý metabolismus, udržet normální hladinu cukru v krvi a dodat energii pro pravidelný pohyb.",
      p3: "Nezapomínejte, že udržitelná cesta za zdravějším tělem kombinuje vyvážený jídelníček, dostatek pohybu, hydrataci a cílenou mikroživinovou podporu. Využijte naše nástroje naplno a vytvořte si plán, který bude fungovat dlouhodobě.",
    },
    hubProductsTitle: "Doporučené doplňky na hubnutí",
    disclaimer:
      "Tyto nástroje slouží pouze k informaci. Nejde o lékařskou diagnostiku ani léčebný plán. Při chronických onemocněních, těhotenství nebo užívání léků se poraďte s lékařem.",
    weightSection: "Kontrola hmotnosti",
    openTool: "Otevřít nástroj",
    calculate: "Spočítat",
    recalculate: "Přepočítat",
    sex: "Pohlaví",
    sexMale: "Muž",
    sexFemale: "Žena",
    age: "Věk (roky)",
    height: "Výška (cm)",
    weight: "Aktuální váha (kg)",
    targetWeight: "Cílová váha (kg)",
    activity: "Úroveň aktivity",
    activitySedentary: "Sedavý způsob života",
    activitySedentaryHint: "Málo pohybu, práce u stolu",
    activityLight: "Lehká aktivita",
    activityLightHint: "1–3 tréninky týdně",
    activityModerate: "Střední aktivita",
    activityModerateHint: "3–5 tréninků týdně",
    activityHigh: "Vysoká aktivita",
    activityHighHint: "6–7 tréninků týdně",
    goal: "Cíl",
    goalMild: "Mírné hubnutí (−15 %)",
    goalOptimal: "Optimální hubnutí (−20 %)",
    goalMaintain: "Udržení váhy",
    errAge: "Zadejte věk 14–100 let.",
    errHeight: "Zadejte výšku 100–250 cm.",
    errWeight: "Zadejte váhu 30–300 kg.",
    errTarget: "Zadejte cílovou váhu 30–300 kg.",
    errTargetAbove: "Pro hubnutí musí být cílová váha nižší než aktuální.",
    errActivityMinutes: "Zadejte minuty aktivity 0–480.",
    calories: {
      title: "Kalorická kalkulačka: Výpočet denního příjmu kalorií a BMR",
      shortTitle: "Kalorie a makra",
      lead: "Znejte své tělo a dosáhněte svých cílů bez zbytečného hladovění! Zadáním základních údajů — pohlaví, věku, hmotnosti, výšky a úrovně denní aktivity — získáte přesný výpočet bazálního metabolismu (BMR) a doporučený denní příjem kalorií i makroživin (bílkovin, tuků a sacharidů) přizpůsobený pro hubnutí, udržení váhy nebo nárůst svalové hmoty.",
      metaTitle: (_site: string) =>
        "Kalorická kalkulačka a BMR: Výpočet kalorií a makroživin pro hubnutí",
      metaDesc:
        "Spočítejte si svůj denní příjem kalorií a ideální poměr bílkovin, tuků a sacharidů pro bezpečné hubnutí. Přesná online kalorická kalkulačka zdarma.",
      resultKcal: "Denní kalorie",
      resultKcalHint: "s vybraným cílem",
      protein: "Bílkoviny",
      fat: "Tuky",
      carbs: "Sacharidy",
      forecast: (kg: number, weeks: number) =>
        `Při tomto deficitu dosáhnete cíle ${kg} kg přibližně za ${weeks} ${weeks === 1 ? "týden" : weeks < 5 ? "týdny" : "týdnů"}.`,
      marketing: "Při kalorickém deficitu tělo potřebuje podporu metabolismu a vitamíny.",
      marketingCta: "Vybrat doplněk podle cíle",
      productsTitle: "Doporučené doplňky na hubnutí",
      seo: {
        h1: "Jak funguje kalorická kalkulačka (BMR a AMR)?",
        p1: "Chcete-li efektivně upravit svou hmotnost, musíte nejdříve porozumět tomu, jak vaše tělo spotřebovává energii. Kalorická kalkulačka pracuje se dvěma klíčovými pojmy:",
        bmrLabel: "BMR (Bazální metabolická míra):",
        bmrText:
          " Množství energie, které vaše tělo potřebuje pro udržení základních životních funkcí (dýchání, srdeční tep, činnost mozku) v úplném klidu.",
        amrLabel: "AMR (Aktivní metabolická míra):",
        amrText:
          " Celkový denní výdej energie. Vzniká vynásobením BMR koeficientem vaší fyzické aktivity (sedavé zaměstnání, sport, manuální práce).",
        p2: "Přesný výpočet kalorií zohledňuje oba tyto faktory a určí váš výchozí bod pro změnu postavy.",
        h2: "Jaký kalorický deficit je bezpečný pro hubnutí?",
        p3: "Pro redukci hmotnosti je nutné dostat tělo do stavu zvaného kalorický deficit — tedy přijímat méně energie, než kolik spotřebujete.",
        tipLabel: "Základní pravidlo bezpečného hubnutí:",
        tipText:
          "Ideální a dlouhodobě udržitelný kalorický deficit se pohybuje mezi 15 % až 20 % pod vaší hodnotou AMR.",
        p4: "Extrémní dietní omezení a drastické hladovění vedou ke zpomalení metabolismu, ztrátě svalové hmoty, únavě a obávanému jojo-efektu. Správně nastavený denní příjem kalorií pro hubnutí zajišťuje stabilní úbytek tuku (cca 0,5 kg týdně) bez rizika pro zdraví.",
        h3: "Proč jsou důležité makroživiny (Bílkoviny, Tuky, Sacharidy)?",
        p5: "Není kalorie jako kalorie. Pro optimální zdraví a tvarování postavy je zásadní správný výpočet makroživin:",
        proteinLabel: "Bílkoviny:",
        proteinText: " Chrání svalovou hmotu v dietě, zasytí na dlouhou dobu a mají vysoký termický efekt.",
        fatLabel: "Tuky:",
        fatText:
          " Jsou nezbytné pro správnou produkci hormonů, vstřebávání vitamínů (A, D, E, K) a zdraví mozku.",
        carbsLabel: "Sacharidy:",
        carbsText:
          " Hlavní zdroj rychlé energie pro tělo i mysl, které podporují intenzivní fyzický výkon.",
        h4: "Jak podpořit metabolismus při kalorickém deficitu?",
        p6: "I při pečlivě sestaveném jídelníčku může kalorický deficit představovat pro organismus zátěž. Snížený příjem potravy často vede k nedostatku klíčových mikronutrientů, což se projeví únavou, zpomalením metabolismu nebo chutěmi na sladké.",
        p7: "Pro udržitelný restart organismu a maximální spálení tuků je vhodné tělu dodat cílenou podporu. Kvalitní vitamíny, minerály (např. hořčík a zinek) a přírodní spalovače tuků pomáhají udržet energii, hormonální rovnováhu a optimální rychlost metabolismu.",
        ctaLead: "Chcete zefektivnit své hubnutí a udržet si energii?",
        cta: "Prohlédněte si nabídku doplňků stravy pro podporu metabolismu",
      },
      faqH: "Často kladené otázky (FAQ)",
      faq: [
        {
          q: "Jak často přepočítávat kalorie?",
          a: "Hodnoty doporučujeme přepočítat při každé změně hmotnosti o 3 až 5 kg. Se snížením tělesné hmotnosti se totiž přirozeně snižuje i váš bazální metabolismus (BMR) a celková spotřeba energie.",
        },
        {
          q: "Musím vážit všechno jídlo?",
          a: "Na začátku cesty je přesné vážení potravin velmi přínosné. Pomůže vám získat reálnou představu o velikosti porcí a nutriční hodnotě jídla. Jakmile tyto odhady dostanete „do oka“, můžete přejít na intuitivnější stravování.",
        },
        {
          q: "Co dělat, když se váha zastavila?",
          a: "Zastavení váhy (tzv. plateau) je běžný jev. Nejprve ověřte, zda skryté kalorie nezpůsobují chybné počítání. Pokud je vše v pořádku, pomáhá krátkodobé navýšení příjmu na udržovací hodnoty (tzv. refeed day nebo diet break), které dá metabolismu impuls k dalšímu spalování.",
        },
      ],
    },
    quiz: {
      title: "Personální pomocník: Najděte ideální doplňky stravy pro vaše cíle",
      shortTitle: "Výběr doplňku na hubnutí",
      lead: "Osobní doporučení produktů pro efektivní podporu metabolismu a usnadnění redukce hmotnosti",
      quizIntroH: "Udělejte si rychlý test (1 minuta)",
      quizIntro:
        "Nevíte, které doplňky stravy jsou pro vás ty pravé? Každé tělo je jiné a to, co funguje ostatním, nemusí vyhovovat vám. Odpovězte na 4 jednoduché otázky v našem krátkém dotazníku. Na základě vašeho životního stylu a fyzických potřeb vám sestavíme osobní doporučení produktů pro efektivní podporu metabolismu a usnadnění vaší cesty za vysněnou postavou.",
      metaTitle: (_site: string) =>
        "Osobní asistent: Test pro výběr doplňků stravy na hubnutí",
      metaDesc:
        "Nevíte, jaké doplňky stravy zvolit? Udělejte si rychlý 1minutový test a získejte osobní doporučení produktů pro podporu hubnutí a metabolismu.",
      stepOf: (n: number, total: number) => `Krok ${n} z ${total}`,
      next: "Další",
      back: "Zpět",
      finish: "Zobrazit tipy",
      restart: "Znovu",
      resultTitle: "Váš osobní program podpory",
      catalogTitle: "Doporučené doplňky na hubnutí",
      catalogLead:
        "Prohlédněte si doplňky z katalogu — nebo vyplňte krátký dotazník výše pro osobní tipy.",
      whyLabel: "Proč právě tento",
      tipTitle: "Krátká rada ke stravě",
      goalQ: "Jaký je váš hlavní cíl?",
      goalLose: "Shodit kila a ubrat objemy",
      goalEdema: "Zbavit se otoků a přebytečné vody",
      goalAppetite: "Ovládnout chuť na sladké / apetit",
      goalMetabolism: "Zrychlit pomalý metabolismus",
      obstacleQ: "Co vám hubnutí nejvíc komplikuje?",
      obstacleStress: "Večerní žravost a stres",
      obstacleSedentary: "Sedavá práce, málo pohybu",
      obstacleFatigue: "Rychlá únava a nedostatek energie",
      obstacleWater: "Zadržování vody, pocit „těžkosti“",
      extrasQ: "Máte další přání? (volitelné)",
      extraSkin: "Podpořit pleť a vlasy při hubnutí",
      extraSleep: "Normalizovat spánek",
      extraDetox: "Detox a očista organismu",
      activityQ: "Jaká je vaše fyzická aktivita?",
      activityMinimal: "Minimální / žádná",
      activityTraining: "Trénuji 2–3× týdně",
      tipByTags: {
        appetite: "Držte pravidelné jídlo a bílkoviny u každého chodu — snižují nárazové chutě.",
        edema: "Sůl a alkohol omezte; pijte vodu rovnoměrně přes den, ne najednou večer.",
        metabolism: "Krátká chůze po jídle a dostatek spánku podpoří denní výdej energie.",
        stress: "Večer zvolte teplé jídlo s bílkovinou místo sladkého „útěchu“.",
        energy: "Snídani neodbývejte — stabilní energie přes den omezuje večerní přejídání.",
        skin: "Při deficitu kalorií dbejte na bílkoviny a zdravé tuky kvůli pleti a vlasům.",
        sleep: "Kofein ukončete ideálně 6–8 hodin před spaním.",
        detox: "Očista začíná hydratací a vlákninou — bez drastických hladovek.",
        activity: "Přidejte 2–3 silové jednotky týdně — pomáhají udržet svaly při hubnutí.",
        fiber: "Vlákninu navyšujte postupně a vždy s dostatečným množstvím vody.",
      },
      seo: {
        h1: "Proč je důležitý individuální přístup k hubnutí?",
        p1: "Univerzální „zázračné pilulky“ nefungují z jednoho prostého důvodu: příčina nadváhy je u každého člověka jiná. Zatímco někoho trápí zadržování vody a pocit těžkých nohou, jiný bojuje s neovladatelnou chutí na sladké nebo zpomaleným metabolismem po striktních dietách.",
        p2: "Správný výběr doplňků stravy by měl vždy vycházet z toho, co vaše tělo aktuálně nejvíce potřebuje. Když zaměříte péči na konkrétní problém, dosáhnete výsledků výrazně rychleji a bez zbytečného strádání. Správně sestavený osobní plán hubnutí je základem dlouhodobého úspěchu.",
        h2: "Jak doplňky stravy pomáhají při redukci hmotnosti?",
        p3: "Kvalitní přírodní látky dokáží přirozeně podpořit biologické procesy v těle. Pokud víte, jak vybrat doplňky stravy, mohou se stát vaším nejlepším spojencem:",
        rows: [
          {
            name: "Přírodní drenáže a extrakty",
            desc: "Pomáhají tělu zbavit se přebytečné vody a zmírnit otoky.",
          },
          {
            name: "Chrom a vláknina",
            desc: "Stabilizují hladinu cukru v krvi a efektivně snižují nekontrolovatelnou chuť na sladké.",
          },
          {
            name: "L-karnitin a spalovače tuků",
            desc: "Stimulují metabolismus a pomáhají tělu využívat tukové zásoby jako energii během fyzické aktivity.",
          },
        ],
        p4: "I ty nejlepší doplňky na hubnutí fungují nejlépe jako podpora vyvážené stravy a pohybu. Pomohou vám překonat krizové fáze a zrychlit první viditelné výsledky.",
        safetyH: "Bezpečnost a kvalita na prvním místě",
        safety:
          "Vaše zdraví je u nás na prvním místě. Veškeré doplňky stravy, které v našich doporučeních a recenzích najdete, splňují přísné evropské normy kvality a bezpečnosti. Spolupracujeme pouze s ověřenými výrobci, jejichž produkty obsahují certifikované složky v účinném a bezpečném dávkování.",
      },
    },
    water: {
      title: "Kalkulačka pitného režimu: Kolik vody denně opravdu potřebujete?",
      shortTitle: "Kalkulačka pitného režimu",
      lead: "Správný pitný režim je základem pro vysokou energii, zdravou pleť i efektivní hubnutí. Zadejte svou váhu a úroveň fyzické aktivity do naší kalkulačky a zjistěte svou personální denní potřebu tekutin. Je čas dát tělu přesně to, co potřebuje!",
      metaTitle: (_site: string) =>
        "Kalkulačka pitného režimu: Kolik vody denně vypít pro hubnutí?",
      metaDesc:
        "Spočítejte si svou optimální denní dávku vody podle váhy a fyzické aktivity. Zjistěte, jak správný pitný režim pomáhá při hubnutí a proti otokům.",
      activityMinutes: "Pohyb / trénink denně (minuty)",
      hotClimate: "Horké klima / počasí (+300 ml)",
      coffeeTea: "Piju kávu nebo čaj (+250 ml; nenahrazují vodu)",
      resultLabel: "Vaše norma",
      resultDetail: (liters: number, glasses: number) =>
        `${liters} l denně ≈ ${glasses} sklenic (250 ml)`,
      scheduleTitle: "Doporučený pitný režim",
      schedule: [
        "1 sklenice hned po probuzení",
        "1 sklenice 30 minut před každým jídlem",
        "Průběžně mezi jídly — ne velké množství najednou",
        "Po tréninku doplňte podle délky aktivity",
      ],
      coffeeNote:
        "Káva a čaj hydratují jen částečně. Do denního cíle počítejte především čistou vodu.",
      marketing:
        "Hydratace je základ hubnutí — při dostatku tekutin doplňky stravy na kontrolu hmotnosti fungují lépe v denním režimu.",
      marketingCta: "Kategorie kontrola hmotnosti",
      productsTitle: "Doporučené doplňky na hubnutí",
      seo: {
        h1: "Jak souvisí pitný režim a hubnutí?",
        p1: "Voda není jen o hašení žízně — je to klíčový motor vašeho metabolismu. Pokud se snažíte shodit přebytečné tuky, dostatečný příjem vody je vaší nejlepší tajnou zbraní.",
        items1: [
          {
            label: "Zrychlení metabolismu:",
            text: " Pití čisté vody dokáže krátkodobě zrychlit metabolismus až o 24–30 %. Tělo totiž spotřebovává energii na to, aby vodu ohřálo na tělesnou teplotu.",
          },
          {
            label: "Méně kalorií díky kontrole hladu:",
            text: " Žaludek vysílá do mozku podobné signály při hladu i při žízni. Často tak jíme, když má tělo ve skutečnosti jen žízeň.",
          },
          {
            label: "Efektivní odbourávání tuků:",
            text: " Proces štěpení tuků (lipolýza) vyžaduje molekuly vody. Bez dostatku tekutin se spalování tukových zásob výrazně zpomaluje.",
          },
        ],
        h2: "Jak správně pít vodu během dne?",
        p2: "Není důležité jen to, kolik vody vypijete, ale také jak ji v průběhu dne přijímáte. Nárazové pití litru vody najednou ledviny zbytečně zatěžuje a většina tekutiny z těla odejde bez užitku.",
        items2: [
          {
            label: "Začněte den sklenicí vody:",
            text: " Po probuzení vypijte sklenici vlažné vody (můžete přidat kapku citronu). Nastartujete tím trávení a doplníte tekutiny po nočním půstu.",
          },
          {
            label: "Pijte průběžně a po douškách:",
            text: " Mějte láhev vody vždy po ruce. Pijte pravidelně menší množství během celého dne, než pocítíte žízeň.",
          },
          {
            label: "Sklenice vody 30 minut před jídlem:",
            text: " Zaplní část žaludku, přirozeně sníží velikost porce a připraví trávicí systém na příjem jídla.",
          },
          {
            label: "Během jídla pijte s mírou:",
            text: " Velké množství vody při jídle může ředit trávicí enzymy.",
          },
        ],
        h3: "Co dělat při zadržování vody a otocích?",
        p3: "Trápí vás oteklé nohy, pocit těžkosti nebo nafouklé břicho? Možná vás to překvapí, ale nejčastější příčinou zadržování vody je její nedostatek. Když tělo cítí dehydrataci, přejde do obranného režimu a začne každou kapku vody křečovitě ukládat do tkání.",
        p4Before:
          "Kromě úpravy pitného režimu a omezení nadbytku soli můžete organismu pomoci také cílenou podporou mikrocirkulace a lymfatického systému. Pokud trpíte na otoky a pocit zavodnění, vyzkoušejte ",
        p4Link: "lymfodrenážní doplňky stravy a přírodní odvodňovače",
        p4After:
          ", které pomáhají vyplavit přebytečné tekutiny a navrátit tělu lehkost.",
      },
      faqH: "Často kladené otázky (FAQ)",
      faq: [
        {
          q: "Počítá se káva a čaj do pitného režimu?",
          a: "Ano, ale s mírou. Běžné bylinkové a ovocné čaje se do pitného režimu započítávají plně. Káva a černý či zelený čaj mají mírné dehydratační účinky kvůli obsahu kofeinu. Jedna až dvě kávy denně vám neuškodí, ale je dobré ke každému šálku kávy vypít sklenici čisté vody navíc.",
        },
        {
          q: "Můžu vypít příliš mnoho vody?",
          a: "Ano, existuje stav zvaný hyponatremie (převodnění organismu), kdy extrémní příjem vody naředí hladinu sodíku v krvi. Pro zdravého dospělého člověka je však tento stav vzácný — nastává zpravidla až při vypití extrémního množství vody (např. 5–7 litrů) v velmi krátkém čase.",
        },
        {
          q: "Pomáhá pití vody před jídlem zhubnout?",
          a: "Určitě ano. Studie ukazují, že vypití cca 500 ml vody přibližně 30 minut před hlavním jídlem přirozeně zaplní žaludek. Díky tomu sníte menší porci jídla, přijmete méně kalorií a budete se cítit sytí po delší dobu.",
        },
      ],
    },
    cards: {
      caloriesPath: "/sluzby/kaloricka-kalkulacka",
      quizPath: "/sluzby/personalni-pomocnik",
      waterPath: "/sluzby/vodni-bilance",
    },
    promo: {
      title: "Užitečné služby pro hubnutí",
      open: "Otevřít",
      caloriesBenefit: "Spočítejte denní kalorie a tempo hubnutí",
      quizBenefit: "4 otázky → tipy z katalogu",
      waterBenefit: "Denní pitný režim a odvodnění",
    },
  },
  doruceni: {
    hubTitle: "Doručení a doprava po celé České republice",
    hubLead:
      "Dobírka, diskrétní balení a expresní kurýr — od velkých měst po vzdálenější obce. Níže najdete pravidla a stránky měst.",
    hubMetaTitle: "Doručení a doprava | Recenze Ceny",
    hubMetaDesc:
      "Kurýr na dobírku po celé ČR: 2–5 pracovních dnů, diskrétní balení, doručení podle měst. Praha, Brno, Ostrava a další.",
    crumb: "Doručení",
    rulesKicker: "Pravidla",
    rulesH: "Jak funguje doručení",
    citiesKicker: "Města",
    citiesH: "Doručení podle měst",
    citiesLead:
      "Na každé stránce města najdete shrnutí doby doručení, FAQ a výběr z katalogu.",
    jumpCities: "Přejít na města →",
    categoriesH: "Prohlédněte kategorie",
    categoriesKicker: "Katalog",
    productsKicker: "Výběr",
    faqH: "Často kladené otázky",
    faqKicker: "Otázky",
    siblingsH: "Další města",
    etaKicker: "Pravidla doručení",
    ctaCategories: "Prohlédnout kategorie",
    ctaHow: "Pravidla doručení →",
  },
  footer: {
    care: "Zákaznický servis a doručení",
    shop: "Katalog",
    company: "Společnost",
    legal: "Právní",
    contact: "Kontakt",
    careItems: [
      "Doručení expresním kurýrem zdarma po celé České republice",
      "14denní právo na vrácení",
      "Originální produkt od výrobce",
    ],
    disclaimerH: "Upozornění",
    disclaimer:
      "Produkty v katalogu jsou doplňky stravy nebo spotřební zboží — nejsou léky a nenahrazují lékařskou péči. Před užíváním doplňků se poraďte se svým lékařem.",
    rights: "Všechna práva vyhrazena.",
    madeIn: "Redakce v Praze",
    sitemap: "Mapa webu",
    medicalExpert: "Lékařský poradce",
    services: "Užitečné služby",
    blog: "Články",
    payment: "Platba",
    returns: "Vrácení",
    privacy: "Ochrana osobních údajů",
    terms: "Podmínky použití",
  },
  notFound: {
    h: "Stránka nenalezena",
    sub: "Stránka, kterou hledáte, neexistuje nebo byla přesunuta.",
    back: "Zpět na domovskou stránku",
  },
  error: {
    h: "Došlo k chybě",
    sub: "Tuto stránku nelze načíst. Zkuste to prosím znovu.",
    retry: "Zkusit znovu",
    goHome: "Přejít na domovskou stránku",
  },
};
