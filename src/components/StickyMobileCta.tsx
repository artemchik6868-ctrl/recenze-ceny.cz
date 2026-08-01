import type { Offer } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { deliveryEta } from "@/lib/delivery-eta";
import { formatDisplayPrice } from "@/lib/market";
import { useLang } from "@/lib/lang";

export function StickyMobileCta({ offer, onClick }: { offer: Offer; onClick: () => void }) {
  const T = useI18n();
  const lang = useLang();
  const priceState: "price" | "free" | "request" =
    offer.priceEUR == null ? "request" : offer.priceEUR === 0 ? "free" : "price";
  const eta = deliveryEta(lang);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {priceState === "price" && (
            <div className="font-display text-xl leading-tight text-primary">
              {formatDisplayPrice(offer.priceEUR ?? 0)}
            </div>
          )}
          {priceState === "free" && (
            <>
              <div className="font-display text-xl leading-tight text-primary">{formatDisplayPrice(0)}</div>
              <div className="text-[11px] italic text-muted-foreground">{T.product.coursePrice}</div>
            </>
          )}
          {priceState === "request" && (
            <div className="text-sm text-muted-foreground">{T.product.onRequest}</div>
          )}
          <div className="truncate text-[11px] font-medium text-[color:var(--success)]">
            {eta.short}
          </div>
        </div>
        <button
          onClick={onClick}
          className="inline-flex flex-1 items-center justify-center rounded-[10px] bg-cta px-5 py-3 text-sm font-semibold text-cta-foreground shadow-cta"
        >
          {T.product.stickyCta} →
        </button>
      </div>
    </div>
  );
}
