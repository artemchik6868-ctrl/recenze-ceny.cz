import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateWater, validateWaterInput, type WaterResult } from "@/lib/services/water";
import type { Sex } from "@/lib/services/calories";
import { FieldError, SexToggle } from "./ServiceFormBits";
import { cn } from "@/lib/utils";

function num(v: string): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function WaterBalanceCalculator() {
  const T = useI18n();
  const S = T.services;
  const W = S.water;

  const [sex, setSex] = useState<Sex>("female");
  const [weightKg, setWeightKg] = useState("70");
  const [activityMinutes, setActivityMinutes] = useState("30");
  const [hotClimate, setHotClimate] = useState(false);
  const [includesCoffeeTea, setIncludesCoffeeTea] = useState(false);
  const [result, setResult] = useState<WaterResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function runCalc() {
    const input = {
      sex,
      weightKg: num(weightKg),
      activityMinutes: num(activityMinutes),
      hotClimate,
      includesCoffeeTea,
    };
    const v = validateWaterInput(input);
    const next: Record<string, string> = {};
    if (v.weightKg) next.weightKg = S.errWeight;
    if (v.activityMinutes) next.activityMinutes = S.errActivityMinutes;
    setErrors(next);
    if (Object.keys(next).length) {
      setResult(null);
      return;
    }
    setResult(calculateWater(input));
  }

  const fillPct = result ? Math.min(100, Math.round((result.totalMl / 4500) * 100)) : 0;

  return (
    <div>
      <div className="space-y-5 rounded-[10px] border border-border bg-card p-5 md:p-6">
        <SexToggle value={sex} onChange={setSex} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="water-weight">{S.weight}</Label>
            <Input
              id="water-weight"
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
            <Label htmlFor="water-mins">{W.activityMinutes}</Label>
            <Input
              id="water-mins"
              type="number"
              inputMode="numeric"
              min={0}
              max={480}
              value={activityMinutes}
              onChange={(e) => setActivityMinutes(e.target.value)}
              className="mt-1.5 rounded-[10px]"
            />
            <FieldError message={errors.activityMinutes} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox checked={hotClimate} onCheckedChange={(c) => setHotClimate(c === true)} />
            <span>{W.hotClimate}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={includesCoffeeTea}
              onCheckedChange={(c) => setIncludesCoffeeTea(c === true)}
            />
            <span>{W.coffeeTea}</span>
          </label>
        </div>

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
          <div className="flex flex-col items-center gap-6 rounded-[10px] border border-border bg-stone p-6 sm:flex-row sm:items-end sm:justify-center sm:gap-10 md:p-8">
            <div
              className="relative h-44 w-24 overflow-hidden rounded-b-[10px] rounded-t-[6px] border-2 border-primary/30 bg-card"
              aria-hidden
            >
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-primary/70 transition-all duration-700 ease-out",
                )}
                style={{ height: `${fillPct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-lg font-semibold text-primary-foreground mix-blend-difference">
                  {result.liters} l
                </span>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cta">
                {W.resultLabel}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                {W.resultDetail(result.liters, result.glasses250)}
              </p>
            </div>
          </div>

          {includesCoffeeTea && <p className="text-sm text-muted-foreground">{W.coffeeNote}</p>}

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {W.scheduleTitle}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
              {W.schedule.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
