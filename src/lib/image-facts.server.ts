import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseJsonFromLlm } from "./ai-content-pipeline.cs";
import {
  IMAGE_FACTS_DOWNLOAD_TIMEOUT_MS,
  IMAGE_FACTS_DRAIN_DEADLINE_MS,
  IMAGE_FACTS_LLM_TIMEOUT_MS,
  IMAGE_FACTS_MAX_BYTES,
  IMAGE_FACTS_MAX_TOKENS,
  IMAGE_FACTS_MIN_BYTES,
  IMAGE_FACTS_SOURCES,
  IMAGE_FACTS_TICK_CIRCUIT_FAILS,
  buildImageFactsLlmPrompt,
  formatImageFactsForPrompt,
  imageFactsFreeModel,
  imageFactsHaveContent,
  imageFactsMaxLlmPerDay,
  imageFactsMaxLlmPerImage,
  imageFactsMaxPaidPerDay,
  imageFactsMaxTokensPerDay,
  compareImageFactsCandidates,
  imageUrlHash,
  isImageFactsEnabled,
  isImageFactsPaidFallbackError,
  isImageFactsSmokeEnabled,
  isImageFactsSource,
  needsImageFactsExtract,
  nextFetchErrorOrExhausted,
  nextThinOrExhausted,
  normalizeImageFacts,
  parseImageFactsGatewayMeta,
  shouldInjectImageFacts,
  utcBudgetDay,
  type CompactImageFacts,
  type ImageFactsExtractResult,
  type ImageFactsMethod,
  type ImageFactsStatus,
} from "./image-facts";
import type { OfferSource } from "./types";

export type OfferImageFactsRow = {
  source: string;
  offer_id: number;
  image_url: string;
  image_hash: string;
  status: ImageFactsStatus;
  method: ImageFactsMethod;
  facts: CompactImageFacts | null;
  prompt_block: string | null;
  error: string | null;
  fail_count: number;
  locked_until: string | null;
  last_llm_at: string | null;
  llm_attempts: number;
  /** Actual model slug from last successful/attempted gateway call. */
  model: string | null;
  /** OpenRouter generation id from last gateway call. */
  generation_id: string | null;
  extracted_at: string;
  updated_at: string;
};

export type ImageFactsInject = {
  imageHash: string | null;
  promptBlock: string | null;
  facts: CompactImageFacts | null;
};

export type ImageFactsTiming = {
  preflightMs: number;
  llmMs: number;
  totalMs: number;
};

export type ExtractAndStoreImageFactsResult = ImageFactsExtractResult & {
  timing: ImageFactsTiming;
  llmAttempts: number;
  wroteDb: boolean;
};

export type ImageFactsDrainResult = {
  processed: number;
  okCount: number;
  remaining: number;
  elapsed_ms: number;
  stoppedReason: string | null;
  circuitTrips: number;
};

type OfferImageCandidate = {
  source: OfferSource;
  offerId: number;
  title: string;
  imageUrl: string;
};

type DailyBudgetRow = {
  day: string;
  free_calls: number;
  paid_calls: number;
  prompt_tokens: number;
  completion_tokens: number;
};

type LlmCallResult = {
  facts: CompactImageFacts | null;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  durationMs: number;
  rawContent: string;
  /** Requested model slug sent to the gateway. */
  requestedModel: string;
  /** Routed/actual model from gateway body (falls back to requested). */
  model: string;
  generationId: string | null;
};

type PreflightOk = {
  ok: true;
  contentType: string | null;
  bytes: number;
  dataUrl: string | null;
};

type PreflightFail = {
  ok: false;
  status: "no_image" | "fetch_error" | "exhausted";
  error: string;
};

const OFFER_TABLE: Record<
  OfferSource,
  { table: string; titleCol: string; imageCol: string; hasActive: boolean }
> = {
  shakes: { table: "shakes_offers", titleCol: "title", imageCol: "picture_url", hasActive: true },
  cpa_tl: { table: "cpa_tl_offers", titleCol: "title", imageCol: "picture_url", hasActive: true },
  m1_top: { table: "m1_offers", titleCol: "name", imageCol: "picture_url", hasActive: false },
  cpagetti: { table: "cpagetti_offers", titleCol: "title", imageCol: "picture_url", hasActive: false },
  adcombo: { table: "adcombo_offers", titleCol: "title", imageCol: "picture_url", hasActive: false },
  kma: { table: "kma_offers", titleCol: "name", imageCol: "logo", hasActive: true },
};

function canRunImageFactsLlm(opts?: { smoke?: boolean }): boolean {
  if (opts?.smoke || isImageFactsSmokeEnabled()) return true;
  return isImageFactsEnabled();
}

type SbLoose = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any;
};

const db = supabaseAdmin as unknown as SbLoose;

export async function getOfferImageFactsFromDb(
  source: OfferSource,
  offerId: number,
): Promise<OfferImageFactsRow | null> {
  const { data, error } = await db
    .from("offer_image_facts")
    .select("*")
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error) {
    console.warn(`[image-facts] db read ${source}:${offerId}:`, error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as OfferImageFactsRow;
}

export async function getInjectableImageFacts(
  source: OfferSource,
  offerId: number,
): Promise<ImageFactsInject> {
  const row = await getOfferImageFactsFromDb(source, offerId);
  if (!row) {
    return { imageHash: null, promptBlock: null, facts: null };
  }
  const decision = shouldInjectImageFacts({ status: row.status, facts: row.facts });
  return {
    imageHash: row.status === "ok" && row.image_hash ? row.image_hash : null,
    promptBlock: decision.promptBlock,
    facts: decision.facts,
  };
}

export async function loadOfferImageCandidate(
  source: OfferSource,
  offerId: number,
): Promise<OfferImageCandidate | null> {
  if (!isImageFactsSource(source)) return null;
  const meta = OFFER_TABLE[source];
  let q = db
    .from(meta.table)
    .select(`offer_id, ${meta.titleCol}, ${meta.imageCol}`)
    .eq("offer_id", offerId);
  if (meta.hasActive) q = q.eq("is_active", true);
  const { data, error } = await q.maybeSingle();
  if (error || !data) {
    if (error) console.warn(`[image-facts] offer load ${source}:${offerId}:`, error.message);
    return null;
  }
  const row = data as unknown as Record<string, unknown>;
  const title = String(row[meta.titleCol] ?? "").trim() || `offer ${offerId}`;
  const imageUrl = String(row[meta.imageCol] ?? "").trim();
  return { source, offerId, title, imageUrl };
}

function looksLikeImageContentType(ct: string | null): boolean {
  if (!ct) return true; // some CDNs omit type
  const t = ct.toLowerCase();
  if (t.startsWith("image/")) return true;
  if (t.includes("octet-stream")) return true;
  return false;
}

function isTinyOrPlaceholder(bytes: number, buf: ArrayBuffer): boolean {
  if (bytes < IMAGE_FACTS_MIN_BYTES) return true;
  // Very small GIF/PNG headers alone are not enough product signal.
  if (bytes < 2_000 && buf.byteLength < 2_000) return true;
  return false;
}

/** Match PDP `referrerpolicy=no-referrer` + browser UA for partner CDN hotlink (Adcombo/KMA). */
const IMAGE_FACTS_PREFLIGHT_HEADERS: Record<string, string> = {
  Accept: "image/*,*/*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  // Explicitly omit Referer — some partner CDNs 403 when Referer is present or non-empty.
};

export async function preflightProductImage(imageUrl: string): Promise<PreflightOk | PreflightFail> {
  const url = imageUrl.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, status: "no_image", error: "missing_or_invalid_image_url" };
  }
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(IMAGE_FACTS_DOWNLOAD_TIMEOUT_MS),
      headers: IMAGE_FACTS_PREFLIGHT_HEADERS,
      // Match PDP hotlink: partner CDNs often 403 when a site Referer is sent.
      referrerPolicy: "no-referrer",
    });
    if (!res.ok) {
      return { ok: false, status: "fetch_error", error: `http_${res.status}` };
    }
    const ct = res.headers.get("content-type");
    if (!looksLikeImageContentType(ct)) {
      return { ok: false, status: "no_image", error: `bad_content_type:${ct ?? "none"}` };
    }
    const buf = await res.arrayBuffer();
    const bytes = buf.byteLength;
    if (bytes > IMAGE_FACTS_MAX_BYTES) {
      return { ok: false, status: "no_image", error: `too_large:${bytes}` };
    }
    if (isTinyOrPlaceholder(bytes, buf)) {
      return { ok: false, status: "no_image", error: `too_small:${bytes}` };
    }
    // Prefer remote URL for the LLM; keep dataUrl only as fallback payload.
    const mime = (ct || "image/jpeg").split(";")[0]!.trim() || "image/jpeg";
    const b64 = Buffer.from(buf).toString("base64");
    return {
      ok: true,
      contentType: mime,
      bytes,
      dataUrl: `data:${mime};base64,${b64}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: "fetch_error", error: `download:${msg.slice(0, 160)}` };
  }
}

async function readDailyBudget(day: string): Promise<DailyBudgetRow> {
  const { data, error } = await db
    .from("image_facts_daily_budget")
    .select("*")
    .eq("day", day)
    .maybeSingle();
  if (error) {
    console.warn(`[image-facts] budget read ${day}:`, error.message);
  }
  if (data) return data as unknown as DailyBudgetRow;
  return { day, free_calls: 0, paid_calls: 0, prompt_tokens: 0, completion_tokens: 0 };
}

export type BudgetGate =
  | { ok: true; allowPaid: boolean; budget: DailyBudgetRow }
  | { ok: false; reason: string; budget: DailyBudgetRow };

export async function checkImageFactsBudget(): Promise<BudgetGate> {
  const day = utcBudgetDay();
  const budget = await readDailyBudget(day);
  const totalCalls = budget.free_calls + budget.paid_calls;
  const totalTokens = budget.prompt_tokens + budget.completion_tokens;
  if (totalCalls >= imageFactsMaxLlmPerDay()) {
    return { ok: false, reason: "max_llm_per_day", budget };
  }
  if (totalTokens >= imageFactsMaxTokensPerDay()) {
    return { ok: false, reason: "max_tokens_per_day", budget };
  }
  const allowPaid = budget.paid_calls < imageFactsMaxPaidPerDay();
  return { ok: true, allowPaid, budget };
}

/** Reserve a call slot before hitting the gateway (counts attempts, not success). */
async function reserveBudgetSlot(
  kind: "free" | "paid",
  usage?: { prompt_tokens: number; completion_tokens: number },
): Promise<boolean> {
  const day = utcBudgetDay();
  const current = await readDailyBudget(day);
  const next = {
    day,
    free_calls: current.free_calls + (kind === "free" ? 1 : 0),
    paid_calls: current.paid_calls + (kind === "paid" ? 1 : 0),
    prompt_tokens: current.prompt_tokens + (usage?.prompt_tokens ?? 0),
    completion_tokens: current.completion_tokens + (usage?.completion_tokens ?? 0),
    updated_at: new Date().toISOString(),
  };
  if (next.free_calls + next.paid_calls > imageFactsMaxLlmPerDay()) return false;
  if (kind === "paid" && next.paid_calls > imageFactsMaxPaidPerDay()) return false;
  if (next.prompt_tokens + next.completion_tokens > imageFactsMaxTokensPerDay() + 50_000) {
    // soft: allow completing an in-flight reserve slightly over tokens
  }
  const { error } = await db.from("image_facts_daily_budget").upsert(next as never, {
    onConflict: "day",
  });
  if (error) {
    console.warn(`[image-facts] budget reserve failed:`, error.message);
    return false;
  }
  return true;
}

async function addBudgetTokens(usage: {
  prompt_tokens: number;
  completion_tokens: number;
}): Promise<void> {
  const day = utcBudgetDay();
  const current = await readDailyBudget(day);
  const { error } = await db.from("image_facts_daily_budget").upsert(
    {
      day,
      free_calls: current.free_calls,
      paid_calls: current.paid_calls,
      prompt_tokens: current.prompt_tokens + usage.prompt_tokens,
      completion_tokens: current.completion_tokens + usage.completion_tokens,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "day" },
  );
  if (error) console.warn(`[image-facts] budget tokens update:`, error.message);
}

async function callImageFactsLlm(opts: {
  title: string;
  imageUrl: string;
  dataUrl: string | null;
  model: string;
  preferDataUrl?: boolean;
}): Promise<LlmCallResult> {
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY or LOVABLE_API_KEY not configured");
  const url = process.env.AI_GATEWAY_URL ?? "https://openrouter.ai/api/v1/chat/completions";
  const system =
    "Jsi katalogový extraktor faktů z obrázku produktu pro CZ e-shop. Vracíš pouze validní JSON. Balení: tuba/gel ≠ doplněk stravy. Oblečení na modelu ≠ gel/tuba. Texty piš česky.";
  const userPrompt = buildImageFactsLlmPrompt(opts.title);
  const imagePayloadUrl =
    opts.preferDataUrl && opts.dataUrl ? opts.dataUrl : opts.imageUrl || opts.dataUrl || "";
  if (!imagePayloadUrl) throw new Error("no_image_payload");

  const started = Date.now();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (url.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.SITE_URL ?? "https://recenze-ceny.cz";
    headers["X-Title"] = "recenze-ceny-image-facts";
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(IMAGE_FACTS_LLM_TIMEOUT_MS),
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imagePayloadUrl } },
          ],
        },
      ],
      max_tokens: IMAGE_FACTS_MAX_TOKENS,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    id?: string;
    model?: string;
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const rawMsg = json.choices?.[0]?.message?.content;
  let content = "";
  if (typeof rawMsg === "string") content = rawMsg.trim();
  else if (Array.isArray(rawMsg)) {
    content = rawMsg
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
  }
  if (!content) throw new Error("AI gateway returned empty content");
  const parsed = parseJsonFromLlm<unknown>(content);
  const facts = normalizeImageFacts(parsed);
  const promptTokens = json.usage?.prompt_tokens ?? Math.ceil((system.length + userPrompt.length) / 4);
  const completionTokens = json.usage?.completion_tokens ?? Math.ceil(content.length / 4);
  const meta = parseImageFactsGatewayMeta(json, opts.model);
  return {
    facts,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: json.usage?.total_tokens ?? promptTokens + completionTokens,
    },
    durationMs: Date.now() - started,
    rawContent: content,
    requestedModel: opts.model,
    model: meta.model,
    generationId: meta.generationId,
  };
}

async function upsertImageFactsRow(
  row: Omit<OfferImageFactsRow, "extracted_at" | "updated_at"> & {
    extracted_at?: string;
    updated_at?: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    ...row,
    extracted_at: row.extracted_at ?? now,
    updated_at: now,
  };
  const { error } = await db.from("offer_image_facts").upsert(payload as never, {
    onConflict: "source,offer_id",
  });
  if (error) throw new Error(`image_facts upsert: ${error.message}`);
}

export async function extractAndStoreImageFacts(opts: {
  source: OfferSource;
  offerId: number;
  writeDb?: boolean;
  smoke?: boolean;
  /** Re-run LLM even when status=ok for the same image_hash. */
  force?: boolean;
}): Promise<ExtractAndStoreImageFactsResult> {
  const writeDb = opts.writeDb !== false;
  const force = opts.force === true;
  const started = Date.now();
  const candidate = await loadOfferImageCandidate(opts.source, opts.offerId);
  if (!candidate) {
    const result: ExtractAndStoreImageFactsResult = {
      imageUrl: "",
      imageHash: "",
      status: "no_image",
      method: "none",
      facts: null,
      promptBlock: null,
      jsonChars: 0,
      error: "offer_not_found",
      timing: { preflightMs: 0, llmMs: 0, totalMs: Date.now() - started },
      llmAttempts: 0,
      wroteDb: false,
    };
    return result;
  }

  const imageHash = candidate.imageUrl ? imageUrlHash(candidate.imageUrl) : "";
  const prev = await getOfferImageFactsFromDb(opts.source, opts.offerId);
  const hashChanged = Boolean(prev && prev.image_hash && prev.image_hash !== imageHash);
  // force = intentional re-spend: reset attempt counter for this extract
  const llmAttemptsBase = force || hashChanged ? 0 : (prev?.llm_attempts ?? 0);
  const failBase = force || hashChanged ? 0 : (prev?.fail_count ?? 0);
  const prevStatus = force || hashChanged ? "" : (prev?.status ?? "");

  // Lifetime guard: never re-spend tokens on ok/no_image/exhausted for the same hash.
  if (
    !force &&
    prev &&
    !hashChanged &&
    (prev.status === "ok" || prev.status === "no_image" || prev.status === "exhausted")
  ) {
    return {
      imageUrl: prev.image_url || candidate.imageUrl,
      imageHash: prev.image_hash || imageHash,
      status: prev.status,
      method: prev.method,
      facts: prev.facts,
      promptBlock: prev.prompt_block,
      jsonChars: prev.facts ? JSON.stringify(prev.facts).length : 0,
      error: prev.error ?? undefined,
      model: prev.model,
      generationId: prev.generation_id,
      timing: { preflightMs: 0, llmMs: 0, totalMs: Date.now() - started },
      llmAttempts: prev.llm_attempts,
      wroteDb: false,
    };
  }

  if (!canRunImageFactsLlm({ smoke: opts.smoke })) {
    return {
      imageUrl: candidate.imageUrl,
      imageHash,
      status: "fetch_error",
      method: "none",
      facts: null,
      promptBlock: null,
      jsonChars: 0,
      error: "image_facts_disabled",
      timing: { preflightMs: 0, llmMs: 0, totalMs: Date.now() - started },
      llmAttempts: llmAttemptsBase,
      wroteDb: false,
    };
  }

  const preflightStarted = Date.now();
  const pre = await preflightProductImage(candidate.imageUrl);
  const preflightMs = Date.now() - preflightStarted;

  /**
   * Worker egress sometimes gets http_502 from partner CDNs (notably kma.biz) while the
   * public URL is fine. In that case skip local bytes and let the LLM gateway fetch the URL.
   */
  let dataUrl: string | null = null;
  let urlOnlyAfterFetchFail = false;
  let preflightError: string | null = null;

  if (!pre.ok) {
    const canUrlOnly =
      pre.status === "fetch_error" && /^https:\/\//i.test(candidate.imageUrl.trim());
    if (canUrlOnly) {
      urlOnlyAfterFetchFail = true;
      preflightError = pre.error;
    } else {
      let status: ImageFactsStatus = pre.status;
      let fail_count = failBase;
      let locked_until: string | null = null;
      if (pre.status === "fetch_error") {
        const next = nextFetchErrorOrExhausted(prevStatus || "fetch_error", failBase);
        status = next.status;
        fail_count = next.fail_count;
        locked_until = next.locked_until;
      }
      const rowBase = {
        source: opts.source,
        offer_id: opts.offerId,
        image_url: candidate.imageUrl,
        image_hash: imageHash,
        status,
        method: "none" as const,
        facts: null,
        prompt_block: null,
        error: pre.error,
        fail_count,
        locked_until,
        last_llm_at: hashChanged ? null : (prev?.last_llm_at ?? null),
        llm_attempts: llmAttemptsBase,
        model: hashChanged ? null : (prev?.model ?? null),
        generation_id: hashChanged ? null : (prev?.generation_id ?? null),
      };
      if (writeDb) await upsertImageFactsRow(rowBase);
      return {
        imageUrl: candidate.imageUrl,
        imageHash,
        status,
        method: "none",
        facts: null,
        promptBlock: null,
        jsonChars: 0,
        error: pre.error,
        timing: { preflightMs, llmMs: 0, totalMs: Date.now() - started },
        llmAttempts: llmAttemptsBase,
        wroteDb: writeDb,
      };
    }
  } else {
    dataUrl = pre.dataUrl;
  }

  if (llmAttemptsBase >= imageFactsMaxLlmPerImage()) {
    const rowBase = {
      source: opts.source,
      offer_id: opts.offerId,
      image_url: candidate.imageUrl,
      image_hash: imageHash,
      status: "exhausted" as const,
      method: "none" as const,
      facts: null,
      prompt_block: null,
      error: "max_llm_per_image",
      fail_count: failBase,
      locked_until: null,
      last_llm_at: prev?.last_llm_at ?? null,
      llm_attempts: llmAttemptsBase,
      model: prev?.model ?? null,
      generation_id: prev?.generation_id ?? null,
    };
    if (writeDb) await upsertImageFactsRow(rowBase);
    return {
      imageUrl: candidate.imageUrl,
      imageHash,
      status: "exhausted",
      method: "none",
      facts: null,
      promptBlock: null,
      jsonChars: 0,
      error: "max_llm_per_image",
      timing: { preflightMs, llmMs: 0, totalMs: Date.now() - started },
      llmAttempts: llmAttemptsBase,
      wroteDb: writeDb,
    };
  }

  const budget = await checkImageFactsBudget();
  if (!budget.ok) {
    const locked = backoffLockedUntilFromNow(30);
    const rowBase = {
      source: opts.source,
      offer_id: opts.offerId,
      image_url: candidate.imageUrl,
      image_hash: imageHash,
      status: (prevStatus === "thin" ? "thin" : "fetch_error") as ImageFactsStatus,
      method: "none" as const,
      facts: prev?.facts ?? null,
      prompt_block: prev?.prompt_block ?? null,
      error: `budget:${budget.reason}`,
      fail_count: failBase,
      locked_until: locked,
      last_llm_at: prev?.last_llm_at ?? null,
      llm_attempts: llmAttemptsBase,
      model: prev?.model ?? null,
      generation_id: prev?.generation_id ?? null,
    };
    if (writeDb) await upsertImageFactsRow(rowBase);
    return {
      imageUrl: candidate.imageUrl,
      imageHash,
      status: rowBase.status,
      method: "none",
      facts: null,
      promptBlock: null,
      jsonChars: 0,
      error: `budget:${budget.reason}`,
      timing: { preflightMs, llmMs: 0, totalMs: Date.now() - started },
      llmAttempts: llmAttemptsBase,
      wroteDb: writeDb,
    };
  }

  const freeModel = imageFactsFreeModel();
  const paidModel = process.env.AI_MODEL?.trim() || "google/gemini-2.5-flash";
  let method: ImageFactsMethod = "none";
  let llmMs = 0;
  let usage: ImageFactsExtractResult["usage"];
  let facts: CompactImageFacts | null = null;
  let llmError: string | null = null;
  let llmAttempts = llmAttemptsBase;
  let gatewayModel: string | null = null;
  let generationId: string | null = null;

  const rememberGateway = (call: LlmCallResult): void => {
    gatewayModel = call.model;
    generationId = call.generationId;
    if (call.model !== call.requestedModel) {
      console.info(
        `[image-facts] routed ${opts.source}:${opts.offerId} requested=${call.requestedModel} actual=${call.model} gen=${call.generationId ?? "-"}`,
      );
    }
  };

  const tryPaidOnce = async (reason: string): Promise<boolean> => {
    if (!budget.allowPaid) {
      console.info(
        `[image-facts] skip paid fallback ${opts.source}:${opts.offerId} reason=${reason} (paid budget exhausted)`,
      );
      return false;
    }
    if (llmAttempts >= imageFactsMaxLlmPerImage()) {
      console.info(
        `[image-facts] skip paid fallback ${opts.source}:${opts.offerId} reason=${reason} (max_llm_per_image)`,
      );
      return false;
    }
    const reserved = await reserveBudgetSlot("paid");
    if (!reserved) {
      console.info(
        `[image-facts] skip paid fallback ${opts.source}:${opts.offerId} reason=${reason} (reserve failed)`,
      );
      return false;
    }
    console.info(
      `[image-facts] paid fallback ${opts.source}:${opts.offerId} reason=${reason} model=${paidModel}`,
    );
    llmAttempts += 1;
    const paid = await callImageFactsLlm({
      title: candidate.title,
      imageUrl: candidate.imageUrl,
      dataUrl,
      model: paidModel,
      preferDataUrl: Boolean(dataUrl),
    });
    await addBudgetTokens(paid.usage);
    llmMs += paid.durationMs;
    method = "paid";
    usage = paid.usage;
    facts = paid.facts;
    rememberGateway(paid);
    return true;
  };

  /** At most 1 free + 1 paid per extract. Data-URL retry reuses the same free attempt. */
  try {
    const reserved = await reserveBudgetSlot("free");
    if (!reserved) throw new Error("budget_reserve_failed:free");
    llmAttempts += 1;

    let llm: LlmCallResult;
    try {
      llm = await callImageFactsLlm({
        title: candidate.title,
        imageUrl: candidate.imageUrl,
        dataUrl,
        model: freeModel,
        preferDataUrl: false,
      });
    } catch (urlErr) {
      // URL-mode failure (incl. safety/non-JSON): one free data-URL retry, then paid below.
      if (!dataUrl) throw urlErr;
      if (isImageFactsPaidFallbackError(urlErr)) {
        console.info(
          `[image-facts] free URL failed ${opts.source}:${opts.offerId}: ${
            urlErr instanceof Error ? urlErr.message.slice(0, 120) : urlErr
          } — retry free data-URL then paid if needed`,
        );
      }
      llm = await callImageFactsLlm({
        title: candidate.title,
        imageUrl: candidate.imageUrl,
        dataUrl,
        model: freeModel,
        preferDataUrl: true,
      });
    }
    await addBudgetTokens(llm.usage);
    llmMs += llm.durationMs;
    method = "free";
    usage = llm.usage;
    facts = llm.facts;
    rememberGateway(llm);

    // Empty / unusable free JSON → one paid retry (same as safety/parse throw path).
    if (!facts || !imageFactsHaveContent(facts)) {
      const okPaid = await tryPaidOnce("free_empty_or_thin_facts");
      if (okPaid && facts && imageFactsHaveContent(facts)) {
        llmError = null;
      }
    }
  } catch (err) {
    llmError = err instanceof Error ? err.message : String(err);
    if (isImageFactsPaidFallbackError(err)) {
      try {
        const okPaid = await tryPaidOnce(
          llmError.toLowerCase().includes("safety") ||
            llmError.toLowerCase().includes("parse")
            ? "free_safety_or_parse"
            : "free_gateway_error",
        );
        if (okPaid) llmError = null;
      } catch (paidErr) {
        llmError = paidErr instanceof Error ? paidErr.message : String(paidErr);
      }
    }
  }

  const nowIso = new Date().toISOString();
  if (facts && imageFactsHaveContent(facts)) {
    const decision = shouldInjectImageFacts({ status: "ok", facts });
    const promptBlock = decision.promptBlock ?? formatImageFactsForPrompt(facts);
    const jsonChars = JSON.stringify(facts).length;
    if (writeDb) {
      await upsertImageFactsRow({
        source: opts.source,
        offer_id: opts.offerId,
        image_url: candidate.imageUrl,
        image_hash: imageHash,
        status: "ok",
        method,
        facts,
        prompt_block: promptBlock,
        error: urlOnlyAfterFetchFail ? `preflight:${preflightError};recovered:url_only` : null,
        fail_count: 0,
        locked_until: null,
        last_llm_at: nowIso,
        llm_attempts: llmAttempts,
        model: gatewayModel,
        generation_id: generationId,
      });
    }
    return {
      imageUrl: candidate.imageUrl,
      imageHash,
      status: "ok",
      method,
      facts,
      promptBlock,
      jsonChars,
      error: urlOnlyAfterFetchFail ? `preflight:${preflightError};recovered:url_only` : undefined,
      usage,
      model: gatewayModel,
      generationId,
      timing: { preflightMs, llmMs, totalMs: Date.now() - started },
      llmAttempts,
      wroteDb: writeDb,
    };
  }

  // Thin / failed after LLM attempts (or URL-only after Worker fetch_error)
  const failError = urlOnlyAfterFetchFail
    ? `preflight:${preflightError};url_only:${llmError ?? "thin_or_empty_facts"}`
    : (llmError ?? "thin_or_empty_facts");
  const terminal = urlOnlyAfterFetchFail
    ? nextFetchErrorOrExhausted(prevStatus || "fetch_error", failBase)
    : nextThinOrExhausted(llmAttempts, failBase);
  if (writeDb) {
    await upsertImageFactsRow({
      source: opts.source,
      offer_id: opts.offerId,
      image_url: candidate.imageUrl,
      image_hash: imageHash,
      status: terminal.status,
      method,
      facts: null,
      prompt_block: null,
      error: failError,
      fail_count: terminal.fail_count,
      locked_until: terminal.locked_until,
      last_llm_at: llmAttempts > llmAttemptsBase ? nowIso : (prev?.last_llm_at ?? null),
      llm_attempts: llmAttempts,
      model: gatewayModel ?? prev?.model ?? null,
      generation_id: generationId ?? prev?.generation_id ?? null,
    });
  }
  return {
    imageUrl: candidate.imageUrl,
    imageHash,
    status: terminal.status,
    method,
    facts: null,
    promptBlock: null,
    jsonChars: 0,
    error: failError,
    usage,
    model: gatewayModel,
    generationId,
    timing: { preflightMs, llmMs, totalMs: Date.now() - started },
    llmAttempts,
    wroteDb: writeDb,
  };
}

function backoffLockedUntilFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function listPendingImageFactCandidates(opts: {
  limit: number;
}): Promise<OfferImageCandidate[]> {
  type RankedCandidate = OfferImageCandidate & {
    hasFactsRow: boolean;
    syncedAt: string;
  };
  const pending: RankedCandidate[] = [];
  const perSource = Math.max(2, Math.ceil(opts.limit / IMAGE_FACTS_SOURCES.length) + 2);
  const scanLimit = Math.min(300, Math.max(120, perSource * 20));

  for (const source of IMAGE_FACTS_SOURCES) {
    const meta = OFFER_TABLE[source];
    let q = db
      .from(meta.table)
      .select(`offer_id, ${meta.titleCol}, ${meta.imageCol}, synced_at`)
      .not(meta.imageCol, "is", null)
      .order("synced_at", { ascending: false })
      .order("offer_id", { ascending: false })
      .limit(scanLimit);
    if (meta.hasActive) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error || !data) {
      if (error) console.warn(`[image-facts] scan ${source}:`, error.message);
      continue;
    }

    const rows = data as unknown as Array<Record<string, unknown>>;
    const ids = rows
      .map((r) => Number(r.offer_id))
      .filter((n) => Number.isFinite(n));
    const { data: existing } = await db
      .from("offer_image_facts")
      .select("offer_id, image_hash, status, llm_attempts, locked_until")
      .eq("source", source)
      .in("offer_id", ids.length ? ids : [-1]);

    const byId = new Map(
      ((existing ?? []) as unknown as Array<{
        offer_id: number;
        image_hash: string;
        status: string;
        llm_attempts: number;
        locked_until: string | null;
      }>).map((r) => [r.offer_id, r]),
    );

    for (const row of rows) {
      const offerId = Number(row.offer_id);
      const imageUrl = String(row[meta.imageCol] ?? "").trim();
      if (!imageUrl) continue;
      const title = String(row[meta.titleCol] ?? "").trim() || `offer ${offerId}`;
      const hash = imageUrlHash(imageUrl);
      const prev = byId.get(offerId);
      if (
        !needsImageFactsExtract({
          status: prev?.status,
          imageHash: hash,
          rowImageHash: prev?.image_hash,
          llmAttempts: prev?.llm_attempts ?? 0,
          lockedUntil: prev?.locked_until,
        })
      ) {
        continue;
      }
      pending.push({
        source,
        offerId,
        title,
        imageUrl,
        hasFactsRow: Boolean(prev),
        syncedAt: String(row.synced_at ?? ""),
      });
    }
  }

  pending.sort(compareImageFactsCandidates);
  return pending.slice(0, opts.limit * 2).map(({ source, offerId, title, imageUrl }) => ({
    source,
    offerId,
    title,
    imageUrl,
  }));
}

/**
 * Drain pending image facts. No-op when IMAGE_FACTS_ENABLED is off
 * (smoke uses extractAndStoreImageFacts with smoke:true instead).
 */
export async function drainOfferImageFacts(opts?: {
  deadlineMs?: number;
  limit?: number;
}): Promise<ImageFactsDrainResult> {
  const started = Date.now();
  const deadlineMs = opts?.deadlineMs ?? IMAGE_FACTS_DRAIN_DEADLINE_MS;
  const limit = Math.min(Math.max(opts?.limit ?? 5, 1), 20);

  if (!isImageFactsEnabled()) {
    return {
      processed: 0,
      okCount: 0,
      remaining: 0,
      elapsed_ms: 0,
      stoppedReason: "disabled",
      circuitTrips: 0,
    };
  }

  const budget = await checkImageFactsBudget();
  if (!budget.ok) {
    return {
      processed: 0,
      okCount: 0,
      remaining: 0,
      elapsed_ms: Date.now() - started,
      stoppedReason: budget.reason,
      circuitTrips: 0,
    };
  }

  const candidates = await listPendingImageFactCandidates({ limit });
  let processed = 0;
  let okCount = 0;
  let consecutiveGatewayFails = 0;
  let stoppedReason: string | null = null;

  for (const c of candidates) {
    if (processed >= limit) break;
    if (Date.now() - started >= deadlineMs) {
      stoppedReason = "deadline";
      break;
    }
    const gate = await checkImageFactsBudget();
    if (!gate.ok) {
      stoppedReason = gate.reason;
      break;
    }

    try {
      const result = await extractAndStoreImageFacts({
        source: c.source,
        offerId: c.offerId,
        writeDb: true,
      });
      processed += 1;
      if (result.status === "ok") okCount += 1;
      if (result.error && isImageFactsPaidFallbackError(result.error) && result.status !== "ok") {
        consecutiveGatewayFails += 1;
      } else {
        consecutiveGatewayFails = 0;
      }
      if (consecutiveGatewayFails >= IMAGE_FACTS_TICK_CIRCUIT_FAILS) {
        stoppedReason = "circuit_breaker";
        break;
      }
    } catch (err) {
      processed += 1;
      consecutiveGatewayFails += 1;
      console.warn(
        `[image-facts] drain ${c.source}:${c.offerId}:`,
        err instanceof Error ? err.message : err,
      );
      if (consecutiveGatewayFails >= IMAGE_FACTS_TICK_CIRCUIT_FAILS) {
        stoppedReason = "circuit_breaker";
        break;
      }
    }
  }

  const remainingGuess = Math.max(0, candidates.length - processed);
  return {
    processed,
    okCount,
    remaining: remainingGuess,
    elapsed_ms: Date.now() - started,
    stoppedReason,
    circuitTrips: consecutiveGatewayFails >= IMAGE_FACTS_TICK_CIRCUIT_FAILS ? 1 : 0,
  };
}

export { IMAGE_FACTS_DRAIN_DEADLINE_MS };
