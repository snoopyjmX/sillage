-- RLS e policies (docs/PRODUCT.md, Seção 6)

alter table public.brands enable row level security;
alter table public.perfumes enable row level security;
alter table public.notes enable row level security;
alter table public.perfume_notes enable row level security;
alter table public.profiles enable row level security;
alter table public.collection_items enable row level security;
alter table public.daily_perfumes enable row level security;
alter table public.perfume_reviews enable row level security;

-- Catálogo (RN07): leitura pública, escrita só admin

create policy "brands: public select" on public.brands
  for select to anon, authenticated
  using (true);

create policy "brands: admin insert" on public.brands
  for insert to authenticated
  with check (public.is_admin());

create policy "brands: admin update" on public.brands
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "brands: admin delete" on public.brands
  for delete to authenticated
  using (public.is_admin());

create policy "perfumes: public select" on public.perfumes
  for select to anon, authenticated
  using (true);

create policy "perfumes: admin insert" on public.perfumes
  for insert to authenticated
  with check (public.is_admin());

create policy "perfumes: admin update" on public.perfumes
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "perfumes: admin delete" on public.perfumes
  for delete to authenticated
  using (public.is_admin());

create policy "notes: public select" on public.notes
  for select to anon, authenticated
  using (true);

create policy "notes: admin insert" on public.notes
  for insert to authenticated
  with check (public.is_admin());

create policy "notes: admin update" on public.notes
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "notes: admin delete" on public.notes
  for delete to authenticated
  using (public.is_admin());

create policy "perfume_notes: public select" on public.perfume_notes
  for select to anon, authenticated
  using (true);

create policy "perfume_notes: admin insert" on public.perfume_notes
  for insert to authenticated
  with check (public.is_admin());

create policy "perfume_notes: admin update" on public.perfume_notes
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "perfume_notes: admin delete" on public.perfume_notes
  for delete to authenticated
  using (public.is_admin());

-- Perfil (RN01): dono lê e edita; INSERT só pelo trigger, DELETE só por cascade
create policy "profiles: owner select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: owner update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Coleção (RN01, RN02)
create policy "collection: owner select" on public.collection_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "collection: owner insert" on public.collection_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "collection: owner update" on public.collection_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "collection: owner delete" on public.collection_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Perfume do Dia (RN06): só SELECT do dono; escrita apenas por set_daily_perfume
create policy "daily: owner select" on public.daily_perfumes
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update on public.daily_perfumes from authenticated;
revoke all on function public.set_daily_perfume(uuid) from public, anon;
grant execute on function public.set_daily_perfume(uuid) to authenticated;

-- Avaliações (RN01, RN03): sem policy de DELETE (somente cascade da exclusão da conta)
create policy "reviews: owner select" on public.perfume_reviews
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "reviews: insert if authorized" on public.perfume_reviews
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      exists (
        select 1 from public.collection_items c
        where c.user_id = (select auth.uid())
          and c.perfume_id = perfume_reviews.perfume_id
          and c.status = 'owned'
      )
      or exists (
        select 1 from public.daily_perfumes d
        where d.user_id = (select auth.uid())
          and d.perfume_id = perfume_reviews.perfume_id
      )
    )
  );

create policy "reviews: owner update" on public.perfume_reviews
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A policy de UPDATE não reavalia a RN03; sem isto, o dono trocaria perfume_id
-- por um perfume que não tem. Só as colunas editáveis ficam liberadas.
revoke update on public.perfume_reviews from authenticated;
grant update (longevity_rating, projection_rating, comment)
  on public.perfume_reviews to authenticated;

-- Agregados públicos (RN08)
create view public.perfume_review_stats
with (security_invoker = false) as
select perfume_id,
       count(*)                          as review_count,
       round(avg(longevity_rating), 1)   as avg_longevity,
       round(avg(projection_rating), 1)  as avg_projection
from public.perfume_reviews
group by perfume_id;

grant select on public.perfume_review_stats to anon, authenticated;
