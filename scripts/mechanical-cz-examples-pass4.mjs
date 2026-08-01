/**
 * Fourth-pass: runtime guide blocks (product-role) + remaining HU residue.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "src/lib/ai-content.examples.cs.ts");

const REPLACEMENTS = [
  ["h2 «Adagolás»", "h2 «Dávkování»"],
  ["«Adagolás»", "«Dávkování»"],
  ["=== TÖBB SKU-S MÁRKA (ugyanaz a značka, különböző landing szerep) ===", "=== ZNAČKA S VÍCE SKU (stejná značka, jiná role z landing page) ==="],
  ["Reishield, Cordyceps és Benaga sok SKU-val rendelkezik — a szerep a feed végén / landing címében van, NEM a márkában és NEM az általános «légzőszervi utak» bucketben.", "Reishield, Cordyceps a Benaga mají mnoho SKU — role je v konci feedu / v titulku landing page, NE v názvu značky a NE v obecném bucketu «dýchací cesty»."],
  ["Teljes mini-kártyák (title · subtitle · meta — így írd):", "Plné mini-karty (title · subtitle · meta — piš takto):"],
  ["«${brief.cleanBrand ?? \"brand\"}» a «${brief.categorySlug ?? \"oldal\"}» polcon: írd «${brief.productRole}»-ként — ne partner általános bucket-ként.", "«${brief.cleanBrand ?? \"brand\"}» na polici «${brief.categorySlug ?? \"stránky\"}»: piš jako «${brief.productRole}» — ne jako obecný partnerský bucket."],
  ["Szabály: feed cím vége + oldal kategória → konkrét szerep; partner «légzőszervi utak» bucket csak SEO kontextus.", "Pravidlo: konec titulku ve feedu + kategorie stránky → konkrétní role; partnerský bucket «dýchací cesty» jen jako SEO kontext."],
  ["=== HONDRO MÁRKACSALÁD (joint-care — forma feed/landing alapján, nem bucketből) ===", "=== RODINA ZNAČKY HONDRO (joint-care — forma podle feedu/landingu, ne z bucketu) ==="],
  ["«${brand || \"Hondro\"}» most: írd «${brief.productRole}»-ként.", "«${brand || \"Hondro\"}» nyní: piš jako «${brief.productRole}»."],
  ["kapsle spolknése csak ArtiZynt značka miatt", "spolknutí kapslí jen kvůli značce ArtiZynt"],
  ["gel nanášeníe gel nélkül a feedben", "nanášení gelu bez gelu ve feedu"],
  ["12) Hondrofrost — cooling gel / minimális cím (SI, AT, Shakes)", "12) Hondrofrost — cooling gel / minimální titulek (SI, AT, Shakes)"],
  ["ŠPATNĚ: «kloubní kapsle», «doplněk stravy spolknése», «60 kapslí» — csak joint-care kategória miatt", "ŠPATNĚ: «kloubní kapsle», «spolknutí doplňku stravy», «60 kapslí» — jen kvůli kategorii joint-care"],
  ["13) Hondrofrost — kapsule za sklepe (csak ha a feed explicit említi)", "13) Hondrofrost — kapsule za sklepe (pouze pokud feed explicitně uvádí)"],
  ["ŠPATNĚ: gel nanášeníe csak Hondrofrost značka miatt", "ŠPATNĚ: nanášení gelu jen kvůli značce Hondrofrost"],
  ["   DOBŘE: «ArtiZynt — kloubní gel» · h2 «Použití» · gel nanášeníe", "   DOBŘE: «ArtiZynt — kloubní gel» · h2 «Použití» · nanášení gelu"],
  ["   ŠPATNĚ: gel nanášeníe gel nélkül a feedben", "   ŠPATNĚ: nanášení gelu bez gelu ve feedu"],
  ["Enyhülés hemoroidynál és ülés közbeni diskomfortnál", "Úleva při hemoroidech a diskomfortu při sezení"],
  ["«légzőszervi produkt», «támogató eszköz», «intim komfort»", "«dýchací produkt», «podpůrná pomůcka», «intimní komfort»"],
  ["«Cordyceps — hallás kapsle» · «hallás és fül komfort podporaa» · «hallásképesség doplněk stravy»", "«Cordyceps — kapsle na sluch» · «podpora sluchu a komfortu uší» · «doplňek stravy na sluch»"],
  ["«légzőszervi produkt», «plíce», «légzés»", "«dýchací produkt», «plíce», «dýchání»"],
  ["«Benaga — alkoholfüggőség na podporu kapsle» · «detox és alkoholfogyasztás csökkentése» · «alkoholfüggőség doplněk stravy»", "«Benaga — kapsle na podporu odvykání alkoholu» · «detox a snížení konzumace alkoholu» · «doplňek stravy proti alkoholu»"],
  ["«támogató eszköz», «általános közérzet», «légzőszervi utak»", "«podpůrná pomůcka», «obecná pohoda», «dýchací cesty»"],
  ["«Reishield — papilloma proti kapsle» · «papilloma és szemölcs podpora» · «papilloma proti doplněk stravy»", "«Reishield — kapsle proti bradavicím» · «podpora bradavic a papilomů» · «doplňek stravy proti bradavicím»"],
  ["«spray nanášení az érintett lábterületre»", "«sprej nanášení na postiženou oblast nohy»"],
  ["«betét», «silikonová dlaha», «viselhető ortopedickýiai eszköz»", "«vložka», «silikonová dlaha», «nositelná ortopedická pomůcka»"],
  ["«Spray hajnövekedés podporara» · «sprej na vlasy ritkuló hajra»", "«sprej na podporu růstu vlasů» · «sprej na vlasy pro řídnoucí vlasy»"],
  ["«kapsle spolknése»", "«spolknutí kapslí»"],
  ["«Topický gel mužský méret podporara»", "«topický gel na podporu mužské velikosti»"],
  ["«mužský produkt», «mužský doplněk stravy», «általános közérzet»", "«mužský produkt», «mužský doplněk stravy», «obecná pohoda»"],
  ["9) BAE — clothing (nem cipő)", "9) BAE — oblečení (ne boty)"],
  ["«BAE — legíny» · «formázó legíny mindennapra» · «kényelmes legíny»", "«BAE — legíny» · «formující legíny na každý den» · «pohodlné legíny»"],
  ["«cipő», «kényelmes cipő»", "«boty», «pohodlné boty»"],
  ["«külsőleg použitelný kloubní gel»", "«kloubní gel k zevnímu použití»"],
  ["«kloubní gel csak značka miatt gel nélkül a feedben»", "«kloubní gel jen kvůli značce bez gelu ve feedu»"],
  ["«kloubní gel nanášeníe», «kloubní gel csak ArtiZynt značka miatt»", "«nanášení kloubního gelu», «kloubní gel jen kvůli značce ArtiZynt»"],
  ["«K zevnímu použití gel ízületekre»", "«gel k zevnímu použití na klouby»"],
  ["«doplněk stravy», «kapsle spolknése», «perorálně kúra»", "«doplňek stravy», «spolknutí kapslí», «perorální kúra»"],
  ["13) Hondrofrost — kapsule za sklepe (ha a feed explicit említi)", "13) Hondrofrost — kapsule za sklepe (pokud feed explicitně uvádí)"],
  ["ŠPATNĚ: «kloubní gel nanášeníe» csak Hondrofrost značka miatt", "ŠPATNĚ: «nanášení kloubního gelu» jen kvůli značce Hondrofrost"],
  ["«hubnutí és chuť k jídlukontroll podporaa» · «kapky ve vodě a popis produktu szerint»", "«podpora hubnutí a kontroly chuti k jídlu» · «kapky ve vodě podle popisu produktu»"],
  ["hubnutí SKU automatikusan kapsleként", "hubnutí SKU automaticky jako kapsle"],
  ["«Gel nanášení szemölcsre»", "«nanášení gelu na bradavice»"],
  ["«Spray az érintett lábterületre»", "«sprej na postiženou oblast nohy»"],
  ["«vércukor és glükóz podpora» · cukorbetegség téma", "«podpora hladiny cukru a glukózy» · téma diabetu"],
  ["gyomor-bél, emésztőrendszer", "žaludeční střevo, trávicí systém"],
  ["Neuropátia proti kapsle, perorálně podání a popis produktu szerint", "Kapsle proti neuropatii, perorální podání podle popisu produktu"],
  ["Cordyceps Pulse — Idegrendszer doplněk stravyk", "Cordyceps Pulse — doplněk stravy pro nervovou soustavu"],
  ["Ízületek pohyblivostának és komfortjának podporaa", "Podpora pohyblivosti a komfortu kloubů"],
  ["Idegrendszer doplněk stravy, belső nyugalom", "Doplňek stravy pro nervovou soustavu, vnitřní klid"],
  ["Perorálně podpora plíseň nehtů fertőzésre", "Perorální podpora proti plísni nehtů"],
  ["Körömkapsle proti plísním, s vodou podání a popis produktu szerint", "Kapsle proti plísni nehtů, podání s vodou podle popisu produktu"],
  ["Topický gel papilloma és szemölcs podporara", "Topický gel na podporu bradavic a papilomů"],
  ["Papilloma proti gel, közvetlen nanášení szemölcsre", "Gel proti bradavicím, přímé nanášení na bradavice"],
  ["<h2>Cél és produktforma</h2>", "<h2>Cíl a forma produktu</h2>"],
  ["<h2>Eszköz és működés</h2>", "<h2>Přístroj a provoz</h2>"],
  [" egy doplněk stravy kapsle formában perorálně bevételre.", " je doplněk stravy ve formě kapslí k perorálnímu podání."],
  [" a formula célcsoportja felnőttek,", " cílovou skupinou jsou dospělí,"],
  ["A balení tartalmaz s vodou bevételre szánt kapsle;", "Balení obsahuje kapsle k podání s vodou;"],
  ["nem oční kapky vagy külsőleg použitelný produkt.", "ne oční kapky ani produkt k zevnímu použití."],
  ["nem krém vagy külsőleg použitelný produkt.", "ne krém ani produkt k zevnímu použití."],
  ["denně 1–2 kapsle elegendő s vodou jídlokor", "denně 1–2 kapsle stačí s vodou při jídle"],
  ["ismétlődő hólyag diskomfortot, močeníi égést vagy húgyúti fertőzést szeretnének enyhíteni.", "opakující se diskomfort močového měchýře, pálení při močení nebo infekci močových cest chtějí zmírnit."],
  ["nem tea, nem gel és nem külsőleg použitelný produkt.", "ne čaj, ne gel ani produkt k zevnímu použití."],
  ["hagyományos összetevő húgyúti formulákban", "tradiční složka ve formulích na močové cesty"],
  ["A kapsle nem helyettesítik az orvosi diagnózist vagy antibiotikumos kezelést akut hólyaggyulladásnál.", "Kapsle nenahrazují lékařskou diagnózu ani antibiotickou léčbu akutního zánětu močového měchýře."],
  ["testkontrola hmotnostijukat és anyagcseréjüket kiegyensúlyozott életmód mellett szeretnék támogatni.", "chtějí podporovat kontrolu hmotnosti a metabolismus při vyváženém životním stylu."],
  ["<h2>Adagolás: ajánlott séma</h2>", "<h2>Dávkování: doporučené schéma</h2>"],
  ["A krémet finoman masszírozza; nem helyettesíti az orvosi konzultációt vagy előírt kezelést.", "Krém jemně masírujte; nenahrazuje lékařskou konzultaci ani předepsanou léčbu."],
  ["gombaellenes gel külsőleg a na nehet és na nehtovou postel.", "antimykotický gel k zevnímu použití na nehet a nehtovou postel."],
  ["színváltozást vagy szerkezeti eltérést észlelnek a körömön gombafertőzés miatt.", "na nehtu kvůli plísňové infekci pozorují změnu barvy nebo struktury."],
  ["külsőleg použitelný kozmetikum, nem gyógyszer.", "kosmetický přípravek k zevnímu použití, ne lék."],
  ["La infecții persesteente ciupercă unghială kérdezze meg orvosát.", "Při přetrvávající plísni nehtů se poraďte s lékařem."],
  ["egy külsőleg použitelný spray ízületekre.", "sprej k zevnímu použití na klouby."],
  ["terhelés po több kloubní komfortot és pohyblivostot keresnek térdön, háton vagy kézen.", "po zátěži hledají větší kloubní komfort a pohyblivost v kolenou, zádech nebo rukou."],
  ["A balení tartalmaz spray közvetlen bőrnanášeníre — nem kapsle vagy perorálně doplněk stravy.", "Balení obsahuje sprej k přímému nanášení na kůži — ne kapsle ani perorální doplněk stravy."],
  ["Nem helyettesíti medical consult.", "Nenahrazuje lékařskou konzultaci."],
  ["este un kloubní gel, külsőleg a bőrre alkalmazva.", "je kloubní gel aplikovaný zevně na kůži."],
  ["akik každodenní terhelés po több kloubní és izomkomfortot keresnek.", "kteří po každodenní zátěži hledají větší kloubní a svalový komfort."],
  ["pe unghiin și zona unghiei.", "na nehet a oblast nehtové postele."],
  ["egy külsőleg použitelný gel papillomákra és szemölcsökre.", "gel k zevnímu použití na papilomy a bradavice."],
  ["místní bőrváltozásokat szeretnének kezelni.", "chtějí ošetřit místní kožní změny."],
  ["Bei suspecte modificări ale pielii kérdezze meg orvosát.", "Při podezřelých změnách na kůži se poraďte s lékařem."],
  ["egy külsőleg použitelný spray hallux valgusra.", "sprej k zevnímu použití proti vbočenému palci."],
  ["místní podporat keresnek az érintett prst területen.", "hledají místní podporu v oblasti postiženého prstu."],
  ["Bei starkem hallux valgus einen ortoped konsultieren.", "Při výrazném hallux valgusu konzultujte ortopeda."],
  ["hagyományos növényi összetevő tráveníi formulákban", "tradiční rostlinná složka ve formulích na trávení"],
  ["növényi összetevő hasi komfortra", "rostlinná složka pro komfort břicha"],
  ["Ne keverd szemölcs vagy pattanás proti produktekkel", "Nemíchej s produkty proti bradavicím nebo akné"],
  ["trávenípodporara", "podporu trávení"],
  ["trávenípodpora", "podpora trávení"],
  ["hagyományos összetevő tráveníi formulákban", "tradiční složka ve formulích na trávení"],
  ["Ne keverd össze szemölcs vagy bőrkinövéssel", "Nemíchej s bradavicemi nebo kožními výrůstky"],
  ["A balení tartalmaz s vodou spolknendő kapsle — nem tea és nincs kapek.", "Balení obsahuje kapsle ke spolknutí s vodou — ne čaj a ne kapky."],
  ["kapszulát elegendő s vodou spolknni; nem helyettesíti az orvosi konzultációt.", "stačí spolknout kapsli s vodou; nenahrazuje lékařskou konzultaci."],
  ["növényi összetevőket kombinál každodenní trávenípodporara.", "kombinuje rostlinné složky pro každodenní podporu trávení."],
  ["folyékony kapekformát", "tekutou formu kapek"],
  ["praktikus adagolást", "praktické dávkování"],
  ["popis produktu szerint", "podle popisu produktu"],
  ["hemorroida kapsle", "kapsle proti hemoroidům"],
  ["Cordyceps — hemorroida kapsle", "Cordyceps — kapsle proti hemoroidům"],
];

let text = fs.readFileSync(FILE, "utf8");
let next = text;
let count = 0;
for (const [from, to] of REPLACEMENTS) {
  if (!next.includes(from)) continue;
  const before = next;
  next = next.split(from).join(to);
  if (next !== before) count++;
}
if (next !== text) {
  fs.writeFileSync(FILE, next, "utf8");
  console.log(`patched ${count} rules`);
} else {
  console.log("no changes");
}
