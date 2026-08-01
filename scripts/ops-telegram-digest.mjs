/**
 * Ops Telegram digest from pipeline-status (low noise, edge-triggered).
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

const STALE_ALERT_MIN = Number(process.env.OPS_STALE_MIN || "5");
const REPEATED_FAIL_MIN = Number(process.env.OPS_REPEATED_FAIL_MIN || "3");
const INDEXING_ERROR_MIN = Number(process.env.OPS_INDEXING_ERROR_MIN || "10");
const INSPECT_ERROR_MIN = Number(process.env.OPS_INSPECT_ERROR_MIN || "5");
const IMAGE_FACTS_FAIL_MIN = Number(process.env.OPS_IMAGE_FACTS_FAIL_MIN || "5");
const LANDING_FACTS_FAIL_MIN = Number(process.env.OPS_LANDING_FACTS_FAIL_MIN || "5");
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

function buildIssues(status) {
  const ops = status?.ops ?? {};
  const totals = status?.totals ?? {};
  const alerts = Array.isArray(status?.alerts) ? status.alerts : [];
  const issues = [];

  let stale = Number(ops.stale_content ?? totals.stale_content ?? 0);
  let repeated = Number(ops.repeated_failures ?? totals.repeated_failures ?? 0);
  const missing = Number(totals.missing_content ?? 0);
  let feedErr = ops.feed_wave_error || status?.feed_wave?.last_error || null;
  let feedStale = Boolean(ops.feed_wave_stale || status?.feed_wave?.stale);
  let indexingErr = Number(ops.indexing_errors_24h ?? 0);
  let indexingCfg = Number(ops.indexing_config_skips_24h ?? 0);
  let inspectErr = Number(ops.inspect_errors_24h ?? 0);
  let imageFail = Number(ops.image_facts_high_fail ?? 0);
  let imageExhausted = Number(ops.image_facts_exhausted ?? 0);
  let landingFail = Number(ops.landing_facts_high_fail ?? 0);
  let gscErrors = ops.gsc_sitemap_errors;
  let gscErrMsg = ops.gsc_sitemap_error || null;
  let gscSkipped = ops.gsc_sitemap_skipped || null;

  // Fallback when worker not yet redeployed with full `ops` block.
  if (!status?.ops || ops.inspect_errors_24h == null) {
    for (const a of alerts) {
      const staleMatch = String(a).match(/(\d+)\s+offers missing AI > 2h/i);
      if (staleMatch) stale += Number(staleMatch[1]);
      const failMatch = String(a).match(/(\d+)\s+offers have repeated AI failures/i);
      if (failMatch) repeated += Number(failMatch[1]);
      if (/feed-wave:\s*stale/i.test(a)) feedStale = true;
      if (/feed-wave:\s*last_error=/i.test(a) && !feedErr) {
        feedErr = String(a).replace(/^.*last_error=/i, "");
      }
      const idxErr = String(a).match(/indexing:\s*(\d+)\s+errors/i);
      if (idxErr) indexingErr = Math.max(indexingErr, Number(idxErr[1]));
      const idxCfg = String(a).match(/indexing:\s*(\d+)\s+skipped_config/i);
      if (idxCfg) indexingCfg = Math.max(indexingCfg, Number(idxCfg[1]));
      const insp = String(a).match(/indexing-retry:\s*(\d+)\s+GSC inspect/i);
      if (insp) inspectErr = Math.max(inspectErr, Number(insp[1]));
      const img = String(a).match(/image-facts:\s*(\d+)\s+rows with fail_count/i);
      if (img) imageFail = Math.max(imageFail, Number(img[1]));
      const imgEx = String(a).match(/image-facts:\s*(\d+)\s+rows status exhausted/i);
      if (imgEx) imageExhausted = Math.max(imageExhausted, Number(imgEx[1]));
      const land = String(a).match(/landing-facts:\s*(\d+)\s+rows/i);
      if (land) landingFail = Math.max(landingFail, Number(land[1]));
      const gsc = String(a).match(/gsc-sitemap:\s*(\d+)\s+errors/i);
      if (gsc) gscErrors = Math.max(Number(gscErrors ?? 0), Number(gsc[1]));
      if (/gsc-sitemap:\s*skipped_config/i.test(a)) gscSkipped = "no_token";
      if (/gsc-sitemap:\s*get failed/i.test(a) && !gscErrMsg) {
        gscErrMsg = String(a).replace(/^.*get failed —\s*/i, "");
      }
    }
  }

  if (stale >= STALE_ALERT_MIN) {
    issues.push({
      code: "stale_ai",
      text: `AI-контент застрял: ${stale} офферов без контента >2ч (всего без AI: ${missing})`,
    });
  }
  if (repeated >= REPEATED_FAIL_MIN) {
    issues.push({
      code: "ai_failures",
      text: `Повторяющиеся сбои AI: ${repeated} офферов с fail_count≥3`,
    });
  }
  if (feedStale) {
    issues.push({
      code: "feed_wave_stale",
      text: "Волна фидов зависла (>26ч без прогресса)",
    });
  }
  if (feedErr) {
    issues.push({
      code: "feed_wave_error",
      text: `Ошибка волны фидов: ${String(feedErr).slice(0, 200)}`,
    });
  }
  if (indexingErr >= INDEXING_ERROR_MIN) {
    issues.push({
      code: "indexing_errors",
      text: `Индексация: ${indexingErr} ошибок за 24ч (IndexNow/Google/Seznam)`,
    });
  }
  if (indexingCfg > 0) {
    issues.push({
      code: "indexing_config",
      text: `Индексация: ${indexingCfg} skipped_config за 24ч (проверьте ключи/SA)`,
    });
  }
  if (inspectErr >= INSPECT_ERROR_MIN) {
    issues.push({
      code: "inspect_errors",
      text: `GSC inspect (indexing-retry): ${inspectErr} ошибок за 24ч`,
    });
  }
  if (imageFail >= IMAGE_FACTS_FAIL_MIN) {
    issues.push({
      code: "image_facts",
      text: `Image-facts: ${imageFail} строк с fail_count≥3`,
    });
  }
  if (imageExhausted >= IMAGE_FACTS_FAIL_MIN) {
    issues.push({
      code: "image_facts_circuit",
      text: `Image-facts: ${imageExhausted} строк exhausted/fetch_error (риск circuit breaker)`,
    });
  }
  if (landingFail >= LANDING_FACTS_FAIL_MIN) {
    issues.push({
      code: "landing_facts",
      text: `Landing-facts: ${landingFail} строк с fail_count≥3 или exhausted`,
    });
  }
  if (gscSkipped === "no_token") {
    issues.push({
      code: "gsc_config",
      text: "GSC sitemap: нет токена (GOOGLE_INDEXING_SA_JSON / права Search Console)",
    });
  }
  if (gscErrMsg) {
    issues.push({
      code: "gsc_sitemap_api",
      text: `GSC sitemap API: ${String(gscErrMsg).slice(0, 200)}`,
    });
  }
  if (typeof gscErrors === "number" && gscErrors > 0) {
    issues.push({
      code: "gsc_sitemap_errors",
      text: `GSC sitemap: ${gscErrors} ошибок в Search Console`,
    });
  }

  const pub = checkPublicSitemap();
  if (!pub.ok) {
    issues.push({ code: "public_sitemap", text: pub.text });
  }

  return issues;
}

function fingerprint(issues) {
  return issues
    .map((i) => i.code)
    .sort()
    .join("|");
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
  let detail = `Ежечасная проверка продакшена упала (smoke / sitemap / pipeline / SEO).\nАдрес: ${base}`;
  try {
    if (secret) {
      const status = fetchPipelineStatus();
      const issues = buildIssues(status);
      if (issues.length) {
        detail += `\n\nДетали пайплайна:\n${issues.map((i) => `• ${i.text}`).join("\n")}`;
      } else {
        const missing = Number(status?.totals?.missing_content ?? 0);
        detail += `\n\nПайплайн: missing_content=${missing} (критичных ops-сигналов нет).`;
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
const fp = fingerprint(issues);
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
