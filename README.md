# Recenze Ceny — offer-pulse-showcase-cz

Czech storefront for **https://recenze-ceny.cz** (Cloudflare Worker `recenze-ceny`).

Fork lineage: multi-market `offer-pulse` family (historically ported via RO/HU bootstrap scripts). Runtime locale is **Czech only** (`cs`).

## Quick start

```bash
npm install
cp .env.example .env   # Supabase CZ + Cloudflare + affiliate keys
npm run db:migrate
npm run dev
```

## Bootstrap (first clone / regen from sibling market)

```bash
npm run bootstrap:cz
npm run translate:ui:cz
npm run translate:content:cz
npm run translate:reviews:cz
npm run audit:cz
```

Sibling-market bootstrap scripts (`bootstrap:sk`, `gen:*-from-*`) remain for forking other locales — they are not used by the live CZ runtime.

## Deploy

See [CZ-INFRA-SETUP.md](CZ-INFRA-SETUP.md) and [DEPLOY.md](DEPLOY.md).

```bash
npm run build
npm run deploy
npm run secrets:cloudflare
```

## Notes

- UI locale: `cs` (`src/lib/lang.ts`, `src/lib/i18n.cs.ts`).
- AI PDP copy is stored in legacy `product_content.*_uk` columns — see `PDP_CONTENT_SLOT` in `src/lib/market.ts` / [AGENTS.md](AGENTS.md).
- SEO conventions: [AGENTS.md](AGENTS.md).
