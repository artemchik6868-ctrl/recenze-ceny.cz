/** Target geo for feed sync and lead submission. */
export const MARKET_GEO = "CZ" as const;

/** Display currency for the storefront. */
export const MARKET_CURRENCY = "CZK" as const;

/** CZ storefront: show LLM-generated PDP body/FAQ from product_content when tier is ai. */
export const ENABLE_AI_CONTENT = true;

/**
 * DB column slot for AI PDP body/FAQ on this storefront.
 * Czech copy is stored in product_content.*_uk (legacy schema name from the UK fork).
 * NOT the UI locale — use useLang() / LANG_HTML for that. Public Offer fields are
 * market-neutral (metaTitle / metaDesc / displayTitle) without Uk/Ru suffixes.
 *
 * Always read/write PDP body via `PDP_CONTENT_SLOT` / `pdpSlotCol` / `readPdpSlotRow`
 * — never hardcode `*_uk` in UI or new server paths.
 */
export const PDP_CONTENT_SLOT = "uk" as const;

/** Legacy secondary slot still present on `product_content` rows (unused by CZ UI). */
export const PDP_LEGACY_ALT_SLOT = "ru" as const;

export type PdpContentSlot = typeof PDP_CONTENT_SLOT | typeof PDP_LEGACY_ALT_SLOT;

const PDP_SLOT_FIELD_BASES = [
  "title",
  "subtitle",
  "meta_desc",
  "display_title",
  "intro",
  "sections",
  "faq",
  "reviews",
  "description_html",
  "qa_status",
  "qa_reason",
] as const;

export type PdpSlotFieldBase = (typeof PDP_SLOT_FIELD_BASES)[number];

/** Column name for a PDP field in a given slot, e.g. `description_html` + `uk` → `description_html_uk`. */
export function pdpSlotCol(field: PdpSlotFieldBase, slot: PdpContentSlot = PDP_CONTENT_SLOT): string {
  return `${field}_${slot}`;
}

export function isPdpContentSlot(value: string): value is PdpContentSlot {
  return value === PDP_CONTENT_SLOT || value === PDP_LEGACY_ALT_SLOT;
}

/** Typed read of one language slot from a `product_content` row. */
export function readPdpSlotRow(
  row: Record<string, unknown>,
  slot: PdpContentSlot = PDP_CONTENT_SLOT,
): {
  title: string | null;
  subtitle: string | null;
  meta_desc: string | null;
  display_title: string | null;
  intro: string | null;
  sections: unknown;
  faq: unknown;
  reviews: unknown;
  description_html: string | null;
  qa_status: string | null;
  qa_reason: string | null;
} {
  const str = (field: PdpSlotFieldBase) => {
    const v = row[pdpSlotCol(field, slot)];
    return typeof v === "string" ? v : v == null ? null : String(v);
  };
  return {
    title: str("title"),
    subtitle: str("subtitle"),
    meta_desc: str("meta_desc"),
    display_title: str("display_title"),
    intro: str("intro"),
    sections: row[pdpSlotCol("sections", slot)],
    faq: row[pdpSlotCol("faq", slot)],
    reviews: row[pdpSlotCol("reviews", slot)],
    description_html: str("description_html"),
    qa_status: str("qa_status"),
    qa_reason: str("qa_reason"),
  };
}

/** Format a storefront price (amounts stored in the legacy `priceEUR` column, already in CZK). */
export function formatDisplayPrice(amount: number): string {
  return `${Math.round(amount).toLocaleString("cs-CZ")} Kč`;
}
