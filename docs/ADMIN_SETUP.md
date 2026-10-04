# Truffle Balkans Admin

The admin uses Supabase Auth, Postgres Row Level Security, and Supabase Storage. Product photos are public for storefront display; only users explicitly listed in `public.admin_users` can upload or edit catalog data.

## Configure Supabase

1. Create a Supabase project and run [`supabase/schema.sql`](../supabase/schema.sql) in the SQL Editor.
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

The anon key is designed to be public. RLS policies and the `admin_users` allowlist protect product edits and photo uploads. Never put a Supabase service-role key in a `VITE_*` variable or client bundle.

The first successful admin sign-in seeds the four built-in varieties if the catalog table is empty. The admin edits availability, description, stock in grams, package weight, price per kilogram, and photos for these four fixed varieties; it does not create or delete varieties. Save a product before uploading its main photo. Photos are stored in the `truffle-photos` bucket and can be replaced or removed. Hidden varieties stay out of the public catalog.

The four fixed product IDs are `black-truffle`, `white-truffle`, `summer-truffle`, and `burgundy-truffle`. When upgrading an existing Supabase project, rerun the updated `supabase/schema.sql` to add `price_per_kg` and refresh the RLS policies.