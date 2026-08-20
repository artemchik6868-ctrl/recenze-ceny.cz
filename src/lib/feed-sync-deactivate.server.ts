import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { shouldDeactivateCatalog } from "./feed-sync-guards";

const DEACTIVATE_CHUNK = 200;

/**
 * Soft-delete active rows whose offer_id is not in this completed allowed set.
 * Throws (no writes) when the incoming set looks truncated vs the live catalog.
 */
export async function deactivateMissingActiveOffers(
  table: string,
  keepIds: number[],
): Promise<{ deactivated: number }> {
  const { data, error } = await supabaseAdmin
    .from(table as never)
    .select("offer_id")
    .eq("is_active", true);
  if (error) throw new Error(`list active ${table}: ${error.message}`);

  const previous = ((data ?? []) as Array<{ offer_id: number }>).map((r) => Number(r.offer_id));
  const gate = shouldDeactivateCatalog({
    previousActive: previous.length,
    incomingAllowed: keepIds.length,
  });
  if (!gate.ok) {
    throw new Error(`deactivate ${table} aborted: ${gate.reason}`);
  }

  const keep = new Set(keepIds);
  const drop = previous.filter((id) => !keep.has(id));
  if (drop.length === 0) return { deactivated: 0 };

  let deactivated = 0;
  for (let i = 0; i < drop.length; i += DEACTIVATE_CHUNK) {
    const slice = drop.slice(i, i + DEACTIVATE_CHUNK);
    const { count, error: upErr } = await supabaseAdmin
      .from(table as never)
      .update({ is_active: false }, { count: "exact" })
      .in("offer_id", slice)
      .eq("is_active", true);
    if (upErr) throw new Error(`deactivate ${table}: ${upErr.message}`);
    deactivated += count ?? 0;
  }
  return { deactivated };
}
