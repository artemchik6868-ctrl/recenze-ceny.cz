/** Daily water-balance calculator. */

import type { Sex } from "./calories";

export type WaterInput = {
  sex: Sex;
  weightKg: number;
  activityMinutes: number;
  hotClimate: boolean;
  includesCoffeeTea: boolean;
};

export type WaterResult = {
  /** Total recommendation in ml */
  totalMl: number;
  liters: number;
  glasses250: number;
  baseMl: number;
  activityMl: number;
  climateMl: number;
  coffeeTeaMl: number;
};

export const WATER_LIMITS = {
  weightKg: { min: 30, max: 300 },
  activityMinutes: { min: 0, max: 480 },
} as const;

export const ML_PER_GLASS = 250;
export const ACTIVITY_BONUS_PER_30_MIN = 500;
export const HOT_CLIMATE_BONUS = 300;
export const COFFEE_TEA_BONUS = 250;

export type WaterFieldError = "weightKg" | "activityMinutes";

export function validateWaterInput(
  input: Partial<WaterInput>,
): Partial<Record<WaterFieldError, true>> {
  const errors: Partial<Record<WaterFieldError, true>> = {};
  const { weightKg, activityMinutes } = input;
  if (
    weightKg == null ||
    !Number.isFinite(weightKg) ||
    weightKg < WATER_LIMITS.weightKg.min ||
    weightKg > WATER_LIMITS.weightKg.max
  ) {
    errors.weightKg = true;
  }
  if (
    activityMinutes == null ||
    !Number.isFinite(activityMinutes) ||
    activityMinutes < WATER_LIMITS.activityMinutes.min ||
    activityMinutes > WATER_LIMITS.activityMinutes.max
  ) {
    errors.activityMinutes = true;
  }
  return errors;
}

export function calculateWater(input: WaterInput): WaterResult {
  const perKg = input.sex === "male" ? 40 : 35;
  const baseMl = Math.round(input.weightKg * perKg);
  const blocks = Math.floor(Math.max(0, input.activityMinutes) / 30);
  const activityMl = blocks * ACTIVITY_BONUS_PER_30_MIN;
  const climateMl = input.hotClimate ? HOT_CLIMATE_BONUS : 0;
  const coffeeTeaMl = input.includesCoffeeTea ? COFFEE_TEA_BONUS : 0;
  const totalMl = baseMl + activityMl + climateMl + coffeeTeaMl;
  return {
    totalMl,
    liters: Math.round((totalMl / 1000) * 10) / 10,
    glasses250: Math.max(1, Math.round(totalMl / ML_PER_GLASS)),
    baseMl,
    activityMl,
    climateMl,
    coffeeTeaMl,
  };
}
