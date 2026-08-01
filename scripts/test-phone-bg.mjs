/** Czech Republic phone tests — +420 mobile validation. */
import {
  parsePhoneCS,
  formatPhoneE164CS,
  isValidPhoneCSDigits,
  normalizePhoneCSDigits,
} from "../src/lib/phone.hu.ts";

const cases = [
  // 87x / 88x / 89x — MNO
  ["871234567", true],
  ["0887123456", true],
  ["+420871234567", true],
  ["359871234567", true],
  ["887123456", true],
  ["0887123456", true],
  ["891234567", true],
  ["0891234567", true],
  // 98x / 99x — MVNO & mobile
  ["981234567", true],
  ["0981234567", true],
  ["980123456", true],
  ["0980123456", true],
  ["984123456", true],
  ["0984123456", true],
  ["991234567", true],
  ["0991234567", true],
  // invalid prefixes / types
  ["123456789", false],
  ["712345678", false],
  ["812345678", false],
  ["901234567", false],
  ["87123456", false],
  ["8712345678", false],
];

let fail = 0;
for (const [input, expectValid] of cases) {
  const digits = normalizePhoneCSDigits(input);
  const valid = isValidPhoneCSDigits(digits);
  const parsed = parsePhoneCS(input);
  const parsedOk = expectValid ? parsed?.startsWith("+420") : !parsed;
  if (!parsedOk) {
    console.log("FAIL parse", input, { parsed, expectValid });
    fail += 1;
    continue;
  }
  if (expectValid && !valid) {
    console.log("FAIL normalize", input, { digits, valid, expectValid });
    fail += 1;
    continue;
  }
  console.log("OK ", input);
}

if (isValidPhoneCSDigits(normalizePhoneCSDigits("8712345678"))) {
  console.log("OK normalize truncates overlong paste to 9 digits");
} else {
  console.log("FAIL normalize truncates overlong paste");
  fail += 1;
}

if (formatPhoneE164CS("871234567") !== "+420871234567") {
  console.log("FAIL formatPhoneE164CS");
  fail += 1;
}

if (fail) process.exit(1);
console.log("\ntest-phone-bg: OK", formatPhoneE164CS("871234567"));
