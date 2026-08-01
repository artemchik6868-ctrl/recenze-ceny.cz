import { Link } from "@tanstack/react-router";
import { Calculator, Droplets, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { WEIGHT_TOOLS, type WeightToolId } from "@/lib/services/weight-tools";
import { cn } from "@/lib/utils";

const ICONS: Record<WeightToolId, typeof Calculator> = {
  calories: Calculator,
  quiz: Sparkles,
  water: Droplets,
};

export function WeightToolsPromo({
  variant = "pdp",
  className,
}: {
  variant?: "pdp" | "category";
  className?: string;
}) {
  const T = useI18n();
  const href = useHref();
  const P = T.services.promo;

  const benefits: Record<WeightToolId, string> = {
    calories: P.caloriesBenefit,
    quiz: P.quizBenefit,
    water: P.waterBenefit,
  };

  const titles: Record<WeightToolId, string> = {
    calories: T.services.calories.shortTitle,
    quiz: T.services.quiz.shortTitle,
    water: T.services.water.shortTitle,
  };

  if (variant === "category") {
    return (
      <div className={cn("mt-4", className)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {P.title}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {WEIGHT_TOOLS.map((tool) => (
            <li key={tool.id}>
              <Link to={href(tool.path)} className="cta-underline font-semibold text-cta">
                {titles[tool.id]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className={cn("cv-auto mx-auto mt-16 max-w-3xl", className)}>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {P.title}
      </h2>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {WEIGHT_TOOLS.map((tool) => {
          const Icon = ICONS[tool.id];
          return (
            <li key={tool.id}>
              <Link
                to={href(tool.path)}
                className="group flex h-full flex-col rounded-[10px] border border-border bg-stone p-4 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lift md:p-5"
              >
                <Icon
                  className="h-5 w-5 text-cta transition-transform group-hover:-translate-y-0.5"
                  aria-hidden
                />
                <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-foreground">
                  {titles[tool.id]}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {benefits[tool.id]}
                </p>
                <span className="cta-underline mt-4 text-sm font-semibold text-cta">{P.open}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
