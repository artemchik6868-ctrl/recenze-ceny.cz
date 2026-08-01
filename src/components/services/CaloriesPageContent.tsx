import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";

export function CaloriesSeoContent() {
  const S = useI18n().services.calories.seo;
  const href = useHref();

  return (
    <article className="mt-14 max-w-3xl border-t border-border pt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h1}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p1}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-prose">
        <li>
          <strong className="text-foreground">{S.bmrLabel}</strong>
          {S.bmrText}
        </li>
        <li>
          <strong className="text-foreground">{S.amrLabel}</strong>
          {S.amrText}
        </li>
      </ul>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p2}</p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h2}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p3}</p>
      <aside className="mt-5 rounded-[10px] border border-border bg-stone px-5 py-4 text-sm leading-relaxed text-foreground md:px-6">
        <p className="font-semibold text-foreground">{S.tipLabel}</p>
        <p className="mt-1">{S.tipText}</p>
      </aside>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p4}</p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h3}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p5}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-prose">
        <li>
          <strong className="text-foreground">{S.proteinLabel}</strong>
          {S.proteinText}
        </li>
        <li>
          <strong className="text-foreground">{S.fatLabel}</strong>
          {S.fatText}
        </li>
        <li>
          <strong className="text-foreground">{S.carbsLabel}</strong>
          {S.carbsText}
        </li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h4}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p6}</p>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p7}</p>

      <aside className="mt-8 rounded-[10px] border border-border bg-card p-6 text-center md:p-8">
        <p className="font-display text-lg font-semibold text-foreground">{S.ctaLead}</p>
        <Link
          to={href("/hubnuti")}
          className="mt-4 inline-flex rounded-[10px] bg-cta px-5 py-2.5 text-sm font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5"
        >
          {S.cta}
        </Link>
      </aside>
    </article>
  );
}

export function CaloriesFaq() {
  const C = useI18n().services.calories;
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {C.faqH}
      </h2>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {C.faq.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="cursor-pointer list-none font-display text-lg font-semibold text-foreground">
              {item.q}
            </summary>
            <p className="mt-3 text-[15px] leading-[1.7] text-prose">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
