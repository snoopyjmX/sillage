-- Fase 16A: get_olfactory_dna() lê só os dados do próprio usuário (RN01) e pesa
-- "Tenho" (1) + dias no memorial (1 cada); "Quero" fica fora do espectro
begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_uid::text, 'role', 'authenticated')::text,
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

-- Fixtures (desfeitas pelo rollback no fim)
insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@test.local', '{"name":"Alice"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'b@test.local', '{"name":"Bruno"}');
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Perfume 2', 'perfume-2', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Perfume 3', 'perfume-3', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Perfume 4', 'perfume-4', 'unisex', 'edp');
insert into public.notes (id, name, slug, family) values
  ('33333333-0000-4000-8000-000000000001', 'Nota Citrica', 'nota-citrica', 'citrus'),
  ('33333333-0000-4000-8000-000000000002', 'Nota Amadeirada A', 'nota-amadeirada-a', 'woody'),
  ('33333333-0000-4000-8000-000000000003', 'Nota Amadeirada B', 'nota-amadeirada-b', 'woody'),
  ('33333333-0000-4000-8000-000000000004', 'Nota Floral', 'nota-floral', 'floral');
insert into public.perfume_notes (perfume_id, note_id, position) values
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', 'base'),
  -- a mesma nota em duas posições conta uma vez
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'heart'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'base'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000003', 'base'),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000004', 'heart'),
  ('11111111-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000001', 'top');
-- Alice: tem P1 e P2; quer P3 e P4; vestiu P1 em dois dias
insert into public.collection_items (user_id, perfume_id, status) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000002', 'owned'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', 'wanted'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000004', 'wanted');
insert into public.daily_perfumes (user_id, perfume_id, date) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', '2026-10-01'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', '2026-10-02');

-- Pesos: P1 = 1 (Tenho) + 2 (dias) = 3; P2 = 1.
-- Notas: amadeirada A = 3 + 1 = 4; cítrica = 3; amadeirada B = 1. Famílias: woody 5, citrus 3.

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');

select is(
  public.get_olfactory_dna() -> 'families',
  '[{"family":"woody","weight":5},{"family":"citrus","weight":3}]'::jsonb,
  'Tenho e dias no memorial pesam; "Quero" (floral) fica fora do espectro'
);
select is(
  (public.get_olfactory_dna() -> 'top_notes' -> 0 ->> 'slug'),
  'nota-amadeirada-a',
  'a nota mais presente vem primeiro; a mesma nota em duas posições conta uma vez por perfume'
);
select is(
  (select jsonb_agg(t ->> 'weight') from jsonb_array_elements(public.get_olfactory_dna() -> 'top_notes') t),
  '["4","3","1"]'::jsonb,
  'pesos das notas somam Tenho e memorial'
);
select is(
  jsonb_array_length(public.get_olfactory_dna() -> 'top_notes'),
  3,
  'no máximo 3 notas'
);
select is(
  (public.get_olfactory_dna() ->> 'perfume_count')::int,
  2,
  'perfume_count conta perfumes distintos (Tenho ∪ memorial)'
);
select is(
  (public.get_olfactory_dna() ->> 'memorial_days')::int,
  2,
  'memorial_days conta os dias'
);
select is(
  (public.get_olfactory_dna() ->> 'wanted_count')::int,
  2,
  'wanted_count conta os itens em "Quero"'
);
select is(
  public.get_olfactory_dna() ->> 'wish_family',
  'citrus',
  'wish_family: família mais frequente em "Quero", com empate pela ordem do enum'
);

-- Outro usuário recebe vazio: nada de Alice vaza (RN01)
select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');

select is(
  public.get_olfactory_dna(),
  '{"families":[],"top_notes":[],"wish_family":null,"wanted_count":0,"perfume_count":0,"memorial_days":0}'::jsonb,
  'outro usuário recebe o DNA vazio'
);

-- Perfume em Tenho e no memorial vale só uma vez em perfume_count
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is(
  (select count(*) from jsonb_array_elements(public.get_olfactory_dna() -> 'families')),
  2::bigint,
  'só entram famílias de perfumes pesados'
);

-- anon não executa a função
select pg_temp.act_anon();
select is(
  has_function_privilege('anon', 'public.get_olfactory_dna()', 'execute'),
  false,
  'anon não tem execute'
);
select throws_ok(
  $q$select public.get_olfactory_dna()$q$,
  '42501',
  null,
  'anon recebe permissão negada'
);

reset role;
select is(
  has_function_privilege('authenticated', 'public.get_olfactory_dna()', 'execute'),
  true,
  'authenticated tem execute'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.get_olfactory_dna()'::regprocedure),
  false,
  'a função é SECURITY INVOKER'
);

select * from finish();
rollback;
