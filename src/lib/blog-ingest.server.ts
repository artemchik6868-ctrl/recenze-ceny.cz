/**
 * Offline blog ingest: RSS → extract → OpenRouter rewrite → cover → products → insert.
 * Intended for GitHub Actions / local CLI — never call from Worker request path.
 */

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  BLOG_PRODUCTS_MARKER,
  blogSlugFromTitle,
  ensureBlogProductsMarker,
  offerProductKey,
  type BlogFaqItem,
  type BlogPostStatus,
} from "@/lib/blog";
import { sanitizeBlogHtml } from "@/lib/blog-html";
import { BLOG_RSS_SOURCES, type BlogRssSource } from "@/lib/blog-sources";
import { validateShelfSlug } from "@/lib/catalog-shelf";
import { categoryDisplayName } from "@/lib/category-display-name";
import { isProductIndexable } from "@/lib/index-policy";
import { isSupplementCategory } from "@/lib/niche-types";
import { loadOffers } from "@/lib/offers.server";
import { pickRandomUniqueBrandOffers } from "@/lib/services/pick-random-offers";
import { SITE } from "@/lib/site";
import type { Offer } from "@/lib/types";

const DEFAULT_AI_GATEWAY_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_AI_MODEL = "poolside/laguna-s-2.1:free";
/** Fallback chain when primary model 404/429/times out (override via BLOG_AI_MODELS csv). */
const DEFAULT_MODEL_FALLBACKS = [
  "poolside/laguna-s-2.1:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
];
const FETCH_TIMEOUT_MS = 20_000;
const LLM_TIMEOUT_MS = 90_000;
const LLM_429_BACKOFF_MS = 20_000;
/** Never publish product blocks thinner than this — skip the article instead. */
const MIN_PRODUCTS = 4;
const TARGET_PRODUCTS = 4;

/**
 * Topic → shelf hints. Matched against the TITLE only (body is too noisy for WHO/CDC
 * press releases that casually mention chronic disease).
 */
const BLOG_TOPIC_HINTS: Array<[RegExp, string]> = [
  [/alzheimer|dement|neurodegener|cognitive\s*impair|pam[eě]t/i, "stres"],
  [
    /anxiety|depress|insomni|sleep\s*disorder|can[\u2019']?t\s*sleep|poor\s*sleep|burnout|úzkost|nespav|\bspán|\bspan(?:ek|ku|kem|ím)?\b|stres(?:u|em)?\b|circadian|jet\s*lag|cortisol|mindfulness/i,
    "stres",
  ],
  [
    /diabet|prediabetes|blood\s*sugar|gluk[oó]z|cukrov|hypoglyc|insulin|\ba1c\b|hba1c|type\s*2\s*diabetes/i,
    "cukrovka",
  ],
  [/hypertens|blood\s*pressure|krevn[ií]\s*tlak|systolic|diastolic/i, "krevni-tlak"],
  [/\bjoints?\b|arthritis|osteoarthr|cartilage|knee\s*pain|\bkloub/i, "klouby"],
  [/prostat/i, "prostata"],
  [
    /weight\s*loss|lost\s*weight|obesit|overweight|hubnut|\bbmi\b|belly\s*fat|visceral\s*fat|bariatric|metabol(?:ic)?\s*syndrome|kalori|calorie\s*restrict/i,
    "hubnuti",
  ],
  [
    /digestive|gut\s*microbiom|microbiome|irritable\s*bowel|\bibs\b|intestin|probiotic|bloating|reflux|žalud|zalud|střev|strev|tráven|traven|constipation|zácpa|zacpa|e\.?\s*coli|foodborne|salmonella/i,
    "traveni",
  ],
  [/\bliver\b|játr|jatr|hepatit|fatty\s*liver|nash\b|nafld/i, "jatra"],
  [/\bkidney\b|ledvin|renal\s*fail|chronic\s*kidney/i, "ledviny"],
  [/eyesight|retinopathy|glaucoma|cataract|macular|\bzrak\b|oční|ocni/i, "zrak"],
  [/hearing\s*loss|tinnit|\bsluch\b|age[- ]related\s*hearing/i, "sluch"],
  [
    /menopaus|endometri|\bpcos\b|pregnan|breastfeeding|žensk(?:é|e)\s*zdrav|women'?s\s*health/i,
    "zdravi-zen",
  ],
  [/smok(?:e|ing)|nicotin|tobacco|kouřen|kouren|cigaret|vaping|quit\s*smoking/i, "odvykani-koureni"],
  [/parasit|helminth|cyclospor|giardia|cryptospor|pinworm|roundworm|parazit/i, "paraziti"],
  [/hemorrhoid|proctolog|hemoroid/i, "hemoroidy"],
  [/varicose|\bžilní|\bzilni|křečov|krecov|spider\s*vein|otok(?:y|l[éeý])?|otékl|otekl|lymf/i, "krecove-zily"],
  [
    /\banti-?ag(?:e|ing)\b|wrinkle|\bkolagen\b|\bcollagen\b|skin\s*aging|longevity|senescence/i,
    "anti-aging",
  ],
  [/cystitis|urinary\s*tract|\buti\b|močov|mocov|zánět\s*moč|bladder\s*infection/i, "cystitida"],
  [/erectile|\bed\b|libido|impoten|potenc|testosterone\s*deficien/i, "potence"],
  [/papilloma|wart\b|bradavic|papilom|hpv\b/i, "papilomy"],
  [/nail\s*fungus|onychomyc|plís[eě]n\s*neht|plisen\s*neht|toenail\s*fung/i, "plisen-nehtu"],
];

/** Diplomacy / funding / institutional PR — never map to a supplement shelf. */
const INSTITUTIONAL_NOISE =
  /director-general|\bvisits?\b|paying tribute|certified .{0,40}free|notification of withdrawal|united states|geopolit|obituar|in memoriam|appoints?\b|statement on notification|strategic partnership|renew.{0,40}partner|african union|world health day|health systems?|eib global|fifa|world cup|hospital[- ]acquired|healthcare[- ]associated|hai\b|press briefing|memorandum of understanding|\bmou\b|funding|philanthrop|public health across|strengthen(?:ing)?\s+public\s+health|outbreak\s+response\s+readiness|policy\s+brief|\(z\/m\)|odborný pracovník|přírodovědní analytik|volná místa|hledáme posilu|převest lékařskou praxi|pravní rámec/i;

function matchTopicHint(text: string): string | null {
  for (const [re, slug] of BLOG_TOPIC_HINTS) {
    if (!re.test(text)) continue;
    const ok = validateShelfSlug(slug);
    if (ok && isSupplementCategory(ok)) return ok;
  }
  return null;
}

/** Strict niche gate: TITLE must carry the catalog topic. Body-only hits are rejected. */
function hintShelfFromText(title: string, _text: string): string | null {
  const t = title.trim();
  if (!t || INSTITUTIONAL_NOISE.test(t)) return null;
  return matchTopicHint(t);
}

/** Supplement shelves that currently have enough indexable offers for a product block. */
async function loadStockedBlogShelves(
  minCount = MIN_PRODUCTS,
): Promise<{ shelves: string[]; offersByShelf: Map<string, Offer[]> }> {
  const offers = await loadOffers();
  const indexable = offers.filter(
    (o) => isProductIndexable(o) && o.aiCategoryResolved && isSupplementCategory(o.categorySlug),
  );
  const offersByShelf = new Map<string, Offer[]>();
  for (const o of indexable) {
    const list = offersByShelf.get(o.categorySlug) ?? [];
    list.push(o);
    offersByShelf.set(o.categorySlug, list);
  }
  const shelves = [...offersByShelf.entries()]
    .filter(([, list]) => list.length >= minCount)
    .map(([slug]) => slug)
    .sort();
  return { shelves, offersByShelf };
}

function shelfChoicesForPrompt(shelves: string[]): Array<{ slug: string; name: string }> {
  return shelves.map((slug) => ({ slug, name: categoryDisplayName(slug) }));
}


export type BlogIngestOptions = {
  limit?: number;
  dryRun?: boolean;
  status?: BlogPostStatus;
  sources?: BlogRssSource[];
};

export type BlogIngestResult = {
  scanned: number;
  inserted: number;
  skipped: number;
  errors: string[];
  slugs: string[];
};

type RssItem = {
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string | null;
  source: BlogRssSource;
};

type LlmArticle = {
  title: string;
  excerpt: string;
  body_html: string;
  meta_title: string;
  meta_description: string;
  category_slug: string;
  faq: BlogFaqItem[];
};

function aiConfig(): { url: string; apiKey: string } | null {
  const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  return {
    url: process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL,
    apiKey,
  };
}

/** Primary + fallbacks. BLOG_AI_MODELS csv overrides the whole chain. */
function resolveModelChain(): string[] {
  const csv = (process.env.BLOG_AI_MODELS || "").trim();
  if (csv) {
    return [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))];
  }
  const primary = (process.env.BLOG_AI_MODEL || DEFAULT_AI_MODEL).trim();
  return [...new Set([primary, ...DEFAULT_MODEL_FALLBACKS])];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableLlmError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /LLM HTTP 429|LLM HTTP 404|No endpoints|aborted|AbortError|timeout|Empty LLM content|no JSON object|Unexpected token|Expected ['":]|JSON\.parse|is not valid JSON|property name in JSON|Unterminated string|META_JSON|BODY_HTML/i.test(
    msg,
  );
}

function aiHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if ((process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL).includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.SITE_URL ?? SITE.url;
    headers["X-Title"] = "recenze-ceny-blog";
  }
  return headers;
}

async function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "RecenzeCenyBlogBot/1.0 (+https://recenze-ceny.cz)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(html: string): string {
  return decodeXmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(xml: string, re: RegExp): string | null {
  const m = xml.match(re);
  return m?.[1]?.trim() ? decodeXmlEntities(m[1].trim()) : null;
}

function extractImageFromChunk(chunk: string): string | null {
  const enclosure = chunk.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*(?:type=["']image\/[^"']+["'])?/i,
  );
  if (enclosure?.[1] && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(enclosure[1])) {
    return enclosure[1];
  }
  const media = firstMatch(chunk, /<media:content[^>]+url=["']([^"']+)["']/i);
  if (media) return media;
  const thumb = firstMatch(chunk, /<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumb) return thumb;
  const img = firstMatch(chunk, /<img[^>]+src=["']([^"']+)["']/i);
  return img;
}

function parseRssFeed(xml: string, source: BlogRssSource): RssItem[] {
  const items: RssItem[] = [];
  const chunks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const max = source.maxItems ?? 8;

  for (const chunk of chunks.slice(0, max)) {
    const title =
      firstMatch(chunk, /<title[^>]*>([\s\S]*?)<\/title>/i) ??
      firstMatch(chunk, /<media:title[^>]*>([\s\S]*?)<\/media:title>/i);
    const link =
      firstMatch(chunk, /<link[^>]*href=["']([^"']+)["']/i) ??
      firstMatch(chunk, /<link[^>]*>([\s\S]*?)<\/link>/i) ??
      firstMatch(chunk, /<guid[^>]*>([\s\S]*?)<\/guid>/i) ??
      firstMatch(chunk, /<id[^>]*>([\s\S]*?)<\/id>/i);
    if (!title || !link) continue;
    if (!/^https?:\/\//i.test(link)) continue;

    const summaryRaw =
      firstMatch(chunk, /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ??
      firstMatch(chunk, /<description[^>]*>([\s\S]*?)<\/description>/i) ??
      firstMatch(chunk, /<summary[^>]*>([\s\S]*?)<\/summary>/i) ??
      firstMatch(chunk, /<content[^>]*>([\s\S]*?)<\/content>/i) ??
      "";

    const publishedAt =
      firstMatch(chunk, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ??
      firstMatch(chunk, /<published[^>]*>([\s\S]*?)<\/published>/i) ??
      firstMatch(chunk, /<updated[^>]*>([\s\S]*?)<\/updated>/i);

    items.push({
      title: stripTags(title).slice(0, 300),
      link: link.trim(),
      summary: stripTags(summaryRaw).slice(0, 6000),
      imageUrl: extractImageFromChunk(chunk),
      publishedAt,
      source,
    });
  }
  return items;
}

/** Lightweight article body from HTML (no headless). */
function extractArticleText(html: string): { text: string; imageUrl: string | null } {
  const ogImage =
    firstMatch(html, /property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
    firstMatch(html, /content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

  let body =
    firstMatch(html, /<article[\s\S]*?>([\s\S]*?)<\/article>/i) ??
    firstMatch(html, /<main[\s\S]*?>([\s\S]*?)<\/main>/i) ??
    firstMatch(html, /<div[^>]+class=["'][^"']*(?:article|entry|post|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ??
    html;

  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");

  const text = stripTags(body).slice(0, 12000);
  return { text, imageUrl: ogImage };
}

function contentHash(sourceUrl: string, text: string): string {
  return createHash("sha256").update(`${sourceUrl}\n${text}`).digest("hex").slice(0, 40);
}

async function alreadyIngested(sourceUrl: string, hash: string): Promise<boolean> {
  const byUrl = await supabaseAdmin
    .from("blog_posts")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();
  if (byUrl.data) return true;

  const byHash = await supabaseAdmin
    .from("blog_posts")
    .select("id")
    .eq("content_hash", hash)
    .maybeSingle();
  return Boolean(byHash.data);
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("LLM response has no JSON object");
  return JSON.parse(body.slice(start, end + 1));
}

/**
 * Free-tier models often break JSON by putting raw " inside body_html.
 * Accept either a single JSON object, or:
 *   META_JSON: {...}
 *   BODY_HTML:
 *   <p>...
 */
function parseLlmPayload(raw: string): Record<string, unknown> {
  const text = raw.trim();
  const metaMark = text.match(/META_JSON:\s*/i);
  const bodyMark = text.match(/\nBODY_HTML:\s*\n?/i);
  if (metaMark && bodyMark && bodyMark.index != null) {
    const metaStart = (metaMark.index ?? 0) + metaMark[0].length;
    const metaSlice = text.slice(metaStart, bodyMark.index);
    const html = text.slice(bodyMark.index + bodyMark[0].length).trim();
    const meta = extractJsonObject(metaSlice) as Record<string, unknown>;
    return { ...meta, body_html: html };
  }
  return extractJsonObject(text) as Record<string, unknown>;
}

async function rewriteWithLlmOnce(
  input: {
    title: string;
    sourceName: string;
    sourceUrl: string;
    text: string;
    shelfChoices: Array<{ slug: string; name: string }>;
    preferredShelf: string | null;
  },
  model: string,
): Promise<LlmArticle> {
  const cfg = aiConfig();
  if (!cfg) throw new Error("Missing AI_API_KEY / OPENROUTER_API_KEY");

  const shelfSlugs = input.shelfChoices.map((s) => s.slug);

  const system = `Jsi editor českého zdravotního katalogu Recenze Ceny (YMYL).
Úkol: vytvoř UNIQUE český článek pro blog — ne překlad věta-za-větu a ne kopie zdroje.
Pravidla:
- Piš česky (cs-CZ), srozumitelně pro laiky.
- Nevyprávěj neexistující studie, čísla ani citace lékařů.
- Nepropaguj konkrétní léčiva jako zázrak; doplňky stravy nenahrazují léčbu.
- HTML body — povolené tagy: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <br>,
  <table>, <thead>, <tbody>, <tr>, <th>, <td>, <caption>,
  <div class="editorial-table-wrap">, <aside class="editorial-callout">.
  Zakázáno: <script>, <a href>, inline style=, jiné class než editorial-callout / editorial-callout-title / editorial-table-wrap.
- Struktura body_html (povinné):
  1) ≥1 odrážkový seznam <ul><li>…</li></ul>
  2) ≥1 číslovaný seznam <ol><li>…</li></ol> (kroky / „co zvážit“)
  3) přesně 1 callout:
     <aside class="editorial-callout"><p class="editorial-callout-title">…</p><p>…</p></aside>
  4) 0–1 tabulka (srovnání / fakta), vždy v obalu:
     <div class="editorial-table-wrap"><table><caption>…</caption><thead>…</thead><tbody>…</tbody></table></div>
- Vlož přesně jeden marker ${BLOG_PRODUCTS_MARKER} uprostřed článku po uzavřeném odstavci <p> (ne hned pod H2).
- Na konci body_html můžeš zmínit název zdroje textem (bez odkazu / bez URL).
- category_slug MUSÍ být přesně preferred_category_slug (jediná povolená kategorie pro tento článek).
- Piš článek tak, aby dával smysl u doplňků v této kategorii; neodbíhej k diplomacii / institucionálním tiskovkám.
- faq: 0–3 položky {q,a} nebo [].
Formát odpovědi (povinný, bez markdown fence):
META_JSON: {"title":"...","excerpt":"...","meta_title":"...","meta_description":"...","category_slug":"...","faq":[]}
BODY_HTML:
<p>…celý HTML článek…</p>
(V META_JSON nepiš body_html. V HTML atributech používej jen jednoduché uvozovky: class='editorial-callout'.)`;

  const user = JSON.stringify({
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    original_title: input.title,
    source_text: input.text.slice(0, 5500),
    preferred_category_slug: input.preferredShelf,
    allowed_categories: input.shelfChoices,
    allowed_category_slugs: shelfSlugs,
    output_format: {
      META_JSON: {
        title: "string",
        excerpt: "string ≤ 220 chars",
        meta_title: "string 40–60 chars",
        meta_description: "string 120–158 chars",
        category_slug: "preferred_category_slug",
        faq: [{ q: "string", a: "string" }],
      },
      BODY_HTML: "html string (no META fields)",
    },
  });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      signal: ctrl.signal,
      headers: aiHeaders(cfg.apiKey),
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 240)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty LLM content");
    const parsed = parseLlmPayload(content);

    const faqRaw = Array.isArray(parsed.faq) ? parsed.faq : [];
    const faq: BlogFaqItem[] = [];
    for (const item of faqRaw) {
      if (!item || typeof item !== "object") continue;
      const q = String((item as { q?: unknown }).q ?? "").trim();
      const a = String((item as { a?: unknown }).a ?? "").trim();
      if (q && a) faq.push({ q, a });
    }

    const preferred =
      input.preferredShelf && shelfSlugs.includes(input.preferredShelf)
        ? input.preferredShelf
        : null;
    if (!preferred) {
      throw new Error("rewriteWithLlm requires a preferredShelf present in stocked shelves");
    }

    return {
      title: String(parsed.title ?? input.title).trim().slice(0, 160),
      excerpt: String(parsed.excerpt ?? "").trim().slice(0, 280),
      body_html: String(parsed.body_html ?? "").trim(),
      meta_title: String(parsed.meta_title ?? parsed.title ?? input.title).trim().slice(0, 70),
      meta_description: String(parsed.meta_description ?? parsed.excerpt ?? "")
        .trim()
        .slice(0, 170),
      category_slug: preferred,
      faq: faq.slice(0, 3),
    };
  } finally {
    clearTimeout(t);
  }
}

async function rewriteWithLlm(input: {
  title: string;
  sourceName: string;
  sourceUrl: string;
  text: string;
  shelfChoices: Array<{ slug: string; name: string }>;
  preferredShelf: string | null;
}): Promise<LlmArticle> {
  const models = resolveModelChain();
  let lastErr: unknown;
  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]!;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (mi > 0 || attempt > 0) {
          console.log(`[blog-ingest] LLM try model=${model} attempt=${attempt + 1}`);
        }
        return await rewriteWithLlmOnce(input, model);
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[blog-ingest] LLM fail model=${model}: ${msg.slice(0, 160)}`);
        if (/LLM HTTP 429/.test(msg) && attempt === 0) {
          await sleep(LLM_429_BACKOFF_MS);
          continue;
        }
        if (isRetryableLlmError(e)) break; // next model
        throw e;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Products only from the article shelf — never fill from unrelated catalog niches. */
function pickProductIdsFromShelf(
  offersByShelf: Map<string, Offer[]>,
  categorySlug: string,
  count = TARGET_PRODUCTS,
): string[] {
  const pool = offersByShelf.get(categorySlug) ?? [];
  if (pool.length < MIN_PRODUCTS) return [];
  const unique = pickRandomUniqueBrandOffers(pool, Math.min(count, pool.length));
  // Unique-brand sampling can undershoot on thin niches — pad from same shelf only.
  if (unique.length >= MIN_PRODUCTS) return unique.map(offerProductKey);
  const used = new Set(unique.map(offerProductKey));
  const pad = pool.filter((o) => !used.has(offerProductKey(o))).slice(0, count - unique.length);
  const merged = [...unique, ...pad];
  return merged.length >= MIN_PRODUCTS ? merged.map(offerProductKey) : [];
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function runBlogIngest(opts: BlogIngestOptions = {}): Promise<BlogIngestResult> {
  const limit = Math.max(1, Math.min(opts.limit ?? 3, 10));
  const status: BlogPostStatus = opts.status === "draft" ? "draft" : "published";
  const dryRun = Boolean(opts.dryRun);
  const sources = opts.sources ?? BLOG_RSS_SOURCES;
  console.log(`[blog-ingest] model chain: ${resolveModelChain().join(" → ")}`);

  const result: BlogIngestResult = {
    scanned: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    slugs: [],
  };

  const { shelves, offersByShelf } = await loadStockedBlogShelves(MIN_PRODUCTS);
  if (!shelves.length) {
    result.errors.push("No stocked supplement shelves with enough products for blog blocks");
    return result;
  }
  const shelfChoices = shelfChoicesForPrompt(shelves);
  console.log(`[blog-ingest] stocked shelves (${shelves.length}): ${shelves.join(", ")}`);

  const candidates: RssItem[] = [];
  for (const source of sources) {
    try {
      const xml = await fetchText(source.feedUrl);
      const items = parseRssFeed(xml, source);
      candidates.push(...items);
      console.log(`[blog-ingest] ${source.id}: ${items.length} items`);
    } catch (e) {
      const msg = `${source.id}: ${e instanceof Error ? e.message : String(e)}`;
      result.errors.push(msg);
      console.warn("[blog-ingest] feed error:", msg);
    }
  }

  for (const item of candidates) {
    if (result.inserted >= limit) break;
    result.scanned += 1;

    try {
      let articleText = item.summary;
      let imageUrl = item.imageUrl;
      try {
        const html = await fetchText(item.link);
        const extracted = extractArticleText(html);
        if (extracted.text.length > articleText.length) articleText = extracted.text;
        if (!imageUrl && extracted.imageUrl) imageUrl = extracted.imageUrl;
      } catch {
        /* RSS summary fallback */
      }

      if (articleText.length < 280) {
        result.skipped += 1;
        continue;
      }

      const preferredShelf = hintShelfFromText(item.title, articleText);
      if (!preferredShelf || !shelves.includes(preferredShelf)) {
        console.log(
          `[blog-ingest] skip (no catalog niche match): ${item.title.slice(0, 80)} → ${preferredShelf ?? "none"}`,
        );
        result.skipped += 1;
        continue;
      }

      const hash = contentHash(item.link, articleText);
      if (!dryRun && (await alreadyIngested(item.link, hash))) {
        result.skipped += 1;
        continue;
      }

      const rewritten = await rewriteWithLlm({
        title: item.title,
        sourceName: item.source.name,
        sourceUrl: item.link,
        text: articleText,
        shelfChoices,
        preferredShelf,
      });

      if (rewritten.body_html.length < 400) {
        result.skipped += 1;
        continue;
      }

      const bodyHtml = ensureBlogProductsMarker(sanitizeBlogHtml(rewritten.body_html));

      // Title-hint shelf only — LLM category is ignored.
      const categorySlug = preferredShelf;
      if (!shelves.includes(categorySlug)) {
        console.log(`[blog-ingest] skip (shelf not stocked): ${categorySlug}`);
        result.skipped += 1;
        continue;
      }

      const productIds = pickProductIdsFromShelf(offersByShelf, categorySlug, TARGET_PRODUCTS);
      if (productIds.length < MIN_PRODUCTS) {
        console.log(`[blog-ingest] skip (thin product pool): ${categorySlug}`);
        result.skipped += 1;
        continue;
      }

      const slugBase = blogSlugFromTitle(rewritten.title);
      const slug = dryRun ? slugBase : await ensureUniqueSlug(slugBase);

      const coverPath =
        imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl.trim() : null;
      const coverCredit = coverPath ? item.source.name : null;

      const publishedAt = status === "published" ? new Date().toISOString() : null;

      if (dryRun) {
        console.log(
          `[blog-ingest] dry-run would insert /clanky/${slug} → ${categorySlug} products=${productIds.length}`,
        );
        result.inserted += 1;
        result.slugs.push(slug);
        continue;
      }

      const { error } = await supabaseAdmin.from("blog_posts").insert({
        slug,
        title: rewritten.title,
        excerpt: rewritten.excerpt || null,
        body_html: bodyHtml,
        meta_title: rewritten.meta_title || null,
        meta_description: rewritten.meta_description || null,
        category_slug: categorySlug,
        cover_image_path: coverPath,
        cover_credit: coverCredit,
        source_url: item.link,
        source_name: item.source.name,
        product_ids: productIds,
        faq: rewritten.faq,
        status,
        published_at: publishedAt,
        content_hash: hash,
      });

      if (error) {
        result.errors.push(`${item.link}: ${error.message}`);
        continue;
      }

      result.inserted += 1;
      result.slugs.push(slug);
      console.log(`[blog-ingest] inserted /clanky/${slug} [${categorySlug}] products=${productIds.length}`);
    } catch (e) {
      const msg = `${item.link}: ${e instanceof Error ? e.message : String(e)}`;
      result.errors.push(msg);
      console.warn("[blog-ingest] item error:", msg);
    }
  }

  return result;
}
