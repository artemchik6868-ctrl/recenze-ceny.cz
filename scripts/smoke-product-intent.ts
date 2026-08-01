#!/usr/bin/env tsx
/**
 * Smoke: title-first product intent + classify ladder.
 *
 * Usage: npx tsx scripts/smoke-product-intent.ts
 */
import { classifyTitleFirst } from "../src/lib/classify";
import { inferProductIntentSlug } from "../src/lib/product-intent.it";
import { SHELF_OVERRIDES } from "../src/lib/catalog-shelf-overrides";

type ClassifyCase = {
  kind: "classify";
  title: string;
  feed: string;
  expected: string;
};

type OverrideCase = {
  kind: "override";
  key: string;
  expected: string;
};

const CASES: Array<ClassifyCase | OverrideCase> = [
  { kind: "classify", title: "Uromexil Forte", feed: "Cystitis", expected: "cystitida" },
  { kind: "classify", title: "Uromexil Forte", feed: "Prostatitis", expected: "prostata" },
  { kind: "classify", title: "Uromexil Forte", feed: "Potency", expected: "potence" },
  { kind: "classify", title: "Pulsactive EU", feed: "Hypertension", expected: "krevni-tlak" },
  { kind: "classify", title: "Pulsactive", feed: "Hyperpotency", expected: "potence" },
  { kind: "classify", title: "Beauty Age", feed: "Enlargement", expected: "anti-aging" },
  { kind: "classify", title: "Showcase clothes", feed: "Shoes", expected: "obleceni" },
  { kind: "classify", title: "Parazicid", feed: "Паразиты, папилломы", expected: "paraziti" },
  { kind: "classify", title: "Verdexedil", feed: "Beauty", expected: "vypadavani-vlasu" },
  { kind: "classify", title: "Erectone Active +", feed: "Нутра: геморрой", expected: "potence" },
  { kind: "classify", title: "Proctonic", feed: "Hemorrhoids", expected: "intimate-comfort" },
  { kind: "classify", title: "RectoSave", feed: "Геморрой", expected: "intimate-comfort" },
  { kind: "override", key: "cpa_tl:12616", expected: "obleceni" },
  { kind: "override", key: "cpa_tl:13320", expected: "obleceni" },
  { kind: "override", key: "cpa_tl:9533", expected: "cystitida" },
];

let fail = 0;

for (const c of CASES) {
  if (c.kind === "override") {
    const got = SHELF_OVERRIDES[c.key];
    if (got !== c.expected) {
      console.error(`FAIL override ${c.key}: got=${got ?? "null"} expected=${c.expected}`);
      fail += 1;
    } else {
      console.log(`OK   override ${c.key} → ${got}`);
    }
    continue;
  }

  const intent = inferProductIntentSlug(c.title);
  const classified = classifyTitleFirst(c.title, c.feed, "other");
  const ok = classified === c.expected;
  if (!ok) {
    console.error(
      `FAIL classify «${c.title}» + «${c.feed}»: intent=${intent ?? "null"} classified=${classified} expected=${c.expected}`,
    );
    fail += 1;
  } else {
    console.log(`OK   «${c.title}» + «${c.feed}» → ${classified}`);
  }
}

if (fail) {
  console.error(`\nsmoke-product-intent: ${fail} failure(s)`);
  process.exit(1);
}

console.log("\nsmoke-product-intent: OK");
