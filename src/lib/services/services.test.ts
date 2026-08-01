import assert from "node:assert/strict";
import {
  calcBmr,
  calcAmr,
  calcMacros,
  calcWeeksToGoal,
  calculateCalories,
  validateCalorieInput,
} from "./calories";
import { calculateWater, validateWaterInput } from "./water";
import { tagsFromAnswers, scoreOffer, recommendOffers, type QuizAnswers } from "./quiz-scoring";
import type { Offer } from "@/lib/types";

let failed = 0;

function ok(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

ok("BMR male Mifflin–St Jeor", () => {
  // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
  assert.equal(calcBmr("male", 80, 180, 30), 1780);
});

ok("BMR female Mifflin–St Jeor", () => {
  // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
  assert.equal(calcBmr("female", 65, 165, 28), 1380.25);
});

ok("AMR sedentary multiplier", () => {
  assert.equal(calcAmr(1780, "sedentary"), 1780 * 1.2);
});

ok("macros protein/fat per kg + carbs remainder", () => {
  const m = calcMacros(80, 2000);
  assert.equal(m.proteinG, 160);
  assert.equal(m.fatG, 80);
  // 2000 - (160*4 + 80*9) = 2000 - (640+720) = 640 → 160g carbs
  assert.equal(m.carbsG, 160);
  assert.equal(m.proteinPct + m.fatPct + m.carbsPct, 100);
});

ok("weeks to goal from deficit", () => {
  const weeks = calcWeeksToGoal(90, 80, 2500, 2000);
  // 10kg * 7700 / (500*7) = 77000/3500 = 22
  assert.equal(weeks, 22);
});

ok("calculateCalories optimal deficit", () => {
  const r = calculateCalories({
    sex: "female",
    age: 35,
    heightCm: 170,
    weightKg: 75,
    targetWeightKg: 65,
    activity: "moderate",
    goal: "optimal",
  });
  assert.ok(r.targetKcal < r.amr);
  assert.ok(r.weeksToGoal != null && r.weeksToGoal >= 1);
  assert.equal(r.macros.proteinG, 150);
});

ok("validateCalorieInput rejects bad age and target >= current", () => {
  const e = validateCalorieInput({
    age: 10,
    heightCm: 170,
    weightKg: 70,
    targetWeightKg: 75,
    goal: "mild",
  });
  assert.equal(e.age, true);
  assert.equal(e.targetAboveCurrent, true);
});

ok("water base female + activity + climate + coffee", () => {
  const r = calculateWater({
    sex: "female",
    weightKg: 70,
    activityMinutes: 60,
    hotClimate: true,
    includesCoffeeTea: true,
  });
  // 70*35 = 2450; 2*500 = 1000; +300; +250 = 4000
  assert.equal(r.baseMl, 2450);
  assert.equal(r.activityMl, 1000);
  assert.equal(r.climateMl, 300);
  assert.equal(r.coffeeTeaMl, 250);
  assert.equal(r.totalMl, 4000);
  assert.equal(r.liters, 4);
  assert.equal(r.glasses250, 16);
});

ok("water male per-kg 40", () => {
  const r = calculateWater({
    sex: "male",
    weightKg: 80,
    activityMinutes: 0,
    hotClimate: false,
    includesCoffeeTea: false,
  });
  assert.equal(r.baseMl, 3200);
  assert.equal(r.totalMl, 3200);
});

ok("validateWaterInput rejects negative activity", () => {
  const e = validateWaterInput({ weightKg: 70, activityMinutes: -5 });
  assert.equal(e.activityMinutes, true);
});

ok("quiz tags from answers", () => {
  const answers: QuizAnswers = {
    goal: "appetite",
    obstacle: "evening_stress",
    extras: ["sleep"],
    activity: "minimal",
  };
  const tags = tagsFromAnswers(answers);
  assert.ok(tags.includes("appetite"));
  assert.ok(tags.includes("stress"));
  assert.ok(tags.includes("sleep"));
});

function mockOffer(partial: Partial<Offer> & Pick<Offer, "slug" | "title">): Offer {
  return {
    id: 1,
    source: "kma",
    brand: partial.title,
    subtitle: "",
    categoryKey: "wm",
    categoryName: "Kontrola hmotnosti",
    categorySlug: "hubnuti",
    image: "",
    priceEUR: 990,
    landingUrl: null,
    publishedAt: "2024-01-01",
    firstSeenAt: "2024-01-01",
    contentGeneratedAt: "2024-01-01",
    aiCategoryResolved: true,
    ...partial,
  };
}

ok("scoreOffer prefers appetite keywords", () => {
  const tags = tagsFromAnswers({
    goal: "appetite",
    obstacle: "evening_stress",
    extras: [],
    activity: "minimal",
  });
  const a = mockOffer({ slug: "garcinia", title: "Garcinie tlumič hladu" });
  const b = mockOffer({ slug: "random", title: "SuperMix XYZ" });
  assert.ok(scoreOffer(a, tags) > scoreOffer(b, tags));
});

ok("recommendOffers returns up to 6 unique brands", () => {
  const offers = [
    mockOffer({
      id: 1,
      slug: "a",
      title: "Alpha",
      brand: "Alpha",
      subtitle: "Spalovač tuků metabolismus",
    }),
    mockOffer({ id: 2, slug: "b", title: "Beta", brand: "Beta", subtitle: "Tlumič chuti k jídlu" }),
    mockOffer({
      id: 3,
      slug: "c",
      title: "Gamma",
      brand: "Gamma",
      subtitle: "Detox odvodnění otoky",
    }),
    mockOffer({ id: 4, slug: "d", title: "Delta", brand: "Delta", subtitle: "Vláknina sytost" }),
    mockOffer({ id: 5, slug: "e", title: "Epsilon", brand: "Epsilon", subtitle: "Energie kofein" }),
    mockOffer({ id: 6, slug: "f", title: "Zeta", brand: "Zeta", subtitle: "L-karnitin sport" }),
    mockOffer({ id: 7, slug: "a2", title: "Alpha Duo", brand: "Alpha", subtitle: "Spalovač tuků" }),
    mockOffer({ id: 8, slug: "g", title: "Eta", brand: "Eta", subtitle: "Something else" }),
  ];
  const rec = recommendOffers(
    offers,
    { goal: "edema", obstacle: "water_retention", extras: ["detox"], activity: "minimal" },
    6,
  );
  assert.equal(rec.length, 6);
  const brands = rec.map((r) => r.offer.brand.toLowerCase());
  assert.equal(new Set(brands).size, brands.length);
  assert.ok(!brands.includes("alpha") || brands.filter((b) => b === "alpha").length === 1);
});

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll services tests passed");
