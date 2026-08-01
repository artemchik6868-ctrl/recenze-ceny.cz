/**
 * Dump step1/step2 prompt inputs for shakes:21040 and optionally run step1+step2 LLM.
 * Usage: npx tsx scripts/diagnose-step12-21040.ts [--run-llm]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(): void {
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    const key = m[1].trim();
    if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
  }
}

const OFFER = 21040;
const runLlm = process.argv.includes("--run-llm");

async function main(): Promise<void> {
  loadEnv();

  const { getShakesRawOffer, pickLandingUrl } = await import("../src/lib/shakes-sync.server.ts");
  const { cleanFeedTitleWithDescriptor, normalizeProductTitle, splitBrandAndTail } = await import(
    "../src/lib/brand-clean.ts"
  );
  const { buildPartnerClassifyBlob } = await import("../src/lib/partner-feed-text.ts");
  const { buildStep1Prompt, buildStep2Prompt, buildPipelineFormHint } = await import(
    "../src/lib/ai-content-pipeline.hu.ts"
  );
  const { cleanForSource } = await import("../src/lib/source-cleaners.ts");
  const { detectProductFacts } = await import("../src/lib/product-facts.ts");
  const { classifyTitleFirst } = await import("../src/lib/classify.ts");
  const { inferProductRoleCs } = await import("../src/lib/product-role.hu.ts");
  const { inferShakesLandingTokenSlug } = await import("../src/lib/shakes-landing-tokens.hu.ts");
  const { mechanicalBgDisplayTitleFromFeed } = await import("../src/lib/offer-display.ts");
  const { titleGarbledReason } = await import("../src/lib/title-translate.server.ts");
  const { findOfferById } = await import("../src/lib/offers.server.ts");

  const raw = await getShakesRawOffer(OFFER);
  if (!raw) {
    console.error("shakes raw offer not found");
    process.exit(1);
  }
  const o = await findOfferById(OFFER);
  const rawTitle = String(raw.title ?? `Offer ${OFFER}`);
  const title =
    cleanFeedTitleWithDescriptor(rawTitle) || normalizeProductTitle(rawTitle) || rawTitle;
  const classifyBlob = buildPartnerClassifyBlob("shakes", raw, title, "");
  const landing = raw.landing_url_it ?? pickLandingUrl(raw);
  const description = [title, landing, classifyBlob].filter(Boolean).join(" — ");
  const { cleaned, warnings } = cleanForSource("shakes", description);
  const preFacts = detectProductFacts(title, "", description);
  const preCategorySlug = classifyTitleFirst(
    title,
    description.replace(/\s{2,}/g, " ").trim().slice(0, 400),
    o?.categorySlug ?? "stres",
  );
  const formHint = buildPipelineFormHint({
    formKind: preFacts.kind !== "unknown" ? preFacts.kind : null,
    categorySlug: preCategorySlug,
  });

  console.log("=== RAW OFFER shakes:21040 ===");
  console.log("raw.title:", rawTitle);
  console.log("step1 Cím (title):", title);
  console.log("landing_url_it:", raw.landing_url_it ?? "(none)");
  console.log("pickLandingUrl:", landing ?? "(none)");
  console.log("classifyBlob:", classifyBlob);
  console.log("landings:", raw.landings?.length ?? 0);
  for (const [i, l] of (raw.landings ?? []).slice(0, 8).entries()) {
    console.log(`  [${i}] url=${l.url}`);
    if (l.title) console.log(`      title=${l.title}`);
  }

  console.log("\n=== STEP1 Leírás (description passed to buildStep1Prompt) ===");
  console.log(description);
  console.log("\ncleaned (used later in step3+):", cleaned);
  if (warnings?.length) console.log("cleaner warnings:", warnings);

  console.log("\n=== CLASSIFICATION / MECHANICAL ===");
  console.log("catalog categorySlug:", o?.categorySlug);
  console.log("preCategorySlug:", preCategorySlug);
  console.log("facts.kind:", preFacts.kind);
  console.log("formHint:", JSON.stringify(formHint));
  console.log("inferShakesLandingTokenSlug:", inferShakesLandingTokenSlug(description));
  console.log("inferProductRoleCs:", inferProductRoleCs(description));
  const mech = mechanicalBgDisplayTitleFromFeed({
    rawTitle: title,
    brand: o?.brand ?? "Reishield",
    categorySlug: o?.categorySlug ?? "stres",
    feedSnippet: description,
    formKind: preFacts.kind !== "unknown" ? preFacts.kind : null,
  });
  console.log("mechanicalBgDisplayTitleFromFeed:", mech);
  console.log("mechanical titleGarbledReason:", titleGarbledReason(mech ?? ""));

  const step1Prompt = buildStep1Prompt(title, description, formHint);
  console.log("\n=== STEP1 PROMPT ===");
  console.log(step1Prompt);

  if (!runLlm) {
    console.log("\n=== STEP2 (skipped — pass --run-llm to call API) ===");
    console.log("step2 receives ONLY step1 headline + formHint (no landing/description)");
    return;
  }

  if (!process.env.AI_API_KEY && !process.env.LOVABLE_API_KEY) {
    console.error("Missing AI_API_KEY");
    process.exit(1);
  }

  const { sanitizeDisplayTitle } = await import("../src/lib/brand-clean.ts");
  const { parseJsonFromLlm, PIPELINE_SYSTEM } = await import("../src/lib/ai-content-pipeline.hu.ts");

  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY!;
  const url = process.env.AI_GATEWAY_URL ?? "https://ai-gateway.vercel.sh/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";

  async function llmJson<T>(stepName: string, userPrompt: string, maxTokens: number): Promise<{
    parsed: T;
    completion_tokens: number;
  }> {
    const system = PIPELINE_SYSTEM;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`${stepName} HTTP ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { completion_tokens?: number };
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    return {
      parsed: parseJsonFromLlm<T>(content),
      completion_tokens: data.usage?.completion_tokens ?? 0,
    };
  }

  type Step1Result = { headline?: string };
  type Step2Result = { display_title_hu?: string };

  console.log("\n=== RUNNING STEP1 LLM ===");
  const step1 = await llmJson<Step1Result>("step1", step1Prompt, 512);
  const headlineClean =
    sanitizeDisplayTitle(step1.parsed.headline?.trim()) ||
    cleanFeedTitleWithDescriptor(title) ||
    title.trim();
  console.log("step1 headline:", headlineClean);
  console.log("step1 completion_tokens:", step1.completion_tokens);

  const step2Prompt = buildStep2Prompt(headlineClean, formHint);
  console.log("\n=== STEP2 PROMPT (actual, from step1 output) ===");
  console.log(step2Prompt);

  console.log("\n=== RUNNING STEP2 LLM ===");
  const step2 = await llmJson<Step2Result>("step2", step2Prompt, 512);
  const displayTitle = step2.parsed.display_title_hu?.trim() || headlineClean;
  const { brand, tail } = splitBrandAndTail(displayTitle);
  console.log("step2 display_title_hu:", displayTitle);
  console.log("step2 completion_tokens:", step2.completion_tokens);
  console.log("titleGarbledReason:", titleGarbledReason(displayTitle));
  console.log("brand:", brand, "| tail:", tail);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
