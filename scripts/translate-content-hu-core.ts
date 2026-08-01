/**
 * LLM translate content.hu.ts + niche-content.hu.ts → native *.hu.ts (Czech Republic)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache", "translate-content-cz");

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
      "HTTP-Referer": "https://recenze-ceny.cz",
      "X-Title": "recenze-ceny-bg-content",
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

const TS_SYSTEM = `You translate Bulgarian TypeScript content modules to native Hungarian (cs-CZ) for recenze-ceny.cz.

RULES:
- Output ONLY valid TypeScript — no markdown fences
- Keep imports, exports, types, function signatures, category slug keys, \${...} placeholders unchanged
- Market: Česká republika, utánvétes fizetés, expressz futár 2–5 munkanap
- Fix import paths: .bg → .hu
- Export names: buildNicheContentBG → buildNicheContentCS; NEW_CATEGORY_NAMES_BG → NEW_CATEGORY_NAMES_CS
- Category display strings / FAQ / sections: fully native Hungarian (Latin script)
- No Bulgarian Cyrillic in user-facing strings
- Keep slug keys like "cukrovka", "klouby" in English — only translate display strings`;

async function translateFile(
  relDe: string,
  relRo: string,
  header: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<void> {
  const cacheFile = path.join(CACHE_DIR, path.basename(relRo));
  if (!force && fs.existsSync(cacheFile)) {
    fs.writeFileSync(path.join(ROOT, relRo), fs.readFileSync(cacheFile, "utf8"), "utf8");
    console.log(`  cached ${relRo}`);
    return;
  }

  const source = fs.readFileSync(path.join(ROOT, relDe), "utf8");
  const lines = source.split("\n");
  const useSingleChunk = lines.length < 600;
  const chunkSize = useSingleChunk ? lines.length : Math.ceil(lines.length / 3);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join("\n"));
  }

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} for ${relDe}`);
    const user = `${header}\n\nTranslate chunk ${i + 1}/${chunks.length} from Bulgarian to native Hungarian:\n\n${chunks[i]}`;
    translated.push(await callLLMText(TS_SYSTEM, user, apiKey, url, model));
  }

  let merged = translated
    .join("\n")
    .replace(/\.bg"/g, '.hu"')
    .replace(/\.bg'/g, ".hu'")
    .replace(/buildNicheContentBG/g, "buildNicheContentCS")
    .replace(/getCategoryDescriptorBG/g, "getCategoryDescriptorCS")
    .replace(/NEW_CATEGORY_NAMES_BG/g, "NEW_CATEGORY_NAMES_CS");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, merged, "utf8");
  fs.writeFileSync(path.join(ROOT, relRo), merged, "utf8");
  console.log(`  written ${relRo}`);
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
      de: "src/lib/content.bg.ts",
      ro: "src/lib/content.hu.ts",
      header: "// Hungarian content templates for the CZ market.",
    },
    {
      de: "src/lib/niche-content.bg.ts",
      ro: "src/lib/niche-content.hu.ts",
      header: "// Hungarian niche content blocks.",
    },
  ];

  console.log("translate-content-cz —", jobs.length, "files");
  for (const job of jobs) {
    console.log(`Translating ${job.de} → ${job.ro}`);
    await translateFile(job.de, job.ro, job.header, apiKey, url, model, force);
  }
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
