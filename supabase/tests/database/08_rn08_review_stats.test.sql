-- RN08: agregados públicos e anônimos de avaliações
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
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Perfume 2', 'perfume-2', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Perfume 3', 'perfume-3', 'unisex', 'edp'),
  ('11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Perfume 4', 'perfume-4', 'unisex', 'edp');
insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating, comment) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 5, 'comentario privado de A'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', 2, 3, 'comentario privado de B');

select pg_temp.act_anon();
select is((select review_count from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 2::bigint, 'RN08: anon lê a contagem agregada');
select is((select avg_longevity from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 3.0::numeric, 'RN08: anon lê a média de fixação');
select is((select avg_projection from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 4.0::numeric, 'RN08: anon lê a média de projeção');
select columns_are('public','perfume_review_stats',array['perfume_id','review_count','avg_longevity','avg_projection'],'RN08: a view só expõe agregados (sem user_id nem comment)');
select is((select count(*) from public.perfume_reviews), 0::bigint, 'RN08: anon lendo perfume_reviews direto recebe 0 linhas');
select is(pg_temp.affected($t$delete from public.perfume_reviews$t$), 0::bigint, 'RN08: anon não apaga avaliações');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is((select review_count from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 2::bigint, 'RN08: usuário logado também lê o agregado (inclui avaliações de outros)');
select is((select count(*) from public.perfume_reviews), 1::bigint, 'RN08: usuário logado vê só a própria avaliação na tabela');
select is(pg_temp.affected($t$delete from public.perfume_reviews where user_id = 'a0000000-0000-4000-8000-00000000000a'$t$), 0::bigint, 'RN08: DELETE em perfume_reviews afeta 0 linhas (mesmo na própria)');
select is(pg_temp.affected($t$delete from public.perfume_reviews$t$), 0::bigint, 'RN08: DELETE em massa afeta 0 linhas');
select pg_temp.act_postgres();
select is((select count(*) from public.perfume_reviews), 2::bigint, 'RN08: nenhuma avaliação foi apagada');

select * from finish();
rollback;
