#!/usr/bin/env tsx
import { pickReviews } from "../src/lib/reviews";
import { resolveReviewSlots } from "../src/lib/review-slots";

const SLUG_CHECKS: Record<string, RegExp[]> = {
  cystitida: [/emorroid|emorroidi/i],
  "anti-aging": [/psoriasis|psori\b/i],
  "intimate-comfort": [/cistite\b/i],
  lupenka: [/anti-?age/i],
  "vypadavani-vlasu": [/per il seno/i],
};

let failed = false;

for (const [slug, patterns] of Object.entries(SLUG_CHECKS)) {
  const reviews = pickReviews(12345, 5, "it", "any", slug);
  const slots = resolveReviewSlots(slug);
  console.log(`\n=== ${slug} (${slots.length} slots) ===`);
  const allText = reviews.map((r) => r.text).join(" ");
  for (const re of patterns) {
    if (re.test(allText)) {
      console.error(`  FAIL off-topic ${re}`);
      failed = true;
    }
  }
  for (const r of reviews) {
    console.log(`  ${r.name}: ${r.text.slice(0, 90)}`);
  }
}

if (failed) process.exit(1);
console.log("\nSmoke OK");
