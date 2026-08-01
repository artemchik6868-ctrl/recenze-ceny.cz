/**
 * Mechanical German → Czech Republicn phrase pass for storefront templates.
 * Run after gen-cz-from-hu.mjs: node scripts/mechanical-cz-phrases.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/lib/i18n.ro.ts",
  "src/lib/content.ro.ts",
  "src/lib/legal.ro.ts",
  "src/lib/niche-content.ro.ts",
  "src/lib/lead-errors.ro.ts",
  "src/lib/category-descriptors.ro.ts",
];

const PHRASES = [
  ["mit Livrare in der ganzen Česká republika", "cu livrare în toată Česká republika"],
  ["in der ganzen Česká republika", "în toată Česká republika"],
  ["Curier rapidlieferung", "Livrare rapidă prin curier"],
  ["Curier rapid 2–5 Tage", "Curier rapid 2–5 zile"],
  ["Katalog verifizierter natürlicher Gesundheitsprodukte", "Catalog de produse naturale de sănătate verificate"],
  ["Originalprodukt vom Hersteller", "Produs original de la producător"],
  ["Diskrete Verpackung", "Ambalaj discret"],
  ["14 Tage Rückgaberecht", "Drept de retur 14 zile"],
  ["Wir rufen Sie in 15 Minuten zurück", "Vă sunăm înapoi în 15 minute"],
  ["Kostenloser Expressversand", "Livrare express gratuită"],
  ["Katalog mit", "Catalog cu"],
  ["Natürliche Gesundheitsprodukte", "Produse naturale de sănătate"],
  ["über", "peste"],
  ["Artikel mit", "produse cu"],
  ["verifizierte Produkte in", "produse verificate în"],
  ["ab ", "de la "],
  [" in 2–5 Tagen", " în 2–5 zile"],
  ["Sie zahlen erst bei Erhalt des Pakets", "Plătiți doar la primirea coletului"],
  ["Categorii durchsuchen", "Răsfoiește categoriile"],
  ["Produkte", "produse"],
  ["Kategorien", "categorii"],
  ["Česká republika", "Česká republika"],
  ["Ganz Česká republika", "Toată Česká republika"],
  ["Lieferung in der ganzen Česká republika", "Livrare în toată Česká republika"],
  ["Expresskurierlieferung in der ganzen Česká republika", "Livrare prin curier rapid în toată Česká republika"],
  ["Produkt ansehen", "Vezi produsul"],
  ["Vom Arzt verifiziert", "Verificat de medic"],
  ["Der Katalog wird von", "Catalogul este verificat de"],
  ["Facharzt für Allgemeinmedizin", "medic specialist medicină generală"],
  ["Über Rücksendungen", "Despre retururi"],
  ["Liefertage", "Zile de livrare"],
  ["Zuletzt hinzugefügt", "Adăugate recent"],
  ["Wie wir arbeiten", "Cum lucrăm"],
  ["Transparenter Ansatz für Ihre Gesundheit", "Abordare transparentă pentru sănătatea dvs."],
  ["Wir arbeiten direkt mit Herstellern", "Colaborăm direct cu producătorii"],
  ["Wie man bestellt", "Cum comanzi"],
  ["Drei einfache Schritte zur Lieferung nach Hause", "Trei pași simpli până la livrarea acasă"],
  ["Produkt auswählen", "Alege produsul"],
  ["Stöbern Sie in den Produkten", "Răsfoiți produsele"],
  ["Bestellen", "Comandă"],
  ["Namen und Telefonnummer angeben", "Introduceți numele și telefonul"],
  ["Unser Berater ruft Sie innerhalb von 15 Minuten an", "Consultantul nostru vă sună în 15 minute"],
  ["Bei Lieferung bezahlen", "Plătiți la livrare"],
  ["Das Paket kommt in 2–5 Tagen", "Coletul ajunge în 2–5 zile"],
  ["Sie zahlen bei Lieferung", "Plătiți la livrare"],
  ["Häufig gestellte Fragen", "Întrebări frecvente"],
  ["Wie bezahle ich die Bestellung?", "Cum plătesc comanda?"],
  ["Nur bei Lieferung", "Doar la livrare"],
  ["Wie lange dauert die Lieferung?", "Cât durează livrarea?"],
  ["Werktage", "zile lucrătoare"],
  ["Bestellung", "comandă"],
  ["Datenschutz", "Confidențialitate"],
  ["Impressum", "Informații legale"],
  ["Allgemeine Geschäftsbedingungen", "Termeni și condiții"],
  ["Zurück", "Înapoi"],
  ["Weiter", "Continuă"],
  ["Schließen", "Închide"],
  ["Mehr erfahren", "Află mai mult"],
  ["Jetzt bestellen", "Comandă acum"],
  ["Gratis", "Gratuit"],
  ["Preis", "Preț"],
  ["Bewertungen", "Recenzii"],
  ["Rezensionen", "Recenzii"],
  ["Verfügbar", "Disponibil"],
  ["Nicht verfügbar", "Indisponibil"],
  ["Seite nicht gefunden", "Pagina nu a fost găsită"],
  ["Etwas ist schiefgelaufen", "Ceva nu a mers bine"],
  ["Bitte geben Sie", "Introduceți"],
  ["gültige", "valid"],
  ["Telefonnummer", "număr de telefon"],
  ["Name", "Nume"],
  ["Nachname", "Prenume"],
  ["Stadt", "Oraș"],
  ["Adresse", "Adresă"],
  ["Land", "Țară"],
  ["Deutsch", "Română"],
  ["German", "Czech Republicn"],
  ["Schweiz", "Česká republika"],
  ["Zürich", "Praha"],
  ["CHF", "lei"],
  ["BGN", "lei"],
  ["fromBGN", "fromLei"],
  ["fromCHF", "fromLei"],
  ["Gesundheitsprodukte", "produse de sănătate"],
  ["Gesundheitsprodukt", "produs de sănătate"],
  ["Rückgaberecht", "Drept de retur"],
  ["Kostenloser Versand", "Livrare gratuită"],
  ["vom Hersteller", "de la producător"],
  ["Original vom Hersteller", "Original de la producător"],
  ["natürliche Gesundheitsprodukte", "produse naturale de sănătate"],
  ["natürlichen Gesundheitsprodukten", "produse naturale de sănătate"],
  ["natürlicher Gesundheitsprodukte", "produse naturale de sănătate"],
  ["Ausgewählte Gesundheitsprodukte", "Produse de sănătate selectate"],
  ["wir rufen Sie innerhalb von 15 Minuten an", "vă sunăm în 15 minute"],
  ["Heute bestellen — wir rufen Sie innerhalb von 15 Minuten an", "Comandați azi — vă sunăm în 15 minute"],
];

let changed = 0;
for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of PHRASES) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("patched", rel);
  }
}
console.log(`mechanical-ro-phrases: ${changed} files`);
