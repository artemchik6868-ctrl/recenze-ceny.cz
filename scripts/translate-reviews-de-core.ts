/**
 * LLM translate review-templates-cat.pl.ts + niche.pl → native *.de.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "scripts", ".cache", "translate-reviews-de");

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

async function callLLM(apiKey: string, url: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 16384,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return stripCodeFences(content);
}

const SYSTEM = `Translate Polish review template TypeScript to native German (cs-CZ).
- Output ONLY valid TypeScript, no fences
- Keep sl() helper, gender g:"m"|"f", structure identical
- Rename PlReviewBody → DeReviewBody, CATEGORY_PL_BODIES → CATEGORY_DE_BODIES, NICHE_TEMPLATES_PL → NICHE_TEMPLATES_DE
- Reviews mention: Zahlung bei Lieferung, Lieferung in Deutschland, Expresskurier
- Natural German customer voice, not literal word-for-word`;

async function translateOne(
  plPath: string,
  dePath: string,
  header: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
) {
  const cache = path.join(CACHE, path.basename(dePath));
  if (!force && fs.existsSync(cache)) {
    fs.writeFileSync(path.join(ROOT, dePath), fs.readFileSync(cache, "utf8"), "utf8");
    console.log(`  cached ${dePath}`);
    return;
  }
  const source = fs.readFileSync(path.join(ROOT, plPath), "utf8");
  const chunks = [source];
  const parts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} ${plPath}`);
    parts.push(
      await callLLM(
        apiKey,
        url,
        model,
        SYSTEM,
        `${header}\n\nChunk ${i + 1}/${chunks.length}:\n\n${chunks[i]}`,
      ),
    );
  }
  let out = parts.join("\n")
    .replace(/PlReviewBody/g, "DeReviewBody")
    .replace(/CATEGORY_PL_BODIES/g, "CATEGORY_DE_BODIES")
    .replace(/NICHE_TEMPLATES_PL/g, "NICHE_TEMPLATES_DE")
    .replace(/translate-reviews-pl/g, "translate-reviews-de");
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(cache, out, "utf8");
  fs.writeFileSync(path.join(ROOT, dePath), out, "utf8");
  console.log(`  written ${dePath}`);
}

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");
  const apiKey = process.env.AI_API_KEY!;
  const url = process.env.AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";
  if (!apiKey) {
    console.error("Missing AI_API_KEY");
    process.exit(1);
  }

  await translateOne(
    "src/data/review-templates-cat.pl.ts",
    "src/data/review-templates-cat.de.ts",
    "/** German review bodies by category slug. */",
    apiKey,
    url,
    model,
    force,
  );
  await translateOne(
    "src/data/review-templates-niche.pl.ts",
    "src/data/review-templates-niche.de.ts",
    "/** German review slots by niche. */",
    apiKey,
    url,
    model,
    force,
  );
  await translateOne(
    "src/data/review-templates-slug.pl.ts",
    "src/data/review-templates-slug.de.ts",
    "/** German review slots by category slug. */",
    apiKey,
    url,
    model,
    force,
  );
  await translateOne(
    "src/data/review-templates-theme.pl.ts",
    "src/data/review-templates-theme.de.ts",
    "/** German review slots by theme. */",
    apiKey,
    url,
    model,
    force,
  );
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
