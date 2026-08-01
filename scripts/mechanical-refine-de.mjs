/**
 * Second-pass mechanical PL→DE refinement on *.de.ts modules.
 * Run after gen-de-from-pl. Optional LLM pass: npm run translate:ui:cz
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PHRASES = [
  ["Berater medyczny", "Medizinischer Berater"],
  ["Recenzentka kliniczna", "Klinische Prüferin"],
  ["dr Carmen Ruiz", "Dr. Thomas Müller"],
  ["Dr Carmen Ruiz", "Dr. Thomas Müller"],
  ["lekarz rodzinny, dietetyk", "Facharzt für Allgemeinmedizin, Ernährungsmedizin"],
  ["Izba Lekarska, nr 2018-28451", "Bundesärztekammer, Nr. DE-2018-28451"],
  ["lat doświadczenia klinicznego", "Jahre klinische Erfahrung"],
  ["to lekarz rodzinny i dietetyk z ponad 16-letnim doświadczeniem klinicznym. Ukończyła Warszawski Uniwersytet Medyczny i specjalizację z medycyny żywieniowej. Jej obszary praktyki obejmują kontrolę masy ciała, zdrowie układu krążenia, metabolizm i żywienie funkcjonalne. Jako Berater medyczny w", "ist Facharzt für Allgemeinmedizin und Ernährungsmedizin mit über 16 Jahren klinischer Erfahrung. Er absolvierte die Charité – Universitätsmedizin Praha und ist spezialisiert auf Ernährungsmedizin. Schwerpunkte: Gewichtsmanagement, Herz-Kreislauf-Gesundheit, Stoffwechsel und funktionelle Ernährung. Als medizinischer Berater bei"],
  ["weryfikuje opisy produktów, skład, ostrzeżenia bezpieczeństwa i FAQ, aby treści były klinicznie poprawne, rzetelne i bezpieczne dla klientów in Deutschland.", "prüft Produktbeschreibungen, Inhaltsstoffe, Sicherheitshinweise und FAQ auf fachliche Korrektheit und Verbrauchersicherheit in Deutschland."],
  ["Proces recenzji", "Prüfprozess"],
  ["Przed publikacją na", "Vor der Veröffentlichung auf"],
  ["każdy opis kategorii i produktu przechodzi te kroki:", "durchläuft jede Kategorie- und Produktbeschreibung diese Schritte:"],
  ["Kliniczna weryfikacja opisów produktów i składu", "Klinische Prüfung von Produktbeschreibungen und Inhaltsstoffen"],
  ["Sprawdzanie ostrzeżeń bezpieczeństwa i przeciwwskazań", "Prüfung von Sicherheitshinweisen und Kontraindikationen"],
  ["Nadzór nad kliniczną poprawnością FAQ", "Aufsicht über die fachliche Korrektheit der FAQ"],
  ["Wsparcie doradcze w kwestiach dotyczących produktów", "Beratende Unterstützung bei produktbezogenen Fragen"],
  ["Ważna informacja", "Wichtiger Hinweis"],
  ["Produkty na naszej platformie to", "Die Produkte auf unserer Plattform sind"],
  ["— nie leki. Recenzja naszej doradczyni medycznej zapewnia kliniczną poprawność treści; nie zastępuje indywidualnej konsultacji lekarskiej. Przed przyjęciem jakiegokolwiek suplementu — zwłaszcza jeśli przyjmujesz leki, jesteś w ciąży lub masz chorobę przewlekłą —", "— keine Arzneimittel. Die medizinische Prüfung gewährleistet fachliche Korrektheit; sie ersetzt keine individuelle ärztliche Beratung. Vor der Einnahme eines Nahrungsergänzungsmittels — insbesondere bei Medikamenteneinnahme, Schwangerschaft oder chronischen Erkrankungen —"],
  ["z ponad", "mit über"],
  ["-letnim doświadczeniem klinicznym weryfikuje opisy produktów i ostrzeżenia bezpieczeństwa na", "Jahren klinischer Erfahrung prüft Produktbeschreibungen und Sicherheitshinweise auf"],
  ["Medycyna rodzinna", "Allgemeinmedizin"],
  ["Dietetyka", "Ernährungsmedizin"],
  ["Warszawski Uniwersytet Medyczny", "Charité – Universitätsmedizin Praha"],
  ["Deutschisch", "Deutschland"],
  ["Wszystkie produkty", "Alle Produkte"],
  ["Pełny katalog", "Vollständiger Katalog"],
  ["zweryfikowanych naturalnych produktów", "geprüfter natürlicher Produkte"],
  ["darmowa dostawa na terenie całej", "kostenlose Lieferung in ganz"],
  ["Obsługa i dostawa", "Service & Lieferung"],
  ["Katalog", "Shop"],
  ["Firma", "Unternehmen"],
  ["Informacje prawne", "Rechtliches"],
  ["Darmowa dostawa Expresskurier na terenie całej", "Kostenlose Express-Lieferung in ganz"],
  ["Zwrot w ciągu 14 dni", "14 Tage Rückgaberecht"],
  ["Oryginalny produkt od producenta", "Originalprodukt vom Hersteller"],
  ["Ostrzeżenie", "Hinweis"],
  ["Wymienione produkty są suplementami diety", "Die genannten Produkte sind Nahrungsergänzungsmittel"],
  ["nie lekami, i nie są przeznaczone do diagnozowania, leczenia ani zapobiegania chorobom", "keine Arzneimittel und nicht zur Diagnose, Behandlung oder Vorbeugung von Krankheiten bestimmt"],
  ["Przed użyciem", "Vor der Anwendung"],
  ["Wszelkie prawa zastrzeżone.", "Alle Rechte vorbehalten."],
  ["Wykonano z ♥ in Deutschland", "Mit ♥ in Deutschland gemacht"],
  ["Płatność", "Zahlung"],
  ["Zwroty", "Rückgabe"],
  ["Prywatność", "Datenschutz"],
  ["Warunki użytkowania", "AGB"],
  ["Strona główna", "Startseite"],
  ["Zweryfikowane produkty zdrowotne z dostawą na terenie całej", "Geprüfte Gesundheitsprodukte mit Lieferung in ganz"],
  ["Katalog zweryfikowanych naturalnych produktów", "Katalog geprüfter natürlicher Produkte"],
  ["Płatność przy odbiorze", "Zahlung bei Lieferung"],
  ["kurierem ekspresowym", "Expresskurier"],
  ["Dyskretne opakowanie", "Diskrete Verpackung"],
  ["14 dni na zwrot", "14 Tage Rückgaberecht"],
  ["100% oryginał od producenta", "100 % Original vom Hersteller"],
  ["Oddzwonimy w 15 minut", "Rückruf innerhalb von 15 Minuten"],
  ["Przeglądaj kategorie", "Kategorien durchsuchen"],
  ["Bestsellery", "Bestseller"],
  ["produktów", "Produkte"],
  ["kategorii", "Kategorien"],
  ["Wybierz według potrzeb", "Nach Bedarf wählen"],
  ["Kategorie produktów", "Produktkategorien"],
  ["Odkryj", "Entdecken"],
  ["Zobacz produkt", "Produkt ansehen"],
  ["Zweryfikowane przez lekarza", "Vom Arzt geprüft"],
  ["Zamów", "Bestellen"],
  ["zł", "€"],
  ["w Polsce", "in Deutschland"],
  ["Polsce", "Deutschland"],
  ["polski", "deutsch"],
  ["Polski", "Deutsch"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name === ".git" || name === ".output") continue;
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".de.ts")) files.push(p);
  }
  return files;
}

let n = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  let t = fs.readFileSync(file, "utf8");
  let next = t;
  for (const [a, b] of PHRASES) next = next.split(a).join(b);
  if (next !== t) {
    fs.writeFileSync(file, next, "utf8");
    n += 1;
    console.log(path.relative(ROOT, file));
  }
}
console.log(`mechanical-refine-de: ${n} files`);
