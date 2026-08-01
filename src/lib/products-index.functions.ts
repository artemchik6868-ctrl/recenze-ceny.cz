import { createServerFn } from "@tanstack/react-start";
import { loadProductsIndexData } from "./products-index.server";

export const getProductsIndexData = createServerFn({ method: "GET" }).handler(async () => {
  return await loadProductsIndexData();
});
