/**
 * Prepare favicon assets from RO flag source image.
 * Usage: node scripts/prepare-favicon.mjs [source.png]
 */
import { existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultSource = resolve(root, "public", "favicon-source.png");
const source = process.argv[2] ? resolve(process.argv[2]) : defaultSource;

if (!existsSync(source)) {
  console.error(`Missing favicon source: ${source}`);
  process.exit(1);
}

const faviconPng = resolve(root, "public", "favicon.png");
const appleTouch = resolve(root, "public", "apple-touch-icon.png");
const faviconIco = resolve(root, "public", "favicon.ico");

await sharp(source)
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
  .png()
  .toFile(faviconPng);

await sharp(source)
  .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
  .png()
  .toFile(appleTouch);

const buf = await pngToIco(faviconPng);
writeFileSync(faviconIco, buf);

console.log("Wrote public/favicon.png (512x512)");
console.log("Wrote public/apple-touch-icon.png (180x180)");
console.log("Wrote public/favicon.ico");
