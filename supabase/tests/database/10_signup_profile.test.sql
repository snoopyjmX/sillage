-- Cadastro: handle_new_user cria o perfil com fuso e nome corretos
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
  ('f0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'u1@test.local', '{"name":"Ana","timezone":"Asia/Tokyo"}'),
  ('f0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'u2@test.local', '{"display_name":"Beto","timezone":"Mars/Olympus"}'),
  ('f0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'u3@test.local', '{}'),
  ('f0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'u4@test.local', '{"name":"","display_name":"Duda","timezone":null}');

select is((select timezone from public.profiles where id = 'f0000000-0000-4000-8000-000000000001'), 'Asia/Tokyo'::text, 'Cadastro: fuso válido nos metadados é gravado');
select is((select timezone from public.profiles where id = 'f0000000-0000-4000-8000-000000000002'), 'America/Sao_Paulo'::text, 'Cadastro: fuso inválido cai em America/Sao_Paulo');
select is((select timezone from public.profiles where id = 'f0000000-0000-4000-8000-000000000003'), 'America/Sao_Paulo'::text, 'Cadastro: sem fuso cai em America/Sao_Paulo');
select is((select display_name from public.profiles where id = 'f0000000-0000-4000-8000-000000000001'), 'Ana'::text, 'Cadastro: display_name vem de ''name''');
select is((select display_name from public.profiles where id = 'f0000000-0000-4000-8000-000000000002'), 'Beto'::text, 'Cadastro: display_name vem de ''display_name''');
select is((select display_name from public.profiles where id = 'f0000000-0000-4000-8000-000000000003'), 'Membro'::text, 'Cadastro: fallback ''Membro''');
select is((select display_name from public.profiles where id = 'f0000000-0000-4000-8000-000000000004'), 'Duda'::text, 'Cadastro: ''name'' vazio usa ''display_name''');
select is((select timezone from public.profiles where id = 'f0000000-0000-4000-8000-000000000004'), 'America/Sao_Paulo'::text, 'Cadastro: fuso null cai em America/Sao_Paulo');
select is((select count(*) from public.profiles where id in ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000004')), 4::bigint, 'Cadastro: cada usuário ganhou 1 perfil');
select lives_ok($t$update public.profiles set display_name = 'Ana 2' where id = 'f0000000-0000-4000-8000-000000000001'$t$, 'Cadastro: UPDATE de perfil funciona');
select cmp_ok((select updated_at from public.profiles where id = 'f0000000-0000-4000-8000-000000000001'), '>=', (select created_at from public.profiles where id = 'f0000000-0000-4000-8000-000000000001'), 'set_updated_at mantém updated_at');

select * from finish();
rollback;
