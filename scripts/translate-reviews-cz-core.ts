/**
 * LLM translate review-templates-*.hu.ts → native *.cs.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "scripts", ".cache", "translate-reviews-cz");

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

async function callLLM(
  apiKey: string,
  url: string,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://recenze-ceny.cz",
      "X-Title": "recenze-ceny-reviews",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 16384,
      temperature: 0.35,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return stripCodeFences(content);
}

const SYSTEM = `Translate Hungarian review template TypeScript to native Czech (cs-CZ).
Output ONLY valid TypeScript. Keep structure. Czech cities: Praha, Brno, Ostrava. Brand: Recenze Ceny.`;

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = process.env.AI_API_KEY;
  const url = process.env.AI_GATEWAY_URL ?? "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";
  if (!apiKey) {
    console.error("Missing AI_API_KEY");
    process.exit(1);
  }

  const jobs = [
    "review-templates-cat.hu.ts",
    "review-templates-niche.hu.ts",
    "review-templates-slug.hu.ts",
    "review-templates-theme.hu.ts",
  ].map((f) => ({ hu: `src/data/${f}`, cs: `src/data/${f.replace(".hu.", ".cs.")}` }));

  if (dryRun) {
    console.log("dry-run", jobs.map((j) => j.hu).join(", "));
    return;
  }

  fs.mkdirSync(CACHE, { recursive: true });
  for (const job of jobs) {
    if (!fs.existsSync(path.join(ROOT, job.hu))) continue;
    const cache = path.join(CACHE, path.basename(job.cs));
    let out: string;
    if (!force && fs.existsSync(cache)) {
      out = fs.readFileSync(cache, "utf8");
    } else {
      const src = fs.readFileSync(path.join(ROOT, job.hu), "utf8");
      out = await callLLM(apiKey, url, model, SYSTEM, `Translate:\n\n${src}`);
      out = out.replace(/Recenze Ceny/g, "Recenze Ceny").replace(/\.hu/g, ".cs");
      fs.writeFileSync(cache, out, "utf8");
    }
    fs.writeFileSync(path.join(ROOT, job.cs), out, "utf8");
    console.log("written", job.cs);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
