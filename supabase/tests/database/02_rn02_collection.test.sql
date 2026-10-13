-- RN02: coleção única por (usuário, perfume)
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

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

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select lives_ok($t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'wanted')$t$, 'RN02: primeira linha entra');
select throws_ok($t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned')$t$, '23505', null, 'RN02: segunda linha para o mesmo (user, perfume) falha');
select lives_ok($t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned') on conflict (user_id, perfume_id) do update set status = excluded.status$t$, 'RN02: upsert wanted -> owned funciona');
select is((select count(*) from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'), 1::bigint, 'RN02: continua 1 linha');
select is((select status::text from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'), 'owned'::text, 'RN02: o estado virou owned');
select lives_ok($t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'wanted') on conflict (user_id, perfume_id) do update set status = excluded.status$t$, 'RN02: upsert owned -> wanted funciona');
select is((select status::text from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'), 'wanted'::text, 'RN02: o estado voltou a wanted');
select is((select count(*) from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'), 1::bigint, 'RN02: ainda 1 linha');

-- Fase 17A (RN11): formato e volume só existem em "Tenho"
select lives_ok(
  $t$update public.collection_items set status = 'owned', format = 'decant', volume_ml = 10 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$,
  'RN11: o dono detalha o formato de um perfume em Tenho'
);
select is(
  (select format::text || ' ' || volume_ml::text from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'),
  'decant 10.0',
  'RN11: formato e volume ficam gravados'
);
select lives_ok(
  $t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned') on conflict (user_id, perfume_id) do update set status = excluded.status$t$,
  'RN11: marcar Tenho de novo (upsert só do status) preserva o que já foi detalhado'
);
select is(
  (select format::text from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'),
  'decant',
  'RN11: o formato continua depois do upsert de owned'
);
select throws_ok(
  $t$insert into public.collection_items (user_id, perfume_id, status) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'wanted') on conflict (user_id, perfume_id) do update set status = excluded.status$t$,
  '23514', null,
  'RN11: owned -> wanted sem limpar formato e volume é rejeitado pelo banco'
);
select lives_ok(
  $t$insert into public.collection_items (user_id, perfume_id, status, format, volume_ml) values ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'wanted', null, null) on conflict (user_id, perfume_id) do update set status = excluded.status, format = excluded.format, volume_ml = excluded.volume_ml$t$,
  'RN11: o upsert de wanted limpa formato e volume'
);
select is(
  (select format is null and volume_ml is null from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'),
  true,
  'RN11: depois de owned -> wanted os dois campos estão nulos'
);
select throws_ok(
  $t$update public.collection_items set format = 'bottle', volume_ml = 50 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$,
  '23514', null,
  'RN11: formato em "Quero" é rejeitado'
);
select throws_ok(
  $t$update public.collection_items set status = 'owned', format = null, volume_ml = 10 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$,
  '23514', null,
  'RN11: volume sem formato é rejeitado'
);
select throws_ok(
  $t$update public.collection_items set status = 'owned', format = 'bottle', volume_ml = 0 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$,
  '23514', null,
  'RN11: volume zero é rejeitado'
);
select throws_ok(
  $t$update public.collection_items set status = 'owned', format = 'bottle', volume_ml = 1000.1 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$,
  '23514', null,
  'RN11: volume acima de 1000 ml é rejeitado'
);
select lives_ok(
  $t$update public.collection_items set status = 'owned', format = 'sample', volume_ml = 1.5 where user_id = 'a0000000-0000-4000-8000-00000000000a' and perfume_id = '11111111-0000-4000-8000-000000000001'$t$,
  'RN11: volume com uma casa decimal é aceito'
);
select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');
select is(
  pg_temp.affected($t$update public.collection_items set format = 'bottle', volume_ml = 100 where perfume_id = '11111111-0000-4000-8000-000000000001'$t$),
  0::bigint,
  'RN11: outro usuário não altera o formato da coleção de Alice (RLS)'
);
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is(
  (select format::text || ' ' || volume_ml::text from public.collection_items where perfume_id = '11111111-0000-4000-8000-000000000001'),
  'sample 1.5',
  'RN11: o formato de Alice segue intacto'
);

select * from finish();
rollback;
