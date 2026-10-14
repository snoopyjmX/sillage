-- Fase 9: avaliações públicas pela view perfume_reviews_public (tabela segue privada)
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

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
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp', 'teste/foto.webp');
insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating, comment) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 5, 'comentário de A'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', 2, 3, 'comentário de B');

select columns_are('public','perfume_reviews_public',array['id','perfume_id','longevity_rating','projection_rating','comment','created_at','updated_at','author_name'],'Fase 9: a view não expõe user_id');
select pg_temp.act_anon();
select is((select count(*) from public.perfume_reviews_public where perfume_id = '11111111-0000-4000-8000-000000000001'), 2::bigint, 'Fase 9: anon lê as avaliações públicas');
select is((select comment from public.perfume_reviews_public where author_name = 'Bruno'), 'comentário de B', 'Fase 9: anon lê o comentário e o nome de exibição do autor');
select is((select count(*) from public.perfume_reviews), 0::bigint, 'Fase 9: a tabela continua fechada para anon');
select throws_ok($t$insert into public.perfume_reviews_public (perfume_id, longevity_rating, projection_rating) values ('11111111-0000-4000-8000-000000000001', 5, 5)$t$, '55000', null, 'Fase 9: a view não aceita escrita (anon)');
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
select is((select count(*) from public.perfume_reviews_public), 2::bigint, 'Fase 9: logado lê as avaliações de todos pela view');
select is((select count(*) from public.perfume_reviews), 1::bigint, 'Fase 9: na tabela, só a própria');
select throws_ok($t$update public.perfume_reviews_public set comment = 'hack' where author_name = 'Bruno'$t$, '55000', null, 'Fase 9: a view não aceita escrita (logado)');
select is(pg_temp.affected($t$update public.perfume_reviews set comment = 'hack' where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'Fase 9: A não edita avaliação de B');
select is(pg_temp.affected($t$delete from public.perfume_reviews where user_id = 'b0000000-0000-4000-8000-00000000000b'$t$), 0::bigint, 'Fase 9: A não apaga avaliação de B');
select is(pg_temp.affected($t$delete from public.perfume_reviews where user_id = 'a0000000-0000-4000-8000-00000000000a'$t$), 1::bigint, 'Fase 9: A apaga a própria');
select pg_temp.act_postgres();
select is((select comment from public.perfume_reviews where user_id = 'b0000000-0000-4000-8000-00000000000b'), 'comentário de B', 'Fase 9: a avaliação de B segue intacta');
select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');
select is((select count(*) from public.perfume_reviews_public), 1::bigint, 'Fase 9: a avaliação apagada some da view');

select * from finish();
rollback;
