/**
 * LLM translate i18n.es.ts, legal.es.ts, category-descriptors.es.ts → native *.sl.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-ui-sl");

const ES_MARKERS =
  /\b(España|español|mensajería|contrassegno|corriere|¿|¡| en España|toda España|Madrid|Barcelona|Opiniones Top)\b/i;

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

const TS_SYSTEM = `You translate Spanish TypeScript locale files to native Slovenian (sl-SI) for a Slovenia e-commerce site.

RULES:
- Output ONLY valid TypeScript — no markdown fences, no commentary
- Keep identical structure: imports, exports, function signatures, ${"${...}"} placeholders, SITE references
- Brand: Recenze Ceny (siteName must be "Recenze Ceny")
- Market: Slovenija, plačilo ob prevzemu, dostava 2–5 dni (NOT mensajería/contrassegno/España)
- Phone example: +386 (NOT +34)
- Cities list: Ljubljana, Maribor, Celje, Kranj, Koper, Novo mesto, Velenje, Murska Sobota, etc.
- Rename ES_META → SL_META, getCategoryDescriptorES → getCategoryDescriptorSL where applicable
- Keep export names T and LEGAL unchanged
- Do not translate TypeScript identifiers or import paths`;

async function translateTsFile(
  relEs: string,
  relSl: string,
  headerComment: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, path.basename(relSl));
  if (!force && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  const source = fs.readFileSync(path.join(ROOT, relEs), "utf8");
  const lines = source.split("\n");
  const mid = Math.ceil(lines.length / 2);
  const chunks = [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")];

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} for ${relEs}`);
    const user = `${headerComment}\n\nTranslate this TypeScript chunk to Slovenian. This is chunk ${i + 1} of ${chunks.length}.\n\n${chunks[i]}`;
    const out = await callLLMText(TS_SYSTEM, user, apiKey, url, model);
    translated.push(out);
  }

  let merged = translated.join("\n");
  // Fix common chunk-boundary duplicates (export const appearing twice)
  const exportMatches = merged.match(/^export const T = \{/m);
  if (exportMatches && (merged.match(/^export const T = \{/gm)?.length ?? 0) > 1) {
    merged = translated[0] + "\n" + translated[1].replace(/^[\s\S]*?export const T = \{/, "  ");
  }

  merged = merged
    .replace(/^\/\/[^\n]*\n/, `${headerComment}\n`)
    .replace(/Opiniones Top/g, "Recenze Ceny")
    .replace(/ES_META/g, "SL_META")
    .replace(/getCategoryDescriptorES/g, "getCategoryDescriptorSL");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, merged, "utf8");
  return merged;
}

function validateSlFile(rel: string, content: string): string[] {
  const errs: string[] = [];
  if (ES_MARKERS.test(content)) errs.push(`${rel}: spanish markers remain`);
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
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }

  const jobs = [
    {
      es: "src/lib/i18n.es.ts",
      sl: "src/lib/i18n.sl.ts",
      header: "// Slovenian UI strings. Same shape as i18n.it.ts.",
    },
    {
      es: "src/lib/legal.es.ts",
      sl: "src/lib/legal.sl.ts",
      header: "// Slovenian legal/info pages.",
    },
    {
      es: "src/lib/category-descriptors.es.ts",
      sl: "src/lib/category-descriptors.sl.ts",
      header: "// Slovenian category descriptors for AI prompts and display titles.",
    },
    {
      es: "src/lib/pdp-variants.ts",
      sl: "src/lib/pdp-variants.ts",
      header: "/** Deterministic PDP template variants by nicheType + offer seed. */",
    },
  ];

  if (dryRun) {
    console.log("dry-run — would translate:", jobs.map((j) => j.es).join(", "));
    return;
  }

  console.log("translate-ui-sl —", jobs.length, "files");

  for (const job of jobs) {
    console.log(`Translating ${job.es} → ${job.sl}`);
    const out = await translateTsFile(
      job.es,
      job.sl,
      job.header,
      apiKey,
      url,
      model,
      force,
    );
    const errs = validateSlFile(job.sl, out);
    if (errs.length) {
      console.warn("  validation warnings:", errs.join("; "));
    }
    fs.writeFileSync(path.join(ROOT, job.sl), out, "utf8");
    console.log(`  written ${job.sl}`);
  }

  console.log("Done — i18n.sl.ts, legal.sl.ts, category-descriptors.sl.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
