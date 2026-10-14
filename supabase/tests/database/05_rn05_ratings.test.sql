-- RN05: ratings de 1 a 5 e comentário de até 1000 caracteres
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

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
insert into public.perfumes (id, brand_id, name, slug, gender, concentration, image_path) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Perfume 2', 'perfume-2', 'unisex', 'edp', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Perfume 3', 'perfume-3', 'unisex', 'edp', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Perfume 4', 'perfume-4', 'unisex', 'edp', 'teste/foto.webp');
insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned');

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 0, 3)$t$, '23514', null, 'RN05: longevity_rating = 0 é rejeitado');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', -1, 3)$t$, '23514', null, 'RN05: longevity_rating = -1 é rejeitado');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 6, 3)$t$, '23514', null, 'RN05: longevity_rating = 6 é rejeitado');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 3, 0)$t$, '23514', null, 'RN05: projection_rating = 0 é rejeitado');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 3, -1)$t$, '23514', null, 'RN05: projection_rating = -1 é rejeitado');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 3, 6)$t$, '23514', null, 'RN05: projection_rating = 6 é rejeitado');
select lives_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 1, 1)$t$, 'RN05: ratings 1 e 1 passam');
select lives_ok($t$update public.perfume_reviews set longevity_rating = 5, projection_rating = 5 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, 'RN05: ratings 5 e 5 passam');
select lives_ok($t$update public.perfume_reviews set longevity_rating = 3, projection_rating = 2 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, 'RN05: ratings intermediários passam');
select throws_ok($t$update public.perfume_reviews set longevity_rating = 6 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, '23514', null, 'RN05: UPDATE para longevity 6 é rejeitado');
select throws_ok($t$update public.perfume_reviews set projection_rating = 0 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, '23514', null, 'RN05: UPDATE para projection 0 é rejeitado');
select throws_ok($t$update public.perfume_reviews set comment = repeat('x', 1001) where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, '23514', null, 'RN05: comentário com 1001 caracteres é rejeitado');
select lives_ok($t$update public.perfume_reviews set comment = repeat('x', 1000) where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$, 'RN05: comentário com 1000 caracteres passa');

select * from finish();
rollback;
