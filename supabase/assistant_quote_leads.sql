-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.assistant_quote_leads (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null,
  source text not null default 'website',
  channel text not null default 'quote-page',
  customer_name text not null default '',
  phone text not null default '',
  service text not null default '',
  location text not null default '',
  details text not null default '',
  urgency text not null default '',
  budget text not null default '',
  image_urls jsonb not null default '[]'::jsonb,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assistant_quote_leads_created_at_idx
  on public.assistant_quote_leads (created_at desc);

create index if not exists assistant_quote_leads_reference_idx
  on public.assistant_quote_leads (reference_id);

create unique index if not exists assistant_quote_leads_reference_unique_idx
  on public.assistant_quote_leads (reference_id);

alter table public.assistant_quote_leads enable row level security;

grant usage on schema public to anon, authenticated;
grant insert, update on table public.assistant_quote_leads to anon, authenticated;
grant select on table public.assistant_quote_leads to authenticated;

drop policy if exists "assistant_quote_leads_insert_public" on public.assistant_quote_leads;
create policy "assistant_quote_leads_insert_public"
on public.assistant_quote_leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "assistant_quote_leads_update_public" on public.assistant_quote_leads;
create policy "assistant_quote_leads_update_public"
on public.assistant_quote_leads
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "assistant_quote_leads_select_authenticated" on public.assistant_quote_leads;
create policy "assistant_quote_leads_select_authenticated"
on public.assistant_quote_leads
for select
to authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-intake-images',
  'quote-intake-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "quote_intake_images_public_read" on storage.objects;
create policy "quote_intake_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'quote-intake-images');

drop policy if exists "quote_intake_images_insert_public" on storage.objects;
create policy "quote_intake_images_insert_public"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'quote-intake-images');
