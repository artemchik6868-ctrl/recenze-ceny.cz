/** Czech Republic phone tests — +420 mobile validation. */
import {
  parsePhoneCS,
  formatPhoneE164CS,
  isValidPhoneCSDigits,
  normalizePhoneCSDigits,
} from "../src/lib/phone.hu.ts";

const cases = [
  // 20 — Yettel
  ["201234567", true, "+420201234567"],
  ["06201234567", true, "+420201234567"],
  ["+420201234567", true, "+420201234567"],
  ["36201234567", true, "+420201234567"],
  // 30 — Magyar Telekom
  ["301234567", true, "+420301234567"],
  ["06301234567", true, "+420301234567"],
  ["+420 30 123 4567", true, "+420301234567"],
  // 31 — Digi Mobile
  ["311234567", true, "+420311234567"],
  ["06311234567", true, "+420311234567"],
  // 50 — mobile
  ["501234567", true, "+420501234567"],
  ["06501234567", true, "+420501234567"],
  // 70 — Vodafone
  ["701234567", true, "+420701234567"],
  ["06701234567", true, "+420701234567"],
  ["+420 70 123 4567", true, "+420701234567"],
  // invalid — landline Praha
  ["12345678", false, null],
  ["0612345678", false, null],
  ["+42012345678", false, null],
  // invalid — geographic 72 (Pécs)
  ["721234567", false, null],
  ["06721234567", false, null],
  // invalid — BG fork prefixes
  ["871234567", false, null],
  ["981234567", false, null],
  // invalid — wrong length
  ["20123456", false, null],
  ["2012345678", true, "+420201234567"],
];

let fail = 0;
for (const [input, expectValid, expectE164] of cases) {
  const digits = normalizePhoneCSDigits(input);
  const valid = isValidPhoneCSDigits(digits);
  const parsed = parsePhoneCS(input);
  const parsedOk = expectValid
    ? parsed?.e164 === expectE164
    : parsed === null;
  if (!parsedOk) {
    console.log("FAIL parse", input, { parsed, expectValid, expectE164 });
    fail += 1;
    continue;
  }
  if (valid !== expectValid) {
    console.log("FAIL valid", input, { digits, valid, expectValid });
    fail += 1;
    continue;
  }
  console.log("OK ", input);
}

if (isValidPhoneCSDigits(normalizePhoneCSDigits("20123456789"))) {
  console.log("OK normalize truncates overlong paste to 9 digits");
} else {
  console.log("FAIL normalize truncates overlong paste");
  fail += 1;
}

if (formatPhoneE164CS("201234567") !== "+420201234567") {
  console.log("FAIL formatPhoneE164CS");
  fail += 1;
}

if (fail) process.exit(1);
console.log("\ntest-phone-hu: OK", formatPhoneE164CS("201234567"));
