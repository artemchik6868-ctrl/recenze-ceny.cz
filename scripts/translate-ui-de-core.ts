/**
 * LLM translate i18n.pl.ts, legal.pl.ts, category-descriptors.pl.ts → native *.de.ts (Germany)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-ui-de");

const PL_MARKERS = /ą|ć|ę|ł|ń|ó|ś|ź|ż|\b(Polska|Polsce|Warszawa|zł|płatność|dostawa|produktów|kategorii)\b/i;

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

const TS_SYSTEM = `You translate Polish TypeScript locale files to native German (cs-CZ) for a Germany e-commerce site.

RULES:
- Output ONLY valid TypeScript — no markdown fences, no commentary
- Keep identical structure: imports, exports, function signatures, \${...} placeholders, SITE references
- Brand: Recenze Ceny (siteName must be "Recenze Ceny")
- Market: Deutschland, Zahlung bei Lieferung, Lieferung 2–5 Werktage per Expresskurier
- Phone: +49 (NOT +48)
- Cities list: Praha, Hamburg, München, Köln, Frankfurt, Stuttgart, Düsseldorf, Leipzig, Dresden, Hannover, Nürnberg, Bremen (NOT Polish cities)
- Medical expert: Dr. Thomas Müller, Facharzt für Allgemeinmedizin, Praha, Charité
- Rename PL_META → DE_META, getCategoryDescriptorPL → getCategoryDescriptorDE where applicable
- Keep export names T and LEGAL unchanged
- Do not translate TypeScript identifiers or import paths ending in .de
- Use formal "Sie" where appropriate for CZ market
- Privacy/terms: reference DSGVO (not RODO), German consumer law`;

async function translateTsFile(
  relPl: string,
  relDe: string,
  headerComment: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, path.basename(relDe));
  if (!force && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  const source = fs.readFileSync(path.join(ROOT, relPl), "utf8");
  const lines = source.split("\n");
  const mid = Math.ceil(lines.length / 2);
  const chunks = [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")];

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} for ${relPl}`);
    const user = `${headerComment}\n\nTranslate this TypeScript chunk from Polish to native German. Chunk ${i + 1} of ${chunks.length}.\n\n${chunks[i]}`;
    const out = await callLLMText(TS_SYSTEM, user, apiKey, url, model);
    translated.push(out);
  }

  let merged = translated.join("\n");
  if ((merged.match(/^export const T = \{/gm)?.length ?? 0) > 1) {
    merged = translated[0] + "\n" + translated[1].replace(/^[\s\S]*?export const T = \{/, "  ");
  }

  merged = merged
    .replace(/^\/\/[^\n]*\n/, `${headerComment}\n`)
    .replace(/Expert Recenzje/g, "Recenze Ceny")
    .replace(/PL_META/g, "DE_META")
    .replace(/getCategoryDescriptorPL/g, "getCategoryDescriptorDE");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, merged, "utf8");
  return merged;
}

function validateDeFile(rel: string, content: string): string[] {
  const errs: string[] = [];
  if (PL_MARKERS.test(content)) errs.push(`${rel}: polish markers remain`);
  if (/[\u0400-\u04FF]/.test(content)) errs.push(`${rel}: cyrillic`);
  if (!content.includes("export ")) errs.push(`${rel}: missing export`);
  return errs;
}

export async function main() {
  loadEnv();
  const { dryRun, force } = parseArgs();

  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  const url =
    process.env.AI_GATEWAY_URL ??
    "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";

  if (!apiKey) {
    console.error("Missing AI_API_KEY in .env");
    process.exit(1);
  }

  const jobs = [
    {
      pl: "src/lib/i18n.pl.ts",
      de: "src/lib/i18n.de.ts",
      header: "// German UI strings (cs-CZ). Same shape as i18n.pl.ts.",
    },
    {
      pl: "src/lib/legal.pl.ts",
      de: "src/lib/legal.de.ts",
      header: "// German legal/info pages (Impressum-style, DSGVO).",
    },
    {
      pl: "src/lib/category-descriptors.pl.ts",
      de: "src/lib/category-descriptors.de.ts",
      header: "// German category descriptors for AI prompts and display titles.",
    },
    {
      pl: "src/lib/pdp-variants.ts",
      de: "src/lib/pdp-variants.ts",
      header: "/** Deterministic PDP template variants by nicheType + offer seed (CZ market). */",
    },
    {
      pl: "src/lib/pdp-html-variants.ts",
      de: "src/lib/pdp-html-variants.ts",
      header: "/** PDP HTML snippet variants (CZ market). */",
    },
  ];

  if (dryRun) {
    console.log("dry-run — would translate:", jobs.map((j) => j.pl).join(", "));
    return;
  }

  console.log("translate-ui-de —", jobs.length, "files");

  for (const job of jobs) {
    console.log(`Translating ${job.pl} → ${job.de}`);
    const out = await translateTsFile(
      job.pl,
      job.de,
      job.header,
      apiKey,
      url,
      model,
      force,
    );
    const errs = validateDeFile(job.de, out);
    if (errs.length) {
      console.warn("  validation warnings:", errs.join("; "));
    }
    fs.writeFileSync(path.join(ROOT, job.de), out, "utf8");
    console.log(`  written ${job.de}`);
  }

  console.log("Done — i18n.de.ts, legal.de.ts, category-descriptors.de.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
