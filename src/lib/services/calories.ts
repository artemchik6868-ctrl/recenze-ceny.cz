/** Mifflin–St Jeor calorie / macros calculator for weight-management tools. */

export type Sex = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";

export type CalorieGoal = "mild" | "optimal" | "maintain";

export type CalorieInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activity: ActivityLevel;
  goal: CalorieGoal;
};

export type MacroGrams = {
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
};

export type CalorieResult = {
  bmr: number;
  amr: number;
  targetKcal: number;
  macros: MacroGrams;
  weeksToGoal: number | null;
};

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

export const GOAL_FACTOR: Record<CalorieGoal, number> = {
  mild: 0.85,
  optimal: 0.8,
  maintain: 1,
};

/** ~7700 kcal ≈ 1 kg body fat */
export const KCAL_PER_KG = 7700;

export const CALORIE_LIMITS = {
  age: { min: 14, max: 100 },
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
} as const;

export type CalorieFieldError =
  | "age"
  | "heightCm"
  | "weightKg"
  | "targetWeightKg"
  | "targetAboveCurrent";

export function validateCalorieInput(
  input: Partial<CalorieInput>,
): Partial<Record<CalorieFieldError, true>> {
  const errors: Partial<Record<CalorieFieldError, true>> = {};
  const { age, heightCm, weightKg, targetWeightKg, goal } = input;

  if (
    age == null ||
    !Number.isFinite(age) ||
    age < CALORIE_LIMITS.age.min ||
    age > CALORIE_LIMITS.age.max
  ) {
    errors.age = true;
  }
  if (
    heightCm == null ||
    !Number.isFinite(heightCm) ||
    heightCm < CALORIE_LIMITS.heightCm.min ||
    heightCm > CALORIE_LIMITS.heightCm.max
  ) {
    errors.heightCm = true;
  }
  if (
    weightKg == null ||
    !Number.isFinite(weightKg) ||
    weightKg < CALORIE_LIMITS.weightKg.min ||
    weightKg > CALORIE_LIMITS.weightKg.max
  ) {
    errors.weightKg = true;
  }
  if (
    targetWeightKg == null ||
    !Number.isFinite(targetWeightKg) ||
    targetWeightKg < CALORIE_LIMITS.weightKg.min ||
    targetWeightKg > CALORIE_LIMITS.weightKg.max
  ) {
    errors.targetWeightKg = true;
  } else if (
    weightKg != null &&
    Number.isFinite(weightKg) &&
    goal &&
    goal !== "maintain" &&
    targetWeightKg >= weightKg
  ) {
    errors.targetAboveCurrent = true;
  }
  return errors;
}

/** Mifflin–St Jeor BMR. */
export function calcBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calcAmr(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIER[activity];
}

export function calcTargetKcal(amr: number, goal: CalorieGoal): number {
  return amr * GOAL_FACTOR[goal];
}

export function calcMacros(weightKg: number, targetKcal: number): MacroGrams {
  const proteinG = Math.round(2 * weightKg);
  const fatG = Math.round(1 * weightKg);
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsG = Math.max(0, Math.round((targetKcal - proteinKcal - fatKcal) / 4));
  const carbsKcal = carbsG * 4;
  const total = proteinKcal + fatKcal + carbsKcal || 1;
  return {
    proteinG,
    fatG,
    carbsG,
    proteinPct: Math.round((proteinKcal / total) * 100),
    fatPct: Math.round((fatKcal / total) * 100),
    carbsPct: Math.round((carbsKcal / total) * 100),
  };
}

/**
 * Weeks to reach target at the chosen deficit.
 * Returns null when maintaining, gaining, or deficit is non-positive.
 */
export function calcWeeksToGoal(
  weightKg: number,
  targetWeightKg: number,
  amr: number,
  targetKcal: number,
): number | null {
  const deltaKg = weightKg - targetWeightKg;
  if (deltaKg <= 0) return null;
  const dailyDeficit = amr - targetKcal;
  if (dailyDeficit <= 0) return null;
  const weeks = (deltaKg * KCAL_PER_KG) / (dailyDeficit * 7);
  return Math.max(1, Math.ceil(weeks));
}

export function calculateCalories(input: CalorieInput): CalorieResult {
  const bmr = calcBmr(input.sex, input.weightKg, input.heightCm, input.age);
  const amr = calcAmr(bmr, input.activity);
  const targetKcal = Math.round(calcTargetKcal(amr, input.goal));
  const macros = calcMacros(input.weightKg, targetKcal);
  const weeksToGoal =
    input.goal === "maintain"
      ? null
      : calcWeeksToGoal(input.weightKg, input.targetWeightKg, amr, targetKcal);

  return {
    bmr: Math.round(bmr),
    amr: Math.round(amr),
    targetKcal,
    macros,
    weeksToGoal,
  };
}
