/** Czech phone tests — +420 mobile validation (ČTÚ ranges). */
import {
  parsePhoneCS,
  formatPhoneE164CS,
  isValidPhoneCSDigits,
  normalizePhoneCSDigits,
} from "../src/lib/phone.cs.ts";

const cases = [
  // valid — normalization
  ["601234567", true, "+420601234567"],
  ["0601234567", true, "+420601234567"],
  ["+420601234567", true, "+420601234567"],
  ["420601234567", true, "+420601234567"],
  ["702123456", true, "+420702123456"],
  ["0771234567", true, "+420771234567"],
  // valid — ČTÚ ranges
  ["612345678", true, "+420612345678"],
  ["721234567", true, "+420721234567"],
  ["731234567", true, "+420731234567"],
  ["771234567", true, "+420771234567"],
  ["790012345", true, "+420790012345"],
  ["799912345", true, "+420799912345"],
  // invalid — reserved / wrong type
  ["701234567", false, null],
  ["609123456", false, null],
  ["615123456", false, null],
  ["650123456", false, null],
  ["700123456", false, null],
  ["741234567", false, null],
  ["781234567", false, null],
  ["123456789", false, null],
  ["501234567", false, null],
  ["60123456", false, null],
];

let fail = 0;
for (const [input, expectValid, expectE164] of cases) {
  const digits = normalizePhoneCSDigits(input);
  const valid = isValidPhoneCSDigits(digits);
  const parsed = parsePhoneCS(input);
  const parsedOk = expectValid ? parsed?.e164 === expectE164 : parsed === null;
  if (valid !== expectValid || !parsedOk) {
    console.log(`FAIL ${input} valid=${valid} parsed=${parsed?.e164 ?? "null"}`);
    fail += 1;
  } else {
    console.log(`OK ${input} → ${expectValid ? formatPhoneE164CS(digits) : "rejected"}`);
  }
}

if (fail) {
  console.log(`\ntest-phone-cz: ${fail} failure(s)`);
  process.exit(1);
}
console.log("\ntest-phone-cz: OK");
