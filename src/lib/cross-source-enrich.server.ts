// Cross-source description enrichment.
//
// When the current feed gives us almost nothing (e.g. m1_top.info = "",
// KMA description = ""), we still have the brand name. The same brand often
// exists in OTHER source feeds (cpa_tl / cpagetti / kma / m1) with a usable
// description. This module finds that sibling row and returns its raw text
// so the AI prompt has something concrete to ground on instead of inventing
// "натуральные капсулы".
//
// Pure read-only: queries source-offer tables via supabaseAdmin. Never writes.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeProductTitle } from "./brand-clean";
import type { OfferSource } from "./types";

const TABLES: Record<OfferSource, { table: string; nameCol: string }> = {
  cpa_tl: { table: "cpa_tl_offers", nameCol: "title" },
  kma: { table: "kma_offers", nameCol: "name" },
  m1_top: { table: "m1_offers", nameCol: "name" },
  cpagetti: { table: "cpagetti_offers", nameCol: "title" },
  adcombo: { table: "adcombo_offers", nameCol: "title" },
  shakes: { table: "shakes_offers", nameCol: "title" },
};

export type EnrichResult = {
  description: string;
  sourceUsed: OfferSource;
  charsAdded: number;
};

/** Extract a stable brand "key" from a title — the first significant word.
 *  "Artroset - капсулы..." → "artroset". Returns "" for unusably short tokens. */
function extractBrandKey(title: string): string {
  const normalized = (normalizeProductTitle(title) || title).trim();
  if (!normalized) return "";
  // First chunk before " ", "-", "—", "|", ":", ","
  const first = normalized.split(/[\s\-–—|:,]+/u)[0] || "";
  const key = first.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  // Skip ambiguous short brand stems ("dr", "bio", "vita" would over-match)
  if (key.length < 4) return "";
  return key;
}

/** Pull a usable description string out of a source row's raw payload. */
function descriptionFromRaw(source: OfferSource, raw: unknown, name: string): string {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (source === "m1_top") {
      const info = typeof r.info === "string" ? r.info : "";
      return info.trim();
    }
    const direct = typeof r.description === "string" ? r.description : "";
    if (direct.trim()) return direct.trim();
  }
  // KMA fallback: descriptor from the name tail (same logic as ai-content)
  if (source === "kma") {
    const sepIdx = name.search(/\s[-–—]\s/u);
    let tail = sepIdx > 0 ? name.slice(sepIdx).replace(/^\s[-–—]\s/u, "") : "";
    tail = tail.split("|")[0].replace(/\([^)]*\)/g, " ").replace(/\s{2,}/g, " ").trim();
    return tail;
  }
  return "";
}

/**
 * Look for the same brand in other source tables. Returns the longest usable
 * description string only if it's meaningfully bigger than what we have.
 */
export async function enrichDescriptionAcrossSources(
  currentSource: OfferSource,
  title: string,
  currentDescription: string,
): Promise<EnrichResult | null> {
  const brand = extractBrandKey(title);
  if (!brand) return null;

  const currentLen = (currentDescription || "").trim().length;
  const minLen = Math.max(40, currentLen * 2);

  const others: OfferSource[] = (Object.keys(TABLES) as OfferSource[])
    .filter((s) => s !== currentSource);

  // Dynamic table name — cast through unknown to bypass strict typing.
  const client = supabaseAdmin as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        ilike: (col: string, val: string) => {
          eq: (col: string, val: unknown) => {
            limit: (n: number) => Promise<{
              data: unknown;
              error: { message?: string } | null;
            }>;
          };
        };
      };
    };
  };

  // Parallel ilike queries across every other source.
  const results = await Promise.all(
    others.map(async (s) => {
      const { table, nameCol } = TABLES[s];
      const { data, error } = await client
        .from(table)
        .select(`${nameCol}, raw`)
        .ilike(nameCol, `%${brand}%`)
        .eq("is_active", true)
        .limit(3);
      if (error || !data) return null;
      let best: { desc: string; source: OfferSource } | null = null;
      for (const row of data as Array<Record<string, unknown>>) {
        const name = typeof row[nameCol] === "string" ? (row[nameCol] as string) : "";
        const desc = descriptionFromRaw(s, row.raw, name);
        if (!desc) continue;
        if (!best || desc.length > best.desc.length) best = { desc, source: s };
      }
      return best;
    }),
  );

  let winner: { desc: string; source: OfferSource } | null = null;
  for (const r of results) {
    if (!r) continue;
    if (!winner || r.desc.length > winner.desc.length) winner = r;
  }
  if (!winner) return null;
  if (winner.desc.length < minLen) return null;

  return {
    description: winner.desc,
    sourceUsed: winner.source,
    charsAdded: winner.desc.length - currentLen,
  };
}
