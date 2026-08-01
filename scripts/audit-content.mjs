/**
 * Content quality audit — scans product_content for systemic SEO issues.
 *
 * Usage:
 *   node scripts/audit-content.mjs
 *   node scripts/audit-content.mjs --fail-on brand-parity,placeholder
 *   node scripts/audit-content.mjs --limit 2000 --source kma
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1].trim()] = v;
  }
  return env;
}

const env = loadEnv();
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLES = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",
  terraleads: "terraleads_offers",
};

const SOURCES = ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes", "terraleads"];

const PLACEHOLDER_MARKERS = [
  "доступний до замовлення",
  "доступен к заказу",
  "дієтична добавка",
  "диетическая добавка",
  "косметичним засобом",
  "косметическим средством",
  "disponibile per l'ordine",
  "integratore alimentare",
  "prodotto cosmetico",
  "dispositivo per uso domestico",
];

const MEDICAL_DISCLAIMER_MARKERS = [
  "дієтична добавка",
  "диетическая добавка",
  "косметичним засобом",
  "косметическим средством",
  "integratore alimentare",
  "prodotto cosmetico",
  "non un medicinale",
  "non medicinale",
];

const NON_MEDICAL_CATEGORIES = new Set([
  "modni-doplnky", "boty", "obleceni", "autodoplnky", "autodoplnky",
  "domaci-potreby", "domaci-klima", "domaci-textil", "domaci-vychytavky",
  "hracky", "outdoor-kempovani", "kosmeticke-nastroje", "zahradni-naradi", "zahrada",
  "osobni-pece", "optika", "vyhrivane-obleceni", "masazni-pristroje", "electronics",
]);

const YMYL_CATEGORIES = new Set([
  "cukrovka", "krevni-tlak", "detox", "klouby", "mens-vitality",
  "hubnuti", "prostata", "zrak", "intimate-comfort",
  "zdravi-zen", "plisen-nehtu", "krecove-zily", "lupenka", "alkoholismus",
  "odvykani-koureni", "cystitida", "sluch", "vboceny-palec", "vypadavani-vlasu",
  "zvetseni-penisu", "zvetseni-prsou", "papilomy", "anti-aging",
  "paraziti", "traveni", "stres", "chrapani",
  "lekarske-pristroje", "masazni-pristroje",
]);

const NICHE_3BLOCK_MARKERS = [
  "основное назначение товара по данным фида",
  "основне призначення товару згідно з даними фіду",
  "кому может подойти",
  "кому може підійти",
  "scopo principale del prodotto secondo i dati del feed",
  "destinazione principale del prodotto",
  "a chi può interessare",
  "a chi può servire",
];

const LATIN_TOKEN_RE = /[A-Za-z][A-Za-z0-9\-+']*/gi;

const CYRILLIC_RE = /[\u0400-\u04FF]/;

function hasCyrillic(text) {
  return CYRILLIC_RE.test(text ?? "");
}

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
  ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "",
  ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ё: "yo",
};

function transliterateAscii(input) {
  let out = "";
  for (const ch of (input ?? "").toLowerCase()) {
    out += TRANSLIT[ch] ?? ch;
  }
  return out.replace(/[^a-z0-9]+/g, "");
}

function headlineDuplicateBrand(title) {
  const s = (title ?? "").trim();
  if (!s) return false;
  if (/^(.+?)\s*[-–—]\s*\1\s*$/iu.test(s)) return true;
  const parts = s.split(/\s*[-–—]\s+/u);
  if (parts.length !== 2) return false;
  const [left, right] = parts.map((p) => p.trim());
  if (!left || !right) return false;
  const nl = transliterateAscii(left);
  const nr = transliterateAscii(right);
  return left.toLowerCase() === right.toLowerCase() || nl === nr || nl.includes(nr) || nr.includes(nl);
}

function extractFirstH2Text(html) {
  const m = (html ?? "").match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { failOn: [], limit: 5000, source: null, slug: null, idsOnly: false, rules: ["cyrillic-leak", "placeholder"] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--fail-on" && args[i + 1]) {
      out.failOn = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (args[i] === "--limit" && args[i + 1]) {
      out.limit = Number(args[++i]) || out.limit;
    } else if (args[i] === "--source" && args[i + 1]) {
      out.source = args[++i];
    } else if (args[i] === "--slug" && args[i + 1]) {
      out.slug = args[++i];
    } else if (args[i] === "--ids-only") {
      out.idsOnly = true;
    } else if (args[i] === "--rules" && args[i + 1]) {
      out.rules = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return out;
}

function countH2(html) {
  return (html?.match(/<h2[^>]*>/gi) ?? []).length;
}

function isPlaceholderHtml(html) {
  if (!html || html.length < 100) return true;
  if (html.length < 400) return true;
  // Rich AI pages often mention delivery — don't flag when clearly full content
  if (html.length >= 1500 && countH2(html) >= 4) return false;
  const lower = html.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m));
}

const GENERIC_BODY_MARKERS = [
  "основне призначення товару згідно з даними фіду",
  "основное назначение товара по данным фида",
  "опис не додає невідомих характеристик чи лікувальних обіцянок",
  "описание не добавляет неподтверждённых характеристик и лечебных обещаний",
  "практичний аксесуар на щодень",
  "практичный аксессуар на каждый день",
  "descritto secondo il feed",
  "senza promesse mediche",
  "senza caratteristiche inventate",
  "articolo pratico per uso quotidiano",
  "prodotto per uso domestico",
  "per uso pratico senza promesse eccessive",
];

function isGenericFallbackBody(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  return GENERIC_BODY_MARKERS.some((m) => lower.includes(m));
}

function isNiche3BlockFallback(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  return NICHE_3BLOCK_MARKERS.filter((m) => lower.includes(m)).length >= 2;
}

function supplementWrongStructure(html, lang) {
  if (!html) return true;
  if (countH2(html) < 5) return true;
  const lower = html.toLowerCase();
  const hasComposition = lang === "uk"
    ? /composiz|principio/i.test(lower)
    : /состав|принцип/i.test(lower);
  const hasIntake = lang === "uk"
    ? /assunz|schema/i.test(lower)
    : /принимать|схем/i.test(lower);
  const hasDelivery = lang === "uk"
    ? /consegna/i.test(lower)
    : /доставк/i.test(lower);
  return !(hasComposition && hasIntake && hasDelivery);
}

function latinTokens(text) {
  return (text?.match(LATIN_TOKEN_RE) ?? []).map((t) => t.toLowerCase());
}

function extractEmbeddedLatin(title) {
  if (!title) return "";
  const tokens = title.match(LATIN_TOKEN_RE) ?? [];
  const plus = tokens.find((t) => t.endsWith("+") && t.length >= 4);
  if (plus) return plus;
  for (const t of tokens) {
    if (t.length >= 4 && /^[A-Z]/.test(t)) return t;
  }
  return "";
}

function brandParityViolation(uk, ru, feedTitle) {
  const embedded = extractEmbeddedLatin(feedTitle ?? "");
  if (!embedded) return null;
  const norm = embedded.toLowerCase();
  const ukHas = (uk ?? "").toLowerCase().includes(norm);
  const ruHas = (ru ?? "").toLowerCase().includes(norm);
  if (ukHas !== ruHas) {
    return { embedded, ukHas, ruHas };
  }
  if (!ukHas && !ruHas) return { embedded, ukHas, ruHas };
  return null;
}

function faqBrandMismatch(h1, faq) {
  if (!h1 || !Array.isArray(faq) || faq.length === 0) return null;
  const h1Latin = new Set(latinTokens(h1));
  const faqText = faq.map((f) => `${f.q} ${f.a}`).join(" ");
  const faqLatin = latinTokens(faqText).filter((t) => t.length >= 4);
  for (const t of faqLatin) {
    if (!h1Latin.has(t)) return t;
  }
  return null;
}

function wrongDisclaimer(html, categorySlug) {
  if (!html || !NON_MEDICAL_CATEGORIES.has(categorySlug)) return false;
  const lower = html.toLowerCase();
  return MEDICAL_DISCLAIMER_MARKERS.some((m) => lower.includes(m));
}

async function findOfferBySlug(slug) {
  const idMatch = slug.match(/-(\d+)$/);
  const offerId = idMatch ? Number(idMatch[1]) : null;
  for (const [source, table] of Object.entries(TABLES)) {
    if (offerId) {
      const { data } = await sb.from(table).select("offer_id,title,slug,category").eq("offer_id", offerId).maybeSingle();
      if (data) return { source, ...data };
    }
    const { data } = await sb.from(table).select("offer_id,title,slug,category").eq("slug", slug).maybeSingle();
    if (data) return { source, ...data };
  }
  return null;
}

async function auditRow(row, offerMeta, categorySlug) {
  const issues = [];
  const feedTitle = offerMeta?.title ?? "";

  const parity = brandParityViolation(row.display_title_uk, row.display_title_ru, feedTitle);
  if (parity) {
    issues.push({
      rule: "brand-parity",
      detail: `Latin brand "${parity.embedded}" uk=${parity.ukHas} ru=${parity.ruHas}`,
    });
  }

  for (const lang of ["uk", "ru"]) {
    const title = row[`display_title_${lang}`];
    if (headlineDuplicateBrand(title)) {
      issues.push({ rule: "headline-duplicate-brand", lang, detail: title });
    }
  }

  for (const lang of ["uk", "ru"]) {
    const h1 = row[`display_title_${lang}`];
    const html = row[`description_html_${lang}`];
    const faq = row[`faq_${lang}`];
    const metaDesc = row[`meta_desc_${lang}`];

    if (lang === "uk") {
      const visibleBlob = [
        h1,
        metaDesc,
        html,
        ...(Array.isArray(faq) ? faq.map((f) => `${f.q} ${f.a}`) : []),
      ].filter(Boolean).join(" ");
      if (hasCyrillic(visibleBlob)) {
        issues.push({ rule: "cyrillic-leak", lang, detail: "Cyrillic text in IT content slot" });
      }
    }

    if (isPlaceholderHtml(html)) {
      issues.push({ rule: "placeholder", lang, detail: `description_html ${html?.length ?? 0} chars` });
    }

    if (wrongDisclaimer(html, categorySlug)) {
      issues.push({ rule: "disclaimer-mismatch", lang, detail: `medical disclaimer on ${categorySlug}` });
    }

    const firstH2 = extractFirstH2Text(html);
    if (h1 && firstH2 && h1.toLowerCase() === firstH2.toLowerCase()) {
      issues.push({ rule: "h1-equals-first-h2", lang, detail: h1 });
    }

    const faqBrand = faqBrandMismatch(h1, faq);
    if (faqBrand) {
      issues.push({ rule: "faq-brand-mismatch", lang, detail: `FAQ mentions "${faqBrand}" not in H1` });
    }

    if (isPlaceholderHtml(html) && Array.isArray(faq) && faq.length >= 3) {
      issues.push({ rule: "placeholder-faq-split", lang, detail: "rich FAQ with placeholder body" });
    }

    if (isGenericFallbackBody(html) && Array.isArray(faq) && faq.length >= 3) {
      const faqLen = faq.map((f) => `${f.q} ${f.a}`).join(" ").length;
      if (faqLen > (html?.length ?? 0) * 1.2) {
        issues.push({ rule: "body-not-product-specific", lang, detail: "generic body + richer FAQ" });
      }
    }

    if (YMYL_CATEGORIES.has(categorySlug) && isNiche3BlockFallback(html)) {
      issues.push({ rule: "ymyl-generic-fallback", lang, detail: "3-block niche fallback on YMYL category" });
    }

    if (
      categorySlug === "mens-vitality" ||
      ["klouby", "krevni-tlak", "prostata", "hubnuti"].includes(categorySlug)
    ) {
      if (supplementWrongStructure(html, lang)) {
        issues.push({ rule: "supplement-wrong-structure", lang, detail: `h2=${countH2(html)} missing supplement blocks` });
      }
    }

    if (
      (row.qa_status_uk === "ok" || row.qa_status_ru === "ok") &&
      isNiche3BlockFallback(html)
    ) {
      issues.push({ rule: "tier-body-mismatch", lang, detail: "qa_status=ok but 3-block fallback body" });
    }
  }

  return issues;
}

async function main() {
  const opts = parseArgs();
  const sources = opts.source ? [opts.source] : SOURCES;
  const counts = {};
  const samples = {};
  const targets = new Set();
  let scanned = 0;

  const bump = (rule, sample) => {
    counts[rule] = (counts[rule] ?? 0) + 1;
    if (!samples[rule]) samples[rule] = [];
    if (samples[rule].length < 5) samples[rule].push(sample);
  };

  if (opts.slug) {
    const offer = await findOfferBySlug(opts.slug);
    if (!offer) {
      console.error(`Offer not found: ${opts.slug}`);
      process.exit(1);
    }
    const { data: pc } = await sb
      .from("product_content")
      .select("*")
      .eq("source", offer.source)
      .eq("offer_id", offer.offer_id)
      .maybeSingle();
    if (!pc) {
      console.error("No product_content row");
      process.exit(1);
    }
    const issues = await auditRow(pc, offer, offer.category ?? "other");
    console.log(JSON.stringify({ slug: opts.slug, issues, pc }, null, 2));
    process.exit(issues.length > 0 ? 1 : 0);
  }

  for (const source of sources) {
    const table = TABLES[source];
    if (!table) {
      console.warn(`[audit] unknown source: ${source}, skipping`);
      continue;
    }

    const { data: rows, error } = await sb
      .from("product_content")
      .select("offer_id,source,display_title_uk,display_title_ru,meta_desc_uk,meta_desc_ru,description_html_uk,description_html_ru,faq_uk,faq_ru,qa_status_uk,qa_status_ru,form_kind")
      .eq("source", source)
      .limit(opts.limit);
    if (error) {
      console.warn(`[audit] ${source} query failed:`, error.message);
      continue;
    }

    const offerIds = (rows ?? []).map((r) => r.offer_id);
    const { data: offers } = await sb
      .from(table)
      .select("offer_id,title,slug,category")
      .in("offer_id", offerIds.length ? offerIds : [-1]);
    const offerMap = new Map((offers ?? []).map((o) => [o.offer_id, o]));

    for (const row of rows ?? []) {
      scanned += 1;
      const offer = offerMap.get(row.offer_id);
      const categorySlug = offer?.category ?? "other";
      const issues = await auditRow(row, offer, categorySlug);
      if (opts.idsOnly) {
        for (const issue of issues) {
          if (opts.rules.includes(issue.rule)) {
            targets.add(`${source}:${row.offer_id}`);
          }
        }
        const htmlLen = (row.description_html_uk ?? "").length;
        if (row.qa_status_uk === "failed" || htmlLen < 400) {
          targets.add(`${source}:${row.offer_id}`);
        }
      }
      for (const issue of issues) {
        bump(issue.rule, {
          source,
          offer_id: row.offer_id,
          slug: offer?.slug,
          ...issue,
        });
      }
    }
  }

  if (opts.idsOnly) {
    for (const t of [...targets].sort()) console.log(t);
    console.error(`# audit targets: ${targets.size} offers`);
    return;
  }

  console.log(`\n${"=".repeat(60)}\nContent audit — scanned ${scanned} rows\n`);
  for (const [rule, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule}: ${n}`);
    for (const s of samples[rule] ?? []) {
      console.log(`    - ${s.source}/${s.offer_id} ${s.slug ?? ""} ${s.detail ?? ""}`);
    }
  }

  if (opts.failOn.length > 0) {
    const failed = opts.failOn.filter((r) => (counts[r] ?? 0) > 0);
    if (failed.length > 0) {
      console.error(`\nFAIL on rules: ${failed.join(", ")}`);
      process.exit(1);
    }
    console.log(`\nOK — no failures for: ${opts.failOn.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
