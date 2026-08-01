/**
 * Wipe AI catalog state for a clean test run.
 * Deletes all product_content rows and product_briefs (shelf resolution).
 *
 * Feed offers (kma_offers, shakes_offers, …) are NOT touched.
 *
 * Usage: npx tsx scripts/clear-product-content.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

async function count(table: string): Promise<number> {
  const { count, error } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

async function deleteAll(table: string): Promise<number> {
  const before = await count(table);
  if (before === 0) {
    console.log(`${table}: already empty`);
    return 0;
  }
  const { error } = await supabaseAdmin.from(table).delete().neq("source", "");
  if (error) throw new Error(`${table} delete: ${error.message}`);
  const after = await count(table);
  console.log(`${table}: deleted ${before} rows (remaining ${after})`);
  return before;
}

console.log("Clearing AI catalog state (product_content + product_briefs)...");
const contentDeleted = await deleteAll("product_content");
const briefsDeleted = await deleteAll("product_briefs");
console.log(`Done — removed ${contentDeleted} content + ${briefsDeleted} brief rows.`);
