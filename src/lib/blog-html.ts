/**
 * Whitelist sanitizer for AI blog body HTML.
 * Preserves <!--PRODUCTS--> and editorial-* classes used by .editorial-prose.
 */

import { BLOG_PRODUCTS_MARKER } from "@/lib/blog";

const PRODUCTS_PLACEHOLDER = "%%BLOG_PRODUCTS_MARKER%%";

const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "caption",
  "div",
  "aside",
]);

const ALLOWED_CLASSES = new Set([
  "editorial-callout",
  "editorial-callout-title",
  "editorial-table-wrap",
]);

function allowedClassAttr(raw: string | undefined): string | null {
  if (!raw) return null;
  const kept = raw
    .split(/\s+/)
    .map((c) => c.trim())
    .filter((c) => ALLOWED_CLASSES.has(c));
  return kept.length ? kept.join(" ") : null;
}

/** Wrap bare <table>…</table> that is not already inside editorial-table-wrap. */
function wrapBareTables(html: string): string {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (block, offset, full) => {
    const before = full.slice(Math.max(0, offset - 80), offset);
    if (/editorial-table-wrap[^>]*>\s*$/i.test(before)) return block;
    return `<div class="editorial-table-wrap">${block}</div>`;
  });
}

/**
 * Sanitize blog article HTML for safe SSR via dangerouslySetInnerHTML.
 */
export function sanitizeBlogHtml(html: string | null | undefined): string {
  if (!html) return "";
  let s = String(html);

  const hadMarker = s.includes(BLOG_PRODUCTS_MARKER);
  if (hadMarker) s = s.split(BLOG_PRODUCTS_MARKER).join(PRODUCTS_PLACEHOLDER);

  s = s.replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // Drop LLM "Upozornění" disclaimer boxes — not useful on editorial blog posts.
  s = s.replace(/<aside\b[^>]*class=["'][^"']*editorial-callout[^"']*["'][^>]*>[\s\S]*?<\/aside>/gi, "");

  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, rawName: string, rawAttrs: string) => {
    const tag = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = match.startsWith("</");
    if (isClosing) return `</${tag}>`;

    if (tag === "br") return "<br>";

    let classAttr = "";
    if (tag === "div" || tag === "aside" || tag === "p") {
      const classMatch = rawAttrs.match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawClass = classMatch?.[2] ?? classMatch?.[3] ?? classMatch?.[4];
      const allowed = allowedClassAttr(rawClass);
      if (tag === "div" || tag === "aside") {
        if (!allowed) return ""; // bare div/aside without editorial class — drop opening; content may leak
        classAttr = ` class="${allowed}"`;
      } else if (allowed) {
        classAttr = ` class="${allowed}"`;
      }
    }

    return `<${tag}${classAttr}>`;
  });

  // Drop orphaned closings from stripped opens is hard; collapse blank noise.
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  s = wrapBareTables(s);

  if (hadMarker) s = s.split(PRODUCTS_PLACEHOLDER).join(BLOG_PRODUCTS_MARKER);
  return s;
}
