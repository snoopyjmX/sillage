-- Perfumistas: leitura pública, escrita só admin, slug único e ligação N:N com cascata
begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

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
  ('c0000000-0000-4000-8000-00000000000c', 'authenticated', 'authenticated', 'admin@test.local', '{"name":"Admin"}');
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Perfume 2', 'perfume-2', 'unisex', 'edp');
insert into public.perfumers (id, name, slug, bio, country) values
  ('44444444-0000-4000-8000-000000000001', 'Nariz Um', 'nariz-um', 'Biografia', 'França'),
  ('44444444-0000-4000-8000-000000000002', 'Nariz Dois', 'nariz-dois', null, null);
insert into public.perfume_perfumers (perfume_id, perfumer_id, position) values
  ('11111111-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000001', 1),
  ('11111111-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000002', 2);

-- Estrutura
select is((select relrowsecurity from pg_class where oid = 'public.perfumers'::regclass), true, 'RLS ligada em perfumers');
select is((select relrowsecurity from pg_class where oid = 'public.perfume_perfumers'::regclass), true, 'RLS ligada em perfume_perfumers');
select policies_are('public', 'perfumers', array['perfumers: public select', 'perfumers: admin insert', 'perfumers: admin update', 'perfumers: admin delete'], 'perfumers: leitura pública, escrita admin');
select policies_are('public', 'perfume_perfumers', array['perfume_perfumers: public select', 'perfume_perfumers: admin insert', 'perfume_perfumers: admin update', 'perfume_perfumers: admin delete'], 'perfume_perfumers: leitura pública, escrita admin');
select hasnt_column('public', 'perfumes', 'perfumer', 'a coluna de texto perfumes.perfumer foi removida');

-- Leitura pública
select pg_temp.act_anon();
select is((select count(*) from public.perfumers), 2::bigint, 'anon lê perfumers');
select is((select count(*) from public.perfume_perfumers), 2::bigint, 'anon lê perfume_perfumers');
select throws_ok($t$insert into public.perfumers (name, slug) values ('Anon', 'anon')$t$, '42501', null, 'anon não insere em perfumers');

-- Usuário comum: lê, mas não escreve
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is((select count(*) from public.perfumers), 2::bigint, 'usuário comum lê perfumers');
select throws_ok($t$insert into public.perfumers (name, slug) values ('Comum', 'comum')$t$, '42501', null, 'usuário comum não insere em perfumers');
select is(pg_temp.affected($t$update public.perfumers set name = 'Hack' where slug = 'nariz-um'$t$), 0::bigint, 'usuário comum não altera perfumers');
select is(pg_temp.affected($t$delete from public.perfumers where slug = 'nariz-um'$t$), 0::bigint, 'usuário comum não apaga perfumers');
select throws_ok(
  $t$insert into public.perfume_perfumers (perfume_id, perfumer_id) values ('11111111-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000001')$t$,
  '42501', null, 'usuário comum não liga perfume a perfumista');
select is(pg_temp.affected($t$delete from public.perfume_perfumers$t$), 0::bigint, 'usuário comum não apaga ligações');

-- Admin (app_metadata.role)
select pg_temp.act_as('c0000000-0000-4000-8000-00000000000c', '{"role":"admin"}'::jsonb);
select lives_ok($t$insert into public.perfumers (name, slug) values ('Nariz Três', 'nariz-tres')$t$, 'admin insere em perfumers');
select lives_ok(
  $t$insert into public.perfume_perfumers (perfume_id, perfumer_id, position) values ('11111111-0000-4000-8000-000000000002', (select id from public.perfumers where slug = 'nariz-tres'), 1)$t$,
  'admin liga perfume a perfumista');

-- Integridade (como dono do banco)
select pg_temp.act_postgres();
select throws_ok($t$insert into public.perfumers (name, slug) values ('Outro', 'nariz-um')$t$, '23505', null, 'slug é único');
select throws_ok($t$insert into public.perfumers (name, slug) values ('Maiúscula', 'Nariz-Tres-X')$t$, '23514', null, 'slug só aceita minúsculas, números e hífen');
select throws_ok($t$insert into public.perfumers (name, slug) values ('   ', 'em-branco')$t$, '23514', null, 'name em branco é recusado');
select throws_ok(
  $t$insert into public.perfume_perfumers (perfume_id, perfumer_id, position) values ('11111111-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000001', 3)$t$,
  '23505', null, 'o mesmo perfumista não entra duas vezes no mesmo perfume');
select throws_ok(
  $t$insert into public.perfume_perfumers (perfume_id, perfumer_id, position) values ('11111111-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000002', 0)$t$,
  '23514', null, 'position começa em 1');

-- Cascata: apagar o perfume ou o perfumista remove só a ligação
delete from public.perfumes where slug = 'perfume-1';
select is((select count(*) from public.perfume_perfumers where perfume_id = '11111111-0000-4000-8000-000000000001'), 0::bigint, 'apagar o perfume remove as ligações');
delete from public.perfumers where slug = 'nariz-tres';
select is((select count(*) from public.perfumes where slug = 'perfume-2'), 1::bigint, 'apagar o perfumista não apaga o perfume');

select * from finish();
rollback;
