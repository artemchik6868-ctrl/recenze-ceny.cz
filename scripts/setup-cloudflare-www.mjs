/**
 * www.recenze-ceny.cz setup helper.
 * API token with only Worker:Edit cannot attach custom domains — use Dashboard steps below.
 *
 * After DNS + custom domain are set, src/server.ts returns 301 www → apex.
 */
console.log(`
=== www → apex setup (Cloudflare Dashboard) ===

1. Workers & Pages → recenze-ceny → Settings → Domains & Routes
   → Add Custom Domain: www.recenze-ceny.cz
   (Cloudflare will create/update the www DNS record automatically)

2. If www still returns 522, open DNS → Records:
   - Delete any stale A/AAAA for "www"
   - Ensure www is CNAME → recenze-ceny (proxied orange cloud)

3. Optional edge redirect (before Worker): Rules → Redirect Rules
   - When: Hostname equals www.recenze-ceny.cz
   - Then: 301 to https://recenze-ceny.cz\${uri.path}

4. Redeploy after code changes:
   npm run deploy

Worker entry src/server.ts also redirects www → apex when traffic reaches the Worker.
`);
