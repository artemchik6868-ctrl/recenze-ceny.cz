import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/ProductCard";
import type { Offer } from "@/lib/types";
import {
  recommendOffers,
  tagsFromAnswers,
  type QuizActivity,
  type QuizAnswers,
  type QuizExtra,
  type QuizGoal,
  type QuizObstacle,
  type QuizTag,
} from "@/lib/services/quiz-scoring";
import { offerDisplayTitle } from "@/lib/offer-display";
import { cn } from "@/lib/utils";

const STEPS = 4;

type WhyKey = QuizTag;

function whyText(tips: Record<WhyKey, string>, matched: QuizTag[], fallback: string): string {
  if (matched.length) return tips[matched[0]!] ?? fallback;
  return fallback;
}

export function SupplementQuiz({ offers }: { offers: Offer[] }) {
  const T = useI18n();
  const Q = T.services.quiz;
  const href = useHref();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<QuizGoal | null>(null);
  const [obstacle, setObstacle] = useState<QuizObstacle | null>(null);
  const [extras, setExtras] = useState<QuizExtra[]>([]);
  const [activity, setActivity] = useState<QuizActivity | null>(null);
  const [done, setDone] = useState(false);

  const answers: QuizAnswers | null = useMemo(
    () => (goal && obstacle && activity ? { goal, obstacle, extras, activity } : null),
    [goal, obstacle, extras, activity],
  );

  const recommendations = useMemo(() => {
    if (!answers || !done) return [];
    return recommendOffers(offers, answers, 6);
  }, [answers, done, offers]);

  const tipTags = answers ? tagsFromAnswers(answers) : [];
  const tipBody = tipTags
    .slice(0, 3)
    .map((t) => Q.tipByTags[t])
    .filter(Boolean)
    .join(" ");

  function toggleExtra(id: QuizExtra) {
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function canNext(): boolean {
    if (step === 0) return goal != null;
    if (step === 1) return obstacle != null;
    if (step === 2) return true;
    if (step === 3) return activity != null;
    return false;
  }

  function goNext() {
    if (step < STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    setDone(true);
  }

  function restart() {
    setStep(0);
    setGoal(null);
    setObstacle(null);
    setExtras([]);
    setActivity(null);
    setDone(false);
  }

  if (done && answers) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {Q.resultTitle}
          </h2>
          <Button type="button" variant="outline" className="mt-4 rounded-[10px]" onClick={restart}>
            {Q.restart}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map(({ offer, matchedTags }) => (
            <div key={offer.slug} className="flex flex-col">
              <ProductCard offer={offer} />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{Q.whyLabel}: </span>
                {whyText(
                  Q.tipByTags,
                  matchedTags,
                  `Doporučeno k vašim odpovědím — ${offerDisplayTitle(offer)}.`,
                )}
              </p>
            </div>
          ))}
        </div>

        {!recommendations.length && (
          <p className="text-sm text-muted-foreground">
            <Link to={href("/hubnuti")} className="cta-underline text-cta">
              Kategorie kontrola hmotnosti
            </Link>
          </p>
        )}

        {tipBody && (
          <Accordion type="single" collapsible className="rounded-[10px] border border-border px-4">
            <AccordionItem value="tip" className="border-none">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                {Q.tipTitle}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {tipBody}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    );
  }

  const progress = ((step + 1) / STEPS) * 100;

  return (
    <div>
      <div className="rounded-[10px] border border-border bg-card p-5 md:p-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{Q.stepOf(step + 1, STEPS)}</span>
            <span>{Math.round(progress)} %</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 0 && (
          <StepChoices
            question={Q.goalQ}
            options={[
              { id: "lose_weight", label: Q.goalLose },
              { id: "edema", label: Q.goalEdema },
              { id: "appetite", label: Q.goalAppetite },
              { id: "metabolism", label: Q.goalMetabolism },
            ]}
            value={goal}
            onChange={setGoal}
          />
        )}

        {step === 1 && (
          <StepChoices
            question={Q.obstacleQ}
            options={[
              { id: "evening_stress", label: Q.obstacleStress },
              { id: "sedentary", label: Q.obstacleSedentary },
              { id: "fatigue", label: Q.obstacleFatigue },
              { id: "water_retention", label: Q.obstacleWater },
            ]}
            value={obstacle}
            onChange={setObstacle}
          />
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{Q.extrasQ}</h2>
            <div className="mt-4 space-y-2">
              {(
                [
                  { id: "skin_hair" as const, label: Q.extraSkin },
                  { id: "sleep" as const, label: Q.extraSleep },
                  { id: "detox" as const, label: Q.extraDetox },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleExtra(o.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[10px] border px-3 py-3 text-left text-sm transition-colors",
                    extras.includes(o.id)
                      ? "border-primary bg-stone"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px]",
                      extras.includes(o.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {extras.includes(o.id) ? "✓" : ""}
                  </span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <StepChoices
            question={Q.activityQ}
            options={[
              { id: "minimal", label: Q.activityMinimal },
              { id: "training", label: Q.activityTraining },
            ]}
            value={activity}
            onChange={setActivity}
          />
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="rounded-[10px]"
              onClick={() => setStep((s) => s - 1)}
            >
              {Q.back}
            </Button>
          )}
          <Button
            type="button"
            disabled={!canNext()}
            onClick={goNext}
            className="rounded-[10px] bg-cta text-cta-foreground hover:bg-cta/90"
          >
            {step === STEPS - 1 ? Q.finish : Q.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepChoices<T extends string>({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">{question}</h2>
      <div className="mt-4 space-y-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "flex w-full rounded-[10px] border px-3 py-3 text-left text-sm font-medium transition-colors",
              value === o.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
