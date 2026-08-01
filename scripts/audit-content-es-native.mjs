/**
 * Audit native Spanish in content.es.ts + niche-content.es.ts (no IT hybrid).
 * Run: node scripts/audit-content-es-native.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = ["src/lib/content.es.ts", "src/lib/niche-content.es.ts"];

const IT_MARKERS =
  /\b(è |è un|è il|è la|integratore|contrassegno|corriere|settimane|settimana|dopo il|dopo cena|il prodotto|il médico|La formula|In questa selezione|Cerchi|Spediamo|Organizziamo|Contattaci entro|Per clienti|pensata per|vanno usati|Usali insieme|di solito|Non interrompere|Il diabete|Parlare del|Controllare la|Quando gli|Nella selezione trovi|Qui trovi|Come scegliere|Cosa trovi|Quali articoli|C'è garanzia|Cosa c'è)\b/i;

const CYRILLIC = /[\u0400-\u04FF]/;

const PLACEHOLDER_BUGS = /__SHORT__|__NAME__|\$\{b\}/;
const FAQ_LITERAL_NAME = /q:\s*"[^"]*\$\{name\}/;

const failures = [];

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  const isNiche = rel.includes("niche-content");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (CYRILLIC.test(line)) {
      failures.push(`${rel}:${i + 1} cyrillic: ${line.trim().slice(0, 120)}`);
    }
    if (IT_MARKERS.test(line)) {
      failures.push(`${rel}:${i + 1} IT marker: ${line.trim().slice(0, 120)}`);
    }
    if (isNiche && PLACEHOLDER_BUGS.test(line)) {
      failures.push(`${rel}:${i + 1} broken placeholder: ${line.trim().slice(0, 120)}`);
    }
    if (isNiche && FAQ_LITERAL_NAME.test(line)) {
      failures.push(`${rel}:${i + 1} FAQ literal ${name}: use backticks: ${line.trim().slice(0, 120)}`);
    }
    // ${b} in niche runtime helpers (not in compose blocks in content.es.ts)
    if (isNiche && /\$\{b\}/.test(line) && !line.includes("(b) =>")) {
      failures.push(`${rel}:${i + 1} invalid \${b} in niche helper: ${line.trim().slice(0, 120)}`);
    }
  }
}

if (failures.length) {
  console.error(`audit-content-es-native FAILED (${failures.length} issues):`);
  for (const f of failures.slice(0, 60)) console.error(" -", f);
  if (failures.length > 60) console.error(` ... and ${failures.length - 60} more`);
  process.exit(1);
}

console.log("audit-content-es-native OK —", TARGETS.length, "files checked");
