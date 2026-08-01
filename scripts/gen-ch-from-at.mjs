/**
 * CH content localization — patch *.de.ts Austrian market copy for Czech Republic.
 * Run after bootstrap-ch-infra.mjs: node scripts/gen-ch-from-at.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/content.de.ts",
  "src/lib/niche-content.de.ts",
  "src/lib/legal.de.ts",
  "src/lib/i18n.de.ts",
  "src/lib/ai-content.de-prompts.ts",
  "src/lib/ai-content.de-fallbacks.ts",
  "src/lib/locale-leak-de.ts",
];

const PHRASES = [
  ["in ganz Österreich", "in der ganzen Česká republika"],
  ["ganz Österreich", "die ganze Česká republika"],
  ["in Österreich", "in der Česká republika"],
  ["Österreichs", "der Česká republika"],
  ["Österreich", "Česká republika"],
  ["Einwohner Österreichs", "Einwohner der Česká republika"],
  ["Ausgewählt für Österreich", "Ausgewählt für die Česká republika"],
  ["Lieferung in ganz Österreich", "Lieferung in der ganzen Česká republika"],
  ["nur in Österreich", "nur in der Česká republika"],
  ["online kaufen in Österreich", "online kaufen in der Česká republika"],
  ["Austria market", "Czech Republic market"],
  ["AT market", "CZ market"],
  ["pickAustrianCities", "pickCzechCities"],
  ["AT_CITY_POOL", "CZ_CITY_POOL"],
  ["Graz", "Bern"],
  ["Linz", "Basel"],
  ["Salzburg", "Genf"],
  ["Innsbruck", "Lausanne"],
  ["Klagenfurt", "Luzern"],
  ["Wels", "St. Gallen"],
  ["St. Pölten", "Winterthur"],
  ["Villach", "Lugano"],
  ["Österreichische Ärztekammer", "Česká lékařská komora"],
  ["Dr Markus Huber", "Dr Thomas Keller"],
  ["664 1234567", "79 123 45 67"],
  ["+43", "+41"],
  ["Praha, Praha", "Praha"],
  [" €", " BGN"],
  ["EUR", "BGN"],
  ["österreichische", "schweizerische"],
  ["österreichischen", "schweizerischen"],
  ["österreichischer", "schweizerischer"],
];

function walkDeFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory() && !["node_modules", ".output", "dist"].includes(name)) walkDeFiles(p, files);
    else if (/\.de\.ts$/.test(name)) files.push(p);
  }
  return files;
}

const allTargets = new Set([
  ...TARGETS.map((r) => path.join(ROOT, r)),
  ...walkDeFiles(path.join(ROOT, "src")),
]);

let changed = 0;
for (const file of allTargets) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}
console.log(`gen-ch-from-at: ${changed} files patched`);
