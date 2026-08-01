/**
 * Fix unquoted object keys that are English shelf slugs (codemod missed them).
 * Usage: node scripts/fix-unquoted-slug-keys.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const RENAMES = [
  ["weight-management", "hubnuti"],
  ["smoking-cessation", "odvykani-koureni"],
  ["respiratory-health", "dychaci-cesty"],
  ["personal-grooming", "osobni-pece"],
  ["outdoor-camping", "outdoor-kempovani"],
  ["heated-apparel", "vyhrivane-obleceni"],
  ["medical-devices", "lekarske-pristroje"],
  ["breast-enlargement", "zvetseni-prsou"],
  ["penis-enlargement", "zvetseni-penisu"],
  ["vision-eye-care", "zrak"],
  ["varicose-veins", "krecove-zily"],
  ["prostate-health", "prostata"],
  ["potence-libido", "potence"],
  ["nervous-system", "stres"],
  ["kidney-health", "ledviny"],
  ["home-gadgets", "domaci-vychytavky"],
  ["home-textile", "domaci-textil"],
  ["home-climate", "domaci-klima"],
  ["garden-tools", "zahradni-naradi"],
  ["garden-agro", "zahrada"],
  ["diabetes-care", "cukrovka"],
  ["detox-cleanse", "detox"],
  ["blood-pressure", "krevni-tlak"],
  ["beauty-tools", "kosmeticke-nastroje"],
  ["auto-electronics", "autodoplnky"],
  ["womens-health", "zdravi-zen"],
  ["sleep-snoring", "chrapani"],
  ["liver-health", "jatra"],
  ["kids-toys", "hracky"],
  ["joint-care", "klouby"],
  ["hair-care", "vypadavani-vlasu"],
  ["hemorrhoids", "hemoroidy"],
  ["accessories", "modni-doplnky"],
  ["massagers", "masazni-pristroje"],
  ["household", "domaci-potreby"],
  ["clothing", "obleceni"],
  ["digestive", "traveni"],
  ["parasites", "paraziti"],
  ["papillomas", "papilomy"],
  ["psoriasis", "lupenka"],
  ["fungus", "plisen-nehtu"],
  ["valgus", "vboceny-palec"],
  ["hearing", "sluch"],
  ["immunity", "imunita"],
  ["alcoholism", "alkoholismus"],
  ["cystitis", "cystitida"],
  ["optics", "optika"],
  ["shoes", "boty"],
  ["auto", "autodoplnky"],
];

const SKIP_FILES = new Set([
  "category-slug-redirects.ts",
  "hemorrhoid-vocabulary.cs.ts",
  "potency-vocabulary.cs.ts",
  "fix-unquoted-slug-keys.mjs",
  "rename-category-slugs-cs.mjs",
]);

const SKIP_DIRS = new Set(["node_modules", ".git", ".output", "dist", ".wrangler", ".cache"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(name) && !SKIP_FILES.has(name)) out.push(p);
  }
  return out;
}

function fixText(text) {
  let result = text;
  let hits = 0;
  for (const [from, to] of RENAMES) {
    // Object key as bare identifier at line start / after { or ,
    // e.g. `  fungus: "supplement"` or `fungus:`
    const re = new RegExp(`(^|[\\s{,])(${from})(\\s*:)`, "gm");
    result = result.replace(re, (m, pre, _key, colon) => {
      hits += 1;
      return `${pre}${to}${colon}`;
    });
  }
  return { result, hits };
}

const files = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "scripts"))];
let changedFiles = 0;
let totalHits = 0;
for (const file of files) {
  const before = readFileSync(file, "utf8");
  const { result, hits } = fixText(before);
  if (hits > 0 && result !== before) {
    writeFileSync(file, result);
    changedFiles += 1;
    totalHits += hits;
    console.log(`${relative(ROOT, file)}: ${hits}`);
  }
}
console.log(`\nDone — files=${changedFiles} hits=${totalHits}`);
