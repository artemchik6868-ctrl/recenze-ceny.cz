# Pre-launch QA — recenze-ceny.cz

## DNS & edge

- [ ] `https://recenze-ceny.cz/sitemap.xml` → 200, header `cf-ray`
- [ ] `www.recenze-ceny.cz` → 301 to apex
- [ ] `robots.txt` points to `https://recenze-ceny.cz/sitemap.xml`

## Storefront

- [ ] Home: Czech Republicn copy, Recenze Ceny branding
- [ ] Category pages: titles and prices in EUR (`cs-CZ` locale)
- [ ] PDP: title without feed junk tokens; correct shelf
- [ ] Lead form: +420 validation, leads in BG Supabase
- [ ] `/medical-expert` — Czech Republicn medical expert page
- [ ] Legal: `/privacy`, `/terms` in Czech Republicn

## Sync & content

- [ ] `node scripts/cz-feed-discovery.mjs` — BG offer counts > 0 per network (or documented gaps)
- [ ] First `sync-daily` completes without timeout
- [ ] AI backfill generates Czech Republicn HTML (`pipeline_version` includes `bg`)
- [ ] Product images: watermark `recenze-ceny-badge.png`, canonical on `recenze-ceny.cz`
- [ ] `npm run status:pipeline` → `missing_content=0`

## SEO

- [ ] `<html lang="bg">`
- [ ] GSC property added, sitemap submitted (556 URLs / ~501 PDP)
- [ ] IndexNow key live at `https://recenze-ceny.cz/{INDEXNOW_KEY}.txt`
- [ ] `npm run seo:preflight` OK
- [ ] `npm run seo:indexers-backfill` after bulk content deploy (optional: `GOOGLE_INDEXING_SA_JSON`)

## Analytics (optional but recommended)

- [ ] `VITE_GA4_ID` set at build time → gtag in layout
- [ ] GA4 property linked to GSC

## Monitor first 48h

- Shelf misclassification (potency vs hemorrhoids traps)
- Feed-title junk in `<title>`
- Cron errors in Cloudflare Workers logs
- GSC Coverage: crawled vs indexed for PDP URLs

## Quick validation

```powershell
npm run ops:health
npm run audit-sitemap
npm run seo:preflight
npm run test:seo-meta-cz
```
