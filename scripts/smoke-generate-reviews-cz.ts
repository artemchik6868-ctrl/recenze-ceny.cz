/**
 * Smoke: generate Czech product reviews via OpenRouter / AI gateway.
 *
 *   npx tsx scripts/smoke-generate-reviews-cz.ts
 *   npx tsx scripts/smoke-generate-reviews-cz.ts --model=google/gemini-2.5-flash --force
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REVIEW_GEN_SYSTEM_CS,
  buildReviewGenUserCs,
  alignStoredReviews,
  type StoredReview,
} from "../src/lib/review-gen-prompt.cs.ts";
import { audienceFor, buildReviewSlots } from "../src/lib/reviews.ts";
import type { OfferSource } from "../src/lib/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function resolveFormKind(
  source: string,
  offerId: number,
  stored: string | null | undefined,
): Promise<string> {
  try {
    const { isImageFactsSource } = await import("../src/lib/image-facts.ts");
    if (isImageFactsSource(source)) {
      const { getInjectableImageFacts } = await import("../src/lib/image-facts.server.ts");
      const { formHintFromStructuredFacts } = await import(
        "../src/lib/ai-content-pipeline.cs.ts"
      );
      const img = await getInjectableImageFacts(source as OfferSource, offerId);
      if (img.facts) {
        const hint = formHintFromStructuredFacts({
          releaseForm: img.facts.releaseForm,
          application: img.facts.application,
          form: img.facts.releaseForm,
        });
        if (hint?.formKind) return hint.formKind;
      }
    }
  } catch {
    // fall through
  }
  const fromContent = stored?.trim();
  if (fromContent && fromContent !== "unknown") return fromContent;
  return "unknown";
}

function loadEnv(): void {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] !== undefined && process.env[key] !== "") continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[key] = v;
  }
}

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function stripCodeFences(s: string): string {
  return s.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

async function callOpenRouter(
  apiKey: string,
  url: string,
  model: string,
  system: string,
  user: string,
): Promise<{ content: string; modelUsed: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://recenze-ceny.cz",
      "X-Title": "recenze-ceny-review-smoke",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 4096,
      temperature: 0.75,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return { content: stripCodeFences(content), modelUsed: json.model ?? model };
}

const TARGET_CATS = [
  "klouby",
  "prostata",
  "hubnuti",
  "plisen-nehtu",
] as const;

async function loadProductsFromCatalog() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const { loadOffers } = await import("../src/lib/offers.server.ts");
    const offers = await loadOffers();
    const picked: Array<{
      id: number;
      source: string;
      displayTitle: string;
      brand: string;
      categorySlug: string;
      audience: ReturnType<typeof audienceFor>;
      formKind: string;
      context: string;
    }> = [];
    for (const cat of TARGET_CATS) {
      const o = offers.find((x) => x.categorySlug === cat);
      if (!o) continue;
      const title =
        o.displayTitle?.trim() ||
        [o.brand, o.title].filter(Boolean).join(" — ") ||
        o.title;
      const context =
        (o.subtitle?.trim() || o.metaDesc?.trim() || "").slice(0, 220) ||
        `Produkt v kategorii ${o.categorySlug}.`;
      picked.push({
        id: o.id,
        source: o.source,
        displayTitle: title,
        brand: o.brand || title.split(/\s+/)[0] || "Produkt",
        categorySlug: o.categorySlug,
        audience: audienceFor(o.categorySlug),
        formKind: await resolveFormKind(o.source, o.id, o.formKind),
        context,
      });
    }
    return picked.length >= 3 ? picked : null;
  } catch (e) {
    console.warn("Catalog load failed:", (e as Error).message);
    return null;
  }
}

async function main() {
  loadEnv();
  const model = arg("model") || process.env.AI_MODEL || "google/gemini-2.5-flash";
  const apiKey = process.env.AI_API_KEY || process.env.LOVABLE_API_KEY;
  const url =
    process.env.AI_GATEWAY_URL ||
    "https://openrouter.ai/api/v1/chat/completions";
  if (!apiKey) {
    console.error("Missing AI_API_KEY");
    process.exit(1);
  }

  const products = await loadProductsFromCatalog();
  if (!products?.length) {
    console.error("No catalog products");
    process.exit(1);
  }
  console.log(`Using ${products.length} offers, model=${model}`);

  const cacheDir = resolve(root, "scripts/.cache/smoke-reviews-cz");
  const outDir = resolve(root, "scripts/out");
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const report: {
    generatedAt: string;
    requestedModel: string;
    products: Array<Record<string, unknown>>;
  } = {
    generatedAt: new Date().toISOString(),
    requestedModel: model,
    products: [],
  };

  for (const p of products) {
    const slots = buildReviewSlots(p.id, p.categorySlug);
    const user = buildReviewGenUserCs(p, slots);
    const cacheKey = `${p.source}-${p.id}-${model.replace(/[/:]+/g, "_")}.json`;
    const cachePath = resolve(cacheDir, cacheKey);

    console.log(`\n=== ${p.source}:${p.id} ${p.categorySlug} forma=${p.formKind} — ${p.displayTitle} ===`);
    console.log(
      "slots:",
      slots.map((s) => `${s.gender}/${s.rating}★/age${s.age}`).join(", "),
    );

    try {
      let content: string;
      let modelUsed: string;
      if (existsSync(cachePath) && !process.argv.includes("--force")) {
        const cached = JSON.parse(readFileSync(cachePath, "utf8")) as {
          content: string;
          modelUsed: string;
        };
        content = cached.content;
        modelUsed = cached.modelUsed;
        console.log("(cache hit)");
      } else {
        const res = await callOpenRouter(apiKey, url, model, REVIEW_GEN_SYSTEM_CS, user);
        content = res.content;
        modelUsed = res.modelUsed;
        writeFileSync(
          cachePath,
          JSON.stringify({ content, modelUsed, user }, null, 2),
          "utf8",
        );
      }

      const parsed = JSON.parse(content) as { reviews?: StoredReview[] };
      const aligned = alignStoredReviews(slots, parsed.reviews ?? []);
      report.products.push({
        id: p.id,
        source: p.source,
        displayTitle: p.displayTitle,
        categorySlug: p.categorySlug,
        formKind: p.formKind,
        modelUsed,
        reviews: aligned,
      });
      for (const r of aligned) {
        console.log(`\n[${r.gender}] ${r.rating}★ age=${r.age}`);
        console.log(r.text);
      }
    } catch (e) {
      console.error("FAIL:", (e as Error).message);
      report.products.push({
        id: p.id,
        source: p.source,
        error: (e as Error).message,
      });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = resolve(outDir, `smoke-reviews-cz-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nWrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
