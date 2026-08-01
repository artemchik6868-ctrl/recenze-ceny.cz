/**
 * Audit native Polish in content.pl.ts + niche-content.pl.ts + AI prompt files.
 * Run: node scripts/audit-content-pl-native.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/content.pl.ts",
  "src/lib/niche-content.pl.ts",
  "src/lib/ai-content.pl-prompts.ts",
  "src/lib/ai-content.examples.pl.ts",
  "src/lib/ai-content.pl-fallbacks.ts",
  "src/lib/product-role.pl.ts",
  "src/lib/feed-title-clean.pl.ts",
  "src/lib/shelf-classification.examples.pl.ts",
  "src/lib/shelf-disambiguation.pl.ts",
  "src/lib/product-intent.pl.ts",
  "src/lib/product-facts.pl-labels.ts",
  "src/lib/ai-content.server.ts",
  "src/lib/pdp-html-variants.ts",
];

const ES_MARKERS =
  /\b(España|español|mensajería|contrassegno|corriere|¿|¡| en España|toda España|Productos para la salud|complemento alimenticio|Cómo elegir|Aquí encuentras|Selección curada|Indicaciones y forma|Composición y modo|Qué saber antes|Por qué elegirlo|Dispositivo y principio|Cómo tomarlo|Información sobre|disponible para pedido|DESAMBIGUACIÓN|complemento para la)\b/i;

const IT_MARKERS =
  /\b(EN_TAIL_IT|CYR_TAIL_IT|translateTailToEs|enTailToIt|cyrillicTailToIt|needsItTailTranslation|Descriptor da tradurre|Categoria:|Il brand|Consegna e pagamento in Italia|HTML troncato|chiudi tutti i tag|Esempio chiusura valida)\b/i;

const SL_MARKERS =
  /\b(Ljubljana|Maribor|Slovenij|Plačilo ob prevzemu|Naročite|izdelek|Informacije o|naravno dopolnilo|po vsej Sloveniji|Zakaj izbrati ta izdelek|kozmetični izdelek|dopolnilo za|Za ta izdelek|ultrazvočni|Zakaj izbrati|Plačilo|Kozmetični|Dostawa po vsej|CELOTEN PRIMER|zeliščni|prebavno dopolnilo|Pričakovana vloga|Kategoria kataloga|slovenščino|Generiraj|Prevedi kratek|Blagovna znamka|prenosna električna|besed|Izvleček feeda|Opis za prevod|ostane nespremenjena)\b/i;

const CYRILLIC = /[\u0400-\u04FF]/;

const PLACEHOLDER_BUGS = /__SHORT__|__NAME__|\$\{b\}/;
const FAQ_LITERAL_NAME = /q:\s*"[^"]*\$\{name\}/;

const failures = [];

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: missing file`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  const isNiche = rel.includes("niche-content");
  const isContentSl = rel === "src/lib/content.pl.ts";
  const isPrompt =
    rel.includes("ai-content") ||
    rel.includes("product-role") ||
    rel.includes("feed-title") ||
    rel.includes("shelf-classification") ||
    rel.includes("shelf-disambiguation") ||
    rel.includes("product-facts.pl") ||
    rel.includes("pdp-html-variants");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (CYRILLIC.test(line) && !rel.includes("GENERIC_SL") && !rel.includes("ai-content.server")) {
      const trimmed = line.trim();
      const isRegexPattern = /\/.*[\u0400-\u04FF].*\/[a-z]*,?/i.test(trimmed);
      const isGenericSlMap = rel.includes("product-facts.pl-labels") && /:\s*"/.test(trimmed);
      const isFeedTitleExample = rel.includes("shelf-classification") && trimmed.includes("feedTitle:");
      const isCyrTailSl = rel.includes("ai-content.server") && trimmed.includes("CYR_TAIL_SL");
      if (!isRegexPattern && !isGenericSlMap && !isFeedTitleExample && !isCyrTailSl) {
        failures.push(`${rel}:${i + 1} cyrillic: ${line.trim().slice(0, 120)}`);
      }
    }
    if (ES_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} ES marker: ${line.trim().slice(0, 120)}`);
    }
    if (IT_MARKERS.test(line) && !line.includes("Consegna e pagamento in Italia".replace(/\\/g, ""))) {
      if (rel.includes("pdp-html-variants") && /Consegna e pagamento in Italia/.test(line)) continue;
      failures.push(`${rel}:${i + 1} IT marker: ${line.trim().slice(0, 120)}`);
    }
    if (SL_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} SL marker: ${line.trim().slice(0, 120)}`);
    }
    if (isNiche && PLACEHOLDER_BUGS.test(line)) {
      failures.push(`${rel}:${i + 1} broken placeholder: ${line.trim().slice(0, 120)}`);
    }
    if (isNiche && FAQ_LITERAL_NAME.test(line)) {
      failures.push(`${rel}:${i + 1} FAQ literal \${name}: use backticks: ${line.trim().slice(0, 120)}`);
    }
    if ((isNiche || isContentSl) && /\$\{b\}/.test(line) && /:\s*"/.test(line)) {
      failures.push(`${rel}:${i + 1} \${b} in double-quoted string — use backticks: ${line.trim().slice(0, 120)}`);
    }
    if (isContentSl && /uniqueFaq:\s*\(\)\s*=>/.test(line)) {
      failures.push(`${rel}:${i + 1} uniqueFaq ignores brand param — use (b) =>: ${line.trim().slice(0, 120)}`);
    }
    if (isNiche && /\$\{b\}/.test(line) && !line.includes("(b) =>")) {
      failures.push(`${rel}:${i + 1} invalid \${b} in niche helper: ${line.trim().slice(0, 120)}`);
    }
    if (isPrompt && /\bESPAÑA\b/i.test(line)) {
      failures.push(`${rel}:${i + 1} wrong market: ${line.trim().slice(0, 120)}`);
    }
  }
}

if (failures.length) {
  console.error(`audit-content-pl-native FAILED (${failures.length} issues):`);
  for (const f of failures.slice(0, 60)) console.error(" -", f);
  if (failures.length > 60) console.error(` ... and ${failures.length - 60} more`);
  process.exit(1);
}

console.log("audit-content-pl-native OK —", TARGETS.length, "files checked");
