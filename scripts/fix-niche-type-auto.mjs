/**
 * Restore NicheType "auto" (mistakenly renamed to shelf slug "autodoplnky").
 * Shelf slugs stay "autodoplnky"; niche type enum stays "auto".
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILES = [
  "src/lib/niche-content.cs.ts",
  "src/lib/pdp-variants.ts",
  "src/lib/qa-validator.ts",
  "src/lib/category-faq.cs.ts",
  "src/lib/category-content.ts",
  "src/lib/brand-clean.ts",
];

for (const f of FILES) {
  let t = readFileSync(f, "utf8");
  const before = t;
  t = t.replace(/case "autodoplnky":/g, 'case "auto":');
  t = t.replace(/niche === "autodoplnky"/g, 'niche === "auto"');
  t = t.replace(/niche === 'autodoplnky'/g, "niche === 'auto'");
  // Record<NicheType, …> keys
  t = t.replace(/^(\s+)autodoplnky(\s*:)/gm, "$1auto$2");
  t = t.replace(/^(\s+)"autodoplnky"(\s*:)/gm, "$1auto$2");
  // includes([...]) niche lists
  t = t.replace(/\["home", "garden", "autodoplnky"/g, '["home", "garden", "auto"');
  t = t.replace(/"garden", "autodoplnky", "fashion"/g, '"garden", "auto", "fashion"');
  if (t !== before) {
    writeFileSync(f, t);
    console.log("fixed", f);
  } else {
    console.log("no change", f);
  }
}
