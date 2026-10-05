-- Busca: search_name sem acento mantido por trigger
begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

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
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Café Royale', 'cafe-royale');

select is((select search_name from public.brands where id = '22222222-0000-4000-8000-000000000001'), 'cafe royale'::text, 'Busca: marca ''Café Royale'' vira ''cafe royale''');
select lives_ok($t$insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Café', 'cafe', 'unisex', 'edp')$t$, 'Busca: insere perfume ''Café''');
select is((select search_name from public.perfumes where id = '11111111-0000-4000-8000-000000000001'), 'cafe'::text, 'Busca: ''Café'' resulta em search_name ''cafe''');
select lives_ok($t$update public.perfumes set name = 'Ação Ñandú' where id = '11111111-0000-4000-8000-000000000001'$t$, 'Busca: renomeia o perfume');
select is((select search_name from public.perfumes where id = '11111111-0000-4000-8000-000000000001'), 'acao nandu'::text, 'Busca: UPDATE do name recalcula search_name');
select cmp_ok((select count(*) from public.perfumes where search_name % 'acao nandu'), '>=', 1::bigint, 'Busca: pg_trgm encontra o perfume pelo nome sem acento');

select * from finish();
rollback;
