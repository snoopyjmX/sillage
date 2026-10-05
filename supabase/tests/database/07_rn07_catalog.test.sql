-- RN07: catálogo com leitura pública e escrita só para admin
begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

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
insert into public.notes (id, name, slug, family) values ('33333333-0000-4000-8000-000000000001', 'Nota Teste', 'nota-teste', 'citrus');
insert into public.perfume_notes (perfume_id, note_id, position) values ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'top');

select pg_temp.act_anon();
select cmp_ok((select count(*) from public.brands), '>', 0::bigint, 'RN07: anon lê brands');
select cmp_ok((select count(*) from public.perfumes), '>', 0::bigint, 'RN07: anon lê perfumes');
select cmp_ok((select count(*) from public.notes), '>', 0::bigint, 'RN07: anon lê notes');
select cmp_ok((select count(*) from public.perfume_notes), '>', 0::bigint, 'RN07: anon lê perfume_notes');
select throws_ok($t$insert into public.brands (name, slug) values ('Anon', 'anon-marca')$t$, '42501', null, 'RN07: anon não escreve em brands');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select cmp_ok((select count(*) from public.brands), '>', 0::bigint, 'RN07: usuário comum lê brands');
select cmp_ok((select count(*) from public.perfumes), '>', 0::bigint, 'RN07: usuário comum lê perfumes');
select cmp_ok((select count(*) from public.notes), '>', 0::bigint, 'RN07: usuário comum lê notes');
select cmp_ok((select count(*) from public.perfume_notes), '>', 0::bigint, 'RN07: usuário comum lê perfume_notes');
select throws_ok($t$insert into public.brands (name, slug) values ('Comum', 'comum-marca')$t$, '42501', null, 'RN07: usuário comum não insere em brands');
select throws_ok($t$insert into public.perfumes (brand_id, name, slug, gender, concentration) values ('22222222-0000-4000-8000-000000000001', 'X', 'x', 'unisex', 'edp')$t$, '42501', null, 'RN07: usuário comum não insere em perfumes');
select throws_ok($t$insert into public.notes (name, slug, family) values ('X', 'x', 'citrus')$t$, '42501', null, 'RN07: usuário comum não insere em notes');
select throws_ok($t$insert into public.perfume_notes (perfume_id, note_id, position) values ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000001', 'top')$t$, '42501', null, 'RN07: usuário comum não insere em perfume_notes');
select is(pg_temp.affected($t$update public.perfumes set description = 'hack' where id = '11111111-0000-4000-8000-000000000001'$t$), 0::bigint, 'RN07: usuário comum não atualiza perfumes (0 linhas)');
select is(pg_temp.affected($t$update public.brands set description = 'hack' where id = '22222222-0000-4000-8000-000000000001'$t$), 0::bigint, 'RN07: usuário comum não atualiza brands (0 linhas)');
select is(pg_temp.affected($t$delete from public.perfumes where id = '11111111-0000-4000-8000-000000000004'$t$), 0::bigint, 'RN07: usuário comum não apaga perfumes (0 linhas)');
select is(pg_temp.affected($t$delete from public.notes where slug = 'nota-teste'$t$), 0::bigint, 'RN07: usuário comum não apaga notes (0 linhas)');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a', '{}'::jsonb, '{"role":"admin"}'::jsonb);
select is((select public.is_admin()), false::boolean, 'RN07: user_metadata.role = admin NÃO torna admin');
select throws_ok($t$insert into public.brands (name, slug) values ('Fake', 'fake-marca')$t$, '42501', null, 'RN07: user_metadata admin não insere em brands');
select is(pg_temp.affected($t$update public.perfumes set description = 'hack' where id = '11111111-0000-4000-8000-000000000001'$t$), 0::bigint, 'RN07: user_metadata admin não atualiza perfumes');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a', '{"role":"admin"}'::jsonb);
select is((select public.is_admin()), true::boolean, 'RN07: app_metadata.role = admin é admin');
select lives_ok($t$insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000009', 'Admin Marca', 'admin-marca')$t$, 'RN07: admin insere em brands');
select lives_ok($t$insert into public.perfumes (brand_id, name, slug, gender, concentration) values ('22222222-0000-4000-8000-000000000001', 'Admin', 'admin-perfume', 'unisex', 'edp')$t$, 'RN07: admin insere em perfumes');
select lives_ok($t$insert into public.notes (name, slug, family) values ('Admin Nota', 'admin-nota', 'woody')$t$, 'RN07: admin insere em notes');
select lives_ok($t$insert into public.perfume_notes (perfume_id, note_id, position) values ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000001', 'heart')$t$, 'RN07: admin insere em perfume_notes');
select is(pg_temp.affected($t$update public.perfumes set description = 'ok' where id = '11111111-0000-4000-8000-000000000001'$t$), 1::bigint, 'RN07: admin atualiza perfumes');
select is(pg_temp.affected($t$delete from public.brands where slug = 'admin-marca'$t$), 1::bigint, 'RN07: admin apaga brands');
select is(pg_temp.affected($t$delete from public.notes where slug = 'admin-nota'$t$), 1::bigint, 'RN07: admin apaga notes');

select * from finish();
rollback;
