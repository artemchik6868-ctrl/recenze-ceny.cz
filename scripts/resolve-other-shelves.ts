/**
 * Resolve catalog shelf for offers stuck in category `other`.
 *
 * Tier A — inferProductIntentSlug + classifyTitleFirst(partner blob)
 * Tier B — resolveShelfFromText(title, feed, blob)
 * Tier C — lightweight LLM save_shelf_slug (SL prompts)
 *
 * Usage:
 *   npx tsx scripts/resolve-other-shelves.ts [--dry-run]
 *   npx tsx scripts/resolve-other-shelves.ts --llm [--regen] [--pause-ms=800]
 *   npx tsx scripts/resolve-other-shelves.ts --only=cpagetti:16999 --llm --dry-run
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALLOWED_SHELF_SLUGS,
  resolveShelfFromText,
  validateShelfSlug,
} from "../src/lib/catalog-shelf";
import { persistResolvedCategorySlug } from "../src/lib/catalog-shelf.server";
import { buildCatalogShelfGuideSL, buildProductCopyBrief } from "../src/lib/ai-content.sl-prompts";
import { classifyTitleFirst } from "../src/lib/classify";
import { inferProductIntentSlug } from "../src/lib/product-intent.sl";
import { inferProductRoleSl } from "../src/lib/product-role.sl";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import { detectProductFacts } from "../src/lib/product-facts";
import { normalizeProductTitle } from "../src/lib/brand-clean";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");
const useLlm = process.argv.includes("--llm");
const doRegen = process.argv.includes("--regen");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice(8)) : 999;
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;
const pauseArg = process.argv.find((a) => a.startsWith("--pause-ms="));
const pauseMs = pauseArg ? Number(pauseArg.slice(11)) : 800;

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",

};

async function loadRaw(source: OfferSource, offerId: number): Promise<unknown> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { data } = await supabaseAdmin
    .from(TABLE[source])
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  return (data as { raw?: unknown } | null)?.raw ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const SHELF_TOOL = {
  type: "function",
  function: {
    name: "save_shelf_slug",
    description: "Določi estanterijo kataloga",
    parameters: {
      type: "object",
      properties: {
        shelf_slug: { type: "string", enum: ALLOWED_SHELF_SLUGS },
      },
      required: ["shelf_slug"],
      additionalProperties: false,
    },
  },
};

async function resolveViaLlm(brief: ReturnType<typeof buildProductCopyBrief>): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const url = process.env.AI_GATEWAY_URL ?? "https://ai-gateway.vercel.sh/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";
  const guide = buildCatalogShelfGuideSL(brief);
  if (!guide.trim()) return null;
  const prompt = `${guide}\n\nKlasificiraj in pokliči save_shelf_slug.`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Katalogizator e-trgovine SI. Samo tool call." },
          { role: "user", content: prompt },
        ],
        tools: [SHELF_TOOL],
        tool_choice: { type: "function", function: { name: "save_shelf_slug" } },
        max_tokens: 256,
      }),
    });
    if (!res.ok) {
      console.warn(`  LLM HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args) as { shelf_slug?: string };
    return validateShelfSlug(parsed.shelf_slug);
  } catch (err) {
    console.warn(`  LLM err: ${err}`);
    return null;
  }
}

type RescueResult = {
  key: string;
  slug: string;
  tier: "A-intent" | "A-classify" | "B" | "C";
};

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

let candidates = offers.filter((o) => o.categorySlug === "other");
if (onlyKeys) {
  candidates = candidates.filter((o) => onlyKeys.has(`${o.source}:${o.id}`));
}
candidates = candidates.slice(0, limit);

console.log(
  `\n=== resolve-other-shelves — ${candidates.length} offers (dry=${dryRun} llm=${useLlm} regen=${doRegen}) ===\n`,
);

const rescued: RescueResult[] = [];
let skip = 0;

for (const o of candidates) {
  const key = `${o.source}:${o.id}`;
  const title = o.displayTitle || o.title || o.brand || "";
  const feedCat = o.categoryKey || o.categoryName || "";
  const raw = await loadRaw(o.source, o.id);
  const blob = raw
    ? buildPartnerClassifyBlob(o.source, raw, title, feedCat)
    : String(feedCat);

  let slug: string | null = null;
  let tier: RescueResult["tier"] | null = null;

  const intent = inferProductIntentSlug(title, o.brand);
  if (intent && intent !== "other") {
    slug = validateShelfSlug(intent);
    if (slug) tier = "A-intent";
  }

  if (!slug) {
    const expected = classifyTitleFirst(title, blob, "other");
    if (expected !== "other") {
      slug = validateShelfSlug(expected);
      if (slug) tier = "A-classify";
    }
  }

  if (!slug) {
    const det = resolveShelfFromText(title, feedCat, blob);
    if (det) {
      slug = validateShelfSlug(det);
      if (slug) tier = "B";
    }
  }

  if (!slug && useLlm) {
    const preRole = inferProductRoleSl(o.title, normalizeProductTitle(o.title) || o.title);
    const brief = buildProductCopyBrief({
      rawTitle: o.title,
      displayH1: title,
      categorySlug: "other",
      facts: detectProductFacts(o.title, blob, blob.slice(0, 300)),
      feedCleaned: blob,
      productRole: preRole ?? undefined,
    });
    slug = await resolveViaLlm(brief);
    if (slug) tier = "C";
    if (pauseMs > 0) await sleep(pauseMs);
  }

  if (!slug || slug === "other") {
    skip += 1;
    console.log(`SKIP ${key} reason=still-other | ${title.slice(0, 50)}`);
    continue;
  }

  if (dryRun) {
    rescued.push({ key, slug, tier: tier! });
    console.log(`DRY  ${key} tier=${tier} → ${slug} | ${title.slice(0, 40)}`);
    continue;
  }

  const saved = await persistResolvedCategorySlug(o.source, o.id, slug);
  if (saved) {
    rescued.push({ key, slug: saved, tier: tier! });
    console.log(`OK   ${key} tier=${tier} → ${saved} | ${title.slice(0, 40)}`);
  } else {
    skip += 1;
    console.log(`FAIL ${key} tier=${tier} invalid slug=${slug}`);
  }
}

console.log(`\nRescue — resolved=${rescued.length} skip=${skip}`);

if (doRegen && rescued.length > 0 && !dryRun) {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");

  const keysWithContent = new Set<string>();
  for (const r of rescued) {
    const [source, idStr] = r.key.split(":");
    const { data } = await supabaseAdmin
      .from("product_content")
      .select("offer_id")
      .eq("source", source)
      .eq("offer_id", Number(idStr))
      .not("description_html_uk", "is", null)
      .maybeSingle();
    if (data) keysWithContent.add(r.key);
  }

  console.log(`\n=== regen rescued with product_content (${keysWithContent.size}) ===\n`);

  let regenOk = 0;
  let regenFail = 0;
  for (const r of rescued) {
    if (!keysWithContent.has(r.key)) continue;
    const offer = byKey.get(r.key);
    if (!offer) continue;
    const [source, idStr] = r.key.split(":");
    try {
      const out = await getOrGenerateProductContent(
        source as OfferSource,
        Number(idStr),
        "uk",
        r.slug,
        { forceRegen: true },
      );
      if (out?.description_html && out.description_html.length >= 400) {
        regenOk += 1;
        console.log(`REGEN OK ${r.key} html=${out.description_html.length} tier=${out.content_tier}`);
      } else {
        regenFail += 1;
        console.log(`REGEN FAIL ${r.key}`);
      }
    } catch (err) {
      regenFail += 1;
      console.log(`REGEN ERR ${r.key}: ${err}`);
    }
  }
  console.log(`\nRegen — ok=${regenOk} fail=${regenFail}`);
}

console.log(`\nDone — resolved=${rescued.length} skip=${skip}`);
