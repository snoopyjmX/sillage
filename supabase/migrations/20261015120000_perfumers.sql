-- Perfumistas (narizes) como entidade navegável. Um perfume pode ter mais de um perfumista,
-- por isso a ligação é uma tabela (e não uma coluna em `perfumes`). Leitura pública, escrita só
-- admin (RN07), como o resto do catálogo.

create table public.perfumers (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(btrim(name)) between 1 and 150),
  slug text not null unique
    check (slug ~ '^[a-z0-9-]+$' and char_length(slug) between 1 and 150),
  bio text
    check (bio is null or char_length(btrim(bio)) between 1 and 2000),
  country text
    check (country is null or char_length(btrim(country)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.perfumers
  for each row execute function public.set_updated_at();

create table public.perfume_perfumers (
  perfume_id uuid not null references public.perfumes (id) on delete cascade,
  perfumer_id uuid not null references public.perfumers (id) on delete cascade,
  -- Ordem de crédito (1 = primeiro nome citado)
  position smallint not null default 1 check (position >= 1),
  primary key (perfume_id, perfumer_id)
);

-- A PK cobre a busca por perfume; este cobre "perfumes deste perfumista"
create index perfume_perfumers_perfumer_idx on public.perfume_perfumers (perfumer_id);

alter table public.perfumers enable row level security;
alter table public.perfume_perfumers enable row level security;

create policy "perfumers: public select" on public.perfumers
  for select to anon, authenticated
  using (true);

create policy "perfumers: admin insert" on public.perfumers
  for insert to authenticated
  with check (public.is_admin());

create policy "perfumers: admin update" on public.perfumers
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "perfumers: admin delete" on public.perfumers
  for delete to authenticated
  using (public.is_admin());

create policy "perfume_perfumers: public select" on public.perfume_perfumers
  for select to anon, authenticated
  using (true);

create policy "perfume_perfumers: admin insert" on public.perfume_perfumers
  for insert to authenticated
  with check (public.is_admin());

create policy "perfume_perfumers: admin update" on public.perfume_perfumers
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "perfume_perfumers: admin delete" on public.perfume_perfumers
  for delete to authenticated
  using (public.is_admin());

-- Backfill a partir do texto `perfumes.perfumer`. Vários nomes no mesmo texto são separados por
-- vírgula, ponto e vírgula, "&", " e " ou " and ". O slug tira acentos com um mapa explícito
-- (sem a extensão unaccent); nomes que viram o mesmo slug viram um só perfumista.
create temporary table _perfumer_names on commit drop as
select
  p.id as perfume_id,
  part.name,
  part.ord,
  btrim(
    regexp_replace(
      lower(translate(
        part.name,
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      )),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-'
  ) as slug
from public.perfumes p
cross join lateral (
  select btrim(s.name) as name, s.ord
  from regexp_split_to_table(p.perfumer, '\s*(?:,|;|&|\se\s|\sand\s)\s*') with ordinality as s(name, ord)
) as part
where p.perfumer is not null
  and part.name <> '';

delete from _perfumer_names where slug = '';

insert into public.perfumers (name, slug)
select distinct on (slug) name, slug
from _perfumer_names
order by slug, ord, name;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select n.perfume_id, pf.id, (row_number() over (partition by n.perfume_id order by n.ord))::smallint
from (
  select distinct on (perfume_id, slug) perfume_id, slug, ord
  from _perfumer_names
  order by perfume_id, slug, ord
) n
join public.perfumers pf on pf.slug = n.slug;
