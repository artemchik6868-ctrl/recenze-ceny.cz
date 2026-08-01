/**
 * LLM translate i18n.hu.ts, legal.hu.ts, category-descriptors.hu.ts, lead-errors.hu.ts → native *.cs.ts
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
      "X-Title": "recenze-ceny-translate",
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

const TS_SYSTEM = `You translate Hungarian TypeScript locale files to native Czech (cs-CZ) for recenze-ceny.cz.

RULES:
- Output ONLY valid TypeScript — no markdown fences, no commentary
- Keep identical structure: imports, exports, function signatures, \${...} placeholders
- Brand: Recenze Ceny (siteName must stay "Recenze Ceny")
- Market: Česká republika, platba na dobírku, expresní kurýr 2–5 pracovních dnů po celé ČR
- Phone: +420 234 567 890 (NOT +420, NOT +49, NOT +40)
- Cities: Praha, Brno, Ostrava, Plzeň, Liberec, Olomouc
- Medical expert: MUDr. Jan Novák, praktický lékař, Praha
- Formal polite "vy" where appropriate
- Rename CS_META → CS_META, getCategoryDescriptorCS → getCategoryDescriptorCS where applicable
- Keep export names T and LEGAL unchanged
- Do NOT leave Hungarian text in user-facing strings
- Fix import paths: .hu → .cs
- Currency display: Kč (not Ft, not €)`;

async function translateTsFile(
  relHu: string,
  relCs: string,
  headerComment: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, path.basename(relCs));
  if (!force && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  const source = fs.readFileSync(path.join(ROOT, relHu), "utf8");
  const lines = source.split("\n");
  const useSingleChunk = lines.length < 500 || relHu.includes("i18n.hu");
  const chunks = useSingleChunk
    ? [source]
    : (() => {
        const mid = Math.ceil(lines.length / 2);
        return [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")];
      })();

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} for ${relHu}`);
    const user = `${headerComment}\n\nTranslate this TypeScript chunk from Hungarian to native Czech. Chunk ${i + 1} of ${chunks.length}.\n\n${chunks[i]}`;
    const out = await callLLMText(TS_SYSTEM, user, apiKey, url, model);
    translated.push(out);
  }

  let merged = translated.join("\n");
  merged = merged
    .replace(/^\/\/[^\n]*\n/, `${headerComment}\n`)
    .replace(/Recenze Ceny/g, "Recenze Ceny")
    .replace(/CS_META/g, "CS_META")
    .replace(/getCategoryDescriptorCS/g, "getCategoryDescriptorCS")
    .replace(/\.hu"/g, '.cs"')
    .replace(/\.hu'/g, ".cs'");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, merged, "utf8");
  return merged;
}

async function main() {
  loadEnv();
  const { dryRun, force } = parseArgs();

  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  const url =
    process.env.AI_GATEWAY_URL ?? "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";

  if (!apiKey) {
    console.error("Missing AI_API_KEY in .env");
    process.exit(1);
  }

  const jobs = [
    { hu: "src/lib/i18n.hu.ts", cs: "src/lib/i18n.cs.ts", header: "// Czech UI strings (cs-CZ)." },
    { hu: "src/lib/legal.hu.ts", cs: "src/lib/legal.cs.ts", header: "// Czech legal/info pages." },
    {
      hu: "src/lib/category-descriptors.hu.ts",
      cs: "src/lib/category-descriptors.cs.ts",
      header: "// Czech category descriptors for display titles.",
    },
    { hu: "src/lib/lead-errors.hu.ts", cs: "src/lib/lead-errors.cs.ts", header: "// Czech lead form error messages." },
  ];

  if (dryRun) {
    console.log("dry-run — would translate:", jobs.map((j) => j.hu).join(", "));
    return;
  }

  console.log("translate-ui-cz —", jobs.length, "files");

  for (const job of jobs) {
    if (!fs.existsSync(path.join(ROOT, job.hu))) {
      console.warn(`skip ${job.hu} — not found`);
      continue;
    }
    console.log(`Translating ${job.hu} → ${job.cs}`);
    const out = await translateTsFile(job.hu, job.cs, job.header, apiKey, url, model, force);
    fs.writeFileSync(path.join(ROOT, job.cs), out, "utf8");
    console.log(`  written ${job.cs}`);
  }

  console.log("Done — i18n.cs.ts, legal.cs.ts, category-descriptors.cs.ts, lead-errors.cs.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
