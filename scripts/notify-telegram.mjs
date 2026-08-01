/**
 * Send a Telegram message via Bot API.
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Usage:
 *   node scripts/notify-telegram.mjs --title="..." --body="..."
 *   node scripts/notify-telegram.mjs --title="..." --body="..." --ok
 *
 * Missing secrets → no-op exit 0 (forks / local without secrets).
 */
const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : "";
};

const title = arg("title") || "recenze-ceny.cz alert";
const body = arg("body") || "";
const ok = process.argv.includes("--ok");

const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();

if (!token || !chatId) {
  console.warn("notify-telegram: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skip");
  process.exit(0);
}

const runUrl =
  process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "";

const icon = ok ? "✅" : "🚨";
const lines = [`${icon} *${escapeMd(title)}*`, "", escapeMd(body)].filter(Boolean);
if (runUrl) lines.push("", `[GitHub Actions run](${runUrl})`);

const text = lines.join("\n");

const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  }),
});

if (!res.ok) {
  const errText = await res.text().catch(() => "");
  console.error(`notify-telegram: HTTP ${res.status} ${errText.slice(0, 300)}`);
  process.exit(1);
}

console.log("notify-telegram: sent");

function escapeMd(s) {
  return String(s).replace(/([_*`\[])/g, "\\$1");
}
