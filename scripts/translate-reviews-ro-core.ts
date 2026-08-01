/**
 * LLM translate review-templates-*.de.ts → native *.ro.ts
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
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return stripCodeFences(content);
}

const SYSTEM = `Translate German review template TypeScript to native Czech Republicn (cs-CZ) for recenze-ceny.cz.
- Output ONLY valid TypeScript, no fences
- Keep sl() helper, gender g:"m"|"f", structure identical
- Rename DeReviewBody → CsReviewBody, CATEGORY_DE_BODIES → CATEGORY_CS_BODIES, NICHE_TEMPLATES_DE → NICHE_TEMPLATES_CS
- Reviews mention: Plata la livrare, livrare în Česká republika, curier rapid
- Natural Czech Republicn customer voice, not literal word-for-word
- No German words in review text`;

async function translateOne(
  dePath: string,
  roPath: string,
  header: string,
  apiKey: string,
  url: string,
  model: string,
  force: boolean,
) {
  const cache = path.join(CACHE, path.basename(roPath));
  if (!force && fs.existsSync(cache)) {
    fs.writeFileSync(path.join(ROOT, roPath), fs.readFileSync(cache, "utf8"), "utf8");
    console.log(`  cached ${roPath}`);
    return;
  }
  const source = fs.readFileSync(path.join(ROOT, dePath), "utf8");
  const lines = source.split("\n");
  const mid = Math.ceil(lines.length / 2);
  const chunks =
    lines.length > 400
      ? [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")]
      : [source];
  const parts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  chunk ${i + 1}/${chunks.length} ${dePath}`);
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
  let out = parts
    .join("\n")
    .replace(/DeReviewBody/g, "CsReviewBody")
    .replace(/CATEGORY_DE_BODIES/g, "CATEGORY_CS_BODIES")
    .replace(/NICHE_TEMPLATES_DE/g, "NICHE_TEMPLATES_CS")
    .replace(/REVIEW_SLOTS_BY_THEME_DE/g, "REVIEW_SLOTS_BY_THEME_RO")
    .replace(/\.de"/g, '.ro"')
    .replace(/translate-reviews-de/g, "translate-reviews-cz");
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(cache, out, "utf8");
  fs.writeFileSync(path.join(ROOT, roPath), out, "utf8");
  console.log(`  written ${roPath}`);
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

  const jobs: Array<[string, string, string]> = [
    ["src/data/review-templates-cat.de.ts", "src/data/review-templates-cat.ro.ts", "/** Czech Republicn review bodies by category slug. */"],
    ["src/data/review-templates-niche.de.ts", "src/data/review-templates-niche.ro.ts", "/** Czech Republicn review slots by niche. */"],
    ["src/data/review-templates-slug.de.ts", "src/data/review-templates-slug.ro.ts", "/** Czech Republicn review slots by category slug. */"],
    ["src/data/review-templates-theme.de.ts", "src/data/review-templates-theme.ro.ts", "/** Czech Republicn review slots by theme. */"],
  ];

  for (const [de, ro, header] of jobs) {
    console.log(`Translating ${de} → ${ro}`);
    await translateOne(de, ro, header, apiKey, url, model, force);
  }
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
