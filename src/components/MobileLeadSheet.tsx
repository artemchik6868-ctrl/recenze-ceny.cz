import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeadForm } from "@/components/LeadForm";
import { OfferImage } from "@/components/OfferImage";
import type { ImageOffer } from "@/lib/image-proxy";
import { useI18n } from "@/lib/i18n";
import { formatDisplayPrice } from "@/lib/market";

export function MobileLeadSheet({
  open,
  onOpenChange,
  offerId,
  source,
  imageOffer,
  title,
  priceEUR,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offerId: number;
  source: "cpa_tl" | "kma" | "m1_top" | "cpagetti" | "adcombo" | "shakes" | "terraleads";
  imageOffer: ImageOffer;
  title: string;
  priceEUR: number | null;
}) {
  const T = useI18n();
  const priceState: "price" | "free" | "request" =
    priceEUR == null ? "request" : priceEUR === 0 ? "free" : "price";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-t-2 border-primary/20 px-5 pb-8 pt-6"
      >
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
            <OfferImage
              offer={imageOffer}
              alt={title}
              className="h-full w-full object-contain p-1"
              loading="eager"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm leading-tight text-foreground">
              {title}
            </div>
            <div className="mt-1 font-display text-lg text-primary">
              {priceState === "price"
                ? formatDisplayPrice(priceEUR!)
                : priceState === "free"
                  ? formatDisplayPrice(0)
                  : T.product.onRequest}
            </div>
            {priceState !== "price" && (
              <div className="text-[10px] text-muted-foreground">
                {priceState === "free" ? T.product.coursePrice : T.product.onRequest}
              </div>
            )}
          </div>
        </div>

        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="font-display text-xl leading-tight text-foreground">
            {T.product.quickOrder}
          </SheetTitle>
        </SheetHeader>
        <LeadForm offerId={offerId} source={source} compact priceEUR={priceEUR} />
      </SheetContent>
    </Sheet>
  );
}
