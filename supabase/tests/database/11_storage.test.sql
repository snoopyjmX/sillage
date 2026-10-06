-- Storage: perfume-images com leitura pública e escrita só admin
begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

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

select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select throws_ok($t$insert into storage.objects (bucket_id, name) values ('perfume-images', 'comum.png')$t$, '42501', null, 'Storage: usuário comum não insere em perfume-images');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a', '{"role":"admin"}'::jsonb);
select lives_ok($t$insert into storage.objects (bucket_id, name) values ('perfume-images', 'admin.png')$t$, 'Storage: admin insere em perfume-images');
select is(pg_temp.affected($t$update storage.objects set name = 'admin2.png' where name = 'admin.png'$t$), 1::bigint, 'Storage: admin atualiza objeto');
select set_config('storage.allow_delete_query', 'true', true);
select pg_temp.act_anon();
select is((select count(*) from storage.objects where bucket_id = 'perfume-images' and name = 'admin2.png'), 1::bigint, 'Storage: anon lê perfume-images');
select throws_ok($t$insert into storage.objects (bucket_id, name) values ('perfume-images', 'anon.png')$t$, '42501', null, 'Storage: anon não insere');
select is(pg_temp.affected($t$update storage.objects set name = 'hack.png' where bucket_id = 'perfume-images'$t$), 0::bigint, 'Storage: anon não atualiza');
select is(pg_temp.affected($t$delete from storage.objects where bucket_id = 'perfume-images'$t$), 0::bigint, 'Storage: anon não apaga');
select set_config('storage.allow_delete_query', 'true', true);
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is(pg_temp.affected($t$delete from storage.objects where bucket_id = 'perfume-images'$t$), 0::bigint, 'Storage: usuário comum não apaga');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a', '{"role":"admin"}'::jsonb);
select is(pg_temp.affected($t$delete from storage.objects where bucket_id = 'perfume-images' and name = 'admin2.png'$t$), 1::bigint, 'Storage: admin apaga objeto');
select pg_temp.act_postgres();
select is((select public from storage.buckets where id = 'perfume-images'), true, 'Storage: bucket perfume-images é público');
select is((select count(*) from storage.buckets where id = 'avatars'), 0::bigint, 'Storage: não há bucket de avatars no MVP');

select * from finish();
rollback;
