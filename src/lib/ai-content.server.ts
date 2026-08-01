import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCpaTlRawOffer } from "./cpa-tl-sync.server";
import { getKmaRawOffer, type KmaRawOffer } from "./kma.server";
import { getM1TopRawOffer } from "./m1-top-sync.server";
import { getCpagettiRawOffer } from "./cpagetti-sync.server";
import { getAdcomboRawOffer } from "./adcombo-sync.server";
import { getShakesRawOffer, pickLandingUrl } from "./shakes-sync.server";
import { buildPartnerClassifyBlob, pickAdcomboDescriptionForPipeline } from "./partner-feed-text";
import {
  cleanFeedTitleWithDescriptor,
  sanitizeDisplayTitle,
  splitBrandAndTail,
  normalizeProductTitle,
  extractLockedLatinBrand,
} from "./brand-clean";
import { validateShelfSlug } from "./catalog-shelf";
import { SHELF_OVERRIDES } from "./catalog-shelf-overrides";
import { persistResolvedCategorySlug } from "./catalog-shelf.server";
import { cleanForSource } from "./source-cleaners";
import { detectProductFacts, factsForKind } from "./product-facts";
import { classifyTitleFirst } from "./classify";
import {
  MARKET_GEO,
  PDP_CONTENT_SLOT,
  PDP_LEGACY_ALT_SLOT,
  isPdpContentSlot,
  readPdpSlotRow,
} from "./market";
import type { OfferSource } from "./types";
import type { ShakesRawOffer } from "./shakes-sync.server";
import {
  buildFeedContextBlock,
  buildStep1Prompt,
  buildStep2Prompt,
  buildStep3Prompt,
  buildStep4Prompt,
  buildStep5Prompt,
  buildStep6Prompt,
  buildStep6bPrompt,
  buildStep7Prompt,
  buildPipelineFormHint,
  brandFormLockCs,
  formHintFromStructuredFacts,
  preferStructuredFormHint,
  reconcileDisplayTitleWithForm,
  parseJsonFromLlm,
  parseHtmlFromLlm,
  traceParseHtmlFromLlm,
  validateStep6Html,
  validateStep6bOpinion,
  EXPERT_OPINION_SECTION_HEADING,
  STEP6_HTML_MIN_CHARS,
  STEP6_HTML_MIN_H2,
  STEP6_HTML_MAX_ATTEMPTS,
  PIPELINE_SYSTEM,
  PIPELINE_STEP6_SYSTEM,
  feedPriceFromParts,
  type FeedContextExtra,
  type FeedPrice,
  type Step1Result,
  type Step2Result,
  type Step3Result,
  type Step4Result,
  type Step5Result,
  type Step6bResult,
  type Step7Result,
  type PipelineFormHint,
} from "./ai-content-pipeline.cs";
import {
  REVIEW_GEN_SYSTEM_CS,
  buildReviewGenUserCs,
  alignStoredReviews,
  type StoredReview,
} from "./review-gen-prompt.cs";
import { audienceFor, buildReviewSlots } from "./review-slots-gen";
import { buildProductCopyBrief, buildFormVsCategoryGuideBG } from "./ai-content.cs-prompts";
import { buildFormFewShotsBlock } from "./ai-content.examples.cs";
import { buildProductBrief } from "./product-brief";
import { validateGenerated, type QAResult } from "./qa-validator";
import { isYmylCategory } from "./niche-types";
import {
  classifyQaRetryStep,
  shouldRunPipelineStep,
  releasePipelineBudgetForPartialRetry,
  ensurePipelineDeadline,
  PIPELINE_MAX_COMPLETION_BUDGET,
  type PipelineRetryStep,
} from "./pipeline-retry";
import { titleGarbledReason } from "./title-translate.server";

const DEFAULT_AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_AI_MODEL = "google/gemini-2.5-flash";
const STEP_MAX_TOKENS = 6000;
const FAQ_MAX_TOKENS = 2500;
const REVIEWS_MAX_TOKENS = 4096;
const EXPERT_OPINION_MAX_TOKENS = 1024;
const AI_REQUEST_TIMEOUT_MS = 25_000;
const AI_HEAVY_REQUEST_TIMEOUT_MS = 60_000;
const AI_MAX_ATTEMPTS = 3;
const AI_JSON_PARSE_MAX_ATTEMPTS = 3;
const AI_RETRY_BASE_DELAY_MS = 700;
const PIPELINE_MAX_COMPLETION_TOKENS = PIPELINE_MAX_COMPLETION_BUDGET;
const PIPELINE_MAX_TOTAL_TOKENS = 28_000;

export const PIPELINE_VERSION = "v85-cz-llm-reviews";
const QA_PIPELINE_MAX_ATTEMPTS = 5;

export type ContentTier = "ai" | "failed";

export type AIProductContent = {
  title: string;
  subtitle: string;
  meta_desc: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
  /** LLM customer reviews (cs); empty if not yet generated. */
  reviews: StoredReview[];
  display_title: string;
  description_html?: string;
  content_tier?: ContentTier;
  qa_status?: string | null;
  /** product_content.generated_at — prefer over catalog cache for PDP "Aktualizováno". */
  generated_at?: string | null;
};

export type LlmUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type PipelineMetrics = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestedCompletionTokens: number;
  attempts: number;
  retries: number;
  durationMs: number;
};

export type GenerationStatus = "generated" | "cache_hit" | "cached_after_failure" | "failed";

export type GenerateContentResult = {
  content: AIProductContent | null;
  status: GenerationStatus;
  metrics?: PipelineMetrics;
  error?: string;
  saved?: boolean;
};

type Lang = "uk" | "ru";

type PromptSource = {
  title: string;
  category: string;
  description: string;
  priceKey: string;
  feedPrice: FeedPrice | null;
  feedExtra: FeedContextExtra;
};

function promptFeedPrice(amount: unknown, currency: unknown): FeedPrice | null {
  const raw = feedPriceFromParts(amount, currency);
  if (!raw) return null;
  return {
    amount: Math.round(raw.amount),
    currency: raw.currency,
  };
}

function kmaFeedPrice(itemprice: unknown): FeedPrice | null {
  if (!itemprice || typeof itemprice !== "object") return null;
  const raw = (itemprice as Record<string, string>)[MARKET_GEO];
  if (!raw) return null;
  const text = String(raw).trim();
  const m = text.match(/(\d+(?:\.\d+)?)\s*([A-Za-z]{3})?/);
  if (!m) return null;
  return promptFeedPrice(Number(m[1]), (m[2] ?? "EUR").toUpperCase());
}

function shakesFeedPrice(o: ShakesRawOffer): FeedPrice | null {
  const goal = (o.goals ?? []).find((g) => String(g.geo ?? "").toUpperCase() === MARKET_GEO);
  const fromGoal = goal
    ? promptFeedPrice(goal.landing_price, goal.landing_currency ?? "EUR")
    : null;
  if (fromGoal) return fromGoal;
  return promptFeedPrice(o.landing_price, "EUR");
}

type ExistingRow = {
  source_hash: string;
  title_uk: string;
  subtitle_uk: string;
  meta_desc_uk: string;
  display_title_uk: string | null;
  intro_uk: string;
  sections_uk: unknown;
  faq_uk: unknown;
  reviews_uk?: unknown;
  description_html_uk: string | null;
  title_ru: string | null;
  subtitle_ru: string | null;
  meta_desc_ru: string | null;
  display_title_ru: string | null;
  intro_ru: string | null;
  sections_ru: unknown;
  faq_ru: unknown;
  description_html_ru: string | null;
  qa_status_uk?: string | null;
  qa_status_ru?: string | null;
  qa_reason_uk?: string | null;
  qa_reason_ru?: string | null;
  generated_at?: string | null;
};

const BRAND_STOP_WORDS = new Set<string>([
  "крем",
  "мазь",
  "гель",
  "спрей",
  "капли",
  "краплі",
  "капсулы",
  "капсули",
  "таблетки",
  "сироп",
  "шампунь",
  "для",
  "и",
  "та",
  "на",
  "с",
  "з",
  "от",
  "від",
  "товар",
  "средство",
  "засіб",
]);

const LATIN_TOKEN_RE = /^[A-Za-z][A-Za-z0-9'-]{1,30}$/;

export function stripBrandFromText(text: string, ...brandSources: string[]): string {
  const original = (text ?? "").trim();
  if (!original) return original;
  const tokens = new Set<string>();
  for (const src of brandSources) {
    if (!src) continue;
    for (const tok of String(src).split(/[\s\-—–_:,.]+/)) {
      const t = tok.trim();
      if (t.length < 3) continue;
      const low = t.toLocaleLowerCase("uk-UA");
      if (BRAND_STOP_WORDS.has(low)) continue;
      if (LATIN_TOKEN_RE.test(t)) {
        tokens.add(t);
        continue;
      }
      if (/^[А-ЯЁІЇЄҐ][а-яёіїєґ'’-]{2,}$/u.test(t)) tokens.add(t);
    }
  }
  if (tokens.size === 0) return original;
  let s = original;
  for (const tok of tokens) {
    const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(
      new RegExp(`[\\s,]+(?:з|с|із|от|від|with|by|от\\s+)?\\s*${esc}\\s*[.!?]?\\s*$`, "iu"),
      "",
    );
    s = s.replace(new RegExp(`^${esc}\\s*[-—–:,]\\s*`, "iu"), "");
    s = s.replace(new RegExp(`\\b${esc}\\b`, "gi"), "");
  }
  s = s
    .replace(/\s{2,}/g, " ")
    .replace(/^[,;:\-—–\s]+|[,;:\-—–\s]+$/g, "")
    .trim();
  if (!s || s.length < original.length * 0.6) return original;
  return s;
}

export function deriveContentTier(
  qaStatus: string | null | undefined,
  _qaReason: string | null | undefined,
  descriptionHtml: string | null | undefined,
): ContentTier {
  const htmlLen = descriptionHtml?.length ?? 0;
  if (qaStatus === "failed" || htmlLen < 100) return "failed";
  return "ai";
}

export function contentNeedsRegen(tier: ContentTier | undefined): boolean {
  return tier === "failed" || tier === undefined;
}

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function resolveAiGateway(): {
  url: string;
  apiKey: string;
  model: string;
} | null {
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  return {
    url: process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL,
    apiKey,
    model: process.env.AI_MODEL ?? DEFAULT_AI_MODEL,
  };
}

function aiGatewayHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (process.env.AI_GATEWAY_URL?.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.SITE_URL ?? "https://recenze-ceny.cz";
    headers["X-Title"] = "recenze-ceny";
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function emptyUsage(): LlmUsage {
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
}

function coerceUsage(
  usage: Partial<LlmUsage> | null | undefined,
  systemContent: string,
  userPrompt: string,
  content: string,
): LlmUsage {
  const promptTokens =
    typeof usage?.prompt_tokens === "number" && Number.isFinite(usage.prompt_tokens)
      ? usage.prompt_tokens
      : estimateTokens(systemContent) + estimateTokens(userPrompt);
  const completionTokens =
    typeof usage?.completion_tokens === "number" && Number.isFinite(usage.completion_tokens)
      ? usage.completion_tokens
      : estimateTokens(content);
  const totalTokens =
    typeof usage?.total_tokens === "number" && Number.isFinite(usage.total_tokens)
      ? usage.total_tokens
      : promptTokens + completionTokens;
  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
  };
}

function summarizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isRetryableGatewayError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name.toLowerCase();
  const msg = err.message.toLowerCase();
  return (
    name.includes("timeout") ||
    name.includes("abort") ||
    msg.includes("terminated") ||
    msg.includes("socket") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("gateway 429") ||
    msg.includes("gateway 500") ||
    msg.includes("gateway 502") ||
    msg.includes("gateway 503") ||
    msg.includes("gateway 504")
  );
}

function logLlmUsage(
  stepName: string,
  usage: LlmUsage,
  meta: {
    durationMs: number;
    attempts: number;
    maxTokens: number;
  },
) {
  console.info(
    `[ai-usage] step=${stepName} prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens} requested=${meta.maxTokens} attempts=${meta.attempts} ms=${meta.durationMs}`,
  );
}

function ensurePipelineBudget(metrics: PipelineMetrics, nextRequestedCompletionTokens = 0): void {
  if (
    metrics.requestedCompletionTokens + nextRequestedCompletionTokens >
    PIPELINE_MAX_COMPLETION_TOKENS
  ) {
    throw new Error(
      `AI pipeline completion budget exceeded: requested=${metrics.requestedCompletionTokens + nextRequestedCompletionTokens}`,
    );
  }
  if (metrics.totalTokens > PIPELINE_MAX_TOTAL_TOKENS) {
    throw new Error(
      `AI pipeline token budget exceeded: used=${metrics.totalTokens} max=${PIPELINE_MAX_TOTAL_TOKENS}`,
    );
  }
}

function addPipelineMetrics(
  metrics: PipelineMetrics,
  usage: LlmUsage,
  attempts: number,
  durationMs: number,
  requestedCompletionTokens: number,
): void {
  metrics.promptTokens += usage.prompt_tokens;
  metrics.completionTokens += usage.completion_tokens;
  metrics.totalTokens += usage.total_tokens;
  metrics.requestedCompletionTokens += requestedCompletionTokens;
  metrics.attempts += attempts;
  metrics.retries += Math.max(0, attempts - 1);
  metrics.durationMs += durationMs;
}

async function callLlm(
  stepName: string,
  userPrompt: string,
  maxTokens: number,
  systemExtra?: string,
  timeoutMs: number = AI_REQUEST_TIMEOUT_MS,
  systemBase: string = PIPELINE_SYSTEM,
): Promise<{ content: string; usage: LlmUsage; attempts: number; durationMs: number }> {
  const gw = resolveAiGateway();
  if (!gw) throw new Error("AI_API_KEY or LOVABLE_API_KEY not configured");

  const systemContent = systemExtra ? `${systemBase}\n\n${systemExtra}` : systemBase;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(gw.url, {
        method: "POST",
        headers: aiGatewayHeaders(gw.apiKey),
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model: gw.model,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        choices: Array<{ message: { content?: string } }>;
        usage?: Partial<LlmUsage>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("AI gateway returned empty content");
      const usage = coerceUsage(json.usage, systemContent, userPrompt, content);
      const durationMs = Date.now() - started;
      logLlmUsage(stepName, usage, { durationMs, attempts: attempt, maxTokens });
      return { content, usage, attempts: attempt, durationMs };
    } catch (err) {
      lastErr = err;
      if (attempt >= AI_MAX_ATTEMPTS || !isRetryableGatewayError(err)) break;
      const delayMs = AI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[ai-usage] retry step=${stepName} attempt=${attempt} delay_ms=${delayMs} reason=${summarizeError(err)}`,
      );
      await sleep(delayMs);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function callLlmWithJsonParse<T>(
  stepName: string,
  userPrompt: string,
  maxTokens: number,
  systemExtra?: string,
  timeoutMs: number = AI_REQUEST_TIMEOUT_MS,
): Promise<{
  parsed: T;
  usage: LlmUsage;
  attempts: number;
  durationMs: number;
  jsonRetries: number;
}> {
  let lastErr: unknown;
  let jsonRetries = 0;
  for (let parseAttempt = 1; parseAttempt <= AI_JSON_PARSE_MAX_ATTEMPTS; parseAttempt++) {
    const resp = await callLlm(stepName, userPrompt, maxTokens, systemExtra, timeoutMs);
    try {
      return {
        parsed: parseJsonFromLlm<T>(resp.content),
        usage: resp.usage,
        attempts: resp.attempts,
        durationMs: resp.durationMs,
        jsonRetries,
      };
    } catch (err) {
      lastErr = err;
      jsonRetries++;
      if (parseAttempt < AI_JSON_PARSE_MAX_ATTEMPTS) {
        console.warn(
          `[ai-usage] json-retry step=${stepName} attempt=${parseAttempt} reason=${summarizeError(err)}`,
        );
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function callLlmWithFinishReason(
  stepName: string,
  userPrompt: string,
  maxTokens: number,
  systemExtra?: string,
  timeoutMs: number = AI_REQUEST_TIMEOUT_MS,
  systemBase: string = PIPELINE_SYSTEM,
): Promise<{
  content: string;
  usage: LlmUsage;
  attempts: number;
  durationMs: number;
  finish_reason: string | null;
}> {
  const gw = resolveAiGateway();
  if (!gw) throw new Error("AI_API_KEY or LOVABLE_API_KEY not configured");

  const systemContent = systemExtra ? `${systemBase}\n\n${systemExtra}` : systemBase;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(gw.url, {
        method: "POST",
        headers: aiGatewayHeaders(gw.apiKey),
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model: gw.model,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        choices: Array<{ message: { content?: string }; finish_reason?: string }>;
        usage?: Partial<LlmUsage>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("AI gateway returned empty content");
      const usage = coerceUsage(json.usage, systemContent, userPrompt, content);
      const durationMs = Date.now() - started;
      logLlmUsage(stepName, usage, { durationMs, attempts: attempt, maxTokens });
      return {
        content,
        usage,
        attempts: attempt,
        durationMs,
        finish_reason: json.choices?.[0]?.finish_reason ?? null,
      };
    } catch (err) {
      lastErr = err;
      if (attempt >= AI_MAX_ATTEMPTS || !isRetryableGatewayError(err)) break;
      const delayMs = AI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[ai-usage] retry step=${stepName} attempt=${attempt} delay_ms=${delayMs} reason=${summarizeError(err)}`,
      );
      await sleep(delayMs);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function callLlmWithHtmlParse(
  stepName: string,
  userPrompt: string,
  maxTokens: number,
  systemExtra?: string,
  timeoutMs: number = AI_HEAVY_REQUEST_TIMEOUT_MS,
): Promise<{
  html: string;
  usage: LlmUsage;
  attempts: number;
  durationMs: number;
  htmlRetries: number;
}> {
  let lastErr: unknown;
  let htmlRetries = 0;
  for (let parseAttempt = 1; parseAttempt <= STEP6_HTML_MAX_ATTEMPTS; parseAttempt++) {
    const resp = await callLlm(
      stepName,
      userPrompt,
      maxTokens,
      systemExtra,
      timeoutMs,
      PIPELINE_STEP6_SYSTEM,
    );
    try {
      const html = parseHtmlFromLlm(resp.content);
      validateStep6Html(html);
      return {
        html,
        usage: resp.usage,
        attempts: resp.attempts,
        durationMs: resp.durationMs,
        htmlRetries,
      };
    } catch (err) {
      lastErr = err;
      htmlRetries++;
      if (parseAttempt < STEP6_HTML_MAX_ATTEMPTS) {
        console.warn(
          `[ai-usage] html-retry step=${stepName} attempt=${parseAttempt} reason=${summarizeError(err)}`,
        );
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function kmaDescriptorFromName(name: string): string {
  const dash = name.match(/\s[-—–]\s+(.+)/);
  if (dash?.[1]) return dash[1].replace(/\s*\|.*$/, "").trim();
  const pipe = name.split("|")[1];
  return pipe?.trim() ?? "";
}

async function buildPromptSource(
  source: OfferSource,
  offerId: number,
): Promise<PromptSource | null> {
  if (source === "cpa_tl") {
    const raw = await getCpaTlRawOffer(offerId);
    if (!raw) return null;
    const inGoal = raw.goals?.find((g) => g.geo === MARKET_GEO);
    const feedPrice = inGoal
      ? promptFeedPrice(inGoal.landing_price, inGoal.landing_currency ?? MARKET_GEO)
      : null;
    const priceKey = inGoal ? `${inGoal.landing_price ?? ""}|${inGoal.landing_currency ?? ""}` : "";
    return {
      title: raw.title,
      category: raw.category,
      description: raw.description || "",
      priceKey,
      feedPrice,
      feedExtra: {
        category: raw.category,
        feedPrice,
      },
    };
  }
  if (source === "m1_top") {
    const raw = await getM1TopRawOffer(offerId);
    if (!raw) return null;
    const inT = raw.target?.find((t) => t.code === MARKET_GEO);
    const feedPrice = inT ? promptFeedPrice(inT.price, inT.currency) : null;
    const priceKey = inT ? `${inT.price ?? ""}|${inT.currency ?? ""}` : "";
    return {
      title: raw.name,
      category: raw.info || "",
      description: raw.info || "",
      priceKey,
      feedPrice,
      feedExtra: { info: raw.info || "", feedPrice },
    };
  }
  if (source === "adcombo") {
    const raw = await getAdcomboRawOffer(offerId);
    if (!raw) return null;
    const cats = (raw.categories ?? []).join(", ");
    const feedPrice = promptFeedPrice(raw.order_price_it, raw.order_currency_it ?? "EUR");
    const priceKey = `${raw.order_price_it ?? ""}|${raw.order_currency_it ?? "EUR"}`;
    const desc = pickAdcomboDescriptionForPipeline(raw.description);
    return {
      title: String(raw.name ?? `Offer ${raw.id}`),
      category: cats,
      description: [cats, desc].filter(Boolean).join(" — "),
      priceKey,
      feedPrice,
      feedExtra: { category: cats, info: desc, feedPrice },
    };
  }
  if (source === "shakes") {
    const raw = await getShakesRawOffer(offerId);
    if (!raw) return null;
    const goal = raw.goals?.find((g) => String(g.geo ?? "").toUpperCase() === MARKET_GEO);
    const feedPrice = shakesFeedPrice(raw);
    const priceKey = goal
      ? `${goal.landing_price ?? ""}|${goal.landing_currency ?? "EUR"}`
      : `${raw.landing_price ?? ""}|EUR`;
    const rawTitle = String(raw.title ?? `Offer ${raw.id}`);
    const title =
      cleanFeedTitleWithDescriptor(rawTitle) ||
      normalizeProductTitle(rawTitle) ||
      rawTitle;
    const feedCategory = String(raw.category ?? "").trim();
    const classifyBlob = buildPartnerClassifyBlob("shakes", raw, title, feedCategory);
    const landing = raw.landing_url_it ?? pickLandingUrl(raw);
    const description = [title, landing, classifyBlob].filter(Boolean).join(" — ");
    return {
      title,
      category: feedCategory,
      description,
      priceKey,
      feedPrice,
      feedExtra: {
        feedPrice,
        category: feedCategory || undefined,
        info: classifyBlob || undefined,
      },
    };
  }
  if (source === "cpagetti") {
    const raw = await getCpagettiRawOffer(offerId);
    if (!raw) return null;
    const cat =
      typeof raw.category === "string"
        ? raw.category
        : ((raw.category as { name?: string } | undefined)?.name ?? "");
    const rawName = String(raw.name ?? raw.title ?? `Offer ${raw.id}`);
    const cleanedName = cleanFeedTitleWithDescriptor(rawName) || rawName;
    const cpagettiCurrency = raw.in_geo?.priceCurrencyCode ?? "EUR";
    const feedPrice = promptFeedPrice(raw.in_geo?.price, cpagettiCurrency);
    return {
      title: cleanedName,
      category: cat,
      description: String(raw.description ?? ""),
      priceKey: `${raw.in_geo?.price ?? raw.price ?? ""}|${cpagettiCurrency}`,
      feedPrice,
      feedExtra: { category: cat, feedPrice },
    };
  }
  const raw: KmaRawOffer | null = await getKmaRawOffer(offerId);
  if (!raw) return null;
  const cat =
    raw.category && typeof raw.category === "object"
      ? Object.values(raw.category as Record<string, string>).join(", ")
      : "";
  const descriptor = kmaDescriptorFromName(raw.name);
  const feedPrice = kmaFeedPrice(raw.itemprice);
  return {
    title: raw.name,
    category: cat,
    description: descriptor,
    priceKey: `${raw.itemprice?.[MARKET_GEO] ?? ""}|${raw.comission?.[MARKET_GEO] ?? ""}`,
    feedPrice,
    feedExtra: { category: cat, info: descriptor, feedPrice },
  };
}

function computeSourceHash(
  src: PromptSource,
  cleaned: string,
  landingUrlHash?: string | null,
): string {
  let base = `${PIPELINE_VERSION}|${src.title}|${src.category}|${cleaned}|${src.priceKey}`;
  // Only append when facts exist — avoids mass regen of all offers on deploy.
  if (landingUrlHash && landingUrlHash !== "none") {
    base = `${base}|lf:${landingUrlHash}`;
  }
  return hash(base);
}

/** Exported for unit tests — source_hash includes feed priceKey. */
export function computeSourceHashForTest(
  src: { title: string; category: string; priceKey: string },
  cleaned: string,
  landingUrlHash?: string | null,
): string {
  return computeSourceHash(src, cleaned, landingUrlHash);
}

/** Parse step 3 LLM output — exactly one AI shelf slug. */
function parseStep3Category(step3: Step3Result & { categories?: string[] }): string | null {
  const candidate =
    step3.category?.trim() || (Array.isArray(step3.categories) ? step3.categories[0]?.trim() : "");
  return validateShelfSlug(candidate);
}

function rowToDto(row: ExistingRow, lang: Lang): AIProductContent | null {
  if (!isPdpContentSlot(lang)) return null;
  const record = row as unknown as Record<string, unknown>;
  const slot = readPdpSlotRow(record, lang);
  // Reviews historically live only on the primary (*_uk) slot columns.
  const reviewSlot = readPdpSlotRow(record, PDP_CONTENT_SLOT);
  const reviews = Array.isArray(reviewSlot.reviews)
    ? (reviewSlot.reviews as StoredReview[])
    : [];
  if (lang === PDP_LEGACY_ALT_SLOT && (!slot.title || !slot.faq)) return null;
  const disp = slot.display_title ?? "";
  const html = slot.description_html ?? "";
  return {
    title: slot.title ?? "",
    subtitle: stripBrandFromText(slot.subtitle ?? "", disp),
    meta_desc: slot.meta_desc ?? "",
    display_title: disp,
    intro: slot.intro ?? "",
    sections: (slot.sections as AIProductContent["sections"]) ?? [],
    faq: (slot.faq as AIProductContent["faq"]) ?? [],
    reviews,
    description_html: html,
    content_tier: deriveContentTier(slot.qa_status, slot.qa_reason, html),
    qa_status: slot.qa_status ?? null,
    generated_at: row.generated_at ?? null,
  };
}

function pipelineResultToContent(result: {
  displayTitle: string;
  subtitle: string;
  metaTitle: string;
  metaDesc: string;
  html: string;
  faq: { q: string; a: string }[];
  reviews: StoredReview[];
  sections: { heading: string; body: string }[];
}): AIProductContent {
  return {
    title: result.metaTitle,
    subtitle: result.subtitle,
    meta_desc: result.metaDesc,
    intro: "",
    sections: result.sections,
    faq: result.faq,
    reviews: result.reviews,
    display_title: result.displayTitle,
    description_html: result.html,
  };
}

type PipelineRunResult = {
  displayTitle: string;
  subtitle: string;
  metaTitle: string;
  metaDesc: string;
  html: string;
  faq: { q: string; a: string }[];
  reviews: StoredReview[];
  sections: { heading: string; body: string }[];
  categories: string[];
  formKind: string | null;
  metrics: PipelineMetrics;
};

type PipelineState = {
  source: OfferSource;
  offerId: number;
  src: PromptSource;
  cleaned: string;
  feedContext: string;
  formHint: PipelineFormHint | null;
  preFacts: ReturnType<typeof detectProductFacts>;
  /** Shelf from rich landing facts — preferred over step3 brand guess. */
  landingShelf?: string | null;
  metrics: PipelineMetrics;
  step2QaHint?: string | null;
  headlineClean?: string;
  displayTitle?: string;
  subtitle?: string;
  categories?: string[];
  metaTitle?: string;
  metaDesc?: string;
  html?: string;
  sections?: { heading: string; body: string }[];
  faq?: { q: string; a: string }[];
  reviews?: StoredReview[];
};

function newPipelineMetrics(): PipelineMetrics {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestedCompletionTokens: 0,
    attempts: 0,
    retries: 0,
    durationMs: 0,
  };
}

function resolvePreFactsWithBrandLock(
  preFacts: ReturnType<typeof detectProductFacts>,
  categorySlug: string,
  rawTitle: string,
): ReturnType<typeof detectProductFacts> {
  const brand =
    extractLockedLatinBrand(rawTitle) || splitBrandAndTail(rawTitle).brand.trim() || null;
  const locked = brandFormLockCs(rawTitle, brand, categorySlug);
  if (!locked) return preFacts;
  return factsForKind(locked.formKind) ?? preFacts;
}

function resolvePreCategorySlug(
  source: OfferSource,
  offerId: number,
  title: string,
  category: string,
  cleaned: string,
): string {
  const forced = validateShelfSlug(SHELF_OVERRIDES[`${source}:${offerId}`]);
  if (forced) return forced;
  return classifyTitleFirst(
    title,
    `${category} ${cleaned}`.replace(/\s{2,}/g, " ").trim().slice(0, 400),
    "other",
  );
}

function buildFormHintForSource(
  preFacts: ReturnType<typeof detectProductFacts>,
  categorySlug: string,
  rawTitle: string,
  feedSnippet: string,
): PipelineFormHint | null {
  const brand =
    extractLockedLatinBrand(rawTitle) || splitBrandAndTail(rawTitle).brand.trim() || null;
  const locked = brandFormLockCs(rawTitle, brand, categorySlug);
  if (locked) return locked;
  return buildPipelineFormHint({
    formKind: preFacts.kind !== "unknown" ? preFacts.kind : null,
    categorySlug,
    rawTitle,
    feedSnippet,
    brand,
  });
}

function refreshPipelineFormContext(state: PipelineState): void {
  const categorySlug = state.categories?.[0] ?? "other";
  const detected = detectProductFacts(
    state.src.title,
    state.src.category,
    state.src.description,
  );
  state.preFacts = resolvePreFactsWithBrandLock(detected, categorySlug, state.src.title);
  state.formHint = buildFormHintForSource(
    state.preFacts,
    categorySlug,
    state.src.title,
    state.cleaned,
  );
}

function buildPipelineFormGuideBlockFromParts(input: {
  rawTitle: string;
  displayTitle: string;
  categorySlug: string;
  preFacts: ReturnType<typeof detectProductFacts>;
  cleaned: string;
}): string {
  const brief = buildProductCopyBrief({
    rawTitle: input.rawTitle,
    displayH1: input.displayTitle,
    categorySlug: input.categorySlug,
    facts: input.preFacts,
    feedCleaned: input.cleaned,
  });
  const parts: string[] = [];
  const vsCategory = buildFormVsCategoryGuideBG(brief);
  if (vsCategory.trim()) parts.push(vsCategory);
  const fewShots = buildFormFewShotsBlock(
    brief.formKind,
    brief.categorySlug,
    `${brief.cleanBrand} ${brief.rawTitle}`,
    {
      cleanBrand: brief.cleanBrand,
      rawTitle: brief.rawTitle,
      displayH1: brief.displayH1,
      productRole: brief.productRole,
      feedCleaned: brief.feedCleaned,
    },
  );
  if (fewShots.trim()) parts.push(fewShots);
  return parts.join("\n\n");
}

function buildPipelineFormGuideBlock(state: PipelineState): string {
  if (!state.displayTitle) return "";
  return buildPipelineFormGuideBlockFromParts({
    rawTitle: state.src.title,
    displayTitle: state.displayTitle,
    categorySlug: state.categories?.[0] ?? "other",
    preFacts: state.preFacts,
    cleaned: state.cleaned,
  });
}

async function initPipelineState(
  source: OfferSource,
  offerId: number,
): Promise<PipelineState | null> {
  const src = await buildPromptSource(source, offerId);
  if (!src) return null;

  const { cleaned } = cleanForSource(source, src.description);
  let feedContext = buildFeedContextBlock(source, src.description, src.feedExtra);
  let landingShelf: string | null = null;
  let structuredFormHint: ReturnType<typeof formHintFromStructuredFacts> = null;

  // Production: read cached landing facts from DB (no live fetch).
  // Smoke: LANDING_FACTS_LIVE / LANDING_FACTS_LLM still force live extract.
  if (source === "shakes") {
    const {
      isLandingFactsLiveEnabled,
      isLandingFactsLlmEnabled,
      loadLiveShakesLandingFacts,
      loadLiveShakesLandingFactsWithLlm,
      getInjectableShakesLandingFacts,
    } = await import("./landing-facts.server");
    try {
      if (isLandingFactsLiveEnabled() || isLandingFactsLlmEnabled()) {
        const live = isLandingFactsLlmEnabled()
          ? await loadLiveShakesLandingFactsWithLlm(offerId)
          : await loadLiveShakesLandingFacts(offerId);
        console.info(
          `[landing-facts] live ${live.method ?? "heuristic"} ${source}:${offerId} status=${live.status} lang=${live.langHint} fetchMs=${live.timing.fetchMs} extractMs=${live.timing.extractMs} jsonChars=${live.jsonChars}`,
        );
        if (live.promptBlock) {
          feedContext = [feedContext, live.promptBlock].filter(Boolean).join("\n\n").trim();
        }
        const { shouldInjectLandingFacts } = await import("./landing-facts");
        const decision = shouldInjectLandingFacts({
          status: live.status,
          langHint: live.langHint,
          sourceUrl: live.sourceUrl,
          facts: live.facts,
        });
        landingShelf = decision.shelf;
        if (decision.facts) {
          structuredFormHint = formHintFromStructuredFacts({
            form: decision.facts.form,
            application: decision.facts.application,
          });
        }
      } else {
        const cached = await getInjectableShakesLandingFacts(offerId);
        if (cached.promptBlock) {
          feedContext = [feedContext, cached.promptBlock].filter(Boolean).join("\n\n").trim();
          console.info(
            `[landing-facts] db ${source}:${offerId} injected shelf=${cached.shelf ?? "-"}`,
          );
        }
        landingShelf = cached.shelf;
        if (cached.facts) {
          structuredFormHint = formHintFromStructuredFacts({
            form: cached.facts.form,
            application: cached.facts.application,
          });
        }
      }
    } catch (err) {
      console.warn(
        `[landing-facts] inject failed ${source}:${offerId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Production: read cached landing facts from DB (no live fetch).
  // Smoke: CPA_TL_LANDING_FACTS_LIVE / LLM still force live extract.
  if (source === "cpa_tl") {
    const {
      isCpaTlLandingFactsLiveEnabled,
      isCpaTlLandingFactsLlmEnabled,
      loadLiveCpaTlLandingFacts,
      loadLiveCpaTlLandingFactsWithLlm,
      getInjectableCpaTlLandingFacts,
    } = await import("./landing-facts.server");
    try {
      if (isCpaTlLandingFactsLiveEnabled() || isCpaTlLandingFactsLlmEnabled()) {
        const live = isCpaTlLandingFactsLlmEnabled()
          ? await loadLiveCpaTlLandingFactsWithLlm(offerId)
          : await loadLiveCpaTlLandingFacts(offerId);
        console.info(
          `[landing-facts] live cpa_tl ${live.method ?? "heuristic"} ${source}:${offerId} status=${live.status} lang=${live.langHint} url=${live.sourceUrl} fetchMs=${live.timing.fetchMs} extractMs=${live.timing.extractMs} jsonChars=${live.jsonChars}`,
        );
        if (live.promptBlock) {
          feedContext = [feedContext, live.promptBlock].filter(Boolean).join("\n\n").trim();
        }
        const { shouldInjectLandingFacts } = await import("./landing-facts");
        // Feed language_code=cz already selected the URL — treat as CS for shelf.
        const decision = shouldInjectLandingFacts({
          status: live.status,
          langHint: "cs",
          sourceUrl: live.sourceUrl,
          facts: live.facts,
        });
        landingShelf = decision.shelf;
        if (decision.facts) {
          structuredFormHint = formHintFromStructuredFacts({
            form: decision.facts.form,
            application: decision.facts.application,
          });
        }
      } else {
        const cached = await getInjectableCpaTlLandingFacts(offerId);
        if (cached.promptBlock) {
          feedContext = [feedContext, cached.promptBlock].filter(Boolean).join("\n\n").trim();
          console.info(
            `[landing-facts] db cpa_tl:${offerId} injected shelf=${cached.shelf ?? "-"}`,
          );
        }
        landingShelf = cached.shelf;
        if (cached.facts) {
          structuredFormHint = formHintFromStructuredFacts({
            form: cached.facts.form,
            application: cached.facts.application,
          });
        }
      }
    } catch (err) {
      console.warn(
        `[landing-facts] cpa_tl inject failed ${source}:${offerId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Production: read cached landing facts from DB (no live fetch).
  // Smoke: M1_TOP_LANDING_FACTS_LIVE / LLM still force live extract.
  if (source === "m1_top") {
    const {
      isM1TopLandingFactsLiveEnabled,
      isM1TopLandingFactsLlmEnabled,
      loadLiveM1TopLandingFacts,
      loadLiveM1TopLandingFactsWithLlm,
      getInjectableM1TopLandingFacts,
    } = await import("./landing-facts.server");
    try {
      if (isM1TopLandingFactsLiveEnabled() || isM1TopLandingFactsLlmEnabled()) {
        const live = isM1TopLandingFactsLlmEnabled()
          ? await loadLiveM1TopLandingFactsWithLlm(offerId)
          : await loadLiveM1TopLandingFacts(offerId);
        console.info(
          `[landing-facts] live m1_top ${live.method ?? "heuristic"} ${source}:${offerId} status=${live.status} lang=${live.langHint} url=${live.sourceUrl} fetchMs=${live.timing.fetchMs} extractMs=${live.timing.extractMs} jsonChars=${live.jsonChars}`,
        );
        if (live.promptBlock) {
          feedContext = [feedContext, live.promptBlock].filter(Boolean).join("\n\n").trim();
        }
        const { shouldInjectLandingFacts } = await import("./landing-facts");
        const decision = shouldInjectLandingFacts({
          status: live.status,
          langHint: "cs",
          sourceUrl: live.sourceUrl,
          facts: live.facts,
        });
        landingShelf = decision.shelf;
        if (decision.facts) {
          structuredFormHint = formHintFromStructuredFacts({
            form: decision.facts.form,
            application: decision.facts.application,
          });
        }
      } else {
        const cached = await getInjectableM1TopLandingFacts(offerId);
        if (cached.promptBlock) {
          feedContext = [feedContext, cached.promptBlock].filter(Boolean).join("\n\n").trim();
          console.info(
            `[landing-facts] db m1_top:${offerId} injected shelf=${cached.shelf ?? "-"}`,
          );
        }
        landingShelf = cached.shelf;
        if (cached.facts) {
          structuredFormHint = formHintFromStructuredFacts({
            form: cached.facts.form,
            application: cached.facts.application,
          });
        }
      }
    } catch (err) {
      console.warn(
        `[landing-facts] m1_top inject failed ${source}:${offerId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Cached vision facts from product image (all image-facts sources).
  // Vision form overrides landing when both exist (packaging is visible ground truth).
  try {
    const { getInjectableImageFacts } = await import("./image-facts.server");
    const { isImageFactsSource } = await import("./image-facts");
    if (isImageFactsSource(source)) {
      const img = await getInjectableImageFacts(source, offerId);
      if (img.promptBlock) {
        feedContext = [feedContext, img.promptBlock].filter(Boolean).join("\n\n").trim();
        console.info(`[image-facts] db ${source}:${offerId} injected`);
      }
      if (img.facts) {
        const fromImg = formHintFromStructuredFacts({
          releaseForm: img.facts.releaseForm,
          application: img.facts.application,
        });
        if (fromImg) structuredFormHint = fromImg;
      }
    }
  } catch (err) {
    console.warn(
      `[image-facts] inject failed ${source}:${offerId}:`,
      err instanceof Error ? err.message : err,
    );
  }

  const detectedFacts = detectProductFacts(src.title, src.category, src.description);
  let preCategorySlug = resolvePreCategorySlug(
    source,
    offerId,
    src.title,
    src.category,
    cleaned,
  );
  // Prefer rich landing shelf over brand/title guess (Cordyceps multi-SKU fix).
  if (landingShelf) {
    preCategorySlug = landingShelf;
  }
  const preFacts = resolvePreFactsWithBrandLock(detectedFacts, preCategorySlug, src.title);
  const brand =
    extractLockedLatinBrand(src.title) || splitBrandAndTail(src.title).brand.trim() || null;
  const brandLocked = Boolean(brandFormLockCs(src.title, brand, preCategorySlug));
  const heuristicFormHint = buildFormHintForSource(
    preFacts,
    preCategorySlug,
    src.title,
    cleaned,
  );
  const formHint = preferStructuredFormHint(
    heuristicFormHint,
    structuredFormHint,
    brandLocked,
  );

  return {
    source,
    offerId,
    src,
    cleaned,
    feedContext,
    formHint,
    preFacts,
    landingShelf,
    metrics: newPipelineMetrics(),
  };
}

function pipelineStateToResult(state: PipelineState): PipelineRunResult {
  if (
    !state.displayTitle ||
    !state.subtitle ||
    !state.metaTitle ||
    !state.metaDesc ||
    !state.html ||
    !state.faq ||
    !state.reviews ||
    !state.categories
  ) {
    throw new Error(`Pipeline state incomplete for ${state.source}:${state.offerId}`);
  }
  return {
    displayTitle: state.displayTitle,
    subtitle: state.subtitle,
    metaTitle: state.metaTitle,
    metaDesc: state.metaDesc,
    html: state.html,
    faq: state.faq,
    reviews: state.reviews,
    sections: state.sections ?? [],
    categories: state.categories,
    formKind: state.preFacts.kind !== "unknown" ? state.preFacts.kind : null,
    metrics: state.metrics,
  };
}

async function runPipelineStep1(state: PipelineState): Promise<void> {
  ensurePipelineBudget(state.metrics, STEP_MAX_TOKENS);
  const forced = validateShelfSlug(SHELF_OVERRIDES[`${state.source}:${state.offerId}`]);
  const categoryCue = forced
    ? `Katalogová kategorie (pevně): ${forced}. Značka ≠ kategorie — H1 popis musí odpovídat této kategorii (ne názvu houby/značky).\n\n`
    : "";
  const step1 = await callLlmWithJsonParse<Step1Result>(
    "step1",
    buildStep1Prompt(state.src.title, `${categoryCue}${state.src.description}`, state.formHint),
    STEP_MAX_TOKENS,
  );
  addPipelineMetrics(
    state.metrics,
    step1.usage,
    step1.attempts,
    step1.durationMs,
    STEP_MAX_TOKENS,
  );
  state.metrics.retries += step1.jsonRetries;
  ensurePipelineBudget(state.metrics);
  state.headlineClean =
    sanitizeDisplayTitle(step1.parsed.headline?.trim()) ||
    cleanFeedTitleWithDescriptor(state.src.title) ||
    state.src.title.trim();
}

async function runPipelineStep2(state: PipelineState): Promise<void> {
  if (!state.headlineClean) {
    throw new Error(`Step 2 requires headline for ${state.source}:${state.offerId}`);
  }
  ensurePipelineBudget(state.metrics, 512);
  const step2 = await callLlmWithJsonParse<Step2Result>(
    "step2",
    buildStep2Prompt(state.headlineClean, state.formHint, { qaHint: state.step2QaHint }),
    512,
  );
  addPipelineMetrics(state.metrics, step2.usage, step2.attempts, step2.durationMs, 512);
  state.metrics.retries += step2.jsonRetries;
  state.step2QaHint = null;
  ensurePipelineBudget(state.metrics);
  state.displayTitle = step2.parsed.display_title_cs?.trim() || state.headlineClean;
  const { tail: descriptorTail } = splitBrandAndTail(state.displayTitle);
  state.subtitle = sanitizeDisplayTitle(descriptorTail) || state.displayTitle;
}

async function runPipelineStep3(state: PipelineState): Promise<void> {
  if (!state.displayTitle) {
    throw new Error(`Step 3 requires displayTitle for ${state.source}:${state.offerId}`);
  }
  const forced =
    validateShelfSlug(SHELF_OVERRIDES[`${state.source}:${state.offerId}`]) ||
    validateShelfSlug(state.landingShelf);
  if (forced) {
    console.info(`[ai-content] step3 shelf override ${state.source}:${state.offerId} → ${forced}`);
    state.categories = [forced];
    refreshPipelineFormContext(state);
    return;
  }
  ensurePipelineBudget(state.metrics, 1024);
  const step3 = await callLlmWithJsonParse<Step3Result & { categories?: string[] }>(
    "step3",
    buildStep3Prompt(state.displayTitle, state.feedContext || state.cleaned),
    1024,
  );
  addPipelineMetrics(state.metrics, step3.usage, step3.attempts, step3.durationMs, 1024);
  state.metrics.retries += step3.jsonRetries;
  ensurePipelineBudget(state.metrics);
  const category = parseStep3Category(step3.parsed);
  if (!category) {
    throw new Error(`Step 3 returned no valid category for ${state.source}:${state.offerId}`);
  }
  state.categories = [category];
  refreshPipelineFormContext(state);
}

async function runPipelineStep4(state: PipelineState): Promise<void> {
  if (!state.displayTitle) {
    throw new Error(`Step 4 requires displayTitle for ${state.source}:${state.offerId}`);
  }
  ensurePipelineBudget(state.metrics, 256);
  const step4 = await callLlmWithJsonParse<Step4Result>(
    "step4",
    buildStep4Prompt(state.displayTitle, state.src.feedPrice),
    256,
  );
  addPipelineMetrics(state.metrics, step4.usage, step4.attempts, step4.durationMs, 256);
  state.metrics.retries += step4.jsonRetries;
  ensurePipelineBudget(state.metrics);
  state.metaTitle = step4.parsed.title?.trim() || state.displayTitle;
}

async function runPipelineStep5(state: PipelineState): Promise<void> {
  if (!state.displayTitle || !state.subtitle) {
    throw new Error(`Step 5 requires displayTitle for ${state.source}:${state.offerId}`);
  }
  ensurePipelineBudget(state.metrics, 512);
  const step5 = await callLlmWithJsonParse<Step5Result>(
    "step5",
    buildStep5Prompt(state.displayTitle, state.src.feedPrice),
    512,
  );
  addPipelineMetrics(state.metrics, step5.usage, step5.attempts, step5.durationMs, 512);
  state.metrics.retries += step5.jsonRetries;
  ensurePipelineBudget(state.metrics);
  state.metaDesc = step5.parsed.meta_desc?.trim() || state.subtitle;
}

async function runPipelineStep6(state: PipelineState): Promise<void> {
  if (!state.displayTitle) {
    throw new Error(`Step 6 requires displayTitle for ${state.source}:${state.offerId}`);
  }
  ensurePipelineBudget(state.metrics, STEP_MAX_TOKENS);
  const step6 = await callLlmWithHtmlParse(
    "step6",
    buildStep6Prompt(
      state.displayTitle,
      state.feedContext,
      state.src.feedPrice,
      state.src.feedExtra.category?.trim() || state.src.category?.trim() || null,
      state.categories?.[0] ?? null,
      state.formHint,
      buildPipelineFormGuideBlock(state),
    ),
    STEP_MAX_TOKENS,
  );
  addPipelineMetrics(
    state.metrics,
    step6.usage,
    step6.attempts,
    step6.durationMs,
    STEP_MAX_TOKENS,
  );
  state.metrics.retries += step6.htmlRetries;
  ensurePipelineBudget(state.metrics);
  state.html = step6.html;
}

async function runPipelineStep6b(state: PipelineState): Promise<void> {
  const category = state.categories?.[0] ?? "other";
  if (!isYmylCategory(category)) {
    state.sections = [];
    return;
  }
  if (!state.displayTitle) {
    throw new Error(`Step 6b requires displayTitle for ${state.source}:${state.offerId}`);
  }
  ensurePipelineBudget(state.metrics, EXPERT_OPINION_MAX_TOKENS);
  const step6b = await callLlmWithJsonParse<Step6bResult>(
    "step6b",
    buildStep6bPrompt(state.displayTitle, state.feedContext),
    EXPERT_OPINION_MAX_TOKENS,
  );
  addPipelineMetrics(
    state.metrics,
    step6b.usage,
    step6b.attempts,
    step6b.durationMs,
    EXPERT_OPINION_MAX_TOKENS,
  );
  state.metrics.retries += step6b.jsonRetries;
  ensurePipelineBudget(state.metrics);
  const expertOpinion = step6b.parsed.expert_opinion?.trim() ?? "";
  validateStep6bOpinion(expertOpinion);
  state.sections = [{ heading: EXPERT_OPINION_SECTION_HEADING, body: expertOpinion }];
}

async function runPipelineStep7(state: PipelineState): Promise<void> {
  if (!state.displayTitle) {
    throw new Error(`Step 7 requires displayTitle for ${state.source}:${state.offerId}`);
  }
  ensurePipelineBudget(state.metrics, FAQ_MAX_TOKENS);
  const step7 = await callLlmWithJsonParse<Step7Result>(
    "step7",
    buildStep7Prompt(
      state.displayTitle,
      state.feedContext,
      state.formHint,
      buildPipelineFormGuideBlock(state),
    ),
    FAQ_MAX_TOKENS,
    undefined,
    AI_HEAVY_REQUEST_TIMEOUT_MS,
  );
  addPipelineMetrics(
    state.metrics,
    step7.usage,
    step7.attempts,
    step7.durationMs,
    FAQ_MAX_TOKENS,
  );
  state.metrics.retries += step7.jsonRetries;
  ensurePipelineBudget(state.metrics);
  const faq = Array.isArray(step7.parsed.faq)
    ? step7.parsed.faq.filter((f) => f?.q?.trim() && f?.a?.trim())
    : [];
  if (faq.length < 3) {
    throw new Error(`Step 7 FAQ too short for ${state.source}:${state.offerId}`);
  }
  state.faq = faq;
}

async function resolveFormKindForReviews(
  source: OfferSource,
  offerId: number,
  fallback: string | null,
): Promise<string> {
  try {
    const { isImageFactsSource } = await import("./image-facts");
    if (isImageFactsSource(source)) {
      const { getInjectableImageFacts } = await import("./image-facts.server");
      const img = await getInjectableImageFacts(source, offerId);
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
  if (fallback && fallback !== "unknown") return fallback;
  return "unknown";
}

async function runPipelineStep8(state: PipelineState): Promise<void> {
  if (!state.displayTitle) {
    throw new Error(`Step 8 requires displayTitle for ${state.source}:${state.offerId}`);
  }
  const categorySlug =
    state.categories?.[0]?.trim() ||
    state.landingShelf?.trim() ||
    "other";
  const formKind = await resolveFormKindForReviews(
    state.source,
    state.offerId,
    state.formHint?.formKind ??
      (state.preFacts.kind !== "unknown" ? state.preFacts.kind : null),
  );
  const slots = buildReviewSlots(state.offerId, categorySlug);
  const brand =
    extractLockedLatinBrand(state.src.title) ||
    splitBrandAndTail(state.displayTitle).brand.trim() ||
    state.src.title.split(/\s+/)[0] ||
    "Produkt";
  const user = buildReviewGenUserCs(
    {
      displayTitle: state.displayTitle,
      brand,
      categorySlug,
      audience: audienceFor(categorySlug),
      formKind,
      context: (state.subtitle ?? state.metaDesc ?? "").slice(0, 220),
    },
    slots,
  );

  ensurePipelineBudget(state.metrics, REVIEWS_MAX_TOKENS);
  let lastErr: unknown;
  let jsonRetries = 0;
  let usage: LlmUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let attempts = 0;
  let durationMs = 0;
  let parsed: { reviews?: StoredReview[] } | null = null;
  for (let parseAttempt = 1; parseAttempt <= AI_JSON_PARSE_MAX_ATTEMPTS; parseAttempt++) {
    const resp = await callLlm(
      "step8",
      user,
      REVIEWS_MAX_TOKENS,
      undefined,
      AI_HEAVY_REQUEST_TIMEOUT_MS,
      REVIEW_GEN_SYSTEM_CS,
    );
    usage = resp.usage;
    attempts = resp.attempts;
    durationMs += resp.durationMs;
    try {
      parsed = parseJsonFromLlm<{ reviews?: StoredReview[] }>(resp.content);
      break;
    } catch (err) {
      lastErr = err;
      jsonRetries++;
      if (parseAttempt < AI_JSON_PARSE_MAX_ATTEMPTS) {
        console.warn(
          `[ai-usage] json-retry step=step8 attempt=${parseAttempt} reason=${summarizeError(err)}`,
        );
      }
    }
  }
  if (!parsed) throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  addPipelineMetrics(state.metrics, usage, attempts, durationMs, REVIEWS_MAX_TOKENS);
  state.metrics.retries += jsonRetries;
  ensurePipelineBudget(state.metrics);

  const raw = Array.isArray(parsed.reviews) ? parsed.reviews : [];
  const reviews = alignStoredReviews(slots, raw);
  if (reviews.filter((r) => r.text && r.text !== "(chybí text)").length < 3) {
    throw new Error(`Step 8 reviews too thin for ${state.source}:${state.offerId}`);
  }
  state.reviews = reviews;
}

async function runPipelineFrom(
  from: PipelineRetryStep,
  state: PipelineState,
  deadlineAt?: number,
): Promise<void> {
  if (shouldRunPipelineStep(from, "step1")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep1(state);
  }
  if (shouldRunPipelineStep(from, "step2")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep2(state);
  }
  if (shouldRunPipelineStep(from, "step3")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep3(state);
  }
  if (shouldRunPipelineStep(from, "step4")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep4(state);
  }
  if (shouldRunPipelineStep(from, "step5")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep5(state);
  }
  if (shouldRunPipelineStep(from, "step6")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep6(state);
  }
  if (shouldRunPipelineStep(from, "step6b")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep6b(state);
  }
  if (shouldRunPipelineStep(from, "step7")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep7(state);
  }
  if (shouldRunPipelineStep(from, "step8")) {
    ensurePipelineDeadline(deadlineAt);
    await runPipelineStep8(state);
  }
}

async function validatePipelineResult(
  result: PipelineRunResult,
  source: OfferSource,
  offerId: number,
  categorySlug: string,
  attempt: number,
  maxAttempts: number,
): Promise<QAResult> {
  const src = await buildPromptSource(source, offerId);
  if (!src) throw new Error(`Source offer not found for ${source}:${offerId}`);
  const { cleaned, warnings } = cleanForSource(source, src.description);
  const facts = detectProductFacts(src.title, src.category, src.description);
  const brief = buildProductBrief({
    source,
    offerId,
    categorySlug: result.categories[0] ?? categorySlug,
    rawTitle: src.title,
    cleanTitle: result.displayTitle,
    cleanedDescription: cleaned,
    cleanerWarnings: warnings ?? [],
    facts,
  });
  const content = pipelineResultToContent(result);
  const qa = validateGenerated(content, brief, "uk", { attempt, maxAttempts });
  const { hasNonCzechProductContent } = await import("./locale-leak-cz");
  if (
    hasNonCzechProductContent({
      display_title: result.displayTitle,
      description_html: result.html,
      sections: result.sections,
      faq: result.faq,
    })
  ) {
    return {
      ...qa,
      ok: false,
      severity: "critical",
      errors: [...qa.errors, "non-bulgarian-locale-leak"],
      hardErrors: [...qa.hardErrors, "non-bulgarian-locale-leak"],
    };
  }
  return qa;
}

export type PipelineQaAttemptMeta = {
  attempt: number;
  mode: "full" | "partial";
  retryFrom?: PipelineRetryStep;
  qa: QAResult;
  result: PipelineRunResult;
};

async function runPipelineWithPartialQa(
  source: OfferSource,
  offerId: number,
  categorySlug: string,
  maxAttempts: number = QA_PIPELINE_MAX_ATTEMPTS,
  onAttempt?: (meta: PipelineQaAttemptMeta) => void,
  deadlineAt?: number,
): Promise<{ result: PipelineRunResult; qa: QAResult }> {
  const state = await initPipelineState(source, offerId);
  if (!state) throw new Error(`Pipeline returned null for ${source}:${offerId}`);

  await runPipelineFrom("step1", state, deadlineAt);
  let result = pipelineStateToResult(state);
  let lastQa: QAResult | null = null;
  let lastRetryFrom: PipelineRetryStep | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    ensurePipelineDeadline(deadlineAt);
    const qa = await validatePipelineResult(
      result,
      source,
      offerId,
      categorySlug,
      attempt,
      maxAttempts,
    );
    lastQa = qa;
    onAttempt?.({
      attempt,
      mode: attempt === 1 ? "full" : "partial",
      retryFrom: lastRetryFrom,
      qa,
      result,
    });
    if (qa.hardErrors.length === 0) {
      return { result, qa };
    }
    if (attempt >= maxAttempts) break;

    const retryFrom = classifyQaRetryStep(qa.hardErrors);
    lastRetryFrom = retryFrom;
    console.warn(
      `[ai-content] qa partial retry ${source}:${offerId} from=${retryFrom} attempt=${attempt}/${maxAttempts} errors=${qa.hardErrors.join(",")}`,
    );

    if (retryFrom === "step2") {
      const reason = titleGarbledReason(result.displayTitle);
      if (reason) state.step2QaHint = reason;
    }

    const includeStep6b = isYmylCategory(state.categories?.[0] ?? "other");
    state.metrics.requestedCompletionTokens = releasePipelineBudgetForPartialRetry(
      state.metrics.requestedCompletionTokens,
      retryFrom,
      { includeStep6b },
    );

    ensurePipelineDeadline(deadlineAt);
    await runPipelineFrom(retryFrom, state, deadlineAt);
    result = pipelineStateToResult(state);
  }

  throw new Error(
    `QA hard errors after ${maxAttempts} attempts for ${source}:${offerId}: ${lastQa?.hardErrors.join(", ") ?? "unknown"}`,
  );
}

async function runPipelineWithQa(
  source: OfferSource,
  offerId: number,
  categorySlug: string,
  deadlineAt?: number,
): Promise<{
  result: PipelineRunResult;
  qa: QAResult;
}> {
  return runPipelineWithPartialQa(
    source,
    offerId,
    categorySlug,
    QA_PIPELINE_MAX_ATTEMPTS,
    undefined,
    deadlineAt,
  );
}

export type DebugGenerateAttempt = {
  attempt: number;
  mode: "full" | "partial";
  retryFrom?: PipelineRetryStep;
  promptLen: number;
  htmlLen: number;
  qaSeverity: string;
  qaErrors: string[];
  gatewayError?: string;
  htmlPreview?: string;
};

export type DebugGenerateResult = {
  source: OfferSource;
  offerId: number;
  categorySlug: string;
  pipelineVersion: string;
  feedTitle: string;
  cleanedDescription: string;
  factsKind: string;
  displayTitle: string;
  maxAttempts: number;
  attempts: DebugGenerateAttempt[];
  finalOrigin: string;
  estimatedTier: ContentTier;
  finalHtmlLen: number;
  qaErrorsFinal: string[];
};

export async function debugGenerateOne(
  source: OfferSource,
  offerId: number,
  categorySlug: string,
  opts: { maxAttempts?: number } = {},
): Promise<DebugGenerateResult | null> {
  const maxAttempts = opts.maxAttempts ?? QA_PIPELINE_MAX_ATTEMPTS;
  const src = await buildPromptSource(source, offerId);
  if (!src) return null;
  const { cleaned } = cleanForSource(source, src.description);
  const facts = detectProductFacts(src.title, src.category, src.description);
  const attempts: DebugGenerateAttempt[] = [];
  let lastResult: PipelineRunResult | null = null;
  let lastQa: QAResult | null = null;

  try {
    const { result, qa } = await runPipelineWithPartialQa(
      source,
      offerId,
      categorySlug,
      maxAttempts,
      (meta) => {
        lastResult = meta.result;
        lastQa = meta.qa;
        attempts.push({
          attempt: meta.attempt,
          mode: meta.mode,
          retryFrom: meta.retryFrom,
          promptLen: 0,
          htmlLen: meta.result.html.length,
          qaSeverity: meta.qa.severity,
          qaErrors: meta.qa.errors,
          htmlPreview: meta.result.html.slice(0, 400),
        });
      },
    );
    lastResult = result;
    lastQa = qa;
  } catch (err) {
    attempts.push({
      attempt: attempts.length + 1,
      mode: attempts.length === 0 ? "full" : "partial",
      promptLen: 0,
      htmlLen: lastResult?.html.length ?? 0,
      qaSeverity: "critical",
      qaErrors: [summarizeError(err)],
      gatewayError: summarizeError(err),
    });
  }

  if (!lastResult || !lastQa) return null;

  return {
    source,
    offerId,
    categorySlug: lastResult.categories[0] ?? categorySlug,
    pipelineVersion: PIPELINE_VERSION,
    feedTitle: src.title,
    cleanedDescription: cleaned,
    factsKind: facts.kind,
    displayTitle: lastResult.displayTitle,
    maxAttempts,
    attempts,
    finalOrigin: "pipeline",
    estimatedTier: lastQa.hardErrors.length > 0 ? "failed" : "ai",
    finalHtmlLen: lastResult.html.length,
    qaErrorsFinal: lastQa.errors,
  };
}

const STEP6_BLOCK_MARKERS =
  /начин на употреба|поръчате|важно уточнение|доставка|плащане|куриер/i;

function countH2Tags(html: string): number {
  return (html.match(/<h2[\s>]/gi) ?? []).length;
}

function extractH2Titles(html: string): string[] {
  const titles: string[] = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    titles.push(m[1].replace(/<[^>]+>/g, "").trim());
  }
  return titles;
}

function classifyTruncationStage(
  raw: string,
  rawH2: number,
  parseTrace: ReturnType<typeof traceParseHtmlFromLlm>,
  parsedLen: number,
): "llm_incomplete" | "parse_trim" | "ok" {
  if (parseTrace.parsed_h2_count >= STEP6_HTML_MIN_H2 && parsedLen >= STEP6_HTML_MIN_CHARS) return "ok";
  if (
    parseTrace.trim_removed_chars > 20 ||
    parseTrace.before_trim_h2_count > parseTrace.parsed_h2_count
  ) {
    return "parse_trim";
  }
  if (rawH2 <= 3 && !STEP6_BLOCK_MARKERS.test(raw)) return "llm_incomplete";
  if (parseTrace.parsed_h2_count <= 3) return "llm_incomplete";
  return "llm_incomplete";
}

type Step6Input = {
  displayTitle: string;
  step6Prompt: string;
};

async function prepareStep6Input(
  source: OfferSource,
  offerId: number,
  metrics?: PipelineMetrics,
): Promise<Step6Input | null> {
  const src = await buildPromptSource(source, offerId);
  if (!src) return null;

  const { cleaned } = cleanForSource(source, src.description);
  const feedContext = buildFeedContextBlock(source, src.description, src.feedExtra);
  const detectedFacts = detectProductFacts(src.title, src.category, src.description);
  const preCategorySlug = resolvePreCategorySlug(
    source,
    offerId,
    src.title,
    src.category,
    cleaned,
  );
  let preFacts = resolvePreFactsWithBrandLock(detectedFacts, preCategorySlug, src.title);
  const formHint = buildFormHintForSource(preFacts, preCategorySlug, src.title, cleaned);

  const track = (usage: LlmUsage, attempts: number, durationMs: number, maxTokens: number, jsonRetries = 0) => {
    if (!metrics) return;
    addPipelineMetrics(metrics, usage, attempts, durationMs, maxTokens);
    metrics.retries += jsonRetries;
    ensurePipelineBudget(metrics);
  };

  if (metrics) ensurePipelineBudget(metrics, STEP_MAX_TOKENS);
  const step1 = await callLlmWithJsonParse<Step1Result>(
    "step1",
    buildStep1Prompt(src.title, src.description, formHint),
    STEP_MAX_TOKENS,
  );
  track(step1.usage, step1.attempts, step1.durationMs, STEP_MAX_TOKENS, step1.jsonRetries);
  const headlineClean =
    sanitizeDisplayTitle(step1.parsed.headline?.trim()) ||
    cleanFeedTitleWithDescriptor(src.title) ||
    src.title.trim();

  if (metrics) ensurePipelineBudget(metrics, 512);
  const step2 = await callLlmWithJsonParse<Step2Result>(
    "step2",
    buildStep2Prompt(headlineClean, formHint),
    512,
  );
  track(step2.usage, step2.attempts, step2.durationMs, 512, step2.jsonRetries);
  const displayTitle = step2.parsed.display_title_cs?.trim() || headlineClean;

  if (metrics) ensurePipelineBudget(metrics, 1024);
  const forcedShelf = validateShelfSlug(SHELF_OVERRIDES[`${source}:${offerId}`]);
  let category: string;
  if (forcedShelf) {
    console.info(`[ai-content] step3 shelf override ${source}:${offerId} → ${forcedShelf}`);
    category = forcedShelf;
  } else {
    const step3 = await callLlmWithJsonParse<Step3Result & { categories?: string[] }>(
      "step3",
      buildStep3Prompt(displayTitle, feedContext || cleaned),
      1024,
    );
    track(step3.usage, step3.attempts, step3.durationMs, 1024, step3.jsonRetries);
    const parsed = parseStep3Category(step3.parsed);
    if (!parsed) {
      throw new Error(`Step 3 returned no valid category for ${source}:${offerId}`);
    }
    category = parsed;
  }

  preFacts = resolvePreFactsWithBrandLock(detectedFacts, category, src.title);
  const formHintAfterCategory = buildFormHintForSource(preFacts, category, src.title, cleaned);
  const formGuideBlock = buildPipelineFormGuideBlockFromParts({
    rawTitle: src.title,
    displayTitle,
    categorySlug: category,
    preFacts,
    cleaned,
  });

  if (metrics) ensurePipelineBudget(metrics, 256);
  const step4 = await callLlmWithJsonParse<Step4Result>(
    "step4",
    buildStep4Prompt(displayTitle, src.feedPrice),
    256,
  );
  track(step4.usage, step4.attempts, step4.durationMs, 256, step4.jsonRetries);

  if (metrics) ensurePipelineBudget(metrics, 512);
  const step5 = await callLlmWithJsonParse<Step5Result>(
    "step5",
    buildStep5Prompt(displayTitle, src.feedPrice),
    512,
  );
  track(step5.usage, step5.attempts, step5.durationMs, 512, step5.jsonRetries);

  const step6Prompt = buildStep6Prompt(
    displayTitle,
    feedContext,
    src.feedPrice,
    src.feedExtra.category?.trim() || src.category?.trim() || null,
    category,
    formHintAfterCategory,
    formGuideBlock,
  );

  return {
    displayTitle,
    step6Prompt,
  };
}

export type Step6TraceAttempt = {
  attempt: number;
  raw_chars: number;
  raw_h2_count: number;
  raw_tail: string;
  completion_tokens: number;
  max_tokens: number;
  finish_reason: string | null;
  after_fence_chars: number | null;
  slice_start_offset: number;
  before_trim_chars: number;
  after_trim_chars: number;
  trim_removed_chars: number;
  parsed_h2_count: number;
  parsed_h2_titles: string[];
  validate_passed: boolean;
  validate_error: string | null;
  truncation_stage: "llm_incomplete" | "parse_trim" | "ok";
};

export type Step6TraceResult = {
  source: OfferSource;
  offerId: number;
  displayTitle: string;
  prompt_chars: number;
  attempts: Step6TraceAttempt[];
  final_html_chars: number | null;
  production_would_accept: boolean;
};

/** Run steps 1–5 then instrument step 6 only (no DB write). */
export async function traceStep6Html(
  source: OfferSource,
  offerId: number,
): Promise<Step6TraceResult | null> {
  const input = await prepareStep6Input(source, offerId);
  if (!input) return null;

  const attempts: Step6TraceAttempt[] = [];
  let finalHtmlChars: number | null = null;

  for (let parseAttempt = 1; parseAttempt <= STEP6_HTML_MAX_ATTEMPTS; parseAttempt++) {
    const resp = await callLlmWithFinishReason(
      "step6-trace",
      input.step6Prompt,
      STEP_MAX_TOKENS,
      undefined,
      AI_HEAVY_REQUEST_TIMEOUT_MS,
      PIPELINE_STEP6_SYSTEM,
    );

    const raw = resp.content;
    const rawH2 = countH2Tags(raw);
    let parseTrace: ReturnType<typeof traceParseHtmlFromLlm>;
    let validatePassed = false;
    let validateError: string | null = null;

    try {
      parseTrace = traceParseHtmlFromLlm(raw);
      validateStep6Html(parseTrace.html);
      validatePassed = true;
      finalHtmlChars = parseTrace.html.length;
    } catch (err) {
      parseTrace = (() => {
        try {
          return traceParseHtmlFromLlm(raw);
        } catch {
          return {
            after_fence_chars: null,
            slice_start_offset: 0,
            before_trim_chars: 0,
            after_trim_chars: 0,
            trim_removed_chars: 0,
            before_trim_h2_count: 0,
            parsed_h2_count: 0,
            html: "",
          };
        }
      })();
      validateError = summarizeError(err);
    }

    const parsedLen = parseTrace.after_trim_chars;
    attempts.push({
      attempt: parseAttempt,
      raw_chars: raw.length,
      raw_h2_count: rawH2,
      raw_tail: raw.slice(-300),
      completion_tokens: resp.usage.completion_tokens,
      max_tokens: STEP_MAX_TOKENS,
      finish_reason: resp.finish_reason,
      after_fence_chars: parseTrace.after_fence_chars,
      slice_start_offset: parseTrace.slice_start_offset,
      before_trim_chars: parseTrace.before_trim_chars,
      after_trim_chars: parseTrace.after_trim_chars,
      trim_removed_chars: parseTrace.trim_removed_chars,
      parsed_h2_count: parseTrace.parsed_h2_count,
      parsed_h2_titles: extractH2Titles(parseTrace.html),
      validate_passed: validatePassed,
      validate_error: validateError,
      truncation_stage: classifyTruncationStage(raw, rawH2, parseTrace, parsedLen),
    });

    if (validatePassed) break;
  }

  return {
    source,
    offerId,
    displayTitle: input.displayTitle,
    prompt_chars: input.step6Prompt.length,
    attempts,
    final_html_chars: finalHtmlChars,
    production_would_accept: attempts.some((a) => a.validate_passed),
  };
}

async function runPipeline(
  source: OfferSource,
  offerId: number,
): Promise<PipelineRunResult | null> {
  const state = await initPipelineState(source, offerId);
  if (!state) return null;
  await runPipelineFrom("step1", state);
  return pipelineStateToResult(state);
}

export async function getExpectedSourceHash(
  source: OfferSource,
  offerId: number,
  _categorySlug?: string,
): Promise<string | null> {
  const src = await buildPromptSource(source, offerId);
  if (!src) return null;
  const { cleaned } = cleanForSource(source, src.description);
  let landingUrlHash: string | null = null;
  if (source === "shakes") {
    const { getShakesLandingUrlHashForSourceHash } = await import("./landing-facts.server");
    landingUrlHash = await getShakesLandingUrlHashForSourceHash(offerId);
  } else if (source === "cpa_tl") {
    const { getCpaTlLandingUrlHashForSourceHash } = await import("./landing-facts.server");
    landingUrlHash = await getCpaTlLandingUrlHashForSourceHash(offerId);
  } else if (source === "m1_top") {
    const { getM1TopLandingUrlHashForSourceHash } = await import("./landing-facts.server");
    landingUrlHash = await getM1TopLandingUrlHashForSourceHash(offerId);
  }
  return computeSourceHash(src, cleaned, landingUrlHash);
}

export async function getCachedProductContent(
  source: OfferSource,
  offerId: number,
  lang: Lang = "uk",
): Promise<AIProductContent | null> {
  const { data: existing } = await supabaseAdmin
    .from("product_content")
    .select("*")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (!existing) return null;
  const dto = rowToDto(existing as ExistingRow, lang);
  if (!dto?.description_html || dto.description_html.length < 100) return null;
  return dto;
}

export async function computeFormKind(
  source: OfferSource,
  offerId: number,
  categorySlug: string,
): Promise<string | null> {
  const src = await buildPromptSource(source, offerId);
  if (!src) return null;
  const detected = detectProductFacts(src.title, src.category, src.description);
  const facts = resolvePreFactsWithBrandLock(detected, categorySlug, src.title);
  return facts.kind !== "unknown" ? facts.kind : null;
}

/**
 * Best-effort: extract landing + image facts before AI generation when not yet attempted.
 * Failures never block content — pipeline injects whatever is already in DB.
 */
export async function warmOfferFactsBeforeContent(
  source: OfferSource,
  offerId: number,
): Promise<void> {
  const { isFactsExtractionAttempted, isLandingFactsContentSource, shouldWarmImageFacts, shouldWarmLandingFacts } =
    await import("./offer-facts-ready");
  const { isImageFactsEnabled, isImageFactsSource } = await import("./image-facts");

  let landingStatus: string | null = null;
  if (isLandingFactsContentSource(source)) {
    try {
      if (source === "shakes") {
        const { getShakesLandingFactsFromDb } = await import("./landing-facts.server");
        const row = await getShakesLandingFactsFromDb(offerId);
        landingStatus = row?.status ?? null;
      } else if (source === "cpa_tl") {
        const { getCpaTlLandingFactsFromDb } = await import("./landing-facts.server");
        const row = await getCpaTlLandingFactsFromDb(offerId);
        landingStatus = row?.status ?? null;
      } else if (source === "m1_top") {
        const { getM1TopLandingFactsFromDb } = await import("./landing-facts.server");
        const row = await getM1TopLandingFactsFromDb(offerId);
        landingStatus = row?.status ?? null;
      }
    } catch (err) {
      console.warn(
        `[ai-content] warm landing status read failed ${source}:${offerId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (shouldWarmLandingFacts({ source, landingStatus })) {
    if (source === "shakes") {
      try {
        const { extractAndStoreShakesLandingFacts } = await import("./landing-facts.server");
        const land = await extractAndStoreShakesLandingFacts(offerId);
        console.info(
          `[ai-content] warm landing ${source}:${offerId} status=${land.status} method=${land.method ?? "-"}`,
        );
      } catch (err) {
        console.warn(
          `[ai-content] warm landing failed ${source}:${offerId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    } else if (source === "cpa_tl") {
      try {
        const { extractAndStoreCpaTlLandingFacts } = await import("./landing-facts.server");
        const land = await extractAndStoreCpaTlLandingFacts(offerId);
        console.info(
          `[ai-content] warm landing ${source}:${offerId} status=${land.status} method=${land.method ?? "-"}`,
        );
      } catch (err) {
        console.warn(
          `[ai-content] warm landing failed ${source}:${offerId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    } else if (source === "m1_top") {
      try {
        const { extractAndStoreM1TopLandingFacts } = await import("./landing-facts.server");
        const land = await extractAndStoreM1TopLandingFacts(offerId);
        console.info(
          `[ai-content] warm landing ${source}:${offerId} status=${land.status} method=${land.method ?? "-"}`,
        );
      } catch (err) {
        console.warn(
          `[ai-content] warm landing failed ${source}:${offerId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  } else if (isLandingFactsContentSource(source) && isFactsExtractionAttempted(landingStatus)) {
    console.info(`[ai-content] warm landing skip ${source}:${offerId} status=${landingStatus}`);
  }

  let imageStatus: string | null = null;
  if (isImageFactsSource(source) && isImageFactsEnabled()) {
    try {
      const { getOfferImageFactsFromDb } = await import("./image-facts.server");
      const row = await getOfferImageFactsFromDb(source, offerId);
      imageStatus = row?.status ?? null;
    } catch (err) {
      console.warn(
        `[ai-content] warm image status read failed ${source}:${offerId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (
    shouldWarmImageFacts({
      source,
      imageFactsEnabled: isImageFactsEnabled(),
      imageStatus,
    })
  ) {
    try {
      const { extractAndStoreImageFacts } = await import("./image-facts.server");
      const img = await extractAndStoreImageFacts({
        source,
        offerId,
        writeDb: true,
      });
      console.info(
        `[ai-content] warm image ${source}:${offerId} status=${img.status} method=${img.method}${img.error ? ` err=${img.error}` : ""}`,
      );
    } catch (err) {
      console.warn(
        `[ai-content] warm image failed ${source}:${offerId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  } else if (isImageFactsSource(source) && isFactsExtractionAttempted(imageStatus)) {
    console.info(`[ai-content] warm image skip ${source}:${offerId} status=${imageStatus}`);
  }
}

export async function getOrGenerateProductContentDetailed(
  source: OfferSource,
  offerId: number,
  lang: Lang = "uk",
  _categorySlug: string = "other",
  opts: { forceRegen?: boolean; deadlineAt?: number } = {},
): Promise<GenerateContentResult> {
  const src = await buildPromptSource(source, offerId);
  if (!src) return { content: null, status: "failed", error: "Source offer not found" };

  const { cleaned } = cleanForSource(source, src.description);
  let landingUrlHash: string | null = null;
  if (source === "shakes") {
    const { getShakesLandingUrlHashForSourceHash } = await import("./landing-facts.server");
    landingUrlHash = await getShakesLandingUrlHashForSourceHash(offerId);
  } else if (source === "cpa_tl") {
    const { getCpaTlLandingUrlHashForSourceHash } = await import("./landing-facts.server");
    landingUrlHash = await getCpaTlLandingUrlHashForSourceHash(offerId);
  } else if (source === "m1_top") {
    const { getM1TopLandingUrlHashForSourceHash } = await import("./landing-facts.server");
    landingUrlHash = await getM1TopLandingUrlHashForSourceHash(offerId);
  }
  const sourceHash = computeSourceHash(src, cleaned, landingUrlHash);

  const { data: existingEarly } = await supabaseAdmin
    .from("product_content")
    .select("*")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();

  const rowEarly = existingEarly as ExistingRow | null;

  if (!opts.forceRegen && rowEarly && rowEarly.source_hash === sourceHash) {
    const cachedEarly = rowToDto(rowEarly, lang);
    const faqLen = Array.isArray(rowEarly.faq_uk) ? rowEarly.faq_uk.length : 0;
    const ready =
      !!rowEarly.title_uk &&
      !!rowEarly.description_html_uk &&
      !!rowEarly.display_title_uk &&
      faqLen >= 3;
    if (cachedEarly && ready) {
      console.info(`[ai-content] cache_hit ${source}:${offerId}`);
      return { content: cachedEarly, status: "cache_hit", saved: false };
    }
  }

  try {
    // New/regen path: warm landing + image facts first (fail-soft), then generate.
    await warmOfferFactsBeforeContent(source, offerId);
    ensurePipelineDeadline(opts.deadlineAt);

    // Landing URL may appear only after warm — refresh hash used for cache key + persist.
    if (source === "shakes") {
      const { getShakesLandingUrlHashForSourceHash } = await import("./landing-facts.server");
      landingUrlHash = await getShakesLandingUrlHashForSourceHash(offerId);
    } else if (source === "cpa_tl") {
      const { getCpaTlLandingUrlHashForSourceHash } = await import("./landing-facts.server");
      landingUrlHash = await getCpaTlLandingUrlHashForSourceHash(offerId);
    } else if (source === "m1_top") {
      const { getM1TopLandingUrlHashForSourceHash } = await import("./landing-facts.server");
      landingUrlHash = await getM1TopLandingUrlHashForSourceHash(offerId);
    }
    const sourceHashAfterWarm = computeSourceHash(src, cleaned, landingUrlHash);

    const { result, qa } = await runPipelineWithQa(
      source,
      offerId,
      _categorySlug,
      opts.deadlineAt,
    );

    await persistResolvedCategorySlug(source, offerId, result.categories[0]);

    const displaySanitized = result.displayTitle.trim();
    const { hasNonCzechProductContent } = await import("./locale-leak-cz");
    const qaLeakContent = {
      display_title: displaySanitized,
      description_html: result.html,
      sections: result.sections,
      faq: result.faq,
    };
    if (hasNonCzechProductContent(qaLeakContent)) {
      throw new Error(`Generated content still contains non-Czech locale leakage for ${source}:${offerId}`);
    }

    const qaStatus = qa.severity === "ok" ? "ok" : qa.severity === "warn" ? "warn" : "fail";
    const qaReason =
      qa.errors.length > 0 ? qa.errors.slice(0, 8).join("; ") : "locale_checked";

    const payload = {
      source,
      offer_id: offerId,
      source_hash: sourceHashAfterWarm,
      title_uk: result.metaTitle,
      subtitle_uk: result.subtitle,
      meta_desc_uk: result.metaDesc,
      display_title_uk: displaySanitized,
      intro_uk: "",
      sections_uk: result.sections,
      faq_uk: result.faq,
      reviews_uk: result.reviews,
      description_html_uk: result.html,
      title_ru: result.metaTitle,
      subtitle_ru: result.subtitle,
      meta_desc_ru: result.metaDesc,
      display_title_ru: displaySanitized,
      intro_ru: "",
      sections_ru: result.sections,
      faq_ru: result.faq,
      description_html_ru: result.html,
      generated_at: new Date().toISOString(),
      form_kind: result.formKind,
      qa_status_uk: qaStatus,
      qa_status_ru: qaStatus,
      qa_reason_uk: qaReason,
      qa_reason_ru: qaReason,
      qa_checked_at: new Date().toISOString(),
    };

    await supabaseAdmin.from("product_content").upsert(payload);

    console.info(
      `[ai-content] generated ${source}:${offerId} categories=${result.categories.join(",")} total_tokens=${result.metrics.totalTokens} retries=${result.metrics.retries}`,
    );

    return {
      content: rowToDto(payload as unknown as ExistingRow, lang),
      status: "generated",
      metrics: result.metrics,
      saved: true,
    };
  } catch (err) {
    const error = summarizeError(err);
    console.error(`[ai-content] pipeline failed ${source}:${offerId}:`, err);
    if (rowEarly) {
      const cached = rowToDto(rowEarly, lang);
      if (cached) {
        return {
          content: cached,
          status: "cached_after_failure",
          error,
          saved: false,
        };
      }
    }
    return { content: null, status: "failed", error, saved: false };
  }
}

export async function getOrGenerateProductContent(
  source: OfferSource,
  offerId: number,
  lang: Lang = "uk",
  categorySlug: string = "other",
  opts: { forceRegen?: boolean } = {},
): Promise<AIProductContent | null> {
  const result = await getOrGenerateProductContentDetailed(
    source,
    offerId,
    lang,
    categorySlug,
    opts,
  );
  return result.content;
}

/**
 * Reviews-only path for existing product_content rows (no HTML regen).
 */
export async function generateReviewsOnlyForOffer(
  source: OfferSource,
  offerId: number,
  categorySlug = "other",
): Promise<{ ok: boolean; count: number; error?: string }> {
  const { data: row } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk, subtitle_uk, meta_desc_uk, form_kind, reviews_uk")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (!row?.display_title_uk) {
    return { ok: false, count: 0, error: "missing_content" };
  }

  const src = await buildPromptSource(source, offerId);
  if (!src) return { ok: false, count: 0, error: "missing_offer" };

  const displayTitle = String(row.display_title_uk).trim();
  const formKind = await resolveFormKindForReviews(
    source,
    offerId,
    typeof row.form_kind === "string" ? row.form_kind : null,
  );
  const slots = buildReviewSlots(offerId, categorySlug);
  const brand =
    extractLockedLatinBrand(src.title) ||
    splitBrandAndTail(displayTitle).brand.trim() ||
    src.title.split(/\s+/)[0] ||
    "Produkt";
  const user = buildReviewGenUserCs(
    {
      displayTitle,
      brand,
      categorySlug,
      audience: audienceFor(categorySlug),
      formKind,
      context: String(row.subtitle_uk ?? row.meta_desc_uk ?? "").slice(0, 220),
    },
    slots,
  );

  try {
    const resp = await callLlm(
      "step8-only",
      user,
      REVIEWS_MAX_TOKENS,
      undefined,
      AI_HEAVY_REQUEST_TIMEOUT_MS,
      REVIEW_GEN_SYSTEM_CS,
    );
    const parsed = parseJsonFromLlm<{ reviews?: StoredReview[] }>(resp.content);
    const raw = Array.isArray(parsed.reviews) ? parsed.reviews : [];
    const reviews = alignStoredReviews(slots, raw);
    if (reviews.filter((r) => r.text && r.text !== "(chybí text)").length < 3) {
      return { ok: false, count: 0, error: "reviews_too_thin" };
    }
    const { error } = await supabaseAdmin
      .from("product_content")
      .update({ reviews_uk: reviews })
      .eq("source", source)
      .eq("offer_id", offerId);
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: reviews.length };
  } catch (err) {
    return { ok: false, count: 0, error: summarizeError(err) };
  }
}
