/** Category page title/description builders (SSR head). */

import type { Offer } from "./types";
import { getCategoryContentByLang } from "./content";
import { getCategoryDescriptorByLang } from "./category-descriptors";
import { getCategorySeoIntent } from "./seo-intent.cs";
import { getI18n } from "./i18n";
import { formatDisplayPrice } from "./market";
import type { Lang } from "./lang";
import { clampDesc, clipAtBoundary } from "./seo-meta";
import { isProductIndexable } from "./index-policy";

export type CategoryHeadInput = {
  slug: string;
  offers: Offer[];
  lang: Lang;
};

export type CategoryHeadMeta = {
  title: string;
  description: string;
  h1: string;
  name: string;
};

const IN_CZ = "v České republice";

/** Generic descriptor.other fallback — must never win as SERP H1/title KW. */
const GENERIC_POHODA_KW = new Set([
  "produkt pro pohodu",
  "produkt pro každodenní pohodu",
  "produkty pro pohodu",
]);

function isGenericPohodaKeyword(s: string): boolean {
  const key = s.toLowerCase().trim();
  if (GENERIC_POHODA_KW.has(key)) return true;
  // Catch slight variants that still mean the wellbeing fallback.
  return /\bpro\s+pohodu\b/i.test(key) && /\bprodukt/i.test(key);
}

function usableKeyword(s: string | undefined | null): string {
  if (!s?.trim()) return "";
  return isGenericPohodaKeyword(s) ? "" : s.trim();
}

function stripLead(s: string) {
  return s.replace(/^(para|de|del|la|las|los|el|con|sin|en|y|o|un|una|pro|na|proti)\s+/u, "").trim();
}

function normalizeKey(s: string) {
  return stripLead(s.toLowerCase().trim());
}

function keysOverlap(a: string, b: string): boolean {
  if (!a || !b) return true;
  if (a === b) return true;
  // Avoid false positives: short shelf name «klouby» inside «doplňky stravy na klouby».
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (!longer.includes(shorter)) return false;
  return shorter.length / longer.length >= 0.55;
}

/** Keyword for H1/title — prefer commercial multi-word SERP phrases over short shelf names. */
function displayKeyword(
  name: string,
  keyword: string,
  short: string,
  long: string,
  intentKeywords: string[],
): string {
  const nameKey = normalizeKey(name);
  const kw = usableKeyword(keyword);
  const kwKey = normalizeKey(kw);
  // Commercial primary KW (2+ tokens) wins over short nickname.
  if (kwKey && kwKey !== nameKey && kw.trim().split(/\s+/).length >= 2) {
    return kw;
  }
  if (kwKey && !keysOverlap(nameKey, kwKey)) return kw;
  // Primary already matches the shelf name — keep it (don't let weak secondaries steal H1).
  if (kwKey && keysOverlap(nameKey, kwKey)) return kw;

  const shortUsable = usableKeyword(short);
  const shortKey = normalizeKey(shortUsable);
  if (shortKey && !keysOverlap(nameKey, shortKey)) return shortUsable;

  for (const pk of intentKeywords) {
    const usable = usableKeyword(pk);
    const pkKey = normalizeKey(usable);
    if (pkKey && pkKey !== nameKey && usable.trim().split(/\s+/).length >= 2) return usable;
    if (pkKey && !keysOverlap(nameKey, pkKey)) return usable;
  }

  const longLead = usableKeyword(long.split(/[,/]/)[0]?.trim() ?? "");
  if (longLead && !keysOverlap(nameKey, normalizeKey(longLead))) return longLead;

  return shortUsable || kw || name;
}

function titleCaseLead(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Drop a leading keyword (or overlapping prefix) from topic so meta desc
 * does not repeat the same commercial phrase after the lead.
 */
function topicWithoutKeywordOverlap(topic: string, keyword: string): string {
  const t = topic.trim();
  const kw = keyword.trim();
  if (!t || !kw) return t;
  const tKey = normalizeKey(t);
  const kwKey = normalizeKey(kw);
  if (tKey === kwKey) return "";
  if (tKey.startsWith(kwKey)) {
    const rest = t.slice(kw.length).replace(/^[\s,;:—–-]+/, "").trim();
    return rest ? titleCaseLead(rest) : "";
  }
  // Topic may capitalize differently than keyword.
  const re = new RegExp(
    `^${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s,;:—–-]*`,
    "iu",
  );
  const stripped = t.replace(re, "").trim();
  if (stripped && stripped !== t) return titleCaseLead(stripped);
  return t;
}

export function buildCategoryHeadMeta(input: CategoryHeadInput): CategoryHeadMeta {
  const { slug, offers, lang } = input;
  const T = getI18n(lang);
  const content = getCategoryContentByLang(slug, lang);
  const d = getCategoryDescriptorByLang(slug, lang);
  const intent = getCategorySeoIntent(slug);
  const name = content.nameHi;
  const visible = offers.filter(isProductIndexable);
  const count = visible.length;
  const prices = visible.map((o) => o.priceEUR).filter((p): p is number => !!p && p > 0);
  const minP = prices.length ? Math.min(...prices) : null;
  const maxP = prices.length ? Math.max(...prices) : null;
  const rawKeyword =
    usableKeyword(intent.primaryKeyword) || usableKeyword(d.short) || name;
  const keyword = displayKeyword(
    name,
    rawKeyword,
    usableKeyword(d.short),
    d.long,
    (intent.secondaryKeywords.length
      ? intent.secondaryKeywords
      : intent.primaryKeyword
        ? [intent.primaryKeyword]
        : []
    ).filter((k) => !isGenericPohodaKeyword(k)),
  );
  const kwTitle = titleCaseLead(keyword);
  const suffix = ` | ${T.siteName}`;
  const fromPrice = (p: number) => `od ${formatDisplayPrice(p)}`;
  const yearTag = `katalog ${new Date().getFullYear()}`;
  const reviewTag = "Recenze & Srovnání";
  // klouby: gels are a primary form — widen title KW when length allows.
  const kwWithGels =
    slug === "klouby" && keyword ? `${kwTitle} a gely` : "";

  const candidates: string[] = [];
  // CZ pharmacy SERP pattern: lead with commercial KW (Pilulka/Lékárna), then price/CTA.
  if (keyword) {
    if (minP) {
      if (kwWithGels) {
        candidates.push(`${kwWithGels} ${fromPrice(minP)} — ${reviewTag}${suffix}`);
        candidates.push(`${kwWithGels} ${fromPrice(minP)}${suffix}`);
        candidates.push(`${kwWithGels} — ${fromPrice(minP)}${suffix}`);
      }
      candidates.push(`${kwTitle} — ${fromPrice(minP)} — ${reviewTag}${suffix}`);
      candidates.push(`${kwTitle} ${fromPrice(minP)} — Recenze${suffix}`);
      candidates.push(`${kwTitle} — ${fromPrice(minP)}${suffix}`);
      candidates.push(`${kwTitle} — ${fromPrice(minP)}`);
    }
    candidates.push(`${kwTitle} — ${reviewTag}${suffix}`);
    candidates.push(`${kwTitle} ${IN_CZ}${suffix}`);
    candidates.push(`${kwTitle}${suffix}`);
    candidates.push(`${kwTitle} ${IN_CZ}`);
  }
  if (minP) {
    candidates.push(`${name} — ${keyword} ${IN_CZ} — ${fromPrice(minP)}${suffix}`);
    candidates.push(`${name} ${IN_CZ} — ${fromPrice(minP)}${suffix}`);
    candidates.push(`${name} ${IN_CZ} — ${fromPrice(minP)}`);
  }
  if (keyword && normalizeKey(keyword) !== normalizeKey(name)) {
    candidates.push(`${name} — ${keyword} ${IN_CZ}${suffix}`);
    candidates.push(`${name} — ${keyword} ${IN_CZ}`);
  }
  candidates.push(`${name} ${IN_CZ} — ${yearTag}${suffix}`);
  candidates.push(`${name} ${IN_CZ} — ${yearTag}`);
  candidates.push(`${name} ${IN_CZ}${suffix}`);
  candidates.push(`${name} ${IN_CZ}`);

  let title = candidates.find((t) => t.length <= 60) ?? candidates[candidates.length - 1]!;
  if (title.length > 60) title = clipAtBoundary(title, 60);

  const rawTopic = d.problem || T.category.metaDescFallback;
  const topic = topicWithoutKeywordOverlap(rawTopic, keyword);
  const shortCta = "Doručení po ČR na dobírku.";
  const cta =
    "Expresní kurýr po celé České republice, platba na dobírku — bez zálohy.";
  const priceLine =
    count && minP && maxP
      ? T.category.metaPriceLine(formatDisplayPrice(minP), formatDisplayPrice(maxP), count)
      : "";
  // Prefer comparison lead when KW already names the assortment (avoids «KW: KW…»).
  // Genitive after «Srovnání»: doplňky → doplňků.
  const compareKeyword = keyword.replace(/^doplňky\b/iu, "doplňků");
  const compareLead = keyword
    ? `Srovnání ${compareKeyword}`
    : `${name} ${IN_CZ}`;
  const descLead =
    keyword && normalizeKey(keyword) !== normalizeKey(name)
      ? `${kwTitle} ${IN_CZ}`
      : `${name} ${IN_CZ}`;
  const body = topic || rawTopic;
  const descCandidates = [
    topic
      ? `${compareLead}. ${topic}. ${shortCta}`
      : `${compareLead}. ${shortCta}`,
    `${descLead}: ${body}.${priceLine} ${cta}`,
    `${descLead}: ${body}. ${shortCta}`,
  ];
  let description =
    descCandidates.map((c) => clampDesc(c, 130, 158)).find((c) => c.length >= 130) ??
    clampDesc(descCandidates[0]!, 130, 158);
  if (description.length < 130) {
    description = clampDesc(
      `${description} ${T.category.metaDescPadding}`,
      130,
      158,
    );
  }
  // Guard: primary KW must not appear twice in the final description.
  if (keyword) {
    const kwRe = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
    const hits = description.match(kwRe);
    if (hits && hits.length >= 2) {
      let seen = 0;
      description = description.replace(kwRe, (m) => {
        seen += 1;
        return seen === 1 ? m : "";
      });
      description = clampDesc(description.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1"), 130, 158);
    }
  }

  // H1: prefer commercial multi-word KW (Pilulka-style). Else «Name — keyword».
  const nameKey = normalizeKey(name);
  const kwKey = normalizeKey(keyword);
  let h1: string;
  if (kwKey && keyword.trim().split(/\s+/).length >= 2 && kwKey !== nameKey) {
    h1 = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  } else if (kwKey && !keysOverlap(nameKey, kwKey)) {
    h1 = T.category.h1WithKeyword(name, keyword);
  } else {
    h1 = name;
  }

  return { title, description, h1, name };
}

/** Intent-aware grid H2 for category product list. */
export function categoryGridHeadline(slug: string, lang: Lang = "cs"): string {
  const T = getI18n(lang);
  const content = getCategoryContentByLang(slug, lang);
  const d = getCategoryDescriptorByLang(slug, lang);
  const intent = getCategorySeoIntent(slug);
  const keyword = displayKeyword(
    content.nameHi,
    usableKeyword(intent.primaryKeyword) || usableKeyword(d.short) || content.nameHi,
    usableKeyword(d.short),
    d.long,
    intent.secondaryKeywords.filter((k) => !isGenericPohodaKeyword(k)),
  );
  return T.category.bestProducts(keyword, new Date().getFullYear());
}
