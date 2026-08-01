/**
 * Codemod: rename English shelf slugs → Czech SEO slugs.
 * Only replaces exact quoted strings ("slug" / 'slug') and path forms ("/slug").
 * Does NOT touch regex bodies. Skips category-slug-redirects.ts (legacy keys).
 *
 * Usage: node scripts/rename-category-slugs-cs.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

/** Longest-first so compound slugs win over prefixes. */
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
  "rename-category-slugs-cs.mjs",
  // Legacy EN keys must remain as map sources:
  "hemorrhoid-vocabulary.cs.ts",
  "potency-vocabulary.cs.ts",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".output",
  "dist",
  ".wrangler",
  ".cache",
]);

const EXT = new Set([".ts", ".tsx", ".mjs", ".js"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else {
      const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
      if (EXT.has(ext) && !SKIP_FILES.has(name)) out.push(p);
    }
  }
  return out;
}

function replaceQuotedSlugs(text) {
  let result = text;
  let hits = 0;
  for (const [from, to] of RENAMES) {
    const esc = from.replace(/-/g, "\\-");
    // "slug" | 'slug' | "/slug" | '/slug' | "/slug/" | "/pruvodce/slug"
    const patterns = [
      new RegExp(`(["'])(${esc})\\1`, "g"),
      new RegExp(`(["'])/${esc}/?\\1`, "g"),
      new RegExp(`(["'])/pruvodce/${esc}\\1`, "g"),
    ];
    for (const re of patterns) {
      const before = result;
      result = result.replace(re, (match, quote, ...rest) => {
        hits += 1;
        if (match.includes("/pruvodce/")) return `${quote}/pruvodce/${to}${quote}`;
        if (match.startsWith(`${quote}/`)) {
          const trailing = match.endsWith(`/${quote}`) ? "/" : "";
          return `${quote}/${to}${trailing}${quote}`;
        }
        return `${quote}${to}${quote}`;
      });
      if (result === before) {
        // recount accurately only when changed — adjust hits
      }
    }
  }
  // Recount properly
  return { result, hits };
}

function replaceQuotedSlugsAccurate(text) {
  let result = text;
  let hits = 0;
  for (const [from, to] of RENAMES) {
    const esc = from.replace(/-/g, "\\-");

    // Exact quoted slug
    {
      const re = new RegExp(`(["'])${esc}\\1`, "g");
      result = result.replace(re, (_, q) => {
        hits += 1;
        return `${q}${to}${q}`;
      });
    }
    // "/slug" or "/slug/"
    {
      const re = new RegExp(`(["'])/${esc}(/?)\\1`, "g");
      result = result.replace(re, (_, q, slash) => {
        hits += 1;
        return `${q}/${to}${slash}${q}`;
      });
    }
    // "/pruvodce/slug"
    {
      const re = new RegExp(`(["'])/pruvodce/${esc}\\1`, "g");
      result = result.replace(re, (_, q) => {
        hits += 1;
        return `${q}/pruvodce/${to}${q}`;
      });
    }
  }
  return { result, hits };
}

const files = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "scripts"))];

let changedFiles = 0;
let totalHits = 0;
for (const file of files) {
  const before = readFileSync(file, "utf8");
  const { result, hits } = replaceQuotedSlugsAccurate(before);
  if (hits > 0 && result !== before) {
    writeFileSync(file, result, "utf8");
    changedFiles += 1;
    totalHits += hits;
    console.log(`${relative(ROOT, file)}: ${hits}`);
  }
}

console.log(`\nDone — files=${changedFiles} replacements=${totalHits}`);
