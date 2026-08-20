import assert from "node:assert/strict";
import {
  emptyPageBeforeEndError,
  feedSyncSourceHasError,
  isFeedPageExhausted,
  nextCpagettiPageLimit,
  parseCpagettiFeedJson,
  redactSecretsInUrl,
  shouldDeactivateCatalog,
} from "./feed-sync-guards";

let failed = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`fail - ${name}`);
    console.error(err);
  }
}

ok("deactivate ok when catalog grows or dips slightly", () => {
  assert.equal(shouldDeactivateCatalog({ previousActive: 100, incomingAllowed: 95 }).ok, true);
  assert.equal(shouldDeactivateCatalog({ previousActive: 5, incomingAllowed: 2 }).ok, true);
});

ok("deactivate aborted on empty incoming vs live catalog", () => {
  const r = shouldDeactivateCatalog({ previousActive: 40, incomingAllowed: 0 });
  assert.equal(r.ok, false);
});

ok("deactivate aborted on >30% drop", () => {
  const r = shouldDeactivateCatalog({ previousActive: 100, incomingAllowed: 60 });
  assert.equal(r.ok, false);
});

ok("page exhausted on short 200 page", () => {
  assert.equal(
    isFeedPageExhausted({ httpStatus: 200, pageLength: 12, pageSize: 100 }),
    true,
  );
  assert.equal(
    isFeedPageExhausted({ httpStatus: 500, pageLength: 0, pageSize: 100 }),
    false,
  );
});

ok("page exhausted when offset+length reaches total", () => {
  assert.equal(
    isFeedPageExhausted({
      httpStatus: 200,
      pageLength: 100,
      pageSize: 100,
      offset: 200,
      total: 300,
    }),
    true,
  );
  assert.equal(
    isFeedPageExhausted({
      httpStatus: 200,
      pageLength: 100,
      pageSize: 100,
      offset: 0,
      total: 500,
    }),
    false,
  );
});

ok("empty middle page before total is an error", () => {
  assert.equal(
    emptyPageBeforeEndError({ offset: 200, pageLength: 0, total: 800 }),
    "empty page at offset=200 before total=800",
  );
  assert.equal(emptyPageBeforeEndError({ offset: 0, pageLength: 0, total: 800 }), null);
  assert.equal(emptyPageBeforeEndError({ offset: 200, pageLength: 10, total: 800 }), null);
});

ok("cpagetti parse throws on HTML", () => {
  assert.throws(() => parseCpagettiFeedJson("<html>nope</html>"));
});

ok("cpagetti parse reads object response + total", () => {
  const parsed = parseCpagettiFeedJson(
    JSON.stringify({ info: { total: "3" }, response: { a: { id: 1 }, b: { id: 2 } } }),
  );
  assert.equal(parsed.total, 3);
  assert.equal(parsed.offers.length, 2);
});

ok("redact token/api_key from URLs", () => {
  const red = redactSecretsInUrl(
    "https://api.example/offers?token=secret&api_key=abc&page=1",
  );
  assert.ok(!red.includes("secret"));
  assert.ok(!red.includes("abc"));
  assert.ok(red.includes("token=***"));
});

ok("cpagetti page limit falls back 100 → 10 → 1", () => {
  assert.equal(nextCpagettiPageLimit(100), 10);
  assert.equal(nextCpagettiPageLimit(10), 1);
  assert.equal(nextCpagettiPageLimit(1), null);
});

ok("source error detection", () => {
  assert.equal(feedSyncSourceHasError({ fetched: 1 }), false);
  assert.equal(feedSyncSourceHasError({ skipped: "http_403" }), false);
  assert.equal(feedSyncSourceHasError({ error: "timeout" }), true);
});

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nfeed-sync-guards.test.ts: OK");
