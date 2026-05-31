create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  source_type text not null default 'manual',
  source_url text,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_text text not null,
  chunk_index integer not null,
  token_estimate integer,
  topic text,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.document_chunks add column if not exists topic text;

create table if not exists public.chat_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  location text,
  service_interest text,
  conversation_summary text,
  created_at timestamptz not null default now()
);

create index if not exists documents_is_active_idx on public.documents (is_active);
create index if not exists documents_category_idx on public.documents (category);
create index if not exists document_chunks_document_id_idx on public.document_chunks (document_id);
create index if not exists idx_document_chunks_topic on public.document_chunks (topic);
create index if not exists document_chunks_embedding_ivfflat_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
alter index if exists document_chunks_embedding_ivfflat_idx set (lists = 100);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_documents_updated_at on public.documents;

create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_threshold double precision default 0.6,
  match_count integer default 4,
  topic_filter text default null
)
returns table (
  id uuid,
  document_id uuid,
  chunk_text text,
  title text,
  category text,
  source_url text,
  topic text,
  similarity double precision,
  metadata jsonb
)
language plpgsql
as $$
begin
  set local ivfflat.probes = 10;

  return query
  select
    dc.id,
    dc.document_id,
    dc.chunk_text,
    d.title,
    d.category,
    d.source_url,
    dc.topic,
    1 - (dc.embedding <=> query_embedding) as similarity,
    dc.metadata
  from public.document_chunks dc
  inner join public.documents d on d.id = dc.document_id
  where d.is_active = true
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
    and (topic_filter is null or dc.topic = topic_filter)
  order by dc.embedding <=> query_embedding
  limit greatest(match_count, 1);
end;
$$;
