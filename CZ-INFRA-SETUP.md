# CZ infrastructure setup checklist

Complete after cloning `offer-pulse-showcase-hu` → `offer-pulse-showcase-cz` and running `npm run bootstrap:cz`.

## 1. Supabase (new project)

- [x] Project — ref `ueuhriesbkeoivcndzmx` (region EU)
- [x] Copy URL, publishable, service role, project ref → `.env`
- [ ] Migrations applied (`npm run db:migrate` / `npm run setup:supabase`)

## 2. Cloudflare Worker

- [ ] Zone `recenze-ceny.cz` on Cloudflare
- [ ] `npm run deploy` (worker **`recenze-ceny`**)
- [ ] `npm run secrets:cloudflare`
- [ ] Cron trigger: `*/30 * * * *` (scheduled-tick — drain / 02:00 sync-daily / 06:00 indexing-retry)

## 3. DNS recenze-ceny.cz

- [ ] Custom domains: `recenze-ceny.cz`, `www.recenze-ceny.cz`
- [ ] IndexNow: `INDEXNOW_KEY` + `public/{key}.txt` (optional, after GSC)

## 4. Content bootstrap

**PDP AI texts are enabled** (`ENABLE_AI_CONTENT=true` in `src/lib/market.ts`).

```powershell
npm run audit:locale-cz
npm run audit:prompts-cz
npm run sync:daily
npm run sync:drain
npm run status:pipeline
```

## 5. Post-deploy validation

```powershell
npm run smoke:cz
npm run audit:product-content-cz
npm run audit-sitemap
npm run seo:preflight
npm run test:seo-meta-cz
npm run ops:health
```

## Branding reference

| Field | Value |
|-------|-------|
| Domain | `recenze-ceny.cz` |
| Worker | `recenze-ceny` |
| Brand | Recenze Ceny |
| Geo | `CZ` |
| Currency | `CZK` |
| Locale | `cs-CZ` |
| Phone | `+420` |
| Supabase ref | `ueuhriesbkeoivcndzmx` |
