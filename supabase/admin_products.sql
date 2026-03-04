-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text not null default 'N/A',
  type text not null default 'Electrical item',
  best_for text not null,
  image_url text,
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

alter table public.admin_products
add column if not exists image_url text;

create index if not exists admin_products_category_idx on public.admin_products (category);
create index if not exists admin_products_created_at_idx on public.admin_products (created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'admin_products'
    )
  then
    execute 'alter publication supabase_realtime add table public.admin_products';
  end if;
end;
$$;

create or replace function public.set_admin_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_admin_products_updated_at on public.admin_products;
create trigger trg_admin_products_updated_at
before update on public.admin_products
for each row
execute function public.set_admin_products_updated_at();

alter table public.admin_products enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.admin_products to anon;
grant select, insert, update, delete on table public.admin_products to authenticated;

drop policy if exists "admin_products_select_all" on public.admin_products;
create policy "admin_products_select_all"
on public.admin_products
for select
to anon, authenticated
using (true);

drop policy if exists "admin_products_manage_authenticated" on public.admin_products;
create policy "admin_products_manage_authenticated"
on public.admin_products
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists "product_images_authenticated_insert" on storage.objects;
create policy "product_images_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "product_images_authenticated_update" on storage.objects;
create policy "product_images_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "product_images_authenticated_delete" on storage.objects;
create policy "product_images_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
