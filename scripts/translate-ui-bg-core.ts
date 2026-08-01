/**
 * LLM translate i18n.de.ts, legal.de.ts, category-descriptors.de.ts, lead-errors.de.ts → native *.bg.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-ui-cz");

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1].trim()] = v;
  }
}

function parseArgs() {
  return {
    dryRun: process.argv.includes("--dry-run"),
    force: process.argv.includes("--force"),
  };
}

function stripCodeFences(s: string): string {
  return s.replace(/^```(?:typescript|ts)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

async function callLLMText(
  system: string,
  user: string,
  apiKey: string,
  url: string,
  model: string,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://recenze-ceny.cz",
      "X-Title": "recenze-ceny-bg-translate",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 16384,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return stripCodeFences(content);
}

const TS_SYSTEM = `You translate German TypeScript locale files to native Czech Republicn (cs-CZ) for recenze-ceny.cz.

RULES:
- Output ONLY valid TypeScript — no markdown fences, no commentary
- Keep identical structure: imports, exports, function signatures, \${...} placeholders
- Brand: Recenze Ceny (siteName must stay "Recenze Ceny" — do NOT rename)
- Market: Česká republika, Плащане при доставка, експресен куриер 2–5 работни дни в цяла Česká republika
- Phone: +420 234 567 890 (NOT +49, NOT +40, NOT +48)
- Cities: Praha, Пловдив, Варна, Бургас, Русе, Стара Загора, Плевен, Велико Търново
- Medical expert: д-р Иван Петров, специалист обща медицина, Praha
- Formal polite "Вие" / "ви" where appropriate (NOT Romanian dumneavoastră)
- Rename DE_META → CS_META, getCategoryDescriptorDE → getCategoryDescriptorCS where applicable
- Keep export names T and LEGAL unchanged
- Do NOT leave any German words (Sie, Ihre, Artikel, Entdecken, Über, Werktage, Zahlung bei Lieferung, etc.)
- Do NOT leave any Romanian words (Plata la livrare, Categorii, Despre noi, dumneavoastră, etc.)
- Fix import paths: .de → .bg (e.g. category-descriptors.de → category-descriptors.bg)
- Currency display: лв. (not CHF, not zł, not lei)`;

async function translateTsFile(
  relDe: string,
  relBg: string,
  headerComment: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, path.basename(relBg));
  if (!force && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  const source = fs.readFileSync(path.join(ROOT, relDe), "utf8");
  const lines = source.split("\n");
  const mid = Math.ceil(lines.length / 2);
  const chunks = [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")];

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} for ${relDe}`);
    const user = `${headerComment}\n\nTranslate this TypeScript chunk from German to native Czech Republicn. Chunk ${i + 1} of ${chunks.length}.\n\n${chunks[i]}`;
    const out = await callLLMText(TS_SYSTEM, user, apiKey, url, model);
    translated.push(out);
  }

  let merged = translated.join("\n");
  if ((merged.match(/^export const T = \{/gm)?.length ?? 0) > 1) {
    merged = translated[0] + "\n" + translated[1].replace(/^[\s\S]*?export const T = \{/, "  ");
  } else if ((merged.match(/^export const LEGAL/g)?.length ?? 0) > 1) {
    merged =
      translated[0].replace(/\s*export const LEGAL[\s\S]*$/, "").trimEnd() +
      "\n" +
      translated[1].replace(/^[\s\S]*?(?=\w+:)/, "").replace(/^export const LEGAL[^=]*=\s*\{/, "");
    const faqStart = merged.indexOf("faq: [");
    if (faqStart > 0 && !merged.includes("faq: [\n      {\n        q:")) {
      const part2 = translated[1];
      const faqMatch = part2.match(/faq:\s*\[[\s\S]*?\],\s*\n\s*\},/);
      if (faqMatch) {
        merged = translated[0].replace(/faq:\s*\[[\s\S]*$/, faqMatch[0].replace(/\},\s*$/, "],")) + "\n  " + part2.slice(part2.indexOf("privacy:"));
      }
    }
  } else if (relBg.includes("i18n.bg.ts") && merged.includes("doctorSub:") && merged.includes("original:")) {
    const breakAt = merged.search(/\n\};\s*\n\s*original:/);
    if (breakAt > 0) {
      merged = merged.slice(0, breakAt).replace(/\};\s*$/, ",") + merged.slice(breakAt).replace(/^\n\};\s*\n/, "\n    ");
    }
  }

  merged = merged
    .replace(/^\/\/[^\n]*\n/, `${headerComment}\n`)
    .replace(/Product Reviews/g, "Recenze Ceny")
    .replace(/DE_META/g, "CS_META")
    .replace(/getCategoryDescriptorDE/g, "getCategoryDescriptorCS")
    .replace(/\.de"/g, '.bg"')
    .replace(/\.de'/g, ".bg'");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, merged, "utf8");
  return merged;
}

function validateBgFile(rel: string, content: string): string[] {
  const errs: string[] = [];
  if (!content.includes("export ")) errs.push(`${rel}: missing export`);
  if (!rel.endsWith(".bg.ts")) return errs;
  if (!/[\u0400-\u04FF]/.test(content)) errs.push(`${rel}: missing cyrillic`);
  if (/[äöüß]/i.test(content)) errs.push(`${rel}: german umlauts remain`);
  if (/\b(Sie |Ihre |Wir rufen|Entdecken|Artikel|Produktkategorien|Zahlung bei Lieferung|Schweiz|Zürich)\b/.test(content))
    errs.push(`${rel}: german markers remain`);
  if (/\b(Plata la livrare|dumneavoastră|Categorii|Despre noi|livrare|comandă|produsul)\b/i.test(content))
    errs.push(`${rel}: romanian markers remain`);
  return errs;
}

async function main() {
  loadEnv();
  const { dryRun, force } = parseArgs();

  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  const url =
    process.env.AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";

  if (!apiKey) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }

  const jobs = [
    {
      de: "src/lib/i18n.de.ts",
      ro: "src/lib/i18n.bg.ts",
      header: "// Czech Republicn UI strings (cs-CZ). Same shape as i18n.de.ts.",
    },
    {
      de: "src/lib/legal.de.ts",
      ro: "src/lib/legal.bg.ts",
      header: "// Czech Republicn legal/info pages.",
    },
    {
      de: "src/lib/category-descriptors.de.ts",
      ro: "src/lib/category-descriptors.bg.ts",
      header: "// Czech Republicn category descriptors for display titles.",
    },
    {
      de: "src/lib/lead-errors.de.ts",
      ro: "src/lib/lead-errors.bg.ts",
      header: "// Czech Republicn lead form error messages.",
    },
    {
      de: "src/lib/pdp-variants.ts",
      ro: "src/lib/pdp-variants.ts",
      header: "/** Deterministic PDP template variants — CZ market (cs-CZ strings). */",
    },
  ];

  if (dryRun) {
    console.log("dry-run — would translate:", jobs.map((j) => j.de).join(", "));
    return;
  }

  console.log("translate-ui-cz —", jobs.length, "files");

  for (const job of jobs) {
    console.log(`Translating ${job.de} → ${job.ro}`);
    const out = await translateTsFile(job.de, job.ro, job.header, apiKey, url, model, force);
    const errs = validateBgFile(job.ro, out);
    if (errs.length) console.warn("  validation warnings:", errs.join("; "));
    fs.writeFileSync(path.join(ROOT, job.ro), out, "utf8");
    console.log(`  written ${job.ro}`);
  }

  console.log("Done — i18n.bg.ts, legal.bg.ts, category-descriptors.bg.ts, lead-errors.bg.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
