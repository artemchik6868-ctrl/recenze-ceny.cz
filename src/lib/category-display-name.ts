/**
 * Thin slug → display name/shortDesc map for cards and localizeCategory.
 * Intentionally free of hub packs / rich category content (keeps home/PDP JS small).
 */

const FALLBACK_NAME = "Zdravotní produkty";
const FALLBACK_SHORT = "Vybrané zdravotní produkty s doručením po celé České republice.";

const CATEGORY_DISPLAY_CS: Record<string, { name: string; short: string }> = {
  "cukrovka": {
    name: "Péče o cukrovku",
    short:
      "Kapsle a bylinné formule pro dospělé, kteří porovnávají doplňky stravy na hladinu cukru, chrom, gurmar i další složky — vždy jako podporu, ne náhradu léčby.",
  },
  "krevni-tlak": {
    name: "Vysoký krevní tlak",
    short:
      "Bylinné kapky, kapsle i minerální formule pro dospělé, kteří chtějí přehledně porovnat přírodní podporu krevního tlaku a srdce.",
  },
  "detox": {
    name: "Detoxikace a čištění",
    short: "Doplňky stravy pro podporu přirozeného čištění trávicího systému a zdravé střevní flóry.",
  },
  "klouby": {
    name: "Klouby",
    short:
      "Doplňky stravy na klouby, kloubní výživa s kolagenem a glukosaminem i kloubní gely — porovnejte formy a doručení po České republice.",
  },
  "potence": {
    name: "Potence a libido",
    short:
      "Přírodní doplňky stravy pro mužskou potenci, erekci a libido – diskrétní balení a doprava po České republice.",
  },
  "hubnuti": {
    name: "Kontrola hmotnosti",
    short:
      "Doplňky stravy pro podporu zdravé kontroly hmotnosti, v kombinaci s vyváženou stravou a fyzickou aktivitou.",
  },
  "prostata": {
    name: "Prostata",
    short: "Doplňky stravy pro udržení zdraví prostaty a močových cest u mužů středního a staršího věku.",
  },
  "zrak": {
    name: "Zrak",
    short: "Doplňky stravy pro udržení normálního zdraví očí v době obrazovek.",
  },
  hemoroidy: {
    name: "Hemoroidy",
    short: "Přírodní doplňky stravy, které pomáhají při každodenních problémech s hemoroidy.",
  },
  "zdravi-zen": {
    name: "Zdraví žen",
    short: "Doplňky stravy pro podporu hormonální rovnováhy, energie a každodenní pohody žen.",
  },
  "stres": {
    name: "Proti stresu",
    short: "Doplňky stravy pro snížení stresu, úzkosti a podporu kvalitního spánku — bez lékařských slibů.",
  },
  cystitida: {
    name: "Cystitida",
    short: "Doplňky stravy pro podporu močových cest a komfort při cystitidě — ne náhrada antibiotické léčby.",
  },
  paraziti: {
    name: "Paraziti",
    short:
      "Doplňky stravy na parazity: bylinné kapsle a kúry pro podporu střevního komfortu — doplňují, nenahrazují lékařskou diagnostiku.",
  },
  "plisen-nehtu": {
    name: "Plíseň nehtů",
    short: "Doplňky stravy na plíseň nehtů: lokální gely a krémy, roztoky i spreje a kapsle jako vnitřní podpora.",
  },
  sluch: {
    name: "Podpora sluchu",
    short: "Produkty pro podporu sluchu a komfort uší — nenahrazují ORL vyšetření.",
  },
  traveni: {
    name: "Trávení",
    short:
      "Doplňky stravy na trávení: probiotika, prebiotika, trávicí enzymy, vláknina a bylinné přípravky pro střevní komfort.",
  },
  "krecove-zily": {
    name: "Křečové žíly",
    short: "Přípravky na křečové žíly — gely, masti a doplňky při těžkých nohou.",
  },
  lupenka: {
    name: "Psoriáza",
    short: "Krém, mast, gel i doplňky stravy při lupénce — srovnání forem a složení.",
  },
  alkoholismus: {
    name: "Alkoholismus",
    short: "Doplňky stravy a přírodní přípravky pro podporu při odvykání alkoholu.",
  },
  "odvykani-koureni": {
    name: "Odvykání kouření",
    short: "Podpora pro zbavení se závislosti na tabáku.",
  },
  "vboceny-palec": {
    name: "Vbočený palec",
    short: "Lokální péče a přípravky při vbočeném palci (hallux valgus).",
  },
  "vypadavani-vlasu": {
    name: "Péče o vlasy",
    short: "Produkty proti vypadávání vlasů a pro podporu zdravé pokožky hlavy.",
  },
  "zvetseni-penisu": {
    name: "Zvětšení penisu",
    short: "Gely, krémy i kapsle pro muže, kteří řeší velikost a komfort — s realistickými očekáváními.",
  },
  "zvetseni-prsou": {
    name: "Zvětšení prsou",
    short: "Produkty pro ženy pro zvětšení a zpevnění prsou.",
  },
  papilomy: {
    name: "Papilomy",
    short: "Lokální gely a přípravky na papilomy a bradavice — s důrazem na bezpečný výběr.",
  },
  "anti-aging": {
    name: "Anti-aging",
    short: "Anti-aging krémy a podpora pleti — bez slibů věčného mládí.",
  },
  "jatra": {
    name: "Zdraví jater",
    short: "Doplňky stravy pro podporu a přirozené čištění jater.",
  },
  "ledviny": {
    name: "Ledviny",
    short: "Doplňky stravy pro podporu ledvin a močového systému.",
  },
  "dychaci-cesty": {
    name: "Dýchací cesty",
    short: "Čaje a doplňky stravy pro dýchací cesty, plíce a dýchání.",
  },
  imunita: {
    name: "Imunita",
    short: "Doplňky stravy pro podporu imunitního systému a obranyschopnosti.",
  },
  "chrapani": {
    name: "Spánek a chrápání",
    short: "Přípravky proti chrápání — sprej, kapky, náplast i kapsle na spánek.",
  },
  "zahrada": {
    name: "Zahrada a zemědělství",
    short: "Hnojiva a produkty pro zahradu, dvůr a venkovní prostory.",
  },
  "domaci-potreby": {
    name: "Domácí potřeby",
    short:
      "Úklidové potřeby, organizéry, úložné boxy, potřeby do kuchyně a drobní domácí pomocníci.",
  },
  autodoplnky: {
    name: "Autodoplňky",
    short:
      "Doplňky do auta a autopříslušenství: péče o lak, komfort, autoelektronika i výbava na cesty.",
  },
  boty: {
    name: "Boty",
    short: "Dámské a pánské boty s doručením po České republice.",
  },
  obleceni: {
    name: "Oblečení",
    short: "Dámské i pánské oblečení online — šaty, trička, kalhoty a bundy s platbou na dobírku.",
  },
  "modni-doplnky": {
    name: "Doplňky",
    short: "Módní doplňky: tašky, hodinky, sluneční brýle a opasky.",
  },
  "kosmeticke-nastroje": {
    name: "Kosmetické nástroje",
    short: "Elektrické zubní kartáčky, čističe kartáčků a kosmetické doplňky.",
  },
  "lekarske-pristroje": {
    name: "Lékařské přístroje",
    short: "Měřiče krevního tlaku, glukometry a další přístroje pro domácí použití.",
  },
  "masazni-pristroje": {
    name: "Masážní přístroje",
    short: "Elektrické masážní přístroje na krk, záda a celé tělo.",
  },
  "domaci-klima": {
    name: "Domácí klima",
    short: "Topení, klimatizace, zvlhčovače a elektrické deky.",
  },
  "domaci-textil": {
    name: "Domácí textil",
    short: "Přikrývky, přehozy, ložní prádlo a polštáře pro útulný domov.",
  },
  "outdoor-kempovani": {
    name: "Outdoor a kempování",
    short: "Stany, rybářské sítě, kempingové lampy a vybavení.",
  },
  "hracky": {
    name: "Hračky",
    short: "Hračky pro děti předškolního a mladšího školního věku.",
  },
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
  optika: {
    name: "Optika",
    short: "Dalekohledy, monokuláry, teleskopy a lupy.",
  },
  "vyhrivane-obleceni": {
    name: "Vyhřívané oblečení",
    short: "Bundy, vesty a oblečení s integrovaným vyhříváním.",
  },
};

export function categoryDisplayName(slug: string | null | undefined): string {
  if (!slug) return FALLBACK_NAME;
  return CATEGORY_DISPLAY_CS[slug]?.name ?? FALLBACK_NAME;
}

export function categoryDisplayShort(slug: string | null | undefined): string {
  if (!slug) return FALLBACK_SHORT;
  return CATEGORY_DISPLAY_CS[slug]?.short ?? FALLBACK_SHORT;
}

/** Localize category list rows without pulling hub packs into the client graph. */
export function localizeCategory<T extends { slug: string; name?: string; description?: string }>(
  c: T,
  _lang?: string,
): T & { name: string; description: string } {
  return {
    ...c,
    name: categoryDisplayName(c.slug),
    description: categoryDisplayShort(c.slug),
  };
}
