import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const { inferProductRoleCs } = await import("../src/lib/product-role.ro.ts");
const { buildBgDisplayTitleFromFeed } = await import("../src/lib/title-translate.server.ts");
const { problemRoleForShelf } = await import("../src/lib/problem-vocabulary.ro.ts");
const { getCategoryDescriptor } = await import("../src/lib/category-descriptors.ro.ts");
const { buildPartnerClassifyBlob } = await import("../src/lib/partner-feed-text.ts");
const { normalizeProductTitle } = await import("../src/lib/brand-clean.ts");

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

for (const [source, id] of [
  ["shakes", 19038],
  ["cpagetti", 17087],
] as const) {
  let off: {
    title?: string;
    description?: string;
    category_slug: string;
    form_kind: string;
    form_label_uk: string;
  } | null = null;
  if (source === "shakes") {
    const { data: shakeRow } = await sb
      .from("shakes_offers")
      .select("title, raw, category")
      .eq("offer_id", id)
      .maybeSingle();
    const raw = shakeRow?.raw as import("../src/lib/shakes-sync.server.ts").ShakesRawOffer | undefined;
    const rowTitle = String(shakeRow?.title ?? raw?.title ?? "");
    const cleanedTitle = normalizeProductTitle(rowTitle);
    const enriched = raw
      ? buildPartnerClassifyBlob("shakes", raw, cleanedTitle, shakeRow?.category ?? "")
      : "";
    off = shakeRow
      ? {
          title: cleanedTitle || rowTitle,
          description: enriched || cleanedTitle,
          category_slug: "stres",
          form_kind: "capsules",
          form_label_uk: "Capsule",
        }
      : null;
  } else {
    const { data: cpRow } = await sb
      .from("cpagetti_offers")
      .select("raw, category")
      .eq("offer_id", id)
      .maybeSingle();
    const raw = cpRow?.raw as { name?: string; title?: string; description?: string } | undefined;
    const name = String(raw?.name ?? raw?.title ?? "");
    const enriched = raw
      ? buildPartnerClassifyBlob("cpagetti", raw, name, cpRow?.category ?? "")
      : "";
    off = raw
      ? {
          title: name,
          description: enriched || String(raw.description ?? ""),
          category_slug: "plisen-nehtu",
          form_kind: "capsules",
          form_label_uk: "Capsule",
        }
      : null;
  }
  const { data: pc } = await sb
    .from("product_content")
    .select("display_title_uk, title_uk, meta_desc_uk, subtitle_uk")
    .eq("source", source)
    .eq("offer_id", id)
    .maybeSingle();

  if (!off) {
    console.log(`Missing offer ${source}:${id}`);
    continue;
  }

  const feedSnippet = (off.description ?? "").trim().slice(0, 200);
  const role = inferProductRoleCs(off.title, off.title, feedSnippet);
  const shelf = problemRoleForShelf(off.category_slug, off.form_label_uk, off.form_kind);
  const catShort = getCategoryDescriptor(off.category_slug)?.short;
  const built = await buildBgDisplayTitleFromFeed({
    rawTitle: off.title,
    brand: off.title.split(/\s/)[0] ?? off.title,
    categorySlug: off.category_slug,
    formKind: off.form_kind,
    feedSnippet,
  });

  console.log(`\n=== ${source}:${id} (${off.category_slug}) ===`);
  console.log("feed title:", off.title);
  console.log("feed snippet:", feedSnippet.slice(0, 120));
  console.log("inferProductRoleCs:", role);
  console.log("problemRoleForShelf:", shelf);
  console.log("category short:", catShort);
  console.log("buildBgDisplayTitleFromFeed:", built.displayTitle);
  console.log("DB display_title_uk:", pc?.display_title_uk);
  console.log("DB title_uk (LLM):", pc?.title_uk);
  console.log("DB meta_desc_uk:", pc?.meta_desc_uk?.slice(0, 120));
}
