/**
 * Telegram summary for Node feed ingest (reads .feed-sync-result.json).
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (missing → no-op via notify-telegram).
 * Incomplete (http_403 / skippedOffsets) is never --ok — GHA must retry the day.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const resultPath = resolve(root, ".feed-sync-result.json");

if (!existsSync(resultPath)) {
  spawnSync(
    process.execPath,
    [
      resolve(root, "scripts/notify-telegram.mjs"),
      "--title=Feed sync — нет результата",
      "--body=Job завершился без .feed-sync-result.json (ранний fail / secrets?).",
    ],
    { stdio: "inherit", env: process.env },
  );
  process.exit(0);
}

const r = JSON.parse(readFileSync(resultPath, "utf8"));
const ok = r.ok === true;
const failed = Array.isArray(r.failed) ? r.failed : [];
const incomplete = Array.isArray(r.incomplete) ? r.incomplete : [];
const sources = r.sources && typeof r.sources === "object" ? r.sources : {};
const lines = Object.entries(sources).map(([name, row]) => {
  if (!row || typeof row !== "object") return `${name}: ?`;
  const o = row;
  if (typeof o.error === "string") return `${name}: ERROR`;
  if (typeof o.skipped === "string") return `${name}: skipped=${o.skipped}`;
  const fetched = o.fetched ?? "-";
  const allowed = o.allowed ?? o.ua ?? "-";
  const deactivated = o.deactivated ?? "-";
  const skipList = Array.isArray(o.skippedOffsetList)
    ? o.skippedOffsetList.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : [];
  const skipN =
    typeof o.skippedOffsets === "number" && Number.isFinite(o.skippedOffsets)
      ? o.skippedOffsets
      : skipList.length;
  const skippedOff =
    skipN > 0
      ? ` skippedOffsets=${skipN}${skipList.length ? ` offsets=${skipList.join(",")}` : ""}`
      : "";
  return `${name}: fetched=${fetched} allowed=${allowed} deactivated=${deactivated}${skippedOff}`;
});

const title = ok
  ? "Feed sync — ok"
  : failed.includes("lock_busy")
    ? "Feed sync — lock busy"
    : incomplete.length && failed.filter((f) => f !== "lock_busy").length === 0
      ? `Feed sync — incomplete (${incomplete.join(",")})`
      : `Feed sync — fail (${failed.join(",") || "unknown"})`;

const body = [
  `ok=${ok} lock=${r.lock ?? "?"} elapsed_ms=${r.elapsed_ms ?? "?"}`,
  lines.join("\n") || "(нет source stats)",
  failed.length ? `failed: ${failed.join(", ")}` : "",
  incomplete.length ? `incomplete: ${incomplete.join(", ")}` : "",
]
  .filter(Boolean)
  .join("\n\n");

const args = [
  resolve(root, "scripts/notify-telegram.mjs"),
  `--title=${title}`,
  `--body=${body}`,
];
if (ok) args.push("--ok");

const res = spawnSync(process.execPath, args, { stdio: "inherit", env: process.env });
process.exit(res.status ?? 0);
