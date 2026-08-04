// Centralised site/brand constants — Recenze Ceny (CZ market).
export const SITE = {
  name: "Recenze Ceny",
  url: "https://recenze-ceny.cz",
  email: "info@recenze-ceny.cz",
  phoneDisplay: "+420 602 847 193",
  phoneHref: "tel:+420602847193",
  address: {
    line1: "Recenze Ceny",
    line2: "Václavské náměstí 1",
    city: "Praha",
    state: "",
    postalCode: "110 00",
    country: "CZ",
  },
  hours: "Po–So · 9:00–20:00 (CET)",
} as const;

/** Webmaster / sub1 label sent to CPA networks with each lead. */
export const LEAD_SITE_LABEL = "recenze-ceny";

/** Canonical path prefix for category buying-guide pages. */
export const GUIDE_PATH = "/pruvodce";

/** Canonical path prefix for interactive service tools. */
export const SERVICES_PATH = "/sluzby";

/** Canonical path prefix for editorial blog articles. */
export const BLOG_PATH = "/clanky";
