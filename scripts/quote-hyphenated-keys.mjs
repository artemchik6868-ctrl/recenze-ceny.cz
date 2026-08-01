/**
 * Quote unquoted hyphenated object keys (invalid JS identifiers).
 * Usage: node scripts/quote-hyphenated-keys.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", ".output", "dist", ".wrangler", ".cache"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

// Match bare hyphenated keys only at line start (typical object-key indent).
const RE = /^(\s*)([a-z][a-z0-9]*(?:-[a-z0-9]+)+)(\s*:)/gm;

let changedFiles = 0;
let totalHits = 0;
for (const file of [...walk(join(ROOT, "src")), ...walk(join(ROOT, "scripts"))]) {
  const before = readFileSync(file, "utf8");
  let hits = 0;
  const result = before.replace(RE, (m, indent, key, colon) => {
    hits += 1;
    return `${indent}"${key}"${colon}`;
  });
  if (hits > 0 && result !== before) {
    writeFileSync(file, result);
    changedFiles += 1;
    totalHits += hits;
    console.log(`${relative(ROOT, file)}: ${hits}`);
  }
}
console.log(`\nDone — files=${changedFiles} hits=${totalHits}`);
