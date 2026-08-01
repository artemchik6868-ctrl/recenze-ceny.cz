import { useI18n } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { reviewAvatarAlt } from "@/lib/seo-alt";
import type { Review } from "@/lib/reviews";

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-0.5 text-cta" title={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "opacity-100" : "opacity-25"} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const T = useI18n();
  const lang = useLang();
  if (reviews.length === 0) return null;

  const avgRating =
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  const avgCs = avgRating.toFixed(1).replace(".", ",");

  return (
    <section id="reviews" className="mx-auto mt-16 max-w-3xl">
      <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
        {T.reviews.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {T.reviews.avgLabel(avgCs, reviews.length)}
        <span className="mx-2 text-border">·</span>
        {T.reviews.sub}
      </p>

      <div className="mt-8 space-y-4">
        {reviews.map((r, i) => (
          <article
            key={i}
            className="rounded-[10px] border border-border bg-card p-5"
          >
            <div className="flex items-start gap-4">
              {r.photo ? (
                <img
                  src={r.photo}
                  alt={reviewAvatarAlt(lang, r.name, r.city)}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  role="img"
                  aria-label={reviewAvatarAlt(lang, r.name, r.city)}
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-stone font-display text-lg font-semibold text-primary"
                >
                  {r.name.trim().charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-foreground">{r.name}</span>
                  {r.verified && (
                    <span className="text-[11px] font-medium text-success">
                      {T.reviews.verified}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {r.city} · {T.reviews.age} {r.age}
                </div>
                <div className="mt-2">
                  <Stars rating={r.rating} label={T.reviews.stars(r.rating)} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">{T.reviews.timeAgo(r.daysAgo)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
