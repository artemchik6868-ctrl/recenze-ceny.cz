// Per-source description cleaners.
//
// The base `cleanRawDescription` in ai-content.server already strips
// webmaster blocks. This module layers source-specific knowledge on top:
// each cleaner knows which fragments of THAT partner feed are noise
// (KPI text, traffic rules, payout tables, internal tags) and returns
// both the cleaned text and a list of warnings for the brief.
//
// Output is always Worker-safe plain JS; no IO, no DOM.

import type { OfferSource } from "./types";

export type CleanedDescription = {
  cleaned: string;
  warnings: string[];
};

const SHARED_STOPS: RegExp[] = [
  /виплат[иа][\s\S]*/i,
  /выплат[ыа][\s\S]*/i,
  /\bKPI[\s\S]*/i,
  /апрув[\s\S]*/i,
  /джерел(а|о) трафіку[\s\S]*/i,
  /источник(и)? трафика[\s\S]*/i,
  /заборонен[аіоі][\s\S]*/i,
  /запрещённ(ые|ый)[\s\S]*/i,
  /промо[\s\S]*$/i,
  /цільов(а|е) ді(я|ї)[\s\S]*/i,
  /целев(ая|ое) действие[\s\S]*/i,
];

const CPA_TL_STOPS: RegExp[] = [
  /умови\s+розміщення[\s\S]*/i,
  /условия\s+размещения[\s\S]*/i,
  /холд[\s\S]*/i,
  /webmaster|вебмастер|вебмайстер[\s\S]*/i,
  /допустим[ыі]е?\s+источник[\s\S]*/i,
  /дозволен[іо]\s+джерел[\s\S]*/i,
  /(не\s+)?приймаються\s+ліди[\s\S]*/i,
  /(не\s+)?принимаются\s+лиды[\s\S]*/i,
];

const M1_STOPS: RegExp[] = [
  /оплата\s+за[\s\S]*/i,
  /payout[\s\S]*/i,
  /м1\s*топ[\s\S]*/i,
];

const CPAGETTI_STOPS: RegExp[] = [
  /хол[ьд]?\s*ли[дt][\s\S]*/i,
  /условия\s+(?:оплаты|выплат)[\s\S]*/i,
];

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ");
}

function collapseWs(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function applyStops(text: string, stops: RegExp[]): { text: string; cuts: number } {
  let out = text;
  let cuts = 0;
  for (const re of stops) {
    if (re.test(out)) {
      out = out.replace(re, " ");
      cuts++;
    }
  }
  return { text: out, cuts };
}

export function cleanForSource(source: OfferSource, raw: string): CleanedDescription {
  const warnings: string[] = [];
  if (!raw) return { cleaned: "", warnings: ["empty-description"] };

  let text = stripHtml(raw);

  const { text: t1, cuts: shared } = applyStops(text, SHARED_STOPS);
  text = t1;

  let extraStops: RegExp[] = [];
  if (source === "cpa_tl") extraStops = CPA_TL_STOPS;
  else if (source === "m1_top") extraStops = M1_STOPS;
  else if (source === "cpagetti") extraStops = CPAGETTI_STOPS;
  // KMA descriptions are usually empty — no extra stops.

  const { text: t2, cuts: srcCuts } = applyStops(text, extraStops);
  text = collapseWs(t2);

  if (shared > 0) warnings.push(`shared-stops:${shared}`);
  if (srcCuts > 0) warnings.push(`${source}-stops:${srcCuts}`);
  if (text.length < 40) warnings.push("thin-description");

  return { cleaned: text, warnings };
}
