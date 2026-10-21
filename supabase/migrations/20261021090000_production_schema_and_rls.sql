-- =============================================================================
-- Production Schema Completion & Row-Level Security (RLS) Hardening
-- Migration: 20261021090000_production_schema_and_rls.sql
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Missing Application Tables
-- -----------------------------------------------------------------------------

-- 1a. Admin Products Catalog (`public.admin_products`)
create table if not exists public.admin_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null default 'Oduzz',
  size text not null default 'N/A',
  type text not null default 'Electrical item',
  best_for text not null default 'General electrical use',
  description text not null default '',
  key_features text[] not null default '{}'::text[],
  image_url text not null default '',
  price_amount bigint not null default 0 check (price_amount >= 0),
  currency text not null default 'NGN',
  stock_qty integer not null default 0 check (stock_qty >= 0),
  slug text unique,
  category text not null default 'wiring-cables',
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_products_active_featured_idx
  on public.admin_products (is_active, featured desc, created_at desc);

create index if not exists admin_products_slug_idx
  on public.admin_products (slug);

create index if not exists admin_products_category_idx
  on public.admin_products (category);

-- 1b. Product Orders (`public.product_orders`)
create table if not exists public.product_orders (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  gateway text not null default 'paystack',
  status text not null default 'pending_checkout',
  gateway_status text not null default 'initialized',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  product_id text not null,
  product_slug text,
  product_name text not null,
  unit_amount bigint not null default 0 check (unit_amount >= 0),
  paid_amount bigint not null default 0 check (paid_amount >= 0),
  currency text not null default 'NGN',
  quantity integer not null default 1 check (quantity >= 1),
  checkout_url text,
  gateway_transaction_id text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  gateway_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists product_orders_status_created_idx
  on public.product_orders (status, created_at desc);

create index if not exists product_orders_customer_email_idx
  on public.product_orders (customer_email);

-- 1c. Blog Posts (`public.blog_posts`)
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'published',
  featured boolean not null default false,
  category text not null default 'Electrical Tips',
  title text not null,
  summary text not null,
  seo_description text,
  reading_time text,
  audience text,
  format text,
  published_label text,
  published_at timestamptz not null default timezone('utc', now()),
  image_url text,
  image_alt text,
  points jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  source text not null default 'ai',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);

-- 1d. Assistant & Quote Leads (`public.assistant_quote_leads`)
create table if not exists public.assistant_quote_leads (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique,
  source text not null default 'website',
  channel text not null default 'quote-page',
  customer_name text not null default '',
  phone text not null default '',
  service text not null default '',
  location text not null default '',
  details text not null default '',
  urgency text not null default '',
  budget text not null default '',
  image_urls text[] not null default '{}'::text[],
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assistant_quote_leads_created_idx
  on public.assistant_quote_leads (created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Enable Row-Level Security (RLS) on All 11 Public Tables
-- -----------------------------------------------------------------------------

alter table if exists public.admin_products enable row level security;
alter table if exists public.product_orders enable row level security;
alter table if exists public.blog_posts enable row level security;
alter table if exists public.assistant_quote_leads enable row level security;
alter table if exists public.documents enable row level security;
alter table if exists public.document_chunks enable row level security;
alter table if exists public.chat_leads enable row level security;
alter table if exists public.knowledge_documents enable row level security;
alter table if exists public.knowledge_chunks enable row level security;
alter table if exists public.solar_products enable row level security;
alter table if exists public.ai_consultations enable row level security;

-- -----------------------------------------------------------------------------
-- 3. Row-Level Security Policies (Least Privilege)
-- -----------------------------------------------------------------------------

-- 3a. `public.admin_products`
-- Public visitors can read active products; authenticated admins can manage products.
drop policy if exists "admin_products_public_select_active" on public.admin_products;
create policy "admin_products_public_select_active"
  on public.admin_products
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "admin_products_authenticated_select_all" on public.admin_products;
create policy "admin_products_authenticated_select_all"
  on public.admin_products
  for select
  to authenticated
  using (true);

drop policy if exists "admin_products_authenticated_insert" on public.admin_products;
create policy "admin_products_authenticated_insert"
  on public.admin_products
  for insert
  to authenticated
  with check (true);

drop policy if exists "admin_products_authenticated_update" on public.admin_products;
create policy "admin_products_authenticated_update"
  on public.admin_products
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_products_authenticated_delete" on public.admin_products;
create policy "admin_products_authenticated_delete"
  on public.admin_products
  for delete
  to authenticated
  using (true);

-- 3b. `public.blog_posts`
-- Public visitors can read published blog posts; writes are server-only via service_role.
drop policy if exists "blog_posts_public_select_published" on public.blog_posts;
create policy "blog_posts_public_select_published"
  on public.blog_posts
  for select
  to anon, authenticated
  using (status = 'published');

-- 3c. `public.assistant_quote_leads`
-- Public visitors can INSERT new quote leads only; cannot SELECT, UPDATE, or DELETE existing leads.
drop policy if exists "assistant_quote_leads_public_insert" on public.assistant_quote_leads;
create policy "assistant_quote_leads_public_insert"
  on public.assistant_quote_leads
  for insert
  to anon, authenticated
  with check (
    char_length(coalesce(customer_name, '')) <= 200
    and char_length(coalesce(phone, '')) <= 60
    and char_length(coalesce(details, '')) <= 4000
  );

-- Note: `product_orders`, `documents`, `document_chunks`, `chat_leads`,
-- `knowledge_documents`, `knowledge_chunks`, `solar_products`, and `ai_consultations`
-- have RLS enabled with NO `anon` policies, restricting all access to the server-side
-- `service_role` key.

-- -----------------------------------------------------------------------------
-- 4. Supabase Storage Buckets & Storage Object RLS Policies
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-intake-images',
  'quote-intake-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
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
  to anon, authenticated
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

drop policy if exists "quote_intake_images_public_read" on storage.objects;
create policy "quote_intake_images_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'quote-intake-images');

drop policy if exists "quote_intake_images_public_insert" on storage.objects;
create policy "quote_intake_images_public_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'quote-intake-images'
    and (storage.foldername(name))[1] is not null
  );
