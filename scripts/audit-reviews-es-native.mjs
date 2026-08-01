/**
 * Audit native Spanish in review template files.
 * Run: node scripts/audit-reviews-es-native.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "src/data/review-templates-cat.es.ts",
  "src/data/review-templates-niche.es.ts",
  "src/data/review-templates-slug.es.ts",
  "src/data/review-templates-theme.es.ts",
];

const IT_MARKERS =
  /\b(contrassegno|corriere|settimane|settimana|dopo il|perché|anche|molto|dovevo|quasi|gentile|consulente|imballaggio|spedizione|integratore|stelle|bruciore|fastidio|prodotto sigillato|Pagamento alla)\b/i;

const BROKEN =
  /\b(espaldesde|desdeesde|Tomadesde|secondesde|Non |Niente |Primi |Mio |Istruzioni chiare|Pagamento a la)\b/i;

const CYRILLIC = /[\u0400-\u04FF]/;

const failures = [];

for (const rel of FILES) {
  const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (CYRILLIC.test(line)) failures.push(`${rel}:${i + 1} cyrillic`);
    if (IT_MARKERS.test(line)) failures.push(`${rel}:${i + 1} IT: ${line.trim().slice(0, 100)}`);
    if (BROKEN.test(line)) failures.push(`${rel}:${i + 1} broken: ${line.trim().slice(0, 100)}`);
  }
}

if (failures.length) {
  console.error(`audit-reviews-es-native FAILED (${failures.length}):`);
  for (const f of failures.slice(0, 40)) console.error(" -", f);
  process.exit(1);
}

console.log("audit-reviews-es-native OK —", FILES.length, "files");
