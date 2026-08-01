/**
 * Playwright hydration smoke — detects white screen / client RPC failures.
 * Usage: node scripts/smoke-home-hydration.mjs [--base=https://recenze-ceny.cz]
 */
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7)?.replace(/\/$/, "") ||
  "https://recenze-ceny.cz";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("playwright not installed — run: npm install -D playwright && npx playwright install chromium");
  process.exit(1);
}

const consoleErrors = [];
const serverFnFailures = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

page.on("response", (res) => {
  const url = res.url();
  if (url.includes("/_serverFn/") && res.status() >= 400) {
    serverFnFailures.push(`${res.status()} ${url}`);
  }
});

await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(3000);

const categoriesVisible = await page.locator("#categories").isVisible().catch(() => false);
const h1Visible = await page.locator("h1").first().isVisible().catch(() => false);
const bodyTextLen = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);

await browser.close();

console.log(`\n=== home hydration smoke — ${base} ===\n`);
console.log(`#categories visible: ${categoriesVisible}`);
console.log(`h1 visible: ${h1Visible}`);
console.log(`body text length: ${bodyTextLen}`);

if (serverFnFailures.length) {
  console.log("\n/_serverFn failures:");
  for (const f of serverFnFailures) console.log(`  ${f}`);
}

if (consoleErrors.length) {
  console.log("\nconsole.error:");
  for (const e of consoleErrors.slice(0, 15)) console.log(`  ${e.slice(0, 300)}`);
  if (consoleErrors.length > 15) console.log(`  ... +${consoleErrors.length - 15} more`);
}

let fail = 0;
if (!categoriesVisible || !h1Visible) {
  console.log("\nFAIL: main content not visible after hydration");
  fail += 1;
}
if (bodyTextLen < 200) {
  console.log("FAIL: page body nearly empty (possible white screen)");
  fail += 1;
}
if (serverFnFailures.length) fail += 1;

if (fail) process.exit(1);
console.log("\nHome hydration OK");
