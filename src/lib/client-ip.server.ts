import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

/** Prefer Cloudflare visitor IP, then first X-Forwarded-For hop, then platform default. */
export function resolveClientIp(): string {
  const cf = getRequestHeader("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = getRequestHeader("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  if (first) return first;
  return getRequestIP({ xForwardedFor: false }) ?? "";
}
