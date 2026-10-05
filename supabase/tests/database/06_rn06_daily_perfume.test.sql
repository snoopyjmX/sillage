-- RN06: um Perfume do Dia por data, no fuso do usuário
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

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
insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('c0000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', 'k@test.local', '{"timezone":"Pacific/Kiritimati"}'),
  ('c0000000-0000-4000-8000-0000000000c2', 'authenticated', 'authenticated', 'p@test.local', '{"timezone":"Pacific/Pago_Pago"}');

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select throws_ok($t$insert into public.daily_perfumes (user_id, perfume_id, date) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', current_date)$t$, '42501', null, 'RN06: INSERT direto em daily_perfumes é negado');
select is((select (public.set_daily_perfume('11111111-0000-4000-8000-000000000001')).perfume_id::text), '11111111-0000-4000-8000-000000000001'::text, 'RN06: set_daily_perfume cria o registro');
select is((select count(*) from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), 1::bigint, 'RN06: 1 linha após a primeira chamada');
select lives_ok($t$select public.set_daily_perfume('11111111-0000-4000-8000-000000000002')$t$, 'RN06: segunda chamada no mesmo dia funciona');
select is((select count(*) from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), 1::bigint, 'RN06: continua 1 linha no dia');
select is((select perfume_id::text from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), '11111111-0000-4000-8000-000000000002'::text, 'RN06: a segunda escolha substituiu a primeira');
select is((select date from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), (now() at time zone 'America/Sao_Paulo')::date::date, 'RN06: data no fuso padrão do perfil');
select throws_ok($t$update public.daily_perfumes set perfume_id = '11111111-0000-4000-8000-000000000003' where user_id = 'a0000000-0000-4000-8000-00000000000a'$t$, '42501', null, 'RN06: UPDATE direto em daily_perfumes é negado');
select is(pg_temp.affected($t$delete from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'$t$), 0::bigint, 'RN06: DELETE direto em daily_perfumes afeta 0 linhas');
select is((select count(*) from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), 1::bigint, 'RN06: o histórico continua intacto');
select pg_temp.act_as('c0000000-0000-4000-8000-0000000000c1');
select lives_ok($t$select public.set_daily_perfume('11111111-0000-4000-8000-000000000001')$t$, 'RN06: usuário em Pacific/Kiritimati registra');
select is((select date from public.daily_perfumes where user_id = 'c0000000-0000-4000-8000-0000000000c1'), (now() at time zone 'Pacific/Kiritimati')::date::date, 'RN06: data respeita Pacific/Kiritimati');
select pg_temp.act_as('c0000000-0000-4000-8000-0000000000c2');
select lives_ok($t$select public.set_daily_perfume('11111111-0000-4000-8000-000000000001')$t$, 'RN06: usuário em Pacific/Pago_Pago registra');
select is((select date from public.daily_perfumes where user_id = 'c0000000-0000-4000-8000-0000000000c2'), (now() at time zone 'Pacific/Pago_Pago')::date::date, 'RN06: data respeita Pacific/Pago_Pago');
select pg_temp.act_postgres();
select isnt((select date from public.daily_perfumes where user_id = 'c0000000-0000-4000-8000-0000000000c1'), (select date from public.daily_perfumes where user_id = 'c0000000-0000-4000-8000-0000000000c2'), 'RN06: no mesmo instante os dois fusos têm datas diferentes');
select pg_temp.act_anon();
select throws_ok($t$select public.set_daily_perfume('11111111-0000-4000-8000-000000000001')$t$, '42501', null, 'RN06: anon não executa set_daily_perfume');

select * from finish();
rollback;
