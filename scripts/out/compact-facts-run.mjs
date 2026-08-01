import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1].trim()] = v;
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ADAPTIVE_MARK = "\u0410\u0434\u0430\u043f\u0442\u0438\u0432";
const MAX_JSON_CHARS = 1500;

function absUrl(url) {
  if (!url) return null;
  const u = String(url).trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`;
}
function isAdaptive(type) {
  return String(type || "").includes(ADAPTIVE_MARK);
}
function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#215;/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}
function fold(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "...";
}
function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const k = fold(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function detectLang(text, url) {
  if (/euit/i.test(url)) return "it";
  if (/\b(gocce|ordina|dimagrimento|chetosi)\b/i.test(text)) return "it";
  if (/cza?-|\bcz\d/i.test(url)) return "cs";
  if (/\b(objednat|pripravek|papilom)\b/i.test(fold(text))) return "cs";
  return "unknown";
}

function detectForm(title, text) {
  const hay = fold(title + " " + text);
  if (/\bgel(u|em|e)?\b/.test(hay)) return "gel";
  if (/\b(kapk|gocce)\b/.test(hay)) return "kapky";
  if (/\bkaps/.test(hay)) return "kapsle";
  if (/\bkrem\b|crema/.test(hay)) return "krem";
  if (/\bsprej\b|spray/.test(hay)) return "sprej";
  if (/\btablet|pillole/.test(hay)) return "tablety";
  return null;
}

function detectRole(text) {
  const t = fold(text);
  if (/papilom|bradavic|condilom|\bhpv\b/.test(t)) return "papilomy";
  if (/zrak|kratkozrak|dioptr|oftalm|occhi|\bvista\b/.test(t)) return "zrak";
  if (/hubnut|chetosi|dimagr|keto|peso in eccesso|w-?loss/.test(t)) return "hubnuti";
  if (/kloub|artr|hondro/.test(t)) return "klouby";
  if (/potenc|erekc|libid/.test(t)) return "potence";
  if (/hemor|prokt|procto/.test(t)) return "proctology";
  return null;
}

function extractDosage(text) {
  const patterns = [
    /(\d+\s*[-?]?\s*\d*\s*(?:kapek|kapky|gocce)[^.]{0,80})/i,
    /(Modalit.\s*d.assunzione[^.]{0,100})/i,
    /(\d+\s*[x\times]\s*denn[^.]{0,60})/i,
    /(\d+-\d+\s*volte al giorno[^.]{0,80})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return clip(m[1], 120);
  }
  return null;
}

function extractH1(html, text) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (m) return clip(textOf(m[1]), 120);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) return clip(textOf(t[1]), 120);
  return clip(text.slice(0, 120), 120);
}

function extractIngredients(text) {
  const f = fold(text);
  const catalog = [
    ["zazvorovy olej", "zazvorovy olej"],
    ["vytazek z kostivalu", "vytazek z kostivalu"],
    ["vytazek z medunky", "vytazek z medunky"],
    ["tokoferol", "tokoferol"],
    ["olej z vonatky citronove", "olej z vonatky citronove"],
    ["olej z cajovniku", "olej z cajovniku"],
    ["skorice", "skorice"],
    ["niacinamid", "niacinamid"],
    ["ananas", "ananas"],
    ["kumquat", "kumquat"],
    ["papaya", "papaya"],
    ["maracuja", "maracuja"],
    ["te verde", "te verde"],
    ["vitamina b6", "vitamina b6"],
    ["vitamina \u04126", "vitamina b6"],
  ];
  const found = [];
  for (const [needle, label] of catalog) {
    if (f.includes(fold(needle))) found.push(label);
  }
  return uniq(found).slice(0, 8);
}

function extractBenefits(text, role) {
  const f = fold(text);
  const cands = [];
  const addIf = (needle, label) => {
    if (f.includes(fold(needle))) cands.push(clip(label, 100));
  };

  if (role === "papilomy") {
    addIf("potlacuje aktivitu virovych bunek", "potlacuje aktivitu virovych bunek");
    addIf("bezbolestne odstranu", "bezbolestne odstranovani utvaru");
    addIf("obnovuje poskozene casti kuze", "obnovuje poskozene casti kuze");
    addIf("48 hodin", "nici puvodce behem 48 hodin");
    addIf("blokuje aktivitu viru", "blokuje aktivitu viru + imunitni obrana");
  } else if (role === "zrak") {
    addIf("ocnich svalu", "obnova funkce ocnich svalu");
    addIf("stav cocky", "zlepseni stavu cocky");
    addIf("laserovou", "ucinek srovnatelny s laserovou korekci");
  } else if (role === "hubnuti") {
    addIf("minimizza l'assunzione di carboidrati", "minimizza assunzione carboidrati");
    addIf("riduce i livelli di glucosio", "riduce glucosio nel sangue");
    addIf("combustione dei grassi", "avvia combustione grassi");
    addIf("20 gocce", "20 gocce accelerano chetosi");
    addIf("assorbimento dei carboidrati", "blocca assorbimento carboidrati");
  }
  return uniq(cands).slice(0, 5);
}

function trimToBudget(facts) {
  const f = {
    ...facts,
    ingredients: [...facts.ingredients],
    benefits: [...facts.benefits],
  };
  if (JSON.stringify(f).length <= MAX_JSON_CHARS) {
    return { facts: f, jsonChars: JSON.stringify(f).length };
  }
  f.notes = null;
  while (JSON.stringify(f).length > MAX_JSON_CHARS && f.benefits.length) f.benefits.pop();
  while (JSON.stringify(f).length > MAX_JSON_CHARS && f.ingredients.length) f.ingredients.pop();
  if (f.h1 && JSON.stringify(f).length > MAX_JSON_CHARS) f.h1 = clip(f.h1, 60);
  return { facts: f, jsonChars: JSON.stringify(f).length };
}

const ids = [5911, 22128, 12649];
const { data, error } = await sb.from("shakes_offers").select("offer_id,title,raw").in("offer_id", ids);
if (error) throw error;
const byId = new Map((data || []).map((r) => [r.offer_id, r]));

const results = [];
for (const id of ids) {
  const row = byId.get(id);
  const landings = (row.raw || {}).landings || [];
  const adapts = landings.filter((l) => isAdaptive(l.type) && l.url);
  const pick = adapts.find((l) => /^cz/i.test(String(l.url))) || adapts[0];
  const sourceUrl = absUrl(pick?.url);
  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0", accept: "text/html", "accept-language": "cs-CZ,cs;q=0.9" },
  });
  const html = await res.text();
  const text = textOf(html);
  if (text.length < 800) {
    results.push({ offerId: id, title: row.title, sourceUrl, facts: null, reason: "thin_landing", jsonChars: 0 });
    continue;
  }
  const role = detectRole(text);
  const draft = {
    offerId: id,
    sourceUrl,
    langHint: detectLang(text, sourceUrl),
    form: detectForm(row.title, text),
    role,
    dosage: extractDosage(text),
    ingredients: extractIngredients(text),
    benefits: extractBenefits(text, role),
    h1: extractH1(html, text),
    notes: null,
  };
  const { facts, jsonChars } = trimToBudget(draft);
  results.push({
    offerId: id,
    title: row.title,
    fullTextChars: text.length,
    jsonChars,
    compression:
      text.length + " -> " + jsonChars + " chars (" + Math.round((100 * jsonChars) / text.length) + "%)",
    facts,
  });
}

mkdirSync("scripts/out", { recursive: true });
writeFileSync("scripts/out/landing-facts-compact.json", JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
