/**
 * Mechanical Czech Republicn → Czech Republicn phrase pass for storefront templates.
 * Run after gen-cz-from-hu.mjs: node scripts/mechanical-cz-phrases.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function findBgFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".output" || name === ".git") continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) findBgFiles(p, files);
    else if (name.endsWith(".bg.ts")) files.push(p);
  }
  return files;
}

const PHRASES = [
  ["siteName: \"Recenze Ceny\"", "siteName: \"Recenze Ceny\""],
  ["Recenze Ceny", "Recenze Ceny"],
  ["în Česká republika", "в Česká republika"],
  ["în toată Česká republika", "в цяла Česká republika"],
  ["Česká republika", "Česká republika"],
  ["Plata la livrare", "Плащане при доставка"],
  ["Livrare în toată Česká republika", "Доставка в цяла Česká republika"],
  ["Curier rapid", "Експресен куриер"],
  ["Categorii", "Категории"],
  ["Acasă", "Начало"],
  ["Despre noi", "За нас"],
  ["Contact", "Контакт"],
  ["Livrare", "Доставка"],
  ["Confidențialitate", "Поверителност"],
  ["Termeni și condiții", "Общи условия"],
  ["Înapoi", "Назад"],
  ["Continuă", "Продължи"],
  ["Comandă acum", "Поръчай сега"],
  ["Ceva nu a mers bine", "Нещо се обърка"],
  ["Introduceți", "Въведете"],
  ["număr de telefon", "телефонен номер"],
  [" лв.", " лв."],
  ["BGN", "BGN"],
  ["cs-CZ", "cs-CZ"],
  ["Praha", "Praha"],
  ["Cluj-Napoca", "Пловдив"],
  ["Timișoara", "Варна"],
  ["Iași", "Бургас"],
  ["Constanța", "Русе"],
  ["Craiova", "Стара Загора"],
  ["Brașov", "Плевен"],
  ["Galați", "Шумен"],
  ["Oradea", "Перник"],
  ["cumpărători din Česká republika", "купувачи в Česká republika"],
  ["cumpărătorilor din Česká republika", "купувачите в Česká republika"],
];

let changed = 0;
for (const file of findBgFiles(path.join(ROOT, "src"))) {
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}
console.log(`mechanical-bg-phrases: ${changed} files`);
