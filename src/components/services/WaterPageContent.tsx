import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";

export function WaterSeoContent() {
  const S = useI18n().services.water.seo;
  const href = useHref();

  return (
    <article className="mt-14 max-w-3xl border-t border-border pt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h1}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p1}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-prose">
        {S.items1.map((item) => (
          <li key={item.label}>
            <strong className="text-foreground">{item.label}</strong>
            {item.text}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h2}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p2}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-prose">
        {S.items2.map((item) => (
          <li key={item.label}>
            <strong className="text-foreground">{item.label}</strong>
            {item.text}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h3}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p3}</p>
      <p className="mt-4 text-base leading-relaxed text-prose">
        {S.p4Before}
        <Link
          to={href("/detox")}
          className="cta-underline font-semibold text-cta"
        >
          {S.p4Link}
        </Link>
        {S.p4After}
      </p>
    </article>
  );
}

export function WaterFaq() {
  const W = useI18n().services.water;
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {W.faqH}
      </h2>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {W.faq.map((item) => (
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
