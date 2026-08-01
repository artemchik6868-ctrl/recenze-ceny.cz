export function stripBrandFromText(text: string, ...brandSources: string[]): string {
  const original = (text ?? "").trim();
  if (!original) return original;
  const tokens = new Set<string>();
  for (const src of brandSources) {
    if (!src) continue;
    for (const tok of String(src).split(/[\s\-—–_:,.]+/)) {
      const t = tok.trim();
      if (t.length < 3) continue;
      const low = t.toLocaleLowerCase("uk-UA");
      if (BRAND_STOP_WORDS.has(low)) continue;
      if (LATIN_TOKEN_RE.test(t)) { tokens.add(t); continue; }
      if (/^[\u0410-\u042F\u0401\u0406\u0407\u0404\u0490][\u0430-\u044F\u0451\u0456\u0457\u0454\u0491'\u2019\-]{2,}$/u.test(t)) tokens.add(t);
    }
  }
  if (tokens.size === 0) return original;
  let s = original;
  for (const tok of tokens) {
    const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(
      new RegExp(`[\\s,]+(?:—|–|-|−|with|by|для\\s+)?\\s*${esc}\\s*[.!?]?\\s*$`, "iu"),
      "",
    );
    s = s.replace(new RegExp(`^${esc}\\s*[—–\\-:,.]?\\s+`, "iu"), "");
    s = s.replace(new RegExp(`\\s+${esc}\\s+`, "giu"), " ");
    s = s.replace(
      new RegExp(`\\s+(?:—|–|-|−|with|by|для)\\s+${esc}(?=[\\s.,!?]|$)`, "giu"),
      "",
    );
  }
  s = s.replace(/\s{2,}/g, " ").replace(/\s+([.,!?:])/g, "$1").trim();
  s = s.replace(/^[—–\-:,.\s]+/, "").trim();
  if (s.length < 20 || s.length < original.length * 0.6) return original;
  return s.charAt(0).toLocaleUpperCase("uk-UA") + s.slice(1);
}
