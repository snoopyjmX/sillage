-- Fase 23: get_annual_recap lê só o Memorial do próprio usuário (RN01), no hemisfério Sul
begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

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

-- Fixtures (desfeitas pelo rollback no fim). O perfil nasce com o fuso America/Sao_Paulo.
insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@test.local', '{"name":"Alice"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'b@test.local', '{"name":"Bruno"}'),
  ('c0000000-0000-4000-8000-00000000000c', 'authenticated', 'authenticated', 'c@test.local', '{"name":"Carla"}');
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Alfa', 'recap-alfa', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Beta', 'recap-beta', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Gama', 'recap-gama', 'unisex', 'edp');
insert into public.notes (id, name, slug, family) values
  ('33333333-0000-4000-8000-000000000001', 'Nota Citrica', 'recap-citrica', 'citrus'),
  ('33333333-0000-4000-8000-000000000002', 'Nota Amadeirada A', 'recap-amadeirada-a', 'woody'),
  ('33333333-0000-4000-8000-000000000003', 'Nota Amadeirada B', 'recap-amadeirada-b', 'woody'),
  ('33333333-0000-4000-8000-000000000004', 'Nota Floral', 'recap-floral', 'floral');
-- Alfa: cítrica + amadeirada A | Beta: amadeiradas A e B | Gama: floral + amadeirada A
insert into public.perfume_notes (perfume_id, note_id, position) values
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', 'base'),
  -- a mesma nota em duas posições conta uma vez
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'heart'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'base'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000003', 'base'),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000004', 'heart'),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000002', 'base');
-- Alice em 2026: Alfa 2 dias (jan, fev) | Beta 3 dias (mar, jul, jul) | Gama 3 dias (dez, dez, dez)
insert into public.daily_perfumes (user_id, perfume_id, date) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', '2026-01-10'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', '2026-02-10'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000002', '2026-03-10'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000002', '2026-07-10'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000002', '2026-07-11'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', '2026-12-05'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', '2026-12-06'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', '2026-12-07'),
  -- de outro ano: não entra em 2026
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', '2025-06-01'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', '2026-01-20');

-- Permissão: só quem está logado executa
select pg_temp.act_anon();
select throws_ok($t$select public.get_annual_recap(2026)$t$, '42501', null, 'anon não executa get_annual_recap');

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is(
  (select prosecdef from pg_proc where proname = 'get_annual_recap' and pronamespace = 'public'::regnamespace),
  false, 'get_annual_recap é security invoker');

-- Anos válidos: de 2026 até o ano de hoje
select throws_ok($t$select public.get_annual_recap(2025)$t$, '22023', null, 'ano antes de 2026 é recusado');
select throws_ok(
  $t$select public.get_annual_recap(extract(year from now())::int + 1)$t$,
  '22023', null, 'ano futuro é recusado');
select throws_ok($t$select public.get_annual_recap(null)$t$, '22023', null, 'ano nulo é recusado');

-- Dias e consistência (dias decorridos: do 1º de janeiro até hoje, ou o ano inteiro se já passou)
select is((public.get_annual_recap(2026) ->> 'days_worn')::int, 8, 'conta só os dias de 2026 do próprio usuário');
select is(
  (public.get_annual_recap(2026) ->> 'days_elapsed')::int,
  ((least(date '2026-12-31', (now() at time zone 'America/Sao_Paulo')::date) - date '2026-01-01') + 1),
  'dias decorridos vão de 1º de janeiro até hoje (ou o ano inteiro, se já acabou)');
select is(
  (public.get_annual_recap(2026) ->> 'consistency')::numeric,
  round(8::numeric / ((least(date '2026-12-31', (now() at time zone 'America/Sao_Paulo')::date) - date '2026-01-01') + 1), 4),
  'consistência = dias vestidos / dias decorridos');

-- Assinatura: Beta e Gama empatam em 3 dias; o nome desempata (Beta)
select is(public.get_annual_recap(2026) -> 'signature' ->> 'slug', 'recap-beta', 'assinatura com empate: vence o nome (Beta)');
select is((public.get_annual_recap(2026) -> 'signature' ->> 'days')::int, 3, 'a assinatura traz o nº de dias');

-- Estações (hemisfério Sul): dezembro entra no verão do mesmo ano civil
select is(public.get_annual_recap(2026) -> 'seasons' -> 'summer' ->> 'slug', 'recap-gama', 'verão junta jan-fev e dez do mesmo ano: Gama (3 dias) vence Alfa (2)');
select is((public.get_annual_recap(2026) -> 'seasons' -> 'summer' ->> 'days')::int, 3, 'verão: 3 dias');
select is(public.get_annual_recap(2026) -> 'seasons' -> 'autumn' ->> 'slug', 'recap-beta', 'outono (março): Beta');
select is(public.get_annual_recap(2026) -> 'seasons' -> 'winter' ->> 'slug', 'recap-beta', 'inverno (julho): Beta');
select is(public.get_annual_recap(2026) -> 'seasons' -> 'spring', 'null'::jsonb, 'primavera sem dias fica nula');

-- Nota mais presente: amadeirada A está em Alfa (2) + Beta (3) + Gama (3) = 8
select is(public.get_annual_recap(2026) -> 'top_note' ->> 'slug', 'recap-amadeirada-a', 'nota mais presente: amadeirada A');
select is((public.get_annual_recap(2026) -> 'top_note' ->> 'weight')::int, 8, 'a nota pesa 1 por dia, uma vez por perfume');

-- Famílias por semestre (cada dia soma 1 por nota distinta da família)
select is(
  public.get_annual_recap(2026) -> 'families' -> 'first_semester',
  '[{"family": "woody", "weight": 4}, {"family": "citrus", "weight": 2}]'::jsonb,
  '1º semestre: amadeirado 4 e cítrico 2');
select is(
  public.get_annual_recap(2026) -> 'families' -> 'second_semester',
  '[{"family": "woody", "weight": 7}, {"family": "floral", "weight": 3}]'::jsonb,
  '2º semestre: amadeirado 7 e floral 3');

-- Isolamento: Bruno só vê o próprio dia
select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');
select is((public.get_annual_recap(2026) ->> 'days_worn')::int, 1, 'RN01: Bruno não enxerga os dias da Alice');
select is(public.get_annual_recap(2026) -> 'signature' ->> 'slug', 'recap-alfa', 'RN01: a assinatura do Bruno é a dele');

-- Ano sem dados: zeros, nulos e listas vazias (nunca erro)
select pg_temp.act_as('c0000000-0000-4000-8000-00000000000c');
select is(
  (public.get_annual_recap(2026) ->> 'days_worn')::int || '/' || (public.get_annual_recap(2026) ->> 'consistency'),
  '0/0.0000', 'sem dias: 0 dias e consistência 0');
select is(public.get_annual_recap(2026) -> 'signature', 'null'::jsonb, 'sem dias: sem assinatura');
select is(public.get_annual_recap(2026) -> 'top_note', 'null'::jsonb, 'sem dias: sem nota mais presente');

select * from finish();
rollback;
