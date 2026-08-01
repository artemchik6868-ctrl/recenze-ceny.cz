import { lazy, Suspense, useEffect, useState } from "react";

const LeadForm = lazy(() =>
  import("@/components/LeadForm").then((m) => ({ default: m.LeadForm })),
);

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-10 animate-pulse rounded-[2px] bg-secondary" />
      <div className="h-12 animate-pulse rounded-[2px] bg-secondary" />
      <div className="h-11 animate-pulse rounded-[2px] bg-primary/20" />
    </div>
  );
}

export function LazyLeadForm({
  offerId,
  source = "cpa_tl",
  priceEUR = null,
}: {
  offerId?: number;
  source?: "cpa_tl" | "kma" | "m1_top" | "cpagetti" | "adcombo" | "shakes";
  priceEUR?: number | null;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#lead") {
      setReady(true);
      return;
    }
    const arm = () => setReady(true);
    const id =
      typeof requestIdleCallback === "function"
        ? requestIdleCallback(arm, { timeout: 2000 })
        : window.setTimeout(arm, 1);
    return () => {
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);

  if (!ready) return <FormSkeleton />;

  return (
    <Suspense fallback={<FormSkeleton />}>
      <LeadForm offerId={offerId} source={source} priceEUR={priceEUR} />
    </Suspense>
  );
}
