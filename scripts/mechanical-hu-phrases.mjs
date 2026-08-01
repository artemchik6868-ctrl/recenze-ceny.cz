/**
 * Mechanical phrase pass for HU storefront templates.
 * Run after gen-cz-from-hu.mjs: node scripts/mechanical-cz-phrases.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function findHuFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".output" || name === ".git") continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) findHuFiles(p, files);
    else if (name.endsWith(".hu.ts")) files.push(p);
  }
  return files;
}

const PHRASES = [
  ['siteName: "Recenze Ceny"', 'siteName: "Recenze Ceny"'],
  ["Recenze Ceny", "Recenze Ceny"],
  ["Utánvétes fizetés", "Utánvétes fizetés"],
  ["Szállítás egész Česká republikaon", "Szállítás egész Česká republikaon"],
  ["Expressz futár", "Expressz futár"],
  ["Kategóriák", "Kategóriák"],
  ["Kezdőlap", "Kezdőlap"],
  ["Rólunk", "Rólunk"],
  ["Kapcsolat", "Kapcsolat"],
  ["Szállítás", "Szállítás"],
  ["cs-CZ", "cs-CZ"],
  ["Praha", "Praha"],
];

let changed = 0;
for (const file of findHuFiles(path.join(ROOT, "src"))) {
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}
console.log(`mechanical-hu-phrases: ${changed} files`);
