/** Fifth-pass: HTML few-shot example blocks → Czech */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src/lib/ai-content.examples.cs.ts",
);

const REPLACEMENTS = [
  ["a formula célcsoportja mužskýaknak, akik prostata komfortot és éjszakai močenít szeretnének támogatni.", "cílovou skupinou jsou muži, kteří chtějí podporovat komfort prostaty a noční močení."],
  ["a formula célcsoportja személyeknek,", "cílovou skupinou jsou osoby,"],
  ["a formula célcsoportja személyeknek kteří", "cílovou skupinou jsou osoby, které"],
  ["A balení tartalmaz s vodou bevételre szánt kapsle", "Balení obsahuje kapsle k podání s vodou"],
  ["<p><strong>W-Loss</strong> egy doplněk stravy kapek formában perorálně bevételre.", "<p><strong>W-Loss</strong> je doplněk stravy ve formě kapek k perorálnímu podání."],
  ["A balení tartalmaz pipettát vagy kapekcsöves flakont — nem kapsle vagy tabletta.", "Balení obsahuje pipetu nebo lahvičku s kapkami — ne kapsle ani tablety."],
  ["<p><strong>Artrosteel</strong> egy krém k zevnímu použití pe Haut.", "<p><strong>Artrosteel</strong> je krém k zevnímu použití na kůži."],
  [" după zilnicer Belastung mai mult confort in articulațiin și Muskeln caută.", " po každodenní zátěži hledají větší komfort kloubů a svalů."],
  ["La iritație întrerupeți aplicarea și kérdezze meg orvosát", "Při podráždění přerušte aplikaci a poraďte se s lékařem"],
  ["Wenn Sie medicamente iaun sau aveți o afecțiune cronică, kérdezze meg înainte de aplicare un medic.", "Pokud užíváte léky nebo máte chronické onemocnění, poraďte se s lékařem před aplikací."],
  ["Das Gel nem helyettesíti consultul medical sau tratament antifungic prescris.", "Gel nenahrazuje lékařskou konzultaci ani předepsanou antimykotickou léčbu."],
  ["Bei Verschlechterung Infektion kérdezze meg orvosát", "Při zhoršení infekce se poraďte s lékařem"],
  ["A balení célzott nanášeníre térdre, hátra vagy kézre — nem kapsle vagy perorálně doplněk stravy.", "Balení je určeno k cílenému nanášení na kolena, záda nebo ruce — ne kapsle ani perorální doplněk stravy."],
  ["<p><strong>Promicil</strong> egy krém k zevnímu použití", "<p><strong>Promicil</strong> je krém k zevnímu použití"],
  ["Ambalajul percue célzott nanášení přímo na bradavici — nem kapsle vagy perorálně podání.", "Balení umožňuje cílené nanášení přímo na bradavici — ne kapsle ani perorální podání."],
  ["A balení tartalmaz un Spray zur aplicare pe picior — nu dispozitiv ortopedic de purtat și fără capsule.", "Balení obsahuje sprej k aplikaci na nohu — ne ortopedickou pomůcku k nošení a bez kapslí."],
  ["<p><strong>Parazol</strong> egy tea din plante zur aplicare internă.", "<p><strong>Parazol</strong> je bylinný čaj k vnitřnímu podání."],
  ["trávenít és általános bél komfortot szeretnének támogatni egészséges életmód mellett.", "chtějí podporovat trávení a obecný komfort střev při zdravém životním stylu."],
  ["Ambalajul percue egy csésze tea elkészítése každodenní rutin részeként — fără Versprechen «Wșierreinigung» sau negibehandlung.", "Balení umožňuje přípravu jednoho šálku čaje jako součást každodenní rutiny — bez slibů «parasitární očisty» nebo negativní léčby."],
  ["Terhesség vagy szoptatás alatt orvosi konzultáció nélkül ne használja", "Během těhotenství nebo kojení nepoužívejte bez lékařské konzultace"],
  ["Místní spray aplikace hallux valgusra", "Místní sprej aplikace proti vbočenému palci"],
  ["zdraví očíüket és každodenní zrakukat szeretnék támogatni — pl. obrazovkprácinál.", "chtějí podporovat zdraví očí a každodenní zrak — např. při práci u obrazovky."],
];

let text = fs.readFileSync(FILE, "utf8");
let next = text;
let n = 0;
for (const [a, b] of REPLACEMENTS) {
  if (!next.includes(a)) continue;
  next = next.split(a).join(b);
  n++;
}
if (next !== text) {
  fs.writeFileSync(FILE, next, "utf8");
  console.log(`patched ${n} rules`);
} else console.log("no changes");
