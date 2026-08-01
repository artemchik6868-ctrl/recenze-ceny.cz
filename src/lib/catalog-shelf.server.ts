/** Persist LLM-assigned catalog shelf slug (single category per offer). */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OfferSource } from "./types";
import { validateShelfSlug } from "./catalog-shelf";
import { SHELF_OVERRIDES, overrideShelfKey } from "./catalog-shelf-overrides";

const SHELF_PIPELINE_VERSION = "v66-ro-step6-raw-html";

export async function persistResolvedCategorySlug(
  source: OfferSource,
  offerId: number,
  rawSlug: string | null | undefined,
): Promise<string | null> {
  const slug = validateShelfSlug(rawSlug);
  if (!slug) return null;
  try {
    const { data: existing } = await supabaseAdmin
      .from("product_briefs")
      .select("source")
      .eq("source", source)
      .eq("offer_id", offerId)
      .maybeSingle();
    const payload = {
      resolved_category_slug: slug,
      pipeline_version: SHELF_PIPELINE_VERSION,
    };
    if (existing) {
      const { error } = await supabaseAdmin
        .from("product_briefs")
        .update(payload)
        .eq("source", source)
        .eq("offer_id", offerId);
      if (error) {
        console.warn(`[shelf] update ${source}:${offerId} failed:`, error.message);
        return null;
      }
      return slug;
    }
    const { error } = await supabaseAdmin.from("product_briefs").insert({
      source,
      offer_id: offerId,
      ...payload,
      source_hash: "shelf",
      category_slug: "other",
      physical_form: "unknown",
      brief_confidence: 0.5,
      cleaned_desc_len: 0,
      warnings: [],
      allowed_lex_uk: [],
      allowed_lex_ru: [],
      forbidden_lex_uk: [],
      forbidden_lex_ru: [],
      qa_errors_uk: [],
      qa_errors_ru: [],
    });
    if (error) {
      console.warn(`[shelf] insert ${source}:${offerId} failed:`, error.message);
      return null;
    }
    return slug;
  } catch (err) {
    console.warn(`[shelf] persist threw ${source}:${offerId}:`, err);
    return null;
  }
}

/** @deprecated Use persistResolvedCategorySlug — kept for API compatibility with ES pipeline orchestrator. */
export async function persistResolvedCategorySlugs(
  source: OfferSource,
  offerId: number,
  rawSlugs: string[] | null | undefined,
): Promise<string[] | null> {
  const slug = rawSlugs?.[0] ? validateShelfSlug(rawSlugs[0]) : null;
  if (!slug) return null;
  const out = await persistResolvedCategorySlug(source, offerId, slug);
  return out ? [out] : null;
}

export async function loadResolvedCategoryMap(): Promise<Map<string, string>> {
  const { data, error } = await supabaseAdmin
    .from("product_briefs")
    .select("source, offer_id, resolved_category_slug")
    .not("resolved_category_slug", "is", null);
  const m = new Map<string, string>();
  if (!error && data) {
    for (const r of data as {
      source: string;
      offer_id: number;
      resolved_category_slug: string | null;
    }[]) {
      const slug = validateShelfSlug(r.resolved_category_slug);
      if (slug) m.set(`${r.source}:${r.offer_id}`, slug);
    }
  }
  for (const [key, slug] of Object.entries(SHELF_OVERRIDES)) {
    const validated = validateShelfSlug(slug);
    if (validated) m.set(key, validated);
  }
  return m;
}

export function isShelfOverrideKey(source: string, offerId: number): boolean {
  return overrideShelfKey(source, offerId) in SHELF_OVERRIDES;
}
