/**
 * Generate favicon + OG image for recenze-ceny.cz
 * Usage: node scripts/generate-seo-assets.mjs
 */
import { existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");

const BRAND_GREEN = "#0d6b4f";
const BRAND_GOLD = "#c9a227";
const BRAND_CREAM = "#f7f4ee";

async function resolveFaviconSource() {
  const source = resolve(publicDir, "favicon-source.png");
  if (existsSync(source)) return source;
  throw new Error("Missing public/favicon-source.png — add the favicon artwork before running seo:assets.");
}

async function createOgImage() {
  const w = 1200;
  const h = 630;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND_CREAM}"/>
        <stop offset="100%" stop-color="#e8efe9"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect x="0" y="0" width="12" height="${h}" fill="${BRAND_GREEN}"/>
    <text x="80" y="200" font-family="Georgia, serif" font-size="72" font-weight="700" fill="${BRAND_GREEN}">Recenze Ceny</text>
    <text x="80" y="290" font-family="Arial, sans-serif" font-size="36" fill="#2d4a3e">Ověřené přírodní zdravotní produkty</text>
    <text x="80" y="360" font-family="Arial, sans-serif" font-size="28" fill="#4a6358">Doručení po celé ČR · Platba na dobírku</text>
    <rect x="80" y="420" width="320" height="6" fill="${BRAND_GOLD}"/>
    <text x="80" y="500" font-family="Arial, sans-serif" font-size="22" fill="#6b7f75">recenze-ceny.cz</text>
  </svg>`;
  const out = resolve(publicDir, "og-image.jpg");
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(out);
  console.log(`Wrote ${out}`);
}

const source = await resolveFaviconSource();
const faviconPng = resolve(publicDir, "favicon.png");
const appleTouch = resolve(publicDir, "apple-touch-icon.png");
const faviconIco = resolve(publicDir, "favicon.ico");

await sharp(source)
  .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(faviconPng);

await sharp(source)
  .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(appleTouch);

const buf = await pngToIco(faviconPng);
writeFileSync(faviconIco, buf);

console.log("Wrote public/favicon.png (512x512)");
console.log("Wrote public/apple-touch-icon.png (180x180)");
console.log("Wrote public/favicon.ico");
await createOgImage();
