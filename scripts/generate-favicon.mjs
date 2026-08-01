/**
 * Generate favicon.ico from public/favicon.png
 * Usage: node scripts/generate-favicon.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pngPath = resolve(root, "public", "favicon.png");
if (!existsSync(pngPath)) {
  console.error("Missing public/favicon.png");
  process.exit(1);
}
const buf = await pngToIco(pngPath);
writeFileSync(resolve(root, "public", "favicon.ico"), buf);
console.log("Wrote public/favicon.ico");
