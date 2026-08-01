#!/usr/bin/env tsx
/**
 * Audit: every catalog shelf has audience + age range helpers for LLM review slots.
 */
import { ALLOWED_SHELF_SLUGS } from "../src/lib/catalog-shelf";
import {
  audienceFor,
  ageRangeFor,
  buildReviewSlots,
  reviewCountFor,
} from "../src/lib/reviews";

const SAMPLE_OFFER_IDS = [4852, 16612, 17031, 1001, 99999];
const failures: string[] = [];

for (const offerId of SAMPLE_OFFER_IDS) {
  const n = reviewCountFor(offerId);
  if (n < 3 || n > 10) {
    failures.push(`offer ${offerId}: reviewCountFor=${n} outside 3..10`);
  }
}

const counts = new Set(SAMPLE_OFFER_IDS.map(reviewCountFor));
if (counts.size < 2) {
  failures.push("reviewCountFor looks constant across sample offerIds");
}

const SAMPLE_OFFER_ID = SAMPLE_OFFER_IDS[0];
const expected = reviewCountFor(SAMPLE_OFFER_ID);

for (const slug of ALLOWED_SHELF_SLUGS) {
  const audience = audienceFor(slug);
  const range = ageRangeFor(slug);
  const slots = buildReviewSlots(SAMPLE_OFFER_ID, slug);

  if (range.min > range.max || range.min < 18 || range.max > 90) {
    failures.push(`${slug}: bad age range ${range.min}-${range.max}`);
  }
  if (slots.length !== expected) {
    failures.push(`${slug}: slots=${slots.length} expected=${expected}`);
  }
  if (audience === "men" && slots.some((s) => s.gender !== "m")) {
    failures.push(`${slug}: men audience but mixed genders`);
  }
  if (audience === "women" && slots.some((s) => s.gender !== "f")) {
    failures.push(`${slug}: women audience but mixed genders`);
  }
  for (const s of slots) {
    if (s.age < range.min || s.age > range.max) {
      failures.push(`${slug}: age ${s.age} outside ${range.min}-${range.max}`);
      break;
    }
  }
}

if (failures.length) {
  console.error(`audit-review-coverage FAILED (${failures.length}):\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `audit-review-coverage OK — ${ALLOWED_SHELF_SLUGS.length} slugs, counts 3..10 (sample n=${expected})`,
);
