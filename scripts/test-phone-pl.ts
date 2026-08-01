/**
 * Unit tests for Poland phone normalization and validation.
 * Usage: npx tsx scripts/test-phone-pl.ts
 */
import {
  parsePhonePL,
  phoneNationalPL,
  isValidPhonePLDigits,
  formatPhoneE164PL,
  PL_PHONE_E164_RE,
} from "../src/lib/phone.pl";

let fail = 0;

function assert(label: string, cond: boolean) {
  if (!cond) {
    console.error(`FAIL ${label}`);
    fail++;
  } else {
    console.log(`OK   ${label}`);
  }
}

assert("parse +48 512 345 678", parsePhonePL("+48 512 345 678") === "+48512345678");
assert("parse 512345678", parsePhonePL("512345678") === "+48512345678");
assert("parse 0512345678 (leading 0)", parsePhonePL("0512345678") === "+48512345678");
assert("parse 48512345678 (country without +)", parsePhonePL("48512345678") === "+48512345678");
assert("reject 10 digits", parsePhonePL("5123456789") === null);
assert("reject 8 digits", parsePhonePL("51234567") === null);
assert("reject leading 0 NSN", parsePhonePL("012345678") === null);

assert("national from E164", phoneNationalPL("+48512345678") === "512345678");
assert("national strips 48 without +", phoneNationalPL("48512345678") === "512345678");
assert("national strips leading 0", phoneNationalPL("0512345678") === "512345678");

assert("valid mobile prefix 50", isValidPhonePLDigits("501234567"));
assert("valid mobile prefix 66", isValidPhonePLDigits("661234567"));
assert("valid landline 12", isValidPhonePLDigits("123456789"));
assert("invalid 0 prefix", !isValidPhonePLDigits("012345678"));

assert("E164 format", formatPhoneE164PL("512345678") === "+48512345678");
assert("E164 regex", PL_PHONE_E164_RE.test("+48512345678"));
assert("E164 regex rejects SI", !PL_PHONE_E164_RE.test("+38631234567"));

if (fail) {
  console.error(`\ntest-phone-pl: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\ntest-phone-pl: OK");
