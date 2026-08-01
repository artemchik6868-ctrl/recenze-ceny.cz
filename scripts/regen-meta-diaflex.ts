/**
 * Regenerate only meta title + description (steps 4–5) for DiaFlex Forte.
 * Usage: npx tsx scripts/regen-meta-diaflex.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getCpaTlRawOffer } from "../src/lib/cpa-tl-sync.server";
import { MARKET_GEO } from "../src/lib/market";
import {
  buildStep4Prompt,
  buildStep5Prompt,
  feedPriceFromParts,
  parseJsonFromLlm,
  PIPELINE_SYSTEM,
  type Step4Result,
  type Step5Result,
} from "../src/lib/ai-content-pipeline.bg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const source = "cpa_tl" as const;
const id = 23632;
const DEFAULT_AI_GATEWAY_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_AI_MODEL = "google/gemini-2.5-flash";

function gateway() {
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY or LOVABLE_API_KEY not configured");
  return {
    url: process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL,
    apiKey,
    model: process.env.AI_MODEL ?? DEFAULT_AI_MODEL,
  };
}

async function callJsonStep<T>(
  step: string,
  userPrompt: string,
  maxTokens: number,
  systemExtra?: string,
): Promise<T> {
  const gw = gateway();
  const system = systemExtra ? `${PIPELINE_SYSTEM}\n\n${systemExtra}` : PIPELINE_SYSTEM;
  const res = await fetch(gw.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gw.apiKey}`,
      "Content-Type": "application/json",
      ...(gw.url.includes("openrouter.ai")
        ? {
            "HTTP-Referer": process.env.SITE_URL ?? "https://recenze-ceny.cz",
            "X-Title": "offer-pulse-showcase",
          }
        : {}),
    },
    body: JSON.stringify({
      model: gw.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { choices: Array<{ message: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("empty AI response");
  console.log(`[ai-usage] step=${step} ok`);
  return parseJsonFromLlm<T>(content);
}

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const { data: row } = await supabaseAdmin
  .from("product_content")
  .select("display_title_uk,title_uk,meta_desc_uk")
  .eq("source", source)
  .eq("offer_id", id)
  .maybeSingle();

const displayTitle = row?.display_title_uk?.trim();
if (!displayTitle) {
  console.error("No display_title_uk — run full regen first");
  process.exit(1);
}

const raw = await getCpaTlRawOffer(id);
const goal = raw?.goals?.find((g) => g.geo === MARKET_GEO);
const feedPrice = goal
  ? feedPriceFromParts(goal.landing_price, goal.landing_currency ?? MARKET_GEO)
  : null;

console.log(`regen meta — ${displayTitle}\n`);
const t0 = Date.now();

const step4 = await callJsonStep<Step4Result>(
  "step4",
  buildStep4Prompt(displayTitle, feedPrice),
  256,
);
const metaTitle = step4.title?.trim() || displayTitle;

const step5 = await callJsonStep<Step5Result>(
  "step5",
  buildStep5Prompt(displayTitle, feedPrice),
  512,
);
const metaDesc = step5.meta_desc?.trim() || "";

const { error } = await supabaseAdmin
  .from("product_content")
  .update({ title_uk: metaTitle, meta_desc_uk: metaDesc })
  .eq("source", source)
  .eq("offer_id", id);

if (error) {
  console.error("DB update failed:", error.message);
  process.exit(1);
}

console.log(`ms: ${Date.now() - t0}`);
console.log(`meta_title: ${metaTitle}`);
console.log(`meta_desc: ${metaDesc}`);
console.log(`url: https://recenze-ceny.cz/nervous-system/diaflex-23632`);
