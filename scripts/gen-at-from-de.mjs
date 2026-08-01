/**
 * AT content localization — patch *.de.ts German market copy for Austria.
 * Run after bootstrap-at-infra.mjs: node scripts/gen-at-from-de.mjs
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
  ["in ganz Deutschland", "in ganz Österreich"],
  ["ganz Deutschland", "ganz Österreich"],
  ["in Deutschland", "in Österreich"],
  ["Deutschland", "Österreich"],
  ["Deutschlands", "Österreichs"],
  ["Einwohner Deutschlands", "Einwohner Österreichs"],
  ["Ausgewählt für Deutschland", "Ausgewählt für Österreich"],
  ["Lieferung in ganz Deutschland", "Lieferung in ganz Österreich"],
  ["nur in Deutschland", "nur in Österreich"],
  ["Germany market", "Austria market"],
  ["DE market", "CZ market"],
  ["pickGermanCities", "pickCzechCities"],
  ["DE_CITY_POOL", "CZ_CITY_POOL"],
  ["München", "Graz"],
  ["Hamburg", "Linz"],
  ["Köln", "Salzburg"],
  ["Frankfurt", "Innsbruck"],
  ["Stuttgart", "Klagenfurt"],
  ["Düsseldorf", "Wels"],
  ["Leipzig", "St. Pölten"],
  ["Dortmund", "Villach"],
  ["Essen", "Graz"],
  ["Bremen", "Linz"],
  ["Dresden", "Salzburg"],
  ["Hannover", "Innsbruck"],
  ["Nürnberg", "Klagenfurt"],
  ["Duisburg", "Wels"],
  ["Bochum", "St. Pölten"],
  ["Wuppertal", "Villach"],
  ["Bielefeld", "Graz"],
  ["Bonn", "Linz"],
  ["Münster", "Salzburg"],
  ["Karlsruhe", "Innsbruck"],
  ["Mannheim", "Klagenfurt"],
  ["Bundesärztekammer", "Česká lékařská komora"],
  ["Dr Thomas Müller", "Dr Markus Huber"],
  ["30 61070764", "664 1234567"],
  ["+49", "+43"],
  ["Berlin", "Praha"],
  ["Praha, Praha", "Praha"],
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
console.log(`gen-at-from-de: ${changed} files patched`);
