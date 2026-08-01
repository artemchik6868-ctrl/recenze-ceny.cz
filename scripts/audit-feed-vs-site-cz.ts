/**
 * Audit Czech site H1 descriptors + category vs feed expectation (report only).
 *
 * Usage:
 *   npx tsx scripts/audit-feed-vs-site-cz.ts
 *   npx tsx scripts/audit-feed-vs-site-cz.ts --source=shakes
 *   npx tsx scripts/audit-feed-vs-site-cz.ts --out=scripts/out/audit-feed-vs-site-cz.json
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(ROOT, "scripts", "out", "audit-feed-vs-site-cz.json");

/** Descriptors from removed Step2 few-shots that could leak onto wrong SKUs. */
const STEP2_TEMPLATE_TAILS = [
  "kapsle proti cukrovce",
  "gel proti hemoroidům",
  "anti-aging krém",
  "omlazující krém",
  "kapsle na potenci",
  "gel na zvětšení penisu",
  "kloubní produkt",
  "kapky na hubnutí",
  "přenosné topidlo",
  "brýle na noční jízdu",
  "kožená crossbody kabelka",
  "fitness náramek",
  "zahradní hnojivo",
  "kapsle na odvykání kouření",
  "kapsle na hubnutí",
  "kapsle na krevní tlak",
  "kapsle proti plísním",
];

/** When Step2 template wording is a known-good match for a shelf (role cues may miss CZ synonyms). */
const TEMPLATE_OK_SHELVES: Record<string, string[]> = {
  "kapsle proti cukrovce": ["cukrovka"],
  "gel proti hemoroidům": ["hemoroidy"],
  "anti-aging krém": ["anti-aging"],
  "omlazující krém": ["anti-aging"],
  "kapsle na potenci": ["potence"],
  "gel na zvětšení penisu": ["zvetseni-penisu"],
  "kloubní produkt": ["klouby"],
  "kapky na hubnutí": ["hubnuti"],
  "přenosné topidlo": ["domaci-vychytavky", "domaci-potreby"],
  "brýle na noční jízdu": ["optika", "modni-doplnky"],
  "kožená crossbody kabelka": ["modni-doplnky", "obleceni"],
  "fitness náramek": ["modni-doplnky", "domaci-vychytavky"],
  "zahradní hnojivo": ["zahradni-naradi"],
  "kapsle na odvykání kouření": ["odvykani-koureni"],
  "kapsle na hubnutí": ["hubnuti"],
  "kapsle na krevní tlak": ["krevni-tlak"],
  "kapsle proti plísním": ["plisen-nehtu"],
};

const TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",

};

const SOURCES = Object.keys(TABLE) as OfferSource[];

function loadEnv(): void {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    const key = m[1].trim();
    if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
  }
}

function parseArgs(argv: string[]): { source: OfferSource | null; out: string } {
  let source: OfferSource | null = null;
  let out = DEFAULT_OUT;
  for (const raw of argv) {
    if (raw.startsWith("--source=")) source = raw.slice(9) as OfferSource;
    if (raw.startsWith("--out=")) out = resolve(ROOT, raw.slice(6));
  }
  return { source, out };
}

function normalizeTail(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function formKindFromCsTail(tail: string): string | null {
  const lc = tail.toLowerCase();
  if (/\bkapky\b/.test(lc)) return "drops";
  if (/\bkapsl/.test(lc)) return "capsules";
  if (/\btablet/.test(lc)) return "tablets";
  if (/\bsprej\b/.test(lc)) return "spray";
  if (/\bgel\b/.test(lc)) return "gel";
  if (/\bkrém\b|\bkrem\b/.test(lc)) return "cream";
  if (/\bsérum\b|\bserum\b/.test(lc)) return "serum";
  if (/\bšampon\b|\bsampon\b/.test(lc)) return "shampoo";
  if (/\bčaj\b|\bcaj\b/.test(lc)) return "tea";
  if (/\bmast\b/.test(lc)) return "ointment";
  if (/\bbalzám\b|\bbalzam\b/.test(lc)) return "balm";
  return null;
}

function roleTokensAgree(tail: string, expected: string): boolean {
  const a = normalizeTail(tail);
  const b = normalizeTail(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const stop = new Set(["na", "pro", "proti", "a", "do", "od", "za", "s", "z"]);
  const tokens = b.split(/[^a-z0-9]+/).filter((t) => t.length >= 4 && !stop.has(t));
  if (!tokens.length) return false;
  const hits = tokens.filter((t) => a.includes(t)).length;
  return hits >= Math.ceil(tokens.length * 0.6);
}

function matchTemplateTail(tail: string): string | null {
  const norm = normalizeTail(tail);
  for (const t of STEP2_TEMPLATE_TAILS) {
    if (norm === normalizeTail(t)) return t;
  }
  return null;
}

const TEMPLATE_OK_SHELVES_NORM: Record<string, string[]> = Object.fromEntries(
  Object.entries(TEMPLATE_OK_SHELVES).map(([k, v]) => [normalizeTail(k), v]),
);

function templateFitsShelf(
  template: string,
  shelf: string,
  roleMatchesShelf: (role: string, categorySlug: string) => boolean,
): boolean {
  const ok = TEMPLATE_OK_SHELVES_NORM[normalizeTail(template)];
  if (ok?.includes(shelf)) return true;
  return roleMatchesShelfCs(template, shelf, roleMatchesShelf);
}

/** Shared shelf cues miss some Czech spellings (cystitida, oči, paměť). */
function roleMatchesShelfCs(
  role: string,
  shelf: string,
  roleMatchesShelf: (role: string, categorySlug: string) => boolean,
): boolean {
  if (roleMatchesShelf(role, shelf)) return true;
  const r = role.toLowerCase();
  switch (shelf) {
    case "cystitida":
      return /cystit|cistit|močov|mocov/i.test(r);
    case "zrak":
      return /oči|oci|zrak|viděn|viden/i.test(r);
    case "stres":
      return /paměť|pamet|neuropat|stres|nerv|kognitiv/i.test(r);
    case "anti-aging":
      return /omlaz|anti-?aging|stárnut|starnut|vrásk|vrask/i.test(r);
    case "cukrovka":
      return /cukr|diabet|glykém|glykem|inzulín|inzulin/i.test(r);
    default:
      return false;
  }
}

type Flag =
  | "SHELF_MISMATCH"
  | "DESCRIPTOR_VS_ROLE"
  | "FORM_MISMATCH"
  | "BRAND_LOCK"
  | "TEMPLATE_SUSPECT"
  | "LOCALE_LEAK"
  | "ENGLISH_LEAK"
  | "MISSING_TITLE";

type AuditRow = {
  key: string;
  source: OfferSource;
  offer_id: number;
  slug: string;
  feed_title: string;
  display_title: string | null;
  descriptor: string;
  expected_role: string | null;
  expected_descriptor: string | null;
  site_shelf: string;
  expected_shelf: string;
  intent_slug: string | null;
  form_site: string | null;
  form_expected: string | null;
  flags: Flag[];
};

async function loadRawMaps(
  supabaseAdmin: { from: (t: string) => any },
  sources: OfferSource[],
): Promise<Map<string, unknown>> {
  const map = new Map<string, unknown>();
  const pageSize = 1000;
  for (const source of sources) {
    let offset = 0;
    while (true) {
      const { data, error } = await supabaseAdmin
        .from(TABLE[source])
        .select("offer_id, raw")
        .range(offset, offset + pageSize - 1);
      if (error) {
        console.error(`raw load ${source}:`, error.message);
        process.exit(1);
      }
      const rows = (data ?? []) as { offer_id: number; raw: unknown }[];
      if (!rows.length) break;
      for (const row of rows) {
        map.set(`${source}:${row.offer_id}`, row.raw ?? null);
      }
      if (rows.length < pageSize) break;
      offset += pageSize;
    }
  }
  return map;
}

async function main(): Promise<void> {
  loadEnv();
  const { source, out } = parseArgs(process.argv.slice(2));

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !k || !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }

  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const { loadOffers } = await import("../src/lib/offers.server");
  const { buildPartnerClassifyBlob } = await import("../src/lib/partner-feed-text");
  const { classifyTitleFirst } = await import("../src/lib/classify");
  const { inferProductIntentSlug } = await import("../src/lib/product-intent.cs");
  const { inferProductRoleCs } = await import("../src/lib/product-role.cs");
  const { roleMatchesShelf } = await import("../src/lib/problem-vocabulary.cs");
  const { splitBrandAndTail } = await import("../src/lib/brand-clean");
  const { detectProductFacts } = await import("../src/lib/product-facts");
  const {
    brandFormLockCs,
    buildPipelineFormHint,
  } = await import("../src/lib/ai-content-pipeline.cs");
  const { isBrandOnlyDisplayTitle } = await import("../src/lib/offer-display");
  const { titleGarbledReason } = await import("../src/lib/title-translate.server");

  const offers = await loadOffers();
  const filtered = source ? offers.filter((o) => o.source === source) : offers;
  const sourcesNeeded = source ? [source] : SOURCES;
  console.log(`Loaded ${filtered.length} offers; fetching partner raw…`);
  const rawMap = await loadRawMaps(supabaseAdmin, sourcesNeeded);

  const flagged: AuditRow[] = [];
  const flagCounts: Record<string, number> = {};
  const shelfPairs = new Map<string, number>();
  let scanned = 0;

  for (const o of filtered) {
    scanned += 1;
    const key = `${o.source}:${o.id}`;
    const rawTitle = (o.title || o.brand || "").trim();
    const raw = rawMap.get(key);
    const blob = raw
      ? buildPartnerClassifyBlob(o.source, raw, rawTitle, o.categoryKey || o.categoryName || "")
      : o.feedClassifyText || String(o.categoryKey || o.categoryName || "");

    const intentSlug = inferProductIntentSlug(rawTitle, o.brand, blob);
    const classified = classifyTitleFirst(rawTitle, blob, "other");
    const expectedShelf =
      intentSlug && intentSlug !== "other"
        ? intentSlug
        : classified !== "other"
          ? classified
          : intentSlug ?? classified;

    const displayTitle = o.displayTitle?.trim() || null;
    const { brand: _h1Brand, tail: descriptor } = displayTitle
      ? splitBrandAndTail(displayTitle)
      : { brand: "", tail: "" };
    const siteTail = descriptor.trim();

    const inferredRole = inferProductRoleCs(rawTitle, o.brand, blob);
    const facts = detectProductFacts(rawTitle, o.categoryKey || o.categoryName || "", blob);
    const brandLock = brandFormLockCs(rawTitle, o.brand, o.categorySlug);
    const formHint =
      brandLock ??
      buildPipelineFormHint({
        formKind: facts.kind === "generic_item" || facts.kind === "unknown" ? null : facts.kind,
        categorySlug: expectedShelf !== "other" ? expectedShelf : o.categorySlug,
        rawTitle,
        feedSnippet: blob,
        brand: o.brand,
      });

    const expectedDescriptor =
      brandLock?.expectedDescriptorCs?.trim() ||
      formHint?.expectedDescriptorCs?.trim() ||
      inferredRole ||
      null;
    const expectedForm = brandLock?.formKind ?? formHint?.formKind ?? null;
    const siteForm = formKindFromCsTail(siteTail);

    const flags: Flag[] = [];

    if (!displayTitle || isBrandOnlyDisplayTitle(displayTitle) || !siteTail) {
      flags.push("MISSING_TITLE");
    }

    if (
      expectedShelf !== "other" &&
      o.categorySlug &&
      o.categorySlug !== expectedShelf
    ) {
      flags.push("SHELF_MISMATCH");
      const pair = `${o.categorySlug}→${expectedShelf}`;
      shelfPairs.set(pair, (shelfPairs.get(pair) ?? 0) + 1);
    }

    // Hard role miss: site descriptor fails shelf cues for expected feed shelf,
    // or brand-lock wording is clearly wrong. Soft synonym diffs on the same
    // shelf (hubnutí vs kontrolu hmotnosti) are not flagged.
    // Known Step2-template synonyms that fit the expected shelf also count as OK.
    if (siteTail && expectedShelf && expectedShelf !== "other") {
      const templateOk =
        matchTemplateTail(siteTail) != null &&
        templateFitsShelf(matchTemplateTail(siteTail)!, expectedShelf, roleMatchesShelf);
      if (!roleMatchesShelfCs(siteTail, expectedShelf, roleMatchesShelf) && !templateOk) {
        flags.push("DESCRIPTOR_VS_ROLE");
      }
    } else if (
      siteTail &&
      brandLock?.expectedDescriptorCs &&
      !roleTokensAgree(siteTail, brandLock.expectedDescriptorCs)
    ) {
      flags.push("DESCRIPTOR_VS_ROLE");
    }

    if (expectedForm && siteForm && expectedForm !== siteForm) {
      flags.push("FORM_MISMATCH");
    }

    if (brandLock?.expectedDescriptorCs && siteTail) {
      if (!roleTokensAgree(siteTail, brandLock.expectedDescriptorCs)) {
        flags.push("BRAND_LOCK");
      } else if (brandLock.formKind && siteForm && brandLock.formKind !== siteForm) {
        flags.push("BRAND_LOCK");
      }
    }

    // Old Step2 few-shot tails glued onto SKUs whose feed points elsewhere.
    const templateHit = siteTail ? matchTemplateTail(siteTail) : null;
    if (
      templateHit &&
      expectedShelf &&
      expectedShelf !== "other" &&
      !templateFitsShelf(templateHit, expectedShelf, roleMatchesShelf)
    ) {
      flags.push("TEMPLATE_SUSPECT");
    }

    if (displayTitle) {
      const garbled = titleGarbledReason(displayTitle);
      if (garbled === "romanian_leak" || garbled === "german_leak" || garbled === "needs_translation") {
        flags.push("LOCALE_LEAK");
      }
      if (garbled === "english_tail") flags.push("ENGLISH_LEAK");
    }

    if (!flags.length) continue;

    for (const f of flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;

    flagged.push({
      key,
      source: o.source,
      offer_id: o.id,
      slug: o.slug,
      feed_title: rawTitle.slice(0, 120),
      display_title: displayTitle,
      descriptor: siteTail,
      expected_role: inferredRole,
      expected_descriptor: expectedDescriptor,
      site_shelf: o.categorySlug,
      expected_shelf: expectedShelf,
      intent_slug: intentSlug,
      form_site: siteForm,
      form_expected: expectedForm,
      flags,
    });
  }

  const bySource: Record<string, number> = {};
  for (const r of flagged) {
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  }

  const summary = {
    generated_at: new Date().toISOString(),
    source_filter: source,
    scanned,
    flagged: flagged.length,
    flag_counts: flagCounts,
    by_source: bySource,
    top_shelf_pairs: [...shelfPairs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pair, count]) => ({ pair, count })),
    template_suspect: flagged.filter((r) => r.flags.includes("TEMPLATE_SUSPECT")).length,
    descriptor_vs_role: flagged.filter((r) => r.flags.includes("DESCRIPTOR_VS_ROLE")).length,
    shelf_mismatch: flagged.filter((r) => r.flags.includes("SHELF_MISMATCH")).length,
  };

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ summary, rows: flagged }, null, 2), "utf8");

  console.log("\n=== audit-feed-vs-site-cz ===\n");
  console.log(JSON.stringify(summary, null, 2));

  const samples = (flag: Flag, n = 12) =>
    flagged.filter((r) => r.flags.includes(flag)).slice(0, n);

  console.log("\n--- TEMPLATE_SUSPECT (sample) ---");
  for (const r of samples("TEMPLATE_SUSPECT")) {
    console.log(
      `${r.key} shelf=${r.site_shelf}→${r.expected_shelf} | H1=${r.display_title} | expect=${r.expected_descriptor ?? "-"}`,
    );
  }

  console.log("\n--- DESCRIPTOR_VS_ROLE (sample) ---");
  for (const r of samples("DESCRIPTOR_VS_ROLE")) {
    console.log(
      `${r.key} «${r.descriptor}» vs «${r.expected_descriptor ?? r.expected_role ?? "-"}» | ${r.feed_title}`,
    );
  }

  console.log("\n--- SHELF_MISMATCH (sample) ---");
  for (const r of samples("SHELF_MISMATCH")) {
    console.log(`${r.key} ${r.site_shelf} → ${r.expected_shelf} | ${r.feed_title}`);
  }

  console.log(`\nWrote ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
