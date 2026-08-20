# Deploy — recenze-ceny.cz (CZ)

## Isolation

| Layer | This repo (CZ) |
|-------|----------------|
| Worker | **`recenze-ceny`** |
| Domains | **recenze-ceny.cz**, **www.recenze-ceny.cz** |
| Supabase | Own CZ project |
| Repo | **offer-pulse-showcase-cz** |
| Market | `MARKET_GEO = "CZ"`, currency CZK |

Never deploy this repo to sibling workers (`espertirecensioni`, `opinionestop`, `tanstack-start-app`, `recenziiproduse`, etc.). Guard: [scripts/verify-deploy-target.mjs](scripts/verify-deploy-target.mjs).

## Supabase setup

1. [supabase.com](https://supabase.com) → **New project** (e.g. `recenze-ceny-cz`).
2. Copy keys into `.env` (see [.env.example](.env.example)).
3. Apply schema:
   ```powershell
   $env:SUPABASE_PROJECT_ID = "YOUR_REF"
   $env:SUPABASE_DB_PASSWORD = "..."
   npm run db:migrate
   ```
4. Push secrets: `npm run secrets:cloudflare`
5. Do **not** run sync until step 4 uses this project's Supabase keys.

## Cloudflare deploy

```powershell
$env:CLOUDFLARE_API_TOKEN = "..."
npm install
npm run deploy
```

Domains attached by deploy: **recenze-ceny.cz**, **www.recenze-ceny.cz**

Until DNS propagates, smoke on workers.dev:
```powershell
npm run smoke-test -- --base=https://recenze-ceny.<account>.workers.dev
```

### DNS (registrar → Cloudflare)

1. Delegate NS to Cloudflare at the CZ registrar.
2. Apex + www proxied (orange cloud) → Worker custom domains.
3. Verify: `curl -I https://recenze-ceny.cz/sitemap.xml` → **200** + `cf-ray`.

## Cron (worker `recenze-ceny`)

Nitro `scheduled-tick` every 30 minutes drains landing/image facts and AI content (plus GSC jobs at 06:00 / Mon 07:00 UTC). **CPA feed ingest is GitHub Actions** (`feed-sync.yml`, backup on `health-check.yml`), not Worker cron.

Manual ingest:
```powershell
npm run sync:feeds
```

`npm run sync:daily` only retires leftover `pipeline_feed_wave` state.

## CPA feeds

Sync filters `MARKET_GEO = "CZ"`. Discovery dry-run:
```powershell
npm run discover:feeds
```

## Brand constants

- Site: [src/lib/site.ts](src/lib/site.ts)
- Worker guard: [scripts/verify-deploy-target.mjs](scripts/verify-deploy-target.mjs)
- Infra checklist: [CZ-INFRA-SETUP.md](CZ-INFRA-SETUP.md)

See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for pre-production QA if present.
