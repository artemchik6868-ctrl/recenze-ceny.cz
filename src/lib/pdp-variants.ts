/** Deterministické PDP šablony — trh CZ (cs-CZ). */

/** Deterministické varianty podle nicheType a seedu nabídky. */

import type { NicheType } from "./niche-types";
import { getNicheType } from "./niche-types";
import { formatDisplayPrice } from "./market";

export function variantIndex(seed: number, count: number): number {
  if (count <= 0) return 0;
  return Math.abs(seed) % count;
}

export function hasDisplayPrice(priceEUR: number | null | undefined): boolean {
  return typeof priceEUR === "number" && priceEUR > 0;
}

export function formatPriceEUR(priceEUR: number): string {
  return formatDisplayPrice(priceEUR);
}

type TitleSlot = { withPrice: string; noPrice: string };

const TITLE_BY_NICHE: Record<NicheType, TitleSlot[]> = {
  supplement: [
    { withPrice: "{brand}{short}: cena {price} · Recenze Ceny", noPrice: "{brand}{short} · katalog Recenze Ceny" },
    { withPrice: "{brand}{short} za {price} | dobírka v ČR", noPrice: "{brand}{short} | dobírka v České republice" },
    { withPrice: "Recenze: {brand} — {price}", noPrice: "Recenze a popis: {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — složení a cena", noPrice: "{brand}{short} — složení a použití" },
  ],
  device: [
    { withPrice: "{brand}{short}: {price} | parametry a cena", noPrice: "{brand}{short} | parametry zařízení" },
    { withPrice: "{brand}{short} za {price} · Recenze Ceny", noPrice: "{brand}{short} · Recenze Ceny" },
    { withPrice: "Domácí zařízení {brand} — {price}", noPrice: "Domácí zařízení {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — návod a cena", noPrice: "{brand}{short} — návod k použití" },
  ],
  home: [
    { withPrice: "{brand}{short}: {price} | do domácnosti", noPrice: "{brand}{short} | do domácnosti" },
    { withPrice: "{brand}{short} za {price} · katalog ČR", noPrice: "{brand}{short} · katalog Recenze Ceny" },
    { withPrice: "Pro domov: {brand} — {price}", noPrice: "Pro domov: {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — detail produktu", noPrice: "{brand}{short} — detail produktu" },
  ],
  fashion: [
    { withPrice: "{brand}{short}: {price} | velikosti", noPrice: "{brand}{short} | velikosti" },
    { withPrice: "{brand}{short} za {price} · móda ČR", noPrice: "{brand}{short} · móda v ČR" },
    { withPrice: "Oblékněte {brand} — {price}", noPrice: "Oblékněte {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — střih a cena", noPrice: "{brand}{short} — střih a materiál" },
  ],
  auto: [
    { withPrice: "{brand}{short}: {price} | do vozu", noPrice: "{brand}{short} | do vozu" },
    { withPrice: "{brand}{short} za {price} · autodoplňky", noPrice: "{brand}{short} · autodoplňky" },
    { withPrice: "Autopříslušenství {brand} — {price}", noPrice: "Autopříslušenství {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — montáž a cena", noPrice: "{brand}{short} — montáž" },
  ],
  garden: [
    { withPrice: "{brand}{short}: {price} | zahrada", noPrice: "{brand}{short} | zahrada" },
    { withPrice: "{brand}{short} za {price} · venkovní použití", noPrice: "{brand}{short} · venkovní použití" },
    { withPrice: "Na zahradu: {brand} — {price}", noPrice: "Na zahradu: {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — tipy a cena", noPrice: "{brand}{short} — tipy k použití" },
  ],
  generic: [
    { withPrice: "{brand}{short}: cena {price} · Recenze Ceny", noPrice: "{brand}{short} · katalog Recenze Ceny" },
    { withPrice: "{brand}{short} za {price} | dobírka v ČR", noPrice: "{brand}{short} | dobírka v České republice" },
    { withPrice: "Recenze: {brand} — {price}", noPrice: "Recenze a popis: {brand}{short}" },
    { withPrice: "{brand}{short} ({price}) — detail a cena", noPrice: "{brand}{short} — detail produktu" },
  ],
};

export function buildTitleFromSlot(
  categorySlug: string,
  slot: number,
  hasPrice: boolean,
  brand: string,
  short: string,
  priceLabel: string,
): string {
  const niche = getNicheType(categorySlug);
  const templates = TITLE_BY_NICHE[niche] ?? TITLE_BY_NICHE.generic;
  const tpl = templates[slot % templates.length];
  const pattern = hasPrice ? tpl.withPrice : tpl.noPrice;
  return pattern
    .replace(/\{brand\}/g, brand)
    .replace(/\{short\}/g, short)
    .replace(/\{price\}/g, priceLabel);
}

const META_CTA: Record<NicheType, { withPrice: string[]; noPrice: string[] }> = {
  supplement: {
    withPrice: [
      "Kurýr po ČR, platba až při převzetí — {price}.",
      "Dobírka bez zálohy: {price}, doručení 2–5 dnů.",
      "Objednejte za {price}; zaplatíte kurýrovi u dveří.",
      "Cena {price} v katalogu Recenze Ceny, platba na dobírku.",
    ],
    noPrice: [
      "Kurýr po ČR, platba až při převzetí.",
      "Dobírka bez zálohy, doručení 2–5 dnů.",
      "Objednejte online; zaplatíte kurýrovi u dveří.",
      "Katalog Recenze Ceny — platba na dobírku.",
    ],
  },
  device: {
    withPrice: [
      "Zařízení za {price}, doručení kurýrem na dobírku.",
      "{price} s platbou až při převzetí v ČR.",
      "Objednávka za {price} — hovor do 15 minut.",
      "Cena {price}, bez platby předem.",
    ],
    noPrice: [
      "Doručení kurýrem, platba při převzetí v ČR.",
      "Dostupné s dobírkou po celé republice.",
      "Objednávka online — hovor do 15 minut.",
      "Bez platby předem.",
    ],
  },
  home: {
    withPrice: [
      "Do domácnosti za {price}, dobírka kurýrem.",
      "Od {price} s doručením v ČR — platba u dveří.",
      "Cena {price}, bez zálohy.",
      "{price} v katalogu Recenze Ceny.",
    ],
    noPrice: [
      "Doručení kurýrem a dobírka v ČR.",
      "Platba až u dveří, bez zálohy.",
      "Objednejte online — hovor do 15 minut.",
      "Katalog Recenze Ceny, doručení po republice.",
    ],
  },
  fashion: {
    withPrice: [
      "Velikosti od {price}, doručení na dobírku.",
      "Od {price} s 14denním vrácením.",
      "Cena {price}, kurýr po ČR.",
      "Objednejte za {price} — platba při převzetí.",
    ],
    noPrice: [
      "Doručení kurýrem, platba na dobírku.",
      "Vrácení do 14 dnů, bez zálohy.",
      "Objednejte online — hovor do 15 minut.",
      "Katalog Recenze Ceny.",
    ],
  },
  auto: {
    withPrice: [
      "Do vozu za {price}, dobírka kurýrem.",
      "Od {price} s doručením v ČR.",
      "Cena {price}, bez platby předem.",
      "{price} — tipy k montáži v katalogu.",
    ],
    noPrice: [
      "Autodoplňky s dobírkou v ČR.",
      "Doručení kurýrem, platba u dveří.",
      "Objednejte online — hovor do 15 minut.",
      "Bez zálohy.",
    ],
  },
  garden: {
    withPrice: [
      "Na zahradu za {price}, dobírka.",
      "Od {price} s doručením v ČR.",
      "Cena {price}, bez zálohy.",
      "{price} v katalogu Recenze Ceny.",
    ],
    noPrice: [
      "Zahradní sortiment s dobírkou.",
      "Kurýr po ČR, platba při převzetí.",
      "Objednejte online — hovor do 15 minut.",
      "Bez platby předem.",
    ],
  },
  generic: {
    withPrice: [
      "Cena {price}, dobírka kurýrem po ČR.",
      "Od {price} — platba až u dveří.",
      "Objednejte za {price}; hovor do 15 minut.",
      "{price} v katalogu Recenze Ceny.",
    ],
    noPrice: [
      "Dobírka kurýrem po celé republice.",
      "Platba až při převzetí, bez zálohy.",
      "Objednejte online — hovor do 15 minut.",
      "Katalog Recenze Ceny.",
    ],
  },
};

export function metaDescPartsFor(
  categorySlug: string,
  slot: number,
  hasPrice: boolean,
  brandLine: string,
  benefit: string,
  priceLabel: string,
  cta: string,
): string[] {
  void categorySlug;
  const s = slot % 4;
  if (hasPrice) {
    const priced: string[][] = [
      [`${brandLine}.`, `Cena ${priceLabel}.`, `${benefit}.`, cta],
      [`${brandLine} · ${priceLabel}.`, `${benefit}.`, cta],
      [`${benefit}.`, `${brandLine}.`, `V katalogu od ${priceLabel}.`, cta],
      [`Recenze Ceny: ${brandLine}.`, `${benefit}.`, `Cena ${priceLabel}.`, cta],
    ];
    return priced[s];
  }
  const noPrice: string[][] = [
    [`${brandLine}.`, `${benefit}.`, cta],
    [`Katalog: ${brandLine}.`, `${benefit}.`, cta],
    [`${benefit}.`, `${brandLine}.`, cta],
    [`${brandLine} — ${benefit}.`, cta],
  ];
  return noPrice[s];
}

export function metaCtaFor(
  categorySlug: string,
  slot: number,
  hasPrice: boolean,
  priceLabel: string,
): string {
  const niche = getNicheType(categorySlug);
  const pool = META_CTA[niche] ?? META_CTA.generic;
  const templates = hasPrice ? pool.withPrice : pool.noPrice;
  const tpl = templates[slot % templates.length];
  return tpl.replace(/\{price\}/g, priceLabel);
}

export function deliveryH2For(categorySlug: string, _seed = 0): string {
  void _seed;
  const niche = getNicheType(categorySlug);
  const canonical: Record<NicheType, string> = {
    supplement: "Doprava a platba v České republice",
    device: "Doprava a platba v České republice",
    generic: "Doprava a platba v České republice",
    home: "Doprava po celé České republice",
    garden: "Doprava po celé České republice",
    auto: "Doprava autodoplňků v České republice",
    fashion: "Doprava a vrácení zboží v České republice",
  };
  return canonical[niche] ?? canonical.generic;
}

export type SpecVariant = {
  distribLabel: string;
  distribValue: string;
  countryLabel: string;
  countryValue: string;
};

export function specRowsFor(categorySlug: string, seed: number): SpecVariant {
  const niche = getNicheType(categorySlug);
  const variants: Record<NicheType, SpecVariant[]> = {
    supplement: [
      { distribLabel: "Dodavatel", distribValue: "Oficiální distributor v České republice", countryLabel: "Země doručení", countryValue: "Česká republika (expresní kurýr)" },
      { distribLabel: "Distribuce", distribValue: "Autorizovaný partner v ČR", countryLabel: "Doprava", countryValue: "Kurýrní služba po celé České republice" },
      { distribLabel: "Dodavatel", distribValue: "Oficiální kanál Česká republika", countryLabel: "Doprava", countryValue: "Česká republika, 2–5 pracovních dnů" },
      { distribLabel: "Původ", distribValue: "Doplňek stravy přes autorizovaného distributora", countryLabel: "Platba", countryValue: "Platba na dobírku" },
    ],
    device: [
      { distribLabel: "Dodavatel", distribValue: "Autorizovaný importér", countryLabel: "Doprava", countryValue: "Česká republika, expresní kurýr" },
      { distribLabel: "Distribuce", distribValue: "Oficiální online obchod v ČR", countryLabel: "Doprava", countryValue: "po celé ČR, platba na dobírku" },
      { distribLabel: "Distribuce", distribValue: "Sklad v ČR", countryLabel: "Země", countryValue: "Česká republika" },
      { distribLabel: "Kanál", distribValue: "Oficiální distributor", countryLabel: "Doprava", countryValue: "Kurýrní služba 2–5 pracovních dnů" },
    ],
    home: [
      { distribLabel: "Distribuce", distribValue: "Autorizovaný partner v ČR", countryLabel: "Doprava", countryValue: "Kurýrní služba po celé České republice" },
      { distribLabel: "Dodavatel", distribValue: "E-commerce v ČR", countryLabel: "Doprava", countryValue: "po celé ČR, platba na dobírku" },
      { distribLabel: "Distribuce", distribValue: "Logistický partner v ČR", countryLabel: "Země", countryValue: "Česká republika" },
      { distribLabel: "Kanál", distribValue: "Autorizovaný online prodej", countryLabel: "Doprava", countryValue: "Rychlá kurýrní služba" },
    ],
    fashion: [
      { distribLabel: "Distribuce", distribValue: "Online módní obchod v ČR", countryLabel: "Doprava", countryValue: "Česká republika, 7denní právo na vrácení" },
      { distribLabel: "Dodavatel", distribValue: "Autorizovaný distributor", countryLabel: "Doprava", countryValue: "Kurýrní služba, platba na dobírku" },
      { distribLabel: "Velikosti", distribValue: "Viz popis produktu", countryLabel: "Země", countryValue: "Česká republika" },
      { distribLabel: "Kanál", distribValue: "Módní e-commerce", countryLabel: "Doprava", countryValue: "po celé České republice" },
    ],
    auto: [
      { distribLabel: "Kompatibilita", distribValue: "Viz popis produktu", countryLabel: "Doprava", countryValue: "Česká republika, kurýrní služba" },
      { distribLabel: "Dodavatel", distribValue: "Online autodoplňky v ČR", countryLabel: "Doprava", countryValue: "po celé České republice" },
      { distribLabel: "Distribuce", distribValue: "Importér autoelektroniky", countryLabel: "Země", countryValue: "Česká republika, platba na dobírku" },
      { distribLabel: "Kanál", distribValue: "Autorizovaný distributor", countryLabel: "Doprava", countryValue: "Rychlá kurýrní služba" },
    ],
    garden: [
      { distribLabel: "Dodavatel", distribValue: "Zahrada a dvůr — prodej v ČR", countryLabel: "Doprava", countryValue: "Česká republika, kurýrní služba" },
      { distribLabel: "Distribuce", distribValue: "Partner pro venkovní produkty v ČR", countryLabel: "Doprava", countryValue: "po celé České republice" },
      { distribLabel: "Distribuce", distribValue: "Sklad v ČR", countryLabel: "Země", countryValue: "Česká republika" },
      { distribLabel: "Kanál", distribValue: "Zahradní e-commerce", countryLabel: "Doprava", countryValue: "Kurýrní služba, platba na dobírku" },
    ],
    generic: [
      { distribLabel: "Dodavatel", distribValue: "Oficiální distributor v České republice", countryLabel: "Země doručení", countryValue: "Česká republika (expresní kurýr)" },
      { distribLabel: "Distribuce", distribValue: "Oficiální online obchod v ČR", countryLabel: "Doprava", countryValue: "Česká republika" },
      { distribLabel: "Kanál", distribValue: "Autorizovaný partner", countryLabel: "Doprava", countryValue: "Kurýrní služba po celé České republice" },
      { distribLabel: "Původ", distribValue: "Online prodej v ČR", countryLabel: "Platba", countryValue: "Platba na dobírku" },
    ],
  };
  const list = variants[niche] ?? variants.generic;
  return list[variantIndex(seed, list.length)];
}
