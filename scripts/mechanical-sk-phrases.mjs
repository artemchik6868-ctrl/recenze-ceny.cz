/**
 * Mechanical phrase pass for SK storefront templates.
 * Run after gen-sk-from-cs.mjs: node scripts/mechanical-sk-phrases.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function findSkFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".output" || name === ".git") continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) findSkFiles(p, files);
    else if (name.endsWith(".sk.ts")) files.push(p);
  }
  return files;
}

const PHRASES = [
  ['siteName: "SK Recenzie"', 'siteName: "SK Recenzie"'],
  ["SK Recenzie", "SK Recenzie"],
  ["Platba na dobierku", "Platba na dobierku"],
  ["Doručenie po celom Slovensku", "Doručenie po celom Slovensku"],
  ["Expresný kuriér", "Expresný kuriér"],
  ["sk-SK", "sk-SK"],
  ["Bratislava", "Bratislava"],
];

let changed = 0;
for (const file of findSkFiles(path.join(ROOT, "src"))) {
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}
console.log(`mechanical-sk-phrases: ${changed} files`);
