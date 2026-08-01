// Per-SKU specifications block. Prefer vision image-facts when available;
// otherwise feed heuristics + seeded distributor/country variants.
import type { ReactNode } from "react";
import type { Offer } from "@/lib/types";
import type { Lang } from "@/lib/lang";
import type { CompactImageFacts } from "@/lib/image-facts";
import { detectProductFacts, factsForKind } from "@/lib/product-facts";
import { formLabelPl } from "@/lib/product-facts.cs-labels";
import { resolveSpecBrandRow } from "@/lib/brand-clean";
import { isYmylCategory } from "@/lib/niche-types";
import { specRowsFor } from "@/lib/pdp-variants";
import { useI18n } from "@/lib/i18n";
import { PDP_CONTENT_SLOT } from "@/lib/market";

type SpecRow = { label: string; value: ReactNode };

function formatDate(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat("cs-CZ", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

export function ProductSpecs({
  offer,
  lang,
  categoryName,
  displayTitle,
  imageFacts = null,
}: {
  offer: Offer;
  lang: Lang;
  categoryName: string;
  displayTitle: string;
  imageFacts?: CompactImageFacts | null;
}) {
  const T = useI18n();
  const kindFacts = factsForKind(offer.formKind);
  const fallbackFacts = kindFacts
    ? null
    : detectProductFacts(offer.title ?? "", offer.categoryName ?? "", "");
  const facts = kindFacts ?? fallbackFacts;
  const rawForm = facts ? formLabelPl(facts) : null;
  const kind = facts?.kind ?? "unknown";
  const formLabel =
    kind === "unknown" || kind === "generic_item" ? null : rawForm;
  const updated = formatDate(offer.contentGeneratedAt);
  const specVariant = specRowsFor(offer.categorySlug, offer.id);
  const s = T.product.specs;

  const brandRow = resolveSpecBrandRow(
    offer.brand,
    displayTitle,
    offer.formKind,
    PDP_CONTENT_SLOT,
  );
  const showMedicalReview = isYmylCategory(offer.categorySlug);
  const hasImage = Boolean(
    imageFacts &&
      (imageFacts.productType ||
        imageFacts.application ||
        imageFacts.releaseForm ||
        imageFacts.packaging ||
        imageFacts.detectedText ||
        imageFacts.briefDescription),
  );

  const rows: SpecRow[] = hasImage
    ? [
        ...(brandRow
          ? [
              {
                label:
                  brandRow.labelKey === "productName" ? s.productName : s.brand,
                value: brandRow.value,
              },
            ]
          : []),
        ...(imageFacts?.productType
          ? [{ label: s.productType, value: imageFacts.productType }]
          : []),
        ...(imageFacts?.application &&
        (imageFacts.application === "topical" || imageFacts.application === "oral")
          ? [
              {
                label: s.application,
                value:
                  imageFacts.application === "topical"
                    ? s.applicationTopical
                    : s.applicationOral,
              },
            ]
          : []),
        ...(imageFacts?.releaseForm
          ? [{ label: s.form, value: imageFacts.releaseForm }]
          : formLabel
            ? [{ label: s.form, value: formLabel }]
            : []),
        ...(imageFacts?.packaging
          ? [{ label: s.packaging, value: imageFacts.packaging }]
          : []),
        ...(imageFacts?.detectedText
          ? [{ label: s.detectedText, value: imageFacts.detectedText }]
          : []),
        ...(imageFacts?.briefDescription
          ? [{ label: s.briefDescription, value: imageFacts.briefDescription }]
          : []),
        { label: s.category, value: categoryName },
        ...(showMedicalReview ? [{ label: s.reviewed, value: s.reviewedBy }] : []),
        {
          label: s.updated,
          value: (
            <time
              dateTime={(offer.contentGeneratedAt ?? new Date().toISOString()).slice(0, 10)}
            >
              {updated}
            </time>
          ),
        },
      ]
    : [
        ...(brandRow
          ? [
              {
                label:
                  brandRow.labelKey === "productName" ? s.productName : s.brand,
                value: brandRow.value,
              },
            ]
          : []),
        ...(formLabel ? [{ label: s.form, value: formLabel }] : []),
        { label: s.category, value: categoryName },
        { label: specVariant.distribLabel, value: specVariant.distribValue },
        { label: specVariant.countryLabel, value: specVariant.countryValue },
        ...(showMedicalReview ? [{ label: s.reviewed, value: s.reviewedBy }] : []),
        {
          label: s.updated,
          value: (
            <time
              dateTime={(offer.contentGeneratedAt ?? new Date().toISOString()).slice(0, 10)}
            >
              {updated}
            </time>
          ),
        },
      ];

  return (
    <section className="cv-auto mt-12 rounded-[2px] border border-border bg-card p-6 md:p-8">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--brass)]">
        — {s.eyebrow}
      </div>
      <h2 className="mb-5 font-display text-2xl tracking-tight text-foreground md:text-3xl">
        {s.h}
      </h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className={i < rows.length - 1 ? "border-b border-border" : ""}
            >
              <th
                scope="row"
                className="w-[42%] py-3 pr-4 text-left align-top font-medium uppercase tracking-wider text-[10px] text-muted-foreground sm:w-[32%] sm:text-xs sm:normal-case sm:tracking-normal sm:font-normal"
              >
                {r.label}
              </th>
              <td className="py-3 align-top text-foreground">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
