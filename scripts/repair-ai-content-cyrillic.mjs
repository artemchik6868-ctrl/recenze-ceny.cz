/**
 * Restore Cyrillic literals in ai-content.server.ts from last good Nitro SSR bundle.
 * Run: node scripts/repair-ai-content-cyrillic.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const builtPath = resolve(
  root,
  "node_modules/.nitro/vite/services/ssr/assets/ai-content.server-CZsNuVIo.js",
);
const tsPath = resolve(root, "src/lib/ai-content.server.ts");

const decode = (s) => Buffer.from(s, "latin1").toString("utf8");

const built = readFileSync(builtPath, "utf8");
let ts = readFileSync(tsPath, "utf8");

function decodeRegexLine(line) {
  const m = line.match(/^\s*"([^"]+)":\s*\/(.+)\/([gimsuy]*),?\s*$/);
  if (!m) return null;
  const [, key, body, flags] = m;
  return { key, pattern: decode(body), flags };
}

// --- CATEGORY_KEEP_REGEX ---
const keepMatch = built.match(/const CATEGORY_KEEP_REGEX = \{([\s\S]*?)\};/);
if (!keepMatch) throw new Error("CATEGORY_KEEP_REGEX not found in bundle");
const keepLines = keepMatch[1]
  .split("\n")
  .map(decodeRegexLine)
  .filter(Boolean);
const keepBlock =
  "const CATEGORY_KEEP_REGEX: Record<string, RegExp> = {\n" +
  keepLines
    .map(({ key, pattern, flags }) => {
      const slug = key === "mens-vitality" ? "potence" : key;
      return `  "${slug}": /(${pattern})/${flags},`;
    })
    .join("\n") +
  "\n};";
ts = ts.replace(/const CATEGORY_KEEP_REGEX: Record<string, RegExp> = \{[\s\S]*?\};/, keepBlock);

// --- stopMarkers in cleanRawDescription ---
const stopMatch = built.match(/const stopMarkers = \[([\s\S]*?)\];/);
if (stopMatch) {
  const markers = [...stopMatch[1].matchAll(/\/(.+)\/([gimsuy]*)/g)].map((m) => ({
    pattern: decode(m[1]),
    flags: m[2],
  }));
  const stopBlock =
    "  const stopMarkers = [\n" +
    markers.map(({ pattern, flags }) => `    /${pattern}/${flags},`).join("\n") +
    "\n  ];";
  ts = ts.replace(/  const stopMarkers = \[[\s\S]*?\];/, stopBlock);
}

// --- CATEGORY_TYPICAL_INGREDIENTS + DOSAGE ---
const ingMatch = built.match(/const CATEGORY_TYPICAL_INGREDIENTS = (\{[\s\S]*?\});/);
const dosMatch = built.match(/const CATEGORY_TYPICAL_DOSAGE = (\{[\s\S]*?\});/);
if (ingMatch) {
  let ing = ingMatch[1].replace(/"mens-vitality"/g, '"potence"');
  ing = ing.replace(/"([^"]*)"/g, (_, s) => `"${decode(s)}"`);
  ts = ts.replace(/const CATEGORY_TYPICAL_INGREDIENTS = \{[\s\S]*?\};/, `const CATEGORY_TYPICAL_INGREDIENTS = ${ing};`);
}
if (dosMatch) {
  let dos = dosMatch[1].replace(/"mens-vitality"/g, '"potence"');
  dos = dos.replace(/"([^"]*)"/g, (_, s) => `"${decode(s)}"`);
  ts = ts.replace(/const CATEGORY_TYPICAL_DOSAGE = \{[\s\S]*?\};/, `const CATEGORY_TYPICAL_DOSAGE = ${dos};`);
}

// --- pickTypicalApplianceSpecs pools ---
const poolMatch = built.match(
  /const pools = lang === "uk"\s*\? isElectric\s*\? \[([\s\S]*?)\]\s*: \[([\s\S]*?)\]\s*: isElectric\s*\? \[([\s\S]*?)\]\s*: \[([\s\S]*?)\];/,
);
if (poolMatch) {
  const decodeArr = (chunk) =>
    [...chunk.matchAll(/"([^"]*)"/g)].map((m) => `"${decode(m[1])}"`).join(", ");
  const [ukEl, ukMe, ruEl, ruMe] = poolMatch.slice(1).map(decodeArr);
  const isElectricRe = built.match(/const isElectric = \/(.+)\/i\.test/);
  const electricRe = isElectricRe ? decode(isElectricRe[1]) : "електр|elektr|usb|220|вт|ватт|watt";
  ts = ts.replace(
    /const isElectric = \/[^/]+\/i\.test\(titleLc\);[\s\S]*?return pool\.slice\(0, 4\);/,
    `const isElectric = /${electricRe}/i.test(titleLc);
  const pools =
    lang === "uk"
      ? isElectric
        ? [${ukEl}]
        : [${ukMe}]
      : isElectric
        ? [${ruEl}]
        : [${ruMe}];
  const pool = pools.slice();
  const rnd = mulberry32(seed || 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4);`,
  );
}

// --- Generic: replace remaining mojibake string literals from bundle into TS for buildInventionPolicyBlock etc ---
function extractTemplate(name) {
  const re = new RegExp(`function ${name}\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const m = built.match(re);
  return m ? m[1] : null;
}

// Fix comments with known bucket names
ts = ts.replace(
  /KMA ships combined buckets like "[^"]+" \? without filtering/g,
  'KMA ships combined buckets like "Паразиты, Папилломы" — without filtering',
);
ts = ts.replace(
  /the AI pulls "[^"]+" into copy/g,
  'the AI pulls "Папилломы" into copy',
);
ts = ts.replace(
  /Splits combined buckets like "[^"]+" by/g,
  'Splits combined buckets like "Паразиты, Папилломы" by',
);

// Replace any line containing only ???? corruption in template strings by scanning bundle function bodies
for (const fn of ["buildInventionPolicyBlock", "buildSectionPromptRu", "buildSectionPromptUk"]) {
  const body = extractTemplate(fn);
  if (!body) continue;
  const strings = [...body.matchAll(/`([\s\S]*?)`|"([^"]*)"|'([^']*)'/g)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .filter((s) => /[А-Яа-яЁёІіЇїЄєҐґ]/.test(decode(s)) || /Р[А-Яа-я]/.test(s));
  for (const raw of strings) {
    const fixed = decode(raw);
    if (fixed.includes("?")) continue;
    ts = ts.split(raw).join(fixed);
    ts = ts.split(decode(raw)).join(fixed);
  }
}

// Brute-fix remaining ??? sequences inside backtick strings using bundle decode pass
ts = ts.replace(/`([^`]*\?{3,}[^`]*)`/g, (full, inner) => {
  if (!/\?{3,}/.test(inner)) return full;
  return full; // leave for manual if any remain
});

writeFileSync(tsPath, ts, "utf8");

const remaining = (ts.match(/\?{3,}/g) || []).length;
console.log(`Repaired ${tsPath}; remaining ??? runs: ${remaining}`);
if (remaining > 0) {
  console.warn("Some Cyrillic may still need manual fix — check build output.");
}
