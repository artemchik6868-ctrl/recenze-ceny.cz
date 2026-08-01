/**
 * Mechanical Hungarian → Czech pass on CZ AI prompt modules.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "src/lib/ai-content.cs-prompts.ts",
  "src/lib/ai-content.examples.cs.ts",
  "src/lib/ai-content.cs-fallbacks.ts",
  "src/lib/ai-content-pipeline.cs.ts",
  "src/lib/seo-intent.cs.ts",
  "src/lib/title-translate.cs.ts",
];

const REPLACEMENTS = [
  ["Utánvétes fizetés", "Platba na dobírku"],
  ["utánvétes fizetés", "platba na dobírku"],
  ["utánvéttel", "dobírkou"],
  ["Magyarországon", "v České republice"],
  ["Magyarország", "Česká republika"],
  ["egész Magyarországon", "po celé České republice"],
  ["Česká republikaon", "v České republice"],
  ["českýul", "česky"],
  ["Írj csak česky", "Piš pouze česky"],
  ["Írj csak českýul", "Piš pouze česky"],
  ["szállítás/fizetés HU", "doručení/platba CZ"],
  [" szállítás", " doručení"],
  ["Szállítás", "Doručení"],
  ["futárszállítást", "expresní kurýr"],
  ["fizetést", "platbu"],
  ["fizetés", "platba"],
  ["Rendelés", "Objednávka"],
  ["Városok a szállítási blokkhoz", "Města pro blok doručení"],
  ["Említs legalább 4 várost", "Uveď alespoň 4 města"],
  ["Te szerkesztő vagy", "Jsi editor"],
  ["FORRÁS:", "ZDROJ:"],
  ["Írj tényszerű tartalmat", "Napiš faktický obsah"],
  ["útmutató vásárlóknak", "průvodce pro zákazníky"],
  ["GYIK szerkesztő", "Editor FAQ"],
  ["konkrét válaszok", "konkrétní odpovědi"],
  ["valódi vásárlói kérdésekre", "na skutečné dotazy zákazníků"],
  ["HTML nélkül", "bez HTML"],
  ["Csak český", "Pouze česky"],
  ["Tényalapú hang", "Faktický tón"],
  ["orvosi ígéretek nélkül", "bez lékařských slibů"],
];

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [a, b] of REPLACEMENTS) next = next.split(a).join(b);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    console.log("patched", rel);
  }
}
