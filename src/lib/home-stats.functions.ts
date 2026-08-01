import { createServerFn } from "@tanstack/react-start";
import { loadHomeStats } from "./home-stats.server";

export const getHomeStats = createServerFn({ method: "GET" }).handler(async () => {
  return await loadHomeStats();
});
