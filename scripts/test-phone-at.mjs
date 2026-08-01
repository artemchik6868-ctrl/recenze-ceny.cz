/**
 * AT phone validation smoke tests (client + server regex alignment).
 * Usage: npm run test:phone-cz
 */
import {
  parsePhoneCS,
  isValidPhoneCSDigits,
  CZ_PHONE_E164_RE,
  normalizePhoneCSDigits,
} from "../src/lib/phone.hu.ts";

const valid = [
  { input: "664 1234567", e164: "+436641234567", digits: "6641234567" },
  { input: "676 1234567", e164: "+436761234567", digits: "6761234567" },
  { input: "660 1234567", e164: "+436601234567", digits: "6601234567" },
  { input: "+41 44 512 34 56", e164: "+43151221064", digits: "151221064" },
  { input: "1 512 21064", e164: "+43151221064", digits: "151221064" },
  { input: "1 2345678", e164: "+4312345678", digits: "12345678" },
  { input: "0664 1234567", e164: "+436641234567", digits: "6641234567" },
];

const invalid = [
  "+49 152 12345678",
  "15212345678",
  "316 1234567",
  "123456789",
  "664123",
  "66412345678901",
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
  console.log(`OK  invalid "${input}" → rejected`);
}

if (failed) process.exit(1);
console.log("\nphone-at tests OK");
