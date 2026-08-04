/**
 * Telegram summary for blog ingest (reads .blog-ingest-result.json).
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (missing → no-op via notify-telegram).
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const resultPath = resolve(root, ".blog-ingest-result.json");

if (!existsSync(resultPath)) {
  spawnSync(
    process.execPath,
    [
      resolve(root, "scripts/notify-telegram.mjs"),
      "--title=Blog ingest — нет результата",
      "--body=Job завершился без .blog-ingest-result.json (ранний fail / secrets?).",
    ],
    { stdio: "inherit", env: process.env },
  );
  process.exit(0);
}

const r = JSON.parse(readFileSync(resultPath, "utf8"));
const inserted = Number(r.inserted || 0);
const errors = Array.isArray(r.errors) ? r.errors : [];
const skipped = Number(r.skipped || 0);
const scanned = Number(r.scanned || 0);
const slugs = Array.isArray(r.slugs) ? r.slugs : [];
const links = slugs.map((s) => `https://recenze-ceny.cz/clanky/${s}`).join("\n");

const ok = inserted > 0 || errors.length === 0;
const title =
  inserted >= 2
    ? `Blog ingest — ${inserted} статей`
    : inserted === 1
      ? "Blog ingest — 1 статья (мало)"
      : errors.length > 0
        ? "Blog ingest — 0 статей (ошибки)"
        : "Blog ingest — 0 статей (сухой день)";

const body = [
  `inserted=${inserted} skipped=${skipped} scanned=${scanned} errors=${errors.length}`,
  links || "(нет slug)",
  errors.length ? `errors:\n- ${errors.slice(0, 5).join("\n- ")}` : "",
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
