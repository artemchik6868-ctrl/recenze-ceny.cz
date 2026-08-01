import { Link } from "@tanstack/react-router";
import expertPhoto from "@/assets/medical-expert.jpg";
import { useI18n } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { useHref } from "@/lib/lang-link";
import { expertPhotoAlt } from "@/lib/seo-alt";

const EXPERIENCE_YEARS = 18;

type Props = {
  opinion: string;
};

export function ProductExpertOpinion({ opinion }: Props) {
  const T = useI18n();
  const lang = useLang();
  const href = useHref();
  const M = T.medicalExpert;
  const paragraphs = opinion
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="cv-auto mx-auto mt-16 max-w-3xl border-y border-border py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cta">
        {T.product.expertOpinionEyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {T.product.expertOpinionH}
      </h2>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          src={expertPhoto}
          alt={expertPhotoAlt(lang, M.name, M.title)}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="h-20 w-20 shrink-0 object-cover sm:h-24 sm:w-24"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {M.eyebrow}
          </p>
          <p className="mt-1.5 font-display text-lg font-semibold text-foreground md:text-xl">{M.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {M.title} · {M.experienceLabel(EXPERIENCE_YEARS)} · {M.city}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{M.regNo}</p>
        </div>
      </div>

      <blockquote className="mt-8 border-l-2 border-cta pl-5 md:pl-6">
        <div className="space-y-4 text-[16px] leading-[1.8] text-foreground md:text-[17px]">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>
      </blockquote>

      <Link
        to={href("/medical-expert")}
        className="cta-underline mt-6 inline-block text-sm font-semibold text-cta"
      >
        {T.product.expertProfileLink}
      </Link>
    </section>
  );
}
