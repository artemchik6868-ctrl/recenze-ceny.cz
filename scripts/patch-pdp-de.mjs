/** One-shot mechanical PL→DE for pdp-variants.ts and pdp-html-variants.ts */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const RE = [
  ["w Polsce", "in Deutschland"],
  ["na terenie całej Polski", "in ganz Deutschland"],
  ["w całej Polsce", "in ganz Deutschland"],
  ["Polska (szybka usługa kurierska)", "Deutschland (Expresskurier)"],
  ["Polska, szybka usługa kurierska", "Deutschland, Expresskurier"],
  ["Polska, usługa kurierska", "Deutschland, Kurierdienst"],
  ["Polska, 2–5 dni roboczych", "Deutschland, 2–5 Werktage"],
  ["Polska, płatność przy odbiorze", "Deutschland, Zahlung bei Lieferung"],
  ["Polska, zwrot w ciągu 7 dni", "Deutschland, 7 Tage Rückgaberecht"],
  ["Polska", "Deutschland"],
  ["płatność przy odbiorze", "Zahlung bei Lieferung"],
  ["Płatność przy odbiorze", "Zahlung bei Lieferung"],
  ["bez przedpłaty", "ohne Vorauszahlung"],
  ["Szybka dostawa", "Schnelle Lieferung"],
  ["szybka dostawa", "schnelle Lieferung"],
  ["Dostawa kurierem", "Lieferung per Kurier"],
  ["dostawa kurierem", "Lieferung per Kurier"],
  ["Dostawa i płatność w Polsce", "Lieferung und Zahlung in Deutschland"],
  ["Dostawa na terenie całej Polski", "Lieferung in ganz Deutschland"],
  ["Dostawa akcesoriów samochodowych w Polsce", "Lieferung von Autozubehör in Deutschland"],
  ["Dostawa i zwrot w Polsce", "Lieferung und Rückgabe in Deutschland"],
  ["Opinie klientów", "Kundenbewertungen"],
  ["cena i opinie", "Preis und Bewertungen"],
  ["kup online w Polsce", "online kaufen in Deutschland"],
  ["Informacje o produkcie", "Produktinformationen"],
  ["Specyfikacja techniczna", "Technische Daten"],
  ["Funkcje", "Funktionen"],
  ["Do użytku domowego", "Für den Heimgebrauch"],
  ["Urządzenie", "Gerät"],
  ["Do domu", "Für Zuhause"],
  ["Gadżet domowy", "Haushalts-Gadget"],
  ["Rozmiary i cena", "Größen und Preis"],
  ["Tabela rozmiarów", "Größentabelle"],
  ["Moda Polska", "Deutsche Mode"],
  ["Odzież", "Kleidung"],
  ["Do auta", "Für Ihr Auto"],
  ["Akcesoria samochodowe", "Autozubehör"],
  ["Elektronika samochodowa", "Autoelektronik"],
  ["Instrukcja montażu", "Installationsanleitung"],
  ["Ogród i sad", "Garten und Obstgarten"],
  ["Na zewnątrz", "Für draußen"],
  ["Od ", "Ab "],
  [" od ", " ab "],
  ["Zamówienie online", "Online-Bestellung"],
  ["Zamówienie za", "Bestellung für"],
  ["Cena ", "Preis "],
  ["Oryginalny produkt", "Originalprodukt"],
  ["Rozmiary dostępne", "Größen verfügbar"],
  ["zwrot w ciągu 7 dni", "7-tägiges Rückgaberecht"],
  ["Akcesorium samochodowe", "Autozubehör"],
  ["Produkt ogrodowy", "Gartenprodukt"],
  ["wysyłka i", "Versand und"],
  ["Dostawca", "Anbieter"],
  ["Dystrybucja", "Vertrieb"],
  ["Oficjalny dystrybutor w Polsce", "Offizieller Vertriebspartner in Deutschland"],
  ["Autoryzowany partner PL", "Autorisierter Partner DE"],
  ["Oficjalny kanał Polska", "Offizieller Kanal Deutschland"],
  ["Suplement przez dystrybutora PL", "Nahrungsergänzung über DE-Vertrieb"],
  ["Autoryzowany importer", "Autorisierter Importeur"],
  ["Sklep internetowy PL", "Online-Shop DE"],
  ["Magazyn PL", "Lager DE"],
  ["Wysyłka", "Versand"],
  ["Kraj dostawy", "Lieferland"],
  ["Kraj", "Land"],
  ["Pochodzenie", "Herkunft"],
  ["Płatność", "Zahlung"],
  ["Sprzedaż", "Vertrieb"],
  ["Kanał", "Kanal"],
  ["Partner logistyczny PL", "Logistikpartner DE"],
  ["Autoryzowana sprzedaż online", "Autorisierter Online-Vertrieb"],
  ["Sklep internetowy z modą PL", "Online-Mode-Shop DE"],
  ["Sprawdź opis produktu", "Siehe Produktbeschreibung"],
  ["E-commerce odzieżowy", "Mode-E-Commerce"],
  ["Kompatybilność", "Kompatibilität"],
  ["Akcesoria samochodowe online PL", "Autozubehör Online DE"],
  ["Importer elektroniki samochodowej", "Importeur für Autoelektronik"],
  ["Ogród i sad — sprzedaż PL", "Garten — Vertrieb DE"],
  ["Partner produktów zewnętrznych Polska", "Partner für Outdoor-Produkte Deutschland"],
  ["E-commerce ogrodniczy", "Garten-E-Commerce"],
  ["Sprzedaż online Polska", "Online-Vertrieb Deutschland"],
  ["Kraków|Łódź|Wrocław|Poznań|Gdańsk|Szczecin|Katowice|Białystok", "Praha|Hamburg|München|Köln|Frankfurt|Stuttgart|Düsseldorf|Leipzig"],
  ["i innych miast w całej Polsce", "und anderen Städten in ganz Deutschland"],
  ["Płatność przy odbiorze — w 2–5 dni roboczych", "Zahlung bei Lieferung — in 2–5 Werktagen"],
  ["Poland market", "Germany market"],
];

for (const rel of ["src/lib/pdp-variants.ts", "src/lib/pdp-html-variants.ts"]) {
  const p = path.join(ROOT, rel);
  let t = fs.readFileSync(p, "utf8");
  for (const [a, b] of RE) {
    if (a.includes("|")) {
      t = t.replace(new RegExp(a, "g"), b);
    } else {
      t = t.split(a).join(b);
    }
  }
  fs.writeFileSync(p, t, "utf8");
  console.log("patched", rel);
}
