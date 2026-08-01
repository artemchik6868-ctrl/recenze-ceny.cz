import { lazy, Suspense, useEffect, useState } from "react";
import type { Offer } from "@/lib/types";

const StickyMobileCta = lazy(() =>
  import("@/components/StickyMobileCta").then((m) => ({ default: m.StickyMobileCta })),
);
const MobileLeadSheet = lazy(() =>
  import("@/components/MobileLeadSheet").then((m) => ({ default: m.MobileLeadSheet })),
);

export function LazyMobileChrome({
  offer,
  displayTitle,
  sheetOpen,
  onOpenChange,
  onLead,
}: {
  offer: Offer;
  displayTitle: string;
  sheetOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLead: () => void;
}) {
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const arm = () => setCtaReady(true);
    const id =
      typeof requestIdleCallback === "function"
        ? requestIdleCallback(arm, { timeout: 1500 })
        : window.setTimeout(arm, 1);
    return () => {
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);

  return (
    <>
      {ctaReady ? (
        <Suspense fallback={null}>
          <StickyMobileCta offer={offer} onClick={onLead} />
        </Suspense>
      ) : null}
      {sheetOpen ? (
        <Suspense fallback={null}>
          <MobileLeadSheet
            open={sheetOpen}
            onOpenChange={onOpenChange}
            offerId={offer.id}
            source={offer.source}
            imageOffer={{ image: offer.image, formKind: offer.formKind }}
            title={displayTitle}
            priceEUR={offer.priceEUR}
          />
        </Suspense>
      ) : null}
    </>
  );
}
