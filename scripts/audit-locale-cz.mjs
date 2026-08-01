/**
 * Audit CZ locale templates for DE/PL/HU/Cyrillic leaks + hardcoded wrong lang in UI.
 * Run: node scripts/audit-locale-cz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jiti from "jiti";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = jiti(import.meta.url);
const { hasNonCzechLocaleLeak } = load("../src/lib/locale-leak-cz.ts");

const TEMPLATE_GLOBS = [
  "src/lib/i18n.cs.ts",
  "src/lib/content.cs.ts",
  "src/lib/niche-content.cs.ts",
  "src/lib/legal.cs.ts",
  "src/lib/category-descriptors.cs.ts",
  "src/lib/category-content.ts",
  "src/lib/category-page-meta.ts",
  "src/lib/lead-errors.cs.ts",
  "src/lib/seo-alt.ts",
  "src/lib/seo-meta.ts",
  "src/lib/pdp-variants.ts",
  "src/lib/delivery-eta.ts",
  "src/lib/product-facts.cs-labels.ts",
  "src/lib/product-page.tsx",
  "src/components/StickyMobileCta.tsx",
  "src/routes/__root.tsx",
  "src/routes/category.$slug.tsx",
  "src/routes/pruvodce.$slug.tsx",
  "src/lib/review-gen-prompt.cs.ts",
  "src/lib/reviews.ts",
];

const UI_SCAN_DIRS = ["src/routes", "src/components"];

const HARDcoded_DE_ALLOW = new Set([
  "src/lib/kma.server.ts",
  "src/lib/cpagetti-sync.server.ts",
  "src/lib/leads.functions.ts",
  "src/lib/reviews.ts",
  "src/lib/category-descriptors.ts",
  "src/lib/partner-feed-text.ts",
]);

const STRING_RE = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function scanStringLiterals(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("import ") || trimmed.startsWith("*")) continue;
    for (const m of line.matchAll(STRING_RE)) {
      const raw = m[0];
      const s = raw.slice(1, -1);
      if (s.length < 4) continue;
      if (/^[\w./-]+$/.test(s) && !/[äöüßÄÖÜáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(s)) continue;
      if (hasNonCzechLocaleLeak(s)) {
        hits.push({ line: i + 1, sample: s.replace(/\s+/g, " ").slice(0, 100) });
      }
    }
  }
  return hits;
}

function scanHardcodedDe(filePath) {
  const r = rel(filePath);
  if (HARDcoded_DE_ALLOW.has(r)) return [];
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/lang=["']de["']/.test(line)) {
      hits.push({ line: i + 1, sample: line.trim().slice(0, 100) });
      continue;
    }
    if (/\(\s*["']de["']\s*[,)]/.test(line) || /,\s*["']de["']\s*[,)]/.test(line)) {
      if (/Lang|lang|_lang/.test(line) || /getI18n|getCategory|Alt|deliveryEta|localizeCategory|expertPhoto|promoModal|productCard|productFeatured|buildProduct/.test(line)) {
        hits.push({ line: i + 1, sample: line.trim().slice(0, 100) });
      }
    }
  }
  return hits;
}

function walkTsx(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkTsx(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

let leaks = 0;

for (const relPath of TEMPLATE_GLOBS) {
  const file = path.join(ROOT, relPath);
  if (!fs.existsSync(file)) continue;
  for (const h of scanStringLiterals(file)) {
    leaks += 1;
    console.log(`STRING LEAK ${relPath}:${h.line} — ${h.sample}`);
  }
}

for (const dir of UI_SCAN_DIRS) {
  for (const file of walkTsx(path.join(ROOT, dir))) {
    for (const h of scanHardcodedDe(file)) {
      leaks += 1;
      console.log(`HARDCODED de ${rel(file)}:${h.line} — ${h.sample}`);
    }
  }
}

if (leaks) {
  console.log(`\naudit-locale-cz: ${leaks} leak(s) — run translate:ui:cz / fix hardcoded "de"`);
  process.exit(1);
}
console.log("audit-locale-cz: OK");
