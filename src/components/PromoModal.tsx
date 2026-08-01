import { useEffect, useState } from "react";
import { LeadForm } from "@/components/LeadForm";
import { OfferImage } from "@/components/OfferImage";
import type { Offer } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { promoModalAlt } from "@/lib/seo-alt";
import { offerDisplayTitle } from "@/lib/offer-display";
import { formatDisplayPrice } from "@/lib/market";
import { useLang } from "@/lib/lang";

const STORAGE_KEY = "qw_promo_shown";
const DELAY_MS = 15000;

export function PromoModal({ offer }: { offer: Offer }) {
  const [open, setOpen] = useState(false);
  const T = useI18n();
  const lang = useLang();
  const displayTitle = offerDisplayTitle(offer);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore
    }
    const t = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, [offer.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 p-0 backdrop-blur-md md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-card shadow-[var(--shadow-elevated)] md:rounded-3xl">
        <button
          type="button"
          aria-label={T.product.promoModal.close}
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-secondary hover:text-foreground"
        >
          ✕
        </button>

        <div className="relative overflow-hidden bg-primary px-5 pb-5 pt-6 text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cta-foreground" />
            {T.product.promoModal.badge}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <OfferImage
              offer={offer}
              alt={promoModalAlt(offer, lang)}
              width={88}
              height={88}
              loading="lazy"
              decoding="async"
              className="h-22 w-22 shrink-0 rounded-2xl border-2 border-background/30 bg-background/10 object-cover shadow-lg"
              style={{ width: 88, height: 88 }}
            />
            <div className="min-w-0 flex-1">
              <h2
                id="promo-modal-title"
                className="font-display text-lg leading-tight text-balance"
              >
                {displayTitle}
              </h2>
              <div className="mt-1.5 font-display text-2xl leading-none">
                {offer.priceEUR != null
                  ? formatDisplayPrice(offer.priceEUR)
                  : T.product.onRequest}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wide opacity-85">
                {offer.priceEUR == null
                  ? T.product.onRequest
                  : offer.priceEUR === 0
                    ? T.product.coursePrice
                    : T.product.inclTaxes}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-snug opacity-95">
            {T.product.promoModal.lead}
          </p>
        </div>

        <div className="px-5 py-5">
          <LeadForm offerId={offer.id} source={offer.source} compact />
        </div>
      </div>
    </div>
  );
}
