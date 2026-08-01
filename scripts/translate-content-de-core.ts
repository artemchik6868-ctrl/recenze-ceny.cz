/**
 * LLM translate content.pl.ts + niche-content.pl.ts → native *.de.ts (Germany)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-content-de");

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

const TS_SYSTEM = `You translate Polish TypeScript content modules to native German (cs-CZ) for a Germany health-products e-commerce site.

RULES:
- Output ONLY valid TypeScript — no markdown fences
- Keep imports, exports, types, function signatures, \${...} placeholders unchanged
- Market: in Deutschland, Zahlung bei Lieferung, Expresskurier 2–5 Werktage
- Fix import paths: .pl → .de (e.g. niche-content.pl → niche-content.de, category-descriptors.pl → category-descriptors.de)
- Export names: CATEGORY_CONTENT stays; buildNicheContentPL → buildNicheContentDE
- No Polish diacritics in output strings`;

async function translateFile(
  relPl: string,
  relDe: string,
  header: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<void> {
  const cacheFile = path.join(CACHE_DIR, path.basename(relDe));
  if (!force && fs.existsSync(cacheFile)) {
    fs.writeFileSync(path.join(ROOT, relDe), fs.readFileSync(cacheFile, "utf8"), "utf8");
    console.log(`  cached ${relDe}`);
    return;
  }

  const source = fs.readFileSync(path.join(ROOT, relPl), "utf8");
  const lines = source.split("\n");
  const chunkSize = Math.ceil(lines.length / 3);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join("\n"));
  }

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} for ${relPl}`);
    const user = `${header}\n\nTranslate chunk ${i + 1}/${chunks.length} from Polish to native German:\n\n${chunks[i]}`;
    translated.push(await callLLMText(TS_SYSTEM, user, apiKey, url, model));
  }

  let merged = translated.join("\n")
    .replace(/\.pl"/g, '.de"')
    .replace(/\.pl'/g, ".de'")
    .replace(/buildNicheContentPL/g, "buildNicheContentDE")
    .replace(/getCategoryDescriptorPL/g, "getCategoryDescriptorDE")
    .replace(/NEW_CATEGORY_NAMES_PL/g, "NEW_CATEGORY_NAMES_DE");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, merged, "utf8");
  fs.writeFileSync(path.join(ROOT, relDe), merged, "utf8");
  console.log(`  written ${relDe}`);
}

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  const url = process.env.AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";
  if (!apiKey) {
    console.error("Missing AI_API_KEY");
    process.exit(1);
  }

  const jobs = [
    {
      pl: "src/lib/content.pl.ts",
      de: "src/lib/content.de.ts",
      header: "// German content templates for the Germany market.",
    },
    {
      pl: "src/lib/niche-content.pl.ts",
      de: "src/lib/niche-content.de.ts",
      header: "// German niche content blocks.",
    },
  ];

  console.log("translate-content-de —", jobs.length, "files");
  for (const job of jobs) {
    console.log(`Translating ${job.pl} → ${job.de}`);
    await translateFile(job.pl, job.de, job.header, apiKey, url, model, force);
  }
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
