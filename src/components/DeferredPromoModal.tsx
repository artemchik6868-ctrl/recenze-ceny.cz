import { lazy, Suspense, useEffect, useState } from "react";
import type { Offer } from "@/lib/types";

const PromoModal = lazy(() =>
  import("@/components/PromoModal").then((m) => ({ default: m.PromoModal })),
);

const DELAY_MS = 8000;

export function DeferredPromoModal({ offer }: { offer: Offer }) {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setMount(true);
      cleanup();
    };
    const onScroll = () => {
      if (window.scrollY > 400) arm();
    };
    const t = window.setTimeout(arm, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, [offer.id]);

  if (!mount) return null;
  return (
    <Suspense fallback={null}>
      <PromoModal offer={offer} />
    </Suspense>
  );
}
