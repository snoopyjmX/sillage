-- Fase 22: get_discovery_candidates pré-seleciona, de forma determinística, quem o Nez pode recomendar
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

create function pg_temp.act_postgres() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Fixtures (desfeitas pelo rollback no fim). O catálogo é esvaziado dentro da transação
-- (com o que referencia perfumes, caso o banco local tenha dados de E2E) para o ranking depender
-- só destes perfumes.
delete from public.collection_items;
delete from public.daily_perfumes;
delete from public.perfume_reviews;
delete from public.perfume_notes;
delete from public.perfumes;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@test.local', '{"name":"Alice"}');
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration, image_path) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Alfa', 'alfa', 'unisex', 'edp', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Beta', 'beta', 'unisex', 'edt', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Gama', 'gama', 'unisex', 'edp', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Delta', 'delta', 'unisex', 'edp', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'Sem Notas', 'sem-notas', 'unisex', 'edp', 'teste/foto.webp');
insert into public.notes (id, name, slug, family) values
  ('33333333-0000-4000-8000-000000000001', 'Nota Citrica', 'nota-citrica', 'citrus'),
  ('33333333-0000-4000-8000-000000000002', 'Nota Amadeirada A', 'nota-amadeirada-a', 'woody'),
  ('33333333-0000-4000-8000-000000000003', 'Nota Amadeirada B', 'nota-amadeirada-b', 'woody'),
  ('33333333-0000-4000-8000-000000000004', 'Nota Floral', 'nota-floral', 'floral');
-- Alfa: citrus + woody | Beta: woody (duas notas, conta uma família) | Gama: floral | Delta: citrus
insert into public.perfume_notes (perfume_id, note_id, position) values
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', 'base'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'heart'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000003', 'base'),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000004', 'heart'),
  ('11111111-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000001', 'top');

-- Permissões: só quem está logado executa
select pg_temp.act_anon();
select throws_ok(
  $t$select * from public.get_discovery_candidates('{citrus}', '{}', 12)$t$,
  '42501', null, 'anon não executa get_discovery_candidates');

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is(
  (select prosecdef from pg_proc where proname = 'get_discovery_candidates' and pronamespace = 'public'::regnamespace),
  false, 'get_discovery_candidates é security invoker');

-- Preferida vale 2 e clima vale 1: preferida woody, clima citrus => Alfa (2+1), Beta (2), Delta (1)
select is(
  (select array_agg(slug order by score desc, name) from public.get_discovery_candidates('{citrus}', '{woody}', 12)),
  array['alfa', 'beta', 'delta'],
  'ordena por pontos: preferida pesa 2, clima pesa 1');
select is(
  (select score from public.get_discovery_candidates('{citrus}', '{woody}', 12) where slug = 'alfa'),
  3, 'Alfa soma 2 (woody preferida) + 1 (citrus do clima)');
select is(
  (select score from public.get_discovery_candidates('{citrus}', '{woody}', 12) where slug = 'beta'),
  2, 'duas notas da mesma família contam uma vez só');

-- Quem não pontua não é candidato
select is(
  (select count(*) from public.get_discovery_candidates('{citrus}', '{woody}', 12) where slug in ('gama', 'sem-notas')),
  0::bigint, 'perfume sem família preferida nem do clima, ou sem notas, fica de fora');

-- Só clima, só preferida e arrays nulos
select is(
  (select array_agg(slug order by name) from public.get_discovery_candidates('{floral}', '{}', 12)),
  array['gama'], 'só clima: só entra quem combina');
select is(
  (select count(*) from public.get_discovery_candidates(null, null, 12)),
  0::bigint, 'arrays nulos não geram candidatos nem erro');

-- Empate: ordem alfabética do nome
select is(
  (select array_agg(slug order by name) from public.get_discovery_candidates('{citrus,floral}', '{}', 12)),
  array['alfa', 'delta', 'gama'], 'empate no placar usa a ordem do nome');
select is(
  (select slug from public.get_discovery_candidates('{citrus,floral}', '{}', 12) limit 1),
  'alfa', 'a primeira linha do empate é a primeira em ordem alfabética');

-- Limite
select is(
  (select count(*) from public.get_discovery_candidates('{citrus,woody,floral}', '{}', 2)),
  2::bigint, 'respeita o limite pedido');
select throws_ok(
  $t$select * from public.get_discovery_candidates('{citrus}', '{}', 0)$t$,
  '22023', null, 'limite 0 é recusado');
select throws_ok(
  $t$select * from public.get_discovery_candidates('{citrus}', '{}', 25)$t$,
  '22023', null, 'limite acima de 24 é recusado');

-- Notas por camada, em ordem (topo, coração, fundo)
select is(
  (select notes from public.get_discovery_candidates('{citrus}', '{woody}', 12) where slug = 'alfa'),
  '[{"name": "Nota Citrica", "position": "top"}, {"name": "Nota Amadeirada A", "position": "base"}]'::jsonb,
  'devolve as notas do perfume por camada');

select * from finish();
rollback;
