begin;

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_url text not null,
  image_path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes integer not null check (bytes > 0),
  alt_by_locale jsonb not null check (jsonb_typeof(alt_by_locale) = 'object' and length(btrim(coalesce(alt_by_locale->>'bg', ''))) > 0),
  title_by_locale jsonb not null default '{}'::jsonb check (jsonb_typeof(title_by_locale) = 'object'),
  published boolean not null default false,
  sort_order bigint not null default 0,
  home_position smallint unique check (home_position between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_position is null or published),
  check (image_path ~ '^[a-z0-9-]+\.(webp|avif)$'),
  check (image_url ~ '^https://xvpgrgkaiklqyzvjpygc\.supabase\.co/storage/v1/object/public/gallery-photos/[a-z0-9-]+\.(webp|avif)$')
);

create index if not exists gallery_photos_public_order on public.gallery_photos (published, sort_order, created_at desc, id);
alter table public.gallery_photos enable row level security;
revoke all on public.gallery_photos from anon, authenticated;
grant select on public.gallery_photos to anon, authenticated;
grant insert, update, delete on public.gallery_photos to authenticated;

drop policy if exists "Public gallery photos" on public.gallery_photos;
create policy "Public gallery photos" on public.gallery_photos for select to anon, authenticated using (published);
drop policy if exists "Admins manage gallery photos" on public.gallery_photos;
create policy "Admins manage gallery photos" on public.gallery_photos for all to authenticated
  using (public.is_truffle_admin()) with check (public.is_truffle_admin());

create or replace function public.gallery_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists gallery_updated_at on public.gallery_photos;
create trigger gallery_updated_at before update on public.gallery_photos for each row execute function public.gallery_touch_updated_at();

create or replace function public.set_gallery_homepage(photo_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_truffle_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('truffle-gallery-order'));
  if photo_ids is null or cardinality(photo_ids) > 10
    or (select count(distinct id) from unnest(photo_ids) as p(id)) <> cardinality(photo_ids)
    or (select count(*) from public.gallery_photos where id = any(photo_ids) and published) <> cardinality(photo_ids) then
    raise exception 'Select up to ten published photographs' using errcode = '22023';
  end if;
  update public.gallery_photos set home_position = null where home_position is not null;
  update public.gallery_photos as g set home_position = p.position
    from unnest(photo_ids) with ordinality as p(id, position) where g.id = p.id;
end; $$;

create or replace function public.reorder_gallery(photo_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
declare featured_ids uuid[];
begin
  if not public.is_truffle_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('truffle-gallery-order'));
  if photo_ids is null
    or (select count(distinct id) from unnest(photo_ids) as p(id)) <> cardinality(photo_ids)
    or (select count(*) from public.gallery_photos) <> cardinality(photo_ids)
    or (select count(*) from public.gallery_photos where id = any(photo_ids)) <> cardinality(photo_ids) then
    raise exception 'The gallery changed; refresh before reordering' using errcode = '22023';
  end if;
  select coalesce(array_agg(p.id order by p.position), '{}'::uuid[]) into featured_ids
    from unnest(photo_ids) with ordinality as p(id, position)
    join public.gallery_photos as g on g.id = p.id where g.home_position is not null;
  update public.gallery_photos as g set sort_order = p.position * 1024
    from unnest(photo_ids) with ordinality as p(id, position) where g.id = p.id;
  perform public.set_gallery_homepage(featured_ids);
end; $$;

revoke all on function public.set_gallery_homepage(uuid[]) from public, anon, authenticated;
revoke all on function public.reorder_gallery(uuid[]) from public, anon, authenticated;
grant execute on function public.set_gallery_homepage(uuid[]) to authenticated;
grant execute on function public.reorder_gallery(uuid[]) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-photos', 'gallery-photos', true, 8388608, array['image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public gallery storage" on storage.objects;
create policy "Public gallery storage" on storage.objects for select to anon, authenticated using (bucket_id = 'gallery-photos');
drop policy if exists "Admins manage gallery storage" on storage.objects;
create policy "Admins manage gallery storage" on storage.objects for all to authenticated
  using (bucket_id = 'gallery-photos' and public.is_truffle_admin())
  with check (bucket_id = 'gallery-photos' and public.is_truffle_admin());

notify pgrst, 'reload schema';
commit;
