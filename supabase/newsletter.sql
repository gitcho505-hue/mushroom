-- Run once in the SQL Editor of the same Supabase project as the catalogue.
begin;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    email = lower(btrim(email)) and length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  locale text not null check (locale in ('bg', 'en', 'it', 'fr', 'de')),
  consent_version text not null default 'newsletter-2026-10-15',
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;

drop policy if exists "Newsletter admins can read subscribers" on public.newsletter_subscribers;
create policy "Newsletter admins can read subscribers"
  on public.newsletter_subscribers for select to authenticated
  using (public.is_truffle_admin());

drop policy if exists "Newsletter admins can remove subscribers" on public.newsletter_subscribers;
create policy "Newsletter admins can remove subscribers"
  on public.newsletter_subscribers for delete to authenticated
  using (public.is_truffle_admin());

-- A capability check; it reveals no subscriber data.
create or replace function public.newsletter_ready()
returns boolean language sql stable set search_path = '' as $$ select true; $$;

-- Accept a subscription without exposing whether an address is already on the list.
-- Anonymous clients have no direct insert, update, read or delete access to the table.
create or replace function public.subscribe_to_newsletter(
  subscriber_email text,
  subscriber_locale text,
  consent boolean,
  website text default ''
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  normalized_email text := lower(btrim(subscriber_email));
begin
  if coalesce(website, '') <> '' then return; end if;
  if consent is distinct from true then
    raise exception 'Consent is required' using errcode = '22023';
  end if;
  if normalized_email is null or length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or subscriber_locale is null or subscriber_locale not in ('bg', 'en', 'it', 'fr', 'de') then
    raise exception 'Invalid subscription' using errcode = '22023';
  end if;
  insert into public.newsletter_subscribers (email, locale)
    values (normalized_email, subscriber_locale)
    on conflict (email) do nothing;
end;
$$;

revoke all on function public.newsletter_ready() from public, anon, authenticated;
revoke all on function public.subscribe_to_newsletter(text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.newsletter_ready() to anon, authenticated;
grant execute on function public.subscribe_to_newsletter(text, text, boolean, text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
