import { createServerFn } from "@tanstack/react-start";
import { loadHomePageData } from "./home-page.server";

export const getHomePageData = createServerFn({ method: "GET" }).handler(async () => {
  return await loadHomePageData();
});
