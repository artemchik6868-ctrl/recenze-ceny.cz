/**
 * SEO+UX hub packs for CZ supplement categories (scale layer).
 * Merged in getCategoryContent — overrides intro/sections/tables/links/faq.
 * Pilots (joint-care, blood-pressure, varicose-veins) stay in content.cs compose.
 */

import type { ContentSection, FaqItem, HubLink, HubTable } from "./content.cs";
import { GUIDE_PATH } from "./site";
import { SUPPLEMENT_PRIMARY_KW } from "./supplement-serp-keywords.cs";

export type SupplementHubPack = {
  categoryIntroHi: string;
  categorySectionsHi: ContentSection[];
  categoryFaqHi: FaqItem[];
  hubTables: HubTable[];
  hubLinks: HubLink[];
  keywordsHi: string[];
  taglineHi?: string;
  shortDescHi?: string;
  /** SERP-led: do not inject pack()/editorial boilerplate around the copy. */
  serpLedHub?: boolean;
};

const COD: FaqItem[] = [
  {
    q: "Musím platit předem?",
    a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
  },
  {
    q: "Jak dlouho trvá doručení?",
    a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
  },
  {
    q: "Je produkt originální?",
    a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
  },
];

function links(slug: string, name: string, related?: { label: string; path: string }): HubLink[] {
  const out: HubLink[] = [
    { label: `Průvodce výběrem: ${name}`, path: `${GUIDE_PATH}/${slug}` },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
  ];
  if (related) out.push(related);
  return out;
}

function formsTable(name: string, rows: string[][]): HubTable {
  return {
    caption: `Formy v kategorii „${name}“ — rychlé srovnání`,
    headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
    rows,
  };
}

function pack(input: {
  slug: string;
  name: string;
  intro: string;
  who: string;
  choose: string;
  chooseBullets: string[];
  formsBody: string;
  safety: string;
  faq: FaqItem[];
  formRows: string[][];
  related?: { label: string; path: string };
  tagline?: string;
  shortDesc?: string;
  extraTable?: HubTable;
}): SupplementHubPack {
  const pk = SUPPLEMENT_PRIMARY_KW[input.slug] ?? input.name.toLowerCase();
  return {
    taglineHi: input.tagline,
    shortDescHi: input.shortDesc,
    categoryIntroHi: input.intro,
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: `Pro koho je kategorie „${input.name}“`,
        body: input.who,
      },
      {
        id: "jak-vybrat",
        heading: `Jak vybrat ${pk}`,
        body: input.choose,
        bullets: input.chooseBullets,
      },
      {
        id: "formy",
        heading: "Formy a na co se dívat",
        body: input.formsBody,
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: input.safety,
      },
    ],
    hubTables: [formsTable(input.name, input.formRows), ...(input.extraTable ? [input.extraTable] : [])],
    hubLinks: links(input.slug, input.name, input.related),
    categoryFaqHi: [...input.faq, ...COD],
    keywordsHi: [pk, input.name.toLowerCase(), "platba na dobírku", "doručení Česká republika"],
  };
}

const DEFAULT_FORM_ROWS: string[][] = [
  ["Kapsle / tablety", "Denní vnitřní podpora", "Dávka, délka kúry, složení"],
  ["Kapky / tinktura", "Flexibilní dávkování", "Návod, chuť, obsah alkoholu"],
  ["Gel / krém", "Lokální aplikace", "Frekvence, citlivost kůže"],
];

/** Remaining supplement hubs (pilots excluded — rich copy in content.cs): blood-pressure, joint-care, varicose-veins, diabetes-care. */
export const SUPPLEMENT_HUB_PACKS: Record<string, SupplementHubPack> = {
  "detox": {
    taglineHi:
      "Očista těla podle cíle — játra, střeva, odvodnění nebo zelené potraviny",
    shortDescHi:
      "Detoxikace organismu a očista těla: ostropestřec, vláknina, byliny na odvodnění i chlorella. Porovnání typů, kurýr a dobírka v České republice.",
    categoryIntroHi:
      "Doplňky stravy na detoxikaci mají smysl teprve tehdy, když víte, co chcete podpořit. Játra, ledviny a střeva pracují na očistě organismu nepřetržitě; zátěž z jídelníčku, alkoholu nebo stresu jim práci jen ztěžuje. V kategorii Detoxikace a čištění proto řadíme přípravky na detoxikaci organismu podle záměru — jaterní očista se silymarinem a ostropestřcem, očista střev s vlákninou, odvodnění organismu bylinnými směsmi, nebo zelené potraviny (chlorella, spirulina). Jarní odlehčení či úprava režimu po svátcích sem patří stejně jako klidná celoroční podpora. Jde o doplněk stravy, nikoli o lék a nikoli o hladovku. Objednávku pošleme expresním kurýrem obvykle do 2–5 pracovních dnů; platíte na dobírku kdekoli v České republice.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Komu sedí jemná očista organismu",
        body: "Nabídka sedí dospělým, kteří chtějí doplňky stravy na detoxikaci zaradit do běžného režimu: po bohatším jídle, při jarní změně stravy, nebo když chtějí cíleně podpořit játra či střevní komfort. Realistický rámec je důležitý — kapsle ani čaj nenahradí spánek, pohyb ani pití. Stranu nechte lékařům, pokud máte diagnostikované onemocnění jater, ledvin či střev, berete léky zpracovávané játry, jste těhotná nebo kojíte. Akutní varování (krev ve stolici, silná bolest břicha, déletrvající průjem) nepatří do e-shopového výběru — patří k lékaři.",
        bullets: [
          "Dospělí s cílem jemné očisty těla vedle stravy a pitného režimu",
          "Zájem o srovnání jaterních směsí, vlákniny, odvodnění a zelených potravin",
          "Bez samoléčby chronických diagnóz a bez nahrazování odborného vyšetření",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Podle čeho vybrat přípravek na detoxikaci organismu",
        body: "Rozhodnutí začíná otázkou „co chci podpořit?“, ne názvem na krabičce. Detoxikace jater vede k ostropestřci a příbuzným bylinám; očista střev k vláknině; odvodnění organismu k bylinným směsím při dostatku vody; zelené potraviny k prášku nebo tabletám do denní rutiny. Forma (kapsle, detox čaj, kúra, prášek) přijde až potom. Na štítku kontrolujte miligramy, případnou standardizaci silymarinu, doporučený počet dnů a cenu přepočtenou na jeden den cyklu. Bez hydratace nemá smysl zvyšovat „sílu“ směsi. Projímavé extrémy bez odborného dohledu vynechte.",
        bullets: [
          "Jedna priorita: játra, střeva, odvodnění, nebo zelené potraviny",
          "Štítek: mg účinné látky, standardizace, denní dávka",
          "Délka cyklu + pauza podle výrobce",
          "Cena za den, ne jen cena krabičky",
          "Souběžně naplánovaný pitný režim",
        ],
      },
      {
        id: "cile",
        heading: "Jaterní očista, střeva, odvodnění, nebo zelené potraviny",
        body: "České lékárenské a e-shopové kategorie detoxu se prakticky dělí stejně — podle orgánu či cíle, ne podle sloganu. Jaterní linie sází na ostropestřec, artyčok a pampelišku. Střevní linie na vlákninu a pravidelnost. Odvodnění organismu na byliny s močopudnou tradicí (kopřiva a podobné) výhradně při pití. Zelené potraviny přidávají chlorofyl a mikroživiny do jídelníčku. Držte se jednoho směru; skládat několik intenzivních kúr přes sebe bez konzultace není rozumné.",
        bullets: [
          "Játra — jaterní očista a podpora normální funkce v rámci doplňku stravy",
          "Střeva — vláknina a komfort vyprazdňování, ne marketingové „vyčištění toxinů“",
          "Odvodnění — byliny + voda; ne náhrada léčby otoků",
          "Zelené potraviny — chlorella, spirulina, mladý ječmen jako denní doplněk",
        ],
      },
      {
        id: "slozky",
        heading: "Ostropestřec, silymarin, chlorella a další časté složky",
        body: "Složení doplňků stravy na detoxikaci organismu se opakuje v různých poměrech. Ostropestřec mariánský a silymarin se vážou k podpoře normální funkce jater. Artyčok a pampeliška se objevují u trávení a tradiční podpory žluči. Chlorella se spirulinou jsou typické zelené potraviny. Psyllium a další vláknina míří na střevní komfort. Kopřiva a směsi na odvodnění patří k pitnému režimu, ne k dehydrataci. Marketingový seznam na líci nestačí — rozhodují čísla na rubu. Individuální odezva se liší; onemocnění jater nebo střev doplněk neléčí.",
        bullets: [
          "Silymarin / ostropestřec — mg a standardizace extraktu",
          "Artyčok + pampeliška — častý pár v jaterních směsích",
          "Chlorella / spirulina — prášek vs. tablety, chuť, denní množství",
          "Vláknina a odvodňovací byliny — vždy s dostatečným pitím",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, bylinný detox čaj, kúra a prášek",
        body: "Tobolky a tablety drží přesnou dávku a hodí se na cesty — klasika u ostropestřce. Detox čaj a vícedenní bylinná kúra spojují pití s pevným rozpisem; čtěte směs i počet dnů. Práškové zelené potraviny mícháte do vody nebo smoothie. Ať zvolíte kteroukoli formu, hledejte jasné dávkování a realistickou délku programu. Srovnání forem je v tabulce níže; produkt pak vyberete podle cíle a ceny v katalogu.",
      },
      {
        id: "rezim",
        heading: "Jak detoxikovat organismus bez zbytečné dramatizace",
        body: "Účinný přístup u dospělých je podpora orgánů, které očistu už dělají — ne půst a ne samotné džusy. Držte etiketu, nepřekračujte dávku. U vlákniny a léků respektujte rozestupy z návodu nebo rady lékárníka.",
        bullets: [
          "1. Celodenní pití vody — zvlášť u vlákniny a odvodňovacích směsí",
          "2. Cyklus podle výrobce, potom pauza; dlouhodobost konzultujte",
          "3. Odlehčený talíř (méně smaženého a alkoholu), bez hladovění",
          "4. Jedna kúra najednou — ne hromada projímadel",
          "5. Neobvyklá reakce = vysadit a řešit s odborníkem",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Upozornění: doplněk stravy není lék — kdy k lékaři",
        body: "Doplněk stravy na detoxikaci nesmí tvrdit, že „vyčistí všechny toxiny“, a není léčivem. Dávku z obalu nepřekračujte. Chronická onemocnění jater, ledvin nebo střev, léky na předpis (včetně těch ovlivňujících srážlivost), těhotenství a kojení vyžadují konzultaci před startem. Krev ve stolici, silná bolest břicha, déletrvající průjem, žloutenka nebo náhlé zhoršení patří k lékaři. Mladiství bez odborného posouzení přípravky z této kategorie neužívají.",
      },
    ],
    hubTables: [
      {
        caption: "Kam míří očista organismu — rozhodnutí podle cíle",
        headers: ["Směr", "Typická situace", "Kontrolní body na etiketě"],
        rows: [
          [
            "Jaterní očista",
            "Chcete podpořit normální funkci jater po dietní zátěži (v rámci DS)",
            "Ostropestřec, silymarin v mg, artyčok, délka cyklu",
          ],
          [
            "Očista střev",
            "Řešíte vlákninu a pravidelnost, ne „zázračné toxiny“",
            "Druh vlákniny, denní dávka, pití, citlivost trávení",
          ],
          [
            "Odvodnění organismu",
            "Bylinná podpora vylučování vody při dostatku tekutin",
            "Složení (např. kopřiva), léky, kontraindikace",
          ],
          [
            "Zelené potraviny",
            "Denní chlorofyl a mikroživiny do nápoje nebo tablet",
            "Chlorella / spirulina / ječmen, chuť, dávka prášku",
          ],
        ],
      },
      {
        caption: "Jakou formu zvolit u doplňků na detoxikaci",
        headers: ["Forma", "Hodí se když", "Sledujte"],
        rows: [
          [
            "Tobolky / tablety",
            "Chcete stabilní dávku a jednoduché cestování",
            "Počet kusů na dávku, cena/den, mg na štítku",
          ],
          [
            "Detox čaj / bylinná kúra",
            "Chcete pevný pitný rituál na několik dnů",
            "Složení směsi, počet dnů, návod louhování",
          ],
          [
            "Prášek ze zelených potravin",
            "Chcete míchat do vody či smoothie každý den",
            "Chuť, rozpustnost, doporučené množství",
          ],
        ],
      },
      {
        caption: "Látky ve formulích na detoxikaci organismu",
        headers: ["Složka", "Kde se typicky používá", "Co ověřit"],
        rows: [
          [
            "Ostropestřec / silymarin",
            "Podpora normální funkce jater",
            "Mg extraktu a standardizace",
          ],
          [
            "Artyčok, pampeliška",
            "Trávení a tradiční jaterní směsi",
            "Samostatně vs. v komplexu",
          ],
          [
            "Chlorella, spirulina",
            "Zelené potraviny, chlorofyl",
            "Prášek nebo tablety, denní množství",
          ],
          [
            "Vláknina (např. psyllium)",
            "Střevní komfort",
            "Zapíjení; rozestup od léků",
          ],
          [
            "Kopřiva a odvodňovací směsi",
            "Podpora vylučování vody",
            "Pití; ledviny a léky → lékař",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Detoxikace a čištění", path: "/pruvodce/detox" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Trávení", path: "/traveni" },
      { label: "Kategorie: Játra", path: "/jatra" },
    ],
    categoryFaqHi: [
      {
        q: "Nahrazuje doplněk stravy lékařskou očistu organismu?",
        a: "Ne. Lékař řeší diagnózu a léčbu. Doplňky stravy na detoxikaci organismu mohou v rámci výživy podpořit játra, střeva a vylučování, ale neléčí onemocnění a neslibují odstranění veškerých škodlivin.",
      },
      {
        q: "Podle čeho poznám, jestli mám sáhnout po játrech, střevech, nebo odvodnění?",
        a: "Podle záměru. Jaterní směr obvykle znamená ostropestřec a příbuzné byliny. Střevní směr vlákninu a komfort vyprazdňování. Odvodnění organismu bylinné směsi při pití. Vyberte jeden směr, porovnejte štítek a nekombinujte několik intenzivních kúr bez konzultace.",
      },
      {
        q: "Kolik dnů má trvat bylinná detox kúra?",
        a: "Přesný rozsah je na obalu — od krátkých programů po několik týdnů s pauzou. Bez přestávky a při chronických nemocech nebo lécích se zeptejte lékaře dřív, než cyklus prodloužíte.",
      },
      {
        q: "Co očekávat od ostropestřce a silymarinu u detoxikace jater?",
        a: "V doplňcích stravy se spojují s podporou normální funkce jater. Výsledek závisí na dávce, kvalitě extraktu a režimu. Nejde o náhradu vyšetření ani o léčbu jaterního onemocnění.",
      },
      {
        q: "Jde kombinovat detox s léky, těhotenstvím nebo kojením?",
        a: "Jen po domluvě s lékařem nebo lékárníkem. Byliny a vláknina mohou měnit vstřebávání léků; v těhotenství a při kojení je opatrnost nutná. K předepsané léčbě nic sami nepřidávejte.",
      },
      {
        q: "Musím při detoxikaci organismu hladovět nebo pít jen šťávy?",
        a: "Nemusíte. Rozumnější je odlehčit jídelníček, omezit alkohol a smažené a pít dostatek vody. Půst a extrémní džusové režimy nejsou podmínkou doplňku stravy a mohou uškodit.",
      },
      {
        q: "Kdy raději k lékaři než po doplněk?",
        a: "Při krvi ve stolici, silné bolesti břicha, déletrvajícím průjmu, žloutence, chronickém onemocnění jater či ledvin, nebo když užíváte léky na předpis a nejste si jistí interakcí. Doplněk stravy diagnózu nenahrazuje.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "detoxikace organismu",
      "očista organismu",
      "doplňky stravy na detoxikaci",
      "doplňky stravy na detoxikaci organismu",
      "detox těla",
      "jaterní očista",
      "detoxikace jater",
      "očista střev",
      "odvodnění organismu",
      "ostropestřec",
      "silymarin",
      "chlorella",
      "spirulina",
      "bylinná detox kúra",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  "potence": {
    taglineHi:
      "Porovnejte prášky na erekci a kapsle na potenci podle typu podpory — nárazově nebo jako kúra",
    shortDescHi:
      "Doplňky stravy na potenci: kapsle, kapky i gel pro podporu erekce a libida, s diskrétním doručením a dobírkou po České republice.",
    categoryIntroHi:
      "Hledáte doplňky stravy na potenci, které dávají smysl vedle realistických očekávání — ne „modrou pilulku“ bez předpisu? V kategorii Potence a libido porovnáte prášky na erekci, kapsle na potenci, kapky i gely podle toho, jestli chcete nárazovou podporu před intimním stykem, nebo dlouhodobější kúru pro libido a vitalitu. Jde o doplňky stravy, nikoli o léky na erektilní dysfunkci vázané na předpis (sildenafil, tadalafil a podobné). Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí v neutrálním balení do 2–5 pracovních dnů po celé České republice.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na potenci",
        body: "Katalog je určen dospělým mužům, kteří chtějí podpořit erekci, sexuální chuť nebo celkovou mužskou vitalitu přírodními přípravky na potenci. Dává smysl při občasných výkyvech výkonu, stresu, únavě nebo když hledáte prášky na erekci bez předpisu jako doplněk životního stylu — ne jako náhradu vyšetření. Při bolesti na hrudi, užívání nitrátů, závažných onemocněních srdce a cév, nekontrolovaném tlaku nebo chronických lécích nejdřív konzultujte lékaře. Přípravky v nabídce jsou doplňky stravy, nikoli léčiva na erektilní dysfunkci.",
        bullets: [
          "Muži 30+ s občasnou potřebou podpory erekce nebo libida",
          "Kdo preferuje diskrétní nákup online s dobírkou",
          "Ne jako náhrada urologa při přetrvávajících potížích",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na potenci",
        body: "Nejdřív si ujasněte cíl: jednorázová podpora před stykem, nebo několik týdnů pravidelného užívání. Pak porovnejte transparentní složení v miligramech, doporučené dávkování a cenu za den kúry — levné balení s vysokým počtem kapslí denně může vyjít dráž než menší balení s jasnou dávkou. U přípravků na potenci sledujte interakce s léky na tlak a srdce. Diskrétní balení je u intimní kategorie standard; ověřte si i dobu doručení.",
        bullets: [
          "Nárazová podpora — když potřebujete účinek v řádu desítek minut až hodin dle návodu",
          "Dlouhodobá kúra — když cílíte na postupnou podporu libida a vitality",
          "Počítejte cenu kúry: počet dávek ÷ denní dávka × doporučené týdny",
          "Při lécích na tlak nebo srdce — nejdřív lékař, teprve pak kúra",
        ],
      },
      {
        id: "narazove-vs-kura",
        heading: "Nárazová podpora vs. dlouhodobá kúra",
        body: "Na českém trhu se prášky na erekci a přípravky na potenci nejčastěji dělí podle režimu užívání, ne podle marketingového názvu. Nárazové formule se užívají před intimním stykem podle návodu výrobce — typicky v řádu desítek minut; po vysazení efekt odeznívá. Dlouhodobé kapsle na potenci se berou denně několik týdnů; první subjektivní změny bývají individuální a často závisí i na spánku, stresu a pohybu. Obě cesty zůstávají doplňkem stravy: při klinické erektilní dysfunkci patří rozhodnutí o léčivech na předpis do rukou lékaře.",
        bullets: [
          "Nárazově = podpora „když je potřeba“, ne trvalá změna",
          "Kúra = pravidelnost podle etikety, často 2–8 týdnů",
          "Nekombinujte více silných přípravků najednou bez konzultace",
        ],
      },
      {
        id: "slozky",
        heading: "Časté složky: L-arginin, kotvičník, maca, ženšen a zinek",
        body: "Doplňky stravy pro erekci a libido často kombinují aminokyseliny a bylinné extrakty. L-arginin a příbuzné látky se spojují s podporou NO cesty a prokrvení v rámci doplňku. Kotvičník zemní (Tribulus terrestris) a maca peruánská patří mezi oblíbené rostliny v přípravcích na potenci a libido. Ženšen se traduje pro vitalitu a odolnost vůči stresu; zinek přispívá k udržení normální hladiny testosteronu v krvi v rámci povolených tvrzení. Čtěte dávky na etiketě — seznam názvů na přední straně nestačí. Účinek je individuální; doplněk nenahrazuje lék na předpis.",
        bullets: [
          "L-arginin / citrulin — podpora prokrvení v kontextu doplňku",
          "Kotvičník a maca — časté v formulech na libido a potenci",
          "Zinek — sledujte denní dávku a celkový příjem z jiných zdrojů",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, kapky nebo gel na potenci",
        body: "Kapsle a tablety na erekci se hodí pro jasnou denní dávku i cestování. Kapky oceníte při flexibilním dávkování podle návodu — zkontrolujte chuť a případný alkohol v bázi. Gel na potenci slouží k lokální aplikaci; sledujte frekvenci a citlivost pokožky. Preferujte přípravky s uvedeným složením a schématem užívání. Porovnejte formy v tabulce níže a pak vyberte produkt v katalogu podle ceny a dostupnosti.",
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: "Doplňky stravy na potenci nejsou lékem na erektilní dysfunkci a neslibují zaručený výsledek. Nepřekračujte dávkování na obalu. Při užívání léků na předpis — zejména nitrátů, léků na tlak nebo srdce — se před kúrou poraďte s lékařem. Bolest na hrudi, náhlá dušnost, přetrvávající problémy s erekcí nebo krev v ejakulátu patří do odborné péče. Osoby mladší 18 let přípravky v této kategorii neužívají. Při neobvyklé reakci užívání přerušte a vyhledejte pomoc.",
      },
    ],
    hubTables: [
      {
        caption: "Formy doplňků stravy na potenci — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tablety",
            "Stabilní dávka, kúra i nárazové užívání dle návodu",
            "Počet kapslí na dávku, délka balení, cena za den",
          ],
          [
            "Kapky",
            "Flexibilní dávkování podle návodu výrobce",
            "Odměrka, chuť, alkohol v bázi, skladování",
          ],
          [
            "Gel",
            "Lokální aplikace, intimní komfort",
            "Frekvence, citlivost pokožky, složení",
          ],
        ],
      },
      {
        caption: "Typ podpory — nárazově vs. dlouhodobá kúra",
        headers: ["Typ", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Nárazová podpora",
            "Potřeba před intimním stykem dle návodu",
            "Čas nástupu na etiketě, počet dávek v balení",
          ],
          [
            "Dlouhodobá kúra",
            "Pravidelná podpora libida a vitality",
            "Týdny užívání, cena za celý cyklus, složení",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Potence a libido", path: "/pruvodce/potence" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Prostata", path: "/prostata" },
    ],
    categoryFaqHi: [
      {
        q: "Jsou prášky na erekci bez předpisu totéž co Viagra?",
        a: "Ne. Léčiva se sildenafilem nebo tadalafilem jsou v České republice vázaná na lékařský předpis. Prášky na erekci a doplňky stravy na potenci v této kategorii jsou potravinové doplňky — mohou podpořit vitalitu a prokrvení v rámci doplňku, ale nejsou schválenou léčbou erektilní dysfunkce.",
      },
      {
        q: "Zvolit nárazovou podporu, nebo dlouhodobou kúru?",
        a: "Nárazové přípravky se užívají před stykem podle návodu a efekt po vysazení odeznívá. Dlouhodobé kapsle na potenci se berou pravidelně několik týdnů. Záleží na tom, jestli potřebujete jednorázovou podporu, nebo postupnou práci s libidem a vitalitou. Při nejistotě se zeptejte lékaře nebo lékárníka.",
      },
      {
        q: "Jak dlouho trvá kúra doplňků na potenci?",
        a: "Výrobci často doporučují cyklus v řádu několika týdnů až přibližně dvou měsíců podle schématu na obalu. Výsledek je individuální a závisí i na životním stylu. Dlouhodobé užívání bez přestávky řešte s lékařem, zejména při chronických onemocněních.",
      },
      {
        q: "Lze kombinovat s léky na tlak nebo srdce?",
        a: "Jen po konzultaci s lékařem. Některé bylinné složky a aminokyseliny mohou ovlivnit tlak nebo interagovat s léky na srdce a cévy. Při nitratech a závažných kardiovaskulárních potížích doplněk sami nenasazujte.",
      },
      {
        q: "Kapsle, kapky nebo gel — co je lepší?",
        a: "Kapsle a tablety nabízejí přesnou dávku. Kapky umožňují flexibilnější odměření podle návodu. Gel je lokální. Účinek určuje složení a dodržování režimu, ne samotná forma. Porovnejte etiketu a cenu za den užívání.",
      },
      {
        q: "Jaké složky doplňky na potenci často obsahují?",
        a: "Často L-arginin, kotvičník zemní (tribulus), maca, ženšen a zinek — v různých dávkách. Důležitá je uvedená dávka na den a standardizace extraktu, ne jen marketingový seznam na přední straně. Doplněk stravy nenahrazuje lék na předpis.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky. Zásilky odesíláme v neutrálním balení.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "doplňky stravy na potenci",
      "prášky na erekci",
      "prášky na erekci bez předpisu",
      "kapsle na potenci",
      "tablety na erekci",
      "přípravky na potenci",
      "doplňky stravy pro erekci",
      "libido",
      "platba na dobírku",
      "diskrétní doručení",
    ],
  },

  "hubnuti": {
    taglineHi:
      "Porovnejte prášky a kapky na hubnutí podle typu účinku — ne podle marketingových slibů",
    shortDescHi:
      "Doplňky stravy na hubnutí: kapsle i kapky pro podporu režimu, s doručením a dobírkou po České republice.",
    categoryIntroHi:
      "Hledáte doplňky stravy na hubnutí, které dávají smysl vedle jídelníčku — ne zázračný úbytek přes noc? V kategorii Kontrola hmotnosti porovnáte prášky na hubnutí, kapsle i kapky podle toho, jestli cílí na chuť k jídlu, podporu metabolismu, nebo pocit sytosti. Žádný doplněk stravy nenahrazuje kalorický deficit: slouží jako podpora, abyste snáz udrželi stravu a pohyb. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na hubnutí",
        body: "Katalog je určen dospělým, kteří chtějí podpořit realistický režim hubnutí — úpravu stravy, pohyb a kontrolu chuti k jídlu. Dává smysl lidem, kteří už řeší jídelníček a hledají prášky nebo kapky na hubnutí jako doplněk, ne jako náhradu. Při BMI ve vysokém pásmu, chronických onemocněních, těhotenství, kojení nebo poruchách příjmu potravy nejdřív konzultujte lékaře. Přípravky v nabídce jsou doplňky stravy, nikoli léky na obezitu na předpis.",
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na hubnutí",
        body: "Nejdřív si ujasněte hlavní problém: přejídání a chuť k jídlu, nízká energie při pohybu, nebo chybějící sytost mezi jídly. Pak porovnejte transparentní dávku na etiketě, délku kúry a cenu za den — balení s „nízkou“ cenou může při třech dávkách denně vyjít dráž než jedna kapsle denně. U stimulačních spalovačů tuků sledujte kofein a neužívejte je večer. Realistické tempo je spíš půl až jeden kilogram týdně při deficitu; doplněk tempo nezázračně nezrychlí, jen pomůže režim udržet.",
        bullets: [
          "Tlumič hladu — když vás brzdí chuť a noční mlsání",
          "Stimulační spalovač tuků — když k hubnutí přidáváte pohyb a snášíte kofein",
          "Vláknina / sytost — když potřebujete delší pocit plnosti mezi jídly",
          "Počítejte cenu kúry: počet kapslí ÷ denní dávka × doporučené týdny",
        ],
      },
      {
        id: "typy-pripravku",
        heading: "Typy přípravků: tlumič hladu, spalovač tuků a sytost",
        body: "Na českém trhu se doplňky na hubnutí nejčastěji dělí podle mechanismu, ne podle obalu. Tlumiče hladu (např. formule s garcinií nebo chromem) mají pomoci snížit příjem — tedy snáz udržet deficit. Stimulační spalovače tuků kombinují látky jako zelený čaj, kofein, synefrin nebo L-karnitin a dávají smysl hlavně při aktivitě; pozor na celkový příjem kofeinu. Přípravky se zaměřením na vlákninu a sytost podporují pocit plnosti. Všechny typy zůstávají doplňkem stravy: bez změny jídelníčku a pohybu od nich nečekejte dramatický výsledek.",
        bullets: [
          "Deficit kalorií je základ — doplněk jen usnadňuje cestu",
          "Nekombinujte více stimulačních přípravků najednou",
          "Složení čtěte po miligramech, ne podle marketingových názvů",
        ],
      },
      {
        id: "formy",
        heading: "Kapky nebo kapsle na hubnutí",
        body: "Kapsle a tablety na hubnutí se hodí, když chcete jasnou denní dávku a snadné užívání mimo domov. Kapky na hubnutí oceníte při flexibilním dávkování podle návodu — zkontrolujte chuť, případný obsah alkoholu v tinktuře a přesné odměření. Preferujte přípravky s uvedeným obsahem účinných látek a délkou doporučené kúry. Porovnejte nabídku v tabulce forem níže a pak vyberte produkt v katalogu podle ceny a dostupnosti.",
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: "Doplňky stravy na hubnutí nejsou lékem na obezitu a neslibují zaručený úbytek hmotnosti. Nepřekračujte dávkování na obalu. Při užívání léků na předpis, onemocněních srdce, štítné žlázy nebo cukrovky se před kúrou poraďte s lékařem. Těhotenství, kojení a poruchy příjmu potravy patří do rukou odborníka — doplněk je v těchto situacích nevhodný bez konzultace. Při závratích, silných zažívacích potížích nebo neobvyklé reakci užívání přerušte a vyhledejte pomoc.",
      },
    ],
    hubTables: [
      {
        caption: "Formy doplňků stravy na hubnutí — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tablety",
            "Stabilní denní dávka, cestování, jednoduché užívání",
            "Počet kapslí denně, délka balení, cena za den kúry",
          ],
          [
            "Kapky / tinktura",
            "Flexibilní dávkování podle návodu výrobce",
            "Odměrka, chuť, alkohol v bázi, skladování",
          ],
        ],
      },
      {
        caption: "Typ přípravku podle cíle — orientační přehled",
        headers: ["Typ", "Hlavní efekt", "Na co pozor"],
        rows: [
          [
            "Tlumič hladu",
            "Podpora nižšího příjmu jídla a chuti",
            "Bez diety samotný nestačí; sledujte reakci na chuť",
          ],
          [
            "Spalovač tuků (stimulační)",
            "Podpora výdeje při pohybu, termogeneze",
            "Kofein — ne večer, omezte další kávu",
          ],
          [
            "Vláknina / sytost",
            "Delší pocit plnosti mezi jídly",
            "Dostatek tekutin; postupně navyšujte dávku",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Kontrola hmotnosti", path: "/pruvodce/hubnuti" },
      { label: "Služby: kalorie, vodní bilance, výběr doplňku", path: "/sluzby" },
      { label: "Kalorická kalkulačka a makra", path: "/sluzby/kaloricka-kalkulacka" },
      { label: "Výběr doplňku na hubnutí", path: "/sluzby/personalni-pomocnik" },
      { label: "Kalkulačka vodní bilance", path: "/sluzby/vodni-bilance" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Trávení", path: "/traveni" },
    ],
    categoryFaqHi: [
      {
        q: "Fungují prášky na hubnutí, nebo je to vyhozené peníze?",
        a: "Prášky na hubnutí nejsou zázrak, který za vás shodí kila. Fungují jako doplněk stravy — nejčastěji pomáhají tlumit chuť k jídlu, podpořit pocit sytosti nebo výdej při pohybu. Reálný úbytek stojí na kalorickém deficitu ze stravy a aktivity. Bez úpravy režimu od nich dramatický výsledek nečekejte.",
      },
      {
        q: "Jak vybrat prášky na hubnutí a na co si dát pozor?",
        a: "Nejdřív zvolte typ podle cíle: tlumič hladu, stimulační spalovač tuků, nebo podpora sytosti. Pak kontrolujte složení v miligramech, doporučené dávkování a cenu za celou kúru — ne jen cenu balení. U přípravků s kofeinem počítejte s tím, že se nehodí na večer. Jde vždy o doplněk stravy, nikoli o lék.",
      },
      {
        q: "Je nutná kombinace s dietou a pohybem?",
        a: "Ano. Doplňky stravy na hubnutí podporují režim, ale nenahrazují změnu jídelníčku ani pohyb. Bez deficitu kalorií samotná kapsle nebo kapky obvykle nepřinesou trvalý výsledek. Nejlepší praxe je doplněk + realistická strava + aktivita, kterou zvládnete dlouhodobě.",
      },
      {
        q: "Kapky nebo kapsle na hubnutí — co je lepší?",
        a: "Záleží na preferenci. Kapsle a tablety nabízejí přesnou dávku a pohodlí na cestách. Kapky na hubnutí umožňují flexibilnější dávkování podle návodu — ověřte chuť a případný alkohol v tinktuře. Účinek určuje složení a dodržování režimu, ne samotná forma balení.",
      },
      {
        q: "Jak dlouho užívat doplňky na hubnutí?",
        a: "Většina výrobců doporučuje cyklus v řádu týdnů až přibližně dvou až tří měsíců podle schématu na obalu. První změny bývají individuální a často souvisejí spíš s tím, jak držíte jídelníček. Dlouhodobé užívání bez přestávky řešte s lékařem nebo lékárníkem, zejména při chronických onemocněních.",
      },
      {
        q: "Mohu kombinovat tlumič hladu se spalovačem tuků?",
        a: "Někdy to dává smysl: jeden typ pomáhá snížit příjem, druhý podpořit výdej při pohybu. Sledujte ale celkový obsah kofeinu a stimulantů — nekombinujte více silně stimulačních přípravků najednou a nepřekračujte dávky na etiketě. Při lécích na předpis nejdřív konzultujte lékaře.",
      },
      {
        q: "Jaké účinné látky doplňky na hubnutí často obsahují?",
        a: "Často se objevují garcinie (podpora chuti a metabolismu tuků v rámci doplňku), L-karnitin (využití tuků při výkonu), katechiny ze zeleného čaje a kofein (termogeneze), chrom, vláknina pro sytost nebo rostlinné směsi. Důležitá je uvedená dávka na den, ne jen seznam názvů na přední straně.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "doplňky stravy na hubnutí",
      "prášky na hubnutí",
      "kapky na hubnutí",
      "kapsle na hubnutí",
      "spalovač tuků",
      "tlumič hladu",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  "prostata": {
    taglineHi:
      "Porovnejte doplňky stravy na prostatu podle složení, dávky a délky kúry — ne podle marketingových slibů",
    shortDescHi:
      "Doplňky stravy na prostatu v České republice: kapsle se saw palmettem a bylinami pro podporu močových cest. Ceny online, expresní kurýr, platba na dobírku.",
    categoryIntroHi:
      "Hledáte doplňky stravy na prostatu, které dávají smysl u mužů nad 40 let — ne zázračnou „léčbu“ z reklamy? V kategorii Prostata porovnáte přípravky na prostatu podle toho, co je skutečně napsané na etiketě: dávka saw palmetta (Serenoa repens), přítomnost kopřivy, slivoně africké (pygeum), vrbovky nebo zinku, a podle toho, jestli formule cílí spíš na komfort močení, noční vstávání, nebo každodenní podporu močových cest.\n\nDoplněk stravy není náhradou urologického vyšetření ani předepsané léčby. Slouží jako podpora vedle režimu (tekutiny, pohyb, kontrola u lékaře), ne jako diagnóza v kapslích. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice, v diskrétním balení bez zbytečné pozornosti na etiketě.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na prostatu",
        body: "Katalog je určen dospělým mužům, kteří chtějí podpořit zdraví prostaty a komfort močových cest. Nejčastěji jde o muže od středního věku — přibližně od 40–50 let — kdy se častěji objevuje častější močení ve dne, noční vstávání na toaletu, slabší nebo přerušovaný proud, pocit neúplného vyprázdnění nebo tlak v podbřišku. Tyto příznaky lidé popisují jako „prostata začíná zlobit“; odborně se často řadí k obtížím dolních močových cest.\n\nDoplněk stravy dává smysl u mírných obtíží nebo jako součást prevence a životního stylu — ne jako náhrada diagnózy. Pokud už máte doporučení urologa, doplněk ho nenahrazuje; pokud diagnózu nemáte a příznaky se zhoršují, nejdřív vyšetření, teprve pak výběr kapsle.\n\nKrev v moči, horečka, silná bolest, náhlá neschopnost se vymočit nebo rychlé zhoršení stavu patří ihned k lékaři. V těchto situacích doplněk stravy nestačí a odkládání vyšetření může škodit.",
        bullets: [
          "Častější močení ve dne nebo opakované noční vstávání",
          "Slabší, tenčí nebo přerušovaný proud moči",
          "Pocit neúplného vyprázdnění, tlak v podbřišku nebo v oblasti hráze",
          "Muži nad 40–50 let hledající denní podporu prostaty a močových cest",
          "Red flags (krev, horečka, retence, silná bolest) = urolog, ne e-shop",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na prostatu",
        body: "Nejdřív si ujasněte hlavní problém: noční močení, slabý proud, celkový diskomfort při močení, nebo spíš prevence bez výrazných příznaků. Od toho se odvíjí, jestli hledáte jednosložkové saw palmetto s jasnou dávkou, nebo komplex s kopřivou, pygeem, vrbovkou a minerály.\n\nPak čtěte etiketu po miligramech — ne podle slov „forte“, „max“ nebo „aktiv“. U saw palmetta (Serenoa repens) sledujte deklarovanou dávku extraktu na den a případnou standardizaci na mastné kyseliny nebo fytosteroly (lipidosterolickou frakci). U komplexů porovnejte i mg kopřivy, slivoně africké a obsah zinku či selenu v % referenční hodnoty příjmu.\n\nSpočítejte cenu za den kúry: cena balení vydělená počtem denních dávek. Levná krabička při třech kapslích denně může vyjít dráž než jedna dobře dávkovaná tobolka. Realistické očekávání u bylinných doplňků je řád týdnů pravidelného užívání — často 4–12 týdnů — ne okamžitý efekt přes noc. Pokud užíváte léky na předpis, před kúrou se zeptejte lékaře nebo lékárníka na možné interakce.",
        bullets: [
          "Transparentní dávka účinných látek na den — ne jen seznam názvů na přední straně",
          "Standardizace saw palmetta (např. obsah mastných kyselin) tam, kde je uvedena",
          "Délka doporučené kúry a cena za jeden den užívání",
          "Jednosložkové saw palmetto vs. bylinný komplex — podle cíle a kontroly dávky",
          "Interakce s léky na předpis — konzultace před zahájením kúry",
        ],
      },
      {
        id: "ocekavani",
        heading: "Co očekávat: časový rámec a realistické výsledky",
        body: "Doplňky stravy na prostatu nejsou „rychlá úleva za 48 hodin“. Bylinné extrakty a minerály potřebují pravidelné užívání; výrobci i zkušenosti uživatelů typicky zmiňují první změny spíš po několika týdnech — často v pásmu 4–8 týdnů — a plnější vyhodnocení až kolem 1–3 měsíců podle schématu na obalu.\n\nCo doplněk může podpořit v rámci výživy: každodenní komfort močových cest a pocit „méně řeším prostatu“. Co neslibuje: vyléčení zbytnění prostaty, zánětu nebo rakoviny, ani zaručené vymizení nočního močení. Pokud se po měsíci pravidelného užívání obtíže zhoršují nebo se objeví nové varovné příznaky, kúra se nepřekřikuje vyšší dávkou — jde se k urologovi.\n\nParalelně má smysl režim: přiměřený příjem tekutin (ne extrém večer), omezení alkoholu a kofeinu večer, pokud spouštějí nucení, a pohyb. Doplněk je podpora, ne náhrada těchto návyků.",
        bullets: [
          "První změny často nejdřív po 4–8 týdnech pravidelného užívání",
          "Cyklus dle výrobce obvykle v řádu týdnů až ~1–3 měsíců",
          "Žádný zaručený výsledek — doplněk stravy, ne léčba",
          "Zhoršení během kúry = lékař, ne vyšší dávka na vlastní pěst",
        ],
      },
      {
        id: "ucinne-latky",
        heading: "Účinné látky: saw palmetto, kopřiva, pygeum a minerály",
        body: "Na českém trhu se přípravky na prostatu nejčastěji opírají o rostlinné extrakty tradičně spojené s mužskými močovými cestami. Základem většiny formulí je saw palmetto — palma plazivá, latinsky Serenoa repens. Aktivní podíl je v plodech; výrobci používají extrakty, u nichž u kvalitnějších produktů najdete uvedený obsah lipidosterolické frakce nebo mastných kyselin. Při výběru dává smysl hledat konkrétní mg extraktu na den a případnou standardizaci — marketingový seznam bylin bez čísel je slabší vodítko.\n\nKopřiva dvoudomá (Urtica dioica), často jako extrakt z kořene, a slivoň africká (Pygeum africanum) doplňují směsi pro podporu funkce prostaty, močového měchýře a močových cest v rámci doplňku stravy. Vrbovka malokvětá a extrakt z dýňových semen se objevují v bylinných formulech i čajích. Zinek přispívá k udržení normální hladiny testosteronu v krvi, k normální plodnosti a reprodukci a k ochraně buněk před oxidačním stresem; selen přispívá k normální tvorbě spermií a k ochraně buněk. Beta-sitosterol a další fytosteroly bývají součástí lipidových frakcí rostlin.\n\nDůležité: doplněk stravy není registrovaný léčivý přípravek. Při středně těžkých až těžkých obtížích rozhoduje lékař — ten může doporučit jiné postupy než samotnou kapsli z e-shopu. Tabulka níže shrnuje, na co se dívat na etiketě u jednotlivých složek.",
        bullets: [
          "Saw palmetto (Serenoa repens) — nejčastější základ; hledejte mg a standardizaci",
          "Kopřiva a pygeum — časté synergetické byliny v komplexe",
          "Vrbovka / dýně — bylinná podpora v kapslích i čajích",
          "Zinek a selen — deklarované % RHP v denní dávce",
          "Čtěte dávky v mg, ne jen marketingové názvy „komplexů“",
        ],
      },
      {
        id: "ds-vs-lek",
        heading: "Doplněk stravy, nebo volně prodejný přípravek z lékárny?",
        body: "V české lékárně i online nabídce se vedle sebe objevují dvě odlišné kategorie. Doplněk stravy (potravina) podporuje organismus v rámci výživy — na obalu nesmí slibovat léčbu onemocnění. Volně prodejný léčivý přípravek (tradiční rostlinný lék apod.) má jiný regulatorní rámec a příbalovou informaci; jeho použití u konkrétních obtíží po vyloučení závažných příčin řeší lékař nebo lékárník.\n\nTato kategorie na Recenze Ceny nabízí doplňky stravy. To neznamená, že „doplněk je vždy horší“ — znamená to, že očekávání musí být jiná: podpora komfortu a režimu, ne léčba diagnózy. Pokud máte střední až těžké obtíže, bolest, krev v moči nebo už doporučení urologa, nejdřív odborná péče. Katalog pak slouží k porovnání formulí, cen a dostupnosti s dobírkou — ne k samoléčbě vážného stavu.",
        bullets: [
          "Doplněk stravy = podpora v rámci výživy, ne léčba onemocnění",
          "Léčivý přípravek = jiný status; rozhoduje lékař / lékárník",
          "Střední a těžké obtíže = vyšetření dřív než objednávka",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, tablety a další formy přípravků na prostatu",
        body: "Nejčastější formou doplňků stravy na prostatu jsou kapsle a tablety: přesná denní dávka, snadné užívání mimo domov a dobře srovnatelné složení napříč značkami. Softgel tobolky se hodí u olejových / lipidových extraktů (typicky saw palmetto) — často se užívají s jídlem podle návodu.\n\nBylinné čaje (například s vrbovkou) mohou doplnit pitný režim, ale obvykle nenahrazují standardizovanou kapsli s deklarovanými mg extraktu. Preferujte přípravky s jasným dávkováním, délkou kúry a seznamem účinných látek na obalu. Porovnejte formy v tabulce níže a pak vyberte produkt v katalogu podle ceny a dostupnosti — s platbou na dobírku a diskrétním doručením po celé České republice.",
        bullets: [
          "Kapsle / tablety — denní rutiná a srovnání dávek",
          "Softgel — typicky lipidový extrakt saw palmetta",
          "Čaj — doplněk režimu, ne automatická náhrada kapsle",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k urologovi",
        body: "Doplňky stravy na prostatu nejsou lékem na zbytnění prostaty ani na zánět a neslibují zaručené vymizení příznaků. Nepřekračujte dávkování na obalu. Citlivější jedinci mohou mít mírné zažívací obtíže — často pomůže užívání s jídlem dle návodu.\n\nPři užívání léků na předpis (například na tlak, ředění krve nebo hormonální léčbu) se před kúrou poraďte s lékařem. Krev v moči, horečka, silná bolest v podbřišku nebo bedrech, náhlá retence moči, nevysvětlitelný úbytek hmotnosti nebo rychlé zhoršení obtíží patří ihned k urologovi — doplněk v těchto situacích nepoužívejte jako náhradu vyšetření.\n\nPodrobnější medicínský kontext najdete na stránce medical expert; praktický checklist výběru v průvodci výběrem Prostata.",
      },
    ],
    hubTables: [
      {
        caption: "Formy doplňků stravy na prostatu — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tablety",
            "Denní podpora prostaty, jasná dávka, cestování",
            "Mg účinných látek, počet kapslí denně, cena za den kúry",
          ],
          [
            "Softgel / olejový extrakt",
            "Když preferujete lipidový extrakt (např. saw palmetto)",
            "Standardizace, užívání s jídlem, délka balení",
          ],
          [
            "Bylinný čaj",
            "Doplněk pitného režimu, mírná bylinná podpora",
            "Není náhradou standardizované kapsle; frekvence louhování",
          ],
        ],
      },
      {
        caption: "Účinné látky v přípravcích na prostatu — orientační přehled",
        headers: ["Složka", "Proč se používá", "Na co se dívat na etiketě"],
        rows: [
          [
            "Saw palmetto (Serenoa repens)",
            "Nejčastější základ podpory prostaty a močových cest",
            "Dávka extraktu / den; standardizace na mastné kyseliny či steroly",
          ],
          [
            "Kopřiva dvoudomá (Urtica dioica)",
            "Podpora funkce prostaty a močového ústrojí v rámci DS",
            "Extrakt z kořene nebo listu; poměr extraktu; mg v denní dávce",
          ],
          [
            "Slivoň africká (Pygeum africanum)",
            "Častá složka komplexů pro prostatu a močový měchýř",
            "Mg extraktu v denní dávce",
          ],
          [
            "Vrbovka malokvětá / dýňová semena",
            "Bylinná podpora v čajích a kombinovaných formulech",
            "Forma (čaj vs. extrakt), doporučená délka užívání",
          ],
          [
            "Zinek a selen",
            "Normální plodnost, ochrana buněk; zinek i testosteron",
            "% RHP v denní dávce; organická vs. anorganická forma",
          ],
          [
            "Beta-sitosterol / fytosteroly",
            "Často součást lipidové frakce rostlin (vč. saw palmetta)",
            "Zda je obsah deklarovaný samostatně, nebo jen v extraktu",
          ],
        ],
      },
      {
        caption: "Scénář výběru — orientační mapa",
        headers: ["Situace", "Co zvážit v katalogu", "Kdy spíš k lékaři"],
        rows: [
          [
            "Mírné noční vstávání, bez red flags",
            "Doplněk se saw palmettem / komplex; sledujte dávku a cenu/den",
            "Pokud se zhoršuje, nebo se objeví krev / bolest / horečka",
          ],
          [
            "Chci kontrolovat jednu látku",
            "Jednosložkové saw palmetto s uvedenými mg a standardizací",
            "Při chronických lécích — konzultace před kúrou",
          ],
          [
            "Širší bylinná podpora v jedné kapsli",
            "Komplex: saw palmetto + kopřiva / pygeum + zinek",
            "Střední až těžké obtíže — nejdřív urolog",
          ],
          [
            "Prevence ve středním věku bez příznaků",
            "Jasné složení, dlouhodobě snesitelná cena kúry",
            "Rodinná anamnéza / věk 50+ — i preventivní prohlídka",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Prostata", path: "/pruvodce/prostata" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Potence a libido", path: "/potence" },
    ],
    categoryFaqHi: [
      {
        q: "Fungují doplňky stravy na prostatu, nebo je lepší hned lék z lékárny?",
        a: "Doplněk stravy a volně prodejný léčivý přípravek nejsou totéž. Doplňky podporují komfort prostaty a močových cest v rámci výživy a nesmí slibovat léčbu onemocnění. Léčivý přípravek má jiný status a příbalový leták — o vhodnosti u vašich obtíží rozhoduje lékař nebo lékárník. Při středních až těžkých obtížích nejdřív urolog; katalog doplňků pak slouží k porovnání složení a ceny, ne k samoléčbě vážného stavu.",
      },
      {
        q: "Jak vybrat přípravek na prostatu podle složení?",
        a: "Sledujte konkrétní dávky na den: u saw palmetta mg extraktu a případnou standardizaci na mastné kyseliny nebo fytosteroly; u komplexů i mg kopřivy, pygea nebo vrbovky a % RHP zinku či selenu. Spočítejte cenu za den kúry a délku doporučeného užívání. Marketingový název „forte“ nebo dlouhý seznam bylin bez čísel na etiketě je slabé vodítko.",
      },
      {
        q: "Pomáhají doplňky při nočním močení?",
        a: "Někteří muži po týdnech pravidelného užívání popisují větší komfort močových cest včetně méně častého nočního vstávání — výsledek je individuální a není zaručený. Doplněk stravy noční močení „nevyléčí“. Zároveň má smysl upravit tekutiny a stimulanty večer. Při náhlém zhoršení, bolesti nebo krvi v moči jděte k lékaři, nečekejte na efekt kapsle.",
      },
      {
        q: "Je doplněk na prostatu vhodný pro muže nad 50 let?",
        a: "Ano, kategorie cílí právě na muže středního a vyššího věku, kdy jsou obtíže močových cest častější. Před zahájením kúry — zvláště při chronických onemocněních nebo lécích na předpis — konzultujte lékaře. Od 50 let má smysl i pravidelná urologická prevence nezávisle na tom, jestli užíváte doplněk stravy.",
      },
      {
        q: "Jak dlouho užívat doplňky stravy na prostatu?",
        a: "Výrobci často doporučují cyklus v řádu týdnů až přibližně 1–3 měsíců podle schématu na obalu. První změny lidé popisují spíš po 4–8 týdnech než po pár dnech. Řiďte se návodem a nepřekračujte dávku. Dlouhodobé užívání při přetrvávajících nebo zhoršujících se příznacích bez kontroly u lékaře nedává smysl — doplněk nenahrazuje vyšetření.",
      },
      {
        q: "Saw palmetto samotné, nebo komplex s kopřivou a zinkem?",
        a: "Jednosložkové saw palmetto dává smysl, když chcete kontrolovat jednu látku, její dávku a případnou standardizaci. Komplex (saw palmetto + kopřiva, pygeum, zinek…) volíte, když hledáte širší bylinnou podporu v jedné kapsli a nechcete skládat více přípravků. V obou případech rozhoduje deklarované množství v mg, ne počet položek v seznamu složek na přední straně balení.",
      },
      {
        q: "Na co se dívat u standardizace saw palmetta?",
        a: "U kvalitnějších extraktů výrobci uvádějí nejen mg výtažku, ale i podíl mastných kyselin nebo lipidosterolické frakce. To usnadní srovnání produktů. Pokud je na obalu jen „saw palmetto“ bez dávky, srovnání je obtížné. Stále jde o doplněk stravy — standardizace není garance klinického výsledku u konkrétního muže.",
      },
      {
        q: "Kdy místo doplňku rovnou k urologovi?",
        a: "Okamžitě při krvi v moči, horečce, silné bolesti v podbřišku nebo bedrech, neschopnosti se vymočit, bolesti v bedrech nebo nevysvětlitelném hubnutí. Stejně tak, když se obtíže rychle zhoršují. Doplněk stravy v těchto situacích diagnózu neodloží — vyšetření ano. I bez red flags má urolog smysl, pokud vás noční močení nebo proud dlouhodobě omezují.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky. Balení je diskrétní.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "doplňky stravy na prostatu",
      "přípravky na prostatu",
      "vitamíny na prostatu",
      "saw palmetto",
      "serenoa repens",
      "kopřiva dvoudomá",
      "slivoň africká",
      "pygeum",
      "vrbovka malokvětá",
      "noční močení",
      "časté močení",
      "zdraví prostaty",
      "močové cesty",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** One-off rich hub (SERP-led): not generated from thin pack(). */
  "zrak": {
    taglineHi: "Kapsle na podporu očí při monitorech i dlouhodobé péči o zrak",
    shortDescHi:
      "Doplňky stravy na zrak — kapsle a tablety s luteinem, zeaxantinem a zinkem pro podporu očí, s doručením a platbou na dobírku po celé České republice.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na zrak, vitamíny na oči nebo kapsle s luteinem? V kategorii Zrak na Recenze Ceny porovnáte přípravky zaměřené na podporu očí při práci u obrazovky, citlivosti na světlo i dlouhodobé výživě sítnice — vždy jako doplněk stravy, ne jako náhradu očního vyšetření.",
      "Digitální zátěž, řízení a věkové změny patří k nejčastějším důvodům, proč lidé hledají doplňky stravy pro oči a zrak. Proto u každého produktu sledujte složení (lutein, zeaxantin, zinek, omega-3), doporučenou délku užívání a cenu za denní dávku — ne obecné sliby „obnovy zraku“.",
      "Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice. Doplněk stravy nenahrazuje brýle, oční kapky ani diagnózu očního lékaře.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Zrak“",
        body: [
          "Katalog ocení dospělí, kteří tráví hodiny u monitoru, telefonu nebo za volantem a řeší únavu očí, pálení, pocit suchosti nebo citlivost na jasné světlo. Častý profil je kancelářská práce, večerní obrazovky a méně mrkání — tedy situace, kde režim (přestávky, osvětlení) hraje stejně velkou roli jako výběr doplňku.",
          "Doplňky stravy na ochranu očí dávají smysl i jako dlouhodobá podpora výživy očí u dospělých, kteří chtějí cíleně doplnit karotenoidy a antioxidanty ze stravy. Nejsou určené jako náhrada brýlí, kontaktních čoček ani léčby očních onemocnění.",
          "Náhlá ztráta zraku, záblesky, výpadek části zorného pole, silná bolest oka nebo úraz oka patří okamžitě k lékaři — ne do „delší domácí kúry“ kapslí.",
        ].join("\n\n"),
        bullets: [
          "Dospělí s únavou očí z monitorů a digitální zátěží",
          "Kdo chce porovnat vitamíny na oči a kapsle s luteinem online",
          "Ne jako náhrada očního vyšetření, brýlí ani očních kapek",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na zrak",
        body: [
          "Nejdřív oddělte cíl: dlouhodobá vnitřní podpora (kapsle/tablety), lokální zvlhčení (oční kapky v lékárně), nebo korekce vidění (brýle/optika). Až potom porovnejte složení v miligramech, délku doporučené kúry a cenu za denní použití.",
          "U doplňků stravy na zrak sledujte lutein a zeaxantin, zinek (který přispívá k udržení normálního stavu zraku), případně vitaminy C a E a omega-3 s DHA. Transparentní etiketa je důležitější než marketingové „forte“ na přední straně. Karotenoidy se lépe vstřebávají s jídlem obsahujícím tuk — čtěte návod na obalu.",
        ].join("\n\n"),
        bullets: [
          "Forma: kapsle/tablety pro vnitřní podporu — kapky a brýle jsou jiné kategorie",
          "Složení: lutein, zeaxantin, zinek, případně omega-3 / borůvky — čtěte mg na dávku",
          "Délka kúry a cena za denní použití",
          "Užívání s jídlem (tuk) podle návodu",
          "Red flags: záblesky, výpadek pole, bolest oka → oční lékař",
        ],
      },
      {
        id: "ucinne-latky",
        heading: "Lutein, zeaxantin a další látky ve výživě očí",
        body: [
          "Lutein a zeaxantin jsou karotenoidy, které se přirozeně soustředí v centrální oblasti sítnice. Tělo je samo nevytváří, proto se doplňují stravou (listová zelenina, vejce) nebo doplňkem. V spotřebitelských formulích bývá lutein často v řádu jednotek až nižších desítek mg denně — konkrétní dávku vždy berte z etikety, ne z obecného „doporučení z internetu“.",
          "Zinek přispívá k udržení normálního stavu zraku a k metabolismu vitaminu A. Vitaminy C a E spolu se stopovými prvky často doplňují antioxidační profil. Omega-3 (zejména DHA) a extrakt z borůvek se objevují v komplexních směsích zaměřených na oči — opět hodnotíte konkrétní přípravek, ne obecný seznam látek.",
          "Doplněk stravy s těmito složkami podporuje výživu a komfort; neléčí šedý zákal, zelený zákal ani věkem podmíněnou makulární degeneraci. Diagnózu a léčbu stanoví oční lékař.",
        ].join("\n\n"),
      },
      {
        id: "formy",
        heading: "Kapsle, oční kapky a brýle — co patří kam",
        body: [
          "Kapsle a tablety jsou typická forma doplňků stravy na zrak: denní vnitřní podpora s luteinem, zeaxantinem a dalšími látkami. Hodí se, když chcete dlouhodobější rutinu a jednoduché dávkování podle návodu.",
          "Oční kapky (umělé slzy) řeší lokální suchost a podráždění povrchu oka — to je jiná kategorie než ústní doplněk. Brýle a optické pomůcky korigují vidění; doplněk stravy je nenahrazuje.",
          "V tomto katalogu se soustředíme na doplňky stravy (kapsle/tablety). Pokud potřebujete kapky nebo korekci dioptrií, začněte u lékárníka nebo očního lékaře / optometristy — a doplněk berte jen jako případnou podporu režimu.",
        ].join("\n\n"),
      },
      {
        id: "rezim",
        heading: "Režim u obrazovky a péče o oči",
        body: [
          "Doplněk stravy dává největší smysl vedle režimu: pravidlo 20-20-20 (každých 20 minut se 20 sekund podívejte na vzdálený bod), častější mrkání, správná vzdálenost od monitoru a přiměřený jas. Suché oči při PC často souvisí s málo mrkáním — lokální zvlhčení řeší kapky, ne „silnější“ kapsle.",
          "Pestřejší jídelníček s listovou zeleninou, vejci a zdroji omega-3 podporuje stejné látky, které hledáte v doplňcích. Přípravek doplňuje rutinu — nenahrazuje spánek, přestávky ani vyšetření.",
        ].join("\n\n"),
        bullets: [
          "20-20-20 a přestávky při práci u monitoru",
          "Mrkání a zvlhčení při suchých očích (kapky dle lékárníka)",
          "Strava + doplněk — ne doplněk místo režimu",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na zrak nenahrazují oční vyšetření ani léčbu očních onemocnění. Při záblescích, výpadku zorného pole, náhlém zhoršení vidění, silné bolesti oka, úrazu nebo cizím tělese v oku vyhledejte pomoc ihned.",
          "V těhotenství, při kojení a při lécích na předpis se před kúrou poraďte s lékařem. Dodržujte dávkování na obalu; vyšší dávka karotenoidů sama o sobě neznamená „lepší zrak“. Děti a osoby s chronickým očním onemocněním potřebují individuální doporučení odborníka.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy péče o oči — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          ["Kapsle / tablety (doplněk stravy)", "Dlouhodobá vnitřní podpora, lutein a zinek", "Mg na dávku, délka kúry, užívání s jídlem"],
          ["Oční kapky (lékárna)", "Suchost, pálení, lokální komfort povrchu oka", "Konzervanty, frekvence, typ umělé slzy"],
          ["Brýle / optika", "Korekce vidění, filtr světla dle doporučení", "Dioptrie, odborné měření — ne „místo“ doplňku"],
          ["Režim u PC (20-20-20)", "Únava očí z monitorů", "Jas, vzdálenost, mrkání, přestávky"],
        ],
      },
      {
        caption: "Časté látky v doplňcích stravy na zrak",
        headers: ["Látka", "K čemu se vztahuje", "Tip při výběru"],
        rows: [
          ["Lutein", "Karotenoid v oblasti ostřejšího vidění", "Čtěte mg na denní dávku (často jednotky–desítky mg)"],
          ["Zeaxantin", "Často v páru s luteinem", "Poměr a zdroj na etiketě"],
          ["Zinek", "Přispívá k udržení normálního stavu zraku", "Dávka vs. horní limit; interakce s léky"],
          ["Vitaminy C a E", "Antioxidační podpora buněk", "Komplex vs. izolovaný lutein"],
          ["Omega-3 (DHA)", "Součást výživy očních tkání ve směsích", "Obsah DHA/EPA, chuť, původ oleje"],
          ["Extrakt z borůvek", "Bylinná složka v některých formulích", "Standardizace extraktu, ne jen „borůvky“ na obalu"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Zrak", path: `${GUIDE_PATH}/zrak` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Proti stresu", path: "/stres" },
    ],
    categoryFaqHi: [
      {
        q: "Nahrazují doplňky stravy na zrak oční vyšetření?",
        a: "Ne. Doplněk stravy může podpořit výživu a komfort očí, ale nestanoví diagnózu. Změny vidění, bolest oka nebo náhlé potíže patří k očnímu lékaři.",
      },
      {
        q: "Jak dlouho užívat kapsle na oči?",
        a: "Řiďte se návodem na obalu — často se hodnotí pravidelné užívání po několik týdnů až měsíců. Účinek je individuální; při zhoršení potíží kúru nepřetahujte a konzultujte odborníka.",
      },
      {
        q: "Kolik luteinu mívají doplňky stravy?",
        a: "Ve spotřebitelských přípravcích bývá lutein často v řádu přibližně 6–20 mg na denní dávku, někdy i jinak. Vždy se řiďte konkrétní etiketou — nejde o lékařský předpis dávky.",
      },
      {
        q: "Kapsle, oční kapky, nebo brýle?",
        a: "Kapsle jsou ústní doplněk stravy pro dlouhodobou podporu. Oční kapky zvlhčují povrch oka. Brýle korigují vidění. Jde o různé nástroje — doplněk nenahrazuje kapky ani optiku.",
      },
      {
        q: "Je lepší užívat lutein s jídlem?",
        a: "Karotenoidy jsou rozpustné v tucích, proto mnoho výrobců doporučuje užívání s jídlem. Dodržujte návod konkrétního přípravku.",
      },
      {
        q: "Pomohou doplňky při únavě očí z monitoru?",
        a: "Mohou být součástí podpory vedle režimu: přestávky 20-20-20, mrkání, jas monitoru a případně umělé slzy. Samotná kapsle únavu z digitální zátěže „nevyléčí“.",
      },
      {
        q: "Kdy raději k očaři než po doplněk?",
        a: "Při záblescích, výpadku zorného pole, náhlém zhoršení vidění, silné bolesti, úrazu oka nebo při potížích, které se rychle zhoršují. Doplněk v těchto situacích nestačí.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na zrak",
      "doplňky stravy pro oči a zrak",
      "doplňky stravy na ochranu očí",
      "vitamíny na oči",
      "kapsle na oči",
      "lutein",
      "zeaxantin",
      "zeaxanthin",
      "zinek na zrak",
      "omega-3 DHA oči",
      "extrakt z borůvek",
      "únava očí z monitoru",
      "modré světlo",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** One-off rich hub (SERP-led): not generated from thin pack(). */
  hemoroidy: {
    taglineHi: "Diskrétní výběr kapslí a krémů pro každodenní komfort",
    shortDescHi:
      "Doplňky stravy na hemoroidy — kapsle a krémy pro podporu žilního komfortu a citlivé oblasti, s dobírkou a neutrálním balením po celé ČR.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na hemoroidy, kapsle na hemoroidy nebo krém na hemoroidy? V kategorii Hemoroidy na Recenze Ceny porovnáte přípravky zaměřené na každodenní komfort citlivé oblasti konečníku a podporu žilního tonu — vždy jako doplněk režimu, ne jako náhradu proktologického vyšetření.",
      "Téma hemoroidů (někdy hledané i jako „hemeroidy“) je citlivé: svědění, pálení, tlak při sezení nebo nepohodlí po stolici. Proto nabízíme diskrétní balení, platbu na dobírku a doručení kurýrem po České republice, abyste mohli vybírat v klidu a bez zbytečné pozornosti.",
      "Než sáhnete po přípravku, oddělte podporu komfortu od situace, která patří k lékaři. Doplněk stravy nenahrazuje diagnózu. Při krvi ve stolici, silné bolesti, horečce nebo náhlém zhoršení neotálejte s odbornou péčí — katalog slouží k výběru formy a složení, ne k samoléčbě závažných stavů.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Hemoroidy“",
        body: [
          "Katalog ocení dospělí, kteří řeší mírný až střední diskomfort v oblasti konečníku: svědění, pálení, pocit tlaku po dlouhém sezení, citlivost po zácpě nebo při cestování. Častý profil je sedavé zaměstnání, málo pohybu, nízký příjem vlákniny a opakované tlačení při stolici — tedy situace, kde režim a šetrná péče hrají hlavní roli.",
          "Doplňky stravy na hemoroidy a lokální krémy/gely dávají smysl jako podpora komfortu a součást každodenní rutiny. Nejsou určené jako náhrada léků vázaných na předpis ani jako řešení vyhřezlých nebo silně krvácejících projevů. Těhotenství, kojení a chronická onemocnění vždy konzultujte s lékařem dříve, než zahájíte kúru.",
          "Silné krvácení, horečka, náhlá bolest, tma ve stolici nebo potíže, které se během několika dnů zhoršují, patří k lékaři — ne do „delší domácí kúry“.",
        ].join("\n\n"),
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na hemoroidy",
        body: [
          "Nejdřív zvolte cíl: vnitřní podpora (kapsle/tablety), lokální komfort (krém/gel), nebo jejich kombinace s úpravou režimu. Až potom porovnejte složení, délku doporučené kúry a cenu za denní použití. Transparentní etiketa je důležitější než obecné sliby „rychlé úlevy“.",
          "U aptek často najdete i masti a čípky na hemoroidy jako volně prodejné léky — to je jiná kategorie než doplňky stravy. V našem výběru se soustředíme na doplňky a kosmetickou/lokální péči pro komfort; při akutních příznacích se poraďte s lékárníkem nebo lékařem o vhodné formě.",
        ].join("\n\n"),
        bullets: [
          "Forma: kapsle pro vnitřní podporu, krém/gel pro lokální aplikaci",
          "Složení: flavonoidy, bylinné extrakty, vláknina — čtěte dávku na etiketě",
          "Délka kúry a cena za denní použití",
          "Diskrétní doprava a platba na dobírku po ČR",
          "Red flags: krev ve stolici, silná bolest, horečka → lékař",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, krém, gel — a co masti či čípky",
        body: [
          "Kapsle a tablety se hodí, když hledáte dlouhodobější vnitřní podporu žilního komfortu a chcete jednoduché denní užívání. Sledujte doporučenou dávku, délku cyklu a případné interakce s léky na předpis.",
          "Krém nebo gel zvolíte při lokálním svědění, pálení nebo citlivosti pokožky kolem konečníku. Nanášejte na čistou pokožku podle návodu; při poškozené kůži nebo silném zarudnutí raději přerušte a konzultujte odborníka.",
          "Masti a čípky na hemoroidy v lékárně často patří mezi léčivé přípravky s přesným dávkováním a omezenou délkou používání. Doplněk stravy je jiná kategorie: podporuje komfort a režim, ale nenahrazuje lokální léčbu ani proktologické vyšetření. Pokud si nejste jistí výběrem formy, začněte u lékárníka nebo praktického lékaře.",
        ].join("\n\n"),
      },
      {
        id: "slozeni",
        heading: "Co bývá ve složení přípravků na hemoroidy",
        body: [
          "V doplňcích a lokální péči se často objevují látky spojené s podporou cév a zklidněním citlivé oblasti: flavonoidy (např. diosmin, hesperidin, rutin), extrakty z dubové kůry, vilínu nebo kaštanu, a dále vláknina (psyllium) či probiotika jako podpora pravidelného vyprazdňování. Konkrétní přípravek vždy posuzujte podle etikety — ne podle obecného seznamu „co pomáhá na hemoroidy“.",
          "Důležité: u léčiv s diosminem/hesperidinem platí přesné dávkování z příbalového letáku. U doplňků stravy je cílem transparentní složení a realistické očekávání — podpora komfortu, ne zaručené „vyléčení“ hemoroidální nemoci.",
        ].join("\n\n"),
      },
      {
        id: "rezim",
        heading: "Režim a každodenní péče při hemoroidech",
        body: [
          "Nejúčinnější „základ“ při mírných potížích bývá režim: dostatek vlákniny a tekutin, pravidelný pohyb, kratší sezení na toaletě bez zbytečného tlačení a šetrná hygiena po stolici. Doplněk nebo krém pak doplňuje rutinu — nenahrazuje ji.",
          "Někteří lidé využívají i krátké sedací koupele (např. s odvarem z bylin) jako součást domácí péče; vždy dbejte na teplotu vody a čistotu. Pokud potíže přetrvávají i po úpravě režimu, neprodlužujte samoléčbu — včasné vyšetření je bezpečnější než další týdny odkladu.",
        ].join("\n\n"),
        bullets: [
          "Vláknina a pitný režim snižují tlak při stolici",
          "Pohyb a přestávky při dlouhém sezení",
          "Šetrná hygiena, měkký papír, bez agresivního tření",
          "Doplněk/krém jako podpora — ne náhrada lékaře",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na hemoroidy nenahrazují diagnózu ani léčbu hemoroidální nemoci. Krev ve stolici vždy patří k lékaři — může jít i o jiné onemocnění střeva nebo konečníku. Totéž platí při silné bolesti, horečce, vyhřezlém útvaru, který nejde vrátit, nebo při zhoršení během několika dnů.",
          "Při lécích na předpis, těhotenství a kojení se před kúrou poraďte s lékařem. Na poškozenou nebo silně podrážděnou kůži lokální přípravek neaplikujte bez odborné rady.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy péče při hemoroidech — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          ["Kapsle / tablety", "Vnitřní podpora, denní rutina", "Složení, dávka, délka kúry"],
          ["Krém / gel", "Lokální svědění, pálení, citlivost", "Frekvence, citlivost kůže"],
          ["Režim (vláknina, pohyb)", "Základ při mírných potížích", "Pití, stolice bez tlačení"],
          ["Mast / čípky (lékárna)", "Akutní lokální péče dle lékárníka", "Léčivý přípravek ≠ doplněk stravy"],
        ],
      },
      {
        caption: "Časté látky v přípravcích souvisejících s hemoroidy",
        headers: ["Látka / typ", "K čemu se vztahuje", "Tip při výběru"],
        rows: [
          ["Flavonoidy (diosmin, hesperidin, rutin)", "Časté ve venotonické podpoře", "Doplněk vs. lék — čtěte kategorii na obalu"],
          ["Dubová kůra, vilín, kaštan", "Lokální nebo bylinná péče", "Koncentrace a návod k použití"],
          ["Psyllium / vláknina", "Pravidelné vyprazdňování, méně tlaku", "Dostatek tekutin při užívání"],
          ["Probiotika", "Podpora střevní rovnováhy", "Kombinujte s režimem, ne místo lékaře"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Hemoroidy", path: `${GUIDE_PATH}/hemorrhoids` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Trávení", path: "/traveni" },
      { label: "Kategorie: Křečové žíly", path: "/krecove-zily" },
    ],
    categoryFaqHi: [
      {
        q: "Kapsle nebo krém — jaká forma?",
        a: "Kapsle volte pro vnitřní denní podporu, krém nebo gel při lokálním svědění a pálení. Často se kombinují s vlákninou, pitným režimem a pohybem. Masti a čípky z lékárny mohou být léčivé přípravky — to je jiná kategorie než doplněk stravy.",
      },
      {
        q: "Co pomáhá na hemoroidy kromě přípravku?",
        a: "Základem je režim: vláknina, dostatek tekutin, pohyb, kratší sezení na toaletě a šetrná hygiena. Přípravek doplňuje komfort; při krvi ve stolici nebo silné bolesti vyhledejte lékaře.",
      },
      {
        q: "Jak dlouho trvá kúra doplňku na hemoroidy?",
        a: "Řiďte se návodem na obalu — často se hodnotí cyklus několika týdnů. Pokud se potíže zhoršují nebo se objeví krvácení, kúru nepřetahujte a kontaktujte lékaře dříve.",
      },
      {
        q: "Nahrazují doplňky stravy na hemoroidy návštěvu lékaře?",
        a: "Ne. Doplněk podporuje komfort a režim, ale nestanoví diagnózu. Krev ve stolici, vyhřezlé útvary nebo silná bolest patří k odbornému vyšetření.",
      },
      {
        q: "Mohu užívat doplněk spolu s mastí z lékárny?",
        a: "Často se lokální a vnitřní péče kombinují, ale při lécích na předpis nebo nejasných příznacích se nejdřív zeptejte lékárníka či lékaře. Dodržujte návody obou přípravků.",
      },
      {
        q: "Proč se hledá i zápis „hemeroidy“?",
        a: "Jde o častou variantu pravopisu stejného tématu. Na stránce používáme spisovné „hemoroidy“; obsah platí pro obě podoby vyhledávání.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na hemoroidy",
      "kapsle na hemoroidy",
      "krém na hemoroidy",
      "co pomáhá na hemoroidy",
      "hemeroidy",
      "platba na dobírku",
      "doručení Česká republika",
      "diskrétní balení",
    ],
  },

  "zdravi-zen": pack({
    slug: "zdravi-zen",
    name: "Zdraví žen",
    intro:
      "Hledáte doplňky stravy pro ženy? Kategorie Zdraví žen nabízí podporu hormonální pohody a energie — vždy jako doplněk, ne náhradu gynekologické péče. Dobírka po ČR.",
    who: "Dospělé ženy hledající denní podporu. Těhotenství, kojení nebo chronická onemocnění = konzultace lékaře.",
    choose: "Sledujte cíl (energie, cyklus, pohoda) a složení.",
    chooseBullets: ["Cíl kúry", "Složení", "Bezpečnost v těhotenství"],
    formsBody: "Kapsle a další formy dle produktu. Čtěte upozornění na obalu.",
    safety: "Doplněk stravy není lék. V těhotenství a při lécích na předpis — lékař.",
    faq: [
      { q: "Vhodné v těhotenství?", a: "Jen po výslovné konzultaci s lékařem — většina doplňků bez doporučení ne." },
      { q: "Jak dlouho užívat?", a: "Dle návodu; při neobvyklých příznacích přerušte a zeptejte se lékaře." },
    ],
    formRows: DEFAULT_FORM_ROWS,
    related: { label: "Kategorie: Cystitida", path: "/cystitida" },
  }),

  "stres": {
    taglineHi: "Klid přes den, lepší usínání večer — porovnejte doplňky stravy na stres podle cíle a složení",
    shortDescHi:
      "Doplňky stravy na stres a podporu nervového systému: kapsle, kapky i bylinné formule na klid a spánek, s doručením a dobírkou po České republice.",
    categoryIntroHi:
      "Hledáte doplňky stravy na stres, které dávají smysl vedle realistického režimu — ne náhradu terapie ani anxiolytik na předpis? V kategorii Proti stresu porovnáte přípravky na podporu nervového systému, vnitřního klidu a usínání podle cíle (denní odolnost vůči zátěži vs. večerní zklidnění), formy a složení. Jde o doplňky stravy: mohou podpořit běžný režim, ale neléčí úzkostnou poruchu ani chronickou nespavost. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na stres",
        body: "Katalog je určen dospělým, kteří chtějí podpořit zvládání každodenního stresu, nervového napětí nebo usínání přírodními přípravky — vedle spánkové hygieny, pohybu a rozumného tempa. Dává smysl při občasné zátěži v práci, neklidu večer nebo když hledáte doplňky stravy na nervy jako součást režimu, ne jako „rychlou pilulku na úzkost“. Při sebevražedných myšlenkách, panických atacích, akutní úzkosti nebo déletrvající neschopnosti fungovat vyhledejte odbornou pomoc ihned — doplněk stravy v takové situaci nestačí. Přípravky v nabídce nejsou léčivy vázanými na předpis.",
        bullets: [
          "Dospělí s občasnou pracovní nebo životní zátěží",
          "Kdo chce porovnat doplňky na klid a spánek online s dobírkou",
          "Ne jako náhrada psychoterapie, psychiatra ani léků na předpis",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na stres",
        body: "Nejdřív si ujasněte cíl: potřebujete spíš podporu přes den (soustředění bez ospalosti), nebo večerní zklidnění a usínání? Pak čtěte složení v miligramech, doporučené dávkování a cenu za den kúry — levné balení s vysokým počtem kapslí denně může vyjít dráž. U doplňků na nervový systém sledujte interakce s léky na úzkost, depresi, spaní a ředění krve. Preferujte transparentní etiketu před marketingovým seznamem na přední straně.",
        bullets: [
          "Cíl: denní klid vs. večerní spánek a usínání",
          "Složení a dávka na den — ne jen názvy bylin",
          "Léky na předpis: nejdřív lékař nebo lékárník",
          "Počítejte cenu kúry: počet dávek ÷ denní dávka × doporučené týdny",
        ],
      },
      {
        id: "klid-vs-spanek",
        heading: "Denní klid vs. večerní spánek",
        body: "Usínání a denní odolnost vůči stresu spolu souvisejí, ale často vyžadují jiný typ podpory. Formule zaměřené na denní klid typicky cílí na nervovou soustavu a psychickou pohodu bez silného sedativního efektu — vhodné, když potřebujete fungovat. Večerní směsi častěji kombinují byliny tradované pro zklidnění a usínání; mohou tlumit pozornost, proto je berte podle návodu a ne před řízením. Doplněk stravy na stres a spánek nenahrazuje léčbu nespavosti ani úzkostné poruchy — při dlouhodobých potížích patří rozhodnutí o další péči lékaři.",
        bullets: [
          "Denní klid = podpora při zátěži, ideálně bez denní ospalosti",
          "Večerní spánek = rituál před spaním, méně stimulů a kofeinu",
          "Nekombinujte více sedativních přípravků najednou bez konzultace",
        ],
      },
      {
        id: "slozky",
        heading: "Časté složky: hořčík, B-komplex, L-theanin, adaptogeny a byliny",
        body: "V doplňcích stravy na stres a nervy se nejčastěji objevují minerály a vitaminy s povolenými tvrzeními pro nervovou soustavu, aminokyseliny a bylinné extrakty. Hořčík přispívá k normální činnosti nervové soustavy a ke snížení míry únavy. Vitaminy skupiny B (zejména B1, B6, B12) podporují normální činnost nervové soustavy a psychickou činnost. L-theanin ze zeleného čaje se traduje pro uvolnění bez silné ospalosti. Adaptogeny jako ašvaganda a rozchodnice růžová se objevují v formulech na odolnost vůči zátěži. Večerní směsi často obsahují kozlík, meduňku, mučenku nebo levanduli. Třezalku v katalogu berte s velkou opatrností kvůli lékovým interakcím — vždy konzultujte odborníka. Účinek je individuální; doplněk nenahrazuje lék na předpis.",
        bullets: [
          "Hořčík a B-komplex — častý základ podpory nervů",
          "L-theanin a adaptogeny — spíš denní odolnost vůči stresu",
          "Kozlík, meduňka, mučenka, levandule — spíš večerní zklidnění",
        ],
      },
      {
        id: "rezim",
        heading: "Režim vedle doplňku stravy",
        body: "Doplněk stravy na stres funguje nejlépe jako součást režimu, ne jako jediný zásah. Stabilní čas usínání, omezení kofeinu odpoledne, pohyb na denním světle a kratší večerní obrazovky často pomáhají víc než další kapsle. Krátká procházka, dechové cvičení nebo večerní rituál bez telefonu dávají smysl i bez přípravku. Pokud potíže trvají týdny a zasahují do práce nebo vztahů, doplněk nestačí — zvažte praktického lékaře, psychologa nebo psychiatra.",
        bullets: [
          "Spánek: pravidelný čas usínání a vstávání",
          "Kofein a alkohol večer často zhoršují neklid i usínání",
          "Pohyb a denní světlo podporují rytmus bdění a spánku",
          "Obrazovky hodinu před spaním tlumte, pokud to jde",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, kapky nebo bylinný čaj",
        body: "Kapsle a tablety se hodí pro jasnou denní dávku i cestování. Kapky a tinktury oceníte při flexibilním dávkování podle návodu — zkontrolujte chuť a případný alkohol v bázi. Bylinný čaj může být součástí večerního rituálu, ale dávka účinných látek bývá méně přesná než u standardizovaných kapslí. Preferujte přípravky s uvedeným složením a schématem užívání. Porovnejte formy v tabulce níže a pak vyberte produkt v katalogu podle ceny a dostupnosti.",
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: "Doplňky stravy na stres nejsou anxiolytikem, hypnotikem ani náhradou psychoterapie. Nepřekračujte dávkování na obalu. Při lécích na úzkost, depresi, spaní, ředění krve nebo chronických onemocněních se před kúrou poraďte s lékařem — zejména u třezalky a silných bylinných směsí. Sebevražedné myšlenky, panika, náhlé zhoršení, déletrvající nespavost nebo neschopnost zvládat běžný den patří do odborné péče ihned. Těhotné, kojící a osoby mladší 18 let přípravky bez výslovného doporučení lékaře neužívají. Při neobvyklé reakci užívání přerušte a vyhledejte pomoc.",
      },
    ],
    hubTables: [
      {
        caption: "Cíl podpory — denní klid vs večerní spánek",
        headers: ["Cíl", "Kdy dává smysl", "Na co se dívat"],
        rows: [
          [
            "Denní klid / odolnost",
            "Pracovní zátěž, napětí přes den, potřeba zůstat soustředění",
            "Složení bez silného sedativního efektu, dávka na den",
          ],
          [
            "Večerní spánek / usínání",
            "Neklid před spaním, pomalé usínání, večerní rituál",
            "Byliny na zklidnění, čas užití dle návodu, řízení vozidla",
          ],
        ],
      },
      {
        caption: "Formy doplňků stravy na stres — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tablety",
            "Stabilní denní dávka, cestování, přesné složení",
            "Počet kapslí na dávku, délka balení, cena za den",
          ],
          [
            "Kapky / tinktura",
            "Flexibilní dávkování podle návodu výrobce",
            "Odměrka, chuť, alkohol v bázi, skladování",
          ],
          [
            "Bylinný čaj",
            "Večerní rituál a mírná podpora zklidnění",
            "Frekvence louhování, méně přesná dávka než kapsle",
          ],
        ],
      },
      {
        caption: "Časté složky v doplňcích na stres a nervy",
        headers: ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
        rows: [
          [
            "Hořčík",
            "Přispívá k normální činnosti nervové soustavy a ke snížení únavy",
            "Sledujte formu a celkový denní příjem z jiných zdrojů",
          ],
          [
            "Vitaminy B1, B6, B12",
            "Podpora normální činnosti nervové soustavy a psychické činnosti",
            "Nepřekračujte dávku na etiketě při kombinaci s jinými B-komplexy",
          ],
          [
            "L-theanin",
            "Častý v formulech na uvolnění bez silné denní ospalosti",
            "Účinek je individuální; není lék na úzkost",
          ],
          [
            "Ašvaganda / rozchodnice",
            "Adaptogeny v doplňcích na odolnost vůči stresové zátěži",
            "Při tyreoidálních nebo psychiatrických lécích konzultujte lékaře",
          ],
          [
            "Kozlík, meduňka, mučenka, levandule",
            "Tradicované byliny ve večerních směsích na zklidnění a usínání",
            "Mohou tlumit; nekombinujte s alkoholem a sedativy bez rady",
          ],
          [
            "Třezalka tečkovaná",
            "Občas v přípravcích na náladu — v katalogu spíš okrajově",
            "Silné lékové interakce — jen po konzultaci s lékařem/lékárníkem",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Proti stresu", path: "/pruvodce/stres" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Spánek a chrápání", path: "/chrapani" },
    ],
    categoryFaqHi: [
      {
        q: "Pomáhají doplňky stravy na stres při nespavosti?",
        a: "Mohou podpořit večerní režim a subjektivní zklidnění, ale nejsou léčbou chronické nespavosti ani úzkostné poruchy. Při déletrvajících potížích se spaním vyhledejte lékaře. Doplněk stravy nenahrazuje psychoterapii ani léky na předpis.",
      },
      {
        q: "Lze kombinovat s léky na úzkost nebo depresi?",
        a: "Jen po konzultaci s lékařem nebo lékárníkem. Zejména bylinné složky (např. třezalka) a silné směsi mohou interagovat s antidepresivy, anxiolytiky a dalšími léky. Sami nic nepřidávejte k předepsané léčbě.",
      },
      {
        q: "Jak dlouho užívat doplňky na klid a nervy?",
        a: "Výrobci často doporučují pravidelné užívání v řádu několika týdnů až přibližně 4–12 týdnů podle schématu na obalu. První subjektivní změny bývají individuální. Dlouhodobé užívání bez přestávky řešte s lékařem.",
      },
      {
        q: "Je doplněk stravy totéž co lék na úzkost?",
        a: "Ne. Anxiolytika a další léčiva na úzkost jsou v České republice často vázaná na předpis a mají schválenou léčebnou indikaci. Doplňky stravy na stres mohou podporovat nervovou soustavu a režim, ale neléčí úzkostnou poruchu.",
      },
      {
        q: "Zvolit přípravek na denní klid, nebo na večerní spánek?",
        a: "Záleží na cíli. Denní formule cílí spíš na odolnost vůči zátěži bez silné ospalosti. Večerní směsi s bylinami na zklidnění se hodí k usínání a mohou tlumit pozornost. Čtěte návod a nekombinujte více sedativních přípravků najednou.",
      },
      {
        q: "Které složky doplňky na stres a nervy často obsahují?",
        a: "Často hořčík, vitaminy skupiny B, L-theanin, adaptogeny (ašvaganda, rozchodnice) a večerní byliny (kozlík, meduňka, mučenka, levandule). Důležitá je dávka na etiketě, ne jen marketingový seznam. Účinek je individuální.",
      },
      {
        q: "Kdy raději k lékaři než po doplněk?",
        a: "Při sebevražedných myšlenkách, panice, akutní úzkosti, déletrvající nespavosti, neschopnosti pracovat nebo fungovat v běžném dni — ihned odborná pomoc. Doplněk stravy v těchto situacích nestačí a nesmí oddálit péči.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "doplňky stravy na stres",
      "doplňky stravy na nervy",
      "doplňky na nervový systém",
      "doplňky na stres a spánek",
      "přírodní prostředky na úzkost",
      "hořčík na stres",
      "B-komplex na nervy",
      "ašvaganda stres",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  cystitida: {
    taglineHi:
      "Porovnejte doplňky stravy na cystitidu podle cíle — akutní komfort močových cest, nebo prevence recidiv",
    shortDescHi:
      "Doplňky stravy na cystitidu a podporu močových cest: D-manóza, brusinky s PAC a další formule. Ceny online, expresní kurýr, platba na dobírku po České republice.",
    categoryIntroHi:
      "Hledáte doplňky stravy na cystitidu, které dávají smysl u pálení při močení a opakovaných potíží s močovým měchýřem — ne „zázračnou léčbu“ místo lékaře? V kategorii Cystitida porovnáte přípravky na močové cesty podle cíle (akutní podpora komfortu vs. prevence recidiv), podle toho, co je na etiketě (D-manóza, brusinkový extrakt s proanthokyanidiny / PAC, vitamin C, probiotika), a podle formy (kapsle, sáčky, sirup).\n\nDoplněk stravy není antibiotikum ani náhradou vyšetření při zánětu močového měchýře. Při horečce, krvi v moči nebo bolesti v bedrech patříte k lékaři. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na cystitidu",
        body: "Katalog je určen dospělým — nejčastěji ženám —, kteří hledají přírodní podporu močových cest při pálení při močení, častém nucení na toaletu nebo opakovaných epizodách zánětu močového měchýře. Doplněk stravy dává smysl u mírného diskomfortu a jako součást prevence recidivující cystitidy vedle pitného režimu — ne jako samoléčba těžké infekce močových cest.\n\nMuži mohou mít podobné obtíže, ale častěji souvisejí s prostatou nebo jinou příčinou; při přetrvávajících příznacích patří rozhodnutí o diagnostice lékaři. Těhotné a kojící ženy konzultují vhodnost přípravku s lékařem nebo lékárníkem před zahájením kúry.\n\nHorečka, třesavka, krev v moči, silná bolest v podbřišku nebo v bedrech, zvracení či rychlé zhoršení stavu jsou red flags: doplněk nestačí a odklad vyšetření může škodit.",
        bullets: [
          "Ženy s občasnými nebo recidivujícími potížemi dolních močových cest",
          "Pálení při močení, časté močení, tlak v podbřišku bez horečky",
          "Zájem o prevenci recidiv vedle režimových opatření",
          "Ne jako náhrada antibiotik ani urologického vyšetření",
          "Red flags (horečka, krev, bolest v bedrech) = lékař ihned",
        ],
      },
      {
        id: "akutni-vs-prevence",
        heading: "Akutní diskomfort vs. prevence recidivující cystitidy",
        body: "Na českém trhu se doplňky na močové cesty prakticky dělí podle cíle užívání — ne podle marketingového názvu. Krátkodobá podpora při prvních známkách nepohodlí (pálení, častější nucení) se obvykle bere podle návodu několik dní a spojí se s vydatným pitným režimem, který pomáhá vyplavovat močové cesty. Dlouhodobější kúry cílí spíš na snížení rizika opakovaných epizod u lidí s recidivující cystitidou.\n\nObě cesty zůstávají doplňkem stravy. Akutní bakteriální infekce s celkovými příznaky řeší lékař; doplněk ji „nevyléčí“ a nesmí se používat jako záminka k odkladu péče. Prevence dává smysl jen tehdy, když už máte jasno, že nejde o horní infekci ledvin a že red flags nejsou přítomny.",
        bullets: [
          "Akutní komfort = krátký cyklus dle etikety + hodně tekutin",
          "Prevence recidiv = pravidelnost týdnů až měsíců dle návodu",
          "Zhoršení nebo horečka = lékař, ne vyšší dávka kapsle",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na cystitidu",
        body: "Nejdřív si ujasněte cíl: krátkodobá podpora při diskomfortu, nebo prevence opakovaných zánětů močových cest. Pak čtěte etiketu po miligramech — ne podle slov „forte“, „akut“ nebo „max“. U brusinek sledujte deklarovaný obsah proanthokyanidinů (PAC), pokud je uveden; u D-manózy konkrétní množství na denní dávku. U komplexů porovnejte i vitamin C, probiotika nebo bylinné extrakty (např. zlatobýl).\n\nSpočítejte cenu kúry: cena balení ÷ počet denních dávek. Sáčky s vysokou dávkou D-manózy mohou vyjít jinak než tablety s nižší dávkou. Bez dostatečného pitného režimu ztrácí smysl i dobře složený přípravek. Při lécích na předpis — zejména dlouhodobých antibiotikách nebo imunosupresi — se před kúrou zeptejte lékaře nebo lékárníka.",
        bullets: [
          "Cíl: akutní komfort vs. prevence recidiv",
          "Transparentní dávka D-manózy a/nebo PAC z brusinek na den",
          "Forma, která sedí režimu (tablety, sáčky, sirup)",
          "Cena za den kúry, ne jen cena krabičky",
          "Pitný režim jako podmínka, ne „bonus“",
        ],
      },
      {
        id: "slozky",
        heading: "Časté složky: D-manóza, brusinky (PAC), vitamin C a další",
        body: "Doplňky stravy na cystitidu a močové cesty nejčastěji staví na látkách, které se v odborné i lékárenské praxi spojují s omezením přichycení bakterií — zejména Escherichia coli — ke sliznici měchýře. D-manóza (D-manosa) je jednoduchý cukr, který se po vstřebání vylučuje do moči; v rámci doplňku se popisuje schopnost vázat se na adheziny bakterií a usnadnit jejich vyplavení proudem moči. Brusinky (klikva velkoplodá) obsahují proanthokyanidiny typu A (PAC); kvalitnější etikety uvádějí mg PAC nebo standardizovaný extrakt, ne jen „šťávu z brusinek“.\n\nVitamin C přispívá k normální funkci imunitního systému a v některých formulech se zmiňuje v kontextu kyselosti moči — stále jde o výživové tvrzení, ne o léčbu infekce. Probiotika (např. laktobacily) se přidávají pro podporu mikrobiální rovnováhy; bylinné extrakty jako zlatobýl nebo lichořeřišnice se objevují v tradičních směsích pro močové cesty. Klinická evidence u jednotlivých složek je různorodá — doplněk nenahrazuje antibiotikum a neslibuje zaručený výsledek.",
        bullets: [
          "D-manóza — antiadhezivní podpora v kontextu doplňku + pitný režim",
          "Brusinky / PAC — sledujte mg PAC nebo standardizaci extraktu",
          "Vitamin C, probiotika, zlatobýl / lichořeřišnice — časté doplňky komplexů",
          "Seznam názvů na přední straně nestačí — čtěte dávky",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, sáčky nebo sirup na močové cesty",
        body: "Kapsle a tablety se hodí pro jasnou denní dávku a cestování. Sáčky a prášek s D-manózou oceníte, když výrobce uvádí vyšší dávku v jedné porci a chcete přípravek rozpustit ve vodě — chuť a rozpustnost ověřte na etiketě. Sirup bývá praktický u lidí, kteří špatně polykají tablety; sledujte obsah cukru a dávkování odměrným kelímkem.\n\nPreferujte přípravky s uvedeným složením v miligramech a schématem užívání. Porovnejte formy v tabulce níže a pak vyberte produkt v katalogu podle ceny a dostupnosti. Gel nebo krém do této kategorie nepatří — jde o vnitřní podporu močových cest.",
      },
      {
        id: "rezim",
        heading: "Režimová opatření vedle doplňku stravy",
        body: "Doplněk stravy na cystitidu funguje nejlíp jako součást režimu, ne jako jediný krok. Dostatečný pitný režim (orientačně 2–2,5 l tekutin denně dle doporučení lékaře a celkového zdravotního stavu) pomáhá vyplachovat močové cesty. Nezadržujte moč; po pohlavním styku má smysl se vymočit. Šetrná intimní hygiena bez agresivních gelů snižuje dráždění.\n\nPokud se stav do jednoho až tří dnů nezlepší, nebo se objeví horečka či bolest v bedrech, nečekejte na „dojezd“ kapsle — jděte k lékaři. Doplněk je podpora komfortu a prevence, ne diagnóza v krabičce.",
        bullets: [
          "Pitný režim a pravidelné močení",
          "Močení po pohlavním styku",
          "Šetrná hygiena bez zbytečného dráždění",
          "Bez zlepšení nebo se zhoršením = lékař",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: "Doplňky stravy na cystitidu nejsou lékem na infekci močových cest a nenahrazují antibiotickou léčbu, kterou předepíše lékař. Nepřekračujte dávkování na obalu. Při těhotenství, kojení, cukrovce, snížené imunitě nebo chronických onemocněních ledvin konzultujte užívání s lékařem. Děti užívají přípravky jen podle věku a návodu výrobce — u nejistoty lékárník.\n\nOkamžitě vyhledejte péči při horečce, krvi v moči, silné bolesti v bedrech nebo podbřišku, zvracení, zimnici nebo neschopnosti se vymočit. Při alergické reakci užívání přerušte. Osoby mladší 18 let se řídí věkovým omezením na etiketě konkrétního produktu.",
      },
    ],
    hubTables: [
      {
        caption: "Formy doplňků stravy na cystitidu — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tablety",
            "Stabilní denní dávka, cestování, dlouhodobá prevence",
            "Mg D-manózy / PAC na den, počet tablet na dávku, cena za den",
          ],
          [
            "Sáčky / prášek",
            "Vyšší jednorázová dávka D-manózy, rozpustit ve vodě",
            "Gramáž v sáčku, chuť, pitný režim po užití",
          ],
          [
            "Sirup",
            "Obtížné polykání tablet, flexibilní odměření",
            "Odměrka, cukr v bázi, skladování po otevření",
          ],
        ],
      },
      {
        caption: "Cíl užívání — akutní komfort vs. prevence recidiv",
        headers: ["Cíl", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Akutní podpora komfortu",
            "První známky pálení nebo častějšího močení bez horečky",
            "Krátké schéma na etiketě, hydratace, red flags → lékař",
          ],
          [
            "Prevence recidiv",
            "Opakované epizody zánětu močového měchýře v anamnéze",
            "Týdny užívání, PAC / D-manóza na den, cena celého cyklu",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Cystitida", path: "/pruvodce/cystitida" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Ledviny", path: "/ledviny" },
    ],
    categoryFaqHi: [
      {
        q: "Pomáhá doplněk stravy při akutní cystitidě, nebo jen při komfortu?",
        a: "Doplňky stravy na cystitidu podporují komfort močových cest a mohou být součástí režimu při mírném diskomfortu. Akutní bakteriální infekci s horečkou, krví v moči nebo silnou bolestí řeší lékař — doplněk není antibiotikum a léčbu nenahrazuje.",
      },
      {
        q: "Je lepší D-manóza, nebo brusinky s PAC?",
        a: "Obě složky se v přípravcích na močové cesty často kombinují: D-manóza se spojuje s vazbou na bakterie v moči, brusinky s proanthokyanidiny (PAC) s omezením adheze na sliznici. Volte podle etikety (mg na den) a cíle kúry; při nejistotě se zeptejte lékárníka. Ani jedna složka nezaručuje vyléčení infekce.",
      },
      {
        q: "Jak dlouho užívat doplňky stravy na cystitidu?",
        a: "Krátkodobé schéma při diskomfortu bývá v řádu dnů dle návodu výrobce. Prevence recidiv často počítá s týdny pravidelného užívání. Při zhoršení nebo přetrvávání příznaků kúru neprodlužujte „naslepo“ — kontaktujte lékaře.",
      },
      {
        q: "Mohu užívat doplňky na močové cesty v těhotenství?",
        a: "V těhotenství a při kojení vždy nejdřív konzultujte lékaře nebo lékárníka. Infekce močových cest v graviditě patří do odborné péče; samoléčba doplňkem stravy nestačí.",
      },
      {
        q: "Nahradí doplněk antibiotika na zánět močových cest?",
        a: "Ne. Antibiotika předepisuje lékař podle klinického stavu a případně kultivace. Doplněk stravy může jen podpořit komfort a režim; nesmí sloužit jako záminka k odkladu potřebné léčby.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "doplňky stravy na cystitidu",
      "zánět močového měchýře",
      "zánět močových cest",
      "doplňky na močové cesty",
      "brusinky na cystitidu",
      "D-manóza",
      "PAC",
      "proanthokyanidiny",
      "pálení při močení",
      "recidivující cystitida",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** One-off rich hub (SERP-led): not generated from thin pack(). */
  paraziti: {
    taglineHi: "Bylinné kúry pro podporu střev — porovnejte složení, délku cyklu a formu",
    shortDescHi:
      "Doplňky stravy na parazity: bylinné kapsle, kapky i sirupy pro podporu střevního komfortu a očisty, s dobírkou po celé České republice.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na parazity, které dávají smysl vedle realistického režimu — ne náhradu laboratorní diagnózy ani anthelmintik na předpis? V kategorii Paraziti na Recenze Ceny porovnáte přípravky proti parazitům, kapsle proti parazitům a bylinné kúry podle délky cyklu, transparentního složení a formy.",
      "Jde o doplňky stravy: mohou podpořit střevní komfort a přirozené očistné procesy organismu, ale neléčí prokázanou parazitózu. Od obecných detox produktů se liší zaměřením na antiparazitární bylinné formule — ne na agresivní „zázračnou očistu“.",
      "Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice. Podrobný výběrový checklist najdete i v průvodci Paraziti.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na parazity",
        body: [
          "Katalog ocení dospělí, kteří zvažují krátkou až středně dlouhou bylinnou kúru jako podporu střevního prostředí — například po cestování, při opakovaném trávicím diskomfortu nebo když chtějí porovnat prostředek proti parazitům online s dobírkou. Dává smysl jako součást režimu (hygiena, pití, strava), ne jako samoléčba silných příznaků.",
          "Přípravky v nabídce jsou doplňky stravy, nikoli léčiva. Děti, těhotné a kojící ženy a lidé s chronickým onemocněním jater, žlučníku nebo střev by měli před kúrou mluvit s lékařem. Silné příznaky — krev ve stolici, horečka, výrazné hubnutí, déletrvající průjem nebo silná bolest břicha — patří k odbornému vyšetření, ne do „delší domácí kúry“.",
        ].join("\n\n"),
        bullets: [
          "Dospělí zvažující antiparazitární bylinnou kúru jako podporu",
          "Kdo chce porovnat složení, formu a cenu online s dobírkou",
          "Ne jako náhrada lékaře při podezření na parazitární infekci",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na parazity",
        body: [
          "Nejdřív si ujasněte cíl: podpora střevního komfortu bylinnou kúrou, nebo spíš obecná detoxikace — to jsou různé police katalogu. Pak čtěte etiketu: účinné byliny v miligramech, doporučenou délku cyklu, denní dávku a cenu za celou kúru. Levné balení s vysokým počtem kapslí denně může vyjít dráž než menší balení s jasnou dávkou.",
          "Sledujte hydrataci a hygienický režim během užívání — doplněk bez pitného režimu a základních návyků dává menší smysl. Při lécích na předpis se před kombinací zeptejte lékárníka nebo lékaře.",
        ].join("\n\n"),
        bullets: [
          "Délka kúry a doporučená přestávka dle návodu výrobce",
          "Transparentní složení — byliny a dávky na etiketě, ne jen marketingový seznam",
          "Forma: kapsle, kapky nebo sirup podle pohodlí užívání",
          "Paraziti vs. detox — jiný záměr kategorie",
          "Pitný režim a hygiena během cyklu",
          "Red flags: krev ve stolici, horečka, silná bolest → lékař",
        ],
      },
      {
        id: "doplnek-vs-lek",
        heading: "Doplněk stravy, nebo lék na předpis?",
        body: [
          "V České republice jsou účinná anthelmintika (léky proti střevním cizopasníkům) vázaná na lékařský předpis. Diagnózu stanoví lékař — často na základě vyšetření stolice nebo dalších testů — a teprve pak volí léčbu. Volně prodejné přípravky proti parazitům v e-shopech a lékárnách jsou téměř vždy doplňky stravy.",
          "Doplněk stravy nemá schválené léčivé účinky a nenahrazuje anthelmintikum. Může sloužit jako podpůrný prostředek pro trávení a bylinnou očistu v rámci režimu. Pokud máte podezření na nákazu (roupy, škrkavky a další), neotálejte s návštěvou lékaře kvůli „nejprve zkusím kúru z internetu“.",
        ].join("\n\n"),
        bullets: [
          "Léky na odčervení lidí = obvykle na předpis po vyšetření",
          "Doplněk stravy = podpora, ne diagnóza ani léčba",
          "Při příznacích nejdřív lékař, teprve pak případná podpora",
        ],
      },
      {
        id: "byliny",
        heading: "Časté byliny v antiparazitárních doplňcích",
        body: [
          "Na českém trhu se v bylinných kúrách proti parazitům opakovaně objevují extrakty, které tradiční praxe spojuje s podporou střevního prostředí a detoxikačními procesy: pelyněk pravý, ořešák královský, hřebíček, česnek, papája, kurkuma, dýňová semínka a tymián. Konkrétní přípravek vždy posuzujte podle etikety — obecný seznam bylin nestačí.",
          "Některé byliny (zejména silně hořké, například pelyněk) se v tradičních protokolech užívají jen krátkodobě a s pauzou; nejsou vhodné pro každého. Těhotenství, kojení, onemocnění jater a léky na předpis vždy konzultujte s odborníkem. Doplněk stravy neslibuje „vymýcení všech parazitů“ — cílem je transparentní složení a realistická podpora.",
        ].join("\n\n"),
        bullets: [
          "Pelyněk, ořešák, hřebíček — častá „trojkombinace“ v bylinných formulech",
          "Česnek, papája, dýňová semínka — často ve směsích na střevní komfort",
          "Kurkuma a tymián — časté v detoxikačně laděných směsích",
          "Čtěte dávku v mg a upozornění na obalu",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle, kapky nebo sirup",
        body: [
          "Kapsle a tobolky se hodí, když chcete jasnou denní dávku a jednoduché cestování. Kapky a tinktury oceníte při flexibilním dávkování podle návodu — zkontrolujte chuť a případný obsah alkoholu v bázi. Sirupy bývají přívětivější na chuť, ale sledujte cukr a přesné odměření.",
          "Lokální gely a krémy do této kategorie nepatří — jde o vnitřní podporu. Preferujte přípravky s uvedeným schématem užívání a délkou kúry. Porovnejte formy v tabulce níže a pak vyberte produkt v katalogu podle ceny a dostupnosti.",
        ].join("\n\n"),
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na parazity nejsou lékem na parazitózu a neslibují zaručený výsledek. Nepřekračujte dávkování na obalu. Při krvi ve stolici, horečce, silné bolesti břicha, výrazném hubnutí nebo potížích u dětí neprodlužujte domácí kúru — vyhledejte lékaře.",
          "V těhotenství, při kojení a při chronických onemocněních jater, žlučníku nebo střev se před kúrou poraďte s lékařem. Při lécích na předpis ověřte interakce. Při neobvyklé reakci užívání přerušte a vyhledejte pomoc.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy doplňků stravy na parazity — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tobolky",
            "Jasná denní dávka, cestování, delší kúra",
            "Počet kapslí na dávku, délka balení, cena za cyklus",
          ],
          [
            "Kapky / tinktura",
            "Flexibilní dávkování dle návodu výrobce",
            "Odměrka, chuť, alkohol v bázi, skladování",
          ],
          [
            "Sirup",
            "Pohodlnější chuť, přesné odměření objemu",
            "Cukr, odměření, věkové omezení na obalu",
          ],
        ],
      },
      {
        caption: "Časté byliny v přípravcích proti parazitům",
        headers: ["Bylina / extrakt", "K čemu se vztahuje v kontextu kúry", "Tip při výběru"],
        rows: [
          [
            "Pelyněk pravý",
            "Tradičně u střevního komfortu a hořkých kúr",
            "Krátkodobé užívání; nevhodné v těhotenství bez rady lékaře",
          ],
          [
            "Ořešák královský",
            "Častý v detoxikačně laděných směsích",
            "Dávka extraktu v mg na etiketě",
          ],
          [
            "Hřebíček",
            "Antimikrobiální bylinná složka ve směsích",
            "Kombinace s dalšími bylinami — čtěte celé složení",
          ],
          [
            "Česnek",
            "Podpora střevního prostředí v doplňcích",
            "Standardizace (např. alicin) pokud je uvedena",
          ],
          [
            "Papája / dýňová semínka",
            "Časté v formulech na trávení a střevní kúry",
            "Forma extraktu a doporučená délka cyklu",
          ],
          [
            "Kurkuma / tymián",
            "Podpora trávení a detoxikačních procesů v kontextu DS",
            "Není náhrada diagnózy ani léku na předpis",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Paraziti", path: `${GUIDE_PATH}/parasites` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Detoxikace", path: "/detox" },
      { label: "Kategorie: Trávení", path: "/traveni" },
    ],
    categoryFaqHi: [
      {
        q: "Jak dlouho trvá kúra doplňku proti parazitům?",
        a: "Řiďte se návodem na obalu — u bylinných doplňků stravy často 1–4 týdny pravidelného užívání, někdy s doporučenou přestávkou. Pokud se potíže zhoršují, kúru nepřetahujte a kontaktujte lékaře.",
      },
      {
        q: "Nahrazuje doplněk stravy lék na odčervení?",
        a: "Ne. Účinná anthelmintika jsou v ČR obvykle vázaná na předpis po vyšetření. Doplněk stravy může podpořit střevní komfort a režim, ale nestanoví diagnózu ani neléčí prokázanou parazitózu.",
      },
      {
        q: "Jaké byliny bývají v přípravcích proti parazitům?",
        a: "Často se objevují pelyněk pravý, ořešák královský, hřebíček, česnek, papája, kurkuma, dýňová semínka nebo tymián. Konkrétní produkt vždy ověřte podle etikety — obecný seznam nestačí.",
      },
      {
        q: "Lze užívat společně s jinými přípravky?",
        a: "Záleží na složení a na lécích na předpis. Zejména při chronické medikaci se před kombinací zeptejte lékárníka nebo lékaře. Nekombinujte více silných bylinných kúr najednou bez rady.",
      },
      {
        q: "Je kategorie Paraziti totéž co detoxikace?",
        a: "Ne úplně. Detox často cílí na obecnou podporu očisty a trávení. Kategorie Paraziti soustředí přípravky s antiparazitárně laděnými bylinnými formulemi. Obě zůstávají doplňky stravy, ne léky.",
      },
      {
        q: "Mohou doplňky užívat děti?",
        a: "Většina přípravků v katalogu je určena dospělým. U dětí vždy nejdřív lékař — zejména při podezření na roupy nebo jiné parazity. Nevycházejte jen z internetové kúry.",
      },
      {
        q: "Kdy místo doplňku rovnou k lékaři?",
        a: "Při krvi ve stolici, horečce, silné bolesti břicha, výrazném hubnutí, déletrvajícím průjmu nebo potížích u dětí a v těhotenství. Doplněk stravy v těchto situacích nestačí.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na parazity",
      "přípravky proti parazitům",
      "kapsle proti parazitům",
      "antiparazitární doplněk stravy",
      "bylinná kúra proti parazitům",
      "očista od parazitů",
      "pelyněk pravý",
      "ořešák královský",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** Rich hub (SERP-led plíseň nehtů): symptoms, forms, hygiene — not thin pack(). */
  "plisen-nehtu": {
    taglineHi: "Gel, krém, roztok i kapsle — výběr podle místa a délky kúry",
    shortDescHi:
      "Doplňky stravy na plíseň nehtů: lokální gely a krémy, roztoky i spreje a kapsle jako vnitřní podpora — s dobírkou a doručením po celé ČR.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na plíseň nehtů, gel na plíseň nehtů nebo krém či roztok proti mykóze nehtů? V kategorii Plíseň nehtů na Recenze Ceny porovnáte lokální přípravky (gel, krém, roztok, sprej) a kapsle pro vnitřní podporu — vždy jako doplněk stravy nebo kosmetickou péči, nikoli jako náhradu dermatologické léčby onychomykózy.",
      "Plíseň nehtů (mykóza / onychomykóza) často vyžaduje trpělivost: nehet roste pomalu a pravidelná aplikace bývá důležitější než jednorázová dávka. Katalog slouží k rychlému výběru formy a složení; objednejte online s platbou na dobírku — expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Plíseň nehtů“",
        body: [
          "Katalog ocení dospělí, kteří řeší žloutnutí, ztluštění nebo lámavost nehtů na nohou či rukou, svědění kůže kolem nehtu, nebo chtějí porovnat gel na plíseň nehtů s kapslemi jako doplňkovou podporou. Přípravky dávají smysl jako součást rutiny — vedle hygieny nohou a suché obuvi, ne místo vyšetření.",
          "Při diabetu, oslabené imunitě, bolesti, hnisání, rychlém šíření na další nehty nebo potížích bez zlepšení po několika týdnech důsledné péče navštivte dermatologa dříve, než prodlužujete domácí kúru. U dětí, v těhotenství a při lécích na předpis konzultujte odborníka.",
        ].join("\n\n"),
        bullets: [
          "Žloutnutí, ztluštění, drolivost nehtu na nohou nebo rukou",
          "Zájem o gel, krém, roztok/sprej nebo kapsle online s dobírkou",
          "Ne jako náhrada antimykotik na předpis ani dermatologické péče",
        ],
      },
      {
        id: "priznaky",
        heading: "Jak poznat plíseň nehtů a kdy je pokročilá",
        body: [
          "Typické projevy mykózy nehtů zahrnují změnu barvy (žlutá, hnědá, někdy nazelenalá), matný povrch, ztluštění ploténky, lámavost a oddělování od lůžka. U kůže kolem nehtu nebo mezi prsty se může objevit svědění, pálení, zarudnutí nebo nepříjemný zápach — zvlášť ve vlhkém prostředí obuvi.",
          "Pokročilá plíseň nehtů už bývá víc než kosmetický problém: silně zdeformovaný nehet, bolest v obuvi, šíření na okolní nehty nebo odloučení od lůžka. V této fázi samotná domácí péče často nestačí — včasná konzultace s dermatologem je bezpečnější než další balení bez diagnózy.",
        ].join("\n\n"),
        bullets: [
          "Začínající: skvrny, žloutnutí, mírné ztluštění",
          "Pokročilá: deformace, drolivost, bolest, šíření",
          "Riziko: vlhká obuv, bazény, sauny, těsné boty, oslabená imunita",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na plíseň nehtů",
        body: [
          "Nejdřív pojmenujte místo problému: spíš nehtová ploténka, kůže kolem nehtu / meziprstí, nebo chcete i vnitřní podporu? Lokální gel či krém na plíseň nehtů se hodí k přímé aplikaci; roztok a sprej usnadní ošetření těžko dostupných míst; kapsle slouží jako doplněk stravy k celkové podpoře — ne jako zaručená léčba infekce.",
          "Čtěte etiketu: frekvenci aplikace, doporučenou délku kúry a určení (nehet vs. kůže). Počítejte s tím, že viditelná obnova nehtu trvá týdny až měsíce — důslednost a hygiena obuvi rozhodují stejně jako volba formy. Preferujte srozumitelné složení před marketingovými sliby „okamžitého výsledku“.",
        ].join("\n\n"),
        bullets: [
          "Cíl: nehet / kůže kolem / vnitřní podpora",
          "Forma: gel·krém vs. roztok·sprej vs. kapsle",
          "Délka kúry dle návodu — často do odrůstání zdravého nehtu",
          "Cena kúry: denní aplikace × doporučené týdny",
          "Hygiena: suché nohy, výměna ponožek, prodyšná obuv",
        ],
      },
      {
        id: "formy",
        heading: "Gel, krém, roztok, sprej a kapsle — co zvolit",
        body: [
          "Gel a krém na plíseň nehtů se nanášejí přímo na postižené místo; hodí se při péči o ploténku a okolní kůži, pokud návod produkt pro nehet uvádí. Roztoky a spreje proti plísni usnadní aplikaci mezi prsty a na méně dostupná místa a často nezanechávají mastný film.",
          "Kapsle a další perorální doplňky stravy podporují organismus zevnitř jako součást režimu — nenahrazují lokální péči ani léky vázané na předpis. U rozsáhlejší mykózy lékař může doporučit systémovou léčbu; katalogové přípravky pak zbývají jako doplňková volba podle etikety, ne jako alternativa diagnózy.",
        ].join("\n\n"),
        bullets: [
          "Gel / krém → lokální aplikace na nehet nebo kůži dle určení",
          "Roztok / sprej → meziprstí a hůře dostupná místa",
          "Kapsle → vnitřní podpora jako doplněk stravy",
          "Tablety na předpis → jen po vyšetření (nejsou náhradou doplňku)",
        ],
      },
      {
        id: "hygiena",
        heading: "Hygiena a prevence — co doplňku pomáhá",
        body: [
          "Plísně mají rády teplo a vlhkost. Udržujte nohy čisté a důkladně osušené — zejména prostor mezi prsty. Střídejte ponožky z prodyšných materiálů, volte volnější obuv a na veřejných sprchách, v bazénu nebo sauně používejte vlastní obuv.",
          "Dezinfikujte nástroje na pedikúru a podle možností i vnitřek obuvi, pokud řešíte opakované potíže. Doplněk stravy na plíseň nehtů funguje nejlépe vedle těchto návyků; bez suchého prostředí se problém snadno vrací i po pečlivé aplikaci gelu.",
        ].join("\n\n"),
        bullets: [
          "Suché nohy a výměna ponožek",
          "Prodyšná obuv; vlastní obuv ve společných sprchách",
          "Čisté nástroje a hygiena pedikúry",
          "Pauza od dlouhodobého zakrytí nehtu (např. gelové laky) při podezření na infekci",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy a lokální péče v této kategorii podporují komfort nehtů a pokožky; neléčí diagnózu onychomykózy ani nenahrazují antimykotika na předpis. Nepřekračujte dávkování na etiketě a čtěte upozornění výrobce.",
          "K dermatologovi patří šíření infekce, silná bolest, hnisání, cukrovka s postižením nohou, nelepšící se stav po důsledné kúře, nebo jakékoli pochybnosti o diagnóze. V těhotenství, při kojení a chronických onemocněních se před zahájením kúry poraďte s lékařem či lékárníkem.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy přípravků na plíseň nehtů — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          ["Gel / krém", "Lokální péče o nehet nebo okolní kůži", "Určení na obalu, frekvence, délka kúry"],
          ["Roztok / sprej", "Meziprstí, hůře dostupná místa", "Aplikátor, schnutí, hygiena po nanesení"],
          ["Kapsle", "Vnitřní podpora jako doplněk stravy", "Schéma užívání, složení, cena za den"],
          ["Kombinace lokální + kapsle", "Když chcete péči zvenku i režimovou podporu", "Nekombinujte naslepo s léky — ptejte se lékárníka"],
        ],
      },
      {
        caption: "Co očekávat od kúry — realistický checklist",
        headers: ["Faktor", "Proč záleží", "Tip"],
        rows: [
          ["Důslednost aplikace", "Nehet roste pomalu; vynechání prodlužuje kúru", "Stejný čas ráno/večer dle návodu"],
          ["Délka kúry", "Viditelná obnova často týdny až měsíce", "Pokračujte do odrůstání dle etikety / rady lékaře"],
          ["Hygiena obuvi", "Vlhkost podporuje návrat mykózy", "Sušte boty, střídejte pár, čisté ponožky"],
          ["Rozsah postižení", "Pokročilá deformace ≠ jen kosmetika", "Při šíření nebo bolesti k dermatologovi"],
          ["Doplněk vs. lék", "Doplněk stravy nestanoví diagnózu", "Čtěte „doplněk stravy, nikoli lék“"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Plíseň nehtů", path: `${GUIDE_PATH}/fungus` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Psoriáza", path: "/lupenka" },
      { label: "Kategorie: Imunita", path: "/imunita" },
    ],
    categoryFaqHi: [
      {
        q: "Jak dlouho aplikovat gel nebo krém na plíseň nehtů?",
        a: "U většiny lokálních přípravků se počítá s pravidelnou aplikací týdny až měsíce — často až do odrůstání zdravější části nehtu. Řiďte se návodem na obalu; důslednost je důležitější než jednorázová vyšší dávka. Při zhoršení nebo šíření navštivte dermatologa.",
      },
      {
        q: "Funguje přípravek i na kůži, nebo jen na nehty?",
        a: "Záleží na konkrétním produktu — některé gely a krémy jsou určeny i pro kůži kolem nehtu či meziprstí, jiné primárně na ploténku. Vždy čtěte určení na etiketě. Při nejasné diagnóze je bezpečnější konzultace s lékárníkem nebo lékařem.",
      },
      {
        q: "Gel, roztok nebo kapsle — co zvolit při plísni nehtů?",
        a: "Lokální gel či krém volte pro přímou péči o nehet; roztok a sprej se hodí na hůře dostupná místa. Kapsle jsou doplněk stravy pro vnitřní podporu, ne náhrada lokální péče ani léků na předpis. Nejdřív místo problému, potom forma a složení.",
      },
      {
        q: "Jak poznám pokročilou mykózu nehtů?",
        a: "Silné ztluštění, deformace, drolivost, změna barvy do hněda, bolest v obuvi nebo oddělování nehtu od lůžka signalizují pokročilejší stav. Domácí prostředky pak často nestačí — včasné vyšetření u dermatologa je vhodnější než další samoléčba.",
      },
      {
        q: "Pomáhá hygiena nohou stejně jako přípravek?",
        a: "Ano — suché nohy, prodyšná obuv, výměna ponožek a hygiena ve společných sprchách snižují riziko návratu. Doplněk nebo gel bez suchého prostředí často nepřinese trvalý komfort. Režim a přípravek patří k sobě.",
      },
      {
        q: "Kdy raději k dermatologovi než po další balení?",
        a: "Při diabetu, bolesti, hnisání, rychlém šíření, nelepšícím se stavu po důsledné kúře, nebo když si nejste jisti, zda jde o plíseň. Doplněk stravy nestanoví diagnózu a nenahrazuje antimykotika na předpis.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na plíseň nehtů",
      "plíseň nehtů",
      "mykóza nehtů",
      "onychomykóza",
      "gel na plíseň nehtů",
      "krém na plíseň nehtů",
      "roztok proti plísni",
      "sprej proti plísni",
      "plíseň nehtů na nohou",
      "přípravky na plíseň nehtů",
      "hygiena nohou",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** Rich hub (SERP-led sluch/tinnitus): taxonomy + tables — not thin pack(). */
  sluch: {
    taglineHi: "Kapsle na podporu sluchu — výběr podle složení, cíle a realistických očekávání",
    shortDescHi:
      "Doplňky stravy na sluch: kapsle a přípravky pro podporu komfortu uší a každodenního vnímání zvuku, s dobírkou a doručením po celé ČR. Nenahrazují ORL vyšetření ani naslouchátka.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na sluch nebo kapsle na podporu sluchu? V kategorii Podpora sluchu na Recenze Ceny porovnáte přípravky podle složení a cíle — například podporu mikrocirkulace a nervového komfortu uší při věkových změnách, občasném šumění v uších (tinnitus) nebo dlouhodobé hlukové zátěži. Vždy jde o doplněk stravy, ne o lék, naslouchátko ani náhradu ORL péče.",
      "Sluch ovlivňuje kvalitu spánku, komunikaci i koncentraci. Doplněk může být součástí rutiny vedle ochrany sluchu a režimu, ale při náhlém zhoršení, bolesti ucha, závrati nebo jednostranném pískání nejdřív k lékaři. Objednejte online s platbou na dobírku — expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Podpora sluchu“",
        body: [
          "Katalog ocení dospělé, kteří řeší věkové změny sluchu, občasné hučení či pískání v uších, pocit „unavených“ uší po hlučném dni, nebo chtějí dlouhodobě podpořit komfort sluchového aparátu výživou. Doplňky stravy na sluch dávají smysl jako součást rutiny — vedle spánku, stresové hygieny a ochrany před hlasitou hudbou, ne místo vyšetření.",
          "Náhlá ztráta sluchu, silná bolest ucha, horečka, závrať s zvracením, pulzující tinnitus, jednostranné zhoršení nebo tinnitus po úrazu hlavy patří urgentně k ORL — neodkládejte kvůli objednávce doplňku. Stejně tak při lécích na ředění krve, těhotenství a kojení konzultujte odborníka dříve, než zahájíte kúru.",
        ].join("\n\n"),
        bullets: [
          "Věkové změny sluchu a zájem o výživovou podporu",
          "Občasné šumění / pískání v uších (po vyloučení závažné příčiny)",
          "Hluková zátěž v práci nebo ve sluchátkách — jako doplněk režimu",
          "Ne jako náhrada naslouchátka, audiometrie ani ORL diagnózy",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na sluch",
        body: [
          "Nejdřív pojmenujte cíl: spíš podpora komfortu při tinnitu, obecná péče o sluch s věkem, nebo zájem o konkrétní složky (ginkgo, hořčík, zinek, vitaminy B, houby typu Cordyceps/Chaga)? Až potom čtěte etiketu — denní dávku, standardizaci extraktu, délku doporučené kúry a upozornění na interakce.",
          "Počítejte cenu za denní dávku, ne jen cenu balení. Preferujte srozumitelné složení před marketingovým slibem „obnovy sluchu“. Doplněk stravy na sluch nenahrazuje úpravu hlukové zátěže ani vyšetření — nejlepší výsledek bývá kombinace režimu, ochrany sluchu a realistického očekávání.",
        ].join("\n\n"),
        bullets: [
          "Cíl: tinnitus diskomfort / věková podpora / konkrétní složky",
          "Etiketa: dávka, standardizace (např. u ginkga), délka kúry",
          "Interakce: zvláště léky ovlivňující srážlivost krve",
          "Cena kúry: denní dávka × doporučené týdny (často 4–12)",
          "Red flags → ORL dřív než další balení",
        ],
      },
      {
        id: "doplnek-vs-naslouchatko",
        heading: "Doplněk stravy, naslouchátko, nebo ORL?",
        body: [
          "Tyto tři cesty řeší různé situace. Doplněk stravy může podpořit výživu a komfort, ale nezesiluje zvuk jako naslouchátko a nestanoví diagnózu. Volně prodejná naslouchátka / zesilovače zvuku pomáhají při mírné nedoslýchavosti, ale u vážnějších vad patří odborné sluchadlo a nastavení u specialisty.",
          "ORL vyšetření (včetně audiometrie) je první volba při trvajícím tinnitu, náhlém zhoršení, bolesti nebo závrati. Až když je stav zhodnocen a nejde o akutní příčinu, dává smysl zvážit doplněk jako podpůrnou rutinu — ne jako „zázračnou kúru“.",
        ].join("\n\n"),
        bullets: [
          "Doplněk → výživa a komfort, dlouhodobá rutina dle etikety",
          "Naslouchátko / zesilovač → zesílení zvuku při nedoslýchavosti",
          "ORL → diagnóza, léčba příčiny, odborné sluchadlo",
          "Nikdy neodkládejte lékaře kvůli objednávce kapslí",
        ],
      },
      {
        id: "slozky",
        heading: "Časté složky v doplňcích na sluch",
        body: [
          "Na trhu se často objevují extrakty z ginkgo biloby (jinanu) v kontextu mikrocirkulace, hořčík a vitaminy skupiny B (včetně B12) ve vztahu k nervovému systému, zinek a další antioxidanty. Klinické důkazy u chronického tinnitu jsou smíšené — u části lidí může dojít k subjektivní úlevě, u jiných ne; doplněk není spolehlivá „léčba pískání“.",
          "V této kategorii najdete i přípravky s houbovými extrakty (např. Cordyceps, Chaga) orientované na celkovou podporu vitality a komfortu. Sledujte, co přesně etiketa tvrdí, v jaké dávce a jak dlouho výrobce doporučuje užívat — a nesrovnávejte doplněk s lékem na předpis.",
        ].join("\n\n"),
        bullets: [
          "Ginkgo biloba — často u přípravků na mikrocirkulaci; pozor na léky na ředění krve",
          "Hořčík, B-komplex, B12 — podpora nervového komfortu dle etikety",
          "Zinek a antioxidanty — ochrana buněk před oxidačním stresem (obecně)",
          "Houbové extrakty (Cordyceps, Chaga) — dle konkrétního produktu v katalogu",
        ],
      },
      {
        id: "delka-kury",
        heading: "Jak dlouho hodnotit efekt",
        body: [
          "U většiny doplňků stravy na sluch dává smysl hodnotit subjektivní změnu až po několika týdnech pravidelného užívání — často v rozmezí 4–12 týdnů podle návodu na obalu. Očekávejte spíš postupný komfort než okamžité „vypnutí“ tinnitu.",
          "Pokud se potíže zhoršují, objeví se nové příznaky (bolest, závrať, jednostranné zhoršení) nebo po plné kúře nevidíte žádný smysluplný přínos, kúru nepřetahujte marketingem — vraťte se k ORL nebo praktickému lékaři a přehodnoťte strategii.",
        ].join("\n\n"),
        bullets: [
          "Pravidelnost dle etikety > jednorázové „nárazové“ dávky",
          "Hodnocení obvykle po 4–12 týdnech",
          "Bez zlepšení / zhoršení → lékař, ne další balení naslepo",
          "Doplněk = podpora režimu, ne náhrada terapie",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na sluch podporují běžný komfort a výživu; neléčí náhlou hluchotu, zánět, nádor ani cévní příčinu pulzujícího šelestu. Náhlé zhoršení sluchu, silná bolest, horečka, závrať s neurologickými příznaky nebo tinnitus po úrazu = okamžitě lékařská péče.",
          "Při antikoagulanciích a antiagreganciích (např. warfarin, některé léky na srážlivost), před plánovanou operací, v těhotenství a při kojení se před ginkgo a podobnými směsmi poraďte s lékařem či lékárníkem. Nepřekračujte doporučené dávkování na etiketě.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Doplněk, naslouchátko a ORL — rychlé srovnání",
        headers: ["Řešení", "Kdy dává smysl", "Na co se dívat"],
        rows: [
          ["Doplněk stravy (kapsle)", "Podpora komfortu / výživy jako rutina", "Složení, dávka, délka kúry, interakce"],
          ["Naslouchátko / zesilovač zvuku", "Mírná nedoslýchavost, potřeba zesílení", "Typ (za ucho / do ucha), hlasitost, zpětná vazba"],
          ["ORL vyšetření + odborné sluchadlo", "Trvající tinnitus, náhlé zhoršení, diagnóza", "Audiometrie, příčina, nastavení pomůcky"],
          ["Režim a ochrana sluchu", "Hluk, spánek, stres, hlasitá sluchátka", "Limity hlasitosti, pauzy, spánková hygiena"],
        ],
      },
      {
        caption: "Časté složky v doplňcích na sluch",
        headers: ["Látka / typ", "K čemu se vztahuje", "Tip při výběru"],
        rows: [
          ["Ginkgo biloba (jinan)", "Často mikrocirkulace a komfort uší", "Dávka / standardizace; interakce se srážlivostí"],
          ["Hořčík", "Nervový komfort, elektrolyty", "Forma a % RVH v denní dávce"],
          ["Vitaminy B / B12", "Nervový systém a metabolismus", "Obsah v denní dávce dle etikety"],
          ["Zinek a antioxidanty", "Oxidační stres (obecně)", "Nepřekračujte doporučenou dávku"],
          ["Houbové extrakty (Cordyceps, Chaga)", "Vitalita a podpora dle produktu", "Čtěte přesné složení konkrétního SKU"],
          ["Kapsle / tablety", "Jednoduchá denní vnitřní podpora", "Cena za den, délka balení, návod"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Podpora sluchu", path: `${GUIDE_PATH}/hearing` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Proti stresu", path: "/stres" },
      { label: "Kategorie: Péče o zrak", path: "/zrak" },
    ],
    categoryFaqHi: [
      {
        q: "Pomáhají doplňky stravy při tinnitu (šumění / pískání v uších)?",
        a: "Účinek je individuální a důkazy u chronického tinnitu jsou smíšené. Doplněk může být součástí rutiny po zhodnocení bezpečnosti, ale nenahrazuje ORL vyšetření. Při trvajícím, jednostranném nebo zhoršujícím se tinnitu nejdřív k lékaři.",
      },
      {
        q: "Jaký je rozdíl mezi doplňkem na sluch a naslouchátkem?",
        a: "Doplněk stravy podporuje výživu a komfort — nezesiluje zvuk. Naslouchátko / zesilovač zvuku zesiluje okolní zvuky při nedoslýchavosti. Jde o různé nástroje; při vážnějších vadách patří odborné sluchadlo a ORL.",
      },
      {
        q: "Má smysl ginkgo biloba na sluch nebo tinnitus?",
        a: "Ginkgo se v přípravcích často objevuje kvůli mikrocirkulaci, ale spolehlivý léčebný efekt na tinnitus není jistý. Pokud ho zvažujete, čtěte dávku na etiketě a konzultujte interakce — zejména při lécích na ředění krve a před operací.",
      },
      {
        q: "Jak dlouho užívat kapsle na podporu sluchu?",
        a: "Řiďte se návodem na obalu. U většiny doplňků dává smysl hodnotit subjektivní změnu po 4–12 týdnech pravidelného užívání. Bez přínosu nebo při zhoršení potíží kúru nepřetahujte a obraťte se na lékaře.",
      },
      {
        q: "Kdy raději k ORL než po doplněk?",
        a: "Při náhlém zhoršení sluchu, bolesti ucha, horečce, závrati, pulzujícím nebo jednostranném tinnitu, po úrazu hlavy, nebo když tinnitus ruší spánek a trvá déle. Doplněk stravy nestanoví diagnózu.",
      },
      {
        q: "Mohu kombinovat doplněk na sluch s léky na předpis?",
        a: "Při lécích na srážlivost krve, dalších chronických medikacích, těhotenství a kojení se před zahájením poraďte s lékařem nebo lékárníkem. Nepřekračujte doporučené dávkování.",
      },
      {
        q: "Obnoví doplněk stravy poškozený sluch?",
        a: "Ne. Doplněk stravy není určen k diagnostice, léčbě ani „obnově“ poškozených vláskových buněk. Může podpořit každodenní komfort jako součást režimu — realistická očekávání jsou klíčová.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na sluch",
      "doplňky na sluch",
      "kapsle na sluch",
      "podpora sluchu",
      "tinnitus",
      "šumění v uších",
      "pískání v uších",
      "ginkgo biloba tinnitus",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** Rich hub (SERP-led trávení): taxonomy + tables — not thin pack(). */
  traveni: {
    taglineHi: "Probiotika, enzymy, vláknina i byliny — výběr podle cíle a složení",
    shortDescHi:
      "Doplňky stravy na trávení: probiotika, prebiotika, trávicí enzymy, vláknina a bylinné přípravky pro střevní komfort, s dobírkou a doručením po celé ČR.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na trávení nebo doplňky stravy na podporu trávení? V kategorii Trávení na Recenze Ceny porovnáte přípravky podle cíle: probiotika a prebiotika pro střevní mikroflóru, trávicí enzymy k jídlu, vlákninu pro pravidelnost a bylinné směsi při občasném diskomfortu — vždy jako doplněk stravy, ne jako náhradu léčby zánětlivých střevních onemocnění.",
      "Trávení není jen o kapsli po večeři. Velkou roli hraje tempo jídla, pitný režim, dostatek vlákniny ve stravě a pohyb. Katalog slouží k rychlému výběru typu přípravku a transparentního složení; objednejte online s platbou na dobírku — expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Trávení“",
        body: [
          "Katalog ocení dospělí, kteří řeší občasné nadýmání a plynatost, pocit těžkosti po tučnějším jídle, nepravidelnou stoličku nebo chtějí podpořit střevní komfort při změně režimu, cestování či po období méně pestré stravy. Doplňky stravy na trávení dávají smysl jako součást rutiny — vedle stravy a pití, ne místo vyšetření.",
          "Při krvi ve stolici, nechtěném hubnutí, nočních bolestech, horečce, déletrvajícím průjmu nebo podezření na chronické onemocnění střeva nejdřív k lékaři. Stejně tak při silných příznacích u dětí, v těhotenství a při lécích na předpis konzultujte odborníka dříve, než zahájíte kúru.",
        ].join("\n\n"),
        bullets: [
          "Nadýmání, plynatost, těžkost po jídle",
          "Zájem o probiotika, enzymy nebo vlákninu online s dobírkou",
          "Ne jako náhrada gastroenterologické péče ani léků na IBD",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na trávení",
        body: [
          "Nejdřív pojmenujte problém: spíš nadýmání po jídle, potřeba mikrobiomové podpory, nebo pravidelnost stolice? Podle toho zvolte typ — trávicí enzymy k jídlu, probiotika/prebiotika, vlákninu, nebo bylinnou podporu. Až potom čtěte etiketu: dávku, počet kmenů a CFU u probiotik, spektrum enzymů, typ vlákniny a doporučenou délku užívání.",
          "Počítejte cenu za denní dávku, ne jen cenu balení. Preferujte srozumitelné složení před marketingovým seznamem na přední straně. Doplněk stravy na podporu trávení nenahrazuje úpravu jídelníčku — nejlepší výsledek bývá kombinace režimu a vhodného typu přípravku.",
        ].join("\n\n"),
        bullets: [
          "Cíl: nadýmání / mikroflóra / pravidelnost / bylinný komfort",
          "U probiotik: kmeny, CFU, skladování dle etikety",
          "U enzymů: spektrum (sacharidy, bílkoviny, tuky, laktóza) a užívání s jídlem",
          "U vlákniny: typ (např. psyllium, inulin) + dostatek tekutin",
          "Cena kúry: denní dávka × doporučené týdny",
        ],
      },
      {
        id: "typy",
        heading: "Probiotika, enzymy, vláknina a byliny — co zvolit",
        body: [
          "Probiotika přinášejí vybrané mikrobiální kultury; prebiotika (např. inulin, FOS) slouží jako „potrava“ pro prospěšné bakterie. Synbiotika kombinují obojí. Hodí se při zájmu o střevní rovnováhu, po změnách stravy nebo na cestách — vždy podle návodu, ne jako samoléčba infekce.",
          "Trávicí enzymy (např. amyláza, proteáza, lipáza, laktáza, celuláza) se často užívají s jídlem, když řešíte těžkost nebo horší snášenlivost konkrétních složek potravy. Vláknina podporuje pravidelnost a střevní prostředí, ale při nízkém pitném režimu může naopak zhoršit diskomfort. Bylinné přípravky (artyčok, zázvor, fenykl, máta a další) bývají volbou při občasném zažívacím nepohodlí — čtěte dávkování a upozornění na obalu.",
        ].join("\n\n"),
        bullets: [
          "Probiotika / prebiotika → mikroflóra a dlouhodobější rutina",
          "Trávicí enzymy → podpora při jídle a pocitu těžkosti",
          "Vláknina → pravidelnost + tekutiny",
          "Byliny → šetrná podpora při mírném diskomfortu",
        ],
      },
      {
        id: "rezim",
        heading: "Režim, který doplňku pomáhá",
        body: [
          "Doplněk stravy na trávení funguje nejlépe vedle jednoduchých návyků. Jezte pomaleji a v klidu, nepřehánějte velikost porcí a všímejte si potravin, po kterých se opakovaně nadýmáte (luštěniny, sycené nápoje, některé mléčné výrobky — individuálně). Po těžším jídle často pomůže lehký pohyb, například krátká procházka, místo dalšího „těžkého“ sousta.",
          "Dodržujte pitný režim, zvláště při vláknině. Pokud potíže trvají týdny, zhoršují se, nebo zasahují do spánku a práce, neprodlužujte samoléčbu — včasné vyšetření je bezpečnější než další balení doplňku.",
        ].join("\n\n"),
        bullets: [
          "Pomalejší jídlo, menší porce, méně vzduchu při polykání",
          "Omezte individuálně nadýmavé potraviny a sycené nápoje",
          "Pohyb po jídle a dostatek tekutin",
          "Doplněk = podpora režimu, ne náhrada lékaře",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na trávení podporují běžný střevní komfort a režim; neléčí Crohnovu chorobu, ulcerózní kolitidu ani jiné diagnózy trávicího traktu. Krev ve stolici, černá stolice, silná bolest břicha, horečka, zvracení nebo nechtěné hubnutí patří k lékaři — ne do delší domácí kúry.",
          "Při lécích na předpis, těhotenství, kojení a imunocompromitovaných stavech se před užíváním probiotik nebo enzymů poraďte s lékařem či lékárníkem. Nepřekračujte doporučené dávkování na etiketě.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Typy přípravků na trávení — rychlé srovnání",
        headers: ["Typ přípravku", "Kdy zvolit", "Na co se dívat"],
        rows: [
          ["Probiotika / synbiotika", "Podpora mikroflóry, změna režimu, cesty", "Kmeny, CFU, skladování, délka kúry"],
          ["Trávicí enzymy", "Těžkost po jídle, horší snášenlivost složek", "Spektrum enzymů, užívání s jídlem"],
          ["Vláknina / prebiotika", "Pravidelnost, střevní prostředí", "Typ vlákniny, pitný režim, postupné navyšování"],
          ["Bylinné kapsle / kapky", "Občasný diskomfort, šetrná podpora", "Extrakty, dávka, upozornění na obalu"],
          ["Kapsle / tablety", "Jednoduchá denní vnitřní podpora", "Denní dávka, cena za den, složení"],
        ],
      },
      {
        caption: "Časté složky v doplňcích na trávení",
        headers: ["Látka / typ", "K čemu se vztahuje", "Tip při výběru"],
        rows: [
          ["Probiotické kultury (např. Lactobacillus, Bifidobacterium)", "Střevní mikroflóra", "Počet kmenů + CFU v denní dávce"],
          ["Prebiotika (inulin, FOS)", "„Potrava“ pro prospěšné bakterie", "Začínejte nižší dávkou při citlivém břiše"],
          ["Enzymy (amyláza, proteáza, lipáza, laktáza…)", "Štěpení živin při jídle", "Užívejte dle návodu s jídlem"],
          ["Psyllium a další vláknina", "Pravidelnost vyprazdňování", "Zapíjejte dostatečným množstvím vody"],
          ["Artyčok, zázvor, fenykl, máta", "Bylinná podpora zažívání", "Čtěte koncentraci extraktu a kontraindikace"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Trávení", path: `${GUIDE_PATH}/digestive` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Detoxikace", path: "/detox" },
      { label: "Kategorie: Hemoroidy", path: "/hemoroidy" },
    ],
    categoryFaqHi: [
      {
        q: "Pomáhá při nadýmání a pomalém trávení?",
        a: "Doplňky stravy mohou podpořit střevní komfort a normální trávení jako součást režimu. Účinek je individuální — záleží na typu přípravku (enzymy k jídlu, probiotika, vláknina) a na stravě. Při krvi ve stolici, silné bolesti nebo déletrvajícím průjmu vyhledejte lékaře.",
      },
      {
        q: "Probiotika, enzymy nebo byliny — co zvolit?",
        a: "Probiotika volte při zájmu o mikroflóru a delší rutinu; trávicí enzymy často k jídlu při těžkosti; byliny při mírném občasném diskomfortu. Nejdřív cíl, potom složení na etiketě — ne obecný slib „na všechno“.",
      },
      {
        q: "Jakou roli hraje vláknina u trávení?",
        a: "Vláknina (např. psyllium, inulin) podporuje pravidelnost a střevní prostředí, ale potřebuje dostatek tekutin. Navyšujte postupně; při bolesti, zácpě nebo nejasných příznacích se poraďte s lékárníkem či lékařem.",
      },
      {
        q: "Jak podpořit trávení po těžším jídle?",
        a: "Dejte tělu čas, zvolte lehčí pohyb (krátká procházka) a příště menší porci. Někteří dospělí užívají trávicí enzymy s jídlem dle návodu. Doplněk nenahrazuje úpravu stravy ani vyšetření při opakovaných potížích.",
      },
      {
        q: "Jak dlouho trvá kúra doplňku na trávení?",
        a: "Řiďte se návodem na obalu — u probiotik se často hodnotí cyklus několika týdnů (např. 4–6). Pokud se potíže zhoršují, kúru nepřetahujte a kontaktujte lékaře dříve.",
      },
      {
        q: "Kdy raději k lékaři než po doplněk?",
        a: "Při krvi ve stolici, nechtěném hubnutí, horečce, silné bolesti břicha, nočních příznacích nebo potížích trvajících déle než několik dnů bez úlevy. Doplněk stravy nestanoví diagnózu.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na trávení",
      "doplňky stravy na podporu trávení",
      "probiotika na trávení",
      "trávicí enzymy",
      "prebiotika",
      "nadýmání a plynatost",
      "vláknina",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /**
   * Fresh hub from CZ SERP (cream roundups, pharmacy OTC shelves, nutrient blogs) —
   * NOT a rewrite of prior thin pack / other site hubs. Multi-form shelf (expanding catalog).
   */
  lupenka: {
    serpLedHub: true,
    taglineHi: "Krém, mast, gel i kapsle — srovnání podpůrné péče při lupénce",
    shortDescHi:
      "Doplňky stravy na lupénku a lokální přípravky (krém, mast, gel, balzám, šampon): srovnání forem a složení, dobírka po ČR.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na lupénku, krém na lupénku nebo mast či gel pro citlivou šupinatou pokožku? V kategorii Psoriáza na Recenze Ceny porovnáte lokální péči i perorální přípravky podle formy, složení a délky kúry.",
      "Lupénka (psoriáza) probíhá ve vlnách: období klidu střídají vzplanutí. Katalog pomáhá zvolit formu podle místa a cíle péče — ložiska na těle, pokožka hlavy, nebo vnitřní podpora režimu. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Psoriáza“",
        body: [
          "Katalog ocení dospělí s lehčí nebo stabilní formou lupénky, kteří hledají pravidelné promaštění, šetrný šampon na pokožku hlavy, nebo doplněk stravy jako součást každodenního režimu. Dává smysl i při citlivé, suché a šupinaté kůži, když chcete online porovnat krém, mast, gel a kapsle s dobírkou.",
          "Při rozsáhlém vzplanutí, silné bolesti, hnisání, náhlém rozšíření ložisek nebo postižení kloubů s otoky je vhodnější nejdřív odborné posouzení než prodlužovat domácí kúru. Totéž platí u dětí, v těhotenství a při kojení.",
        ].join("\n\n"),
        bullets: [
          "Dospělí s lehčí / stabilní lupénkou nebo suchou šupinatou kůží",
          "Zájem o krém, mast, gel, balzám, šampon i kapsle online s dobírkou",
          "Rozsáhlé vzplanutí nebo otoky kloubů — nejdřív odborné vyšetření",
        ],
      },
      {
        id: "vrstvy-pece",
        heading: "Tři vrstvy péče: dermatolog, lokální přípravky a doplněk stravy",
        body: [
          "U lupénky pomáhá oddělit tři vrstvy. Lékařská péče řeší diagnózu a léčbu — lokální či systémové léky na předpis, fototerapii nebo biologickou léčbu u těžších forem. Volně prodejná lokální péče (krém, mast, gel, balzám, šampon) slouží k hydrataci, zklidnění a komfortu pokožky v klidové fázi.",
          "Doplňky stravy na lupénku (kapsle, kapky) cílí na výživovou a režimovou podporu zevnitř — na etiketě často omega-3, vitamin D, kurkumin nebo probiotika. Realistický scénář: lokální péče podle potřeby + případný doplněk podle etikety, bez očekávání „zázračné kúry“.",
        ].join("\n\n"),
        bullets: [
          "Dermatolog / Rx = diagnóza a léčba na předpis",
          "Lokální péče = krém, mast, gel, šampon pro komfort kůže",
          "Doplněk stravy = vnitřní podpora režimu",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na lupénku a lokální péči",
        body: [
          "Nejdřív pojmenujte cíl: ulevit suchým ložiskům na těle, zklidnit pokožku hlavy, nebo hledáte vnitřní podporu? Pak zvolte formu — krém či mast na tělo, lehčí gel nebo balzám podle tolerance, šampon na vlasovou pokožku, kapsle či kapky pro denní schéma. U lokálních přípravků vždy vyzkoušejte snášenlivost na malé ploše zdravé kůže.",
          "Čtěte etiketu: frekvenci, délku kúry, seznam složek a upozornění. Počítejte cenu za cyklus, ne jen za jedno balení. Preferujte srozumitelné složení před sliby „okamžitého vymizení ložisek“.",
        ].join("\n\n"),
        bullets: [
          "Cíl: tělo / pokožka hlavy / vnitřní podpora",
          "Forma: krém·mast·gel·balzám·šampon vs. kapsle·kapky",
          "Test snášenlivosti u lokálních přípravků",
          "Délka kúry a denní dávka dle návodu",
          "Cena cyklu a realistická očekávání",
        ],
      },
      {
        id: "formy",
        heading: "Krém, mast, gel, balzám, šampon, kapsle a kapky",
        body: [
          "Krém na lupénku se často volí pro denní promaštění ložisek — snadnější roztírání a rychlejší vstřebání. Mast bývá bohatší a hodí se na velmi suchá místa nebo noční péči. Gel a balzám volí lidé, kteří chtějí jinou konzistenci nebo cílenou regenerační péči dle etikety; šampon míří na pokožku hlavy se sklonem k šupinám a svědění.",
          "Kapsle na lupénku a kapky jsou doplňky stravy pro vnitřní podporu — denní schéma, dávka v miligramech a délka kúry na obalu. Lokální a perorální větev lze kombinovat, pokud to dává smysl ve vašem režimu. Katalog se rozšiřuje; porovnávejte aktuální nabídku podle formy, ne podle marketingového názvu.",
        ].join("\n\n"),
        bullets: [
          "Krém / mast → ložiska na těle, denní vs. intenzivnější péče",
          "Gel / balzám → konzistence dle preference a etikety",
          "Šampon → pokožka hlavy, šetrné mytí bez agresivních irritantů",
          "Kapsle / kapky → vnitřní podpora jako doplněk stravy",
        ],
      },
      {
        id: "slozky",
        heading: "Složky na etiketě: lokální péče i vnitřní podpora",
        body: [
          "V lokálních přípravcích se často objevují emolientní báze, výtažky z konopí, aloe, urea nebo CBD — jako typy složek pro hydrataci a komfort citlivé kůže. Sledujte seznam irritantů (parfémy, alkoholy) a vždy čtěte upozornění výrobce.",
          "U doplňků stravy na lupénku se v diskuzích opakují omega-3 (EPA/DHA), vitamin D, kurkumin a probiotika v kontextu zánětu, imunity a osy střevo–kůže. Jde o gramotnost etikety: dávka, forma a délka kúry — porovnávejte konkrétní obal, ne obecný blogový seznam.",
        ].join("\n\n"),
        bullets: [
          "Lokálně: emoliencia, konopí, aloe, urea, CBD — typy složek, ne značky",
          "Omega-3 — často diskutovaná vnitřní podpora",
          "Vitamin D — sledujte dávku na etiketě",
          "Kurkumin a probiotika — režimová gramotnost etikety",
        ],
      },
      {
        id: "spoustece",
        heading: "Spouštěče vzplanutí: co často zhoršuje lupénku",
        body: [
          "U mnoha lidí lupénku zhoršuje stres, alkohol, kouření, infekce (např. streptokokové) nebo některé léky. Přípravek z katalogu bez úpravy spouštěčů obvykle přinese menší komfort než péče + režim dohromady.",
          "Praktický checklist: spánek a zvládání stresu, omezení alkoholu a kouření, hygiena a šetrná péče o kůži, včasná léčba infekcí. Doplněk stravy ani krém „nevypnou“ spouštěč — podporují komfort vedle těchto kroků.",
        ].join("\n\n"),
        bullets: [
          "Stres a spánek",
          "Alkohol a kouření",
          "Infekce a některé léky",
          "Šetrná hygiena a pravidelné promaštění",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy a kosmetická péče v této kategorii podporují komfort pokožky; nenahrazují dermatologickou léčbu lupénky (léky na předpis, fototerapii ani biologika). Nepřekračujte dávkování na etiketě a při podráždění lokální přípravek vysaďte.",
          "K dermatologovi patří rozsáhlé nebo rychle se šířící vzplanutí, hnisání, silná bolest, postižení kloubů s otoky, děti, těhotenství, kojení a stav bez zlepšení po důsledné domácí péči.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Vrstvy péče při lupénce — orientační mapa",
        headers: ["Vrstva", "Typický obsah", "Kde patří"],
        rows: [
          [
            "Dermatolog / léčba na předpis",
            "Diagnóza, kortikoidy, analogy D, fototerapie, biologika",
            "Ordinace a odborný plán",
          ],
          [
            "Lokální péče",
            "Krém, mast, gel, balzám, šampon",
            "Komfort a hydratace v katalogu Recenze Ceny",
          ],
          [
            "Doplněk stravy",
            "Kapsle a kapky (např. omega-3, D, byliny)",
            "Vnitřní podpora režimu",
          ],
        ],
      },
      {
        caption: "Formy přípravků v kategorii Psoriáza — rychlé srovnání",
        headers: ["Forma", "Kdy dává smysl", "Na co se dívat"],
        rows: [
          [
            "Krém",
            "Denní promaštění ložisek na těle",
            "Vstřebávání, irritanty, frekvence, test snášenlivosti",
          ],
          [
            "Mast",
            "Velmi suchá místa, intenzivnější / noční péče",
            "Konzistence, occluding efekt, oblečení",
          ],
          [
            "Gel / balzám",
            "Jiná konzistence dle preference a etikety",
            "Určení na obalu, citlivost kůže",
          ],
          [
            "Šampon",
            "Pokožka hlavy se sklonem k šupinám",
            "Šetrné mytí, frekvence, bez agresivních irritantů",
          ],
          [
            "Kapsle",
            "Stabilní denní vnitřní podpora",
            "mg složek, délka kúry, cena cyklu",
          ],
          [
            "Kapky",
            "Flexibilní dávkování dle návodu",
            "Odměrka, chuť, skladování, alkohol v bázi",
          ],
        ],
      },
      {
        caption: "Časté typy složek — gramotnost etikety",
        headers: ["Složka / typ", "Proč se objevuje", "Na co se dívat"],
        rows: [
          [
            "Emoliencia, konopí, aloe, urea, CBD",
            "Lokální hydratace a komfort citlivé kůže",
            "Seznam irritantů; individuální snášenlivost",
          ],
          [
            "Omega-3 (EPA/DHA)",
            "Často diskutovaná vnitřní podpora",
            "Dávka EPA/DHA na etiketě",
          ],
          [
            "Vitamin D",
            "Imunitní a kožní kontext na etiketách",
            "Nepřekračovat doporučenou dávku",
          ],
          [
            "Kurkumin",
            "Bylinná složka v některých formulích",
            "mg extraktu na obalu",
          ],
          [
            "Probiotika",
            "Diskuze o ose střevo–kůže",
            "Kmeny a CFU na etiketě",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Psoriáza", path: `${GUIDE_PATH}/psoriasis` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Klouby", path: "/klouby" },
      { label: "Kategorie: Proti stresu", path: "/stres" },
      { label: "Kategorie: Anti-aging a péče o pleť", path: "/anti-aging" },
    ],
    categoryFaqHi: [
      {
        q: "Je doplněk stravy nebo krém totéž co léčba lupénky?",
        a: "Ne. Léčbu lupénky řídí dermatolog — včetně léků na předpis, fototerapie nebo biologik. Krém, mast a doplněk stravy slouží nanejvýš k podpoře komfortu pokožky a režimu.",
      },
      {
        q: "Krém, mast nebo kapsle — co zvolit při lupénce?",
        a: "Lokální krém či mast volte pro přímou péči o ložiska; šampon při potížích na pokožce hlavy. Kapsle a kapky jsou doplněk stravy pro vnitřní podporu. Nejdřív cíl a místo problému, potom forma a složení.",
      },
      {
        q: "Jak dlouho aplikovat krém nebo užívat kapsle?",
        a: "Řiďte se návodem na obalu. U lokální péče bývá důležitá pravidelnost; u doplňků stravy často řádově týdny v rámci kúry. Při zhoršení nebo vyrážce přípravek vysaďte — dávku sami nenavyšujte.",
      },
      {
        q: "Pomáhají omega-3 nebo vitamin D při lupénce?",
        a: "Objevují se v diskuzích a na etiketách doplňků stravy jako výživová podpora. Nejde o zaručený výsledek u ložisek — volte transparentní dávku na obalu.",
      },
      {
        q: "Co spouští vzplanutí lupénky?",
        a: "Často stres, alkohol, kouření, infekce nebo některé léky. Přípravek bez úpravy spouštěčů obvykle nestačí. Při rozsáhlém vzplanutí řešte stav dříve, než objednáte další balení.",
      },
      {
        q: "Mohu kombinovat lokální péči s doplňkem stravy?",
        a: "Ano, pokud to dává smysl ve vašem režimu a etikety si neodporují. Sledujte dávkování a snášenlivost každého přípravku zvlášť.",
      },
      {
        q: "Kdy raději k dermatologovi než po další balení?",
        a: "Při rozsáhlém nebo rychle se šířícím vzplanutí, hnisání, silné bolesti, otoku kloubů, u dětí, v těhotenství a kojení, nebo když se stav po důsledné domácí péči nezlepšuje.",
      },
    ],
    keywordsHi: [
      "doplňky stravy na lupénku",
      "krém na lupénku",
      "mast na lupénku",
      "gel na lupénku",
      "kapsle na lupénku",
      "přípravky na lupénku",
      "psoriáza",
      "lupénka",
      "přírodní péče při psoriáze",
      "omega-3",
      "vitamin D",
      "probiotika",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /**
   * Fresh hub from CZ SERP competitors (Lékárna Prague encyclopedia blocks,
   * affiliate PDP tables/FAQ, dneskaabstinuju safety, liver/kudzu LSI) —
   * NOT a rewrite of prior thin pack / other site hubs.
   */
  alkoholismus: {
    taglineHi: "Podpora výživy a regenerace — ne lék na závislost",
    shortDescHi:
      "Vitaminové a bylinné doplňky stravy při snižování alkoholu: srovnání složení a forem, dobírka po ČR.",
    categoryIntroHi: [
      "Doplňky stravy při odvykání alkoholu slouží jako výživová a bylinná podpora při snižování pití nebo abstinenci — ne jako léčba závislosti. V katalogu porovnáte kapsle a kapky podle etikety: vitaminy skupiny B, minerály, silymarin (ostropestřec), kudzu a další složky, plus délku kúry a cenu za cyklus.",
      "Léky na předpis a lékařský detox sem nepatří; ty řeší odborná péče. Objednávka je s platbou na dobírku, doručení obvykle do 2–5 pracovních dnů po České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "priznaky",
        heading: "Varovné signály: kdy má smysl řešit alkohol systematicky",
        body: [
          "Problematické pití se nepozná jen podle „denní lahve“. Typické fyzické stopy zahrnují třes, pocení, nevolnost, zhoršený spánek a postupnou zátěž jater; psychicky se přidávají úzkost, výkyvy nálady a ztráta kontroly nad množstvím. Sociálně se objevují konflikty v práci i v rodině a opakované sliby „od zítřka už ne“.",
          "Orientační stadia — od občasného nadměrného pití přes pravidelnou konzumaci s prvními problémy až po ztrátu kontroly — pomáhají rozhodnout, zda stačí změna návyků, nebo je nutná odborná diagnostika. Doplněk stravy dává smysl až jako doplněk k plánu; při denním pití a odvykacích příznacích není prvním krokem e-shop, ale lékař nebo adiktologická ambulance.",
        ].join("\n\n"),
        bullets: [
          "Fyzicky: třes, pocení, spánek, jaterní zátěž",
          "Psychicky: chuť pít, úzkost, ztráta kontroly",
          "Sociálně: práce, vztahy, izolace",
          "Čím dál ve stadiu, tím dřív odborná péče před doplňkem",
        ],
      },
      {
        id: "farmakoterapie",
        heading: "Farmakologická podpora: léky na předpis a lékařský detox",
        body: [
          "V odborné léčbě závislosti na alkoholu se v ČR používají léčivé přípravky, které e-shopový doplněk stravy nenahrazuje. Disulfiram senzitizuje organismus vůči alkoholu (nepříjemná reakce po požití), naltrexon a acamprosát se řadí mezi prostředky snižující craving nebo podporující abstinenci — vždy v rámci programu s lékařem. Benzodiazepiny a další akutní medikace patří výhradně do řízeného detoxu.",
          "Lékařský detox sleduje odvykací syndrom (tlak, tep, třes, riziko záchvatů či deliria) a doplňuje kritické vitaminy — zejména thiamin — pod dohledem. Domácí „cold turkey“ u silné závislosti může být nebezpečné. Tato kategorie Recenze Ceny neprodává léky na předpis; popis slouží k tomu, abyste věděli, co je lék a co je jen doplněk stravy.",
        ].join("\n\n"),
        bullets: [
          "Disulfiram / naltrexon / acamprosát = Rx, ne doplněk stravy",
          "Detox = monitorování odvykacích příznaků, ne domácí experiment",
          "Thiamin v akutní péči ≠ běžná kapsle z katalogu",
        ],
      },
      {
        id: "podpurne-doplnky",
        heading: "Podpůrné doplňky stravy při regeneraci po alkoholu",
        body: [
          "Dlouhodobé pití vyčerpává zásoby živin a zatěžuje játra, střevo i nervový systém. Proto má smysl oddělit „léčbu závislosti“ od „podpůrné regenerace“: doplňky stravy při odvykání alkoholu cílí na výživu, antioxidantní podporu a bylinné formule — bez schváleného léčivého účinku na diagnózu alkoholismu.",
          "V katalogu hledejte přípravky, které otevřeně uvádějí dávky složek a délku kúry. Realistický scénář: abstinence nebo řízené snižování + odborná podpora + případný doplněk. Samotná kapsle bez změny rituálů (večery, stres, společnost) obvykle nic nevyřeší. Cenu počítejte za celý cyklus, ne jen za jedno balení.",
        ].join("\n\n"),
        bullets: [
          "Doplněk = regenerace a výživa, ne „anticravingový lék“",
          "Etiketa: mg, denní dávka, délka kúry, kontraindikace",
          "Kombinace s Rx jen po konzultaci lékaře / lékárníka",
        ],
      },
      {
        id: "ziviny-jata",
        heading: "Vitaminy, minerály, hepatoprotektiva a kudzu",
        body: [
          "V podpůrné vrstvě se opakovaně objevují vitaminy skupiny B (thiamin B1, B6, B12, folát), vitamin C a D, minerály zinek, hořčík a selen a antioxidanty (např. alfa-lipoová kyselina, koenzym Q10). U jater dominuje ostropestřec mariánský (silymarin) a někdy fosfolipidové směsi — vždy s podmínkou, že regenerace bez abstinence má malý smysl.",
          "Rostlinné směsi mohou obsahovat kudzu (pueraria), případně další byliny na nervový komfort. Kudzu není lék na alkoholismus; jde o složku, kterou někteří výrobci řadí do přírodních formulí. Každý produkt posuzujte podle konkrétní etikety — obecný seznam na blogu nestačí. Při jaterních onemocněních a chronické medikaci nejdřív lékař.",
        ].join("\n\n"),
        bullets: [
          "B-komplex / thiamin — výživová díra po nadměrném pití",
          "Silymarin — hepatoprotektivní linie; abstinence zůstává základ",
          "Zn, Mg, Se, vitamin C — minerály a antioxidanty v regeneraci",
          "Kudzu — složka v některých přírodních kapslích a kapkách",
        ],
      },
      {
        id: "vyber-formy",
        heading: "Jak vybrat v katalogu: kapsle, kapky a etiketa",
        body: [
          "Při výběru pomáhají přehledné body: forma, složení, dávkování, délka kúry. Kapsle a tobolky sedí na pevnou denní dávku a cestování. Kapky umožní jemnější dávkování podle návodu — ale zkontrolujte, zda tinktura neobsahuje alkohol v bázi (při odvykání nevhodné).",
          "Před nákupem si odpovězte: mám už odborný plán? Hledám vitaminovou podporu, jaterní formuli, nebo bylinnou směs? Pak porovnejte mg účinných látek, počet dávek v balení a cenu za cyklus. Gely a masti do této kategorie nepatří — jde o vnitřní přípravky.",
        ].join("\n\n"),
        bullets: [
          "Nejdřív odborný plán, pak typ složek, pak forma",
          "Kapsle = jednoduché schéma; kapky = flexibilita + kontrola báze",
          "Tabulky níže = rychlé srovnání forem a živin",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost, rodina a kdy k lékaři",
        body: [
          "Doplněk stravy neléčí závislost, neprovádí detox a neslibuje abstinenci. Blízcí mohou pomoci rozpoznat varovné signály a doprovodit k odborníkovi — bez „umožňování“ dalšího pití a bez nátlaku na nákup zázračných kapslí. Veřejné zdroje pomoci v ČR zahrnují adiktologické ambulance, poradny a Národní linku pro odvykání.",
          "Okamžitě k lékařské péči patří záchvaty, delirium, silný třes, zmatenost, bolest na hrudi, sebevražedné myšlenky, těhotenství při závislosti a jaterní selhání. Při lécích na předpis, epilepsii a chronických nemocech se před doplňkem zeptejte lékaře. Neobvyklou reakci = přerušit užívání a vyhledat pomoc.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Vrstvy péče při odvykání alkoholu — orientační mapa",
        headers: ["Vrstva", "Typický obsah", "Kde patří"],
        rows: [
          [
            "Odborná diagnostika / terapie",
            "Anamnéza, screening, psychoterapie, skupiny",
            "Lékař, adiktolog, ambulance — ne e-shop",
          ],
          [
            "Léky na předpis",
            "Disulfiram, naltrexon, acamprosát (+ akutní detox)",
            "Pouze pod lékařským dohledem",
          ],
          [
            "Doplněk stravy",
            "Vitaminy B, minerály, silymarin, bylinné směsi",
            "Podpora regenerace v katalogu Recenze Ceny",
          ],
        ],
      },
      {
        caption: "Formy přípravků v katalogu — kapsle vs. kapky",
        headers: ["Forma", "Kdy dává smysl", "Kontrolní body na etiketě"],
        rows: [
          [
            "Kapsle / tobolky",
            "Stabilní denní dávka, cestování, delší cyklus",
            "mg složek, počet kapslí/den, délka balení, cena cyklu",
          ],
          [
            "Kapky / tinktura",
            "Flexibilní dávkování podle návodu",
            "Odměrka, chuť, alkohol v bázi, skladování",
          ],
        ],
      },
      {
        caption: "Živiny a složky časté v podpůrných přípravcích",
        headers: ["Složka", "Proč se v přípravcích objevuje", "Na co se dívat"],
        rows: [
          [
            "Thiamin a B-komplex",
            "Deficit po chronickém pití; výživová podpora",
            "Akutní neurologické stavy řeší lékař, ne samoléčba",
          ],
          [
            "Silymarin (ostropestřec)",
            "Hepatoprotektivní linie po alkoholové zátěži",
            "Dávka extraktu; abstinence je podmínka smyslu",
          ],
          [
            "Zinek, hořčík, selen, vitamin C",
            "Minerály a antioxidanty v regeneračních směsích",
            "Interakce s léky; nepřekračovat dávku",
          ],
          [
            "Kudzu (pueraria)",
            "Rostlinná složka v některých přírodních formulích",
            "mg extraktu; není záruka abstinence",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Alkoholismus", path: `${GUIDE_PATH}/alcoholism` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Játra", path: "/jatra" },
      { label: "Kategorie: Odvykání kouření", path: "/odvykani-koureni" },
      { label: "Kategorie: Detoxikace", path: "/detox" },
    ],
    categoryFaqHi: [
      {
        q: "Je doplněk stravy totéž co léčba alkoholismu?",
        a: "Ne. Léčba závislosti zahrnuje diagnostiku, režim a často léky na předpis nebo detox. Doplněk stravy je nanejvýš výživová či bylinná podpora regenerace — bez schváleného léčivého účinku na závislost.",
      },
      {
        q: "Kdy stačí doplněk a kdy je nutný lékař?",
        a: "Při občasné snaze snížit pití bez odvykacích příznaků může doplněk doplnit režim. Při denním pití, třesu, záchvatech, zmatenosti, jaterní nemoci nebo depresi patříte k lékaři dříve než do e-shopu.",
      },
      {
        q: "K čemu jsou disulfiram, naltrexon nebo acamprosát?",
        a: "Jde o léčivé přípravky na předpis v odborné léčbě (senzitizace vůči alkoholu nebo snížení cravingu / podpora abstinence). Nejsou to doplňky stravy a neobjednávají se jako běžný e-shopový „přírodní přípravek“.",
      },
      {
        q: "Proč se při odvykání zmiňují vitaminy B a ostropestřec?",
        a: "Chronické pití často doprovází deficit B-vitaminů a zátěž jater. Proto se v podpůrných přípravcích objevují B-komplex, thiamin a silymarin. Samy o sobě závislost nevyléčí; při akutních neurologických nebo jaterních potížích rozhoduje lékař.",
      },
      {
        q: "Jak poznám vhodnou formu — kapsle nebo kapky?",
        a: "Kapsle volte pro pevné denní schéma. Kapky, když potřebujete dávkovat po kapkách dle návodu — a ověřte, že báze neobsahuje alkohol. Srovnání mg, ceny cyklu a kontraindikací je důležitější než marketingový název.",
      },
      {
        q: "Může rodina „koupit přípravek“ místo terapie?",
        a: "Ne. Blízcí mohou motivovat k odborné pomoci a podpořit změnu prostředí, ale nákup doplňku místo ambulance problém neřeší. Umožňování pití a zázračné sliby škodí.",
      },
      {
        q: "Jak dlouho má smysl užívat podpůrný přípravek?",
        a: "Podle návodu na obalu — často řádově týdny v rámci regeneračního režimu. Zhoršení odvykacích příznaků nebo nové zdravotní potíže = přerušit a kontaktovat lékaře, ne navyšovat dávku.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy při odvykání alkoholu",
      "přípravky na odvykání alkoholu",
      "přírodní prostředky proti alkoholu",
      "kapsle na odvykání alkoholu",
      "kapky proti alkoholismu",
      "vitaminy skupiny B",
      "thiamin",
      "silymarin",
      "ostropestřec",
      "kudzu",
      "hepatoprotektiva",
      "odvykací příznaky",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /** Rich hub (SERP-led odvykání kouření): DS vs NRT vs cytisin, byliny — not thin pack(). */
  "odvykani-koureni": {
    taglineHi: "Kapsle a bylinné formule jako podpora režimu — ne náhrada NRT ani léku",
    shortDescHi:
      "Kapsle a přírodní prostředky pro podporu při snižování spotřeby cigaret — s dobírkou a doručením po celé České republice.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na odvykání kouření, které dávají smysl vedle realistického plánu — ne jako zázračný „anti-cig“ lék z lékárenské police s nikotinovými náplastmi? V kategorii Odvykání kouření na Recenze Ceny porovnáte kapsle na odvykání kouření a přírodní prostředky proti kouření podle složení, délky kúry a formy.",
      "Jde o doplňky stravy: mohou podpořit organismus a zvládání chuti na cigaretu v rámci režimu, ale nenahrazují nikotinovou substituční terapii (NRT) ani volně prodejné léky s cytisinem. Od obecných přípravků na dýchací cesty se liší zaměřením na podporu odvykání — ne na plíce nebo bronchy.",
      "Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice. Podrobný výběrový checklist najdete i v průvodci Odvykání kouření.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho jsou doplňky stravy na odvykání kouření",
        body: [
          "Katalog ocení dospělí, kteří chtějí snížit spotřebu cigaret nebo připravit úplné odvykání a hledají doplňkovou podporu vedle změny návyků — například při první vlně abstinenčních příznaků (chuť na cigaretu, podrážděnost, neklid). Dává smysl jako součást plánu s jasným datem a motivací, ne jako samoléčba těžké závislosti.",
          "Přípravky v nabídce jsou doplňky stravy, nikoli léčiva. Těhotné a kojící ženy, lidé s onemocněním srdce a cév, epilepsií nebo silnou nikotinovou závislostí (více než krabička denně, opakované neúspěšné pokusy) by měli před kúrou mluvit s lékařem nebo lékárníkem. Silné duševní potíže, bolest na hrudi nebo náhlé zhoršení zdravotního stavu patří k odbornému vyšetření, ne do „delší domácí kúry z internetu“.",
        ].join("\n\n"),
        bullets: [
          "Dospělí s plánem snižovat spotřebu nebo přestat kouřit",
          "Kdo chce porovnat přírodní kapsle online s dobírkou",
          "Ne jako náhrada NRT, cytisinu ani péče Centra pro závislé na tabáku",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na odvykání kouření",
        body: [
          "Nejdřív si ujasněte cíl: úplné ukončení kouření k určitému datu, nebo postupné snižování spotřeby. Pak rozhodněte, zda potřebujete lékárenskou NRT / cytisin (po poradě), nebo hledáte doplněk stravy jako podporu režimu. Čtěte etiketu: účinné složky v miligramech, doporučenou délku kúry, denní dávku a cenu za celý cyklus.",
          "Sledujte realistická očekávání — doplněk bez změny rituálů (káva, pauzy, stres) dává menší smysl. Při lécích na předpis nebo při užívání nikotinových náhrad se před kombinací zeptejte lékárníka nebo lékaře.",
        ].join("\n\n"),
        bullets: [
          "Cíl: kompletní stop vs. postupné snižování spotřeby",
          "Transparentní složení — byliny a dávky na etiketě, ne jen marketingový seznam",
          "Délka kúry a doporučená denní dávka dle návodu výrobce",
          "Forma: kapsle vs. kapky podle pohodlí užívání",
          "Kombinace s NRT nebo cytisinem — jen po ověření u odborníka",
          "Red flags: těhotenství, CVD, silná závislost → lékař dříve než e-shop",
        ],
      },
      {
        id: "doplnek-vs-nrt",
        heading: "Doplněk stravy, NRT, nebo cytisin?",
        body: [
          "V České republice se při odvykání kouření nejčastěji setkáte se třemi skupinami přípravků. Nikotinová substituční terapie (náplasti, žvýkačky, pastilky, ústní spreje) dodává kontrolovanou dávku nikotinu bez tabákového kouře a zmírňuje abstinenční příznaky. Volně prodejné tablety s cytisinem jsou léčivé přípravky s pevným schématem užívání (typicky kolem 25 dnů) a jasnými pravidly, kdy přestat kouřit.",
          "Doplňky stravy na odvykání kouření nikotin obvykle neobsahují a nemají schválené léčivé účinky. Mohou sloužit jako podpůrný prostředek v rámci režimu — například při zvládání stresu nebo chuti na cigaretu — ale nestanoví diagnózu závislosti ani nenahrazují NRT či cytisin. Pokud jste silný kuřák nebo máte opakované relapsy, nejdřív konzultujte lékárnu nebo Centrum pro závislé na tabáku.",
        ].join("\n\n"),
        bullets: [
          "NRT = nikotinová náhrada (náplasti, žvýkačky, spreje) — léčivý přípravek",
          "Cytisin = volně prodejný lék se schématem kúry — ne doplněk stravy",
          "Doplněk stravy = podpora režimu, ne záruka ukončení kouření",
        ],
      },
      {
        id: "byliny",
        heading: "Časté byliny a složky v přírodních přípravcích",
        body: [
          "Na českém trhu se v přírodních prostředcích proti kouření opakovaně objevují extrakty, které tradiční praxe spojuje s podporou při závislostech a zvládáním stresu: kudzu (pueraria), chaga, meduňka, lípa, třezalka, puškvorec, případně vitaminy skupiny B, vitamin C nebo chrom při zvýšené chuti k jídlu. Konkrétní přípravek vždy posuzujte podle etikety — obecný seznam nestačí.",
          "Některé byliny (zejména třezalka) mohou interagovat s léky na předpis; těhotenství, kojení a chronická medikace vždy konzultujte s odborníkem. Doplněk stravy neslibuje „přestanete kouřit za týden“ — cílem je transparentní složení a realistická podpora vedle plánu odvykání.",
        ].join("\n\n"),
        bullets: [
          "Kudzu — často u formulí na chuť po stimulantech (nikotin, alkohol)",
          "Chaga a antioxidanty — časté v „detox“ laděných směsích po kouření",
          "Meduňka, lípa, třezalka — podpora klidu při cravingu a stresu",
          "Chrom / vláknina — někdy při chuti na sladké v prvních týdnech",
          "Čtěte dávku v mg a upozornění na obalu",
        ],
      },
      {
        id: "formy",
        heading: "Kapsle nebo kapky",
        body: [
          "Kapsle a tobolky se hodí, když chcete jasnou denní dávku a jednoduché cestování — typická forma kapslí na odvykání kouření v e-shopech. Kapky a tinktury oceníte při flexibilním dávkování podle návodu — zkontrolujte chuť a případný obsah alkoholu v bázi (při odvykání často nevhodné).",
          "Lokální gely a krémy do této kategorie nepatří — jde o vnitřní podporu. Preferujte přípravky s uvedeným schématem užívání a délkou kúry. Porovnejte formy v tabulce níže a pak vyberte produkt v katalogu podle ceny a dostupnosti.",
        ].join("\n\n"),
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na odvykání kouření nejsou lékem na nikotinovou závislost a neslibují zaručený výsledek. Nepřekračujte dávkování na obalu. V těhotenství, při kojení, srdečních onemocněních a při lécích na předpis se před kúrou poraďte s lékařem. Při kombinaci s nikotinovými náhradami nebo cytisinem ověřte kompatibilitu u lékárníka.",
          "Při silné závislosti, opakovaných relapsech, depresivní náladě nebo bolesti na hrudi neprodlužujte domácí experiment — vyhledejte lékaře nebo Centrum pro závislé na tabáku. Při neobvyklé reakci užívání přerušte a vyhledejte pomoc.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy doplňků stravy na odvykání kouření — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Kapsle / tobolky",
            "Jasná denní dávka, cestování, delší kúra",
            "Počet kapslí na dávku, délka balení, cena za cyklus, složení v mg",
          ],
          [
            "Kapky / tinktura",
            "Flexibilní dávkování dle návodu výrobce",
            "Odměrka, chuť, alkohol v bázi (často nevhodné při odvykání), skladování",
          ],
        ],
      },
      {
        caption: "Doplněk stravy vs. NRT vs. cytisin — orientační přehled",
        headers: ["Typ přípravku", "Co typicky řeší", "Na co myslet"],
        rows: [
          [
            "Doplněk stravy",
            "Podpora režimu, zvládání stresu / chuti v rámci plánu",
            "Není lék; čtěte etiketu; realistická očekávání",
          ],
          [
            "NRT (náplasti, žvýkačky, spreje)",
            "Kontrolovaný nikotin bez kouře, úleva od abstinence",
            "Léčivý přípravek; dávkování dle závislosti; poraďte se v lékárně",
          ],
          [
            "OTC cytisin (tablety)",
            "Snížení chuti na nikotin podle pevného schématu kúry",
            "Léčivý přípravek; čtěte příbalový leták; ne pokračovat v kouření dle PI",
          ],
        ],
      },
      {
        caption: "Časté složky v přírodních přípravcích proti kouření",
        headers: ["Složka", "K čemu se vztahuje v kontextu kúry", "Tip při výběru"],
        rows: [
          [
            "Kudzu (pueraria)",
            "Tradičně u formulí na chuť po stimulantech",
            "Dávka extraktu v mg; interakce ověřte u lékárníka",
          ],
          [
            "Chaga / antioxidanty",
            "Časté v „očistných“ směsích po kouření",
            "Není náhrada odvykacího plánu ani NRT",
          ],
          [
            "Meduňka / lípa",
            "Podpora klidu při cravingu a nervozitě",
            "Sledujte celé složení směsi",
          ],
          [
            "Třezalka",
            "Tradičně u nálady a stresu",
            "Pozor na interakce s léky na předpis",
          ],
          [
            "Chrom / vitaminy B, C",
            "Někdy při chuti na sladké a únavě v prvních týdnech",
            "Doplněk stravy ≠ léčba abstinence",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Odvykání kouření", path: `${GUIDE_PATH}/smoking-cessation` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Dýchací cesty", path: "/dychaci-cesty" },
      { label: "Kategorie: Proti stresu", path: "/stres" },
    ],
    categoryFaqHi: [
      {
        q: "Jak dlouho trvá kúra doplňku na odvykání kouření?",
        a: "Řiďte se návodem na obalu — u bylinných doplňků stravy často několik týdnů pravidelného užívání v rámci plánu odvykání. Pokud se potíže zhoršují nebo craving neustupuje, kúru nepřetahujte a konzultujte lékárníka nebo lékaře.",
      },
      {
        q: "Lze kombinovat doplněk s nikotinovými náplastmi nebo žvýkačkami?",
        a: "Někdy ano jako podpora režimu, ale vždy ověřte u lékárníka nebo lékaře — zvlášť při lécích na předpis, srdečních potížích nebo silné závislosti. Doplněk stravy nenahrazuje správně nastavenou NRT.",
      },
      {
        q: "Je doplněk stravy totéž co lék s cytisinem?",
        a: "Ne. Tablety s cytisinem jsou léčivé přípravky s pevným schématem kúry a pravidly v příbalovém letáku. Doplněk stravy nemá schválené léčivé účinky a slouží jen jako podpora vedle režimu.",
      },
      {
        q: "Jaké byliny bývají v přírodních prostředcích proti kouření?",
        a: "Často se objevují kudzu, chaga, meduňka, lípa, třezalka nebo puškvorec, případně vitaminy B/C a chrom. Konkrétní produkt vždy ověřte podle etikety — obecný seznam nestačí.",
      },
      {
        q: "Pomůže doplněk sám bez změny návyků?",
        a: "Samotný doplněk stravy obvykle nestačí. Úspěch zvyšuje jasný plán (datum, motivace), změna rituálů kolem cigarety a případně odborná pomoc. Doplněk je podpora, ne záruka výsledku.",
      },
      {
        q: "Mohou doplňky užívat těhotné nebo kojící ženy?",
        a: "Obvykle ne bez konzultace — v těhotenství a při kojení nejdřív lékař. Odvykání v těchto obdobích patří do odborné péče, ne do samoléčby e-shopovým doplňkem.",
      },
      {
        q: "Kdy místo doplňku rovnou k lékaři?",
        a: "Při silné závislosti, opakovaných relapsech, bolesti na hrudi, duševních potížích, těhotenství nebo chronických onemocněních srdce a cév. Využijte i Centra pro závislé na tabáku — doplněk stravy v těchto situacích nestačí.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na odvykání kouření",
      "kapsle na odvykání kouření",
      "přírodní prostředek proti kouření",
      "přípravky na odvykání kouření",
      "abstinenční příznaky",
      "kudzu",
      "chaga",
      "nikotinová substituční terapie",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /**
   * SERP-led hub from CZ competitors (Sanomed/TEJPY H1 folk+latin,
   * Pilulka TOC+příznaky, Orthexa care layers, cream-lander tables/FAQ) —
   * NOT a rewrite of prior thin pack / other site hubs.
   */
  "vboceny-palec": {
    serpLedHub: true,
    taglineHi:
      "Krém, sprej i kapsle — lokální komfort při vbočeném palci, ne náhrada ortopedie",
    shortDescHi:
      "Přípravky na vbočený palec (hallux valgus): krém, sprej a kapsle pro podporu komfortu. Srovnání forem, realistická očekávání, dobírka po ČR.",
    categoryIntroHi: [
      "Hledáte přípravky na vbočený palec — odborně hallux valgus — a nevíte, zda stačí krém, sprej, nebo kdy už patříte k ortopedovi? V kategorii na Recenze Ceny porovnáte lokální péči a doplňky stravy podle formy, etikety a režimu aplikace. Jde o kosmetickou péči a doplňky stravy pro podporu komfortu pokožky a okolí kloubu, nikoli o lék ani o mechanickou korekci kosti.",
      "Ortopedické korektory a noční bandáže řeší jinou vrstvu péče — drží palec jen po dobu nošení. Katalog pomáhá zvolit realistický cíl: zmírnit pocit tlaku a napětí večer, doplnit širokou obuv, nebo nastavit denní schéma dle návodu. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "co-je",
        heading: "Co je vbočený palec a co katalog řeší",
        body: [
          "Vbočený palec (hallux valgus) je deformita, při níž se palec uklání k ostatním prstům a na vnitřní straně nohy vzniká výčnělek. Často souvisí s úzkou obuví, vysokým podpatkem, predispozicí v rodině nebo příčně plochou klenbou. Typicky se objevuje bolest při chůzi, otok, zarudnutí a tlak v botě.",
          "Tento katalog neprodává silikonové korektory ani dlahy. Nabízí přípravky na vbočený palec ve formě krému, spreje a kapslí — jako podpůrnou lokální nebo vnitřní péči vedle vhodné obuvi a odborného plánu. Trvalou nápravu postavení kosti zajišťuje až ortopedie, ne tubička krému.",
        ].join("\n\n"),
        bullets: [
          "Folk termín: vbočený palec · odborně: hallux valgus",
          "Katalog: krém, sprej, kapsle — komfort a péče dle etikety",
          "Nepatří sem: silikonový korektor, noční bandáž, operace",
        ],
      },
      {
        id: "mapa-pece",
        heading: "Mapa péče — čtyři vrstvy při hallux valgus",
        body: [
          "U vbočeného palce pomáhá oddělit čtyři vrstvy. První je obuv: široká špička, nízký podpatek a dostatek místa pro prsty snižují tlak na kloub. Druhá jsou mechanické pomůcky (korektor, noční bandáž, gelový separátor) — drží palec jen když je máte na noze; po sundání se postavení vrací.",
          "Třetí vrstva je lokální péče z katalogu: krém nebo sprej na oblast palce podle návodu — podpora komfortu pokožky a pocitu uvolnění, ne „narovnání kosti“. Čtvrtá je odborník: ortoped nebo fyzioterapeut při bolesti, rychlé progresi nebo před operací. Realistický scénář často kombinuje vrstvy — ne hledá jeden zázračný produkt.",
        ].join("\n\n"),
        bullets: [
          "Obuv se širokou špičkou — základ každodenní úlevy",
          "Korektor / bandáž — mechanická podpora jen při nošení",
          "Krém / sprej / kapsle — lokální nebo vnitřní podpora komfortu",
          "Ortoped — diagnóza, rentgen, plán včetně operace",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat krém, sprej nebo kapsle na vbočený palec",
        body: [
          "Nejdřív pojmenujte cíl: večerní úleva po celém dni v botách, lehká denní péče kolem kloubu, nebo vnitřní doplněk stravy jako součást režimu? Krém se hodí na cílené vetření do pokožky; sprej na rychlou lokální aplikaci dle etikety; kapsle na denní perorální schéma.",
          "Čtěte obal: frekvenci, délku kúry, seznam složek a upozornění. Počítejte cenu za cyklus, ne jen za jedno balení. Preferujte srozumitelné složení před sliby okamžité korekce deformity. Silná bolest, otok s horečkou nebo rychlé zhoršení tvaru nohy — nejdřív odborné vyšetření, pak e-shop.",
        ].join("\n\n"),
        bullets: [
          "Cíl: večerní komfort / denní péče / vnitřní podpora",
          "Forma: krém · sprej · kapsle — dle návodu na obalu",
          "Test snášenlivosti u lokálních přípravků na malé ploše",
          "Cena cyklu a realistická očekávání (ne „narovnání kosti“)",
          "Silná bolest nebo rychlá progrese → ortoped dřív než další balení",
        ],
      },
      {
        id: "den-noc",
        heading: "Den vs noc — režim komfortu při vbočeném palci",
        body: [
          "Přes den rozhoduje obuv a zátěž: úzká špička a podpatek problém zhoršují. Lokální přípravek (krém nebo sprej) aplikujte podle návodu — často po umytí a osušení nohy, mimo otevřené oděrky. Některé přípravky se hodí spíš večer, kdy noha odpočívá; jiné dovolují denní schéma.",
          "V noci lidé často kombinují volnou pozici nohy, případně mechanickou pomůcku z lékárny (pokud jim ji doporučil odborník) a lokální péči. Katalogový krém ani sprej nenahrazuje noční bandáž — řeší jinou vrstvu. Sledujte, zda se po aplikaci objeví podráždění; při vyrážce přípravek vysaďte.",
        ].join("\n\n"),
        bullets: [
          "Den: široká obuv + dávkování dle etikety",
          "Večer: častý čas pro lokální péči po zátěži",
          "Noc: odpočinek nohy; bandáž jen pokud patří do vašeho plánu",
          "Podráždění → vysadit a zvážit konzultaci",
        ],
      },
      {
        id: "slozky",
        heading: "Složky na etiketě: co číst u přípravků na hallux valgus",
        body: [
          "U krémů a sprejů se na etiketách často objevují chladivé nebo bylinné typy složek (např. menthol, výtažky z arniky či dalších rostlin) — jako gramotnost etikety, ne jako zaručený léčebný účinek na deformitu. Sledujte seznam irritantů (parfémy, alkoholy) a vždy vyzkoušejte snášenlivost.",
          "U kapslí jako doplňku stravy čtěte dávku v miligramech, délku kúry a upozornění. Doplněk stravy podporuje výživový režim; nenahrazuje ortopedické řešení hallux valgus. Porovnávejte konkrétní obal v katalogu, ne obecný blogový seznam „zázračných“ látek.",
        ].join("\n\n"),
        bullets: [
          "Lokálně: menthol, bylinné extrakty — typy složek, ne značky",
          "Irritanty a test na malé ploše zdravé kůže",
          "Kapsle: mg, kúra, upozornění na etiketě",
          "Žádný seznam složek = náhrada rentgenu nebo operace",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k ortopedovi",
        body: [
          "Přípravky v této kategorii jsou kosmetická péče nebo doplňky stravy — podporují komfort, nenahrazují diagnózu ani léčbu hallux valgus. Nepřekračujte dávkování na etiketě. Při podráždění lokální přípravek vysaďte. Nekombinujte slepě více přípravků se stejným účelem bez ohledu na návod.",
          "K ortopedovi patří silná nebo noční bolest, rychlé zhoršení deformity, omezení chůze, otok s výrazným zarudnutím, podezření na infekci, děti, těhotenství a kojení, nebo stav bez úlevy po úpravě obuvi a důsledné domácí péči. Operace je odborné rozhodnutí — ne výsledek dalšího balení krému.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Čtyři vrstvy péče při vbočeném palci — orientační mapa",
        headers: ["Vrstva", "Co typicky řeší", "Co neřeší"],
        rows: [
          [
            "Široká obuv / režim",
            "Snížení tlaku na kloub při chůzi",
            "Trvalou korekci kostního postavení",
          ],
          [
            "Korektor / noční bandáž",
            "Mechanickou oporu jen při nošení",
            "Trvalé „narovnání“ po sundání",
          ],
          [
            "Krém / sprej (katalog)",
            "Lokální péči a komfort pokožky dle etikety",
            "Operaci ani ortopedickou diagnózu",
          ],
          [
            "Kapsle (doplněk stravy)",
            "Vnitřní podporu režimu dle obalu",
            "Náhradu lékaře nebo dlahy",
          ],
        ],
      },
      {
        caption: "Formy přípravků v kategorii — rychlé srovnání",
        headers: ["Forma", "Kdy dává smysl", "Na co se dívat"],
        rows: [
          [
            "Krém",
            "Cílené vetření do oblasti palce, často večer",
            "Frekvence, irritanty, test snášenlivosti",
          ],
          [
            "Sprej",
            "Rychlá lokální aplikace dle návodu",
            "Určení na obalu, vzdálenost nástřiku, citlivost kůže",
          ],
          [
            "Kapsle",
            "Stabilní denní vnitřní podpora jako doplněk stravy",
            "mg složek, délka kúry, cena cyklu",
          ],
        ],
      },
      {
        caption: "Časté typy složek na etiketě — gramotnost, ne sliby",
        headers: ["Typ složky", "Proč se objevuje", "Na co se dívat"],
        rows: [
          [
            "Menthol / chladivé látky",
            "Pocit osvěžení a lokálního komfortu",
            "Citlivost kůže; ne na otevřené rány",
          ],
          [
            "Bylinné extrakty (např. arnika a podobné)",
            "Kosmetická péče o podrážděnou oblast",
            "Seznam allergénů; individuální snášenlivost",
          ],
          [
            "Emolientní báze",
            "Hydratace a roztíratelnost krému",
            "Parfémy, alkoholy, occluding efekt na ponožkách",
          ],
          [
            "Složky v kapslích (dle konkrétního obalu)",
            "Výživová podpora jako doplněk stravy",
            "Dávka, kúra, upozornění — ne „léčba deformity“",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Vbočený palec", path: `${GUIDE_PATH}/valgus` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Klouby", path: "/klouby" },
      { label: "Kategorie: Křečové žíly a těžké nohy", path: "/krecove-zily" },
    ],
    categoryFaqHi: [
      {
        q: "Krém na vbočený palec, nebo korektor — co zvolit?",
        a: "Korektor a noční bandáž působí mechanicky jen po dobu nošení; krém nebo sprej z katalogu slouží k lokální péči o pokožku a komfortu dle etikety. Často se vrstvy doplňují — krém nenahrazuje korektor a naopak. Při silné bolesti nejdřív ortoped.",
      },
      {
        q: "Narovná krém nebo sprej kostní deformitu hallux valgus?",
        a: "Ne. Lokální přípravky neupravují trvale postavení kosti. Podporují komfort a péči o oblast palce. Trvalou korekci deformity řeší odborná ortopedie, případně operace.",
      },
      {
        q: "Aplikovat krém ráno, nebo večer?",
        a: "Řiďte se návodem na obalu. Mnozí volí večer po zátěži v botách; některé přípravky dovolují denní schéma. Na otevřené oděrky neaplikujte, pokud to etiketa zakazuje.",
      },
      {
        q: "Jak dlouho používat přípravek na vbočený palec?",
        a: "Délka kúry a frekvence jsou na etiketě konkrétního produktu. U lokální péče bývá důležitá pravidelnost; u kapslí často řádově týdny. Při zhoršení nebo vyrážce přípravek vysaďte — dávku sami nenavyšujte.",
      },
      {
        q: "Stačí široká obuv místo přípravku?",
        a: "Široká obuv je základ konzervativní úlevy a často přinese větší komfort než samotný produkt. Přípravek z katalogu dává smysl jako doplněk režimu, ne jako náhrada vhodné boty.",
      },
      {
        q: "Mohu kombinovat lokální krém s doplňkem stravy v kapslích?",
        a: "Ano, pokud to dává smysl ve vašem režimu a etikety si neodporují. Sledujte dávkování a snášenlivost každého přípravku zvlášť.",
      },
      {
        q: "Kdy raději k ortopedovi než po další balení?",
        a: "Při silné nebo noční bolesti, rychlé progresi deformity, omezení chůze, výrazném otoku a zarudnutí, u dětí, v těhotenství a kojení, nebo když úprava obuvi a domácí péče nepřináší úlevu.",
      },
    ],
    keywordsHi: [
      "přípravky na vbočený palec",
      "hallux valgus",
      "vbočený palec",
      "krém na vbočený palec",
      "krém na hallux valgus",
      "sprej na hallux valgus",
      "lokální péče při hallux valgus",
      "korektor vbočeného palce",
      "noční bandáž",
      "široká obuv",
      "ortoped",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  "vypadavani-vlasu": {
    taglineHi:
      "Doplňky stravy na vlasy a vitamíny na vlasy a nehty — checklist výběru, látky a realistická časová osa",
    shortDescHi:
      "Doplňky stravy na vlasy: porovnejte komplexy, biotin, zinek a lokální péči. Dobírka a doručení po celé České republice.",
    categoryIntroHi: [
      "Hledáte doplňky stravy na vlasy, které dávají smysl složením — ne jen marketingovým slibem „husté kadeře za týden“? V kategorii Péče o vlasy na Recenze Ceny srovnáte vnitřní komplexy i lokální péči o pokožku hlavy: kapsle, tablety a spreje určené k podpoře vitality vlasů zevnitř nebo cíleně na pokožku. Jde o doplňky stravy a kosmetickou péči, nikoli o lék na alopecii ani o transplantaci.",
      "Vlasy rostou pomalu a na jejich kvalitu působí strava, stres, hormony, železo i péče zvenku. Katalog pomáhá zvolit formu, pochopit klíčové látky (biotin, zinek, aminokyseliny, křemík) a nastavit realistická očekávání. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "rychly-prehled",
        heading: "Rychlý přehled: klíčové látky a časová osa",
        body: [
          "Než otevřete katalog produktů, projděte si tento mini-checklist — stejný přístup, jaký v české SERP odděluje užitečné huby od prázdných výpisů. U vitamínů na vlasy dává smysl sledovat spektrum látek, ne jen jednu megadózu biotinu. Viditelnější změnu kvality vlasů většina lidí hodnotí až po 8–12 týdnech pravidelného užívání; plnější dojem účesu často až po 3–6 měsících, protože vlasový cyklus je pomalý.",
          "Doplněk stravy podporuje výživu — nenahrazuje vyšetření při náhlém nebo ložiskovém výpadu. Tabulky níže shrnují látky a formy; podrobný checklist najdete v průvodci výběrem.",
        ].join("\n\n"),
        bullets: [
          "Komplex (biotin + zinek + aminokyseliny / křemík) > samotný biotin",
          "Orientační horizont: 8–12 týdnů kvalita; 3–6 měsíců hustota dojmu",
          "Nehty často reagují dřív než délka vlasů",
          "Náhlý / ložiskový výpad → lékař dřív než další balení",
          "Vnitřní podpora + šetrná lokální péče = častá praktická kombinace",
        ],
      },
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Péče o vlasy“",
        body: [
          "Katalog ocení dospělí, kteří řeší řídnutí, lámavost, matný vzhled nebo pomalejší růst a chtějí porovnat doplňky stravy na vlasy s jasnými kritérii. Dává smysl po období stresu, restriktivní diety nebo jako součást péče o vlasy a nehty — vždy s realistickým očekáváním, že jde o podporu, ne o zaručený „restart“ účesu.",
          "Ložiskové lysiny, náhlý masivní výpad, bolest nebo zánět pokožky hlavy, změny nehtů s celkovými příznaky a nejistota příčiny patří k dermatologovi nebo trichologovi. Stejně tak děti, těhotenství a kojení — před doplňkem konzultujte odborníka. Katalog nenahrazuje krevní testy (např. ferritin, vitamin D, štítná žláza), pokud je lékař doporučí.",
        ].join("\n\n"),
        bullets: [
          "Dospělí s difúzním řídnutím, lámavostí nebo slabším růstem",
          "Zájem o vitamíny na vlasy a nehty online s dobírkou",
          "Muži i ženy — příčiny padání se liší; doplněk není univerzální lék",
          "Ne jako náhrada vyšetření při ložiskové nebo náhlé alopecii",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy na vlasy",
        body: [
          "Nejdřív si ujasněte cíl: podpora kvality vlákna, péče o pokožku hlavy, nebo kombinace vnitřní + lokální. Pak čtěte složení denní dávky — počet „účinných látek“ na obalu nic neznamená, pokud chybí smysluplné množství biotinu, zinku, selenu nebo stavebních aminokyselin. Preferujte komplex s dobrou čitelností etikety před přípravkem, který sází jen na jednu megadózu.",
          "Sledujte délku balení (zda vystačí aspoň na 1–2 měsíce kúry), formu (kapsle, tablety, medvídci, sprej) a zbytečná aditiva. Cena za denní dávku pomáhá srovnat nabídku férověji než cena krabičky. Podrobnější postup výběru je v průvodci; zde jde o rychlá kritéria před objednávkou.",
        ].join("\n\n"),
        bullets: [
          "Cíl: kvalita vlasů / nehty / lokální péče o pokožku hlavy",
          "Složení denní dávky > marketingový název",
          "Délka balení a realistická kúra (měsíce, ne dny)",
          "Forma, kterou zvládnete užívat denně",
          "Red flags příčiny → lékař před dalšími baleními",
        ],
      },
      {
        id: "ucinne-latky",
        heading: "Účinné látky: biotin nestačí samotný",
        body: [
          "Biotin (vitamín B7) je nejčastěji hledaný „vitamín krásy“ a přispívá k udržení normálního stavu vlasů — ale samotný biotin na vlasy obvykle nestačí, pokud chybí zinek, bílkoviny, železo nebo celkově pestrá strava. Klinicky smysluplný deficit biotinu je u zdravých dospělých méně častý, než naznačuje reklama; přesto má biotin místo v komplexu.",
          "U doplňků stravy na vlasy se opakují zinek a selen (normální stav vlasů), křemík / přeslička, sírové aminokyseliny L-methionin a L-cystein (stavební kameny keratinu), MSM, vitaminy skupiny B a často i zmínka o kolagenu. Železo a vitamin D řešte spíš přes vyšetření — slepá vysoká suplementace bez indikace není cílem katalogu. Tabulka níže shrnuje orientační roli látek.",
        ].join("\n\n"),
        bullets: [
          "Biotin — součást komplexu, ne jediná „zázračná“ pilulka",
          "Zinek a selen — časté mikronutrienty na etiketách vlasových komplexů",
          "Methionin / cystein / MSM — stavební podpora keratinu dle přípravku",
          "Křemík — struktura vlákna; sledujte formu a dávku",
          "Železo / vitamin D — při podezření na deficit raději krevní testy",
        ],
      },
      {
        id: "formy",
        heading: "Formy: kapsle, tablety, medvídci a lokální péče",
        body: [
          "Vnitřní doplňky (kapsle, tablety, žvýkací „medvídci“) cílí na výživu zevnitř a vyžadují pravidelnost. Lokální spreje, tonika a šampony působí na pokožku hlavy podle návodu — doplňují, ale obvykle nenahrazují dlouhodobou vnitřní podporu, pokud je cílem právě výživa. Kolagenové drinky a beauty komplexy často cílí současně na vlasy, nehty a pokožku.",
          "Volte formu, kterou opravdu dodržíte: sebelepší komplex nefunguje v zásuvce. U lokální péče čtěte frekvenci a citlivost pokožky; u vnitřních přípravků nepřekračujte doporučené dávkování.",
        ].join("\n\n"),
        bullets: [
          "Kapsle / tablety — přesné dávkování, snadné dlouhodobé užívání",
          "Medvídci / gummies — pohodlí; kontrolujte cukry a reálný obsah látek",
          "Sprej / tonikum / šampon — lokální péče dle etikety",
          "Kombinace vnitřní + lokální — častá praxe, ne povinnost",
        ],
      },
      {
        id: "ocekavani",
        heading: "Co očekávat a jak dlouho čekat",
        body: [
          "Vlasový folikul nepracuje „přes noc“. U pravidelného užívání doplňků stravy na vlasy lidé často nejdřív vnímají pevnější nehty nebo méně lámavé konečky; úbytek padání a dojem hustšího účesu hodnotí spíš v horizontu měsíců. Orientačně: 4–8 týdnů — první subjektivní signály; 8–12 týdnů — kvalita vlákna; 3–6 měsíců — smysluplnější bilance růstového cyklu.",
          "Pokud se stav zhoršuje, objeví se ložiska nebo celkové příznaky (únava, výkyvy hmotnosti), doplněk neodkládejte vyšetření. Doplněk stravy není transplantace ani lék na androgenní alopecii — u genetického nebo hormonálního padání může být jen podpůrnou součástí širší péče doporučené lékařem.",
        ].join("\n\n"),
        bullets: [
          "4–8 týdnů: spíš nehty / méně lámání než „nová hustota“",
          "8–12 týdnů: hodnocení kvality a lesku při pravidelnosti",
          "3–6 měsíců: realistický horizont pro bilanci kúry",
          "Zhoršení nebo ložiska → lékař, ne další náhodný produkt",
        ],
      },
      {
        id: "chyby",
        heading: "Časté chyby při výběru vitamínů na vlasy",
        body: [
          "Nejčastější chyba je sázka jen na biotin a očekávání výsledku do dvou týdnů. Druhá je ignorování bílkovin, spánku, stresu a možné chudokrevnosti — pilulka pak „nefunguje“, protože příčina je jinde. Třetí je střídání přípravků každý měsíc podle influencerů místo dokončení rozumné kúry podle návodu.",
          "Čtvrtá chyba: zaměnit mechanické lámání vysušených vlasů za výpad z kořínku a řešit jen šampon, nebo naopak jen doplněk bez šetrné péče. Pátá: vysoké dávky „pro jistotu“ bez ohledu na etiketu a lékové interakce — u biotinu navíc může interferovat s některými laboratorními testy; při plánovaných odběrech se zeptejte lékaře.",
        ].join("\n\n"),
        bullets: [
          "Biotin-only + nereálný timeline",
          "Ignorování stravy, stresu a možného deficitu železa",
          "Skákání mezi značkami místo dokončení kúry",
          "Jen šampon, nebo jen doplněk — bez celkového pohledu",
          "Megadávky mimo návod a bez konzultace",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Doplňky stravy na vlasy a lokální péče o pokožku hlavy jsou určené k podpoře dle návodu výrobce — nejsou lékem na alopecii a nenahrazují diagnózu. Nepřekračujte dávkování, nekombinujte naslepo více přípravků se stejnými mikronutrienty a při vyrážce nebo nežádoucích účincích užívání přerušte.",
          "K dermatologovi nebo trichologovi jděte při ložiskovém výpadu, náhlém masivním padání, bolesti, hnisání, jizvení pokožky hlavy, u dětí, v těhotenství a kojení bez konzultace, nebo když máte celkové příznaky (silná únava, výkyvy hmotnosti, nehtové změny). Domácí kúra nesmí oddálit vyšetření.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Účinné látky v doplňcích stravy na vlasy — orientační přehled",
        headers: ["Látka", "Role ve výživě vlasů", "Typický signál / poznámka"],
        rows: [
          ["Biotin (B7)", "Přispívá k udržení normálního stavu vlasů", "Častý základ komplexu; samotný často nestačí"],
          ["Zinek", "Přispívá k udržení normálního stavu vlasů a nehtů", "Sledujte dávku % RHP na denní dávku"],
          ["Selen", "Podpora normálního stavu vlasů", "Součást mnoha „vlasy + nehty“ komplexů"],
          ["L-methionin / L-cystein", "Sírové aminokyseliny — stavební kameny keratinu", "Čtěte mg v denní dávce, ne jen název"],
          ["MSM / křemík", "Podpora struktury pojivových tkání / vlákna", "Forma křemíku a dávka dle etikety"],
          ["Železo / vitamin D", "Často skloňované u padání — spíš přes vyšetření", "Nepřidávejte naslepo vysoké dávky"],
        ],
      },
      {
        caption: "Formy produktů — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          ["Kapsle / tablety", "Denní vnitřní podpora, přesné dávkování", "Složení denní dávky, délka balení, kúra"],
          ["Medvídci / gummies", "Kdo preferuje žvýkací formu", "Obsah látek vs. cukry / sladidla"],
          ["Sprej / tonikum", "Cílená lokální péče o pokožku hlavy", "Frekvence, citlivost, návod"],
          ["Šampon / péče", "Doplněk rutiny mytí a vzhledu", "Není náhrada dlouhodobé výživy zevnitř"],
          ["Komplex vlasy + nehty", "Chcete širší „krása zevnitř“ spektrum", "Počet smysluplných látek, ne jen seznam názvů"],
        ],
      },
      {
        caption: "Časová osa očekávání při pravidelném užívání",
        headers: ["Období", "Co sledovat", "Realistické očekávání"],
        rows: [
          ["1–4 týdny", "Tolerance, návyk užívání", "Viditelná hustota obvykle ještě ne"],
          ["4–8 týdnů", "Nehty, lámavost, subjektivní pocit", "První jemné signály u části lidí"],
          ["8–12 týdnů", "Kvalita vlákna, lesk, padání na kartáči", "Častější horizont pro hodnocení kúry"],
          ["3–6 měsíců", "Celkový dojem hustoty a růstu", "Smysluplná bilance vlasového cyklu"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Péče o vlasy", path: `${GUIDE_PATH}/hair-care` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Anti-aging", path: "/anti-aging" },
    ],
    categoryFaqHi: [
      {
        q: "Jak dlouho trvá, než doplňky stravy na vlasy začnou působit?",
        a: "Vlasy rostou pomalu. Orientačně hodnotíte kvalitu až po 8–12 týdnech pravidelného užívání; plnější bilanci často až po 3–6 měsících. Nehty někdy zareagují dříve. Doplněk stravy není záruka hustoty — při zhoršení stavu jděte k lékaři.",
      },
      {
        q: "Stačí samotný biotin na vlasy?",
        a: "Samotný biotin často nestačí. Smysluplnější bývá komplex s biotinem, zinkem, selenem a stavebními aminokyselinami dle etikety. Biotin přispívá k normálnímu stavu vlasů, ale nenahrazuje pestrou stravu ani vyšetření při podezření na jiný deficit.",
      },
      {
        q: "Které látky mají smysl kromě biotinu?",
        a: "V doplňcích stravy na vlasy se často objevují zinek, selen, křemík, MSM, L-methionin a L-cystein a vitaminy skupiny B. Železo a vitamin D řešte spíš po konzultaci a případných krevních testech — ne naslepo vysokými dávkami.",
      },
      {
        q: "Jak poznám, že mi při padání vlasů chybí živiny?",
        a: "Samotné padání nestačí k diagnóze deficitu. Vodítkem mohou být únava, lámavé nehty, restriktivní dieta nebo výsledky vyšetření (např. ferritin, vitamin D). Přesné posouzení patří lékaři — katalog slouží k výběru doplňku, ne ke stanovení diagnózy.",
      },
      {
        q: "Pomáhají vitamíny na vlasy i při genetickém nebo hormonálním padání?",
        a: "Doplněk stravy může podpořit kvalitu vlákna, ale nenahrazuje léčbu androgenní alopecie ani hormonální poruchy. U genetického nebo hormonálního padání konzultujte dermatologa či trichologa; doplněk berte jen jako případnou podpůrnou součást doporučené péče.",
      },
      {
        q: "Kapsle, tablety, nebo medvídci — co vybrat?",
        a: "Zvolte formu, kterou zvládnete užívat denně. Kapsle a tablety obvykle nabízejí přehlednější dávkování; u medvídků kontrolujte skutečný obsah látek a složení. Důležitější než forma je spektrum denní dávky a délka kúry.",
      },
      {
        q: "Doplněk stravy, nebo šampon a sérum — co dřív?",
        a: "Vnitřní doplněk cílí na výživu zevnitř; šampon, tonikum nebo sprej na lokální péči o pokožku hlavy. Často se kombinují. Při nejasné příčině padání nejdřív zvažte lékařské posouzení, než budete střídat jen kosmetiku.",
      },
      {
        q: "Kdy jít k lékaři nebo trichologovi?",
        a: "Při ložiskovém výpadu, náhlém masivním padání, bolesti, zánětu či jizvení pokožky hlavy, u dětí, v těhotenství a kojení bez konzultace, nebo při celkových příznacích (silná únava, výkyvy hmotnosti). Domácí doplněk nesmí oddálit vyšetření.",
      },
      {
        q: "Jsou doplňky stravy na vlasy lékem?",
        a: "Ne. Jde o doplňky stravy nebo kosmetickou péči dle konkrétního produktu — nejsou určené k diagnostice, léčbě ani prevenci onemocnění a nenahrazují lékařskou péči.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "doplňky stravy na vlasy",
      "vitamíny na vlasy",
      "vitamíny na vlasy a nehty",
      "biotin na vlasy",
      "komplex na vlasy",
      "proti vypadávání vlasů",
      "zinek na vlasy",
      "péče o vlasy",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  /**
   * Rich hub — SERP outline (Yoo how-it-works / ErosStar assortment / Proerecta methods table).
   * Not the thin pack() H2 skeleton (pro-koho / jak-vybrat / formy).
   */
  "zvetseni-penisu": {
    serpLedHub: true,
    taglineHi:
      "Široký výběr přípravků na zvětšení penisu — lokální péče, kapsle i kontext pomůcek, diskrétně s dobírkou",
    shortDescHi:
      "Přípravky na zvětšení penisu: gely, krémy i kapsle. Porovnejte, jak působí, co číst na etiketě a jakou formu zvolit — s dobírkou po ČR.",
    categoryIntroHi: [
      "Hledáte přípravky na zvětšení penisu a chcete nejdřív pochopit, co v kategorii vůbec je? Na Recenze Ceny sestavujeme vitrínu lokálních gelů a krémů i vnitřních kapslí / doplňků stravy — podle toho, jak Češi tyto produkty reálně hledají: vedle sebe, s vysvětlením účinku a s jasnými limity očekávání.",
      "Podrobnosti níže: jak přípravky působí, čím se liší lokální péče od kapslí, srovnání metod včetně pumpy a extenderu — ve vlastní formulaci. Nejde o lék ani operaci. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice v neutrálním balení.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "co-najdete",
        heading: "Co najdete v kategorii přípravků na zvětšení penisu",
        body: [
          "E-shopové vitríny v ČR typicky míchají několik linií pod jedním záměrem „větší dojem / lepší plnost“. U nás je jádrem katalog přípravků: gel, krém a kapsle. Gel a krém se řeší lokálně; kapsle jako denní vnitřní režim. Assortment se rozšiřuje — stránka je psaná jako katalogová mapa forem, ne jako popisek dvou SKU.",
          "Vedle tub a blistrů muži často porovnávají i pumpu na zvětšení penisu nebo extender. Ty uvádíme ve srovnání metod jako kontext, ne jako povinnou položku košíku. Operace patří k lékaři — mimo e-shopovou kúru.",
        ].join("\n\n"),
        bullets: [
          "Gel a krém — lokální intimní péče",
          "Kapsle — vnitřní doplněk stravy",
          "Pumpa / extender — pomůcky v přehledu metod",
          "Diskrétní nákup: dobírka + neutrální balení",
        ],
      },
      {
        id: "jak-funguji",
        heading: "Jak fungují gely, krémy a kapsle na zvětšení penisu",
        body: [
          "U komerčních gelů a krémů je častý mechanismus lokální podpory prokrvení a komfortu: receptury opakují L-arginin, botanické extrakty nebo mentol, který může dát pocit tepla či chladu. Část přípravků zároveň lubrikuje — vždy ověřte, zda výrobce uvádí kompatibilitu s kondomem.",
          "Kapsle pracují jinak: užívají se dle schématu na obalu a cílí na podporu prokrvení, vitality nebo libida zevnitř. Individuální odezva se liší. Katalog popisuje realistický rámec (prokrvení, komfort, dočasný pocit plnosti), ne záruku trvalé změny rozměrů tkáně ani „+X cm jistě“.",
        ].join("\n\n"),
        bullets: [
          "Lokální péče = aplikace na pokožku dle návodu",
          "Kapsle = kúra s denní dávkou",
          "Marketingové centimetry ≠ závazek výrobku",
        ],
      },
      {
        id: "co-je-lokalni",
        heading: "Co je lokální péče a čím se liší od kapslí",
        body: [
          "Lokální péče znamená nanést gel nebo krém přímo na intimní partie podle etikety — často před stykem nebo v rámci pravidelného mazání. Výhoda je kontrola nad okamžikem a množstvím; nevýhoda může být citlivost na mentol či vonné látky.",
          "Kapsle nevyžadují mazání: hodí se, když chcete stabilní denní režim. Nejsou „silnější verzí gelu“ — jdou jinou cestou. Volbu dělejte podle životního stylu a návodu, ne podle toho, která reklama slibuje víc centimetrů.",
        ].join("\n\n"),
        bullets: [
          "Gel/krém — situativní nebo pravidelná lokální aplikace",
          "Kapsle — vnitřní režim bez mazání",
          "Obě linie: čtěte kontraindikace a délku používání",
        ],
      },
      {
        id: "vyber-formy",
        heading: "Jakou formu zvolit: gel, krém, nebo kapsle",
        body: [
          "Začněte scénářem. Chcete přípravek vázaný na konkrétní situaci → gel nebo krém. Chcete pravidelnost bez lokální aplikace → kapsle. Pak otevřete návod: frekvence, maximální délka, upozornění. U citlivé pokožky sledujte mentol; u kapslí interakce s léky na předpis.",
          "Do rozhodování patří i logistika: cena za den kúry (ne jen cena krabičky), diskrétní balení a platba na dobírku. Checklist výběru rozvíjí i samostatný průvodce — při zdravotních pochybnostech ale nejdřív lékař.",
        ].join("\n\n"),
        bullets: [
          "Scénář → forma → etiketa → očekávání",
          "Porovnejte ml / počet dávek, ne jen cenu",
          "Dobírka a neutrální zásilka po celé ČR",
        ],
      },
      {
        id: "srovnani-metod",
        heading: "Srovnání metod zvětšení penisu — přípravky i pomůcky",
        body: [
          "Silné informační stránky v topu ukazují tabulku: co dává smysl očekávat od gelu, kapslí, pumpy, extenderu a operace. Stejnou logiku používáme níže — vlastní text, bez kopírování konkurence. Přípravky z katalogu jsou neinvazivní volba; pomůcky vyžadují techniku; operace je lékařský zákrok.",
          "Vyberte řádek podle času a tolerance rizik, teprve potom produkt v mřížce. Bolest, poškození kůže nebo náhlé potíže s erekcí patří k lékaři, ne k další objednávce.",
        ].join("\n\n"),
        bullets: [
          "Přípravky: gel / krém / kapsle",
          "Pomůcky: pumpa, extender — jen dle návodu",
          "Operace: mimo e-shop, s odborníkem",
        ],
      },
      {
        id: "etiketa",
        heading: "Na co se dívat na etiketě (L-arginin a další složky)",
        body: [
          "V popisech gelů a krémů se opakují stimuly prokrvení (např. L-arginin), bylinné extrakty a mentol. U kapslí sledujte dávku, délku kúry a upozornění. Složka na etiketě vysvětluje záměr receptury — není důkazem konkrétního přírůstku v centimetrech.",
          "Prakticky: ověřte objem balení, doporučenou frekvenci a zda výrobek uvádí kompatibilitu s kondomem. Při první aplikaci lokálního přípravku stačí malé množství; při podráždění ihned vysaďte.",
        ].join("\n\n"),
        bullets: [
          "L-arginin / botanika — časté v lokálních i vnitřních formulích",
          "Mentol / aroma — riziko u citlivé pokožky",
          "Schéma kúry a objem — cena za den používání",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Přípravky jsou intimní kosmetická péče nebo doplněk stravy — nikoli lék a nikoli záruka trvalého zvětšení tkáně. Dodržujte dávkování, neaplikujte na porušenou kůži a při pálení, vyrážce či bolesti přerušte používání.",
          "Lékaře vyhledejte při úrazu, silném otoku, krvácení, náhlých potížích s erekcí, podezření na infekci nebo při rizikové kombinaci s léky na předpis. Domácí nákup nesmí oddálit vyšetření.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy přípravků — kdy kterou zvolit",
        headers: ["Forma", "Typický scénář", "Kontrolní body"],
        rows: [
          ["Gel", "Lokální použití, rychlá aplikace, často i lubrikace", "Báze, frekvence, kondom, mentol"],
          ["Krém", "Pravidelné mazání a hydratace", "Složení, snášenlivost, délka kúry"],
          ["Kapsle", "Denní vnitřní režim bez mazání", "Dávka, délka kúry, kontraindikace"],
        ],
      },
      {
        caption: "Metody zvětšení penisu — orientační srovnání",
        headers: ["Metoda", "Co lidé obvykle očekávají", "Poznámka"],
        rows: [
          ["Gel / krém", "Prokrvení, komfort, dočasný pocit plnosti", "Individuální odezva; čtěte návod"],
          ["Kapsle / doplněk", "Podpora zevnitř během kúry", "Doplněk stravy ≠ lék"],
          ["Pumpa", "Krátkodobý objem při správné technice", "Rizika dle návodu pomůcky"],
          ["Extender", "Dlouhodobý režim natahování", "Trpělivost; bolest = stop"],
          ["Operace", "Lékařský zákrok s rekonvalescencí", "Rozhodnutí s odborníkem, mimo katalog"],
        ],
      },
      {
        caption: "Etiketa — rychlá kontrola před nákupem",
        headers: ["Údaj", "Proč ho řešit", "Tip"],
        rows: [
          ["L-arginin / stimuly prokrvení", "Časté v lokálních i vnitřních formulích", "Srovnejte s cílem a snášenlivostí"],
          ["Bylinné extrakty", "Podpora vitality dle receptury", "Nejsou zárukou konkrétních cm"],
          ["Mentol / aroma", "Pocit teploty; riziko podráždění", "Citlivá pokožka = malý test"],
          ["Objem / počet dávek", "Cena za den používání", "Počítejte kúru, ne jen cenu krabičky"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Zvětšení penisu", path: `${GUIDE_PATH}/penis-enlargement` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Potence a libido", path: "/potence" },
    ],
    categoryFaqHi: [
      {
        q: "Jaké přípravky na zvětšení penisu katalog pokrývá?",
        a: "Hlavně gely, krémy a kapsle / doplňky stravy. Pumpu a extender uvádíme ve srovnání metod jako související možnosti s jiným režimem. Operace je lékařské rozhodnutí mimo e-shop.",
      },
      {
        q: "Jak funguje gel nebo krém oproti kapslím?",
        a: "Gel a krém působí lokálně — často přes prokrvení a komfort při aplikaci dle návodu. Kapsle se užívají vnitřně v rámci kúry. Nejde o stejný mechanismus „jen v jiné formě“.",
      },
      {
        q: "Co je realistické očekávat?",
        a: "Podporu prokrvení, komfortu a případně dočasného pocitu plnosti podle přípravku a jednotlivce. Neslibujeme trvalou změnu rozměrů tkáně ani chirurgický výsledek z tuby.",
      },
      {
        q: "Jak dlouho přípravky používat?",
        a: "Podle schématu na obalu konkrétního výrobku. Při podráždění, bolesti nebo jiných potížích přerušte používání a konzultujte lékaře či lékárníka.",
      },
      {
        q: "Je zásilka diskrétní? Mohu platit na dobírku?",
        a: "Ano — neutrální balení a platba na dobírku po celé České republice. Expresní kurýr obvykle doručí do 2–5 pracovních dnů.",
      },
      {
        q: "Na co si dát pozor u citlivé pokožky?",
        a: "Mentol, alkohol a vonné složky. Začněte malým množstvím dle návodu. Při pálení, vyrážce nebo otoku přípravek vysaďte.",
      },
      {
        q: "Kdy k lékaři místo další objednávky?",
        a: "Při bolesti, úrazu, silném podráždění, krvácení, náhlých potížích s erekcí nebo při rizikových lécích na předpis.",
      },
    ],
    keywordsHi: [
      "přípravky na zvětšení penisu",
      "zvětšení penisu",
      "gel na zvětšení penisu",
      "krém na zvětšení penisu",
      "kapsle na zvětšení penisu",
      "prokrvení penisu",
      "pumpa na zvětšení penisu",
      "L-arginin",
      "platba na dobírku",
      "diskrétní balení",
      "doručení Česká republika",
    ],
  },

  "zvetseni-prsou": pack({
    slug: "zvetseni-prsou",
    name: "Zvětšení prsou",
    intro:
      "Hledáte doplňky stravy na zvětšení prsou? Přípravky pro dospělé ženy s realistickými očekáváními — ne náhrada plastické chirurgie. Dobírka po ČR.",
    who: "Dospělé ženy. Těhotenství, kojení nebo onemocnění prsu = lékař.",
    choose: "Sledujte složení a upozornění; bez záruky změny velikosti.",
    chooseBullets: ["Složení", "Délka kúry", "Bezpečnost"],
    formsBody: "Kapsle/gely dle produktu. Není implantát.",
    safety: "Při bolesti nebo změnách v prsu navštivte lékaře.",
    faq: [
      { q: "Nahradí operaci?", a: "Ne — jde o doplněk/kosmetickou péči s individuálním efektem." },
      { q: "Vhodné při kojení?", a: "Bez konzultace lékaře ne." },
    ],
    formRows: DEFAULT_FORM_ROWS,
    related: { label: "Kategorie: Zdraví žen", path: "/zdravi-zen" },
  }),

  /** Rich hub (SERP-led papilomy/bradavice): methods + locations + safety — not thin pack(). */
  papilomy: {
    taglineHi:
      "Lokální gely a roztoky na papilomy a bradavice — s jasným checklistem, kdy raději k dermatologovi",
    shortDescHi:
      "Přípravky na papilomy a gel na bradavice: porovnejte lokální péči podle místa aplikace a návodu, s dobírkou a doručením po celé České republice.",
    categoryIntroHi: [
      "Hledáte přípravky na papilomy nebo gel na bradavice pro šetrnou domácí péči? V kategorii Papilomy na Recenze Ceny srovnáte lokální gely a roztoky určené k péči o drobné kožní výrůstky — vždy podle návodu výrobce, ne jako diagnózu ani náhradu dermatologického vyšetření.",
      "Papilomy a bradavice často překážejí esteticky nebo při tření oblečením a šperky. Katalog pomáhá zvolit formu a pochopit rozdíl mezi domácí lokální péčí a odborným odstraněním. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Papilomy“",
        body: [
          "Katalog ocení dospělí, kteří řeší drobné, dlouhodobě neměnné kožní výrůstky — typicky v oblasti krku, podpaží nebo kožních záhybů — a chtějí porovnat lokální přípravky na papilomy či gel na bradavice s realistickými očekáváními. Dává smysl jako podpora péče o vzhled pokožky tam, kde výrobce přípravek určuje, ne jako samoléčba nejasné léze.",
          "Krvácení, rychlý růst, změna barvy nebo tvaru, bolest, svědění s hnisáním, výrůstky na obličeji či sliznicích a nejistota, o co jde, patří nejdřív k dermatologovi. Stejně tak děti, těhotenství a imunosuprese — před domácí aplikací konzultujte odborníka.",
        ].join("\n\n"),
        bullets: [
          "Drobné výrůstky na krku, v podpaží nebo záhybech",
          "Zájem o gel na papilomy / lokální péči online s dobírkou",
          "Ne jako náhrada vyšetření podezřelé nebo měnící se léze",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat přípravky na papilomy",
        body: [
          "Nejdřív zvažte lokalitu: krk a podpaží se v praxi řeší jinak než obličej nebo sliznice. Pak zvolte formu — gel, roztok nebo jiný lokální prostředek dle etikety — a přečtěte frekvenci, délku kúry a upozornění. Chraňte okolní zdravou kůži (např. mastným krémem), pokud to návod doporučuje, a nepřekračujte schéma výrobce.",
          "Počítejte s tím, že výsledek je individuální a že katalog nenahrazuje diagnózu. Při pochybnostech je bezpečnější krátká konzultace u dermatologa než agresivní domácí pokusy.",
        ].join("\n\n"),
        bullets: [
          "Lokalita: krk / podpaží / tělo vs. obličej a sliznice",
          "Forma: gel nebo roztok — dle určení na obalu",
          "Návod: frekvence, délka aplikace, kontraindikace",
          "Ochrana okolní kůže a hygiena rukou po aplikaci",
          "Red flags → lékař dřív než další balení",
        ],
      },
      {
        id: "rozliseni",
        heading: "Papilom, bradavice, nebo měkký fibrom?",
        body: [
          "Laicky se „papilom“, „bradavice“ a „měkký fibrom“ (často stopkatý výrůstek v záhybech) často zaměňují. Bradavice bývají spjaté s HPV a mohou být drsnější; papilomy a měkké fibromy na krku či v podpaží působí spíš jako jemné výrůstky na stopce. Přesné odlišení patří lékaři — katalog slouží k výběru lokální péče, ne k stanovení diagnózy.",
          "Genitální a slizniční útvary, ploché změny v obličeji a jakékoli atypické léze řešte odborně. Domácí přípravky na bradavice z lékárenské edukace (keratolyty, kryoterapie) mají jiný profil rizik než kosmetický gel — vždy čtěte určení konkrétního produktu.",
        ].join("\n\n"),
        bullets: [
          "Nejasný útvar = nejdřív vyšetření, ne experiment",
          "Obličej a sliznice: bez určení výrobce neaplikujte",
          "Cíl katalogu: porovnat lokální péči, ne nahradit dermatologa",
        ],
      },
      {
        id: "metody",
        heading: "Jaké možnosti péče o papilomy a bradavice existují?",
        body: [
          "Domácí lokální péče obvykle znamená gel nebo roztok nanášený přímo na útvar dle návodu. V lékárenské nabídce se dále objevují keratolytické roztoky (např. s kyselinami) a přípravky na bázi domácí kryoterapie — vhodné jen tam, kam je výrobce určuje, a často spíš u klasických bradavic než u každého „výrůstku“.",
          "Odborné metody (laser, elektrokoagulace, kryodestrukce v ambulanci) volí dermatolog podle typu a místa léze. Katalog Recenze Ceny se soustředí na lokální přípravky s doručením na dobírku; tabulka níže pomáhá rychle srovnat, kdy dává smysl gel a kdy raději ordinace.",
        ].join("\n\n"),
        bullets: [
          "Gel / roztok — cílená lokální aplikace dle etikety",
          "Keratolytika / kryo — jen podle určení přípravku",
          "Lékař — podezřelé, obličejové, slizniční nebo mnohočetné léze",
        ],
      },
      {
        id: "lokalita",
        heading: "Papilomy na krku, v podpaží a jinde na těle",
        body: [
          "Papilomy na krku a v podpaží patří k nejčastějším důvodům hledání gelu na papilomy — výrůstky se třou o límec, řetízek nebo oblečení. U drobných, neměnných útvarů někteří dospělí volí lokální péči dle návodu; při nejistotě je bezpečnější dermatologické posouzení.",
          "Obličej, oční okolí, genitálie a sliznice vyžadují odborný přístup. Nepokoušejte se útvary stříhat, vázat nití ani „vypalovat“ domácími prostředky — riziko infekce, jizvy a chybné diagnózy je vysoké.",
        ].join("\n\n"),
        bullets: [
          "Krk a podpaží — častá lokalita; sledujte změny",
          "Obličej / sliznice — k lékaři, ne agresivní samoléčba",
          "Zákaz stříhání, vázání a domácího „řezání“",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Lokální přípravky na papilomy a bradavice jsou určené k péči o pokožku dle návodu výrobce — nejsou lékem na HPV ani zárukou „odstranění za pár dní“. Nepřekračujte dávkování, neaplikujte na porušenou kůži, znaménka ani místa mimo určení přípravku.",
          "K dermatologovi jděte při krvácení, růstu, změně barvy, bolesti, hnisání, výrůstcích u dětí, v těhotenství, na obličeji či sliznicích, nebo když nevíte, o jaký útvar jde. Domácí péče nesmí oddálit vyšetření podezřelé léze.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy a přístupy — rychlé srovnání",
        headers: ["Přístup", "Kdy dává smysl", "Na co se dívat"],
        rows: [
          ["Gel / lokální roztok", "Drobné útvary dle určení výrobce", "Frekvence, oblast, ochrana okolní kůže"],
          ["Keratolytický roztok (edukace)", "Spíš klasické bradavice dle přípravku", "Kyseliny, doba působení, kontraindikace"],
          ["Domácí kryoterapie (edukace)", "Jen produkty k tomu určené", "Vhodnost lokality, návod, bolestivost"],
          ["Dermatolog (laser / elektro / kryo)", "Nejasné, měnící se, obličej, sliznice", "Diagnóza, jizva, péče po zákroku"],
        ],
      },
      {
        caption: "Papilom, bradavice, měkký fibrom — orientační přehled",
        headers: ["Útvar (laicky)", "Typický dojem", "Doporučení"],
        rows: [
          ["Bradavice", "Drsnější, často na rukou/nohou", "Lokální péče dle přípravku nebo lékař"],
          ["Papilom / stopkatý výrůstek", "Měkký, krk / záhyby", "Při nejistotě dermatolog; gel jen dle návodu"],
          ["Měkký fibrom", "Stopka v podpaží / krku", "Ne stříhat doma — odborné odstranění při potřebě"],
          ["Atypická léze", "Růst, barva, krvácení", "Vždy lékař — ne katalogová samoléčba"],
        ],
      },
      {
        caption: "Lokalita × doporučení",
        headers: ["Místo", "Domácí lokální péče", "Raději lékař"],
        rows: [
          ["Krk", "Jen drobné neměnné útvary dle návodu", "Změna, bolest, nejistota diagnózy"],
          ["Podpaží / záhyby", "Opatrně dle etikety; hygiena", "Zánět, tření s hnisáním, mnohočetnost"],
          ["Obličej / oční okolí", "Obvykle ne — riziko jizvy", "Ano — odborné posouzení"],
          ["Sliznice / genitálie", "Ne bez lékařského určení", "Ano — vždy odborně"],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Papilomy", path: `${GUIDE_PATH}/papillomas` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Plíseň nehtů", path: "/plisen-nehtu" },
      { label: "Kategorie: Anti-aging", path: "/anti-aging" },
    ],
    categoryFaqHi: [
      {
        q: "Lze odstranit papilomy bez lékaře?",
        a: "U drobných, dlouhodobě neměnných útvarů někteří dospělí volí lokální přípravky dle návodu výrobce. Podezřelé, měnící se, obličejové nebo slizniční léze patří k dermatologovi — katalog nenahrazuje diagnózu. Nikdy útvary nestříhejte ani nevazte nití.",
      },
      {
        q: "Jak dlouho aplikovat gel na papilomy nebo bradavice?",
        a: "Řiďte se schématem na obalu konkrétního přípravku (frekvence a maximální délka kúry). Pokud se útvar nemění, zhoršuje se, nebo se objeví podráždění, aplikaci přerušte a konzultujte lékaře či lékárníka.",
      },
      {
        q: "Je gel na bradavice vhodný i na papilomy na krku?",
        a: "Záleží na určení výrobce. Některé lokální přípravky cílí na drobné výrůstky v oblasti krku a podpaží, jiné na klasické bradavice. Vždy čtěte lokalitu a kontraindikace na etiketě; při nejistotě nejdřív dermatolog.",
      },
      {
        q: "Mohu přípravek použít na obličej?",
        a: "Bez výslovného určení výrobce na obličej a oční okolí ne. Riziko poleptání, jizvy a chybné péče je vyšší — obličejové útvary raději posuďte u dermatologa.",
      },
      {
        q: "Gel, keratolytický roztok, nebo rovnou lékař?",
        a: "Gel či roztok z katalogu volte při drobných útvarech dle návodu. Keratolytika a domácí kryoterapie mají smysl jen u přípravků k tomu určených. Růst, změna barvy, bolest, obličej a sliznice = lékařská péče.",
      },
      {
        q: "Proč se nedoporučuje stříhat papilomy doma?",
        a: "Domácí stříhání a vázání zvyšuje riziko krvácení, infekce, jizvy a rozšíření virových bradavic. Bezpečnější je odborné odstranění nebo lokální péče výhradně dle návodu schváleného přípravku.",
      },
      {
        q: "Jsou přípravky na papilomy lékem na HPV?",
        a: "Ne. Lokální gely a roztoky v této kategorii slouží k péči o pokožku dle výrobce — neléčí systémovou HPV infekci a nenahrazují odbornou dermatologickou péči.",
      },
      // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    ],
    keywordsHi: [
      "přípravky na papilomy",
      "gel na papilomy",
      "gel na bradavice",
      "přípravky na bradavice",
      "odstranění papilomů doma",
      "papilomy na krku",
      "papilomy v podpaží",
      "kožní výrůstky",
      "vlaštovičník na bradavice",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },

  "anti-aging": {
    taglineHi:
      "Anti-aging krémy i vzdělávání ke kolagenu a kyselině hyaluronové — bez slibů věčného mládí",
    shortDescHi:
      "Doplňky stravy anti-aging a krémy proti stárnutí: porovnejte lokální péči a podporu zevnitř, s dobírkou po České republice.",
    categoryIntroHi:
      "Hledáte doplňky stravy anti-aging s realistickými očekáváními — ne zázrak věčného mládí? V kategorii Anti-aging srovnáte především anti-aging krémy a přípravky proti stárnutí pleti a zároveň najdete praktický přehled, jak funguje krása zevnitř (kolagen na pleť, kyselina hyaluronová, vitamin C). V naší nabídce převažuje lokální péče; vnitřní doplňky stravy proti stárnutí zde popisujeme kvůli informovanému výběru, ne jako slib zázračného omlazení. Jde o doplňky stravy nebo topické přípravky, nikoli o lék, filler ani estetický zákrok. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je anti-aging péče vhodná",
        body: "Katalog míří na dospělé, kteří chtějí podpořit hydrataci, pružnost a celkový vzhled pleti jako součást každodenního režimu — ne jako náhradu dermatologa. Dává smysl preventivní péči od třicítky i cílenější péči o zralou pleť. Akutní vyrážka, infekce kůže, nevysvětlitelné pigmentové změny nebo bolestivé léze patří k lékaři dřív než kúra krémem.",
        bullets: [
          "Ženy i muži 30+: prevence suchosti a jemných linek",
          "Zralá pleť 40+/50+: důraz na hydrataci, SPF a konzistentní rutinu",
          "Kdo chce pochopit rozdíl mezi krémem a kolagenem zevnitř",
          "Ne jako náhrada vyšetření při akutním kožním onemocnění",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat doplňky stravy anti-aging",
        body: "Nejdřív si ujasněte cíl: hydratace a komfort pleti, podpora vzhledu jemných linek, nebo celková vitalita „krása zevnitř“. Pak zvolte formu — v našem katalogu často anti-aging krém — a čtěte složení i návod, ne jen marketingový název. U vnitřních přípravků na trhu sledujte dávku kolagenu a délku kúry; u krémů frekvenci nanášení a snášenlivost. Denní SPF a spánek často ovlivní výsledek víc než výměna jedné značky za druhou.",
        bullets: [
          "Cíl: hydratace / jemné linky / podpora vitality zevnitř",
          "Forma: lokální krém vs. kapsle nebo kolagenový drink",
          "Složení a dávka na etiketě — ne jen seznam buzzwordů",
          "SPF a režim patří do checklistu stejně jako samotný přípravek",
        ],
      },
      {
        id: "vnitrni-vs-lokalni",
        heading: "Vnitřní podpora vs. lokální anti-aging krém",
        body: "Lokální anti-aging krém nebo krém proti vráskám působí tam, kam ho nanesete — hydratace, ochrana bariéry, pocit pevnější pleti podle složení. Vnitřní doplňky (hydrolyzovaný kolagen, kyselina hyaluronová, antioxidanty) cílí na systémovou podporu v rámci stravy; změny se hodnotí spíš po týdnech. V naší kategorii převažují topické přípravky: tabulky níže pomáhají pochopit, kdy dává smysl krém, kdy vzdělání o kolagenu na pleť — a že ideální rutina často kombinuje SPF, lokální péči a zdravý režim.",
        bullets: [
          "Krém = cílená lokální péče podle návodu",
          "Kapsle / drink = dlouhodobější vnitřní podpora dle etikety",
          "Kombinace dává smysl; samotný přípravek bez SPF a spánku nestačí",
        ],
      },
      {
        id: "slozky",
        heading: "Časté složky: kolagen, kyselina hyaluronová, vitamin C a Q10",
        body: "Na českém trhu se u péče anti-aging a krásy zevnitř opakují stejné stavební kameny. Hydrolyzovaný kolagen (často typy I a III) se v literatuře a na etiketách objevuje v orientačním pásmu cca 2,5–10 g denně — vždy platí dávkování konkrétního výrobku. Kyselina hyaluronová se pojí s hydratací pojivové tkáně; vitamin C přispívá k normální tvorbě kolagenu. Koenzym Q10 a další antioxidanty se uvádějí v kontextu ochrany buněk před oxidačním stresem. Čtěte miligramy na denní dávku; seznam názvů na přední straně nestačí.",
        bullets: [
          "Hydrolyzovaný kolagen — sledujte g na den a typ (I/III)",
          "Kyselina hyaluronová — hydratace; dávka dle etikety",
          "Vitamin C — povolené tvrzení o tvorbě kolagenu",
          "Q10 / antioxidanty — doplněk režimu, ne zázračný elixír",
        ],
      },
      {
        id: "co-ocekavat",
        heading: "Co očekávat od kúry",
        body: "U lokálních krémů může být pocit hydratace a hebkosti rychlejší (dny až týdny) při pravidelném nanášení. U vnitřního kolagenu a komplexů proti stárnutí se subjektivní změny pleti často hodnotí až po několika týdnech až měsících pravidelného užívání. Po kúře zhodnoťte vzhled pleti, snášenlivost a to, jestli držíte SPF a pitný režim — bez toho je srovnání značek málo vypovídající.",
        bullets: [
          "Týdny 1–2: návyk na rutinu, často hlavně hydratace u krémů",
          "Týdny 3–8: častější horizont hodnocení u vnitřní podpory",
          "Po 2–3 měsících: rozhodnutí o pokračování nebo změně přístupu",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: "Doplňky stravy anti-aging a topické přípravky nejsou léky na kožní choroby, filler ani zákrok. Nepřekračujte dávkování na obalu. Při alergii, zarudnutí nebo pálení krém vysaďte. Těhotné, kojící a osoby s chronickým onemocněním nebo léky na předpis konzultují užívání předem. Náhlý otok, hnisání, rychle se šířící vyrážka nebo podezření na melanom patří k lékaři — ne do samoobslužné kúry.",
      },
    ],
    hubTables: [
      {
        caption: "Formy anti-aging péče — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Anti-aging krém / gel",
            "Lokální hydratace a každodenní péče o pleť",
            "Frekvence, citlivost kůže, složení, SPF v rutině",
          ],
          [
            "Kapsle / tablety",
            "Denní vnitřní podpora (kolagen, HA, antioxidanty)",
            "Dávka na den, délka kúry, alergie",
          ],
          [
            "Drink / prášek",
            "Vyšší dávka kolagenu, pohodlné míchání",
            "g kolagenu na odměrku, chuť, cena za den",
          ],
        ],
      },
      {
        caption: "Účinné látky — orientační dávky (vždy dle etikety)",
        headers: ["Látka", "Orientační denní dávka", "Tip při výběru"],
        rows: [
          [
            "Hydrolyzovaný kolagen",
            "cca 2,5–10 g",
            "Kolagen na pleť — typ I/III a vstřebatelnost",
          ],
          [
            "Kyselina hyaluronová",
            "dle etikety (často desítky–stovky mg)",
            "Hydratace — doplněk, ne injekční výplň",
          ],
          [
            "Vitamin C",
            "dle RHP na etiketě",
            "Přispívá k normální tvorbě kolagenu",
          ],
          [
            "Koenzym Q10 / antioxidanty",
            "dle etikety",
            "Součást komplexů — ne zaručený anti-age efekt",
          ],
        ],
      },
      {
        caption: "Cíl uživatele × doporučená forma",
        headers: ["Cíl", "Doporučená forma", "Proč"],
        rows: [
          [
            "Hydratace a komfort pleti",
            "Anti-aging krém + SPF",
            "Lokální účinek tam, kam pečujete",
          ],
          [
            "Podpora krásy zevnitř",
            "Kolagen / HA kapsle nebo drink",
            "Dlouhodobější kúra dle etikety",
          ],
          [
            "Jemné linky a zralá pleť",
            "Krém ± vnitřní podpora",
            "Kombinace režimu, ne jeden zázračný produkt",
          ],
          [
            "Citlivost na polykání tablet",
            "Krém nebo práškový drink",
            "Snazší rutina bez velkých tablet",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Anti-aging", path: "/pruvodce/anti-aging" },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Péče o vlasy", path: "/vypadavani-vlasu" },
    ],
    categoryFaqHi: [
      {
        q: "Jak rychle uvidím změnu u anti-aging péče?",
        a: "U krémů bývá pocit hydratace často dříve (dny až týdny). U vnitřního kolagenu a komplexů se změny pleti obvykle hodnotí až po několika týdnech až měsících pravidelného užívání dle etikety. Výsledek je individuální a závisí i na SPF, spánku a kouření.",
      },
      {
        q: "Stačí anti-aging krém bez SPF a režimu?",
        a: "Samotný krém proti stárnutí nestačí, pokud chybí ochrana před UV a základní režim. Denní SPF, hydratace a spánek často ovlivní vzhled pleti víc než výměna jednoho přípravku. Krém doplňuje rutinu — nenahrazuje ji.",
      },
      {
        q: "Je lepší kolagen zevnitř, nebo lokální krém?",
        a: "Plní jiné role. Anti-aging krém pečuje lokálně. Kolagen na pleť a kyselina hyaluronová v doplňku stravy cílí na dlouhodobější vnitřní podporu. Mnoho lidí kombinuje obojí; v našem katalogu převažují topické přípravky — vybírejte podle cíle a etikety.",
      },
      {
        q: "Jak dlouho užívat doplňky stravy proti stárnutí?",
        a: "Výrobci často doporučují kúru v řádu týdnů až přibližně 2–3 měsíců podle schématu na obalu. Po cyklu zhodnoťte snášenlivost a efekt. Dlouhodobé užívání bez přestávky konzultujte s lékařem nebo lékárníkem, zejména při chronických onemocněních.",
      },
      {
        q: "Jsou doplňky stravy anti-aging totéž co lék nebo filler?",
        a: "Ne. Jde o doplňky stravy nebo kosmetické / topické přípravky. Nejsou schválenou léčbou kožních chorob ani náhradou estetických zákroků. Neslibují věčné mládí ani zaručené vyhlazení vrásek.",
      },
      {
        q: "Kdy místo krému rovnou k dermatologovi?",
        a: "Při akutní vyrážce, infekci, rychle se měnících pigmentacích, bolestivých lézích nebo podezření na závažné kožní onemocnění vyhledejte lékaře. Doplněk ani krém diagnózu nenahrazují.",
      },
      {
        q: "Musím platit předem?",
        a: "Ne. Platíte při převzetí balíčku kdekoli v České republice. Žádné platby předem ani skryté poplatky.",
      },
      {
        q: "Jak dlouho trvá doručení?",
        a: "Obvykle 2–5 pracovních dnů kurýrem po České republice. Sledovací kód vám zašleme SMS po odeslání.",
      },
      {
        q: "Je produkt originální?",
        a: "Ano, spolupracujeme s oficiálními dodavateli. Na balení je číslo šarže a datum spotřeby.",
      },
    ],
    keywordsHi: [
      "doplňky stravy anti-aging",
      "doplňky stravy proti stárnutí",
      "anti-aging krém",
      "krém proti stárnutí",
      "krém proti vráskám",
      "kolagen na pleť",
      "kyselina hyaluronová",
      "hydrolyzovaný kolagen",
      "krása zevnitř",
      "koenzym Q10",
      "platba na dobírku",
      "doručení v České republice",
    ],
  },

  "jatra": pack({
    slug: "jatra",
    name: "Zdraví jater",
    intro:
      "Hledáte doplňky stravy na játra? Podpora při zátěži jídelníčku — ne náhrada hepatologa. Dobírka po ČR.",
    who: "Dospělí pečující o játra. Žloutenka, silná bolest, tmavá moč = lékař.",
    choose: "Sledujte složení (např. ostropestřec) a délku kúry; alkohol snižujte.",
    chooseBullets: ["Složení", "Alkohol a režim", "Kdy k lékaři"],
    formsBody: "Kapsle. Doplněk není léčba hepatitidy.",
    safety: "Nenahrazuje vyšetření jaterních testů ani léčbu.",
    faq: [
      { q: "Mohu pít alkohol během kúry?", a: "Alkohol játra zatěžuje — omezte; ptejte se lékaře." },
      { q: "Jak dlouho užívat?", a: "Dle návodu; při příznacích nejdřív vyšetření." },
    ],
    formRows: DEFAULT_FORM_ROWS,
    related: { label: "Kategorie: Detoxikace", path: "/detox" },
  }),

  "ledviny": pack({
    slug: "ledviny",
    name: "Ledviny",
    intro:
      "Hledáte doplňky stravy na ledviny? Podpora močových cest — akutní bolest a horečka patří k lékaři. Dobírka po ČR.",
    who: "Dospělí pečující o ledviny a pitný režim. Kolika, krev v moči = lékař.",
    choose: "Hydratace + složení; nerozlišujte „očistu“ a léčbu infekce.",
    chooseBullets: ["Pitný režim", "Složení", "Kdy k lékaři"],
    formsBody: "Kapsle. Doplněk není antibiotikum ani dialýza.",
    safety: "Nenahrazuje nefrologickou péči.",
    faq: [
      { q: "Pomáhá při zánětu?", a: "Akutní zánět řeší lékař; doplněk je nanejvýš podpora." },
      { q: "Jak dlouho užívat?", a: "Dle návodu a doporučení odborníka." },
    ],
    formRows: DEFAULT_FORM_ROWS,
    related: { label: "Kategorie: Cystitida", path: "/cystitida" },
  }),

  "dychaci-cesty": pack({
    slug: "dychaci-cesty",
    name: "Dýchací cesty",
    intro:
      "Hledáte doplňky stravy na dýchací cesty? Čaje a doplňky pro komfort dýchání — dušnost a horečka = lékař. Dobírka po ČR.",
    who: "Dospělí s sezónním diskomfortem dýchacích cest. Tíseň na hrudi = neodkládejte pomoc.",
    choose: "Čaj vs. kapsle; sledujte složení a upozornění.",
    chooseBullets: ["Forma", "Složení", "Kdy k lékaři"],
    formsBody: "Čaje, kapsle. Doplněk není inhalátor na předpis.",
    safety: "Při dušnosti, vysoké horečce nebo bolesti na hrudi vyhledejte pomoc.",
    faq: [
      { q: "Stačí čaj místo lékaře?", a: "Ne při těžkých příznacích — doplněk je jen podpora." },
      { q: "Jak dlouho užívat?", a: "Dle návodu; při zhoršení dříve k lékaři." },
    ],
    formRows: [
      ["Čaj / bylinná směs", "Pitný režim a komfort", "Frekvence"],
      ["Kapsle", "Denní podpora", "Dávka, kúra"],
    ],
    related: { label: "Kategorie: Imunita", path: "/imunita" },
  }),

  imunita: pack({
    slug: "imunita",
    name: "Imunita",
    intro:
      "Hledáte doplňky stravy na imunitu? Sezónní podpora obranyschopnosti — ne náhrada vakcinace ani léčby infekce. Dobírka po ČR.",
    who: "Dospělí v sezóně nachlazení. Vysoká horečka nebo dušnost = lékař.",
    choose: "Vitaminy/minerály vs. bylinné formule; dávka a délka.",
    chooseBullets: ["Složení", "Dávka", "Sezónní režim"],
    formsBody: "Kapsle a další formy. Doplněk není antibiotikum.",
    safety: "Nenahrazuje lékařskou péči při infekci.",
    faq: [
      { q: "Lze užívat dlouhodobě?", a: "Některé ano v doporučené dávce — čtěte návod." },
      { q: "Pomáhá při horečce?", a: "Horečku řešte dle stavu; při zhoršení k lékaři." },
    ],
    formRows: DEFAULT_FORM_ROWS,
    related: { label: "Kategorie: Dýchací cesty", path: "/dychaci-cesty" },
  }),

  /**
   * Fresh hub from CZ SERP (123medik form cards + TOC, Cenový radar buying
   * criteria, iSpanek/Natima tip lists + apnoe red flags, pharmacy compliance) —
   * NOT a rewrite of prior thin pack / other site hubs.
   * Prompt: scripts/sleep-snoring-hub-seo-prompt.cs.md
   */
  "chrapani": {
    serpLedHub: true,
    taglineHi:
      "Sprej, kapky, náplast i kapsle — mapa forem proti chrápání a tipy pro klidnější noc",
    shortDescHi:
      "Přípravky proti chrápání: srovnání spreje, kapek, náplastí a kapslí na spánek. Realistická očekávání, režimové tipy, dobírka po ČR.",
    categoryIntroHi: [
      "Hledáte přípravky proti chrápání, které dávají smysl ještě před návštěvou spánkové ambulance? V kategorii Spánek a chrápání na Recenze Ceny porovnáte volně prodejné větve podle cíle: zmírnit hlasitost, podpořit dýchání nosem, nebo doplnit režim kapslemi na spánek.",
      "Chrápání trápí velkou část dospělých a často ruší i partnera. Katalog pomáhá zvolit formu (sprej, kapky, náplast, kapsle), přečíst etiketu a nastavit realistická očekávání — bez slibů „zázračné tiché noci“. Objednejte online s platbou na dobírku; expresní kurýr obvykle doručí do 2–5 pracovních dnů po celé České republice.",
    ].join("\n\n"),
    categorySectionsHi: [
      {
        id: "pro-koho",
        heading: "Pro koho je kategorie „Spánek a chrápání“",
        body: [
          "Katalog ocení dospělí, které budí vlastní chrápání, partnerovo chrápání, nebo obojí. Dává smysl i lidem, kteří chtějí nejdřív vyzkoušet režim a volně prodejný přípravek, než řeší specializované vyšetření.",
          "Pokud partner popisuje pauzy v dýchání, lapání po dechu, ranní bolesti hlavy a silnou denní spavost, e-shop není první krok — patří sem spánková ambulance nebo ORL. Totéž platí u dětí a při náhlém zhoršení po nemoci.",
        ].join("\n\n"),
        bullets: [
          "Dospělí s občasnými nebo pravidelnými projevy chrápání",
          "Partneři, které noční hluk připravuje o spánek",
          "Zájem o sprej, kapky, náplast nebo kapsle online s dobírkou",
          "Podezření na apnoe — nejdřív odborné vyšetření",
        ],
      },
      {
        id: "proc-chrapeme",
        heading: "Proč chrápeme: krátký mechanismus bez medicínského žargonu",
        body: [
          "Zvuk chrápání vzniká, když vzduch prochází částečně zúženými horními cestami dýchacími a rozkmitá měkké tkáně — typicky měkké patro, kořen jazyka nebo stěny hltanu. Zúžení podporuje spánek na zádech, ucpaný nos (pak se dýchá ústy), alkohol a sedativa před spaním, nadváha v oblasti krku i suchý vzduch v ložnici.",
          "Proto jeden produkt „nepasuje všem“. Sprej míří na sliznici v ústech/krku, náplast na průchodnost nosu, kapsle spíš na režim usínání — a žádná z těchto větví nenahrazuje léčbu spánkové apnoe.",
        ].join("\n\n"),
        bullets: [
          "Vibrace měkkých tkání při zúženém proudění vzduchu",
          "Nos vs. ústa — jiná příčina, jiná pomůcka",
          "Poloha, alkohol, váha a suchý vzduch často zhoršují projev",
        ],
      },
      {
        id: "mapa-forem",
        heading: "Mapa forem: sprej, kapky, náplast a kapsle",
        body: [
          "Sprej proti chrápání se obvykle aplikuje před spaním do oblasti kořene jazyka nebo krku — výrobci cílí na zvlhčení a „film“ na sliznici, který může snížit vibrace. Sledujte chuť, počet střiků a objem balení (často řádově desítky ml).",
          "Kapky proti chrápání bývají inhalační nebo k aplikaci na kapesník/polštář — hodí se, když preferujete aromaterapeutický přístup dle návodu. Náplast proti chrápání jemně rozevírá nosní křídla a dává smysl hlavně při dýchání ústy kvůli nosu. Kapsle na spánek jsou doplněk stravy pro vnitřní podporu usínání a režimu — ne náhrada spreje na hrdlo ani CPAP.",
        ].join("\n\n"),
        bullets: [
          "Sprej → lokální aplikace do úst/krku před spaním",
          "Kapky → inhalace / polštář dle etikety",
          "Náplast → mechanická podpora nosního dýchání",
          "Kapsle → doplněk stravy na spánkový režim",
        ],
      },
      {
        id: "jak-vybrat",
        heading: "Jak vybrat přípravky proti chrápání",
        body: [
          "Nejdřív pojmenujte cíl: snížit hlasitost chrápání, zprůchodnit nos, nebo podpořit usínání? Pak zvolte větev formy a teprve potom konkrétní etiketu — frekvenci, kontraindikace, chuť/vůni a cenu za cyklus, ne jen cenu jednoho balení.",
          "Účinek je individuální a často částečný. Počítejte s krátkým zkušebním obdobím dle návodu a současně upravte režim (bok, alkohol, nosní hygiena). Preferujte srozumitelné složení před marketingovými sliby „okamžitého ticha“.",
        ].join("\n\n"),
        bullets: [
          "Cíl: hlasitost / nos / usínání",
          "Forma: sprej · kapky · náplast · kapsle",
          "Etiketa: dávkování, upozornění, alergie",
          "Chuť, vůně a snášenlivost (u lokálních forem)",
          "Cena cyklu + realistická očekávání",
          "Při zástavách dechu — lékař dřív než další balení",
        ],
      },
      {
        id: "tipy-rezim",
        heading: "7 tipů k režimu: co často pomáhá vedle přípravku",
        body: [
          "Volně prodejný přípravek bez úpravy spánkových návyků obvykle přinese menší úlevu. Níže je praktický checklist, který se v českých průvodcích opakuje nejčastěji — můžete ho zavést hned, nezávisle na tom, kterou formu z katalogu zvolíte.",
          "Cílem není „perfektní životní styl přes noc“, ale několik konkrétních změn, které snižují zúžení dýchacích cest a vibrace tkání.",
        ].join("\n\n"),
        bullets: [
          "Spěte spíš na boku než na zádech (polštář za záda pomáhá udržet polohu)",
          "Omezte alkohol a sedativa aspoň 3–4 hodiny před spaním",
          "Snižujte kouření — dráždí sliznice a zhoršuje průchodnost",
          "Čistěte nos (mořská voda, výplach) při rýmě a alergiích",
          "Při nadváze pomáhá i postupné hubnutí v oblasti krku",
          "Zvlhčujte vzduch v ložnici a větrejte před spaním",
          "Zvažte mírné vyvýšení horní části lůžka (klín / polohovací rošt)",
        ],
      },
      {
        id: "bezpecnost",
        heading: "Bezpečnost a kdy k lékaři",
        body: [
          "Přípravky v této kategorii jsou doplňky stravy nebo zdravotnické prostředky pro podporu komfortu — nenahrazují léčbu spánkové apnoe, ORL zákrok ani CPAP. Nepřekračujte dávkování na etiketě; při alergii nebo podráždění přípravek vysaďte.",
          "K lékaři patří hlasité chrápání s pauzami v dýchání, lapání po dechu, výrazná denní spavost, ranní bolesti hlavy, vysoký tlak bez kontroly, děti, těhotenství a stav bez zlepšení po režimu i krátké zkoušce přípravku.",
        ].join("\n\n"),
      },
    ],
    hubTables: [
      {
        caption: "Formy přípravků proti chrápání — rychlé srovnání",
        headers: ["Forma", "Kdy zvolit", "Na co se dívat"],
        rows: [
          [
            "Sprej",
            "Chrápání z uvolněných tkání v ústech/krku; chcete lokální aplikaci před spaním",
            "Počet střiků, chuť, objem balení, upozornění na alergie",
          ],
          [
            "Kapky",
            "Preferujete inhalaci nebo aplikaci na kapesník/polštář dle návodu",
            "Vůně, frekvence, věkové omezení, skladování",
          ],
          [
            "Náplast",
            "Ucpaný nos nutí dýchat ústy; chcete mechanicky podpořit nosní průchodnost",
            "Přilnavost přes noc, odmaštění kůže, doba nošení",
          ],
          [
            "Kapsle / tablety",
            "Cíl je spíš usínání a spánkový režim než lokální „film“ v krku",
            "Denní dávka, délka kúry, složení, interakce — dle etikety",
          ],
        ],
      },
      {
        caption: "Cíl večera × vhodná větev — orientační mapa",
        headers: ["Cíl", "Vhodná větev", "Realistické očekávání"],
        rows: [
          [
            "Snížit hlasitost chrápání",
            "Sprej nebo kapky + spánek na boku",
            "Často zmírnění, zřídka absolutní ticho",
          ],
          [
            "Lépe dýchat nosem",
            "Náplast + nosní hygiena / zvlhčení vzduchu",
            "Pomáhá hlavně při nosní překážce",
          ],
          [
            "Snáz usnout a spát klidněji",
            "Kapsle na spánek + spánková hygiena",
            "Podpora režimu; ne léčba apnoe",
          ],
          [
            "Partner špatně spí kvůli hluku",
            "Kombinace formy dle příčiny + režimové tipy",
            "Zkuste 1–2 týdny důsledně; při apnoe k lékaři",
          ],
        ],
      },
      {
        caption: "Signály spánkové apnoe — kdy neřešit jen e-shopem",
        headers: ["Signál", "Co udělat"],
        rows: [
          [
            "Pauzy v dýchání, lapání po dechu, chrčení s „dušením“",
            "Konzultace lékaře / spánková laboratoř",
          ],
          [
            "Silná denní spavost, usínání při řízení nebo v práci",
            "Neodkládat odborné vyšetření",
          ],
          [
            "Ranní bolesti hlavy, sucho v ústech, vysoký tlak",
            "Praktický lékař / ORL / spánková ambulance",
          ],
          [
            "Chrápání u dítěte nebo v těhotenství",
            "Vždy lékař — ne experiment s přípravky naslepo",
          ],
        ],
      },
    ],
    hubLinks: [
      { label: "Průvodce výběrem: Spánek a chrápání", path: `${GUIDE_PATH}/sleep-snoring` },
      { label: "Doručení a platba na dobírku", path: "/delivery" },
      { label: "Medical expert — odborný pohled", path: "/medical-expert" },
      { label: "Kategorie: Proti stresu", path: "/stres" },
      { label: "Kategorie: Odvykání kouření", path: "/odvykani-koureni" },
    ],
    categoryFaqHi: [
      {
        q: "Pomáhají volně prodejné přípravky proti chrápání opravdu?",
        a: "U části lidí mohou zmírnit hlasitost nebo zlepšit komfort dýchání — účinek je individuální a závisí na příčině (nos, poloha, tkáně v krku). Nejde o zaručené odstranění chrápání ani o léčbu spánkové apnoe.",
      },
      {
        q: "Sprej, kapky nebo náplast — co zvolit?",
        a: "Sprej a kapky cílí spíš na sliznici a vibrace v ústech/krku; náplast na průchodnost nosu. Nejdřív pojmenujte cíl a typ dýchání (nos vs. ústa), potom formu a etiketu.",
      },
      {
        q: "Jak dlouho zkoušet přípravek proti chrápání?",
        a: "Řiďte se návodem na obalu. Prakticky má smysl krátké důsledné období (řádově noci až 1–2 týdny) spolu s úpravou polohy a alkoholu. Bez zlepšení nebo při známkách apnoe řešte stav s lékařem.",
      },
      {
        q: "Jak poznám spánkovou apnoe od běžného chrápání?",
        a: "Varovné jsou pauzy v dýchání, lapání po dechu, výrazná denní spavost a ranní bolesti hlavy. Samotné občasné chrápání bez těchto znaků bývá spíš komfortní problém — jistotu dá jen odborné vyšetření.",
      },
      {
        q: "Nahrazuje doplněk stravy nebo sprej návštěvu lékaře?",
        a: "Ne. Doplněk stravy a zdravotnické prostředky podporují komfort; diagnózu a léčbu apnoe, ORL příčin nebo CPAP řídí lékař.",
      },
      {
        q: "Co pomáhá na chrápání kromě přípravku?",
        a: "Často spánek na boku, omezení alkoholu před spaním, péče o nos, zvlhčení vzduchu, rozumná váha a vyvýšení horní části lůžka. Přípravek bez režimu obvykle pomůže méně.",
      },
      {
        q: "Kapsle na spánek — jsou totéž co sprej proti chrápání?",
        a: "Ne. Kapsle jsou doplněk stravy zaměřený na usínání a režim; sprej působí lokálně v ústech/krku. Volte podle cíle — a vždy čtěte konkrétní etiketu.",
      },
    ],
    // COD / delivery PAA come from seo-intent DEFAULT_PAA via mergeCategoryFaq (deduped).
    keywordsHi: [
      "přípravky proti chrápání",
      "doplňky stravy proti chrápání",
      "sprej proti chrápání",
      "kapky proti chrápání",
      "náplast proti chrápání",
      "kapsle na spánek",
      "prostředky proti chrápání",
      "jak se zbavit chrápání",
      "jak přestat chrápat",
      "spánková apnoe",
      "klidný spánek",
      "platba na dobírku",
      "doručení Česká republika",
    ],
  },
};
