-- RN04: uma avaliação por usuário e perfume
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

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
insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned');

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select lives_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 4)$t$, 'RN04: primeira avaliação entra');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 5, 5)$t$, '23505', null, 'RN04: segunda avaliação do mesmo (user, perfume) falha');
select is((select count(*) from public.perfume_reviews where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'), 1::bigint, 'RN04: continua 1 avaliação');
select is(pg_temp.affected($t$update public.perfume_reviews set longevity_rating = 5 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$), 1::bigint, 'RN04: reenviar atualiza a mesma linha');

select * from finish();
rollback;
