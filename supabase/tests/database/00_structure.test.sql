-- Estrutura: RLS ligada, policies exatas, índices e funções
begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

-- Helpers: trocam o papel do Postgres e as claims do JWT (nunca testamos como superusuário)
create function pg_temp.act_as(
  p_uid uuid,
  p_app jsonb default '{}'::jsonb,
  p_user jsonb default '{}'::jsonb
) returns void language plpgsql as $$
begin
  reset role;
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_uid::text, 'role', 'authenticated',
      'app_metadata', p_app, 'user_metadata', p_user
    )::text,
    true
  );
  set local role authenticated;
end $$;

create function pg_temp.act_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

create function pg_temp.act_postgres() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Linhas afetadas por um INSERT/UPDATE/DELETE executado com o papel atual
create function pg_temp.affected(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;

-- Fixtures (desfeitas pelo rollback no fim)

select is((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), true, 'RLS ligada em profiles');
select is((select relrowsecurity from pg_class where oid = 'public.brands'::regclass), true, 'RLS ligada em brands');
select is((select relrowsecurity from pg_class where oid = 'public.perfumes'::regclass), true, 'RLS ligada em perfumes');
select is((select relrowsecurity from pg_class where oid = 'public.notes'::regclass), true, 'RLS ligada em notes');
select is((select relrowsecurity from pg_class where oid = 'public.perfume_notes'::regclass), true, 'RLS ligada em perfume_notes');
select is((select relrowsecurity from pg_class where oid = 'public.collection_items'::regclass), true, 'RLS ligada em collection_items');
select is((select relrowsecurity from pg_class where oid = 'public.daily_perfumes'::regclass), true, 'RLS ligada em daily_perfumes');
select is((select relrowsecurity from pg_class where oid = 'public.perfume_reviews'::regclass), true, 'RLS ligada em perfume_reviews');
select policies_are('public','profiles',array['profiles: owner select','profiles: owner update'],'profiles: sem INSERT nem DELETE');
select policies_are('public','collection_items',array['collection: owner select','collection: owner insert','collection: owner update','collection: owner delete'],'collection_items: 4 policies de dono');
select policies_are('public','daily_perfumes',array['daily: owner select'],'daily_perfumes: somente SELECT do dono');
select policies_are('public','perfume_reviews',array['reviews: owner select','reviews: insert if authorized','reviews: owner update','reviews: owner delete'],'perfume_reviews: 4 policies de dono (insert com RN03)');
select policies_are('public','brands',array['brands: public select','brands: admin insert','brands: admin update','brands: admin delete'],'brands: leitura pública, escrita admin');
select policies_are('public','perfumes',array['perfumes: public select','perfumes: admin insert','perfumes: admin update','perfumes: admin delete'],'perfumes: leitura pública, escrita admin');
select policies_are('public','notes',array['notes: public select','notes: admin insert','notes: admin update','notes: admin delete'],'notes: leitura pública, escrita admin');
select policies_are('public','perfume_notes',array['perfume_notes: public select','perfume_notes: admin insert','perfume_notes: admin update','perfume_notes: admin delete'],'perfume_notes: leitura pública, escrita admin');
select is((select count(*) from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='olfactive_family'), 10::bigint, 'olfactive_family tem 10 valores');
select has_index('public','perfumes','perfumes_search_name_trgm_idx','índice trigram em perfumes.search_name');
select has_index('public','brands','brands_search_name_trgm_idx','índice trigram em brands.search_name');
select has_function('public','set_daily_perfume',array['uuid'],'set_daily_perfume(uuid) existe');
select is((select prosecdef from pg_proc where proname='set_updated_at' and pronamespace='public'::regnamespace), false, 'set_updated_at não é security definer');
select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder) from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'concentration_type'),
  array['parfum', 'extrait', 'edp', 'edt', 'edc'],
  'concentration_type aceita só parfum, extrait, edp, edt e edc'
);
select throws_ok($t$select 'other'::public.concentration_type$t$, '22P02', null, 'concentration_type rejeita "other"');

select * from finish();
rollback;
