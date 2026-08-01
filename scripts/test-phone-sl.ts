/**
 * Quick sanity checks for SI phone normalization.
 * Usage: npx tsx scripts/test-phone-sl.ts
 */
import {
  formatPhoneE164SI,
  isValidPhoneSIDigits,
  normalizePhoneSIDigits,
  parsePhoneSI,
} from "../src/lib/phone.sl";

type Case = { label: string; input: string; digits?: string; e164?: string; valid?: boolean };

const cases: Case[] = [
  { label: "mobile 8 digits", input: "40123456", digits: "40123456", e164: "+38640123456", valid: true },
  { label: "Ljubljana landline", input: "18886478", digits: "18886478", e164: "+38618886478", valid: true },
  { label: "paste with leading 0", input: "040123456", digits: "40123456", e164: "+38640123456", valid: true },
  { label: "paste with +386", input: "+38640123456", digits: "40123456", e164: "+38640123456", valid: true },
  { label: "9 digits invalid", input: "401234567", valid: false },
  { label: "E.164 never +34 from valid digits", input: "40123456", e164: "+38640123456", valid: true },
];

let fail = 0;
for (const c of cases) {
  const digits = normalizePhoneSIDigits(c.input);
  const valid = isValidPhoneSIDigits(digits) && parsePhoneSI(c.input) !== null;
  const e164 = parsePhoneSI(c.input);
  const ok =
    (c.digits === undefined || digits === c.digits) &&
    (c.valid === undefined || valid === c.valid) &&
    (c.e164 === undefined || e164 === c.e164);
  if (!ok) {
    fail += 1;
    console.log(`FAIL ${c.label}: digits=${digits} valid=${valid} e164=${e164}`);
  } else {
    console.log(`OK   ${c.label}`);
  }
}

if (formatPhoneE164SI("40123456").includes("+34")) {
  fail += 1;
  console.log("FAIL regression: E.164 contains +34");
}

console.log(fail ? `\n${fail} failed` : "\nAll phone SL checks passed");
process.exit(fail ? 1 : 0);
