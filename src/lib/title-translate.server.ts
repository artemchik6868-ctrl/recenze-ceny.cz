/**
 * CZ card title pipeline: feed → clean → translate descriptor → display title.
 */

import {
  cleanFeedTitleWithDescriptor,
  sanitizeDisplayTitle,
  splitBrandAndTail,
  resolveHeadlineBrand,
  isPriceOnlyTail,
  stripAffiliateSkuTokens,
  hasEnglishLeak,
  extractLockedLatinBrand,
  joinBrandToTitle,
} from "./brand-clean";
import { getCategoryDescriptor } from "./category-descriptors.cs";
import { problemRoleForShelf, roleMatchesShelf } from "./problem-vocabulary.cs";
import {
  buildTitleTranslateSystemPrompt,
  buildTitleTranslateUserMessage,
  joinBgDisplayTitle,
  normalizeDescriptorTail,
  bgFormLabel,
  mechanicalDescriptorToBg,
  mechanicalRomanianDescriptorToBg,
  translateFormTailToBg,
  translateFormFromFeedBlob,
  textContainsProductForm,
  isGenericBgDescriptor,
  BARE_GENERIC_DESCRIPTORS,
  type TitleTranslateContext,
} from "./title-translate.cs";
import { inferProductRoleCs } from "./product-role.cs";
import { normalizePartnerFeedHaystack } from "./partner-feed-text";
import { hasNonCzechLocaleLeak } from "./locale-leak-cz";

const ORAL_FORM_KINDS = new Set(["capsules", "tablets", "drops", "tea"]);

function isCategoryBucketDescriptor(descriptor: string, categorySlug: string): boolean {
  const desc = descriptor.trim().toLowerCase();
  const cat = getCategoryDescriptor(categorySlug);
  if (cat?.short && desc === cat.short.trim().toLowerCase()) return true;
  if (cat?.long && desc === cat.long.trim().toLowerCase()) return true;
  if (categorySlug === "stres" && /nervov|stres|antistres/i.test(desc)) {
    return true;
  }
  return false;
}

function isTopicalAntifungDescriptor(descriptor: string): boolean {
  return /solu[țt]ie\s*antifung|solu[țt]ie\s*antimicot|cremă|cream|\bgel\b|spray|topic|extern|aplicare pe unghie/i.test(
    descriptor,
  );
}

/** Prefer feed-inferred / shelf oral role over generic bucket or topical mistranslation. */
export function refineCsDisplayDescriptor(
  descriptorBg: string,
  ctx: {
    categorySlug?: string;
    formKind?: string | null;
    feedSnippet?: string;
    rawTitle?: string;
    brand?: string;
  },
): string {
  const { categorySlug, formKind, rawTitle, brand } = ctx;
  const feed = normalizePartnerFeedHaystack(ctx.feedSnippet ?? "");
  const form = formKind ?? "";
  let descriptor = descriptorBg.trim();

  if (categorySlug === "plisen-nehtu" && ORAL_FORM_KINDS.has(form)) {
    const feedTopical =
      /antifungal\s+solution|solution\s+antifung|solution\s+antimicot|antifungal\s+(?:cream|gel|spray)/i.test(
        `${rawTitle ?? ""} ${feed}`,
      );
    if (feedTopical || isTopicalAntifungDescriptor(descriptor)) {
      const oralRole = problemRoleForShelf(categorySlug, bgFormLabel(form), form);
      if (oralRole) return oralRole;
    }
  }

  const inferred = inferProductRoleCs(rawTitle ?? "", brand, feed);
  if (
    inferred &&
    categorySlug &&
    roleMatchesShelf(inferred, categorySlug) &&
    !hasNonCzechLocaleLeak(inferred)
  ) {
    if (isCategoryBucketDescriptor(descriptor, categorySlug)) return inferred;
    if (/neuropat/i.test(inferred) && categorySlug === "stres") return inferred;
  }

  return descriptor;
}

/** @deprecated use refineCsDisplayDescriptor */
export const refineBgDisplayDescriptor = refineCsDisplayDescriptor;
/** @deprecated use refineCsDisplayDescriptor */
export const refineRoDisplayDescriptor = refineCsDisplayDescriptor;

const DEFAULT_AI_GATEWAY_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_AI_MODEL = "google/gemini-2.5-flash-preview-05-20";
const TRANSLATE_MAX_TOKENS = 80;

const CYRILLIC_RE = /[\u0400-\u04FF]/;

/** Normalize mixed RU/Latin+CZ card titles; preserve pure Cyrillic descriptors when valid. */
export function stripCyrillicFromDisplayTitle(title: string): string {
  if (!CYRILLIC_RE.test(title)) return title;
  const segments = title.split(/\s*[—–-]\s*/).map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return title;

  const cyrillicSegments = segments.filter((s) => CYRILLIC_RE.test(s));
  const latinSegments = segments.filter((s) => !CYRILLIC_RE.test(s));
  const czDescriptor = cyrillicSegments.find((s) => tailLooksCzechDescriptor(s));

  if (czDescriptor && latinSegments.length > 0) {
    return `${latinSegments[0]} — ${czDescriptor}`;
  }

  if (cyrillicSegments.length > 0 && latinSegments.length > 0) {
    if (latinSegments.length >= 2) {
      return `${latinSegments[0]} — ${latinSegments[latinSegments.length - 1]}`;
    }
    return latinSegments[0];
  }

  return title;
}

/** German leakage — word/ß markers only (ö/ü are valid Hungarian). */
const GERMAN_LEAK_RE = /ß|(?:\b(?:Kapseln|Nahrungsergänzungsmittel|Mittel|Gelenkgel|für die|zur|Schweiz|Deutschland)\b)/i;

const LEGACY_RO_DESCRIPTOR_MARKERS_RE =
  /\b(pentru|împotriva|impotriva|de|cu|antifungic|articulații|articulatii|slăbit|slabit|vedere|prostată|prostate|hemoroizi|cistită|cistita|glicemiei|fumat|păr|par)\b/i;

const ROMANIAN_DIACRITICS_RE = /[ăâîșțĂÂÎȘȚ]/;

/** Czech descriptor phrasing in Latin tails. */
const CS_DESCRIPTOR_MARKERS_RE =
  /\b(kapsle|tablety|gel|krém|sprej|kapky|produkt|zařízení|přípravek|proti|na|pro|potenci|kloub|hubnut|prostata|vlasy|kůže|zrak|hemoroid|doplňek|šampon|sérum|mast|balzám|přenosn|elektrick|brýle|kabelka|masáž|dezinfek|čistič)\b/i;

/** Cyrillic descriptor phrasing (legacy feed paths). */
const BG_DESCRIPTOR_MARKERS_RE =
  /\b(за|срещу|против|капсули|таблетки|гел|крем|спрей|продукт|добавка|отслабване|став|потентност|хемороид|простата|зрение|невропат|гъбич|тютюн|отказване)\b/i;

/** Russian feed tails that still need translation. */
const RU_DESCRIPTOR_MARKERS_RE =
  /\b(для|от|капсулы|гель|крем|средство|препарат|потенци|сустав|похуден)\b/i;

/** Broken CPA caps pattern e.g. ARTHR IS P DUCT, SUP EM T */
const BROKEN_CAPS_FEED_RE = /\b[A-Z]{2,}(\s+[A-Z]{1,3}){2,}/;

const OPTICS_FORM_RE = /\b(monocular|binocular|telescope|telescop|lunet[aă]|optics)\b/i;
const MAKEUP_FORM_RE = /\b(fond\s*de\s*ten|foundation|bb\s*cream|makeup|venzen|кушон|bb\s*cushion|makeup\s*cushion)\b/i;
const ORAL_SUPPLEMENT_RE = /\b(capsule|tablets?|comprimate|supliment|drops|picături)\b/i;

/** True when tail or feed indicates hardware/cosmetic form (not oral supplement). */
export function tailIsProductForm(tail: string, feedSnippet?: string): boolean {
  const blob = `${tail} ${feedSnippet ?? ""}`.trim();
  if (!blob) return false;
  return textContainsProductForm(blob);
}

/** Block medical shelf override when it conflicts with product form in feed/tail. */
export function shelfConflictsWithForm(
  shelfRole: string,
  tail: string,
  feedSnippet: string | undefined,
  categorySlug: string | undefined,
): boolean {
  const blob = `${tail} ${feedSnippet ?? ""}`;
  const role = shelfRole.toLowerCase();
  if (OPTICS_FORM_RE.test(blob) && (/kapsle.*zrak|oč.*kapsl/i.test(role) || categorySlug === "zrak")) {
    return true;
  }
  if (MAKEUP_FORM_RE.test(blob) && (categorySlug === "sluch" || /sluch/i.test(role))) {
    return true;
  }
  if (tailIsProductForm(tail, feedSnippet) && ORAL_SUPPLEMENT_RE.test(role) && !ORAL_SUPPLEMENT_RE.test(blob)) {
    return true;
  }
  return false;
}

function resolveEffectiveCategorySlug(
  categorySlug: string | undefined,
  feedSnippet: string | undefined,
): string | undefined {
  const blob = feedSnippet ?? "";
  if (!categorySlug) return categorySlug;
  if (OPTICS_FORM_RE.test(blob) && categorySlug === "zrak") return "optika";
  if (MAKEUP_FORM_RE.test(blob) && categorySlug === "sluch") return "kosmeticke-nastroje";
  return categorySlug;
}

/** True when tail already reads as a Czech product descriptor. */
export function tailLooksCzechDescriptor(tail: string): boolean {
  const t = tail.trim();
  if (!t) return false;
  if (ROMANIAN_DIACRITICS_RE.test(t)) return false;
  if (LEGACY_RO_DESCRIPTOR_MARKERS_RE.test(t)) return false;
  if (GERMAN_LEAK_RE.test(t)) return false;
  if (CS_DESCRIPTOR_MARKERS_RE.test(t)) return true;
  if (/[áčďéěíňóřšťúůýž]/i.test(t) && !hasNonCzechLocaleLeak(t) && !hasEnglishLeak(t)) return true;
  if (translateFormTailToBg(t)) return true;
  if (mechanicalDescriptorToBg(t)) return true;
  if (CYRILLIC_RE.test(t) && BG_DESCRIPTOR_MARKERS_RE.test(t)) return true;
  if (CYRILLIC_RE.test(t) && !RU_DESCRIPTOR_MARKERS_RE.test(t) && !hasEnglishLeak(t)) return true;
  return false;
}

/** @deprecated use tailLooksCzechDescriptor */
export const tailLooksHungarianDescriptor = tailLooksCzechDescriptor;

/** True when feed tail looks like token-stripped / broken English garbage. */
export function tailLooksBrokenFeed(tail: string): boolean {
  const t = tail.trim();
  if (!t) return false;
  if (BROKEN_CAPS_FEED_RE.test(t)) return true;
  // Truncated CPA tokens: REJUV G, SUP EM T (one long CAPS + short letter chunk).
  if (/\b[A-Z]{3,}\s+[A-Z](?:\s|$)/.test(t)) return true;
  const capsTokens = t.match(/\b[A-Z]{2,}\b/g) ?? [];
  if (capsTokens.length >= 2 && !/\b(pentru|împotriva|impotriva)\b/i.test(t)) return true;
  // Hungarian surface + orphan English CAPS (e.g. «cremă REJUV G»).
  if (ROMANIAN_DIACRITICS_RE.test(t) && /\b[A-Z]{3,}\b/.test(t)) return true;
  if (!tailLooksCzechDescriptor(t) && hasEnglishLeak(t)) return true;
  return false;
}

/** Classify why a title needs refresh (for audit reports). */
export function titleGarbledReason(title: string): string | null {
  const t = title.trim();
  if (!t) return null;
  if (GERMAN_LEAK_RE.test(t)) return "german_leak";
  const { brand, tail } = splitBrandAndTail(t);
  const descriptor = (tail || t).trim();
  if (!descriptor) return null;
  if (ROMANIAN_DIACRITICS_RE.test(descriptor) || LEGACY_RO_DESCRIPTOR_MARKERS_RE.test(descriptor)) {
    return "romanian_leak";
  }
  if (tailLooksCzechDescriptor(descriptor) && !tailLooksBrokenFeed(descriptor)) return null;
  if (!/\s*[—–-]\s*/.test(t)) return "brand_only";
  if (tailLooksBrokenFeed(descriptor)) return "broken_caps";
  if (hasEnglishLeak(descriptor, brand)) return "english_tail";
  if (tailNeedsCsTranslation(descriptor)) return "needs_translation";
  if (!tailLooksCzechDescriptor(descriptor)) return "missing_cs_descriptor";
  return "other";
}

/** True when a stored display title needs titles-only refresh. */
export function titleNeedsBgRefresh(title: string): boolean {
  return titleGarbledReason(title) != null;
}

/** @deprecated use titleNeedsBgRefresh */
export const titleNeedsRoRefresh = titleNeedsBgRefresh;

function resolveAiGateway(): { url: string; apiKey: string; model: string } | null {
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
  if (process.env.AI_GATEWAY_URL?.includes("openrouter.ai") || !process.env.AI_GATEWAY_URL) {
    headers["HTTP-Referer"] = process.env.SITE_URL ?? "https://recenze-ceny.cz";
    headers["X-Title"] = "recenze-ceny-cz-titles";
  }
  return headers;
}

export async function translateDescriptorToBg(
  tail: string,
  ctx: TitleTranslateContext,
): Promise<string | null> {
  const trimmed = tail.trim();
  if (!trimmed) return null;
  const gw = resolveAiGateway();
  if (!gw) return null;

  const system = buildTitleTranslateSystemPrompt(ctx.brand);
  const user = buildTitleTranslateUserMessage(trimmed, ctx);

  try {
    const res = await fetch(gw.url, {
      method: "POST",
      headers: aiGatewayHeaders(gw.apiKey),
      body: JSON.stringify({
        model: gw.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: TRANSLATE_MAX_TOKENS,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const out = (json.choices?.[0]?.message?.content ?? "").trim();
    if (!out) return null;
    const stripped = out
      .replace(/^["'«»]+|["'«»]+$/gu, "")
      .replace(/^[\s\-—–:,.]+|[\s,;:]+$/gu, "")
      .trim();
    const flattened = normalizeDescriptorTail(stripped);
    const cleaned = sanitizeDisplayTitle(flattened);
    if (cleaned && hasNonCzechLocaleLeak(cleaned)) return null;
    return cleaned || flattened || null;
  } catch (err) {
    console.warn("[title-translate] translateDescriptorToBg failed:", err);
    return null;
  }
}

/** @deprecated use translateDescriptorToBg */
export const translateDescriptorToRo = translateDescriptorToBg;

/** True when tail likely needs LLM (RU/EN/DE feed; not already-valid CZ). */
export function tailNeedsCsTranslation(tail: string): boolean {
  const t = tail.trim();
  if (!t) return false;
  if (tailLooksCzechDescriptor(t)) return false;
  if (GERMAN_LEAK_RE.test(t)) return true;
  if (CYRILLIC_RE.test(t) && RU_DESCRIPTOR_MARKERS_RE.test(t)) return true;
  if (ROMANIAN_DIACRITICS_RE.test(t) || LEGACY_RO_DESCRIPTOR_MARKERS_RE.test(t)) return true;
  if (/\b(for|capsules?|cream|gel|spray|support|joints?|potency|weight|loss|heater|glasses)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** @deprecated use tailNeedsCsTranslation */
export const tailNeedsBgTranslation = tailNeedsCsTranslation;
/** @deprecated use tailNeedsCsTranslation */
export const tailNeedsRoTranslation = tailNeedsCsTranslation;

function resolveBgDescriptorFallback(categorySlug?: string, formKind?: string | null): string {
  const form = bgFormLabel(formKind);
  if (categorySlug) {
    const shelfRole = problemRoleForShelf(categorySlug, form, formKind);
    if (shelfRole) return shelfRole;
    const d = getCategoryDescriptor(categorySlug);
    if (d?.short?.trim()) return d.short.trim();
  }
  if (form && !BARE_GENERIC_DESCRIPTORS.has(form.toLowerCase())) return form;
  return "";
}

/** Replace RO/DE/EN descriptor leaks with shelf/category BG fallbacks. */
function coerceBgDescriptor(
  descriptor: string,
  ctx: {
    categorySlug?: string;
    formKind?: string | null;
    brand: string;
    tail: string;
    seed?: string;
  },
): string {
  const d = descriptor.trim();
  if (d && !hasNonCzechLocaleLeak(d) && tailLooksCzechDescriptor(d)) return d;

  const mechanical = mechanicalDescriptorToBg(ctx.tail, {
    formKind: ctx.formKind,
    seed: ctx.seed ?? `${ctx.brand}:${ctx.tail}`,
  });
  if (mechanical && !hasNonCzechLocaleLeak(mechanical)) return mechanical;

  const roMapped = mechanicalRomanianDescriptorToBg(ctx.tail || d);
  if (roMapped && !hasNonCzechLocaleLeak(roMapped)) return roMapped;

  if (ctx.categorySlug) {
    const shelf = problemRoleForShelf(ctx.categorySlug, d, ctx.formKind);
    if (shelf && !hasNonCzechLocaleLeak(shelf)) return shelf;
    const cat = getCategoryDescriptor(ctx.categorySlug);
    if (cat?.short?.trim() && !hasNonCzechLocaleLeak(cat.short)) return cat.short.trim();
  }

  const form = bgFormLabel(ctx.formKind);
  if (form && !hasNonCzechLocaleLeak(form)) return form;

  return d;
}

/** Brand-only fallback using enriched category + feed blob (form-first, cross-shelf guards). */
function resolveEnrichedDescriptorFallback(input: BuildBgTitleInput): string {
  const feed = input.feedSnippet?.trim() ?? "";
  const categorySlug = resolveEffectiveCategorySlug(input.categorySlug, feed);
  const brand = input.brand?.trim() ?? "";

  const roleFromFeed = inferProductRoleCs(input.rawTitle, brand, feed || input.rawTitle);
  if (roleFromFeed && !hasNonCzechLocaleLeak(roleFromFeed)) return roleFromFeed;

  const formFromFeed = translateFormFromFeedBlob(feed);
  if (formFromFeed) return formFromFeed;

  if (categorySlug === "optika") {
    if (/\bmonocular\b/i.test(feed)) return "monocular";
    if (/\bbinocular\b/i.test(feed)) return "binocular";
    const d = getCategoryDescriptor("optika");
    if (d?.short?.trim()) return d.short.trim();
  }

  if (MAKEUP_FORM_RE.test(feed) || MAKEUP_FORM_RE.test(input.rawTitle)) return "cushion make-up";

  if (categorySlug && categorySlug !== "other") {
    const form = bgFormLabel(input.formKind);
    const shelfRole = problemRoleForShelf(categorySlug, form, input.formKind);
    if (shelfRole && !shelfConflictsWithForm(shelfRole, "", feed, categorySlug)) {
      return shelfRole;
    }
    const d = getCategoryDescriptor(categorySlug);
    if (d?.short?.trim()) return d.short.trim();
  }

  return resolveBgDescriptorFallback(categorySlug, input.formKind);
}

export { isGenericBgDescriptor };
/** @deprecated use isGenericBgDescriptor */
export { isGenericBgDescriptor as isGenericRoDescriptor };

export type BuildBgTitleInput = {
  rawTitle: string;
  brand: string;
  categorySlug?: string;
  formKind?: string | null;
  feedSnippet?: string;
};

/** @deprecated use BuildBgTitleInput */
export type BuildRoTitleInput = BuildBgTitleInput;

export type BuildBgTitleResult = {
  displayTitle: string;
  brand: string;
  tail: string;
  descriptorBg: string;
  translated: boolean;
};

/** @deprecated use BuildBgTitleResult */
export type BuildRoTitleResult = Omit<BuildBgTitleResult, "descriptorBg"> & { descriptorRo: string };

/**
 * Build Czech card title from raw feed title.
 * Mechanical clean → split brand/tail → LLM translate descriptor (if needed).
 */
export async function buildBgDisplayTitleFromFeed(
  input: BuildBgTitleInput,
): Promise<BuildBgTitleResult> {
  const cleaned = cleanFeedTitleWithDescriptor(input.rawTitle) || input.rawTitle;
  const lockedBrand = resolveHeadlineBrand(input.brand, cleaned);
  let { brand, tail } = splitBrandAndTail(cleaned);
  tail = tail.replace(/\s+\b(?:low|high)\b\s*$/i, "").trim();
  brand = stripAffiliateSkuTokens(brand) || brand;
  if (!brand.trim()) brand = lockedBrand;
  if (!brand.trim()) brand = input.brand.trim();
  brand = stripAffiliateSkuTokens(brand) || brand;

  const ctx: TitleTranslateContext = {
    brand,
    categorySlug: resolveEffectiveCategorySlug(input.categorySlug, input.feedSnippet),
    formKind: input.formKind,
    feedSnippet: input.feedSnippet ?? input.rawTitle,
  };

  let descriptorBg = "";
  let translated = false;
  const feedSnippet = normalizePartnerFeedHaystack(ctx.feedSnippet ?? "");

  if (tail.trim() && !isPriceOnlyTail(tail)) {
    const mechanical = mechanicalDescriptorToBg(tail);
    if (mechanical) {
      descriptorBg = mechanical;
    } else if (
      !tailLooksCzechDescriptor(tail) ||
      tailLooksBrokenFeed(tail) ||
      tailNeedsCsTranslation(tail)
    ) {
      const llm = await translateDescriptorToBg(tail, ctx);
      if (llm) {
        descriptorBg = llm;
        translated = true;
      } else {
        const formBg = translateFormTailToBg(tail);
        if (formBg) descriptorBg = formBg;
      }
    } else {
      descriptorBg = sanitizeDisplayTitle(tail) || translateFormTailToBg(tail) || tail;
    }
  }

  if (descriptorBg.trim() && isPriceOnlyTail(descriptorBg)) {
    descriptorBg = "";
  }

  const tailEmpty = !tail.trim() || isPriceOnlyTail(tail);
  if (!descriptorBg.trim() && tailEmpty) {
    descriptorBg = resolveEnrichedDescriptorFallback(input);
  } else if (!descriptorBg.trim()) {
    descriptorBg = resolveBgDescriptorFallback(ctx.categorySlug, input.formKind);
  }

  if (
    isGenericBgDescriptor(descriptorBg) &&
    ctx.categorySlug &&
    !tailIsProductForm(tail, feedSnippet)
  ) {
    const shelfRole = problemRoleForShelf(ctx.categorySlug, descriptorBg, input.formKind);
    if (shelfRole && !shelfConflictsWithForm(shelfRole, tail, feedSnippet, ctx.categorySlug)) {
      descriptorBg = shelfRole;
    }
  }

  descriptorBg = refineCsDisplayDescriptor(descriptorBg, {
    categorySlug: ctx.categorySlug,
    formKind: input.formKind,
    feedSnippet,
    rawTitle: input.rawTitle,
    brand,
  });

  descriptorBg = coerceBgDescriptor(descriptorBg, {
    categorySlug: ctx.categorySlug,
    formKind: input.formKind,
    brand,
    tail,
    seed: `${brand}:${input.rawTitle}`,
  });

  let effectiveBrand = brand;
  if (CYRILLIC_RE.test(effectiveBrand)) {
    const latinBrand =
      extractLockedLatinBrand(feedSnippet) ||
      extractLockedLatinBrand(input.feedSnippet ?? "") ||
      extractLockedLatinBrand(input.rawTitle);
    if (latinBrand && !CYRILLIC_RE.test(latinBrand)) {
      effectiveBrand = latinBrand;
    }
  }

  let displayTitle =
    sanitizeDisplayTitle(joinBgDisplayTitle(effectiveBrand, descriptorBg)) ||
    joinBgDisplayTitle(effectiveBrand, descriptorBg) ||
    effectiveBrand ||
    cleaned;
  displayTitle = stripCyrillicFromDisplayTitle(displayTitle);
  displayTitle = sanitizeDisplayTitle(displayTitle) || displayTitle;
  if (effectiveBrand && !CYRILLIC_RE.test(effectiveBrand)) {
    displayTitle = joinBrandToTitle(effectiveBrand, displayTitle);
  }

  if (hasNonCzechLocaleLeak(displayTitle)) {
    const { tail: retail } = splitBrandAndTail(displayTitle);
    const fixed = coerceBgDescriptor(retail || descriptorBg, {
      categorySlug: ctx.categorySlug,
      formKind: input.formKind,
      brand: effectiveBrand,
      tail,
      seed: `${effectiveBrand}:${input.rawTitle}`,
    });
    displayTitle =
      sanitizeDisplayTitle(joinBgDisplayTitle(effectiveBrand, fixed)) ||
      joinBgDisplayTitle(effectiveBrand, fixed);
  }

  return { displayTitle, brand: effectiveBrand, tail, descriptorBg, translated };
}

/** @deprecated use buildBgDisplayTitleFromFeed */
export async function buildRoDisplayTitleFromFeed(
  input: BuildRoTitleInput,
): Promise<BuildRoTitleResult> {
  const result = await buildBgDisplayTitleFromFeed(input);
  const { descriptorBg, ...rest } = result;
  return { ...rest, descriptorRo: descriptorBg };
}
