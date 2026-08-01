/**
 * Smoke tests for DE locale leak detection.
 * Usage: npx tsx scripts/test-locale-leak-de.mjs
 */
import {
  hasPolishLocaleLeak,
  hasCyrillicLocaleLeak,
  hasNonGermanLocaleLeak,
  hasNonGermanProductContent,
  hasPolishDeliveryLeak,
} from "../src/lib/locale-leak-de.ts";
import { applyStaticCyrillicTailDe, cyrillicTailToDe } from "../src/lib/cyrillic-tail-de.ts";
import { buildCanonicalHeadline, resolveHeadlineBrand } from "../src/lib/brand-clean.ts";

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL ${msg}`);
    failed += 1;
  } else {
    console.log(`OK  ${msg}`);
  }
}

assert(hasPolishLocaleLeak("Veniselle — krem na żylaki"), "detects Polish diacritics in H1");
assert(hasPolishLocaleLeak("Dostawa i płatność w Polsce"), "detects Polish delivery phrase");
assert(!hasPolishLocaleLeak("Veniselle — Krampfadern-Mittel"), "accepts German H1");

assert(
  hasCyrillicLocaleLeak("Levoran Diet Gummies - мармелад для похудения"),
  "detects Cyrillic in Levoran H1",
);
assert(!hasCyrillicLocaleLeak("Levoran Diet Gummies — Gummibärchen"), "accepts German Levoran H1");

assert(
  cyrillicTailToDe("мармелад для похудения") === "Gummibärchen zur Gewichtsregulierung",
  "static map: мармелад для похудения",
);

const levoranHeadline = buildCanonicalHeadline({
  brand: "Levoran Diet Gummies",
  tail: "мармелад для похудения",
  lang: "cs",
  categorySlug: "hubnuti",
  formKind: "capsules",
  rawTitle: "Levoran Diet Gummies - мармелад для похудения",
});
assert(!hasCyrillicLocaleLeak(levoranHeadline), "buildCanonicalHeadline strips Cyrillic tail");
assert(levoranHeadline.includes("Gummibärchen"), "buildCanonicalHeadline maps gummy tail");

const contaminatedBrand = "Levoran Diet Gummies - мармелад для похудения";
const feedTitle = "Levoran Diet Gummies - мармелад для похудения";
assert(
  resolveHeadlineBrand(contaminatedBrand, feedTitle) === "Levoran Diet Gummies",
  "resolveHeadlineBrand strips Cyrillic from contaminated brand",
);
const levoranFromBadBrand = buildCanonicalHeadline({
  brand: contaminatedBrand,
  tail: "",
  lang: "cs",
  categorySlug: "hubnuti",
  formKind: "capsules",
  rawTitle: feedTitle,
});
assert(
  !hasCyrillicLocaleLeak(
    buildCanonicalHeadline({
      brand: resolveHeadlineBrand(contaminatedBrand, feedTitle),
      tail: "",
      lang: "cs",
      categorySlug: "hubnuti",
      formKind: "capsules",
      rawTitle: feedTitle,
    }),
  ),
  "headline clean when brand resolved from feed title",
);

assert(
  hasNonGermanProductContent({
    display_title: "Veniselle — Krampfadern-Mittel",
    description_html: "<h2>Przeznaczenie i forma produktu</h2>",
    faq: [],
  }),
  "detects Polish body",
);

assert(
  hasNonGermanLocaleLeak(applyStaticCyrillicTailDe("мармелад")) === false ||
    !hasCyrillicLocaleLeak(applyStaticCyrillicTailDe("мармелад для похудения")),
  "applyStaticCyrillicTailDe resolves gummy phrase",
);

assert(
  hasPolishDeliveryLeak("Dostawa i płatność w Polsce — Warszawa, Kraków"),
  "detects Polish delivery without DE cities",
);
assert(
  !hasPolishDeliveryLeak("Lieferung in ganz Deutschland — Praha, München"),
  "accepts German delivery cities",
);

if (failed) process.exit(1);
console.log("\nlocale-leak-de tests OK");
