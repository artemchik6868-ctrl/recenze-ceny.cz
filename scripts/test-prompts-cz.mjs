/**
 * Smoke audit: CZ AI pipeline prompts must target Česká republika, not RO/DE/PL/HU.
 * Usage: npm run test:prompts-cz
 */
import {
  buildStep1Prompt,
  buildStep2Prompt,
  buildStep3Prompt,
  buildStep4Prompt,
  buildStep5Prompt,
  buildStep6Prompt,
  buildStep7Prompt,
  PIPELINE_SYSTEM,
  PIPELINE_STEP6_SYSTEM,
} from "../src/lib/ai-content-pipeline.cs.ts";
import { buildSeoIntentPromptBlock } from "../src/lib/seo-intent.cs.ts";

const FORBIDDEN = [
  /\bPlata la livrare\b/i,
  /\bîn România\b/i,
  /\bromână\b/i,
  /\bDeutschland\b/i,
  /\bZahlung bei Lieferung\b/i,
  /\bSchweiz\b/i,
  /\bPolsce\b/i,
  /\bUtánvétes fizetés\b/i,
  /\bKategóriák\b/i,
  /\bKezdőlap\b/i,
  /\bTisztítsd meg\b/i,
  /\bFordítsd le a H1\b/i,
  /\bVálassz EGY kategóriát\b/i,
  /\bdisplay_title_hu\b/,
  /\bkapszulák\b/i,
  /\btermék\b/i,
  /Scrie doar în română/i,
];

const REQUIRED_CZ = [
  /česky|cs-CZ|Česk/i,
  /doručení|České republice/i,
];

let failed = 0;

function check(label, text, requireCz = false) {
  const hits = FORBIDDEN.filter((re) => re.test(text));
  if (hits.length) {
    console.error(`FAIL ${label}: forbidden pattern — ${hits.map((r) => r.source).join(", ")}`);
    failed += 1;
    return;
  }
  if (requireCz && !REQUIRED_CZ.some((re) => re.test(text))) {
    console.error(`FAIL ${label}: missing CZ market markers`);
    failed += 1;
    return;
  }
  console.log(`OK   ${label}`);
}

check("PIPELINE_SYSTEM", PIPELINE_SYSTEM, true);
check("PIPELINE_STEP6_SYSTEM", PIPELINE_STEP6_SYSTEM, true);
check("step1", buildStep1Prompt("Test Product", "описание", null));
check("step2", buildStep2Prompt("Test — gel", null));
check("step3", buildStep3Prompt("Test Product", "feed context"));
check("step4", buildStep4Prompt("Test Product", { amount: 49, currency: "EUR" }), true);
check("step5", buildStep5Prompt("Test Product", { amount: 49, currency: "EUR" }), true);
check(
  "step6",
  buildStep6Prompt("Test Product", "feed context", { amount: 49, currency: "EUR" }, "klouby"),
  true,
);
check("step7", buildStep7Prompt("Test Product", "feed context"), true);
check("seo intent", buildSeoIntentPromptBlock("klouby", 42));

if (failed) {
  console.error(`\ntest-prompts-cz: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\ntest-prompts-cz: OK");
