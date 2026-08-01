/** Manual shelf_slug overrides (LLM/sync mistakes). Key: `source:offer_id` → catalog slug. */

import type { OfferSource } from "./types";

export const SHELF_OVERRIDES: Record<string, string> = {
  /** Brand-only title; classifier has no poten cue — keep potence-libido shelf. */
  "cpa_tl:8876": "potence",
  /** Intent relocation fallbacks (thin feed titles). */
  "kma:10640": "paraziti",
  "kma:10641": "paraziti",
  "cpagetti:17009": "klouby",
  "kma:10147": "paraziti",
  "kma:11614": "stres",
  "cpagetti:14937": "plisen-nehtu",
  "kma:6180": "ledviny",
  "kma:6698": "dychaci-cesty",
  "kma:8038": "dychaci-cesty",
  "adcombo:34905": "imunita",
  /** Shakes feed: «Гипертония» + hypertsh landing — brand Cordyceps ≠ fungus shelf. */
  "shakes:14177": "krevni-tlak",
  /** m1 Dial Vision = adjustable glasses, not lutein eye supplement. */
  "m1_top:6153": "modni-doplnky",
  /** Landing hint wrongly set to proctology; brand + intent = cystitis. */
  "m1_top:5725": "cystitida",
  /** False proctology landing hint → prostate / parasites. */
  "m1_top:5641": "prostata",
  "cpa_tl:23680": "prostata",
  "cpa_tl:23419": "prostata",
  "cpa_tl:21110": "prostata",
  "cpa_tl:13070": "paraziti",
  /** Anatomical «čočky» false eyewear → vision supplement shelf. */
  "shakes:17510": "zrak",
  "shakes:22140": "zrak",
  /** Landing hint papillomas vs role/intent parasites (Vermixin). */
  "cpa_tl:9177": "paraziti",
};

export function overrideShelfSlug(
  source: OfferSource | string,
  offerId: number,
  slug: string | null | undefined,
): string | null {
  const key = `${source}:${offerId}`;
  return SHELF_OVERRIDES[key] ?? slug ?? null;
}

export function overrideShelfKey(source: string, offerId: number): string {
  return `${source}:${offerId}`;
}
