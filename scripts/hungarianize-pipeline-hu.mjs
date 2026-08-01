/**
 * Convert ai-content-pipeline.ro.ts → Hungarian prompts for HU storefront.
 * Run: node scripts/czechize-pipeline-cz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "src/lib/ai-content-pipeline.ro.ts");
const dst = path.join(ROOT, "src/lib/ai-content-pipeline.hu.ts");

let text = fs.readFileSync(src, "utf8");

const REPLACEMENTS = [
  ["RO storefront", "HU storefront"],
  ["./content.ro", "./content.hu"],
  ['currency: cur || "BGN"', 'currency: cur || "EUR"'],
  ["display_title_ro", "display_title_bg"],
  ["formLabelRo", "formLabelBg"],
  ["expectedDescriptorRo", "expectedDescriptorBg"],
  ["function roFormLabel", "function bgFormLabel"],
  ["0 (comandă gratuită)", "0 (ingyenes rendelés)"],
  ["Preț: nu apare în feed", "Ár: nincs a feedben"],
  ["folosește formulări generice", "használj általános megfogalmazásokat"],
  ["«la cerere»", "«érdeklődésre»"],
  ["«preț actual în fișă»", "«aktuális ár a termékoldalon»"],
  ["Preț din feed:", "Ár a feedből:"],
  ["poți menționa promoție sau curs gratuit", "megemlítheted a promóciót vagy az ingyenes kiszállítást"],
  ["Menționează-l natural", "Említsd természetesen"],
  ["Nu folosi «de la»", "Ne használd az «ettől»"],
  ["Categorie feed:", "Feed kategória:"],
  ["Obiective/indicații din feed:", "Célok/indikációk a feedből:"],
  [
    "Informații despre produs din feed (doar ca referință, pot fi în UA/RU/EN):",
    "Termékinformáció a feedből (csak tájékoztatás, lehet UA/RU/EN):",
  ],
  [
    "Ține cont de aceste informații la redactare. Nu copia literal blocuri webmaster, KPI, plăți afiliați, surse de trafic sau condiții pentru parteneri. Extrage doar date utile cumpărătorului: compoziție, formă de eliberare, indicații, mod de utilizare, preț (dacă există).",
    "Vedd figyelembe ezeket az íráskor. Ne másold szó szerint webmester-, KPI-, affiliate fizetési vagy forgalmi blokkokat. Csak a vásárlónak hasznos adatokat vedd ki: összetétel, forma, indikációk, használat, ár (ha van).",
  ],
  ["Formă confirmată din feed:", "Feedben megerősített forma:"],
  [
    "Produs topical — aplicare pe piele. NU capsule, NU tablete, NU potență, NU paraziți.",
    "Helyileg alkalmazható termék — bőrre. NEM kapszula, NEM tabletta, NEM potencia, NEM parazita.",
  ],
  ["Descriptor recomandat:", "Ajánlott leíró:"],
  ["Cremă", "Krém"],
  ["Unguent", "Kenőcs"],
  ["Șampon", "Sampon"],
  ["Produs", "Termék"],
  ["cremă anti-îmbătrânire", "anti-aging krém"],
  ["serum anti-îmbătrânire", "anti-aging szérum"],
  ["produs anti-îmbătrânire", "anti-aging termék"],
  [
    "Curăță titlul produsului din feed. Elimină marcatori geo, prețuri afiliate, HOLD/FREE/TOP și alte artefacte:",
    "Tisztítsd meg a termék feed-címét. Távolítsd el a geo markereket, affiliate árakat, HOLD/FREE/TOP és egyéb artefaktumokat:",
  ],
  [
    "Returnează O singură linie gata pentru H1: nume comercial (brand, fără traducere) + descriptor scurt al produsului.",
    "Adj vissza EGY sort H1-hez: márkanév (brand, fordítás nélkül) + rövid termékleíró.",
  ],
  [
    "Dacă lipsește descriptorul sau este slab, rescrie-l în limba feedului (RU/UA/EN).",
    "Ha hiányzik vagy gyenge a leíró, írd át a feed nyelvén (RU/UA/EN).",
  ],
  ["Format: «Brand – descriptor»", "Formátum: «Brand – leíró»"],
  ["Exemple:", "Példák:"],
  ["Date feed:", "Feed adatok:"],
  ["Titlu:", "Cím:"],
  ["Descriere:", "Leírás:"],
  ["Răspunde DOAR JSON:", "Csak JSON válasz:"],
  [
    "Traduce linia H1 în română (cs-CZ). Păstrează numele brandului neschimbat (latin, fără traducere).",
    "Fordítsd le a H1 sort magyarra (cs-CZ). A márkanevet változatlanul hagyd (latin, fordítás nélkül).",
  ],
  [
    "Returnează linia COMPLETĂ pentru afișare ca H1 pe fișa produsului. Numele brandului trebuie să apară O singură dată în întreaga linie.",
    "Add vissza a TELJES sort H1 megjelenítéshez. A márkanév csak EGYSZER szerepeljen a sorban.",
  ],
  ["Intrare:", "Bemenet:"],
  ["Exemple format ieșire:", "Kimeneti formátum példák:"],
  [
    "Alege O singură categorie din listă — cea mai precisă pentru acest produs. Returnează doar un slug (latin, cu cratime).",
    "Válassz EGY kategóriát a listából — a legpontosabbat ehhez a termékhez. Csak slugot adj vissza (latin, kötőjellel).",
  ],
  [
    "Titlul/H1 produsului este sursa principală; categoria generică din feed",
    "A termék címe/H1 a fő forrás; a feed általános kategóriája",
  ],
  [
    "este doar context secundar — nu o folosi dacă contrazice descriptorul.",
    "csak másodlagos kontextus — ne használd, ha ellentmond a leírónak.",
  ],
  ["Produs:", "Termék:"],
  ["Context feed:", "Feed kontextus:"],
  ["Lista categorii:", "Kategória lista:"],
  ['{"category":"slug-ales"}', '{"category":"valasztott-slug"}'],
  [
    "Scrie metatag TITLE în română (cs-CZ). Maximum 65 caractere. Folosește dacă e posibil: recenzii, preț, cumpără, compoziție, instrucțiuni.",
    "Írj metatag TITLE-t magyarul (cs-CZ). Maximum 65 karakter. Használd ha lehet: vélemények, ár, vásárlás, összetétel, használati útmutató.",
  ],
  [
    "Dacă există preț concret în feed, include-l exact",
    "Ha konkrét ár van a feedben, pontosan szerepeljen",
  ],
  ["Nu inventa cifre.", "Ne találj ki számokat."],
  [
    "Integrează cuvintele cheie natural, fără forțare.",
    "Építsd be a kulcsszavakat természetesen, erőltetés nélkül.",
  ],
  [
    "Poți include 1 emoji relevant produsului",
    "Használhatsz 1 releváns emojit a termékhez",
  ],
  [
    "Scrie metatag Description în română (cs-CZ). Maximum 155 caractere.",
    "Írj metatag Description-t magyarul (cs-CZ). Maximum 155 karakter.",
  ],
  [
    "Scrie conținutul HTML al fișei de produs în română (cs-CZ) pentru cumpărători din Česká republika.",
    "Írd meg a termékoldal HTML tartalmát magyarul (cs-CZ) Česká republikaon vásárlóknak.",
  ],
  [
    "În blocurile 1 și 2, scopul și indicațiile trebuie să coincidă cu descriptorul",
    "Az 1. és 2. blokkban a cél és indikációk egyezzenek a leíróval",
  ],
  [
    "nu le înlocui cu formulări generice de «bunăstare generală»",
    "ne cseréld le általános «jóllét» formulákra",
  ],
  [
    "Folosește categoria din feed ca orientare suplimentară pentru focusul textului.",
    "Használd a feed kategóriát további iránymutatásként a szöveg fókuszához.",
  ],
  ["Cuvinte cheie principale", "Fő kulcsszavak"],
  ["alege în română", "válassz magyarul"],
  ["recenzii, preț, cumpără, livrare", "vélemények, ár, vásárlás, szállítás"],
  [
    "Fără studii clinice inventate sau medici falși.",
    "Kitalált klinikai vizsgálatok és hamis orvosok nélkül.",
  ],
  [
    "Vorbește despre proprietăți cunoscute ale ingredientelor, fără exagerări.",
    "Az összetevők ismert tulajdonságairól írj, túlzások nélkül.",
  ],
  ["Formatare: HTML curat", "Formázás: tiszta HTML"],
  ["Fără CSS extern.", "Külső CSS nélkül."],
  ["Emoji în h2/h3", "Emoji h2/h3-ban"],
  ["potrivit blocului.", "illő a blokkhoz."],
  ["Structură (generează strict aceste blocuri):", "Struktúra (pontosan ezeket a blokkokat generáld):"],
  ["Bloc 1: Ce este produsul și la ce servește", "1. blokk: Mi a termék és mire való"],
  ["2-3 paragrafe simple", "2-3 rövid bekezdés"],
  ["Bloc 2: Indicații de utilizare", "2. blokk: Használati indikációk"],
  ["Bloc 3: Avantaje și proprietăți ale ingredientelor", "3. blokk: Előnyök és összetevő tulajdonságok"],
  ["beneficii pentru sănătate/bunăstare.", "egészség/jólét előnyök."],
  ["Bloc 4: Instrucțiuni de utilizare", "4. blokk: Használati útmutató"],
  ["Mod de folosire și precauții.", "Használat és óvintézkedések."],
  ["Bloc 5: Cum comanzi produsul în Česká republika", "5. blokk: Hogyan rendeld meg a terméket Česká republikaon"],
  [
    "Produs original, livrare curier rapid în toată Česká republika (Praha, Cluj-Napoca, Timișoara, Iași, Constanța etc.), plată la livrare / ramburs unde e cazul.",
    "Eredeti termék, expressz futárszállítás egész Česká republikaon (Praha, Debrecen, Szeged, Pécs, Győr stb.), utánvétes fizetés ahol alkalmazható.",
  ],
  ["Menționează prețul dacă există în feed.", "Említsd az árat, ha van a feedben."],
  ["Bloc 6: Disclaimer", "6. blokk: Fontos figyelmeztetés"],
  [
    "Avertisment scurt: rezultatele pot varia; informația e orientativă și nu înlocuiește sfatul unui specialist.",
    "Rövid figyelmeztetés: az eredmények eltérhetnek; az információ tájékoztató jellegű, nem helyettesíti szakember tanácsát.",
  ],
  ["NU include FAQ în HTML.", "NE legyen FAQ az HTML-ben."],
  [
    "Răspunde DOAR cu HTML curat. Primul caracter trebuie să fie «<»",
    "Csak tiszta HTML válasz. Az első karakter «<» legyen",
  ],
  ["Fără JSON, fără markdown", "JSON és markdown nélkül"],
  [
    "Generează 5 întrebări frecvente în română (cs-CZ) pentru fișa produsului.",
    "Generálj 5 gyakori kérdést magyarul (cs-CZ) a termékoldalhoz.",
  ],
  [
    "Direcție: gândește ce întrebări ar avea un cumpărător real",
    "Irány: gondold át, milyen kérdései lennének egy valódi vásárlónak",
  ],
  [
    "utilizare, eficacitate, livrare, plată, autenticitate.",
    "használat, hatás, szállítás, fizetés, eredetiség.",
  ],
  [
    "Folosește date din feed când ajută; nu menționa webmaster sau condiții afiliate.",
    "Használd a feed adatait, ha segít; ne említs webmastert vagy affiliate feltételeket.",
  ],
  [
    "Răspunde direct, ca un vânzător care chiar ajută.",
    "Válaszolj közvetlenül, mint egy segítőkész eladó.",
  ],
  [
    "Ești un asistent de generare conținut pentru un magazin online din Česká republika. Răspunde doar cu JSON valid, fără markdown sau explicații.",
    "Tartalomgeneráló asszisztens vagy egy magyarországi online áruházhoz. Csak érvényes JSON válasz, markdown és magyarázat nélkül.",
  ],
  [
    "Ești copywriter pentru magazin online din Česká republika. Răspunde doar cu HTML valid (h2, p, ul, li). Fără JSON, fără markdown, fără explicații.",
    "Copywriter vagy egy magyarországi online áruházhoz. Csak érvényes HTML (h2, p, ul, li). JSON, markdown és magyarázat nélkül.",
  ],
  ["Referință feed", "Feed referencia"],
  ["nu menționa webmaster sau afiliați", "ne említs webmastert vagy affiliate partnert"],
  ["preț", "ár"],
];

for (const [from, to] of REPLACEMENTS) {
  text = text.split(from).join(to);
}

// Hungarian STEP2 examples
text = text.replace(
  /const STEP2_EXAMPLES = `[\s\S]*?`;/,
  `const STEP2_EXAMPLES = \`Diaform – cukorbetegség elleni kapszulák,
Rectin – hemorroidák elleni gél,
Beauty Age Skin – anti-aging krém,
Eudalie – fiatalító krém,
NIAPEPT – anti-aging krém,
Pulsero – potencia kapszulák,
UltraVix – ízületi termék,
ABslim – fogyókúrás cseppek,
HeatCore – hordozható fűtő,
NightVision Pro – éjszakai vezető szemüveg,
LeatherBag Milano – bőr crossbody táska,
SmartWatch Fit – fitness karkötő,
GardenGrow – kerti trágya,
Reishield – dohányzásról való leszokás kapszulák,
Benaga Chaga – fogyókúrás kapszulák,
Cordyceps Pulse – gomba elleni kapszulák\`;`,
);

fs.writeFileSync(dst, text, "utf8");
console.log("Wrote", path.relative(ROOT, dst));
