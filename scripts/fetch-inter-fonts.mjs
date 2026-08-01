/**
 * Download self-hosted Inter variable font subsets (Latin + Cyrillic) for recenze-ceny.cz.
 * Run: node scripts/fetch-inter-fonts.mjs
 */
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "fonts");
const VERSION = "5.2.6";
const BASE = `https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@${VERSION}/files`;

const FILES = [
  {
    url: `${BASE}/inter-latin-wght-normal.woff2`,
    out: "InterVariable-lat.woff2",
  },
  {
    url: `${BASE}/inter-cyrillic-wght-normal.woff2`,
    out: "InterVariable-cyr.woff2",
  },
];

const LEGACY = [
  "Manrope-400-cyr.woff2",
  "Manrope-400-lat.woff2",
  "Manrope-600-cyr.woff2",
  "Manrope-600-lat.woff2",
  "Sora-600-lat-ext.woff2",
  "Sora-600-lat.woff2",
  "Sora-700-lat-ext.woff2",
  "Sora-700-lat.woff2",
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  let total = 0;
  for (const { url, out } of FILES) {
    const bytes = await download(url, join(OUT, out));
    total += bytes;
    console.log(`  ${out} — ${(bytes / 1024).toFixed(1)} KB`);
  }
  console.log(`  total — ${(total / 1024).toFixed(1)} KB`);

  for (const name of LEGACY) {
    try {
      await unlink(join(OUT, name));
      console.log(`  removed ${name}`);
    } catch {
      /* already gone */
    }
  }

  const remaining = await readdir(OUT);
  console.log(`\npublic/fonts/: ${remaining.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
