// Delivery ETA strings for product urgency triggers (Czech Republic market).
import type { Lang } from "./lang";
import { getI18n } from "./i18n";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long" }).format(d);
}

export type DeliveryEta = {
  prefix: string;
  date: string;
  short: string;
};

const CUTOFF_HOUR = 16;
const TRANSIT_DAYS = 3;

export function deliveryEta(lang: Lang, now: Date = new Date()): DeliveryEta {
  const T = getI18n(lang);
  const beforeCutoff = now.getHours() < CUTOFF_HOUR;
  const shipDate = new Date(now);
  if (!beforeCutoff) shipDate.setDate(shipDate.getDate() + 1);
  const arriveDate = new Date(shipDate);
  arriveDate.setDate(arriveDate.getDate() + TRANSIT_DAYS);

  const date = formatDate(arriveDate);
  return {
    prefix: T.product.deliveryEtaPrefix,
    date,
    short: T.product.deliveryEtaShort(date),
  };
}
