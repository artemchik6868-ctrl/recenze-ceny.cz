import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCpaTlRawOffer } from "./cpa-tl-sync.server";
import { getM1TopRawOffer } from "./m1-top-sync.server";
import { getShakesRawOffer } from "./shakes-sync.server";
import { parseJsonFromLlm } from "./ai-content-pipeline.cs";
import {
  buildLandingFactsLlmPrompt,
  extractCompactLandingFacts,
  formatLandingFactsForPrompt,
  htmlToPlainText,
  isClearlyCzLandingUrl,
  isUsableLandingFetch,
  landingUrlHash,
  listAdaptiveLandingUrls,
  listCpaTlCzLandingUrls,
  listM1TopLandingUrls,
  normalizeLlmLandingFacts,
  nextFetchErrorOutcome,
  nextThinOutcome,
  shouldInjectLandingFacts,
  type CompactLandingFacts,
  type LandingFactsExtractResult,
  type LandingFactsLang,
  type LandingFactsStatus,
} from "./landing-facts";

export type LiveLandingFactsTiming = {
  pickMs: number;
  fetchMs: number;
  extractMs: number;
  totalMs: number;
};

export type LiveLandingFactsResult = LandingFactsExtractResult & {
  timing: LiveLandingFactsTiming;
  promptBlock: string | null;
  method?: "heuristic" | "llm";
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

export type ShakesLandingFactsRow = {
  offer_id: number;
  source_url: string;
  url_hash: string;
  status: LandingFactsExtractResult["status"];
  lang_hint: string;
  method: string;
  facts: CompactLandingFacts | null;
  prompt_block: string | null;
  error: string | null;
  fail_count: number;
  locked_until: string | null;
  extracted_at: string;
  updated_at: string;
};

/** Same row shape as Shakes — separate table `m1_landing_facts`. */
export type M1LandingFactsRow = ShakesLandingFactsRow;

/** Same row shape as Shakes — separate table `cpa_tl_landing_facts`. */
export type CpaTlLandingFactsRow = ShakesLandingFactsRow;

export type LandingFactsInject = {
  urlHash: string | null;
  promptBlock: string | null;
  shelf: string | null;
  facts: CompactLandingFacts | null;
};

const FETCH_TIMEOUT_MS = 6_000;
const DRAIN_FETCH_TIMEOUT_MS = 10_000;

/** Short-lived cache so smoke (explicit load + initPipelineState) does not double-fetch. */
type LiveCacheEntry = { at: number; result: LiveLandingFactsResult };
const liveCache = new Map<number, LiveCacheEntry>();
const cpaTlLiveCache = new Map<number, LiveCacheEntry>();
const m1TopLiveCache = new Map<number, LiveCacheEntry>();
const LIVE_CACHE_TTL_MS = 60_000;
/** Soft cap so isolate reuse cannot retain unbounded offerId → result entries. */
const LIVE_CACHE_MAX = 200;

function getLiveCached(
  map: Map<number, LiveCacheEntry>,
  offerId: number,
  predicate?: (entry: LiveCacheEntry) => boolean,
): LiveLandingFactsResult | undefined {
  const cached = map.get(offerId);
  if (!cached) return undefined;
  if (Date.now() - cached.at >= LIVE_CACHE_TTL_MS) {
    map.delete(offerId);
    return undefined;
  }
  if (predicate && !predicate(cached)) return undefined;
  return cached.result;
}

function setLiveCached(
  map: Map<number, LiveCacheEntry>,
  offerId: number,
  result: LiveLandingFactsResult,
): void {
  if (map.size >= LIVE_CACHE_MAX && !map.has(offerId)) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  map.set(offerId, { at: Date.now(), result });
}

export const LANDING_FACTS_DRAIN_DEADLINE_MS = 30_000;

export function isLandingFactsLiveEnabled(): boolean {
  const v = String(process.env.LANDING_FACTS_LIVE ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "llm";
}

/** Opt-in live CPA.tl CZ landing extract (smoke / local only; prod uses cpa_tl_landing_facts). */
export function isCpaTlLandingFactsLiveEnabled(): boolean {
  const v = String(process.env.CPA_TL_LANDING_FACTS_LIVE ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "llm";
}

/** Prefer LLM extract when CPA_TL_LANDING_FACTS_LLM=1 or CPA_TL_LANDING_FACTS_LIVE=llm. */
export function isCpaTlLandingFactsLlmEnabled(): boolean {
  const llm = String(process.env.CPA_TL_LANDING_FACTS_LLM ?? "")
    .trim()
    .toLowerCase();
  if (llm === "1" || llm === "true" || llm === "yes") return true;
  const live = String(process.env.CPA_TL_LANDING_FACTS_LIVE ?? "")
    .trim()
    .toLowerCase();
  return live === "llm";
}

/** Opt-in live m1.top tracking_link extract (smoke / local only; no DB cache). */
export function isM1TopLandingFactsLiveEnabled(): boolean {
  const v = String(process.env.M1_TOP_LANDING_FACTS_LIVE ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "llm";
}

/** Prefer LLM extract when M1_TOP_LANDING_FACTS_LLM=1 or M1_TOP_LANDING_FACTS_LIVE=llm. */
export function isM1TopLandingFactsLlmEnabled(): boolean {
  const llm = String(process.env.M1_TOP_LANDING_FACTS_LLM ?? "")
    .trim()
    .toLowerCase();
  if (llm === "1" || llm === "true" || llm === "yes") return true;
  const live = String(process.env.M1_TOP_LANDING_FACTS_LIVE ?? "")
    .trim()
    .toLowerCase();
  return live === "llm";
}

/** Prefer LLM extract when LANDING_FACTS_LLM=1 or LANDING_FACTS_LIVE=llm. */
export function isLandingFactsLlmEnabled(): boolean {
  const llm = String(process.env.LANDING_FACTS_LLM ?? "")
    .trim()
    .toLowerCase();
  if (llm === "1" || llm === "true" || llm === "yes") return true;
  const live = String(process.env.LANDING_FACTS_LIVE ?? "")
    .trim()
    .toLowerCase();
  return live === "llm";
}

async function fetchLandingHtml(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<{ html: string; finalUrl: string; status: number }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; RecenzeCenyBot/1.0; +https://recenze-ceny.cz)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "cs-CZ,cs;q=0.9,en;q=0.8",
      },
    });
    const html = await res.text();
    return { html, finalUrl: res.url, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

export type UsableLandingFetch = {
  url: string;
  html: string;
  finalUrl: string;
  status: number;
  plainText: string;
  attempted: Array<{ url: string; status?: number; error?: string }>;
};

/**
 * Try candidates in order; skip 404/non-2xx and network errors until one is usable.
 * Throws if every candidate fails (message lists last attempt).
 */
async function fetchFirstUsableLandingHtml(
  candidates: string[],
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<UsableLandingFetch> {
  if (!candidates.length) {
    throw new Error("no landing url candidates");
  }
  const attempted: UsableLandingFetch["attempted"] = [];
  for (const url of candidates) {
    try {
      const { html, finalUrl, status } = await fetchLandingHtml(url, timeoutMs);
      const plainText = htmlToPlainText(html);
      if (isUsableLandingFetch({ status, plainTextChars: plainText.length })) {
        return { url, html, finalUrl, status, plainText, attempted };
      }
      attempted.push({ url, status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      attempted.push({ url, error: message });
    }
  }
  const last = attempted[attempted.length - 1];
  const detail = last
    ? last.error
      ? `${last.url}: ${last.error}`
      : `${last.url}: HTTP ${last.status}`
    : "unknown";
  throw new Error(
    `all ${candidates.length} landing candidate(s) failed (last: ${detail})`,
  );
}

async function callLandingFactsLlm(
  title: string,
  plainText: string,
): Promise<{
  facts: CompactLandingFacts | null;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  durationMs: number;
  rawContent: string;
}> {
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY or LOVABLE_API_KEY not configured");
  const url = process.env.AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "google/gemini-2.5-flash";
  const system =
    "Jsi extraktor produktových faktů. Vracíš pouze validní JSON. Nic nevymýšlíš. Textová pole faktů piš vždy česky (přelož krátká pole, ne celý landing).";
  const userPrompt = buildLandingFactsLlmPrompt(title, plainText);
  const started = Date.now();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (url.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.SITE_URL ?? "https://recenze-ceny.cz";
    headers["X-Title"] = "recenze-ceny";
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const content = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) throw new Error("AI gateway returned empty content");
  const parsed = parseJsonFromLlm<unknown>(content);
  const facts = normalizeLlmLandingFacts(parsed);
  const promptTokens = json.usage?.prompt_tokens ?? Math.ceil((system.length + userPrompt.length) / 4);
  const completionTokens = json.usage?.completion_tokens ?? Math.ceil(content.length / 4);
  return {
    facts,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: json.usage?.total_tokens ?? promptTokens + completionTokens,
    },
    durationMs: Date.now() - started,
    rawContent: content,
  };
}

function detectLangHint(text: string, sourceUrl: string): LandingFactsLang {
  if (/euit/i.test(sourceUrl)) return "it";
  if (/\b(gocce|ordina|dimagrimento)\b/i.test(text)) return "it";
  if (isClearlyCzLandingUrl(sourceUrl) || /cza?-|\bcz\d/i.test(sourceUrl)) return "cs";
  return "unknown";
}

function llmExtractOutcome(
  prev: { status: string; fail_count: number } | null | undefined,
  facts: CompactLandingFacts | null,
): {
  status: LandingFactsStatus;
  fail_count: number;
  locked_until: string | null;
  error?: string;
} {
  if (facts) {
    return { status: "ok", fail_count: 0, locked_until: null };
  }
  const thin = nextThinOutcome(prev?.status ?? "", prev?.fail_count ?? 0);
  const error =
    thin.status === "exhausted"
      ? `llm returned empty/unusable facts (exhausted after ${thin.fail_count} thin attempts)`
      : "llm returned empty/unusable facts";
  return {
    status: thin.status,
    fail_count: thin.fail_count,
    locked_until: thin.locked_until,
    error,
  };
}

export async function getShakesLandingFactsFromDb(
  offerId: number,
): Promise<ShakesLandingFactsRow | null> {
  const { data, error } = await supabaseAdmin
    .from("shakes_landing_facts")
    .select("*")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error) {
    console.warn(`[landing-facts] db read ${offerId}:`, error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as ShakesLandingFactsRow;
}

/** url_hash for source_hash — only when status=ok (else "none" / omit). */
export async function getShakesLandingUrlHashForSourceHash(offerId: number): Promise<string | null> {
  const row = await getShakesLandingFactsFromDb(offerId);
  if (row?.status === "ok" && row.url_hash) return row.url_hash;
  return null;
}

export async function getCpaTlLandingFactsFromDb(
  offerId: number,
): Promise<CpaTlLandingFactsRow | null> {
  const { data, error } = await supabaseAdmin
    .from("cpa_tl_landing_facts")
    .select("*")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error) {
    console.warn(`[landing-facts] cpa_tl db read ${offerId}:`, error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as CpaTlLandingFactsRow;
}

/** url_hash for source_hash — only when status=ok (else omit). */
export async function getCpaTlLandingUrlHashForSourceHash(offerId: number): Promise<string | null> {
  const row = await getCpaTlLandingFactsFromDb(offerId);
  if (row?.status === "ok" && row.url_hash) return row.url_hash;
  return null;
}

export async function getInjectableCpaTlLandingFacts(
  offerId: number,
): Promise<LandingFactsInject> {
  const row = await getCpaTlLandingFactsFromDb(offerId);
  if (!row) {
    return { urlHash: null, promptBlock: null, shelf: null, facts: null };
  }
  // Feed language_code=cz/cs already selected the URL — treat as CS for shelf.
  const decision = shouldInjectLandingFacts({
    status: row.status,
    langHint: "cs",
    sourceUrl: row.source_url,
    facts: row.facts,
  });
  return {
    urlHash: row.status === "ok" && row.url_hash ? row.url_hash : null,
    promptBlock: decision.promptBlock,
    shelf: decision.shelf,
    facts: decision.facts,
  };
}

export async function getM1TopLandingFactsFromDb(
  offerId: number,
): Promise<M1LandingFactsRow | null> {
  const { data, error } = await supabaseAdmin
    .from("m1_landing_facts")
    .select("*")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error) {
    console.warn(`[landing-facts] m1 db read ${offerId}:`, error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as M1LandingFactsRow;
}

/** url_hash for source_hash — only when status=ok (else omit). */
export async function getM1TopLandingUrlHashForSourceHash(offerId: number): Promise<string | null> {
  const row = await getM1TopLandingFactsFromDb(offerId);
  if (row?.status === "ok" && row.url_hash) return row.url_hash;
  return null;
}

export async function getInjectableM1TopLandingFacts(
  offerId: number,
): Promise<LandingFactsInject> {
  const row = await getM1TopLandingFactsFromDb(offerId);
  if (!row) {
    return { urlHash: null, promptBlock: null, shelf: null, facts: null };
  }
  // Offer already synced for MARKET_GEO=CZ — treat as CS for shelf even on promo hosts.
  const decision = shouldInjectLandingFacts({
    status: row.status,
    langHint: "cs",
    sourceUrl: row.source_url,
    facts: row.facts,
  });
  return {
    urlHash: row.status === "ok" && row.url_hash ? row.url_hash : null,
    promptBlock: decision.promptBlock,
    shelf: decision.shelf,
    facts: decision.facts,
  };
}

export async function getInjectableShakesLandingFacts(
  offerId: number,
): Promise<LandingFactsInject> {
  const row = await getShakesLandingFactsFromDb(offerId);
  if (!row) {
    return { urlHash: null, promptBlock: null, shelf: null, facts: null };
  }
  const decision = shouldInjectLandingFacts({
    status: row.status,
    langHint: row.lang_hint,
    sourceUrl: row.source_url,
    facts: row.facts,
  });
  return {
    urlHash: row.status === "ok" && row.url_hash ? row.url_hash : null,
    promptBlock: decision.promptBlock,
    shelf: decision.shelf,
    facts: decision.facts,
  };
}

async function upsertShakesLandingFacts(row: {
  offer_id: number;
  source_url: string;
  url_hash: string;
  status: LandingFactsExtractResult["status"];
  lang_hint: string;
  method: string;
  facts: CompactLandingFacts | null;
  prompt_block: string | null;
  error: string | null;
  fail_count: number;
  locked_until: string | null;
}): Promise<void> {
  const payload = {
    ...row,
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("shakes_landing_facts").upsert(payload as never, {
    onConflict: "offer_id",
  });
  if (error) {
    console.error(`[landing-facts] upsert ${row.offer_id}:`, error.message);
  }
}

/**
 * Fetch adaptive landing + LLM extract + upsert DB row.
 * Used by drain (and optionally smoke).
 * On 404/non-2xx, tries the next adaptive landing URL for the offer.
 */
export async function extractAndStoreShakesLandingFacts(
  offerId: number,
  opts: { fetchTimeoutMs?: number } = {},
): Promise<LiveLandingFactsResult> {
  const prev = await getShakesLandingFactsFromDb(offerId);
  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getShakesRawOffer(offerId);
  const candidates = raw ? listAdaptiveLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.title ?? `Offer ${offerId}`);
  const fetchTimeout = opts.fetchTimeoutMs ?? DRAIN_FETCH_TIMEOUT_MS;

  if (!raw || !candidates.length) {
    const result: LiveLandingFactsResult = {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no adaptive landing url",
    };
    await upsertShakesLandingFacts({
      offer_id: offerId,
      source_url: "",
      url_hash: "",
      status: "no_url",
      lang_hint: "unknown",
      method: "llm",
      facts: null,
      prompt_block: null,
      error: result.error ?? null,
      fail_count: 0,
      locked_until: null,
    });
    return result;
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates, fetchTimeout);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const urlHash = landingUrlHash(sourceUrl);
    const plain = fetched.plainText;
    const langHint = detectLangHint(plain, sourceUrl);

    if (langHint !== "cs" && !isClearlyCzLandingUrl(sourceUrl)) {
      const result: LiveLandingFactsResult = {
        sourceUrl,
        langHint,
        status: "skip_geo",
        facts: null,
        fullTextChars: plain.length,
        jsonChars: 0,
        promptBlock: null,
        method: "llm",
        timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
        error: "non-cs landing",
      };
      await upsertShakesLandingFacts({
        offer_id: offerId,
        source_url: sourceUrl,
        url_hash: urlHash,
        status: "skip_geo",
        lang_hint: langHint,
        method: "llm",
        facts: null,
        prompt_block: null,
        error: result.error ?? null,
        fail_count: 0,
        locked_until: null,
      });
      return result;
    }

    const extractStarted = Date.now();
    const llm = await callLandingFactsLlm(title, plain);
    const extractMs = Date.now() - extractStarted;
    const facts = llm.facts;
    const outcome = llmExtractOutcome(prev, facts);
    const decision = shouldInjectLandingFacts({
      status: outcome.status,
      langHint,
      sourceUrl,
      facts,
    });
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint,
      status: outcome.status,
      facts,
      fullTextChars: plain.length,
      jsonChars: facts ? JSON.stringify(facts).length : 0,
      promptBlock: decision.promptBlock,
      method: "llm",
      usage: llm.usage,
      timing: { pickMs, fetchMs, extractMs, totalMs: Date.now() - t0 },
      error: outcome.error,
    };
    await upsertShakesLandingFacts({
      offer_id: offerId,
      source_url: sourceUrl,
      url_hash: urlHash,
      status: outcome.status,
      lang_hint: langHint,
      method: "llm",
      facts,
      prompt_block: decision.promptBlock,
      error: outcome.error ?? null,
      fail_count: outcome.fail_count,
      locked_until: outcome.locked_until,
    });
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const fetchOutcome = nextFetchErrorOutcome(prev?.status ?? "", prev?.fail_count ?? 0);
    const urlHash = landingUrlHash(sourceUrl);
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "unknown",
      status: "fetch_error",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    await upsertShakesLandingFacts({
      offer_id: offerId,
      source_url: sourceUrl,
      url_hash: urlHash,
      status: "fetch_error",
      lang_hint: "unknown",
      method: "llm",
      facts: null,
      prompt_block: null,
      error: message,
      fail_count: fetchOutcome.fail_count,
      locked_until: fetchOutcome.locked_until,
    });
    return result;
  }
}

export type LandingFactsDrainResult = {
  ok: true;
  elapsed_ms: number;
  processed: number;
  okCount: number;
  failed: number;
  remaining: number;
  timedOut: boolean;
  items: Array<{
    offerId: number;
    status: string;
    elapsed_ms: number;
    error?: string;
  }>;
};

function needsExtract(
  raw: { landings?: Array<{ type?: string; url?: string }> },
  existing: ShakesLandingFactsRow | undefined,
): { need: boolean; sourceUrl: string | null } {
  const candidates = listAdaptiveLandingUrls(raw);
  const sourceUrl = candidates[0] ?? null;
  if (!candidates.length || !candidates.some((u) => isClearlyCzLandingUrl(u))) {
    return { need: false, sourceUrl };
  }
  if (!existing) return { need: true, sourceUrl };
  if (existing.locked_until && new Date(existing.locked_until).getTime() > Date.now()) {
    return { need: false, sourceUrl };
  }
  const candidateHashes = new Set(candidates.map((u) => landingUrlHash(u)));
  // Successful extract from a fallback URL still counts — don't re-queue while that URL remains.
  if (existing.status === "ok" && existing.url_hash && candidateHashes.has(existing.url_hash)) {
    return { need: false, sourceUrl };
  }
  const primaryHash = landingUrlHash(sourceUrl!);
  if (existing.url_hash !== primaryHash) return { need: true, sourceUrl };
  if (existing.status === "ok") return { need: false, sourceUrl };
  if (existing.status === "no_url" || existing.status === "skip_geo" || existing.status === "exhausted") {
    return { need: false, sourceUrl };
  }
  // thin / fetch_error — retry after cooldown
  return { need: true, sourceUrl };
}

/** Drain pending Shakes landing facts within a deadline budget. */
export async function drainShakesLandingFacts(opts: {
  deadlineMs?: number;
  limit?: number;
} = {}): Promise<LandingFactsDrainResult> {
  const deadlineMs = opts.deadlineMs ?? LANDING_FACTS_DRAIN_DEADLINE_MS;
  const limit = opts.limit ?? 8;
  const started = Date.now();
  const deadlineAt = started + deadlineMs;

  const { data: offers, error: offersErr } = await supabaseAdmin
    .from("shakes_offers")
    .select("offer_id, raw, is_active")
    .eq("is_active", true)
    .limit(500);
  if (offersErr) throw new Error(`shakes_offers: ${offersErr.message}`);

  const ids = (offers ?? []).map((o) => Number((o as { offer_id: number }).offer_id));
  const { data: factsRows } = await supabaseAdmin
    .from("shakes_landing_facts")
    .select("*")
    .in("offer_id", ids.length ? ids : [-1]);
  const byId = new Map<number, ShakesLandingFactsRow>();
  for (const row of (factsRows ?? []) as unknown as ShakesLandingFactsRow[]) {
    byId.set(row.offer_id, row);
  }

  const queue: number[] = [];
  for (const o of offers ?? []) {
    const offerId = Number((o as { offer_id: number }).offer_id);
    const raw = ((o as { raw?: unknown }).raw ?? {}) as {
      landings?: Array<{ type?: string; url?: string }>;
    };
    const { need } = needsExtract(raw, byId.get(offerId));
    if (need) queue.push(offerId);
  }

  const items: LandingFactsDrainResult["items"] = [];
  let okCount = 0;
  let failed = 0;
  let timedOut = false;

  for (const offerId of queue.slice(0, limit)) {
    if (Date.now() >= deadlineAt - 2_000) {
      timedOut = true;
      break;
    }
    const t = Date.now();
    try {
      const result = await extractAndStoreShakesLandingFacts(offerId, {
        fetchTimeoutMs: DRAIN_FETCH_TIMEOUT_MS,
      });
      const elapsed = Date.now() - t;
      items.push({
        offerId,
        status: result.status,
        elapsed_ms: elapsed,
        error: result.error,
      });
      if (result.status === "ok") okCount += 1;
      else if (result.status === "fetch_error") failed += 1;
      console.info(
        `[landing-facts-drain] ${offerId} status=${result.status} ms=${elapsed} json=${result.jsonChars}`,
      );
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      items.push({ offerId, status: "error", elapsed_ms: Date.now() - t, error: message });
      console.error(`[landing-facts-drain] ${offerId} failed:`, message);
    }
  }

  const remaining = Math.max(0, queue.length - items.length);
  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    processed: items.length,
    okCount,
    failed,
    remaining,
    timedOut,
    items,
  };
}

async function upsertM1LandingFacts(row: {
  offer_id: number;
  source_url: string;
  url_hash: string;
  status: LandingFactsExtractResult["status"];
  lang_hint: string;
  method: string;
  facts: CompactLandingFacts | null;
  prompt_block: string | null;
  error: string | null;
  fail_count: number;
  locked_until: string | null;
}): Promise<void> {
  const payload = {
    ...row,
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("m1_landing_facts").upsert(payload as never, {
    onConflict: "offer_id",
  });
  if (error) {
    console.error(`[landing-facts] m1 upsert ${row.offer_id}:`, error.message);
  }
}

/**
 * Fetch m1.top tracking_link landing + LLM extract + upsert DB row.
 * Offer is already CZ-filtered at sync — do not require cz* host.
 * On 404/non-2xx, tries the next tracking_link for the offer.
 */
export async function extractAndStoreM1TopLandingFacts(
  offerId: number,
  opts: { fetchTimeoutMs?: number } = {},
): Promise<LiveLandingFactsResult> {
  const prev = await getM1TopLandingFactsFromDb(offerId);
  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getM1TopRawOffer(offerId);
  const candidates = raw ? listM1TopLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.name ?? `Offer ${offerId}`);
  const fetchTimeout = opts.fetchTimeoutMs ?? DRAIN_FETCH_TIMEOUT_MS;

  if (!raw || !candidates.length) {
    const result: LiveLandingFactsResult = {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no tracking_link url in m1.top feed",
    };
    await upsertM1LandingFacts({
      offer_id: offerId,
      source_url: "",
      url_hash: "",
      status: "no_url",
      lang_hint: "unknown",
      method: "llm",
      facts: null,
      prompt_block: null,
      error: result.error ?? null,
      fail_count: 0,
      locked_until: null,
    });
    return result;
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates, fetchTimeout);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const urlHash = landingUrlHash(sourceUrl);
    const plain = fetched.plainText;

    const extractStarted = Date.now();
    const llm = await callLandingFactsLlm(title, plain);
    const extractMs = Date.now() - extractStarted;
    const facts = llm.facts;
    const outcome = llmExtractOutcome(prev, facts);
    const decision = shouldInjectLandingFacts({
      status: outcome.status,
      langHint: "cs",
      sourceUrl,
      facts,
    });
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "cs",
      status: outcome.status,
      facts,
      fullTextChars: plain.length,
      jsonChars: facts ? JSON.stringify(facts).length : 0,
      promptBlock: decision.promptBlock,
      method: "llm",
      usage: llm.usage,
      timing: { pickMs, fetchMs, extractMs, totalMs: Date.now() - t0 },
      error: outcome.error,
    };
    await upsertM1LandingFacts({
      offer_id: offerId,
      source_url: sourceUrl,
      url_hash: urlHash,
      status: outcome.status,
      lang_hint: "cs",
      method: "llm",
      facts,
      prompt_block: decision.promptBlock,
      error: outcome.error ?? null,
      fail_count: outcome.fail_count,
      locked_until: outcome.locked_until,
    });
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const fetchOutcome = nextFetchErrorOutcome(prev?.status ?? "", prev?.fail_count ?? 0);
    const urlHash = landingUrlHash(sourceUrl);
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "cs",
      status: "fetch_error",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    await upsertM1LandingFacts({
      offer_id: offerId,
      source_url: sourceUrl,
      url_hash: urlHash,
      status: "fetch_error",
      lang_hint: "cs",
      method: "llm",
      facts: null,
      prompt_block: null,
      error: message,
      fail_count: fetchOutcome.fail_count,
      locked_until: fetchOutcome.locked_until,
    });
    return result;
  }
}

function needsM1Extract(
  raw: { tracking_link?: Array<string | null | undefined> | null },
  existing: M1LandingFactsRow | undefined,
): { need: boolean; sourceUrl: string | null } {
  const candidates = listM1TopLandingUrls(raw);
  const sourceUrl = candidates[0] ?? null;
  if (!candidates.length) {
    return { need: false, sourceUrl };
  }
  if (!existing) return { need: true, sourceUrl };
  if (existing.locked_until && new Date(existing.locked_until).getTime() > Date.now()) {
    return { need: false, sourceUrl };
  }
  const candidateHashes = new Set(candidates.map((u) => landingUrlHash(u)));
  if (existing.status === "ok" && existing.url_hash && candidateHashes.has(existing.url_hash)) {
    return { need: false, sourceUrl };
  }
  const primaryHash = landingUrlHash(sourceUrl!);
  if (existing.url_hash !== primaryHash) return { need: true, sourceUrl };
  if (existing.status === "ok") return { need: false, sourceUrl };
  if (existing.status === "no_url" || existing.status === "skip_geo" || existing.status === "exhausted") {
    return { need: false, sourceUrl };
  }
  return { need: true, sourceUrl };
}

/** Drain pending m1.top landing facts within a deadline budget. */
export async function drainM1TopLandingFacts(opts: {
  deadlineMs?: number;
  limit?: number;
} = {}): Promise<LandingFactsDrainResult> {
  const deadlineMs = opts.deadlineMs ?? LANDING_FACTS_DRAIN_DEADLINE_MS;
  const limit = opts.limit ?? 8;
  const started = Date.now();
  const deadlineAt = started + deadlineMs;

  const { data: offers, error: offersErr } = await supabaseAdmin
    .from("m1_offers")
    .select("offer_id, raw, is_active")
    .eq("is_active", true)
    .limit(500);
  if (offersErr) throw new Error(`m1_offers: ${offersErr.message}`);

  const ids = (offers ?? []).map((o) => Number((o as { offer_id: number }).offer_id));
  const { data: factsRows } = await supabaseAdmin
    .from("m1_landing_facts")
    .select("*")
    .in("offer_id", ids.length ? ids : [-1]);
  const byId = new Map<number, M1LandingFactsRow>();
  for (const row of (factsRows ?? []) as unknown as M1LandingFactsRow[]) {
    byId.set(row.offer_id, row);
  }

  const queue: number[] = [];
  for (const o of offers ?? []) {
    const offerId = Number((o as { offer_id: number }).offer_id);
    const raw = ((o as { raw?: unknown }).raw ?? {}) as {
      tracking_link?: Array<string | null | undefined> | null;
    };
    const { need } = needsM1Extract(raw, byId.get(offerId));
    if (need) queue.push(offerId);
  }

  const items: LandingFactsDrainResult["items"] = [];
  let okCount = 0;
  let failed = 0;
  let timedOut = false;

  for (const offerId of queue.slice(0, limit)) {
    if (Date.now() >= deadlineAt - 2_000) {
      timedOut = true;
      break;
    }
    const t = Date.now();
    try {
      const result = await extractAndStoreM1TopLandingFacts(offerId, {
        fetchTimeoutMs: DRAIN_FETCH_TIMEOUT_MS,
      });
      const elapsed = Date.now() - t;
      items.push({
        offerId,
        status: result.status,
        elapsed_ms: elapsed,
        error: result.error,
      });
      if (result.status === "ok") okCount += 1;
      else if (result.status === "fetch_error") failed += 1;
      console.info(
        `[landing-facts-drain] m1_top ${offerId} status=${result.status} ms=${elapsed} json=${result.jsonChars}`,
      );
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      items.push({ offerId, status: "error", elapsed_ms: Date.now() - t, error: message });
      console.error(`[landing-facts-drain] m1_top ${offerId} failed:`, message);
    }
  }

  const remaining = Math.max(0, queue.length - items.length);
  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    processed: items.length,
    okCount,
    failed,
    remaining,
    timedOut,
    items,
  };
}

async function upsertCpaTlLandingFacts(row: {
  offer_id: number;
  source_url: string;
  url_hash: string;
  status: LandingFactsExtractResult["status"];
  lang_hint: string;
  method: string;
  facts: CompactLandingFacts | null;
  prompt_block: string | null;
  error: string | null;
  fail_count: number;
  locked_until: string | null;
}): Promise<void> {
  const payload = {
    ...row,
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("cpa_tl_landing_facts").upsert(payload as never, {
    onConflict: "offer_id",
  });
  if (error) {
    console.error(`[landing-facts] cpa_tl upsert ${row.offer_id}:`, error.message);
  }
}

/**
 * Fetch CPA.tl CZ landing + LLM extract + upsert DB row.
 * URL comes from landings[] with language_code cz/cs — do not require cz* host.
 * On 404/non-2xx, tries the next cz/cs landing for the offer.
 */
export async function extractAndStoreCpaTlLandingFacts(
  offerId: number,
  opts: { fetchTimeoutMs?: number } = {},
): Promise<LiveLandingFactsResult> {
  const prev = await getCpaTlLandingFactsFromDb(offerId);
  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getCpaTlRawOffer(offerId);
  const candidates = raw ? listCpaTlCzLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.title ?? `Offer ${offerId}`);
  const fetchTimeout = opts.fetchTimeoutMs ?? DRAIN_FETCH_TIMEOUT_MS;

  if (!raw || !candidates.length) {
    const result: LiveLandingFactsResult = {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no cz/cs landing url in cpa_tl feed",
    };
    await upsertCpaTlLandingFacts({
      offer_id: offerId,
      source_url: "",
      url_hash: "",
      status: "no_url",
      lang_hint: "unknown",
      method: "llm",
      facts: null,
      prompt_block: null,
      error: result.error ?? null,
      fail_count: 0,
      locked_until: null,
    });
    return result;
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates, fetchTimeout);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const urlHash = landingUrlHash(sourceUrl);
    const plain = fetched.plainText;

    const extractStarted = Date.now();
    const llm = await callLandingFactsLlm(title, plain);
    const extractMs = Date.now() - extractStarted;
    const facts = llm.facts;
    const outcome = llmExtractOutcome(prev, facts);
    const decision = shouldInjectLandingFacts({
      status: outcome.status,
      langHint: "cs",
      sourceUrl,
      facts,
    });
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "cs",
      status: outcome.status,
      facts,
      fullTextChars: plain.length,
      jsonChars: facts ? JSON.stringify(facts).length : 0,
      promptBlock: decision.promptBlock,
      method: "llm",
      usage: llm.usage,
      timing: { pickMs, fetchMs, extractMs, totalMs: Date.now() - t0 },
      error: outcome.error,
    };
    await upsertCpaTlLandingFacts({
      offer_id: offerId,
      source_url: sourceUrl,
      url_hash: urlHash,
      status: outcome.status,
      lang_hint: "cs",
      method: "llm",
      facts,
      prompt_block: decision.promptBlock,
      error: outcome.error ?? null,
      fail_count: outcome.fail_count,
      locked_until: outcome.locked_until,
    });
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const fetchOutcome = nextFetchErrorOutcome(prev?.status ?? "", prev?.fail_count ?? 0);
    const urlHash = landingUrlHash(sourceUrl);
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "cs",
      status: "fetch_error",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    await upsertCpaTlLandingFacts({
      offer_id: offerId,
      source_url: sourceUrl,
      url_hash: urlHash,
      status: "fetch_error",
      lang_hint: "cs",
      method: "llm",
      facts: null,
      prompt_block: null,
      error: message,
      fail_count: fetchOutcome.fail_count,
      locked_until: fetchOutcome.locked_until,
    });
    return result;
  }
}

function needsCpaTlExtract(
  raw: {
    landings?: Array<{ url?: string; language_code?: string; language?: string }>;
  },
  existing: CpaTlLandingFactsRow | undefined,
): { need: boolean; sourceUrl: string | null } {
  const candidates = listCpaTlCzLandingUrls(raw);
  const sourceUrl = candidates[0] ?? null;
  if (!candidates.length) {
    return { need: false, sourceUrl };
  }
  if (!existing) return { need: true, sourceUrl };
  if (existing.locked_until && new Date(existing.locked_until).getTime() > Date.now()) {
    return { need: false, sourceUrl };
  }
  const candidateHashes = new Set(candidates.map((u) => landingUrlHash(u)));
  if (existing.status === "ok" && existing.url_hash && candidateHashes.has(existing.url_hash)) {
    return { need: false, sourceUrl };
  }
  const primaryHash = landingUrlHash(sourceUrl!);
  if (existing.url_hash !== primaryHash) return { need: true, sourceUrl };
  if (existing.status === "ok") return { need: false, sourceUrl };
  if (existing.status === "no_url" || existing.status === "skip_geo" || existing.status === "exhausted") {
    return { need: false, sourceUrl };
  }
  return { need: true, sourceUrl };
}

/** Drain pending CPA.tl CZ landing facts within a deadline budget. */
export async function drainCpaTlLandingFacts(opts: {
  deadlineMs?: number;
  limit?: number;
} = {}): Promise<LandingFactsDrainResult> {
  const deadlineMs = opts.deadlineMs ?? LANDING_FACTS_DRAIN_DEADLINE_MS;
  const limit = opts.limit ?? 8;
  const started = Date.now();
  const deadlineAt = started + deadlineMs;

  const { data: offers, error: offersErr } = await supabaseAdmin
    .from("cpa_tl_offers")
    .select("offer_id, raw, is_active")
    .eq("is_active", true)
    .limit(500);
  if (offersErr) throw new Error(`cpa_tl_offers: ${offersErr.message}`);

  const ids = (offers ?? []).map((o) => Number((o as { offer_id: number }).offer_id));
  const { data: factsRows } = await supabaseAdmin
    .from("cpa_tl_landing_facts")
    .select("*")
    .in("offer_id", ids.length ? ids : [-1]);
  const byId = new Map<number, CpaTlLandingFactsRow>();
  for (const row of (factsRows ?? []) as unknown as CpaTlLandingFactsRow[]) {
    byId.set(row.offer_id, row);
  }

  const queue: number[] = [];
  for (const o of offers ?? []) {
    const offerId = Number((o as { offer_id: number }).offer_id);
    const raw = ((o as { raw?: unknown }).raw ?? {}) as {
      landings?: Array<{ url?: string; language_code?: string; language?: string }>;
    };
    const { need } = needsCpaTlExtract(raw, byId.get(offerId));
    if (need) queue.push(offerId);
  }

  const items: LandingFactsDrainResult["items"] = [];
  let okCount = 0;
  let failed = 0;
  let timedOut = false;

  for (const offerId of queue.slice(0, limit)) {
    if (Date.now() >= deadlineAt - 2_000) {
      timedOut = true;
      break;
    }
    const t = Date.now();
    try {
      const result = await extractAndStoreCpaTlLandingFacts(offerId, {
        fetchTimeoutMs: DRAIN_FETCH_TIMEOUT_MS,
      });
      const elapsed = Date.now() - t;
      items.push({
        offerId,
        status: result.status,
        elapsed_ms: elapsed,
        error: result.error,
      });
      if (result.status === "ok") okCount += 1;
      else if (result.status === "fetch_error") failed += 1;
      console.info(
        `[landing-facts-drain] cpa_tl ${offerId} status=${result.status} ms=${elapsed} json=${result.jsonChars}`,
      );
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      items.push({ offerId, status: "error", elapsed_ms: Date.now() - t, error: message });
      console.error(`[landing-facts-drain] cpa_tl ${offerId} failed:`, message);
    }
  }

  const remaining = Math.max(0, queue.length - items.length);
  return {
    ok: true,
    elapsed_ms: Date.now() - started,
    processed: items.length,
    okCount,
    failed,
    remaining,
    timedOut,
    items,
  };
}

/**
 * Live fetch + LLM compact extract (test / opt-in).
 * Does not write to DB. Sends full page plain text to the LLM (soft 100k ceiling).
 */
export async function loadLiveShakesLandingFactsWithLlm(
  offerId: number,
): Promise<LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null }> {
  const cached = getLiveCached(liveCache, offerId, (e) => e.result.method === "llm");
  if (cached) {
    return { ...cached, heuristicFacts: null };
  }

  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getShakesRawOffer(offerId);
  const candidates = raw ? listAdaptiveLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.title ?? `Offer ${offerId}`);

  if (!raw || !candidates.length) {
    return {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      heuristicFacts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no adaptive landing url",
    };
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const plain = fetched.plainText;
    const html = fetched.html;
    const langHint = detectLangHint(plain, sourceUrl);
    const heuristic = extractCompactLandingFacts({
      html,
      sourceUrl,
      title,
      requireCs: false,
    });

    const extractStarted = Date.now();
    const llm = await callLandingFactsLlm(title, plain);
    const extractMs = Date.now() - extractStarted;
    const facts = llm.facts;
    const jsonChars = facts ? JSON.stringify(facts).length : 0;
    const decision = shouldInjectLandingFacts({
      status: facts ? "ok" : "thin",
      langHint,
      sourceUrl,
      facts,
    });
    const result: LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null } = {
      sourceUrl,
      langHint,
      status: facts ? "ok" : "thin",
      facts,
      heuristicFacts: heuristic.facts,
      fullTextChars: plain.length,
      jsonChars,
      promptBlock: decision.promptBlock,
      method: "llm",
      usage: llm.usage,
      timing: {
        pickMs,
        fetchMs,
        extractMs,
        totalMs: Date.now() - t0,
      },
      error: facts ? undefined : "llm returned empty/unusable facts",
    };
    setLiveCached(liveCache, offerId, result);
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const result: LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null } = {
      sourceUrl,
      langHint: "unknown",
      status: "fetch_error",
      facts: null,
      heuristicFacts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    setLiveCached(liveCache, offerId, result);
    return result;
  }
}

/**
 * Live fetch + LLM compact extract for a CPA.tl offer (no DB).
 * Picks landings[] with language_code cz/cs from the partner feed.
 */
export async function loadLiveCpaTlLandingFactsWithLlm(
  offerId: number,
): Promise<LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null }> {
  const cached = getLiveCached(cpaTlLiveCache, offerId, (e) => e.result.method === "llm");
  if (cached) {
    return { ...cached, heuristicFacts: null };
  }

  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getCpaTlRawOffer(offerId);
  const candidates = raw ? listCpaTlCzLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.title ?? `Offer ${offerId}`);

  if (!raw || !candidates.length) {
    return {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      heuristicFacts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no cz/cs landing url in cpa.tl feed",
    };
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const plain = fetched.plainText;
    const html = fetched.html;
    const heuristic = extractCompactLandingFacts({
      html,
      sourceUrl,
      title,
      requireCs: false,
    });

    const extractStarted = Date.now();
    const llm = await callLandingFactsLlm(title, plain);
    const extractMs = Date.now() - extractStarted;
    const facts = llm.facts;
    const jsonChars = facts ? JSON.stringify(facts).length : 0;
    // Feed language_code=cz already selected the URL — treat as CS for inject.
    const decision = shouldInjectLandingFacts({
      status: facts ? "ok" : "thin",
      langHint: "cs",
      sourceUrl,
      facts,
    });
    const promptBlock =
      decision.promptBlock ??
      (facts ? formatLandingFactsForPrompt(facts) : null);
    const result: LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null } = {
      sourceUrl,
      langHint: "cs",
      status: facts ? "ok" : "thin",
      facts,
      heuristicFacts: heuristic.facts,
      fullTextChars: plain.length,
      jsonChars,
      promptBlock,
      method: "llm",
      usage: llm.usage,
      timing: {
        pickMs,
        fetchMs,
        extractMs,
        totalMs: Date.now() - t0,
      },
      error: facts ? undefined : "llm returned empty/unusable facts",
    };
    setLiveCached(cpaTlLiveCache, offerId, result);
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const result: LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null } = {
      sourceUrl,
      langHint: "cs",
      status: "fetch_error",
      facts: null,
      heuristicFacts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    setLiveCached(cpaTlLiveCache, offerId, result);
    return result;
  }
}

/**
 * Live fetch + compact extract for a CPA.tl offer (heuristic; no LLM, no DB).
 * Picks landings[] with language_code cz/cs from the partner feed.
 */
export async function loadLiveCpaTlLandingFacts(
  offerId: number,
): Promise<LiveLandingFactsResult> {
  const cached = getLiveCached(cpaTlLiveCache, offerId);
  if (cached) {
    return cached;
  }

  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getCpaTlRawOffer(offerId);
  const candidates = raw ? listCpaTlCzLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.title ?? `Offer ${offerId}`);

  if (!raw || !candidates.length) {
    const result: LiveLandingFactsResult = {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "heuristic",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no cz/cs landing url in cpa.tl feed",
    };
    setLiveCached(cpaTlLiveCache, offerId, result);
    return result;
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const extractStarted = Date.now();
    // Feed language_code already marks CZ — do not require cz* host.
    const extracted = extractCompactLandingFacts({
      html: fetched.html,
      sourceUrl,
      title,
      requireCs: false,
    });
    const extractMs = Date.now() - extractStarted;
    // Trust feed language_code=cz for inject even when host is xcartpro.com.
    const decision = shouldInjectLandingFacts({
      status: extracted.status,
      langHint: "cs",
      sourceUrl,
      facts: extracted.facts,
    });
    const promptBlock =
      decision.promptBlock ??
      (extracted.status === "ok" && extracted.facts
        ? formatLandingFactsForPrompt(extracted.facts)
        : null);
    const result: LiveLandingFactsResult = {
      ...extracted,
      sourceUrl,
      langHint: extracted.langHint === "unknown" ? "cs" : extracted.langHint,
      promptBlock,
      method: "heuristic",
      timing: {
        pickMs,
        fetchMs,
        extractMs,
        totalMs: Date.now() - t0,
      },
    };
    setLiveCached(cpaTlLiveCache, offerId, result);
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "cs",
      status: "fetch_error",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "heuristic",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    setLiveCached(cpaTlLiveCache, offerId, result);
    return result;
  }
}

/**
 * Live fetch + LLM compact extract for an m1.top offer (no DB).
 * Picks first usable URL from tracking_link[] (prefer CZ-looking hosts).
 */
export async function loadLiveM1TopLandingFactsWithLlm(
  offerId: number,
): Promise<LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null }> {
  const cached = getLiveCached(m1TopLiveCache, offerId, (e) => e.result.method === "llm");
  if (cached) {
    return { ...cached, heuristicFacts: null };
  }

  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getM1TopRawOffer(offerId);
  const candidates = raw ? listM1TopLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.name ?? `Offer ${offerId}`);

  if (!raw || !candidates.length) {
    return {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      heuristicFacts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no tracking_link url in m1.top feed",
    };
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const plain = fetched.plainText;
    const html = fetched.html;
    const heuristic = extractCompactLandingFacts({
      html,
      sourceUrl,
      title,
      requireCs: false,
    });

    const extractStarted = Date.now();
    const llm = await callLandingFactsLlm(title, plain);
    const extractMs = Date.now() - extractStarted;
    const facts = llm.facts;
    const jsonChars = facts ? JSON.stringify(facts).length : 0;
    // Offer already synced for MARKET_GEO=CZ — treat as CS for inject.
    const decision = shouldInjectLandingFacts({
      status: facts ? "ok" : "thin",
      langHint: "cs",
      sourceUrl,
      facts,
    });
    const promptBlock =
      decision.promptBlock ??
      (facts ? formatLandingFactsForPrompt(facts) : null);
    const result: LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null } = {
      sourceUrl,
      langHint: "cs",
      status: facts ? "ok" : "thin",
      facts,
      heuristicFacts: heuristic.facts,
      fullTextChars: plain.length,
      jsonChars,
      promptBlock,
      method: "llm",
      usage: llm.usage,
      timing: {
        pickMs,
        fetchMs,
        extractMs,
        totalMs: Date.now() - t0,
      },
      error: facts ? undefined : "llm returned empty/unusable facts",
    };
    setLiveCached(m1TopLiveCache, offerId, result);
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const result: LiveLandingFactsResult & { heuristicFacts: CompactLandingFacts | null } = {
      sourceUrl,
      langHint: "cs",
      status: "fetch_error",
      facts: null,
      heuristicFacts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "llm",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    setLiveCached(m1TopLiveCache, offerId, result);
    return result;
  }
}

/**
 * Live fetch + compact extract for an m1.top offer (heuristic; no LLM, no DB).
 */
export async function loadLiveM1TopLandingFacts(
  offerId: number,
): Promise<LiveLandingFactsResult> {
  const cached = getLiveCached(m1TopLiveCache, offerId);
  if (cached) {
    return cached;
  }

  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getM1TopRawOffer(offerId);
  const candidates = raw ? listM1TopLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;
  const title = String(raw?.name ?? `Offer ${offerId}`);

  if (!raw || !candidates.length) {
    const result: LiveLandingFactsResult = {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "heuristic",
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no tracking_link url in m1.top feed",
    };
    setLiveCached(m1TopLiveCache, offerId, result);
    return result;
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const extractStarted = Date.now();
    const extracted = extractCompactLandingFacts({
      html: fetched.html,
      sourceUrl,
      title,
      requireCs: false,
    });
    const extractMs = Date.now() - extractStarted;
    const decision = shouldInjectLandingFacts({
      status: extracted.status,
      langHint: "cs",
      sourceUrl,
      facts: extracted.facts,
    });
    const promptBlock =
      decision.promptBlock ??
      (extracted.status === "ok" && extracted.facts
        ? formatLandingFactsForPrompt(extracted.facts)
        : null);
    const result: LiveLandingFactsResult = {
      ...extracted,
      sourceUrl,
      langHint: extracted.langHint === "unknown" ? "cs" : extracted.langHint,
      promptBlock,
      method: "heuristic",
      timing: {
        pickMs,
        fetchMs,
        extractMs,
        totalMs: Date.now() - t0,
      },
    };
    setLiveCached(m1TopLiveCache, offerId, result);
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "cs",
      status: "fetch_error",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      method: "heuristic",
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    setLiveCached(m1TopLiveCache, offerId, result);
    return result;
  }
}

/** Live fetch + compact extract for a Shakes offer (heuristic; no LLM). */
export async function loadLiveShakesLandingFacts(
  offerId: number,
  opts: { requireCs?: boolean } = {},
): Promise<LiveLandingFactsResult> {
  const cached = getLiveCached(liveCache, offerId);
  if (cached) {
    return cached;
  }

  const t0 = Date.now();
  const pickStarted = Date.now();
  const raw = await getShakesRawOffer(offerId);
  const candidates = raw ? listAdaptiveLandingUrls(raw) : [];
  const primaryUrl = candidates[0] ?? null;
  const pickMs = Date.now() - pickStarted;

  if (!raw || !candidates.length) {
    const result: LiveLandingFactsResult = {
      sourceUrl: primaryUrl ?? "",
      langHint: "unknown",
      status: "no_url",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      timing: { pickMs, fetchMs: 0, extractMs: 0, totalMs: Date.now() - t0 },
      error: "no adaptive landing url",
    };
    setLiveCached(liveCache, offerId, result);
    return result;
  }

  const fetchStarted = Date.now();
  let sourceUrl = primaryUrl!;
  try {
    const fetched = await fetchFirstUsableLandingHtml(candidates);
    const fetchMs = Date.now() - fetchStarted;
    sourceUrl = fetched.url;
    const extractStarted = Date.now();
    const extracted = extractCompactLandingFacts({
      html: fetched.html,
      sourceUrl,
      title: String(raw.title ?? ""),
      requireCs: opts.requireCs !== false,
    });
    const extractMs = Date.now() - extractStarted;
    const promptBlock =
      extracted.status === "ok" && extracted.facts
        ? formatLandingFactsForPrompt(extracted.facts)
        : null;
    const result: LiveLandingFactsResult = {
      ...extracted,
      sourceUrl,
      promptBlock,
      timing: {
        pickMs,
        fetchMs,
        extractMs,
        totalMs: Date.now() - t0,
      },
    };
    setLiveCached(liveCache, offerId, result);
    return result;
  } catch (err) {
    const fetchMs = Date.now() - fetchStarted;
    const message = err instanceof Error ? err.message : String(err);
    const result: LiveLandingFactsResult = {
      sourceUrl,
      langHint: "unknown",
      status: "fetch_error",
      facts: null,
      fullTextChars: 0,
      jsonChars: 0,
      promptBlock: null,
      timing: { pickMs, fetchMs, extractMs: 0, totalMs: Date.now() - t0 },
      error: message,
    };
    setLiveCached(liveCache, offerId, result);
    return result;
  }
}
