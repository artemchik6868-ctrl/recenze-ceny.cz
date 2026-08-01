/** Runtime post-process for AI-generated product HTML (ES pattern — no append). */

import { deliveryH2For } from "./pdp-variants";

/** Legacy wrong-locale delivery H2 from pre-pipeline content or locale leaks. */
const LEGACY_DELIVERY_H2_RE =
  /<h2[^>]*>\s*(?:Consegna e pagamento in Italia|Entrega y pago en Espa[nñ]a|Lieferung und Zahlung)\s*<\/h2>/gi;

export function varyDeliveryBlock(
  html: string,
  categorySlug: string,
  offerId: number,
): string {
  if (!html || !LEGACY_DELIVERY_H2_RE.test(html)) return html;
  LEGACY_DELIVERY_H2_RE.lastIndex = 0;
  const replacement = deliveryH2For(categorySlug, offerId);
  return html.replace(LEGACY_DELIVERY_H2_RE, `<h2>${replacement}</h2>`);
}
