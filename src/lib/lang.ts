// Language utilities — Czech-only storefront (recenze-ceny.cz).

import { useRouterState } from "@tanstack/react-router";

export type Lang = "cs";
export const DEFAULT_LANG: Lang = "cs";
export const LANGS: readonly Lang[] = ["cs"] as const;

export const LANG_LOCALE: Record<Lang, string> = {
  cs: "cs-CZ",
};

export const LANG_HTML: Record<Lang, string> = {
  cs: "cs",
};

export const LANG_OG_LOCALE: Record<Lang, string> = {
  cs: "cs_CZ",
};

export function getLangFromPath(_pathname: string): Lang {
  return "cs";
}

export function useLang(): Lang {
  return "cs";
}

export function stripLangPrefix(pathname: string): string {
  return pathname;
}

export function buildAltPath(pathname: string, _targetLang: Lang): string {
  return pathname;
}

export function withLangPrefix(path: string, _lang: Lang): string {
  return path;
}
