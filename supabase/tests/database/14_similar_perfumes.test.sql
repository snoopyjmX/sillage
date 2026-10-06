-- Fase 10 (RN09): get_similar_perfumes ordena por notas em comum e exclui o próprio perfume
begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values
  ('11111111-0000-4000-8000-0000000000ff', '22222222-0000-4000-8000-000000000001', 'Alvo', 'alvo', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-00000000000a', '22222222-0000-4000-8000-000000000001', 'A tres notas', 'a-tres', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-00000000000b', '22222222-0000-4000-8000-000000000001', 'B duas notas', 'b-duas', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-00000000000c', '22222222-0000-4000-8000-000000000001', 'C uma nota', 'c-uma', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-00000000000d', '22222222-0000-4000-8000-000000000001', 'D nenhuma', 'd-nenhuma', 'unisex', 'edp');
insert into public.notes (id, name, slug, family) values
  ('33333333-0000-4000-8000-000000000001', 'Nota 1', 'nota-1', 'citrus'),
  ('33333333-0000-4000-8000-000000000002', 'Nota 2', 'nota-2', 'floral'),
  ('33333333-0000-4000-8000-000000000003', 'Nota 3', 'nota-3', 'woody'),
  ('33333333-0000-4000-8000-000000000004', 'Nota 4', 'nota-4', 'woody');
insert into public.perfume_notes (perfume_id, note_id, position) values
  ('11111111-0000-4000-8000-0000000000ff', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-0000000000ff', '33333333-0000-4000-8000-000000000002', 'heart'),
  ('11111111-0000-4000-8000-0000000000ff', '33333333-0000-4000-8000-000000000003', 'base'),
  -- A: as três notas do alvo (a nota 1 em duas posições conta uma vez)
  ('11111111-0000-4000-8000-00000000000a', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-00000000000a', '33333333-0000-4000-8000-000000000001', 'heart'),
  ('11111111-0000-4000-8000-00000000000a', '33333333-0000-4000-8000-000000000002', 'heart'),
  ('11111111-0000-4000-8000-00000000000a', '33333333-0000-4000-8000-000000000003', 'base'),
  -- B: duas
  ('11111111-0000-4000-8000-00000000000b', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-00000000000b', '33333333-0000-4000-8000-000000000002', 'heart'),
  -- C: uma (mais uma que o alvo não tem)
  ('11111111-0000-4000-8000-00000000000c', '33333333-0000-4000-8000-000000000003', 'base'),
  ('11111111-0000-4000-8000-00000000000c', '33333333-0000-4000-8000-000000000004', 'base'),
  -- D: só uma nota que o alvo não tem
  ('11111111-0000-4000-8000-00000000000d', '33333333-0000-4000-8000-000000000004', 'base');

create function pg_temp.act_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

select pg_temp.act_anon();

select results_eq(
  $q$select id from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 10)$q$,
  $q$values ('11111111-0000-4000-8000-00000000000a'::uuid), ('11111111-0000-4000-8000-00000000000b'::uuid), ('11111111-0000-4000-8000-00000000000c'::uuid)$q$,
  'RN09: mais notas em comum primeiro; quem não compartilha nada fica de fora'
);
select is(
  (select count(*) from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 10) where id = '11111111-0000-4000-8000-0000000000ff'),
  0::bigint, 'RN09: exclui o próprio perfume alvo'
);
select results_eq(
  $q$select common_notes from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 10)$q$,
  $q$values (3::bigint), (2::bigint), (1::bigint)$q$,
  'RN09: a mesma nota em duas posições conta uma vez'
);
select is(
  (select count(*) from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 2)),
  2::bigint, 'RN09: respeita limit_count'
);
select results_eq(
  $q$select name, brand_id, slug, image_path, brand_name from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 1)$q$,
  $q$values ('A tres notas'::text, '22222222-0000-4000-8000-000000000001'::uuid, 'a-tres'::text, null::text, 'Marca Teste'::text)$q$,
  'RN09: devolve os campos da interface'
);
select is(
  (select families from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 1)),
  array['citrus','floral','woody']::public.olfactive_family[], 'RN09: famílias derivadas das notas, na ordem do enum'
);
select is(
  (select count(*) from public.get_similar_perfumes('11111111-0000-4000-8000-000000000999', 10)),
  0::bigint, 'RN09: alvo inexistente devolve lista vazia'
);
select is(
  (select count(*) from public.get_similar_perfumes('11111111-0000-4000-8000-00000000000d', 10) where id = '11111111-0000-4000-8000-00000000000c'),
  1::bigint, 'RN09: a similaridade vale para qualquer perfume alvo'
);
select throws_ok($q$select * from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 0)$q$, '22023', null, 'RN09: limite 0 é recusado');
select throws_ok($q$select * from public.get_similar_perfumes('11111111-0000-4000-8000-0000000000ff', 25)$q$, '22023', null, 'RN09: limite acima de 24 é recusado');
select is(
  (select prosecdef from pg_proc where proname = 'get_similar_perfumes'),
  false, 'RN09: função é SECURITY INVOKER (a RLS do chamador vale)'
);

select * from finish();
rollback;
