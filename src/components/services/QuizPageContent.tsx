import { useI18n } from "@/lib/i18n";

export function QuizIntroCallout() {
  const Q = useI18n().services.quiz;
  return (
    <aside className="mb-8 rounded-[10px] border border-dashed border-primary/50 bg-card p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold text-primary md:text-xl">{Q.quizIntroH}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-prose">{Q.quizIntro}</p>
    </aside>
  );
}

export function QuizSeoContent() {
  const S = useI18n().services.quiz.seo;

  return (
    <article className="mt-14 max-w-3xl border-t border-border pt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h1}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p1}</p>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p2}</p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {S.h2}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-prose">{S.p3}</p>

      <div className="mt-5 overflow-x-auto rounded-[10px] border border-border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="bg-stone text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Účinek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {S.rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 align-top font-semibold text-foreground">{row.name}</td>
                <td className="px-4 py-3 align-top leading-relaxed text-prose">{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-base leading-relaxed text-prose">{S.p4}</p>

      <aside className="mt-8 rounded-[10px] border border-border bg-stone px-5 py-4 md:px-6 md:py-5">
        <h3 className="font-display text-lg font-semibold text-foreground">{S.safetyH}</h3>
        <p className="mt-2 text-sm leading-relaxed text-prose">{S.safety}</p>
      </aside>
    </article>
  );
}
