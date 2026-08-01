import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  calculateCalories,
  validateCalorieInput,
  type ActivityLevel,
  type CalorieGoal,
  type CalorieResult,
  type Sex,
} from "@/lib/services/calories";
import { FieldError, SexToggle } from "./ServiceFormBits";
import { cn } from "@/lib/utils";

function num(v: string): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function CalorieCalculator() {
  const T = useI18n();
  const S = T.services;

  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("75");
  const [targetWeightKg, setTargetWeightKg] = useState("65");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<CalorieGoal>("optimal");
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activityOptions: { id: ActivityLevel; label: string; hint: string }[] = [
    { id: "sedentary", label: S.activitySedentary, hint: S.activitySedentaryHint },
    { id: "light", label: S.activityLight, hint: S.activityLightHint },
    { id: "moderate", label: S.activityModerate, hint: S.activityModerateHint },
    { id: "high", label: S.activityHigh, hint: S.activityHighHint },
  ];

  const goalOptions: { id: CalorieGoal; label: string }[] = [
    { id: "mild", label: S.goalMild },
    { id: "optimal", label: S.goalOptimal },
    { id: "maintain", label: S.goalMaintain },
  ];

  function runCalc() {
    const input = {
      sex,
      age: num(age),
      heightCm: num(heightCm),
      weightKg: num(weightKg),
      targetWeightKg: num(targetWeightKg),
      activity,
      goal,
    };
    const v = validateCalorieInput(input);
    const next: Record<string, string> = {};
    if (v.age) next.age = S.errAge;
    if (v.heightCm) next.heightCm = S.errHeight;
    if (v.weightKg) next.weightKg = S.errWeight;
    if (v.targetWeightKg) next.targetWeightKg = S.errTarget;
    if (v.targetAboveCurrent) next.targetWeightKg = S.errTargetAbove;
    setErrors(next);
    if (Object.keys(next).length) {
      setResult(null);
      return;
    }
    setResult(calculateCalories(input as Parameters<typeof calculateCalories>[0]));
  }

  return (
    <div>
      <div className="space-y-5 rounded-[10px] border border-border bg-card p-5 md:p-6">
        <SexToggle value={sex} onChange={setSex} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cal-age">{S.age}</Label>
            <Input
              id="cal-age"
              type="number"
              inputMode="numeric"
              min={14}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1.5 rounded-[10px]"
            />
            <FieldError message={errors.age} />
          </div>
          <div>
            <Label htmlFor="cal-height">{S.height}</Label>
            <Input
              id="cal-height"
              type="number"
              inputMode="decimal"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="mt-1.5 rounded-[10px]"
            />
            <FieldError message={errors.heightCm} />
          </div>
          <div>
            <Label htmlFor="cal-weight">{S.weight}</Label>
            <Input
              id="cal-weight"
              type="number"
              inputMode="decimal"
              min={30}
              max={300}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-1.5 rounded-[10px]"
            />
            <FieldError message={errors.weightKg} />
          </div>
          <div>
            <Label htmlFor="cal-target">{S.targetWeight}</Label>
            <Input
              id="cal-target"
              type="number"
              inputMode="decimal"
              min={30}
              max={300}
              value={targetWeightKg}
              onChange={(e) => setTargetWeightKg(e.target.value)}
              className="mt-1.5 rounded-[10px]"
            />
            <FieldError message={errors.targetWeightKg} />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{S.activity}</legend>
          <div className="space-y-2">
            {activityOptions.map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-2.5 transition-colors",
                  activity === o.id
                    ? "border-primary bg-stone"
                    : "border-border hover:border-primary/30",
                )}
              >
                <input
                  type="radio"
                  name="activity"
                  className="mt-1"
                  checked={activity === o.id}
                  onChange={() => setActivity(o.id)}
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{S.goal}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {goalOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setGoal(o.id)}
                className={cn(
                  "rounded-[10px] border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  goal === o.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Button
          type="button"
          onClick={runCalc}
          className="h-11 w-full rounded-[10px] bg-cta text-cta-foreground hover:bg-cta/90 sm:w-auto sm:px-8"
        >
          {result ? S.recalculate : S.calculate}
        </Button>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-[10px] border border-border bg-stone p-6 text-center md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cta">
              {S.calories.resultKcal}
            </p>
            <p className="mt-2 font-display text-5xl font-semibold tracking-tight text-primary md:text-6xl">
              {result.targetKcal}
              <span className="ml-2 text-2xl font-medium text-muted-foreground">kcal</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{S.calories.resultKcalHint}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  label: S.calories.protein,
                  g: result.macros.proteinG,
                  pct: result.macros.proteinPct,
                },
                { label: S.calories.fat, g: result.macros.fatG, pct: result.macros.fatPct },
                { label: S.calories.carbs, g: result.macros.carbsG, pct: result.macros.carbsPct },
              ] as const
            ).map((m) => (
              <div
                key={m.label}
                className="rounded-[10px] border border-border bg-card p-4 text-center"
              >
                <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                  {m.g}
                  <span className="text-sm font-normal text-muted-foreground"> g</span>
                </p>
                <p className="mt-1 text-xs text-cta">{m.pct} %</p>
              </div>
            ))}
          </div>

          {result.weeksToGoal != null && (
            <p className="text-sm leading-relaxed text-foreground">
              {S.calories.forecast(num(targetWeightKg), result.weeksToGoal)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
