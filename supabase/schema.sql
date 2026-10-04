create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.truffle_products (
  id text primary key check (id in ('black-truffle', 'white-truffle', 'summer-truffle', 'burgundy-truffle')),
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
  currency text not null default 'EUR' check (currency in ('EUR', 'BGN', 'USD')),
  available boolean not null default true,
  stock_grams integer check (stock_grams is null or stock_grams >= 0),
  updated_at timestamptz not null default now()
);

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

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.truffle_products to anon, authenticated;
grant insert, update, delete on public.truffle_products to authenticated;

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