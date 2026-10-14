-- RN01: privacidade — cada usuário só acessa o que é seu
begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

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
insert into public.collection_items (id, user_id, perfume_id, status) values
  ('c1000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned'),
  ('c1000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000002', 'wanted');
insert into public.daily_perfumes (id, user_id, perfume_id, date) values
  ('d1000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', current_date),
  ('d1000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000002', current_date);
insert into public.perfume_reviews (id, user_id, perfume_id, longevity_rating, projection_rating) values
  ('e1000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 4),
  ('e1000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000002', 3, 3);

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is((select count(*) from public.profiles), 1::bigint, 'RN01: A vê só 1 perfil (o próprio)');
select is((select count(*) from public.profiles where id = 'a0000000-0000-4000-8000-00000000000a'), 1::bigint, 'RN01: A lê o próprio perfil');
select is((select count(*) from public.profiles where id = 'b0000000-0000-4000-8000-00000000000b'), 0::bigint, 'RN01: A não vê o perfil de B');
select is(pg_temp.affected($t$update public.profiles set display_name = 'Alice 2' where id = 'a0000000-0000-4000-8000-00000000000a'$t$), 1::bigint, 'RN01: A edita o próprio perfil');
select is(pg_temp.affected($t$update public.profiles set display_name = 'hack' where id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não altera o perfil de B');
select is(pg_temp.affected($t$delete from public.profiles where id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não apaga o perfil de B');
select is(pg_temp.affected($t$delete from public.profiles where id = 'a0000000-0000-4000-8000-00000000000a'$t$), 0::bigint, 'RN01: ninguém apaga perfil direto (só cascade)');
select throws_ok($t$insert into public.profiles (id, display_name) values (gen_random_uuid(), 'x')$t$, '42501', null, 'RN01: INSERT direto em profiles é negado');
select is((select count(*) from public.collection_items), 1::bigint, 'RN01: A vê só a própria coleção');
select is((select count(*) from public.collection_items where user_id = 'b0000000-0000-4000-8000-00000000000b'), 0::bigint, 'RN01: A não vê coleção de B');
select is(pg_temp.affected($t$update public.collection_items set status = 'wanted' where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não altera coleção de B');
select is(pg_temp.affected($t$delete from public.collection_items where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não apaga coleção de B');
select throws_ok($t$insert into public.collection_items (user_id, perfume_id, status) values ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000003', 'owned')$t$, '42501', null, 'RN01: INSERT na coleção com user_id de B é rejeitado');
select lives_ok($t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000003', 'wanted')$t$, 'RN01: A insere na própria coleção');
select is(pg_temp.affected($t$update public.collection_items set status = 'owned' where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000003'$t$), 1::bigint, 'RN01: A edita a própria coleção');
select is(pg_temp.affected($t$delete from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000003'$t$), 1::bigint, 'RN01: A apaga da própria coleção');
select is((select count(*) from public.daily_perfumes), 1::bigint, 'RN01: A vê só o próprio histórico');
select is((select count(*) from public.daily_perfumes where user_id = 'b0000000-0000-4000-8000-00000000000b'), 0::bigint, 'RN01: A não vê histórico de B');
select is(pg_temp.affected($t$delete from public.daily_perfumes where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não apaga histórico de B');
select throws_ok($t$update public.daily_perfumes set perfume_id = '11111111-0000-4000-8000-000000000003' where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$, '42501', null, 'RN01: A não altera histórico de B');
select throws_ok($t$insert into public.daily_perfumes (user_id, perfume_id, date) values ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000003', current_date - 1)$t$, '42501', null, 'RN01: INSERT em daily_perfumes com user_id de B é rejeitado');
select is((select count(*) from public.perfume_reviews), 1::bigint, 'RN01: A vê só as próprias avaliações');
select is((select count(*) from public.perfume_reviews where user_id = 'b0000000-0000-4000-8000-00000000000b'), 0::bigint, 'RN01: A não vê avaliação de B');
select is(pg_temp.affected($t$update public.perfume_reviews set comment = 'hack' where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não altera avaliação de B');
select is(pg_temp.affected($t$delete from public.perfume_reviews where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'RN01: A não apaga avaliação de B');
select throws_ok($t$insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating) values ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', 3, 3)$t$, '42501', null, 'RN01: INSERT de avaliação com user_id de B é rejeitado');
select is(pg_temp.affected($t$update public.perfume_reviews set comment = 'minha' where user_id = 'a0000000-0000-4000-8000-00000000000a'$t$), 1::bigint, 'RN01: A edita a própria avaliação');
select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');
select is((select count(*) from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'RN01: B não vê coleção de A');
select is((select count(*) from public.perfume_reviews where user_id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'RN01: B não vê avaliação de A');
select is((select count(*) from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'RN01: B não vê histórico de A');

select * from finish();
rollback;
