/**
 * Ops Telegram digest from pipeline-status (low noise, edge-triggered).
 *
 * Signal tiers:
 *   A — site probes (GHA health-fail) — root cause = failed step + log snippet
 *   B — fresh ops incidents only (page daily)
 *   C — warehouse stock (ops.* only, never page)
 *
 * Usage:
 *   node scripts/ops-telegram-digest.mjs [--base=https://recenze-ceny.cz]
 *   node scripts/ops-telegram-digest.mjs --health-fail   # after hourly health FAIL
 *   node scripts/ops-telegram-digest.mjs --dry-run       # print only, no Telegram / state
 *
 * Env: HOOK_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * State file (anti-flap): OPS_TELEGRAM_STATE_PATH or .ops-telegram-state.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildIssuesFromStatus,
  fingerprintIssues,
  isWarehouseStockAlert,
} from "./ops-build-issues.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const env = {};
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
}

const base = (
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ||
  process.env.BG_SYNC_BASE ||
  process.env.SITE_BASE ||
  env.CZ_WORKERS_DEV_BASE ||
  "https://recenze-ceny.cz"
).replace(/\/$/, "");

const secret = (process.env.HOOK_SECRET || env.HOOK_SECRET || "").trim();
const dryRun = process.argv.includes("--dry-run");
const healthFail = process.argv.includes("--health-fail");
const forceNotify = process.argv.includes("--force");

const thresholds = {
  staleMin: Number(process.env.OPS_STALE_MIN || "5"),
  repeatedFailMin: Number(process.env.OPS_REPEATED_FAIL_MIN || "3"),
  indexingErrorMin: Number(process.env.OPS_INDEXING_ERROR_MIN || "10"),
  inspectErrorMin: Number(process.env.OPS_INSPECT_ERROR_MIN || "5"),
  imageFactsFailMin: Number(process.env.OPS_IMAGE_FACTS_FAIL_MIN || "5"),
  landingFactsFailMin: Number(process.env.OPS_LANDING_FACTS_FAIL_MIN || "5"),
};
const SITEMAP_MIN_BYTES = Number(process.env.OPS_SITEMAP_MIN_BYTES || "500");

const statePath =
  process.env.OPS_TELEGRAM_STATE_PATH || resolve(root, ".ops-telegram-state.json");

if (!secret && !healthFail) {
  console.error("ops-telegram-digest: HOOK_SECRET missing");
  process.exit(1);
}

function fetchPipelineStatus() {
  const url = `${base}/api/public/hooks/pipeline-status?secret=${encodeURIComponent(secret)}`;
  const res = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `const res = await fetch(${JSON.stringify(url)}, { signal: AbortSignal.timeout(320000) });
const text = await res.text();
console.log(JSON.stringify({ status: res.status, body: text }));`,
    ],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || "pipeline-status fetch failed");
  }
  const payload = JSON.parse(res.stdout.trim());
  let body;
  try {
    body = JSON.parse(payload.body);
  } catch {
    throw new Error(`pipeline-status non-JSON HTTP ${payload.status}`);
  }
  if (payload.status >= 400) {
    // Worker returns 503 when ok:false (missing AI etc.) — still a readable status body.
    if (
      payload.status === 503 &&
      body &&
      typeof body === "object" &&
      Array.isArray(body.alerts)
    ) {
      return body;
    }
    throw new Error(`pipeline-status HTTP ${payload.status}: ${payload.body.slice(0, 200)}`);
  }
  return body;
}

function loadState() {
  try {
    if (!existsSync(statePath)) return { fingerprint: "", bad: false };
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return { fingerprint: "", bad: false };
  }
}

function saveState(state) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function checkPublicSitemap() {
  const url = `${base}/sitemap.xml`;
  const res = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `const res = await fetch(${JSON.stringify(url)}, { signal: AbortSignal.timeout(20000), redirect: "follow" });
const text = await res.text();
console.log(JSON.stringify({ status: res.status, bytes: text.length, hasUrlset: text.includes("<urlset") || text.includes("<sitemapindex") }));`,
    ],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    return { ok: false, text: `Публичный sitemap.xml недоступен: ${res.stderr || res.stdout || "fetch failed"}` };
  }
  const payload = JSON.parse(res.stdout.trim());
  if (payload.status < 200 || payload.status >= 400) {
    return { ok: false, text: `Публичный sitemap.xml HTTP ${payload.status}` };
  }
  if (!payload.hasUrlset || payload.bytes < SITEMAP_MIN_BYTES) {
    return {
      ok: false,
      text: `Публичный sitemap.xml подозрительно мал/пуст (${payload.bytes} байт)`,
    };
  }
  return { ok: true, text: null };
}

function buildIssues(status, { includePublicSitemap = true } = {}) {
  const publicSitemap = includePublicSitemap ? checkPublicSitemap() : null;
  return buildIssuesFromStatus(status, {
    thresholds,
    publicSitemap: publicSitemap && !publicSitemap.ok ? publicSitemap : null,
  });
}

function notifyTelegram({ title, body, ok = false }) {
  const args = [
    resolve(root, "scripts/notify-telegram.mjs"),
    `--title=${title}`,
    `--body=${body}`,
  ];
  if (ok) args.push("--ok");
  const r = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: process.env,
    cwd: root,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    throw new Error(`notify-telegram exited ${r.status}`);
  }
}

// --- main ---

if (healthFail) {
  const failedStep = (process.env.HEALTH_FAILED_STEP || "").trim();
  const probeLog = (process.env.HEALTH_PROBE_LOG_SNIPPET || "").trim();
  let detail = `Ежечасная проверка продакшена упала.`;
  if (failedStep) {
    detail += `\nУпавший шаг (причина probe): ${failedStep}`;
  } else {
    detail += `\nШаги: smoke / sitemap / pipeline / SEO (какой — смотри Actions).`;
  }
  detail += `\nАдрес: ${base}`;
  if (process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY) {
    detail += `\nПрогон: https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  }
  if (probeLog) {
    detail += `\n\nЛог упавшего шага (хвост):\n${probeLog}`;
  }

  try {
    if (secret) {
      const status = fetchPipelineStatus();
      // Fresh incident issues only — do not dump warehouse stock as "health root cause".
      // Skip public sitemap here: health probe may already cover it; avoid double noise.
      const issues = buildIssues(status, { includePublicSitemap: false });
      const missing = Number(status?.totals?.missing_content ?? 0);
      const stale = Number(status?.ops?.stale_content ?? status?.totals?.stale_content ?? 0);
      const factsPending = Number(status?.totals?.facts_pending ?? 0);
      const alerts = Array.isArray(status?.alerts) ? status.alerts : [];
      const stuck = Array.isArray(status?.stuck_offers) ? status.stuck_offers : [];

      detail += `\n\nКонтекст пайплайна (ok=${status?.ok === true ? "true" : "false"}): missing_content=${missing}, stale_content=${stale}, facts_pending=${factsPending}`;

      const ops = status?.ops ?? {};
      const rateLimited = Number(ops.indexing_rate_limited_24h ?? 0);
      if (rateLimited > 0) {
        detail += `\nIndexNow rate_limited (24h, не hard error): ${rateLimited}`;
      }

      const warehouseBits = [];
      const imgEx = Number(ops.image_facts_exhausted ?? 0);
      const landEx = Number(ops.landing_facts_exhausted ?? 0);
      const imgRep = Number(ops.image_facts_reprobe_eligible ?? 0);
      const landRep = Number(ops.landing_facts_reprobe_eligible ?? 0);
      if (imgEx > 0 || landEx > 0 || imgRep > 0 || landRep > 0) {
        warehouseBits.push(
          `warehouse (stock, не причина probe): image_exhausted=${imgEx} (reprobe=${imgRep}), landing_exhausted=${landEx} (reprobe=${landRep})`,
        );
      }
      if (warehouseBits.length) {
        detail += `\n${warehouseBits.join("; ")}`;
      }

      if (issues.length) {
        detail += `\n\nСвежие ops-сигналы (не обязательно причина падения probe):\n${issues.map((i) => `• ${i.text}`).join("\n")}`;
      }

      if (stuck.length) {
        const preview = stuck
          .slice(0, 8)
          .map((o) => {
            const reason = o.block_reason ? `/${o.block_reason}` : "";
            const err = o.last_error ? ` (${String(o.last_error).slice(0, 60)})` : "";
            return `${o.source}:${o.offer_id}${reason}${err}`;
          })
          .join(", ");
        detail += `\nstuck: ${preview}${stuck.length > 8 ? "…" : ""}`;
      }
      const idxSamples = Array.isArray(status?.ops?.indexing_error_samples)
        ? status.ops.indexing_error_samples
        : [];
      if (idxSamples.length) {
        detail += `\nindexing hard-error samples: ${idxSamples.slice(0, 3).join(" | ")}`;
      }
      // Only surface AI / feed alerts — skip factory warehouse stock strings.
      const filteredAlerts = alerts.filter((a) => !isWarehouseStockAlert(a));
      if (filteredAlerts.length) {
        detail += `\nАлерты:\n${filteredAlerts.map((a) => `• ${a}`).join("\n")}`;
      }
    }
  } catch (e) {
    detail += `\n\nНе удалось получить pipeline-status: ${e instanceof Error ? e.message : e}`;
  }

  if (dryRun) {
    console.log(`[dry-run] health-fail\n${detail}`);
    process.exit(0);
  }
  notifyTelegram({
    title: "recenze-ceny.cz: проверка здоровья не прошла",
    body: detail,
  });
  process.exit(0);
}

let status;
try {
  status = fetchPipelineStatus();
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("ops-telegram-digest:", msg);
  if (dryRun) process.exit(1);
  const prev = loadState();
  const fp = "pipeline_unreachable";
  if (forceNotify || prev.fingerprint !== fp) {
    notifyTelegram({
      title: "recenze-ceny.cz: pipeline-status недоступен",
      body: `Не удалось прочитать статус пайплайна.\nАдрес: ${base}\nОшибка: ${msg}`,
    });
    if (!dryRun) saveState({ fingerprint: fp, bad: true, at: new Date().toISOString() });
  }
  process.exit(1);
}

const issues = buildIssues(status);
const fp = fingerprintIssues(issues);
const bad = issues.length > 0;
const prev = loadState();

console.log(
  JSON.stringify(
    {
      base,
      bad,
      fingerprint: fp,
      previous: prev.fingerprint || "",
      issues: issues.map((i) => i.code),
      ops: status.ops ?? null,
      totals: status.totals ?? null,
    },
    null,
    2,
  ),
);

if (dryRun) {
  console.log("[dry-run] skip Telegram / state write");
  process.exit(bad ? 1 : 0);
}

const changed = forceNotify || fp !== (prev.fingerprint || "");

if (bad && changed) {
  notifyTelegram({
    title: "recenze-ceny.cz: проблемы пайплайна",
    body: `${issues.map((i) => `• ${i.text}`).join("\n")}\n\nАдрес: ${base}`,
  });
} else if (!bad && prev.bad) {
  notifyTelegram({
    ok: true,
    title: "recenze-ceny.cz: пайплайн в норме",
    body: `Критичные ops-сигналы сняты.\nАдрес: ${base}`,
  });
} else {
  console.log("ops-telegram-digest: no state change — skip Telegram");
}

saveState({ fingerprint: fp, bad, at: new Date().toISOString() });
process.exit(0);
