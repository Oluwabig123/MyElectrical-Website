create extension if not exists pgcrypto;

create table if not exists public.product_orders (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null,
  gateway text not null default 'paystack',
  status text not null default 'pending_checkout',
  gateway_status text not null default 'initialized',
  gateway_transaction_id text not null default '',
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  product_id text not null default '',
  product_slug text not null default '',
  product_name text not null default '',
  unit_amount integer not null default 0,
  paid_amount integer not null default 0,
  currency text not null default 'NGN',
  quantity integer not null default 1,
  checkout_url text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  gateway_response jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists product_orders_reference_unique_idx
  on public.product_orders (reference_id);

create index if not exists product_orders_created_at_idx
  on public.product_orders (created_at desc);

create index if not exists product_orders_gateway_idx
  on public.product_orders (gateway);

create index if not exists product_orders_status_idx
  on public.product_orders (status);

create index if not exists product_orders_product_slug_idx
  on public.product_orders (product_slug);

create or replace function public.set_product_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop trigger if exists trg_product_orders_updated_at on public.product_orders;
create trigger trg_product_orders_updated_at
before update on public.product_orders
for each row
execute function public.set_product_orders_updated_at();

alter table public.product_orders enable row level security;
alter table public.admin_users enable row level security;

grant usage on schema public to authenticated;
grant select on table public.product_orders to authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "product_orders_select_authenticated" on public.product_orders;
drop policy if exists "product_orders_select_admins" on public.product_orders;
create policy "product_orders_select_admins"
on public.product_orders
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());
