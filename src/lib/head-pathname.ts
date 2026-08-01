/** Leaf pathname for root head() — ctx.match on __root__ is "/", not the active URL. */
export function headPathname(ctx: {
  matches?: Array<{ pathname: string }>;
  match?: { pathname?: string };
}): string {
  const matches = ctx.matches;
  if (matches?.length) {
    return matches[matches.length - 1]!.pathname;
  }
  return ctx.match?.pathname ?? "/";
}
