import { SignJWT, importPKCS8 } from "jose";

export const GOOGLE_SCOPE_INDEXING = "https://www.googleapis.com/auth/indexing";
export const GOOGLE_SCOPE_WEBMASTERS = "https://www.googleapis.com/auth/webmasters";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getGoogleAccessToken(
  scopes: string | string[],
): Promise<string | null> {
  const raw = process.env.GOOGLE_INDEXING_SA_JSON;
  if (!raw) return null;

  const scope = Array.isArray(scopes) ? scopes.join(" ") : scopes;
  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > now + 60) return cached.token;

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw) as ServiceAccount;
  } catch (err) {
    console.warn("[google-sa] GOOGLE_INDEXING_SA_JSON invalid:", err);
    return null;
  }
  if (!sa.client_email || !sa.private_key) return null;

  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const pk = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(tokenUri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(pk);

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.warn("[google-sa] token error:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  tokenCache.set(scope, {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600),
  });
  return json.access_token;
}
