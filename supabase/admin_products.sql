-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text not null default 'N/A',
  type text not null default 'Electrical item',
  best_for text not null,
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists admin_products_category_idx on public.admin_products (category);
create index if not exists admin_products_created_at_idx on public.admin_products (created_at desc);

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
