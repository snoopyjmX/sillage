-- Extensões, enums e tabelas (docs/PRODUCT.md, Seção 5)

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.collection_status as enum ('owned', 'wanted');
create type public.note_position as enum ('top', 'heart', 'base');
create type public.perfume_gender as enum ('masculine', 'feminine', 'unisex');
create type public.concentration_type as enum ('parfum', 'extrait', 'edp', 'edt', 'edc', 'other');
create type public.olfactive_family as enum (
  'citrus', 'floral', 'woody', 'green', 'aquatic', 'oriental', 'spicy', 'fruity', 'aromatic', 'musky'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  search_name text not null,
  slug text not null unique,
  description text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perfumes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  name text not null,
  search_name text not null,
  slug text not null unique,
  description text,
  gender public.perfume_gender not null,
  concentration public.concentration_type not null,
  release_year smallint
    check (release_year between 1700 and extract(year from now())::int + 1),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  family public.olfactive_family not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perfume_notes (
  perfume_id uuid not null references public.perfumes (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  position public.note_position not null,
  primary key (perfume_id, note_id, position)
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  perfume_id uuid not null references public.perfumes (id) on delete restrict,
  status public.collection_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, perfume_id)
);

create table public.daily_perfumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  perfume_id uuid not null references public.perfumes (id) on delete restrict,
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.perfume_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  perfume_id uuid not null references public.perfumes (id) on delete restrict,
  longevity_rating smallint not null check (longevity_rating between 1 and 5),
  projection_rating smallint not null check (projection_rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, perfume_id)
);

-- Índices
create index perfumes_brand_id_idx on public.perfumes (brand_id);
create index perfume_notes_note_id_position_idx on public.perfume_notes (note_id, position);
create index collection_items_user_id_status_idx on public.collection_items (user_id, status);
create index daily_perfumes_user_id_date_idx on public.daily_perfumes (user_id, date desc);
create index perfume_reviews_perfume_id_idx on public.perfume_reviews (perfume_id);
create index brands_search_name_trgm_idx on public.brands
  using gin (search_name extensions.gin_trgm_ops);
create index perfumes_search_name_trgm_idx on public.perfumes
  using gin (search_name extensions.gin_trgm_ops);
create index perfumes_release_year_idx on public.perfumes (release_year desc nulls last);
