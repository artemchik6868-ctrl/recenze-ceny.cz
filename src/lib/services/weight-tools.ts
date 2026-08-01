import { SERVICES_PATH } from "@/lib/site";

export const WEIGHT_TOOLS_CATEGORY = "hubnuti";

export type WeightToolId = "calories" | "quiz" | "water";

export type WeightToolDef = {
  id: WeightToolId;
  path: string;
};

export const WEIGHT_TOOLS: WeightToolDef[] = [
  { id: "calories", path: `${SERVICES_PATH}/kaloricka-kalkulacka` },
  { id: "quiz", path: `${SERVICES_PATH}/personalni-pomocnik` },
  { id: "water", path: `${SERVICES_PATH}/vodni-bilance` },
];

export function isWeightToolsCategory(slug: string | null | undefined): boolean {
  return slug === WEIGHT_TOOLS_CATEGORY;
}
