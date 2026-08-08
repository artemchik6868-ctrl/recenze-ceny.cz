/** Compact vision facts from product images (OpenRouter multimodal). */

import type { OfferSource } from "./types";
import {
  classifyImageExhaustToFacts,
  factsReprobeThinLlmDays,
  factsReprobeTransientFetchDays,
  shouldReprobeExhaustedFacts,
} from "./facts-recovery";

export const IMAGE_FACTS_SOURCES: readonly OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
] as const;

export const IMAGE_FACTS_DRAIN_DEADLINE_MS = 30_000;
export const IMAGE_FACTS_MAX_JSON_CHARS = 1200;
export const IMAGE_FACTS_MIN_BYTES = 800;
export const IMAGE_FACTS_MAX_BYTES = 4 * 1024 * 1024;
export const IMAGE_FACTS_DOWNLOAD_TIMEOUT_MS = 8_000;
export const IMAGE_FACTS_LLM_TIMEOUT_MS = 45_000;
export const IMAGE_FACTS_MAX_TOKENS = 800;
export const IMAGE_FACTS_TICK_CIRCUIT_FAILS = 3;
export const FETCH_EXHAUST_AFTER = 5;
/** Soft re-probe exhausted rows older than this many days (0 = disabled). Default thin/LLM. */
export const IMAGE_FACTS_REPROBE_EXHAUSTED_DAYS_DEFAULT = 14;
/** Soft re-probe for fetch-class exhausted (CDN/egress recovery). */
export const IMAGE_FACTS_REPROBE_FETCH_DAYS_DEFAULT = 7;
/** Max forced re-probes per drain tick. */
export const IMAGE_FACTS_REPROBE_PER_TICK_DEFAULT = 1;

/** Default env-backed caps (Phase 4 cautious; override via env). */
export const IMAGE_FACTS_DEFAULTS = {
  model: "openrouter/free",
  maxLlmPerDay: 70,
  maxPaidPerDay: 8,
  maxTokensPerDay: 150_000,
  maxLlmPerImage: 2,
} as const;

export type ImageFactsExhaustClass = "llm_cap" | "safety" | "fetch" | "other";

/** Classify terminal exhausted errors — ops + re-probe policy. */
export function classifyImageFactsExhaustError(
  error: string | null | undefined,
): ImageFactsExhaustClass {
  const e = String(error ?? "");
  if (!e) return "other";
  if (e.includes("max_llm_per_image")) return "llm_cap";
  if (/User Safety|safety/i.test(e) || /parse LLM JSON/i.test(e)) return "safety";
  if (
    /^http_\d+/i.test(e) ||
    e.startsWith("download:") ||
    e.startsWith("preflight:") ||
    /fetch_error|url_only/i.test(e)
  ) {
    return "fetch";
  }
  return "other";
}

/** Days before thin/LLM exhausted rows may be force-reprobed. */
export function imageFactsReprobeExhaustedDays(): number {
  const n = Number(process.env.IMAGE_FACTS_REPROBE_EXHAUSTED_DAYS);
  if (Number.isFinite(n) && n >= 0) return n;
  return factsReprobeThinLlmDays();
}

/** Days before fetch-class exhausted may re-probe (CDN recovery). */
export function imageFactsReprobeFetchDays(): number {
  const n = Number(process.env.IMAGE_FACTS_REPROBE_FETCH_DAYS);
  if (Number.isFinite(n) && n >= 0) return n;
  return factsReprobeTransientFetchDays();
}

export function imageFactsReprobePerTick(): number {
  const n = Number(process.env.IMAGE_FACTS_REPROBE_PER_TICK);
  if (Number.isFinite(n) && n >= 0) return Math.min(3, Math.floor(n));
  return IMAGE_FACTS_REPROBE_PER_TICK_DEFAULT;
}

/**
 * Whether a terminal exhausted row is eligible for a rare force re-probe.
 * thin_llm (safety/llm_cap): after thin TTL; transient_fetch: after fetch TTL.
 */
export function shouldReprobeExhaustedImageFacts(opts: {
  status: string;
  error: string | null | undefined;
  updatedAt: string | null | undefined;
  now?: number;
  minAgeDays?: number;
}): boolean {
  const imageCls = classifyImageFactsExhaustError(opts.error);
  const exhaustClass = classifyImageExhaustToFacts(imageCls);
  const defaultDays =
    exhaustClass === "transient_fetch"
      ? imageFactsReprobeFetchDays()
      : imageFactsReprobeExhaustedDays();
  return shouldReprobeExhaustedFacts({
    status: opts.status,
    exhaustClass,
    updatedAt: opts.updatedAt,
    now: opts.now,
    minAgeDays: opts.minAgeDays ?? defaultDays,
  });
}

export type CompactImageFacts = {
  /** Catalog-aligned type — not free-form. */
  productType: string | null;
  /** topical | oral | other */
  application: string | null;
  releaseForm: string | null;
  packaging: string | null;
  detectedText: string | null;
  briefDescription: string | null;
};

export type ImageFactsStatus = "ok" | "thin" | "no_image" | "fetch_error" | "exhausted";

export type ImageFactsMethod = "free" | "paid" | "none";

export type ImageFactsExtractResult = {
  imageUrl: string;
  imageHash: string;
  status: ImageFactsStatus;
  method: ImageFactsMethod;
  facts: CompactImageFacts | null;
  promptBlock: string | null;
  jsonChars: number;
  error?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  /** Actual model slug from gateway response (falls back to requested). */
  model?: string | null;
  /** OpenRouter generation id (`id` field), when present. */
  generationId?: string | null;
};

/** Pull routed model + generation id from an OpenAI-compatible chat completion body. */
export function parseImageFactsGatewayMeta(
  json: unknown,
  requestedModel: string,
): { model: string; generationId: string | null } {
  const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const modelRaw = typeof o.model === "string" ? o.model.trim() : "";
  const idRaw = typeof o.id === "string" ? o.id.trim() : "";
  const requested = requestedModel.trim();
  return {
    model: modelRaw || requested || "unknown",
    generationId: idRaw || null,
  };
}

export function isImageFactsSource(source: string): source is OfferSource {
  return (IMAGE_FACTS_SOURCES as readonly string[]).includes(source);
}

export function isImageFactsEnabled(): boolean {
  const v = String(process.env.IMAGE_FACTS_ENABLED ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Smoke/hooks may run without enabling mass drain. */
export function isImageFactsSmokeEnabled(): boolean {
  const v = String(process.env.IMAGE_FACTS_SMOKE ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function imageFactsFreeModel(): string {
  return (
    String(process.env.IMAGE_FACTS_MODEL ?? "").trim() || IMAGE_FACTS_DEFAULTS.model
  );
}

export function imageFactsMaxLlmPerDay(): number {
  const n = Number(process.env.IMAGE_FACTS_MAX_LLM_PER_DAY);
  return Number.isFinite(n) && n > 0 ? n : IMAGE_FACTS_DEFAULTS.maxLlmPerDay;
}

export function imageFactsMaxPaidPerDay(): number {
  const n = Number(process.env.IMAGE_FACTS_MAX_PAID_PER_DAY);
  return Number.isFinite(n) && n > 0 ? n : IMAGE_FACTS_DEFAULTS.maxPaidPerDay;
}

export function imageFactsMaxTokensPerDay(): number {
  const n = Number(process.env.IMAGE_FACTS_MAX_TOKENS_PER_DAY);
  return Number.isFinite(n) && n > 0 ? n : IMAGE_FACTS_DEFAULTS.maxTokensPerDay;
}

export function imageFactsMaxLlmPerImage(): number {
  const n = Number(process.env.IMAGE_FACTS_MAX_LLM_PER_IMAGE);
  return Number.isFinite(n) && n > 0 ? n : IMAGE_FACTS_DEFAULTS.maxLlmPerImage;
}

/**
 * Free vision router failures that warrant one paid retry (Gemini Flash).
 * Includes gateway errors and non-JSON safety/refusal text.
 */
export function isImageFactsPaidFallbackError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("429")) return true;
  if (msg.includes("502") || msg.includes("503") || msg.includes("504")) return true;
  if (msg.includes("model") && (msg.includes("unavailable") || msg.includes("not found"))) {
    return true;
  }
  if (msg.includes("empty content")) return true;
  if (msg.includes("no endpoints")) return true;
  if (msg.includes("rate limit")) return true;
  // Free router sometimes returns non-JSON safety/refusal text
  if (msg.includes("failed to parse llm json")) return true;
  if (msg.includes("user safety")) return true;
  if (msg.includes("safety")) return true;
  if (msg.includes("refus")) return true;
  return false;
}

export function backoffLockedUntilMinutes(failCount: number): number {
  return Math.min(360, 15 * Math.max(1, 2 ** Math.min(failCount, 5)));
}

export function backoffLockedUntilFromStreak(streak: number, now = Date.now()): string {
  const minutes = backoffLockedUntilMinutes(streak);
  return new Date(now + minutes * 60_000).toISOString();
}

function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function imageUrlHash(url: string): string {
  return hashString(url.trim().toLowerCase());
}

export function isTerminalImageFactsStatus(status: string): boolean {
  return status === "ok" || status === "no_image" || status === "exhausted";
}

/** Whether this row still needs (or allows) another extract attempt. */
export function needsImageFactsExtract(opts: {
  status: string | null | undefined;
  imageHash: string;
  rowImageHash: string | null | undefined;
  llmAttempts: number;
  lockedUntil: string | null | undefined;
  now?: number;
}): boolean {
  const now = opts.now ?? Date.now();
  if (opts.lockedUntil) {
    const until = Date.parse(opts.lockedUntil);
    if (Number.isFinite(until) && until > now) return false;
  }
  // New or changed image URL → always queue.
  if (!opts.rowImageHash || opts.rowImageHash !== opts.imageHash) return true;
  if (isTerminalImageFactsStatus(opts.status ?? "")) return false;
  if ((opts.llmAttempts ?? 0) >= imageFactsMaxLlmPerImage()) return false;
  return opts.status === "thin" || opts.status === "fetch_error" || !opts.status;
}

/** Rank for drain ordering: 0 = bare missing (no facts row), 1 = retry / hash change. */
export function imageFactsCandidateRank(hasFactsRow: boolean): 0 | 1 {
  return hasFactsRow ? 1 : 0;
}

/**
 * Sort key for image-facts drain: bare missing first, then retryable;
 * within a rank prefer newer synced_at, then higher offer_id.
 */
export function compareImageFactsCandidates(
  a: { hasFactsRow: boolean; syncedAt: string; offerId: number },
  b: { hasFactsRow: boolean; syncedAt: string; offerId: number },
): number {
  const ra = imageFactsCandidateRank(a.hasFactsRow);
  const rb = imageFactsCandidateRank(b.hasFactsRow);
  if (ra !== rb) return ra - rb;
  const synced = (b.syncedAt || "").localeCompare(a.syncedAt || "");
  if (synced !== 0) return synced;
  return b.offerId - a.offerId;
}

export function emptyImageFacts(): CompactImageFacts {
  return {
    productType: null,
    application: null,
    releaseForm: null,
    packaging: null,
    detectedText: null,
    briefDescription: null,
  };
}

/** Soft field caps. Pass `null` for no truncation (detectedText on pack can be long). */
function asStr(v: unknown, n: number | null): string | null {
  if (v == null) return null;
  const t = String(v).replace(/\s+/g, " ").trim();
  if (!t || t.toLowerCase() === "null" || t.toLowerCase() === "n/a") return null;
  if (n == null || !Number.isFinite(n) || n <= 0) return t;
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
}

export function normalizeImageFacts(raw: unknown): CompactImageFacts | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const facts: CompactImageFacts = {
    productType: asStr(o.productType ?? o.product_type, 80),
    application: asStr(o.application, 40),
    releaseForm: asStr(o.releaseForm ?? o.release_form, 80),
    packaging: asStr(o.packaging, 80),
    detectedText: asStr(o.detectedText ?? o.detected_text, null),
    briefDescription: asStr(o.briefDescription ?? o.brief_description, 280),
  };
  if (!imageFactsHaveContent(facts)) return null;
  return facts;
}

export function imageFactsHaveContent(facts: CompactImageFacts | null | undefined): boolean {
  if (!facts) return false;
  return Boolean(
    facts.productType ||
      facts.application ||
      facts.releaseForm ||
      facts.packaging ||
      facts.detectedText ||
      facts.briefDescription,
  );
}

export function formatImageFactsForPrompt(facts: CompactImageFacts): string {
  const lines: string[] = [
    "Fakta z produktového obrázku (PRIORITNÍ — forma/aplikace podle balení):",
  ];
  if (facts.productType) lines.push(`typ: ${facts.productType}`);
  if (facts.application) lines.push(`aplikace: ${facts.application}`);
  if (facts.releaseForm) lines.push(`forma: ${facts.releaseForm}`);
  if (facts.packaging) lines.push(`obal: ${facts.packaging}`);
  if (facts.detectedText) lines.push(`textNaObalu: ${facts.detectedText}`);
  if (facts.briefDescription) lines.push(`popis: ${facts.briefDescription}`);
  return lines.join("\n");
}

export function buildImageFactsLlmPrompt(title: string): string {
  return `Jsi katalogový extraktor pro CZ e-shop recenze-ceny.cz (CPA: zdraví, lokální přípravky, doplňky stravy, kosmetika, oblečení, elektronika).
Analyzuj OBRÁZEK produktu (balení NEBO samotný výrobek). Vrať POUZE JSON (bez markdown):

{
  "application": "topical"|"oral"|"other"|null,
  "releaseForm": string|null,
  "productType": string|null,
  "packaging": string|null,
  "detectedText": string|null,
  "briefDescription": string|null
}

Doporučený postup: nejdřív rozhodni, zda je na fotce BALENÍ (tuba/dóza/blistr…) nebo VÝROBEK (oblečení na modelu, boty, přístroj). Pak application + releaseForm + productType.

releaseForm (jedna hodnota, česky), preferuj:
- perorální: kapsle | tablety | kapky | čaj | sirup | prášek | sáčky | ampule
- lokální: gel | krém | mast | balzám | sprej | sérum | šampon | náplast
- móda/spotřeba: šaty | legíny | tričko | bunda | boty | jiné
- jinak: zařízení | jiné | null

packaging, preferuj:
tuba | lahvička | kapátko | sprejová nádoba | dóza | krabička | sáček | blistr | sklenice | jiné | null
U oblečení/obuvi na modelu bez krabice → packaging null (ne „tuba“).
Krabička vedle tuby/lahvičky popisuje obal, ne formu — forma je podle tuby/kapátka/blistru.

productType — vyber nejbližší (nepoužívej zkratku BAD):
- doplněk stravy — perorální kapsle/tablety/kapky/čaj/prášek
- lokální přípravek — gel/krém/mast/balzám/sprej/náplast na kůži
- kosmetika — péče o pleť/vlasy (sérum, šampon…)
- zdravotnický prostředek | masážní přístroj | ortopedická pomůcka | elektronika | domácí potřeby | autodoplněk | oblečení | obuv | hračka | jiné

Jemné vodítka (katalog tohoto e-shopu):
- Kategorie jako klouby/hemoroidy/plíseň může mít gel i kapsle — řídí se tím, co je na fotce, ne názvem kategorie.
- Tuba + nápis GEL / CREAM / ICE COLD / cooling → spíš gel/krém, application topical, typ lokální přípravek (ne doplněk stravy).
- Kapátko / blistr / „to drink“ u kapek → spíš oral, doplněk stravy.
- Osoba v šatech / legínách / tričku / bundě (i s velkou látkovou květinou či ozdobou) → oblečení, application other, NIKDY gel/krém/tuba. Látková květina ≠ etiketa tuby.
- Boty / tenisky na nohou → obuv, application other.
- Příklady: Hondrofrost ICE COLD GEL → gel, topical, lokální přípravek; Proctonic tuba → krém, topical, lokální přípravek; Redusizer + kapátko → kapky, oral, doplněk stravy; modelka ve svatebních šatech s květinou → šaty, other, oblečení.
- Nevymýšlej složení, účinky ani skryté detaily. Pokud si nejsi jistý hodnotou pole, vrať null (neodhaduj).
- briefDescription: jen to, co je jasně vidět na obrázku (tvar balení / střih oděvu, barva, čitelný text). Bez složení a bez domněnek — jinak null.
- Texty piš česky. briefDescription max 1 krátká věta, nebo null.

Název z feedu (jen kontext; pokud odporuje obrázku, věř obrázku): ${title}`;
}

export function shouldInjectImageFacts(opts: {
  status: string;
  facts: CompactImageFacts | null;
}): { inject: boolean; facts: CompactImageFacts | null; promptBlock: string | null } {
  if (opts.status !== "ok" || !imageFactsHaveContent(opts.facts)) {
    return { inject: false, facts: null, promptBlock: null };
  }
  const facts = opts.facts!;
  return {
    inject: true,
    facts,
    promptBlock: formatImageFactsForPrompt(facts),
  };
}

export function nextThinOrExhausted(
  llmAttemptsAfter: number,
  prevFailCount: number,
  now = Date.now(),
): { status: "thin" | "exhausted"; fail_count: number; locked_until: string | null } {
  if (llmAttemptsAfter >= imageFactsMaxLlmPerImage()) {
    return { status: "exhausted", fail_count: prevFailCount + 1, locked_until: null };
  }
  const streak = prevFailCount + 1;
  return {
    status: "thin",
    fail_count: streak,
    locked_until: backoffLockedUntilFromStreak(streak, now),
  };
}

export function nextFetchErrorOrExhausted(
  prevStatus: string,
  prevFailCount: number,
  now = Date.now(),
): {
  status: "fetch_error" | "exhausted";
  fail_count: number;
  locked_until: string | null;
} {
  const streak = (prevStatus === "fetch_error" ? prevFailCount : 0) + 1;
  if (streak >= FETCH_EXHAUST_AFTER) {
    return { status: "exhausted", fail_count: streak, locked_until: null };
  }
  return {
    status: "fetch_error",
    fail_count: streak,
    locked_until: backoffLockedUntilFromStreak(streak, now),
  };
}

export function utcBudgetDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
