# Truffle Balkans Admin

The admin uses Supabase Auth, Postgres Row Level Security, and Supabase Storage. Product photos are public for storefront display; only users explicitly listed in `public.admin_users` can upload or edit catalog data.

## Configure Supabase

1. Create a Supabase project and run [`supabase/schema.sql`](../supabase/schema.sql) in the SQL Editor.
   Then apply [`supabase/catalog-publication.sql`](../supabase/catalog-publication.sql) for preset details, strict public visibility and automatic storefront refresh. This migration is already active in the production project.
2. Disable public sign-ups. The two admin usernames currently map to one Supabase Auth account, `gitcho505@gmail.com`:

| Admin username | Internal Supabase Auth email |
| --- | --- |
| `ESI_ADMIN` | `gitcho505@gmail.com` |
| `KOSIO_ADMIN` | `gitcho505@gmail.com` |

Set the password for `gitcho505@gmail.com` in Supabase Auth. Both usernames use that same password and share one Auth user ID. Separate passwords require separate email accounts.

3. Add only these two users to the admin allowlist in the SQL Editor:

```sql
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = 'gitcho505@gmail.com'
on conflict (user_id) do nothing;
```

The allowlist now contains only the `gitcho505@gmail.com` Auth user. The old Ivan membership was removed from `public.admin_users`; his Auth account and all product data remain intact.

4. Copy the project URL and anon/publishable key to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

5. Add the same two variables to the Vercel project and redeploy.
6. Open `/admin` and sign in as `ESI_ADMIN` or `KOSIO_ADMIN` with the password for `gitcho505@gmail.com`.

7. For newsletter subscriptions, apply [`supabase/newsletter.sql`](../supabase/newsletter.sql) in the same project. See [`docs/NEWSLETTER.md`](NEWSLETTER.md) for activation, subscriber export and removal. This adds subscription storage; it does not send campaigns.

The anon key is designed to be public. RLS policies and the `admin_users` allowlist protect product edits and photo uploads. Never put a Supabase service-role key in a `VITE_*` variable or client bundle.

The catalog is fully managed from `/admin`. Use the `+` beside the product count to add a main product; edit its localized name and descriptions, season, origin, main photo, price, and visibility in the editor. Main products can be deleted together with their child entries. The deployed project currently has four existing varieties, but new products are not limited to that set and deleted products are not reseeded automatically.

Open a main product and use **Подпродукт** to add a related find/lot with date, total grams, number of truffles, optional photo, and Bulgarian dropdowns for quality, size and preparation. Preset details automatically display in BG, EN, IT, FR and DE using curated translations. Existing child entries can be edited, hidden/shown, or deleted. Published children appear only on their own product page, directly above the product information and season section. They do not appear on the home page or on other product pages. A hidden parent always hides its children; adding a child never changes the parent's publication status. Child photos do not replace the main product photo. Set each language's product slug in the URL field beside its localized name; blank slugs are generated from that language's name when the product is saved. Pages use `/{locale}/{localized-products-path}/{slug}` and the language switcher follows the matching slug.

The storefront uses fresh public data in server-rendered HTML, without a cached seed catalogue. Hidden products return 404 on direct requests and are excluded from the live sitemap. Public database policies enforce parent and child visibility even outside the site UI; administrators retain access to hidden records. `catalog_revision` publishes only a revision number and timestamp through Supabase Realtime, so all visitors can refresh after a change without exposing hidden product data. Same-browser tabs also refresh through a storage event; focus and a 15-second check provide recovery after connection interruptions.

The original product IDs are `black-truffle`, `white-truffle`, `summer-truffle`, and `burgundy-truffle`. When upgrading an existing Supabase project, rerun the updated `supabase/schema.sql` to add `price_per_kg`, create `truffle_harvests`, and refresh the RLS policies.
