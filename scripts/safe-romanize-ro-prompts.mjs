/**
 * Safe German→Czech Republicn for RO prompt STRING content only (phrases >= 8 chars, no single-word ID breaks).
 * Run: node scripts/safe-czechize-cz-prompts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  "src/lib/ai-content.ro-prompts.ts",
  "src/lib/ai-content.examples.ro.ts",
];

const PHRASES = [
  ["=== KURZFELDER PENTRU ACEST PRODUS ===", "=== CÂMPURI SCURTE PENTRU ACEST PRODUS ==="],
  ["=== KURZFELDER — formă din feed/Landing (joint-care) ===", "=== CÂMPURI SCURTE — formă din feed/Landing (joint-care) ==="],
  ["Saubere Marcă", "Marcă curată"],
  ["H1 țintă (aus feed + formă)", "H1 țintă (din feed + formă)"],
  ["H1 țintă (aus feed-rol)", "H1 țintă (din rolul feed-ului)"],
  ["rol produs (aus titlu feed)", "rol produs (din titlul feed-ului)"],
  ["rol produs (aus feed)", "rol produs (din feed)"],
  ["H1 pagină (automatischer Entwurf)", "H1 pagină (draft automat)"],
  ["Exemple (scrie wie GUT, nu wie SCHLECHT)", "Exemple (scrie BUN, nu RĂU)"],
  ["konsequent in formă aus H1 țintă", "consecvent în formă din H1 țintă"],
  ["curszfelder", "câmpuri scurte"],
  ["OHNE brand", "Fără brand"],
  ["echten beneficiu", "beneficiu real"],
  ["concreter beneficiu", "beneficiu concret"],
  ["concreten beneficiu", "beneficiu concret"],
  ["gleicher stil descriptor wie title", "același stil de descriptor ca title"],
  ["einheitlicher stil descriptor", "stil unitar de descriptor"],
  ["in einem Feld", "într-un câmp"],
  ["concrete formă in einem anderen", "formă concretă în alt câmp"],
  ["Exemple BUNE pentru dieses produs", "Exemple BUNE pentru acest produs"],
  ["statt «", "în loc de «"],
  ["bedeutet oft", "înseamnă adesea"],
  ["aber produs este", "dar produsul este"],
  ["aber când", "dar când"],
  ["aber InsuLevel", "dar InsuLevel"],
  ["aber când titlu", "dar când titlul"],
  ["aber când în brief", "dar când în brief formă"],
  ["ortopedices Hilfscutel", "dispozitiv ortopedic"],
  ["statt Auftrag", "în loc de aplicare topică"],
  ["Spray-aplicare", "aplicare spray"],
  ["Der automatische Klassifikator kannte fără categorie", "Clasificatorul automat nu a găsit categorie"],
  ["Die categoria paginii passt posibil nu zum descriptor feed", "Categoria paginii poate să nu corespundă descriptorului din feed"],
  ["nutze diesen text", "folosește acest text"],
  ["bedeutet NU Categorie", "NU înseamnă categoria"],
  ["nur accesorii auto", "doar accesorii auto"],
  ["ordne «car» nu înnerhalb de la detoxifiere zu", "nu asocia «auto» cu detoxifiere"],
  ["In einem generischen bucket", "Într-un bucket generic"],
  ["liegen oft SKU anderer Nischen", "se află adesea SKU din alte nișe"],
  ["Lies **Landing-titlu**", "Citește **titlul landing-ului**"],
  ["feed-Ende", "sfârșitul feed-ului"],
  ["brand allein", "doar brandul"],
  ["wie Benaga", "ca Benaga"],
  ["poate mehrere Nischen au", "poate avea mai multe nișe"],
  ["Tail/Landing-titlu lesen", "citește tail-ul/titlul landing-ului"],
  ["Weitere Exemple", "Alte exemple"],
  ["modellierende Bekleidung", "îmbrăcăminte modelatoare"],
  ["Funktionsbrille", "ochelari funcționali"],
  ["camerăheizung", "încălzitor de cameră"],
  ["Medizinischer feed", "Feed medical"],
  ["passende Nischenkategorie", "categoria de nișă potrivită"],
  ["nutze slug", "folosește slug"],
  ["Erlaubte slugs", "Slug-uri permise"],
  ["wie oben gezeigt", "ca mai sus"],
  ["klicken Sie pe Bild", "click pe imagine"],
  ["Gemischter feed", "Feed mixt"],
  ["in Kyrillisch oder Sprachmischung belassen", "în chirilic sau amestec de limbi"],
  ["Wohlbefinden prostată", "bunăstare prostatică"],
  ["4–6 Punkten", "4–6 puncte"],
  ["probabilă materiale aus numen", "materiale probabile din nume"],
  ["detalii probabile aus numen", "detalii probabile din nume"],
  ["nu aus categorie catalog", "nu din categoria catalog"],
  ["SCHlage 4–6 concrete Punkte", "Propune 4–6 puncte concrete"],
  ["Zusammensetzungs-Block", "bloc compoziție"],
  ["wie în EXEMPLU COMPLET", "ca în EXEMPLU COMPLET"],
  ["h2 wie în Exemplu", "h2 ca în exemplu"],
  ["Saubere brand + concrete rol", "Brand curat + rol concret din brief"],
  ["Keine irrelevanten termeni generali", "Fără termeni generali irelevanți"],
  ["6–12 cuvinten", "120–155 caractere"],
  ["SCHLECHT, când EU/ES/IT/SI/LOW/2.0 enthalten este", "RĂU dacă conține EU/ES/IT/SI/LOW/2.0"],
  ["Lateinische brand neschimbat", "Brand latin neschimbat"],
  ["OHNE feed-Codes", "Fără coduri feed"],
  ["concrete rol", "rol concret"],
  ["rol produs aus feed/Landing hat Vorrang", "rolul produsului din feed/landing are prioritate"],
  ["scrie in dieser Krankheitssprache", "scrie în limbajul acestei afecțiuni"],
  ["auch la nume brandn fără descriptor feed", "chiar dacă numele brandului nu are descriptor în feed"],
  ["când rol aus titlu eindeutig este", "când rolul din titlu este clar"],
  ["VOCABULAR PROBLEMĂ (aus feed", "VOCABULAR PROBLEMĂ (din feed"],
  ["dieselbe formă", "aceeași formă"],
  ["formă widerspricht rol produs", "formă contrazice rolul produsului"],
  ["nu contradictorie H1 pagină prelua", "nu prelua H1 pagină contradictoriu"],
  ["ein produs pentru uz casnic", "un produs pentru uz casnic"],
  ["Unten finden Sie Zusammensetzung", "Mai jos găsiți compoziția"],
  ["hat produs un elegantes Design", "produsul are un design elegant"],
  ["Gebrauchshinweise", "instrucțiuni de utilizare"],
  ["bestellbar în Česká republika", "disponibil la comandă în Česká republika"],
  ["4 ingredienten", "4 ingrediente"],
  ["in vor Anwendung un medic", "înainte de utilizare un medic"],
  ["Gelenkbeweglichkeit / Komfort la Belastung", "mobilitate articulară / confort la efort"],
  ["in selben text amesteca", "în același text amesteca"],
  ["nume spricht nu de la Brillen", "numele nu indică ochelari"],
  ["fără supliment sunt", "nu sunt suplimente"],
  ["formăă", "formă"],
  ["adminesterare", "administrare"],
  ["cosmeticăum", "cosmetică"],
  ["sesteem nervos", "sistem nervos"],
  ["Lies **Landing-URL**", "Citește **URL-ul landing-ului**"],
  ["intenție de cumpărare Besuchers", "intenția de cumpărare a vizitatorului"],
  ["auch când feed nur einen nume brandn", "chiar dacă feed-ul menționează doar brandul"],
  ["stimmen coincid", "coincid"],
  ["behalte beide în text", "păstrează ambele în text"],
  ["este korrekt, aber scrie in Krankheitssprache din feed", "este corect, dar scrie în limbajul afecțiunii din feed"],
  ["nu cu generale descriptor-eufemisme", "nu cu eufemisme generice de descriptor"],
  ["FORM-HINWEIS", "NOTĂ FORMĂ"],
  ["adminesterare orală", "administrare orală"],
  ["«Automatisch»", "«Automat»"],
];

for (const rel of TARGETS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, "utf8");
  const sorted = [...PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) t = t.split(from).join(to);
  fs.writeFileSync(p, t, "utf8");
  console.log("romanized", rel);
}

console.log("safe-czechize-cz-prompts: done");
