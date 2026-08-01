/**
 * Shakes partner landing subdomain tokens → catalog shelf slugs.
 * Single source of truth: new partner buckets are added here, not as one-off SKU overrides.
 *
 * Partner pattern: `{brand}.{nicheToken}sh.com` or `{brand}{niche}.domain`
 * e.g. de1-reishield.hemorsh.com → hemorrhoids
 */

import { normalizePartnerFeedHaystack } from "./partner-feed-text";

export type ShakesLandingTokenRule = {
  /** Match against flattened feed blob (URLs with ./_- → spaces). */
  pattern: RegExp;
  slug: string;
  /** Lower = evaluated earlier when multiple rules could match. */
  priority: number;
  note?: string;
};

/** Ambiguous Shakes buckets — no auto-shelf without secondary signal (H1 role, manual review). */
export const SHAKES_AMBIGUOUS_BUCKET_RE = /(?:^|[\s./_-])othersh(?:[\s./_-]|$)/i;

export const SHAKES_LANDING_TOKEN_RULES: ShakesLandingTokenRule[] = [
  // === smoking cessation (smokinsh partner bucket) ===
  {
    pattern: /smokinsh|kajenjesh|(?:benagachaga|reishield|cordycepspulse)\s*smok/i,
    slug: "odvykani-koureni",
    priority: 6,
    note: "Benaga / Reishield / Cordyceps smoking landings",
  },
  // === blood pressure (before generic «hyper» / mens false positives) ===
  {
    pattern: /hypertsh|pulsactivehyper|pulsactivehypert|herzena\s*hypert|reishield\s*hypert|benagachaga\s*hypert/i,
    slug: "krevni-tlak",
    priority: 5,
    note: "Herzena / Pulsactive / Reishield / Benaga BP SKUs",
  },
  // === diabetes (before alcohol — diabetsh not alcohsh) ===
  {
    pattern: /diabetsh|benagachagadiab|\/diabet\b|dmnorm|dm-norm|dm\s*norm/i,
    slug: "cukrovka",
    priority: 5,
    note: "Benaga Chaga / DM-Norm diabetes landings",
  },
  // === prostate / urinary (prostsh partner bucket) ===
  {
    pattern: /prostsh|urostal\s*prost|cordycepspulse\s*prost/i,
    slug: "prostata",
    priority: 6,
    note: "Urostal / Cordyceps Pulse on *.prostsh.com",
  },
  // === cystitis (cystitsh partner bucket) ===
  {
    pattern: /cystitsh|incontinence\s*cystit/i,
    slug: "cystitida",
    priority: 6,
    note: "Cordyceps Pulse on *.cystitsh.com",
  },
  // === psoriasis (psorsh partner bucket) ===
  {
    pattern: /psorsh|reishield\s*psor/i,
    slug: "lupenka",
    priority: 8,
    note: "Reishield on *.psorsh.com",
  },
  // === liver ===
  { pattern: /liverhsh|liversh|cordycepspulse\s*liver/i, slug: "jatra", priority: 8 },
  // === anti-aging / rejuvenation (rejuvsh partner bucket) ===
  {
    pattern: /rejuvsh|rejuvenatsh|cordycepspulse\s*rejuv/i,
    slug: "anti-aging",
    priority: 8,
    note: "Cordyceps Pulse on *.rejuvsh.com",
  },
  // === weight — Balancio family (balancioloss.com) ===
  {
    pattern: /balancioloss|balancio\s*wloss/i,
    slug: "hubnuti",
    priority: 10,
    note: "Balancio weight-loss landings",
  },
  // === fungus / nails ===
  { pattern: /fungsh|promicilsale|\bpromicil\b/i, slug: "plisen-nehtu", priority: 8 },
  // === respiratory trap (existing v8 buckets) ===
  { pattern: /reishieldhemor|hemorsh|cordycepspulsehemor|(?:reishield|cordyceps).*hemor(?:sh|oid)?/i, slug: "hemoroidy", priority: 10 },
  { pattern: /reishieldwloss|wlossh|cordycepspulseweight|(?:reishield|cordyceps).*wloss/i, slug: "hubnuti", priority: 10 },
  { pattern: /reishieldhear|hearhsh|(?:reishield|cordyceps).*hear(?:hsh)?/i, slug: "sluch", priority: 10 },
  { pattern: /reishieldalcoh|alcohsh|(?:reishield|cordyceps).*alcoh/i, slug: "alkoholismus", priority: 10 },
  { pattern: /reishieldpapil|papilsh|(?:reishield|cordyceps).*papil/i, slug: "papilomy", priority: 10 },
  {
    pattern: /memorsh|spominsh|memorysh|(?:reishield|cordyceps).*memor/i,
    slug: "stres",
    priority: 9,
    note: "Reishield/Cordyceps memory landings — role from landing tail",
  },
  {
    pattern: /neurosh|neuropatsh|neuropat(?:h|ie|i)|(?:reishield|cordyceps).*neuropat/i,
    slug: "stres",
    priority: 9,
    note: "Reishield/Cordyceps neuropathy landings — role from landing tail",
  },
  // === vision ===
  { pattern: /eye(?:sh|hsh)?|visionsh|aug(?:en)?sh|cordyceps.*(?:eye|vision|aug)/i, slug: "zrak", priority: 12 },
  // === joints / valgus landing tails ===
  { pattern: /valgussh|halluxsh|(?:hondro|joint).*valgus/i, slug: "vboceny-palec", priority: 12 },
  { pattern: /jointsh|sklepsh|artritsh|hondrosh/i, slug: "klouby", priority: 14 },
  // === digestive landing bucket (othersh often hosts Verdauung SKUs) ===
  {
    pattern: /(?:neoflorax|benagachaga|cordycepspulse)\s*othersh/i,
    slug: "traveni",
    priority: 14,
    note: "Brand + othersh catch-all — Verdauung / digestive NEM SKUs",
  },
  {
    pattern: /digestsh|gastrosh|verdau|verdauung|verdauungsmittel|travlen/i,
    slug: "traveni",
    priority: 15,
    note: "German Verdauungsmittel from H1 role or digestsh subdomain",
  },
].sort((a, b) => a.priority - b.priority);

export function inferShakesLandingTokenSlug(feedText: string | null | undefined): string | null {
  const hay = normalizePartnerFeedHaystack(feedText?.trim() ?? "");
  if (!hay) return null;
  for (const rule of SHAKES_LANDING_TOKEN_RULES) {
    if (rule.pattern.test(hay)) return rule.slug;
  }
  return null;
}

export function isShakesAmbiguousBucket(feedText: string | null | undefined): boolean {
  return SHAKES_AMBIGUOUS_BUCKET_RE.test(feedText ?? "");
}
