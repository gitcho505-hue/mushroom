# Admin Harvest Progress

## Goal

Manage a dynamic catalog of main products, each with add/edit/delete child finds/lots containing a photo, date, total grams, count, note, and public availability.

## Implementation

- Active admin page: `src/harvest-admin-crud.tsx`, rendered by `src/site.tsx`.
- Product catalog and main photos remain in `truffle_products`.
- Harvest entries use `truffle_harvests`; public product detail pages show available entries and totals.
- Harvest photos share `truffle-photos`, under `harvests/<product-id>/`.
- Database and access rules are defined in `supabase/schema.sql`.

## Status

- Main products and child finds/lots can be created, edited, and deleted from the admin. Existing main photos remain separate from child photos.
- Public product lists and detail pages use paginated catalog data and show available finds and summed grams/counts.
- Each product has an editable slug for all five locales; new routes use the localized product prefix and slug. Existing built-in product URLs and legacy `/item/<id>` paths are preserved.
- `npm run build` succeeds, including SSR and localized page prerendering.
- Production Supabase migration is applied; verified table exists, RLS is enabled, and both read/admin policies are present.
- Localized slug column and unique indexes are applied in the production database.
- Verified the production `truffle-photos` bucket is public, accepts the expected image formats up to 8 MB, and has public-read/admin-manage policies.

## Remaining

- Deploy the app changes so the full dynamic CRUD workflow is live. The production catalog currently contains only the four built-in products; CMS records observed during testing are no longer present in the live table.