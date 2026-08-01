/**
 * Upsert shakes test offer 990001 and verify Worker pipeline steps:
 *   landing facts → image facts → content-drain
 *
 *   npx tsx scripts/verify-worker-pipeline-steps.ts --base=https://recenze-ceny.cz
 *   npx tsx scripts/verify-worker-pipeline-steps.ts --skip-cleanup
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OFFER_ID = 990001;
const SOURCE = "shakes" as const;
/** Cyrillic «Адаптив» — matches isAdaptiveLandingType */
const ADAPTIVE = "\u0410\u0434\u0430\u043f\u0442\u0438\u0432";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1].trim()] = v;
  }
  return env;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!(k in process.env) || process.env[k] === "") process.env[k] = v;
}

const skipCleanup = process.argv.includes("--skip-cleanup");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  env.SITE_URL ??
  env.CZ_WORKERS_DEV_BASE ??
  "https://recenze-ceny.cz";

const secret = env.HOOK_SECRET;
if (!secret) {
  console.error("HOOK_SECRET missing in .env");
  process.exit(1);
}
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type StepResult = {
  name: string;
  ok: boolean;
  hook?: { path: string; status: number; elapsed_ms: number; body: unknown };
  db?: unknown;
  error?: string;
};

async function callHook(
  path: string,
  query: Record<string, string>,
  timeoutMs: number,
): Promise<{ status: number; elapsed_ms: number; body: unknown }> {
  const params = new URLSearchParams({ secret, ...query });
  const url = `${base}${path}?${params.toString()}`;
  const started = Date.now();
  console.error(`\n→ GET ${path}?${Object.keys(query).join("&")}…`);
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 2000) };
  }
  const elapsed_ms = Date.now() - started;
  console.error(`  status=${res.status} elapsed=${elapsed_ms}ms`);
  return { status: res.status, elapsed_ms, body };
}

async function clearArtifacts() {
  await sb.from("product_content").delete().eq("source", SOURCE).eq("offer_id", OFFER_ID);
  await sb.from("product_briefs").delete().eq("source", SOURCE).eq("offer_id", OFFER_ID);
  await sb.from("shakes_landing_facts").delete().eq("offer_id", OFFER_ID);
  await sb.from("offer_image_facts").delete().eq("source", SOURCE).eq("offer_id", OFFER_ID);
  await sb.from("content_gen_failures").delete().eq("source", SOURCE).eq("offer_id", OFFER_ID);
}

async function upsertOffer() {
  const now = new Date().toISOString();
  const title = "WorkerTest Pulse – kapsle";
  const row = {
    offer_id: OFFER_ID,
    title,
    picture_url: "https://shakes.pro/pics/offers/24082_promo.jpg",
    category: "parasites",
    raw: {
      id: OFFER_ID,
      title,
      image: "/pics/offers/24082_promo.jpg",
      landings: [
        {
          type: ADAPTIVE,
          url: "https://cz-workertest-pipeline.example.cz/offer-990001",
        },
      ],
      description: "Doplněk stravy – kapsle Cordyceps test pipeline",
    },
    is_active: true,
    synced_at: now,
  };
  const { error } = await sb.from("shakes_offers").upsert(row as never, {
    onConflict: "offer_id",
  });
  if (error) throw new Error(`upsert shakes_offers: ${error.message}`);
}

async function readLanding() {
  const { data } = await sb
    .from("shakes_landing_facts")
    .select("status,error,updated_at,source_url")
    .eq("offer_id", OFFER_ID)
    .maybeSingle();
  return data;
}

async function readImage() {
  const { data } = await sb
    .from("offer_image_facts")
    .select("status,method,error,updated_at")
    .eq("source", SOURCE)
    .eq("offer_id", OFFER_ID)
    .maybeSingle();
  return data;
}

async function readContent() {
  const { data } = await sb
    .from("product_content")
    .select("display_title_uk,description_html_uk,faq_uk,generated_at")
    .eq("source", SOURCE)
    .eq("offer_id", OFFER_ID)
    .maybeSingle();
  return data;
}

async function readFailure() {
  const { data } = await sb
    .from("content_gen_failures")
    .select("fail_count,last_error,locked_until,last_attempt_at")
    .eq("source", SOURCE)
    .eq("offer_id", OFFER_ID)
    .maybeSingle();
  return data;
}

function isContentComplete(row: {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
} | null): boolean {
  if (!row) return false;
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(
    row.display_title_uk &&
      row.description_html_uk &&
      row.description_html_uk.length >= 400 &&
      faqLen >= 3,
  );
}

async function cleanup() {
  await sb.from("shakes_offers").update({ is_active: false }).eq("offer_id", OFFER_ID);
  await clearArtifacts();
}

async function main() {
  const steps: StepResult[] = [];
  console.error(`base=${base} offer=shakes:${OFFER_ID} skipCleanup=${skipCleanup}`);

  console.error("\n=== setup upsert + clear ===");
  await upsertOffer();
  await clearArtifacts();

  // --- 1) Landing facts (persist via drain — smoke extract_only does NOT upsert DB) ---
  {
    const name = "landing-facts";
    try {
      let hook: Awaited<ReturnType<typeof callHook>> | null = null;
      let db = await readLanding();
      // Drain may process other pending offers first; loop until our row exists.
      for (let round = 1; round <= 6 && !db?.status; round++) {
        hook = await callHook(
          "/api/public/hooks/landing-facts-drain",
          { source: "shakes", limit: "80", deadline_ms: "120000" },
          180_000,
        );
        const items = (
          hook.body as { items?: Array<{ offerId?: number }> } | null
        )?.items;
        const hit = Array.isArray(items)
          ? items.some((i) => Number(i.offerId) === OFFER_ID)
          : false;
        db = await readLanding();
        console.error(
          `  landing drain round=${round} hit_in_items=${hit} status=${db?.status ?? "MISSING"}`,
        );
        if (hit || db?.status) break;
        const processed = Number(
          (hook.body as { processed?: number } | null)?.processed ?? 0,
        );
        if (processed === 0) break;
      }
      const ok = Boolean(db?.status);
      steps.push({
        name,
        ok,
        hook: hook
          ? { path: "/api/public/hooks/landing-facts-drain", ...hook }
          : undefined,
        db,
        error: ok ? undefined : "no shakes_landing_facts row after drain",
      });
      console.error(`  DB landing status=${db?.status ?? "MISSING"} ok=${ok}`);
    } catch (err) {
      steps.push({
        name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // --- 2) Image facts ---
  {
    const name = "image-facts";
    try {
      const hook = await callHook(
        "/api/public/hooks/smoke-image-facts",
        { source: "shakes", offer_id: String(OFFER_ID) },
        180_000,
      );
      const db = await readImage();
      const terminal =
        db?.status === "ok" ||
        db?.status === "no_image" ||
        db?.status === "exhausted" ||
        db?.status === "thin" ||
        db?.status === "fetch_error";
      const ok = Boolean(db?.status) && terminal;
      steps.push({
        name,
        ok,
        hook: { path: "/api/public/hooks/smoke-image-facts", ...hook },
        db,
        error: ok ? undefined : `unexpected image status=${db?.status ?? "MISSING"}`,
      });
      console.error(`  DB image status=${db?.status ?? "MISSING"} method=${db?.method ?? "-"} ok=${ok}`);
    } catch (err) {
      steps.push({
        name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // --- 3) Content drain (newest missing + facts-ready should claim 990001 first) ---
  {
    const name = "content-drain";
    try {
      let hook: Awaited<ReturnType<typeof callHook>> | null = null;
      let db = await readContent();
      let fail = await readFailure();
      for (let round = 1; round <= 3 && !isContentComplete(db); round++) {
        // Bump synced_at so priority sort prefers this offer among bare-missing.
        await sb
          .from("shakes_offers")
          .update({ synced_at: new Date().toISOString() })
          .eq("offer_id", OFFER_ID);
        hook = await callHook(
          "/api/public/hooks/content-drain",
          { sources: "shakes", deadline_ms: "180000" },
          320_000,
        );
        db = await readContent();
        fail = await readFailure();
        console.error(
          `  content drain round=${round} title=${db?.display_title_uk ?? "-"} html=${db?.description_html_uk?.length ?? 0} faq=${Array.isArray(db?.faq_uk) ? db!.faq_uk.length : 0}`,
        );
        if (isContentComplete(db)) break;
        if (fail?.last_error) break;
      }
      const ok = isContentComplete(db);
      steps.push({
        name,
        ok,
        hook: hook
          ? { path: "/api/public/hooks/content-drain", ...hook }
          : undefined,
        db: {
          complete: ok,
          title: db?.display_title_uk ?? null,
          html_len: db?.description_html_uk?.length ?? 0,
          faq_len: Array.isArray(db?.faq_uk) ? db!.faq_uk.length : 0,
          generated_at: db?.generated_at ?? null,
          failure: fail,
        },
        error: ok ? undefined : "product_content incomplete after content-drain",
      });
      console.error(
        `  DB content title=${db?.display_title_uk ?? "-"} html=${db?.description_html_uk?.length ?? 0} faq=${Array.isArray(db?.faq_uk) ? db!.faq_uk.length : 0} ok=${ok}`,
      );
    } catch (err) {
      steps.push({
        name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allOk = steps.every((s) => s.ok);
  const slugHint = `workertest-pulse-kapsle-s${OFFER_ID}`;
  const report = {
    ok: allOk,
    base,
    offer_id: OFFER_ID,
    source: SOURCE,
    pdp_slug_hint: `/{shelf}/${slugHint}`,
    skipCleanup,
    steps,
    finished_at: new Date().toISOString(),
  };

  mkdirSync(resolve(root, "scripts/out"), { recursive: true });
  const outPath = resolve(
    root,
    "scripts/out",
    `worker-pipeline-steps-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.error(`\nWrote ${outPath}`);

  console.log(JSON.stringify(report, null, 2));

  if (!skipCleanup) {
    console.error("\n=== cleanup (deactivate + delete artifacts) ===");
    await cleanup();
  } else {
    console.error("\n=== skip-cleanup: offer left active ===");
  }

  if (!allOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
