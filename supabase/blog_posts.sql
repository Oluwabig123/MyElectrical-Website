-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  status text not null default 'published',
  featured boolean not null default false,
  category text not null default 'General',
  title text not null,
  summary text not null,
  seo_description text not null default '',
  reading_time text not null default '4 min read',
  audience text not null default 'Homeowners',
  format text not null default 'Guide',
  published_label text,
  published_at timestamptz not null default timezone('utc', now()),
  image_url text not null,
  image_alt text not null default '',
  points jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  source text not null default 'ai',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists blog_posts_slug_unique_idx
  on public.blog_posts (slug);

create index if not exists blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc);

alter table public.blog_posts enable row level security;

create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.set_blog_posts_updated_at();

grant usage on schema public to anon, authenticated;
grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;

drop policy if exists "blog_posts_select_published" on public.blog_posts;
create policy "blog_posts_select_published"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "blog_posts_manage_authenticated" on public.blog_posts;
create policy "blog_posts_manage_authenticated"
on public.blog_posts
for all
to authenticated
using (true)
with check (true);
