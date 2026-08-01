/**
 * CH phone validation smoke tests (client + server regex alignment).
 * Usage: npm run test:phone-cz
 */
import {
  parsePhoneCS,
  isValidPhoneCSDigits,
  CZ_PHONE_E164_RE,
  normalizePhoneCSDigits,
} from "../src/lib/phone.hu.ts";

const valid = [
  { input: "79 123 45 67", e164: "+41791234567", digits: "791234567" },
  { input: "79 384 56 12", e164: "+41793845612", digits: "793845612" },
  { input: "76 123 45 67", e164: "+41761234567", digits: "761234567" },
  { input: "78 123 45 67", e164: "+41781234567", digits: "781234567" },
  { input: "74 123 45 67", e164: "+41741234567", digits: "741234567" },
  { input: "+420 21 345 67 89", e164: "+41793845612", digits: "793845612" },
  { input: "079 123 45 67", e164: "+41791234567", digits: "791234567" },
];

const invalid = [
  "+43 664 1234567",
  "+49 152 12345678",
  "6641234567",
  "44 221 89 47",
  "442218947",
  "123456789",
  "79123",
  "79123456789",
  "+48 501 234 567",
  "abc",
  "",
];

let failed = 0;

function fail(msg) {
  console.error(`FAIL ${msg}`);
  failed += 1;
}

for (const { input, e164, digits } of valid) {
  const parsed = parsePhoneCS(input);
  if (parsed !== e164) {
    fail(`parsePhoneCS("${input}") → ${parsed} (expected ${e164})`);
    continue;
  }
  if (!CZ_PHONE_E164_RE.test(parsed)) {
    fail(`CZ_PHONE_E164_RE rejected valid ${parsed}`);
    continue;
  }
  const norm = normalizePhoneCSDigits(input);
  if (norm !== digits) {
    fail(`normalizePhoneCSDigits("${input}") → ${norm} (expected ${digits})`);
    continue;
  }
  if (!isValidPhoneCSDigits(norm)) {
    fail(`isValidPhoneCSDigits rejected valid ${norm}`);
    continue;
  }
  console.log(`OK  valid "${input}" → ${parsed}`);
}

for (const input of invalid) {
  const parsed = parsePhoneCS(input);
  if (parsed !== null) {
    fail(`parsePhoneCS("${input}") should be null, got ${parsed}`);
    continue;
  }
  console.log(`OK  invalid "${input}"`);
}

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\ntest-phone-ch: OK");
