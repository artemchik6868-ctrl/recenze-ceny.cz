// Shared-secret check for /api/public/hooks/* endpoints.
// Accepts either `Authorization: Bearer <secret>` header or `?secret=<secret>` query param.
// Returns a 401 Response when the secret is missing or mismatched, otherwise null.
export function checkHookSecret(request: Request): Response | null {
  const expected = process.env.HOOK_SECRET;
  if (!expected) {
    return new Response("HOOK_SECRET not configured", { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const queryParam = new URL(request.url).searchParams.get("secret");
  const provided = bearer ?? queryParam;
  if (!provided || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
