-- RN03: avaliação só para quem tem (owned) ou já usou o perfume
begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

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
insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@test.local', '{"name":"Alice"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'b@test.local', '{"name":"Bruno"}');
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Perfume 2', 'perfume-2', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Perfume 3', 'perfume-3', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Perfume 4', 'perfume-4', 'unisex', 'edp');
insert into public.collection_items (user_id, perfume_id, status) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned'), ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000002', 'wanted');
insert into public.daily_perfumes (user_id, perfume_id, date) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', current_date - 3);

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select lives_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 3)$t$, 'RN03: avaliar perfume em owned passa');
select lives_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', 5, 5)$t$, 'RN03: avaliar perfume do histórico de Perfume do Dia passa');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000002', 3, 3)$t$, '42501', null, 'RN03: avaliar perfume em wanted sem histórico é rejeitado');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000004', 3, 3)$t$, '42501', null, 'RN03: avaliar perfume sem relação é rejeitado');
select is(pg_temp.affected($t$update public.collection_items set status = 'wanted' where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$), 1::bigint, 'RN03: A move o perfume avaliado para wanted');
select is(pg_temp.affected($t$update public.perfume_reviews set comment = 'editada', longevity_rating = 2 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$), 1::bigint, 'RN03: editar avaliação existente passa mesmo fora de owned');
select throws_ok($t$update public.perfume_reviews set perfume_id = '11111111-0000-4000-8000-000000000004' where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, '42501', null, 'RN03: não dá para trocar perfume_id de uma avaliação (UPDATE por coluna)');
select throws_ok($t$update public.perfume_reviews set user_id = 'b0000000-0000-4000-8000-00000000000b' where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, '42501', null, 'RN03: não dá para trocar user_id de uma avaliação');
select is((select count(*) from public.perfume_reviews where perfume_id = '11111111-0000-4000-8000-000000000004'), 0::bigint, 'RN03: nenhuma avaliação vazou para o perfume sem direito');

select * from finish();
rollback;
