/** Partner feed text for title-first shelf classify + LLM briefs (rich blob, not brand-only). */

import type { OfferSource } from "./types";

const HTML_TAG_RE = /<[^>]+>/g;

type AdcomboLike = {
  categories?: string[];
  description?: Record<string, string> | string | null;
};

export function stripPartnerHtml(text: string): string {
  return text
    .replace(HTML_TAG_RE, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Pick AdCombo partner description — ES storefront first. */
export function pickAdcomboDescription(
  desc: Record<string, string> | string | null | undefined,
  maxLen = 300,
): string {
  if (!desc) return "";
  if (typeof desc === "string") return stripPartnerHtml(desc).slice(0, maxLen);
  const order = ["es", "en", "ru", "it", "de", "fr"];
  for (const key of order) {
    const v = desc[key];
    if (v?.trim()) return stripPartnerHtml(v).slice(0, maxLen);
  }
  const first = Object.values(desc).find((v) => v?.trim());
  return first ? stripPartnerHtml(first).slice(0, maxLen) : "";
}

/** Full AdCombo description for AI pipeline (no char cap; classify path keeps pickAdcomboDescription). */
export function pickAdcomboDescriptionForPipeline(
  desc: Record<string, string> | string | null | undefined,
): string {
  if (!desc) return "";
  if (typeof desc === "string") return stripPartnerHtml(desc);
  const order = ["es", "en", "ru", "it", "de", "fr"];
  for (const key of order) {
    const v = desc[key];
    if (v?.trim()) return stripPartnerHtml(v);
  }
  const first = Object.values(desc).find((v) => v?.trim());
  return first ? stripPartnerHtml(first) : "";
}

function kmaDescriptorFromName(name: string): string {
  const dash = name.match(/\s[-—–]\s+(.+)/);
  if (dash?.[1]) return dash[1].replace(/\s*\|.*$/, "").trim();
  const pipe = name.split("|")[1];
  return pipe?.trim() ?? "";
}

type M1Raw = { info?: string };
type CpagettiRaw = {
  name?: string;
  title?: string;
  description?: string;
  category?: string | { name?: string };
  goal?: string;
  vertical?: string;
};
type KmaCategory = Record<string, string> | string | null | undefined;

type ShakesRaw = {
  landings?: Array<{
    title?: string;
    url?: string;
    transits?: Array<{ title?: string; url?: string }>;
  }>;
  traffic_types?: Record<string, { name?: string }>;
};

type CpaTlRaw = {
  title?: string;
  description?: string;
  landings?: Array<{ url?: string; title?: string; language_code?: string; language?: string }>;
};

/**
 * Rejoin Shakes subdomain tokens broken when landing URLs are flattened to words
 * (e.g. neuro.othersh.com → «neuro othersh» instead of «neurosh»).
 */
export function normalizePartnerFeedHaystack(text: string): string {
  return text
    .replace(/\bneuro\s+othersh\b/gi, "neurosh")
    .replace(/\bneuropat\s+sh\b/gi, "neuropatsh")
    .replace(/\bmemor\s+sh\b/gi, "memorsh")
    .replace(/\bspomin\s+sh\b/gi, "spominsh")
    .replace(/\bhemor\s+sh\b/gi, "hemorsh")
    .replace(/\b(?:reishield|cordyceps)\s+neuro\b(?=\s|$)/gi, (m) => `${m}sh`);
}

function shakesEnrichmentFromRaw(raw: ShakesRaw): string {
  const parts: string[] = [];
  for (const landing of raw.landings ?? []) {
    const t = String(landing.title ?? "").trim();
    if (t) parts.push(t);
    const u = String(landing.url ?? "").trim();
    if (u) parts.push(u.replace(/[./_-]+/g, " "));
    for (const transit of landing.transits ?? []) {
      const tu = String(transit.url ?? "").trim();
      if (tu) parts.push(tu.replace(/[./_-]+/g, " "));
    }
  }
  for (const entry of Object.values(raw.traffic_types ?? {})) {
    const n = String(entry?.name ?? "").trim();
    if (n) parts.push(n);
  }
  return parts.join(" ").replace(/\s{2,}/g, " ").trim().slice(0, 400);
}

export function buildPartnerClassifyBlob(
  source: OfferSource,
  raw: unknown,
  title: string,
  categoryField: string | null | undefined,
): string {
  const category = String(categoryField ?? "").trim();
  const parts: string[] = [];

  if (source === "adcombo") {
    const o = raw as AdcomboLike;
    const cats = (o.categories ?? []).join(", ");
    const desc = pickAdcomboDescription(o.description);
    if (cats) parts.push(cats);
    if (desc) parts.push(desc);
  } else if (source === "m1_top") {
    const info = String((raw as M1Raw)?.info ?? "").trim();
    if (category) parts.push(category);
    if (info) parts.push(stripPartnerHtml(info).slice(0, 300));
  } else if (source === "cpagetti") {
    const o = raw as CpagettiRaw;
    const cat =
      typeof o.category === "string"
        ? o.category
        : (o.category as { name?: string } | undefined)?.name ?? category;
    const name = String(o.name ?? o.title ?? "").trim();
    const desc = String(o.description ?? "").trim();
    const goal = String(o.goal ?? "").trim();
    const vertical = String(o.vertical ?? "").trim();
    if (name) parts.push(name);
    if (cat) parts.push(cat);
    if (goal) parts.push(goal);
    if (vertical) parts.push(vertical);
    if (desc) parts.push(stripPartnerHtml(desc).slice(0, 400));
  } else if (source === "kma") {
    const cat = raw as { category?: KmaCategory };
    let catText = category;
    if (cat.category && typeof cat.category === "object") {
      catText = Object.values(cat.category as Record<string, string>).join(", ");
    }
    const descriptor = kmaDescriptorFromName(title);
    if (catText) parts.push(catText);
    if (descriptor) parts.push(descriptor);
  } else if (source === "shakes") {
    const enriched = shakesEnrichmentFromRaw(raw as ShakesRaw);
    if (enriched) parts.push(enriched);
    if (category) parts.push(category);
  } else if (source === "cpa_tl") {
    const o = raw as CpaTlRaw;
    const feedTitle = String(o.title ?? title).trim();
    if (feedTitle) parts.push(feedTitle);
    const desc = String(o.description ?? "").trim();
    if (desc) parts.push(stripPartnerHtml(desc).slice(0, 400));
    for (const l of o.landings ?? []) {
      const u = String(l.url ?? "").trim();
      if (u) parts.push(u.replace(/[./_-]+/g, " "));
      const t = String(l.title ?? "").trim();
      if (t) parts.push(t);
    }
    if (category) parts.push(category);
  } else if (category) {
    parts.push(category);
  }

  const blob = parts.join(" ").replace(/\s{2,}/g, " ").trim().slice(0, 400);
  return normalizePartnerFeedHaystack(blob);
}

/** AdCombo description for product copy brief (prompt enrichment). */
export function adcomboFeedEnrichment(raw: AdcomboLike): string {
  const cats = (raw.categories ?? []).join(", ");
  const desc = pickAdcomboDescription(raw.description, 220);
  return [cats, desc].filter(Boolean).join(" — ").trim();
}
