create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  manufacturer text,
  model text,
  product_type text not null,
  source text,
  file_path text not null unique,
  enabled boolean not null default true,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_indexed_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_text text not null,
  chunk_index integer not null default 0,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.solar_products (
  id uuid primary key default gen_random_uuid(),
  manufacturer text,
  model text not null,
  product_type text not null,
  nominal_voltage double precision,
  rated_power_w double precision,
  capacity_ah double precision,
  capacity_kwh double precision,
  max_pv_voc double precision,
  mppt_min_v double precision,
  mppt_max_v double precision,
  max_pv_power_w double precision,
  max_pv_current_a double precision,
  max_charge_current_a double precision,
  max_discharge_current_a double precision,
  supported_series integer,
  supported_parallel integer,
  communication text,
  batteryless_supported boolean,
  raw_specs jsonb not null default '{}'::jsonb,
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_consultations (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  consultation_type text not null,
  customer_name text,
  phone text,
  location text,
  collected_inputs jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,
  confidence_level text,
  quote_summary text,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_documents_enabled_idx on public.knowledge_documents (enabled);
create index if not exists knowledge_documents_product_type_idx on public.knowledge_documents (product_type);
create index if not exists knowledge_documents_model_idx on public.knowledge_documents (model);
create index if not exists knowledge_chunks_document_id_idx on public.knowledge_chunks (document_id);
create index if not exists knowledge_chunks_embedding_ivfflat_idx
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
create index if not exists solar_products_product_type_idx on public.solar_products (product_type);
create index if not exists solar_products_model_idx on public.solar_products (model);
create unique index if not exists solar_products_document_id_product_type_idx
  on public.solar_products (document_id, product_type);
create index if not exists ai_consultations_session_id_idx on public.ai_consultations (session_id);
create index if not exists ai_consultations_consultation_type_idx on public.ai_consultations (consultation_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_knowledge_documents_updated_at on public.knowledge_documents;

create trigger set_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row
execute function public.set_updated_at();

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count integer default 8,
  filter_product_type text default null,
  filter_model text default null
)
returns table (
  document_id uuid,
  chunk_text text,
  title text,
  manufacturer text,
  model text,
  product_type text,
  source text,
  similarity double precision,
  metadata jsonb
)
language sql
stable
as $$
  select
    kc.document_id,
    kc.chunk_text,
    kd.title,
    kd.manufacturer,
    kd.model,
    kd.product_type,
    kd.source,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.metadata
  from public.knowledge_chunks kc
  inner join public.knowledge_documents kd on kd.id = kc.document_id
  where kd.enabled = true
    and (filter_product_type is null or kd.product_type = filter_product_type)
    and (
      filter_model is null
      or kd.model ilike filter_model
      or kd.model ilike '%' || filter_model || '%'
    )
  order by kc.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
