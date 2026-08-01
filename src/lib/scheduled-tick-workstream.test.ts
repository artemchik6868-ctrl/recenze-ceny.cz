import assert from "node:assert/strict";
import {
  isTopOfHourUtc,
  scheduledTickWorkstream,
} from "./scheduled-tick-workstream";

assert.equal(isTopOfHourUtc(0), true);
assert.equal(isTopOfHourUtc(19), true);
assert.equal(isTopOfHourUtc(20), false);
assert.equal(isTopOfHourUtc(30), false);

assert.equal(scheduledTickWorkstream(0), "facts");
assert.equal(scheduledTickWorkstream(5), "facts");
assert.equal(scheduledTickWorkstream(19), "facts");
assert.equal(scheduledTickWorkstream(20), "content");
assert.equal(scheduledTickWorkstream(30), "content");
assert.equal(scheduledTickWorkstream(45), "content");

console.log("scheduled-tick-workstream.test.ts: ok");
