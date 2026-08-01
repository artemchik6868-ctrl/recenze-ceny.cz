/** Hygiena názvu z feedu (CZ) — odstranění affiliate markerů a publikált szövegből LLM few-shotokkal. */

export type FeedTitleFewShot = {
  feedTitle: string;
  cleanBrand: string;
  goodTitle: string;
  goodMeta: string;
  badCopy: string;
};

/** Obecné vzory feed markerů (nem márkalista). */
export const FEED_TITLE_FEW_SHOTS: FeedTitleFewShot[] = [
  {
    feedTitle: "Reishield EU LOW DE",
    cleanBrand: "Reishield",
    goodTitle: "Reishield — kapsle proti neuropatii",
    goodMeta: "Podpora pro periferní nervovou diskomfort",
    badCopy: "Reishield — doplněk stravy az idegrendszerhez",
  },
  {
    feedTitle: "Reishield memorsh spomin memory",
    cleanBrand: "Reishield",
    goodTitle: "Reishield — kapsle na paměť a koncentraci",
    goodMeta: "Podpora a pro paměť és a pro mentální jasnost",
    badCopy: "Reishield — doplněk proti stresu",
  },
  {
    feedTitle: "Reishield neurosh neuropat",
    cleanBrand: "Reishield",
    goodTitle: "Reishield — kapsle proti neuropatii",
    goodMeta: "Podpora a pro pohodlí periferních nervů",
    badCopy: "Reishield — doplněk proti stresu",
  },
  {
    feedTitle: "Cordyceps neurosh neuropat",
    cleanBrand: "Cordyceps Pulse",
    goodTitle: "Cordyceps Pulse — kapsle proti neuropatii",
    goodMeta: "Podpora pro periferní nervovou diskomfort",
    badCopy: "Cordyceps — doplněk stravy pro nervovou soustavu",
  },
  {
    feedTitle: "Reishield glivic kapsule fungus",
    cleanBrand: "Reishield",
    goodTitle: "Reishield — kapsle proti plísni nehtů",
    goodMeta: "Szájon át alkalmazható podpora körömgomba fertőzésre",
    badCopy: "Reishield — krém proti plísni na nehty",
  },
  {
    feedTitle: "PotentGuard EU 2.0",
    cleanBrand: "PotentGuard",
    goodTitle: "PotentGuard — prosztata podpora",
    goodMeta: "Formula pro mužské urologické pohodlí",
    badCopy: "PotentGuard EU 2.0 — prosztata podpora",
  },
  {
    feedTitle: "ClearVisionHD DE TOP",
    cleanBrand: "ClearVisionHD",
    goodTitle: "ClearVisionHD — brýle na noční jízdu",
    goodMeta: "Brýle pro lepší vidění za slabého světla",
    badCopy: "ClearVisionHD DE TOP — brýle na noční jízdu",
  },
  {
    feedTitle: "EDGII Leggings DE",
    cleanBrand: "EDGII",
    goodTitle: "EDGII — formující legíny",
    goodMeta: "Pohodlné formující oblečení na každý den",
    badCopy: "EDGII Leggings DE — formující oblečení",
  },
  {
    feedTitle: "Handy Heater LOW PRICE",
    cleanBrand: "Handy Heater",
    goodTitle: "Handy Heater — přenosné elektrické topidlo",
    goodMeta: "Rychlé ohřátí malých místností a kanceláří",
    badCopy: "Handy Heater LOW — přenosné topidlo",
  },
  {
    feedTitle: "Verdexedil EU v2.0",
    cleanBrand: "Verdexedil",
    goodTitle: "Verdexedil — doplněk stravy na růst vlasů",
    goodMeta: "Vybrané živiny pro silnější a hustší vlasy",
    badCopy: "Verdexedil EU v2.0 — doplněk stravy pro vlasy",
  },
  {
    feedTitle: "Motion Mat DE FREE",
    cleanBrand: "Motion Mat",
    goodTitle: "Motion Mat — masszázsmatrac",
    goodMeta: "Relaxáló masszázs hátra és nyakra otthon",
    badCopy: "Motion Mat DE FREE — masszázsmatrac",
  },
  {
    feedTitle: "Pulsero DE",
    cleanBrand: "Pulsero",
    goodTitle: "Pulsero — kapsle na potenci",
    goodMeta: "Étrend-kiegészítő potencia és libidó pro",
    badCopy: "Pulsero DE — férfi vitalitás",
  },
  {
    feedTitle: "Smoke No More",
    cleanBrand: "Smoke No More",
    goodTitle: "Smoke No More — kapsle na odvykání kouření",
    goodMeta: "Étrend-kiegészítő a dohányzásról való leszokás na podporu",
    badCopy: "Smoke More — leszokás kapsle",
  },
  {
    feedTitle: "Air conditioner DE",
    cleanBrand: "Air conditioner",
    goodTitle: "Hordozható klíma",
    goodMeta: "Kompakt hűtés szobákba és irodákba",
    badCopy: "Air conditioner — DE",
  },
  {
    feedTitle: "Hondrofrost DE",
    cleanBrand: "Hondrofrost",
    goodTitle: "Hondrofrost — kloubní krém",
    goodMeta: "Külsőleg alkalmazható krém ízületi kényelemre",
    badCopy: "Hondrofrost DE — kloubní krém",
  },
  {
    feedTitle: "Hondrofrost SI",
    cleanBrand: "Hondrofrost",
    goodTitle: "Hondrofrost — kloubní gel",
    goodMeta: "Külsőleg alkalmazható gel térdekre, hátra vagy kezekre",
    badCopy: "Hondrofrost — kloubní kapsle",
  },
  {
    feedTitle: "Hondrofrost AT",
    cleanBrand: "Hondrofrost",
    goodTitle: "Hondrofrost — kloubní gel",
    goodMeta: "Külsőleg alkalmazható gel ízületi kényelemre",
    badCopy: "Hondrofrost AT — doplněk stravy",
  },
  {
    feedTitle: "Cortitron AT",
    cleanBrand: "Cortitron",
    goodTitle: "Cortitron — proti hemoroidůmi kapsle",
    goodMeta: "Formula aranyér és érzékeny területek na podporu",
    badCopy: "Cortitron — intim kényelem doplněk stravy",
  },
  {
    feedTitle: "CardioViva HighPrice",
    cleanBrand: "CardioViva",
    goodTitle: "CardioViva — vérnyomás kapsle",
    goodMeta: "Étrend-kiegészítő a szív- és érrendszer na podporu",
    badCopy: "CardioViva HighPrice — vérnyomás kapsle",
  },
  {
    feedTitle: "Prostatricum CH",
    cleanBrand: "Prostatricum",
    goodTitle: "Prostatricum — kapsle na prostatu",
    goodMeta: "Étrend-kiegészítő prosztata podporara",
    badCopy: "Prostatricum CH — kapsle na prostatu",
  },
  {
    feedTitle: "ArtiZynt — gel za sklepe",
    cleanBrand: "ArtiZynt",
    goodTitle: "ArtiZynt — kloubní gel",
    goodMeta: "Külsőleg alkalmazható gel az ízületekre",
    badCopy: "ArtiZynt — feleslegesen ismétlődő gel",
  },
  {
    feedTitle: "Slimmatica",
    cleanBrand: "Slimmatica",
    goodTitle: "Slimmatica — kapsle na kontrolu hmotnosti",
    goodMeta: "Étrend-kiegészítő testkontrola hmotnostipro",
    badCopy: "Slimmatica — kapsle testkontrola hmotnosti — pro",
  },
  {
    feedTitle: "Сухой очиститель для автомобиля",
    cleanBrand: "Száraz autočistič",
    goodTitle: "Száraz autočistič — autočistič kiegészítő",
    goodMeta: "Száraz tisztítás az autó kárpitjápro és belső teréhez",
    badCopy: "Száraz autočistič — produkt pro sluch",
  },
];

export function buildFeedTitleCleanGuideCS(brief: {
  cleanBrand: string;
  rawTitle: string;
  productRole?: string;
}): string {
  const examples = FEED_TITLE_FEW_SHOTS.slice(0, 6)
    .map(
      (s) =>
        `- Feed «${s.feedTitle}» → Márka «${s.cleanBrand}»\n` +
        `    title DOBŘE: «${s.goodTitle}»\n` +
        `    meta_desc DOBŘE: «${s.goodMeta}»\n` +
        `    ŠPATNĚ: «${s.badCopy}»`,
    )
    .join("\n");

  const role = brief.productRole?.trim() || "konkrét produkttípus";
  const dynamic =
    brief.rawTitle.trim() && brief.rawTitle.trim() !== brief.cleanBrand
      ? `\nPro tento produkt:\n` +
        `  Nyers feed: «${brief.rawTitle.slice(0, 80)}»\n` +
        `  Csak ezt publikáld: «${brief.cleanBrand}» (+ szerep «${role}»)\n` +
        `  Az EU / ES / IT / SI / AT / DE / LOW / 2.0 / TOP / FREE kódok a feedben belső jelölők — nem jelenhetnek meg title, subtitle, meta_desc vagy display_title mezőben.`
      : "";

  return `=== FEED CÍM → PUBLIKÁLT SZÖVEG (affiliate kódok nélkül) ===
A CPA feedekben geo/tier/payout kódok (EU, DE, LOW, HIGH, HighPrice, LowPrice, 2.0, TOP, FREE, PRICE) — belső címkék a feed cím végén, nem részei a produktnévnek. Ne rövidítsd a kereskedelmi nevet (No, Off, New marad a márkában — pl. «Smoke No More», «Toxic OFF»). Egy em dash (—) a publikált címben: a márka és a leíró között; a leíró belsejében csak szóközök és prepozíciók (számára, ellen, rá, -pro, -re) — ne «számára — hólyaghurut» vagy «testkontrola hmotnosti — pro».

Példák feed → rövid mezők:
${examples}
${dynamic}
Szabály: Használd a brief tiszta márkáját; írd le a produkt szerepét českýul. Ne vigyed át a feed jelölőit a publikált mezőkbe.`;
}

/** Egy soros jó/rossz pár JSON tool schema leírásokpro. */
export function feedTitleToolExample(): { good: string; bad: string } {
  const s = FEED_TITLE_FEW_SHOTS[0];
  return { good: s.goodTitle, bad: s.badCopy };
}
