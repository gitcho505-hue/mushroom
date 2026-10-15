begin;

alter table public.truffle_harvests add column if not exists grade_code text check (grade_code in ('extra', 'first', 'pieces'));
alter table public.truffle_harvests add column if not exists size_code text check (size_code in ('small', 'medium', 'large', 'mixed'));
alter table public.truffle_harvests add column if not exists preparation_code text check (preparation_code in ('unwashed', 'cleaned'));
update public.truffle_harvests set grade_code = 'first' where grade_code is null and lower(btrim(notes)) in ('първо', 'първо качество', 'първо клас', 'first', 'first grade');
update public.truffle_harvests set grade_code = 'extra' where grade_code is null and lower(btrim(notes)) in ('екстра', 'extra');
update public.truffle_harvests set grade_code = 'pieces' where grade_code is null and lower(btrim(notes)) in ('парчета', 'pieces');

drop policy if exists "Anyone can read available truffles" on public.truffle_products;
create policy "Anyone can read available truffles" on public.truffle_products for select to anon, authenticated using (available);
drop policy if exists "Anyone can read available harvests" on public.truffle_harvests;
create policy "Anyone can read available harvests" on public.truffle_harvests for select to anon, authenticated
  using (is_available and exists (select 1 from public.truffle_products p where p.id = product_id and p.available));

create table if not exists public.catalog_revision (
  id boolean primary key default true check (id),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.catalog_revision (id) values (true) on conflict (id) do nothing;
alter table public.catalog_revision enable row level security;
revoke all on public.catalog_revision from anon, authenticated;
grant select on public.catalog_revision to anon, authenticated;
drop policy if exists "Public catalogue revision" on public.catalog_revision;
create policy "Public catalogue revision" on public.catalog_revision for select to anon, authenticated using (true);

create or replace function public.notify_catalog_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.catalog_revision set revision = revision + 1, updated_at = now() where id = true;
  return null;
end; $$;
revoke all on function public.notify_catalog_revision() from public, anon, authenticated;
drop trigger if exists catalog_product_changed on public.truffle_products;
create trigger catalog_product_changed after insert or update or delete on public.truffle_products for each statement execute function public.notify_catalog_revision();
drop trigger if exists catalog_harvest_changed on public.truffle_harvests;
create trigger catalog_harvest_changed after insert or update or delete on public.truffle_harvests for each statement execute function public.notify_catalog_revision();
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'catalog_revision'
  ) then alter publication supabase_realtime add table public.catalog_revision; end if;
end; $$;
notify pgrst, 'reload schema';
commit;
