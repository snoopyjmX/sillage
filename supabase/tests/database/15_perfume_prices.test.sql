-- Comparador de preços: colunas novas em `perfumes`, checks de integridade e RLS preservada
begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

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

insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration, lowest_price_cents, store_name, store_url, image_path) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Com Oferta', 'com-oferta',
   'unisex', 'edp', 24900, 'Loja Teste', 'https://loja.example/produto', 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Sem Oferta', 'sem-oferta',
   'unisex', 'edp', null, null, null, 'teste/foto.webp');

select col_type_is('public', 'perfumes', 'lowest_price_cents', 'integer', 'lowest_price_cents é integer (centavos)');
select col_is_null('public', 'perfumes', 'lowest_price_cents', 'lowest_price_cents aceita nulo');
select col_is_null('public', 'perfumes', 'store_name', 'store_name aceita nulo');
select col_is_null('public', 'perfumes', 'store_url', 'store_url aceita nulo');

select throws_ok(
  $$update public.perfumes set lowest_price_cents = 0 where slug = 'sem-oferta'$$,
  '23514', null, 'preço zero é recusado');
select throws_ok(
  $$update public.perfumes set lowest_price_cents = -1 where slug = 'sem-oferta'$$,
  '23514', null, 'preço negativo é recusado');
select throws_ok(
  $$update public.perfumes set store_url = 'javascript:alert(1)' where slug = 'sem-oferta'$$,
  '23514', null, 'store_url que não é http(s) é recusada');
select throws_ok(
  $$update public.perfumes set store_name = '   ' where slug = 'sem-oferta'$$,
  '23514', null, 'store_name em branco é recusado');

select pg_temp.act_anon();
select is(
  (select lowest_price_cents from public.perfumes where slug = 'com-oferta'), 24900,
  'visitante lê o preço (catálogo público)');
select is(
  pg_temp.affected($$update public.perfumes set lowest_price_cents = 1 where slug = 'com-oferta'$$), 0::bigint,
  'visitante não altera o preço (RLS)');

select pg_temp.act_postgres();
select is(
  (select lowest_price_cents from public.perfumes where slug = 'com-oferta'), 24900,
  'o preço segue intacto depois da tentativa do visitante');

select * from finish();
rollback;
