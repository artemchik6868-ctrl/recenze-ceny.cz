/**
 * Mechanical phrase pass for CZ storefront templates.
 * Run after gen-cz-from-hu.mjs: node scripts/mechanical-cz-phrases.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function findCsFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".output" || name === ".git") continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) findCsFiles(p, files);
    else if (name.endsWith(".cs.ts")) files.push(p);
  }
  return files;
}

const PHRASES = [
  ['siteName: "Recenze Ceny"', 'siteName: "Recenze Ceny"'],
  ["Recenze Ceny", "Recenze Ceny"],
  ["Platba na dobírku", "Platba na dobírku"],
  ["Doručení po celé České republice", "Doručení po celé České republice"],
  ["Expresní kurýr", "Expresní kurýr"],
  ["cs-CZ", "cs-CZ"],
  ["Praha", "Praha"],
];

let changed = 0;
for (const file of findCsFiles(path.join(ROOT, "src"))) {
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}
console.log(`mechanical-cz-phrases: ${changed} files`);
