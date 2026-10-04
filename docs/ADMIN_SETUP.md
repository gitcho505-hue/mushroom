# Truffle Balkans Admin

The admin uses Supabase Auth, Postgres Row Level Security, and Supabase Storage. Product photos are public for storefront display; only users explicitly listed in `public.admin_users` can upload or edit catalog data.

## Configure Supabase

1. Create a Supabase project and run [`supabase/schema.sql`](../supabase/schema.sql) in the SQL Editor.
2. Create the administrator in **Authentication → Users**. Disable public sign-ups.
3. Copy the user's UUID and add it to the admin allowlist in the SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID');
```

4. Copy the project URL and anon/publishable key to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

5. Add the same two variables to the Vercel project and redeploy.
6. Open `/admin` and sign in with the Supabase user email and password.

The anon key is designed to be public. RLS policies and the `admin_users` allowlist protect product edits and photo uploads. Never put a Supabase service-role key in a `VITE_*` variable or client bundle.

The first successful admin sign-in seeds the four built-in truffle varieties if the catalog table is empty. Product text is stored for all five site locales; weight, price, stock, availability, and photo are shared catalog fields.