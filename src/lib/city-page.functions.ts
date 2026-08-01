import { createServerFn } from "@tanstack/react-start";
import { loadCityPageData } from "./city-page.server";

export const getCityPageData = createServerFn({ method: "GET" }).handler(async () => {
  return await loadCityPageData();
});
