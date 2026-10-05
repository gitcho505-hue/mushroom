create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.truffle_products (
  id text primary key,
  slug_by_locale jsonb not null default '{}'::jsonb,
  title_by_locale jsonb not null,
  description_by_locale jsonb not null,
  body_by_locale jsonb not null,
  season_by_locale jsonb not null,
  note_by_locale jsonb not null,
  origin text not null default 'Balkans',
  image_url text not null,
  image_path text,
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  price numeric(12, 2) check (price is null or price >= 0),
  price_per_kg numeric(12, 2) check (price_per_kg is null or price_per_kg >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'BGN', 'USD')),
  available boolean not null default true,
  stock_grams integer check (stock_grams is null or stock_grams >= 0),
  updated_at timestamptz not null default now()
);

alter table public.truffle_products drop constraint if exists truffle_products_id_check;
alter table public.truffle_products add column if not exists price_per_kg numeric(12, 2) check (price_per_kg is null or price_per_kg >= 0);
alter table public.truffle_products add column if not exists slug_by_locale jsonb not null default '{}'::jsonb;

update public.truffle_products
set slug_by_locale = jsonb_build_object(
  'bg', coalesce(nullif(slug_by_locale->>'bg', ''), case id when 'black-truffle' then 'black-truffle' when 'white-truffle' then 'white-truffle' when 'summer-truffle' then 'summer-truffle' when 'burgundy-truffle' then 'burgundy-truffle' else id end),
  'en', coalesce(nullif(slug_by_locale->>'en', ''), id),
  'it', coalesce(nullif(slug_by_locale->>'it', ''), case id when 'black-truffle' then 'tartufo-nero' when 'white-truffle' then 'tartufo-bianco' when 'summer-truffle' then 'tartufo-estivo' when 'burgundy-truffle' then 'tartufo-di-borgogna' else id end),
  'fr', coalesce(nullif(slug_by_locale->>'fr', ''), case id when 'black-truffle' then 'truffe-noire' when 'white-truffle' then 'truffe-blanche' when 'summer-truffle' then 'truffe-d-ete' when 'burgundy-truffle' then 'truffe-de-bourgogne' else id end),
  'de', coalesce(nullif(slug_by_locale->>'de', ''), case id when 'black-truffle' then 'schwarze-trueffel' when 'white-truffle' then 'weisse-trueffel' when 'summer-truffle' then 'sommertrueffel' when 'burgundy-truffle' then 'burgundertrueffel' else id end)
);

create unique index if not exists truffle_products_slug_bg_unique on public.truffle_products ((slug_by_locale->>'bg'));
create unique index if not exists truffle_products_slug_en_unique on public.truffle_products ((slug_by_locale->>'en'));
create unique index if not exists truffle_products_slug_it_unique on public.truffle_products ((slug_by_locale->>'it'));
create unique index if not exists truffle_products_slug_fr_unique on public.truffle_products ((slug_by_locale->>'fr'));
create unique index if not exists truffle_products_slug_de_unique on public.truffle_products ((slug_by_locale->>'de'));

create table if not exists public.truffle_harvests (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.truffle_products(id) on delete cascade,
  found_on date not null default current_date,
  weight_grams integer not null check (weight_grams > 0),
  quantity integer not null default 1 check (quantity > 0),
  notes text not null default '',
  image_url text,
  image_path text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists truffle_harvests_product_found_on_idx
  on public.truffle_harvests (product_id, found_on desc);

create or replace function public.is_truffle_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_truffle_admin() from public;
grant execute on function public.is_truffle_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.truffle_products enable row level security;
alter table public.truffle_harvests enable row level security;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.truffle_products to anon, authenticated;
grant insert, update, delete on public.truffle_products to authenticated;
grant select on public.truffle_harvests to anon, authenticated;
grant insert, update, delete on public.truffle_harvests to authenticated;

drop policy if exists "Admins can read their own membership" on public.admin_users;
create policy "Admins can read their own membership"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Anyone can read available truffles" on public.truffle_products;
create policy "Anyone can read available truffles"
  on public.truffle_products for select to anon, authenticated
  using (true);

drop policy if exists "Admins can manage truffle products" on public.truffle_products;
create policy "Admins can manage truffle products"
  on public.truffle_products for all to authenticated
  using (public.is_truffle_admin())
  with check (public.is_truffle_admin());

drop policy if exists "Anyone can read available harvests" on public.truffle_harvests;
create policy "Anyone can read available harvests"
  on public.truffle_harvests for select to anon, authenticated
  using (is_available);

drop policy if exists "Admins can manage truffle harvests" on public.truffle_harvests;
create policy "Admins can manage truffle harvests"
  on public.truffle_harvests for all to authenticated
  using (public.is_truffle_admin())
  with check (public.is_truffle_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('truffle-photos', 'truffle-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view truffle photos" on storage.objects;
create policy "Anyone can view truffle photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'truffle-photos');

drop policy if exists "Admins can manage truffle photos" on storage.objects;
create policy "Admins can manage truffle photos"
  on storage.objects for all to authenticated
  using (bucket_id = 'truffle-photos' and public.is_truffle_admin())
  with check (bucket_id = 'truffle-photos' and public.is_truffle_admin());