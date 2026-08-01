// Lightweight whitelist HTML sanitizer for AI-generated product descriptions.
// Workers-compatible (pure regex; no DOMParser). The source is constrained to
// our own AI pipeline output, but we still strip attrs/scripts/styles defensively.

const ALLOWED_TAGS = new Set([
  "h2", "h3", "h4",
  "p", "br",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th",
  "strong", "b", "em", "i",
]);

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  let s = String(html);

  // Drop script/style/iframe blocks entirely (including contents).
  s = s.replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1>/gi, "");
  // Drop standalone dangerous tags / comments.
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // Walk every tag: keep if whitelisted, strip attributes.
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, rawName: string) => {
    const tag = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = match.startsWith("</");
    if (isClosing) return `</${tag}>`;
    const selfClosing = /\/>$/.test(match) || tag === "br";
    return selfClosing && tag === "br" ? "<br>" : `<${tag}>`;
  });

  // Collapse excessive blank lines.
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  // Guard against AI-truncated content that ends mid-word or with an unclosed
  // tag (e.g. "…міцності кісток та здоров"). Cut everything after the last
  // safe closing block tag so the description ends on a clean boundary.
  if (s && !/<\/(p|ul|ol|li|h2|h3|h4|table)>\s*$/i.test(s)) {
    const m = s.match(/^[\s\S]*<\/(p|ul|ol|h2|h3|h4|table)>/i);
    if (m) s = m[0];
  }
  return s;
}
