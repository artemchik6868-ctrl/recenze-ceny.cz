import { SITE } from "./site";

type Section = {
  heading: string;
  /** Plain text (other legal pages). Prefer `paragraphs` when HTML is needed. */
  body: string;
  /** HTML paragraphs rendered after the heading (and before bullets). */
  paragraphs?: string[];
  /** HTML list items. */
  bullets?: string[];
  /** When true, bullets render as an ordered list (e.g. step-by-step). */
  ordered?: boolean;
  /** Optional HTML paragraph after the bullet list. */
  after?: string;
};
type Faq = { q: string; a: string };
type FaqGroup = { heading: string; items: Faq[] };
export type LegalPage = {
  slug: string;
  title: string;
  /** Short label for breadcrumbs; defaults to `title`. */
  breadcrumb?: string;
  intro: string;
  /** When set, intro is rendered as HTML (allows <strong>, etc.). */
  introHtml?: boolean;
  /** Multiple HTML intro paragraphs (preferred over single `intro` for rich pages). */
  introParagraphs?: string[];
  /** Full document title override (otherwise `${title} — ${siteName}`). */
  metaTitle?: string;
  /** Meta description override (otherwise stripped `intro`). */
  metaDescription?: string;
  sections: Section[];
  /** Optional heading above the FAQ accordion (e.g. on /payment). */
  faqHeading?: string;
  faq?: Faq[];
  /** Grouped FAQ accordion (e.g. /faq with category h2s). Flattened for JSON-LD. */
  faqGroups?: FaqGroup[];
};

export const LEGAL: Record<string, LegalPage> = {
  about: {
    slug: "about",
    title: "O projektu Recenze Ceny: Váš spolehlivý průvodce světem doplňků stravy",
    breadcrumb: "O nás",
    introHtml: true,
    intro: `<strong>${SITE.name}</strong> je nezávislý český informační <strong>katalog produktů</strong> a srovnávač, který pomáhá obyvatelům České republiky vybrat ověřené <strong>doplňky stravy</strong> a kvalitní zboží pro domácnost. Naším hlavním cílem je poskytovat kompletní a pravdivé informace o složení, cenách a reálných zkušenostech uživatelů. Chceme, aby vaše rozhodování při nákupu bylo snadné, bezpečné a založené na fakta.`,
    sections: [
      {
        heading: "Náš příběh a poslání",
        body: "",
        paragraphs: [
          "Náš projekt vznikl přímo v srdci České republiky – v Praze. Reagovali jsme na dlouhodobý problém moderního trhu, který je doslova přeplněný nepřehlednými nabídkami, pochybnými přípravky a nejasným složením.",
          `Portál <strong>${SITE.name}</strong> jsme založili s jasným posláním: odfiltrovat nekvalitní produkty a nabídnout českým zákazníkům maximálně transparentní informace. Nepoužíváme agresivní prodejní praktiky ani přehnané sliby. Místo toho stavíme na upřímnosti, objektivitě a péči o zdraví našich čtenářů.`,
        ],
      },
      {
        heading: "Jak vybíráme a kontrolujeme produkty",
        body: "",
        paragraphs: [
          "Kvalita a bezpečnost jsou pro nás na prvním místě. Abychom zajistili nejvyšší standardy (E-E-A-T), uplatňujeme při výběru zboží přísná pravidla:",
        ],
        bullets: [
          "<strong>Certifikovaní dodavatelé:</strong> Spolupracujeme výhradně s licencovanými evropskými distributory.",
          "<strong>Kontrola složení:</strong> Důkladně prověřujeme složení produktů a certifikáty shody s normami Evropské unie.",
          "<strong>Odborná lékařská kontrola:</strong> Všechny odborné texty a informace o produktech podléhají kontrole, kterou zaštiťuje náš garant <strong>MUDr. Jan Novák</strong>.",
        ],
        after:
          "<em>Důležité upozornění:</em> Náš web neprodává léčivé přípravky. Nabízené produkty jsou <strong>doplňky stravy</strong> a neslouží jako náhrada pestré stravy ani odborné lékařské péče. Před zahájením užívání jakéhokoliv doplňku vždy doporučujeme konzultaci s Vaším ošetřujícím lékařem.",
      },
      {
        heading: "Naše hlavní zásady a garance pro zákazníky",
        body: "",
        paragraphs: [
          "Chceme, aby byl váš nákupní proces maximálně pohodlný a bezpečný. Proto se držíme těchto klíčových principů:",
        ],
        bullets: [
          "<strong>Žádné platby předem:</strong> Neriskujete své finance. Pro maximální jistotu je k dispozici pouze <strong>platba na dobírku</strong> při převzetí zásilky od kurýra.",
          "<strong>Osobní telefonické potvrzení:</strong> Každá objednávka je následně telefonicky ověřena operátorem. Můžete tak pohodlně upřesnit detaily doručení nebo se doptat na doplňující dotazy.",
          "<strong>Diskrétní a rychlé doručení:</strong> Zboží balíme pečlivě a diskrétně. Doručujeme po celé České republice obvykle během 2 až 5 pracovních dnů.",
          "<strong>Pravdivé a úplné informace:</strong> Na kartě každého produktu najdete kompletní složení, přesný návod k použití i případná reálná omezení.",
        ],
      },
      {
        heading: "Kontaktní informace a redakce v Praze",
        body: "",
        paragraphs: [
          `Naše redakce a zákaznická podpora sídlí v samotném centru hlavního města. Můžete nás navštívit nebo kontaktovat na adrese: <strong>${SITE.address.city}</strong>, ${SITE.address.line2}.`,
          "Pokud máte jakékoliv dotazy k fungování našeho katalogu, stavu objednávky nebo potřebujete poradit s výběrem, náš tým je vám plně k dispozici na e-mailu i telefonu. Jsme tu pro vás, abychom vám pomohli nakupovat s důvěrou.",
        ],
      },
    ],
  },
  contact: {
    slug: "contact",
    title: "Kontakt",
    breadcrumb: "Kontakt",
    metaTitle: `Kontakt a zákaznická podpora | ${SITE.name}`,
    metaDescription:
      "Telefon, e-mail a adresa Recenze Ceny. Zákaznická podpora Po–So 9–20, odpověď do 24 pracovních hodin. Doručení po celé ČR.",
    introHtml: true,
    intro:
      "Jsme vždy k dispozici pro dotazy a návrhy. Preferujte <strong>telefon</strong> u naléhavých záležitostí k objednávce — snažíme se odpovědět do <strong>24 pracovních hodin</strong>.",
    introParagraphs: [
      "Jsme vždy k dispozici pro dotazy a návrhy. Preferujte <strong>telefon</strong> u naléhavých záležitostí k objednávce — snažíme se odpovědět do <strong>24 pracovních hodin</strong>.",
    ],
    sections: [
      {
        heading: "Zákaznický servis",
        body: "",
        paragraphs: [
          `Nejrychlejší cesta k vyřízení objednávky, změny doručení nebo storno je telefonická podpora.`,
        ],
        bullets: [
          `<strong>Telefon:</strong> <a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a>`,
          `<strong>E-mail:</strong> <a href="mailto:${SITE.email}">${SITE.email}</a>`,
          `<strong>Otevírací doba:</strong> ${SITE.hours}`,
        ],
      },
      {
        heading: "Adresa kanceláře",
        body: "",
        paragraphs: [
          `${SITE.address.line1}<br />${SITE.address.line2}<br />${SITE.address.city}, ${SITE.address.postalCode}<br />Česká republika`,
        ],
      },
      {
        heading: "Než nám napíšete",
        body: "",
        paragraphs: [
          "Na mnoho otázek najdete odpověď ihned — ušetříte čas sobě i naší podpoře:",
        ],
        bullets: [
          '<a href="/faq">Nápověda a často kladené otázky</a>',
          '<a href="/delivery">Doprava a doručení</a>',
          '<a href="/returns">Vrácení a reklamace</a>',
          '<a href="/payment">Možnosti platby</a>',
        ],
      },
      {
        heading: "Spolupráce a obchodní dotazy",
        body: "",
        paragraphs: [
          `Pro spolupráci, velkoobchodní objednávky a dotazy médií pište na <a href="mailto:${SITE.email}?subject=${encodeURIComponent("Spolupráce / obchodní dotaz")}">${SITE.email}</a> s předmětem „Spolupráce“ nebo „Média“.`,
        ],
      },
    ],
    faqGroups: [
      {
        heading: "Časté otázky ke kontaktu",
        items: [
          {
            q: "Jak vás mohu kontaktovat?",
            a: `Nejrychlejší je zavolat na <a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a> (Po–So 9:00–20:00). Můžete také napsat na <a href="mailto:${SITE.email}">${SITE.email}</a>.`,
          },
          {
            q: "Jak rychle odpovídáte?",
            a: "Snažíme se odpovědět na e-maily do <strong>24 pracovních hodin</strong>. Telefonická podpora je k dispozici v otevírací době Po–So · 9:00–20:00 (CET).",
          },
          {
            q: "Kde najdu informace o dopravě a vrácení?",
            a: 'Podrobnosti o doručení jsou na stránce <a href="/delivery">Doprava a doručení</a>. Postup vrácení a reklamací najdete v sekci <a href="/returns">Vrácení zboží</a>. Další odpovědi jsou v <a href="/faq">nápovědě</a>.',
          },
          {
            q: "Potřebuji změnit objednávku — kam volat?",
            a: `Zavolejte co nejdříve na <a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a> ještě před expedicí balíčku. Po předání kurýrovi už změnu nelze vždy zajistit — pak postupujte podle podmínek vrácení.`,
          },
        ],
      },
    ],
  },
  delivery: {
    slug: "delivery",
    title: "Doprava a doručení zboží",
    breadcrumb: "Doručení",
    metaTitle: `Doprava a doručení po celé ČR | ${SITE.name}`,
    metaDescription:
      "Informace o doručení zboží po celé ČR. Nabízíme rychlé doručení za 2–5 dní, diskrétní balení a platbu na dobírku. Cenu dopravy vám potvrdí operátor.",
    introHtml: true,
    intro:
      "Spolehlivé a pohodlné doručení je pro nás prioritou. Zboží doručujeme <strong>po celé České republice</strong> — od velkých měst až po ty nejmenší obce. Před odesláním vás telefonicky kontaktuje operátor, který s vámi potvrdí detaily objednávky včetně dopravy.",
    introParagraphs: [
      "Spolehlivé a pohodlné doručení je pro nás prioritou. Zboží doručujeme <strong>po celé České republice</strong> — od velkých měst až po ty nejmenší obce.",
      "Pro vaši maximální jistotu vás před odesláním balíčku vždy telefonicky kontaktuje náš operátor, který s vámi potvrdí všechny detaily objednávky — včetně způsobu a ceny dopravy.",
    ],
    sections: [
      {
        heading: "Rychlost a doba doručení",
        body: "",
        paragraphs: [
          "Snažíme se, aby k vám balíček dorazil v co nejkratším čase. Využíváme <strong>expresní doručení</strong>, díky kterému je zpracování vašich objednávek rychlé a efektivní.",
        ],
        bullets: [
          "<strong>Běžná doba doručení:</strong> 2–5 pracovních dnů.",
          "<strong>Odlehlé lokality:</strong> Nejpozději do 7 pracovních dnů.",
          "<strong>Sledování zásilky:</strong> Jakmile balíček předáme kurýrní službě, zašleme vám SMS a e-mail. Zpráva obsahuje <strong>kód pro sledování zásilky</strong>, takže máte neustálý přehled o svém balíčku.",
        ],
      },
      {
        heading: "Cena a možnosti dopravy",
        body: "",
        paragraphs: [
          "Přesnou cenu dopravy a dostupné možnosti doručení vám sdělí <strong>operátor při telefonickém potvrzení objednávky</strong> — ještě před odesláním balíčku.",
        ],
        bullets: [
          "Cena dopravy závisí na adrese, hmotnosti zásilky a zvoleném způsobu doručení.",
          "Nabízíme flexibilní <strong>možnosti doručení</strong> až k vašim dveřím nebo na vybrané výdejní místo.",
          "Všechny detaily s vámi potvrdíme osobně — bez překvapení při převzetí.",
        ],
      },
      {
        heading: "100% diskrétní balení",
        body: "",
        paragraphs: [
          "Vaše soukromí je pro nás absolutní prioritou. Garance diskrétnosti je u nás samozřejmostí:",
        ],
        bullets: [
          "Zboží odesíláme výhradně v <strong>neutrálním obalu</strong>.",
          "Na vnější straně balíčku není uvedeno název produktu, značka ani jakákoli specifikace obsahu.",
          "Nikdo kromě vás nezjistí, co se uvnitř zásilky nachází.",
        ],
      },
      {
        heading: "Platba na dobírku a sledování zásilky",
        body: "",
        paragraphs: [
          "Chceme, aby pro vás byl nákup maximálně bezpečný. Nežadujeme žádné platby předem — samozřejmostí je <strong>doručení na dobírku</strong> a pohodlná <strong>platba při převzetí</strong> zboží.",
          "Máte dotaz k průběhu doručení nebo potřebujete změnit adresu? Náš zákaznický servis je vám plně k dispozici.",
        ],
        bullets: [
          `<strong>Telefonní podpora:</strong> <a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a>`,
          "<strong>Otevírací doba:</strong> Po–So: 09:00–20:00",
        ],
      },
    ],
  },
  payment: {
    slug: "payment",
    title: "Platební metody a bezpečnost plateb",
    breadcrumb: "Platba",
    metaTitle: `Možnosti platby a bezpečnost | ${SITE.name}`,
    metaDescription:
      "Pohodlné a bezpečné platební metody na Recenze Ceny. Nabízíme platbu na dobírku při převzetí, rychlou platbu kartou online, Apple Pay a Google Pay.",
    introHtml: true,
    intro:
      "Nakupování na portálu Recenze Ceny je rychlé, pohodlné a především zcela bezpečné. Připravili jsme pro vás různé <strong>platební metody</strong>, abyste si mohl zvolit přesně ten způsob úhrady, který vám vyhovuje nejvíce. Ať už preferujete tradiční platbu až při převzetí zboží, nebo moderní online platby na jeden klik, vaše finance i osobní údaje jsou u nás v naprostém bezpečí.",
    introParagraphs: [
      "Nakupování na portálu Recenze Ceny je rychlé, pohodlné a především zcela bezpečné. Připravili jsme pro vás různé <strong>platební metody</strong>, abyste si mohl zvolit přesně ten způsob úhrady, který vám vyhovuje nejvíce. Ať už preferujete tradiční platbu až při převzetí zboží, nebo moderní online platby na jeden klik, vaše finance i osobní údaje jsou u nás v naprostém bezpečí.",
    ],
    sections: [
      {
        heading: "Platba na dobírku (Nejoblíbenější volba)",
        body: "",
        paragraphs: [
          "Nechcete platit předem? Využijte možnost platby na dobírku a zaplaťte za objednávku až ve chvíli, kdy ji držíte v rukách.",
        ],
        bullets: [
          "<strong>Platba při převzetí:</strong> Hradíte přímo kurýrovi nebo na výdejním místě (v hotovosti či kartou).",
          "<strong>Kontrola zásilky:</strong> Před zaplacením si můžete zkontrolovat neporušenost obalu a ujistit se, že balíček nejeví známky poškození.",
          "<strong>Maximální jistota:</strong> Vhodná volba pro všechny, kteří preferují osobní kontakt a kontrolu nad transakcí.",
        ],
      },
      {
        heading: "Online platba kartou",
        body: "",
        paragraphs: [
          "Nejrychlejší způsob, jak objednávku ihned zaplatit a usnadnit její okamžité zpracování.",
        ],
        bullets: [
          "Podporujeme běžné platební karty <strong>Visa a Mastercard</strong>.",
          "<strong>Okamžité zpracování:</strong> Peníze jsou připsány během několika sekund.",
          "<strong>Bez poplatků:</strong> Za platbu kartou online si neúčtujeme žádné skryté poplatky.",
        ],
      },
      {
        heading: "Rychlé platby přes Apple Pay a Google Pay",
        body: "",
        paragraphs: [
          "Pro uživatele chytrých telefonů a tabletů nabízíme maximálně pohodlnou úhradu bez nutnosti přepisovat údaje z karty.",
        ],
        bullets: [
          "<strong>Platba na jeden klik:</strong> Využijte biometrické ověření (Face ID, Touch ID nebo otisk prstu).",
          "<strong>Rychlost a pohodlí:</strong> Ideální řešení při nákupu z mobilního zařízení.",
        ],
      },
      {
        heading: "Jak garantujeme bezpečnost vašich plateb?",
        body: "",
        paragraphs: [
          "Bezpečnost vašich dat je pro nás na prvním místě. Při zpracování online plateb využíváme nejmodernější bezpečnostní standardy:",
        ],
        bullets: [
          "<strong>SSL 256-bit šifrování:</strong> Veškerý přenos dat mezi vaším prohlížečem a platební bránou je zakódován.",
          "<strong>Certifikace PCI-DSS:</strong> Splňujeme přísné mezinárodní bezpečnostní normy pro nakládání s platebními kartami.",
          "<strong>Ochrana údajů:</strong> Údaje o vaší platební kartě <strong>neukládáme na našich serverech</strong>. Veškeré transakce probíhají přímo přes zabezpečenou bankovní bránu.",
        ],
      },
    ],
    faqHeading: "Často kladené otázky (FAQ)",
    faq: [
      {
        q: "Jsou platby na webu spojené s poplatky?",
        a: "Ne, všechny online <strong>platební metody</strong> (platba kartou, Apple Pay, Google Pay) jsou zcela <strong>bez poplatků</strong>. Případný poplatek za dobírku je vždy jasně uveden přímo v košíku před dokončením objednávky.",
      },
      {
        q: "Co mám dělat, když platba kartou neprojde?",
        a: "Nejčastější příčinou bývají neaktivní online platby na kartě, nedostatečný limit nebo chyba při zadávání 3D Secure kódu. Zkontrolujte nastavení v bankovní aplikaci, zkuste platbu opakovat, nebo zvolte alternativní způsob, jako je <strong>platba při převzetí</strong> (dobírka).",
      },
    ],
  },
  faq: {
    slug: "faq",
    title: "Často kladené otázky a nápověda",
    breadcrumb: "Nápověda",
    metaTitle: `Často kladené otázky a nápověda | ${SITE.name}`,
    metaDescription:
      "Odpovědi na nejčastější dotazy o objednávkách, platbě na dobírku, diskrétním doručení, originalitě produktů a reklamacích na Recenze Ceny.",
    introHtml: true,
    intro: `V katalogu <strong>${SITE.name}</strong> si zakládáme na maximální transparentnosti, bezpečnosti a celkové spokojenosti našich zákazníků. Níže naleznete přehledné odpovědi na nejčastější dotazy týkající se objednávek doplňků stravy, výhodných podmínek platby na dobírku, garance originality produktů i diskrétního doručení až k vašim dveřím.`,
    sections: [],
    faqGroups: [
      {
        heading: "Objednávky a doručení",
        items: [
          {
            q: "Jak dlouho trvá doručení po ČR?",
            a: 'Standardní doručení po celé České republice trvá obvykle <strong>2 až 5 pracovních dnů</strong> od okamžiku vytvoření objednávky. Spolupracujeme pouze s prověřenými kurýrními službami, které zaručují rychlé a bezpečné předání balíčku. Jakmile bude vaše zásilka předána přepravci, obdržíte SMS zprávu a e-mail s podrobnými informacemi a sledovacím číslem (track &amp; trace). Pro detailní přehled o možnostech dopravy navštivte naši sekci <a href="/delivery">Doručení a platba</a>.',
          },
          {
            q: "Doručujete zboží v diskrétním balení?",
            a: "Ano, plně respektujeme vaše soukromí a chápeme, že některé nákupy vyžadují osobní přístup. Všechny objednané doplňky stravy balíme do 100% neutrálních obalů bez loga obchodu, názvu značky nebo jakéhokoli naznačení obsahu zásilky. Balíček vypadá jako běžná soukromá pošta, což vám zajišťuje maximální anonymitu, pohodlí a klid při převzetí od kurýra nebo na výdejním místě.",
          },
          {
            q: "Jak mohu stornovat nebo změnit objednávku?",
            a: `Pokud potřebujete ve své objednávce cokoli upravit, změnit doručovací adresu nebo ji zcela zrušit, kontaktujte naši zákaznickou podporu co nejdříve před expedicí balíčku. Můžete tak učinit telefonicky na čísle <strong>${SITE.phoneDisplay}</strong> nebo e-mailem na <a href="mailto:${SITE.email}">${SITE.email}</a>. Pokud již byla zásilka předána kurýrovi, storno bohužel není možné provést přímo a bude nutné postupovat podle standardních podmínek pro vrácení zboží.`,
          },
        ],
      },
      {
        heading: "Platba a garance",
        items: [
          {
            q: "Je možná platba na dobírku?",
            a: "Ano, platba na dobírku je u nás plně podporována a patří k nejoblíbenějším způsobům úhrady. Za své zboží platíte zcela bezpečně až při jeho fyzickém převzetí – ať už v hotovosti, nebo platební kartou přímo u kurýra či na zvoleném výdejním místě. Předem neplatíte žádné zálohy ani skryté poplatky, takže váš nákup je od začátku do konce bez rizika.",
          },
          {
            q: "Jsou nabízené produkty a doplňky stravy originální?",
            a: "Garantujeme 100% originalitu, čistotu a vysokou kvalitu všech produktů v naší nabídce. Spolupracujeme výhradně s oficiálními distributory a certifikovanými výrobci. Všechny nabízené doplňky stravy splňují přísné legislativní normy, bezpečnostní předpisy a certifikace Evropské unie (EU) a procházejí pravidelnou kontrolou kvality.",
          },
        ],
      },
      {
        heading: "Reklamace a bezpečnost užívání",
        items: [
          {
            q: "Co dělat v případě poškození nebo vady zboží?",
            a: 'Pokud obdržíte poškozenou zásilku nebo objevíte vadu na zboží, proces řešení je velmi rychlý a jednoduchý. Máte plné právo na reklamaci nebo bezplatné vrácení zboží do 14 dnů od převzetí. Stačí kontaktovat naši zákaznickou linku nebo napsat e-mail – obratem vám pošleme nový nepoškozený kus, nebo vám vrátíme peníze v plné výši. Podrobný postup a formulář naleznete na stránce <a href="/returns">Reklamace a vrácení zboží</a>.',
          },
          {
            q: "Mohu doplňky stravy užívat bez porady s lékařem?",
            a: 'Všechny produkty v našem katalogu jsou volně prodejné doplňky stravy, nikoli léky na předpis. Přesto vždy doporučujeme pečlivě číst příbalový leták a nepřekračovat doporučené denní dávkování. Pokud trpíte chronickým onemocněním, užíváte pravidelně léky, jste těhotná nebo kojíte, konzultujte užívání nového přípravku se svým ošetřujícím lékařem. Více informací o bezpečném užívání si můžete přečíst v sekci <a href="/medical-expert">Lékařská garance a odborný dohled</a>.',
          },
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Zásady ochrany osobních údajů",
    intro: `Vaše soukromí je pro „${SITE.name}“ prioritou. Tyto zásady vysvětlují, jaké údaje shromažďujeme podle GDPR, jak je používáme a jak je chráníme.`,
    sections: [
      {
        heading: "Shromažďované údaje",
        body: "Při objednávce shromažďujeme pouze údaje, které nám poskytnete: jméno, telefonní číslo, dodací adresu. Údaje o platební kartě neukládáme.",
      },
      {
        heading: "Použití údajů",
        body: "Vaše údaje používáme výhradně k potvrzení objednávky, doručení a zákaznickému servisu. Bez vašeho souhlasu je nepředáváme třetím stranám, s výjimkou kurýrních služeb.",
      },
      {
        heading: "Cookies",
        body: "Používáme omezený počet cookies pro fungování webových stránek. Můžete je zakázat v nastavení prohlížeče.",
      },
      {
        heading: "Ochrana údajů",
        body: "Používáme průmyslové standardy – SSL šifrování, omezený přístup personálu a pravidelné audity.",
      },
      {
        heading: "Vaše práva",
        body: `Kdykoli můžete požádat o přístup k vašim údajům, jejich opravu nebo vymazání – pište na ${SITE.email}.`,
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Podmínky použití",
    intro: `Používáním webových stránek „${SITE.name}“ souhlasíte s těmito podmínkami. Doporučujeme vám je pečlivě přečíst.`,
    sections: [
      {
        heading: "Používání služby",
        body: "Webové stránky jsou určeny pro dospělé (18+) obyvatele České republiky. Jste odpovědní za přesnost poskytnutých údajů.",
      },
      {
        heading: "Produkty a ceny",
        body: "Vyhrazujeme si právo na změnu cen a sortimentu bez předchozího upozornění. Obrázky jsou pouze ilustrativní.",
      },
      {
        heading: "Zdravotní upozornění",
        body: "Prezentované produkty jsou doplňky stravy a nejsou určeny k diagnostice, léčbě nebo prevenci nemocí. Před použitím se poraďte se svým lékařem.",
      },
      {
        heading: "Ochrana spotřebitele",
        body: "Naše činnost se řídí českými právními předpisy na ochranu spotřebitele. Máte právo na úplné informace o produktu a vrácení zboží za stanovených podmínek.",
      },
      {
        heading: "Omezení odpovědnosti",
        body: `„${SITE.name}“ nenese odpovědnost za nepřímé škody. Maximální odpovědnost je omezena na hodnotu objednávky.`,
      },
      {
        heading: "Řešení sporů",
        body: "Spory se řeší podle českých právních předpisů.",
      },
    ],
  },
  returns: {
    slug: "returns",
    title: "Vrácení a výměna zboží",
    breadcrumb: "Vrácení",
    metaTitle: `Vrácení a výměna zboží do 14 dnů | ${SITE.name}`,
    metaDescription:
      "Jak na vrácení a výměnu zboží na Recenze Ceny. Přečtěte si naše zásady reklamace, postup při poškození zásilky a výjimky dle českých předpisů.",
    introHtml: true,
    intro: `V <strong>${SITE.name}</strong> si zakládáme na špičkové kvalitě všech nabízených produktů a garantujeme plnou odpovědnost za každou doručenou zásilku. Chceme, aby pro vás byl nákup zcela bezpečný a pohodlný. Standardní <strong>vrácení zboží</strong> i případná <strong>reklamace</strong> u nás probíhají transparentně, rychle a vždy v souladu s platnými právními předpisy České republiky.`,
    introParagraphs: [
      `V <strong>${SITE.name}</strong> si zakládáme na špičkové kvalitě všech nabízených produktů a garantujeme plnou odpovědnost za každou doručenou zásilku. Chceme, aby pro vás byl nákup zcela bezpečný a pohodlný. Standardní <strong>vrácení zboží</strong> i případná <strong>reklamace</strong> u nás probíhají transparentně, rychle a vždy v souladu s platnými právními předpisy České republiky.`,
    ],
    sections: [
      {
        heading: "Podmínky pro vrácení a výměnu do 14 dnů",
        body: "",
        paragraphs: [
          "Každý zákazník má právo na <strong>vrácení zboží</strong> nebo jeho výměnu <strong>do 14 dnů</strong> od převzetí zásilky, pokud doručený produkt neodpovídá objednávce, vykazuje výrobní vadu nebo byl při přepravě poškozen.",
          "Pokud při převzetí nebo rozbalení zjistíte jakoukoliv závadu, zboží vám <strong>zdarma vyměníme za nový kus</strong>, případně vám vrátíme peníze v plné výši. Oprávněná <strong>reklamace</strong> vás nestojí žádné dodatečné poplatky.",
        ],
      },
      {
        heading: "Jak postupovat při reklamaci (Krok za krokem)",
        body: "",
        ordered: true,
        bullets: [
          `<strong>Kontaktujte naši zákaznickou podporu:</strong> Napište nám e-mail na <strong><a href="mailto:${SITE.email}">${SITE.email}</a></strong> nebo zavolejte na telefonní číslo <strong><a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a></strong>.`,
          "<strong>Uveďte identifikační údaje:</strong> Do zprávy zadejte Vaše <strong>číslo objednávky</strong> a krátký popis problému.",
          "<strong>Přiložte fotodokumentaci:</strong> Pokud je zboží poškozené nebo vadné, přiložte jasné fotografie poškozeného obalu či samotného produktu.",
        ],
        after:
          "Všechny žádosti zpracováváme v nejkratším možném čase, nejpozději však do 2 pracovních dnů od obdržení vaší zprávy.",
      },
      {
        heading: "Výjimky z práva na vrácení (Doplňky stravy a potraviny)",
        body: "",
        paragraphs: [
          "<strong>Důležité upozornění:</strong> Podle platných zákonů ČR a hygienických předpisů <strong>nelze poškozené ani nepoškozené doplňky stravy a potraviny vrátit bez udání důvodu</strong>, pokud byl jejich ochranný obal již otevřen nebo porušen. Z hygienických důvodů a z důvodu ochrany zdraví je vrácení nebo výměna těchto kategorií zboží možná <strong>pouze v případě výrobní vady nebo poškození vzniklého při přepravě</strong>.",
        ],
      },
    ],
    faqHeading: "Často kladené otázky (FAQ)",
    faq: [
      {
        q: "Kdo hradí poštovné při výměně vadného zboží?",
        a: "V případě uznané reklamace nebo zaslání vadného zboží hradí veškeré náklady na přepravu naše společnost. Zákazník v takovém případě neplatí nic.",
      },
      {
        q: "Jak dlouho trvá vyřízení reklamace a vrácení peněz?",
        a: "O průběhu reklamace vás informujeme ihned. Zákonná lhůta pro vyřízení je 30 dnů, avšak většinu případů řešíme během <strong>3 až 7 pracovních dnů</strong>. Finanční prostředky zasíláme zpět na váš bankovní účet bezprostředně po schválení žádosti.",
      },
    ],
  },
};