/**
 * Replace remaining .es imports with .sl across src.
 * Run: node scripts/patch-sl-imports.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".output", ".git"]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".es.ts")) files.push(p);
  }
  return files;
}

const pairs = [
  ["from \"./content.es\"", "from \"./content.sl\""],
  ["from './content.es'", "from './content.sl'"],
  ["from \"./product-intent.es\"", "from \"./product-intent.sl\""],
  ["from \"./product-role.es\"", "from \"./product-role.sl\""],
  ["inferProductRoleEs", "inferProductRoleSl"],
  ["lang === \"es\"", "lang === \"sl\""],
  ["lang: \"es\"", "lang: \"sl\""],
  ["\"es-ES\"", "\"sl-SI\""],
  ["es_ES", "sl_SI"],
  ["inLanguage: \"es-ES\"", "inLanguage: \"sl-SI\""],
  ["hreflang=\"es-ES\"", "hreflang=\"sl-SI\""],
  ["en España", "v Sloveniji"],
  ["geo.region: \"ES\"", "geo.region: \"SI\""],
  ["geo.placename: \"Spain\"", "geo.placename: \"Slovenia\""],
  ["areaServed: \"ES\"", "areaServed: \"SI\""],
  ["availableLanguage: [\"Spanish\"]", "availableLanguage: [\"Slovenian\"]"],
  ["POOL_ES", "POOL_SL"],
  ["export { POOL_SL, POOL_IT }", "export { POOL_SL, POOL_IT }"],
];

let n = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  let t = fs.readFileSync(file, "utf8");
  let next = t;
  for (const [a, b] of pairs) next = next.split(a).join(b);
  if (next !== t) {
    fs.writeFileSync(file, next, "utf8");
    n += 1;
    console.log(path.relative(ROOT, file));
  }
}
console.log(`patch-sl-imports: ${n} files`);
