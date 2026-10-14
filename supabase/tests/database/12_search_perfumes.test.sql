-- Busca do catálogo: public.search_perfumes (docs/PRODUCT.md, Seção 8)
begin;

create extension if not exists pgtap with schema extensions;

select plan(52);

create function pg_temp.act_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

create function pg_temp.act_authenticated() returns void language plpgsql as $$
begin
  reset role;
  perform set_config(
    'request.jwt.claims',
    '{"sub":"a0000000-0000-4000-8000-00000000000a","role":"authenticated"}',
    true
  );
  set local role authenticated;
end $$;

create function pg_temp.act_postgres() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Marcas das fixtures (o seed fica de fora de todas as consultas)
create function pg_temp.fx() returns text[] language sql as $$
  select array['st-zeta', 'st-cafe-royale', 'st-omega'];
$$;

-- Atalho: devolve só os slugs, na ordem retornada pela função
create function pg_temp.s(
  p_query text default null,
  p_notes text[] default null,
  p_pos public.note_position default null,
  p_fams public.olfactive_family[] default null,
  p_conc public.concentration_type[] default null,
  p_gen public.perfume_gender[] default null,
  p_ymin int default null,
  p_ymax int default null,
  p_sort text default 'name_asc',
  p_brands text[] default pg_temp.fx(),
  p_limit int default 24,
  p_offset int default 0
) returns text[] language sql as $$
  select coalesce(array_agg(r.slug), '{}')
  from public.search_perfumes(
    p_query, p_brands, p_notes, p_pos, p_fams, p_conc, p_gen,
    p_ymin, p_ymax, p_sort, p_limit, p_offset
  ) r;
$$;

-- Fixtures (desfeitas pelo rollback no fim)
insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@test.local', '{"name":"Alice"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'b@test.local', '{"name":"Bruno"}');

insert into public.brands (id, name, slug) values
  ('22222222-0000-4000-8000-000000000001', 'Zeta Maison', 'st-zeta'),
  ('22222222-0000-4000-8000-000000000002', 'Café Royale', 'st-cafe-royale'),
  ('22222222-0000-4000-8000-000000000003', 'Omega', 'st-omega'),
  ('22222222-0000-4000-8000-000000000004', 'Gemeos', 'st-twins'),
  ('22222222-0000-4000-8000-000000000005', 'Nomes Longos', 'st-longos');

insert into public.notes (id, name, slug, family) values
  ('33333333-0000-4000-8000-000000000001', 'Bergamota Teste', 'st-bergamota', 'citrus'),
  ('33333333-0000-4000-8000-000000000002', 'Almíscar Teste', 'st-almiscar', 'musky'),
  ('33333333-0000-4000-8000-000000000003', 'Cedro Teste', 'st-cedro', 'woody');

-- p1 Café Noir:   zeta,  edp,    unisex,    2015
-- p2 Zephyr:      zeta,  edt,    masculine, 2020
-- p3 Zorro Amad.: omega, parfum, feminine,  sem ano
-- p4 Alpha:       café,  edc,    unisex,    2010
-- p5 Zorro:       omega, edp,    unisex,    2012
insert into public.perfumes (id, brand_id, name, slug, gender, concentration, release_year, image_path) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Café Noir', 'st-cafe-noir', 'unisex', 'edp', 2015, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Zephyr', 'st-zephyr', 'masculine', 'edt', 2020, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000003', 'Zorro Amadeirado', 'st-zorro', 'feminine', 'parfum', null, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000002', 'Alpha', 'st-alpha', 'unisex', 'edc', 2010, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000003', 'Zorro', 'st-zorro-puro', 'unisex', 'edp', 2012, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000011', '22222222-0000-4000-8000-000000000004', 'Gemeo Duplicado', 'st-gemeo-b', 'unisex', 'edp', null, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000012', '22222222-0000-4000-8000-000000000004', 'Gemeo Duplicado', 'st-gemeo-a', 'unisex', 'edp', null, 'teste/foto.webp'),
  -- nomes longos: o trigram sozinho não acha um trecho curto; o LIKE de trecho acha
  ('11111111-0000-4000-8000-000000000021', '22222222-0000-4000-8000-000000000005', 'Vetiver Extraordinaire Absolu Intense', 'st-vetiver-longo', 'unisex', 'edp', null, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000022', '22222222-0000-4000-8000-000000000005', 'Alfa_Beta Intensamente Longo Nome Teste', 'st-under', 'unisex', 'edp', null, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000023', '22222222-0000-4000-8000-000000000005', 'Alfa%Beta Intensamente Longo Nome Teste', 'st-pct', 'unisex', 'edp', null, 'teste/foto.webp'),
  ('11111111-0000-4000-8000-000000000024', '22222222-0000-4000-8000-000000000005', 'Alfaxbeta Intensamente Longo Nome Teste', 'st-nowild', 'unisex', 'edp', null, 'teste/foto.webp');

insert into public.perfume_notes (perfume_id, note_id, position) values
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', 'base'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000001', 'top'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000003', 'heart'),
  ('11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'base'),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000001', 'base'),
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000003', 'base'),
  -- a mesma nota em duas posições não pode duplicar o perfume nem a família
  ('11111111-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000003', 'heart');

-- Avaliações: p4 = 5,0 (1); p1 = 3,5 (2); p3 = 3,5 (1); p2 e p5 sem avaliações
insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating, comment) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000004', 5, 5, 'segredo-de-a'),
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 5, 'segredo-de-a'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', 2, 3, 'segredo-de-b'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000003', 3, 4, 'segredo-de-b');

select pg_temp.act_anon();

-- Texto
select is(pg_temp.s('cafe'), array['st-alpha', 'st-cafe-noir'], 'texto: "cafe" acha "Café Noir" (perfume) e "Café Royale" (marca)');
select is(pg_temp.s('CAFÉ'), array['st-alpha', 'st-cafe-noir'], 'texto: maiúscula e acento na consulta são normalizados');
select is(pg_temp.s('  royale  '), array['st-alpha'], 'texto: espaços nas pontas são ignorados e a marca é pesquisada');
select is(pg_temp.s('zephir'), array['st-zephyr'], 'texto: erro de digitação pequeno ("zephir") acha por trigram');
select is(pg_temp.s('zz'), '{}'::text[], 'texto: prefixo de 2 letras sem correspondência não acha nada');
select is(pg_temp.s('al'), array['st-alpha'], 'texto: 1-2 caracteres usam prefixo');
select is(pg_temp.s('%'), '{}'::text[], 'texto: "%" é literal, não curinga');
select is(pg_temp.s('_'), '{}'::text[], 'texto: "_" é literal, não curinga');
select is(pg_temp.s('z_'), '{}'::text[], 'texto: "z_" não casa "ze..." nem "zo..."');
select is(pg_temp.s('a\'), '{}'::text[], 'texto: barra invertida não quebra o LIKE');
select is(pg_temp.s('vetiver', p_brands => array['st-longos']), array['st-vetiver-longo'], 'trecho: "vetiver" acha "Vetiver Extraordinaire Absolu Intense" (nome longo)');
select is(pg_temp.s('traordin', p_brands => array['st-longos']), array['st-vetiver-longo'], 'trecho: pedaço no meio de uma palavra também acha');
select is(pg_temp.s('alfa_beta', p_brands => array['st-longos']), array['st-under'], 'trecho: "_" é literal (não casa "Alfaxbeta")');
select is(pg_temp.s('alfa%beta', p_brands => array['st-longos']), array['st-pct'], 'trecho: "%" é literal (não casa "Alfaxbeta")');
select is(pg_temp.s('%%%', p_brands => array['st-longos']), '{}'::text[], 'trecho: "%%%" não vira curinga que casa tudo');
select is(pg_temp.s('   '), array['st-alpha', 'st-cafe-noir', 'st-zephyr', 'st-zorro-puro', 'st-zorro'], 'texto: consulta vazia = sem filtro');

-- Notas, posição e família
select is(pg_temp.s(p_notes => array['st-bergamota', 'st-almiscar']), array['st-cafe-noir', 'st-zephyr'], 'notas: várias notas = AND');
select is(pg_temp.s(p_notes => array['st-bergamota', 'st-almiscar', 'st-cedro']), array['st-zephyr'], 'notas: três notas exigem todas');
select is(pg_temp.s(p_notes => array['st-bergamota', 'st-bergamota']), array['st-cafe-noir', 'st-zephyr', 'st-zorro'], 'notas: slug repetido conta uma vez');
select is(pg_temp.s(p_notes => array['st-bergamota'], p_pos => 'top'), array['st-cafe-noir', 'st-zephyr'], 'posição: bergamota no topo');
select is(pg_temp.s(p_notes => array['st-bergamota'], p_pos => 'base'), array['st-zorro'], 'posição: bergamota na base');
select is(pg_temp.s(p_notes => array['st-bergamota', 'st-almiscar'], p_pos => 'top'), '{}'::text[], 'posição: vale para todas as notas (almíscar não está no topo)');
select is(pg_temp.s(p_fams => array['woody']::public.olfactive_family[]), array['st-zephyr', 'st-zorro'], 'família: perfume com ao menos uma nota da família');
select is(pg_temp.s(p_fams => array['woody', 'musky']::public.olfactive_family[]), array['st-cafe-noir', 'st-zephyr', 'st-zorro'], 'família: OR entre famílias, sem repetir perfume');
select is(
  (select families from public.search_perfumes(p_brand_slugs => array['st-omega'], p_query => 'amadeirado')),
  array['citrus', 'woody']::public.olfactive_family[],
  'families: derivada das notas, sem repetição (cedro em duas posições aparece uma vez)'
);
select is(
  (select families from public.search_perfumes(p_brand_slugs => array['st-zeta'], p_query => 'zephyr')),
  array['citrus', 'woody', 'musky']::public.olfactive_family[],
  'families: ordem do enum'
);

-- OR dentro do grupo e AND entre grupos
select is(pg_temp.s(p_brands => array['st-zeta', 'st-omega']), array['st-cafe-noir', 'st-zephyr', 'st-zorro-puro', 'st-zorro'], 'marcas: OR');
select is(pg_temp.s(p_conc => array['edt', 'parfum']::public.concentration_type[]), array['st-zephyr', 'st-zorro'], 'concentrações: OR');
select is(pg_temp.s(p_gen => array['feminine', 'masculine']::public.perfume_gender[]), array['st-zephyr', 'st-zorro'], 'gêneros: OR');
select is(pg_temp.s(p_gen => array['unisex']::public.perfume_gender[], p_conc => array['edp']::public.concentration_type[]), array['st-cafe-noir', 'st-zorro-puro'], 'grupos diferentes: AND');

-- Ano
select is(pg_temp.s(p_ymin => 2016), array['st-zephyr'], 'ano: mínimo exclui perfume sem ano');
select is(pg_temp.s(p_ymax => 2015), array['st-alpha', 'st-cafe-noir', 'st-zorro-puro'], 'ano: máximo inclusivo, sem ano excluído');
select is(pg_temp.s(p_ymin => 2010, p_ymax => 2020), array['st-alpha', 'st-cafe-noir', 'st-zephyr', 'st-zorro-puro'], 'ano: faixa inclusiva nos dois lados');

-- Ordenação
select is(pg_temp.s(p_sort => 'name_asc'), array['st-alpha', 'st-cafe-noir', 'st-zephyr', 'st-zorro-puro', 'st-zorro'], 'sort: name_asc');
select is(pg_temp.s(p_sort => 'name_desc'), array['st-zorro', 'st-zorro-puro', 'st-zephyr', 'st-cafe-noir', 'st-alpha'], 'sort: name_desc');
select is(pg_temp.s(p_sort => 'newest'), array['st-zephyr', 'st-cafe-noir', 'st-zorro-puro', 'st-alpha', 'st-zorro'], 'sort: newest, sem ano por último');
select is(pg_temp.s(p_sort => 'top_rated'), array['st-alpha', 'st-cafe-noir', 'st-zorro', 'st-zephyr', 'st-zorro-puro'], 'sort: top_rated (média, depois contagem, sem avaliação por último, depois slug)');
select is(pg_temp.s('zorro', p_sort => 'relevance'), array['st-zorro-puro', 'st-zorro'], 'sort: relevance põe a correspondência mais próxima primeiro');
select is(pg_temp.s(p_sort => 'relevance'), array['st-alpha', 'st-cafe-noir', 'st-zephyr', 'st-zorro-puro', 'st-zorro'], 'sort: relevance sem texto cai para name_asc');
select throws_ok($q$select * from public.search_perfumes(p_sort => 'price')$q$, '22023', null, 'sort inválido levanta 22023');
select throws_ok($q$select * from public.search_perfumes(p_sort => 'name_asc; drop table public.perfumes')$q$, '22023', null, 'sort com tentativa de injeção levanta 22023');

-- Limites e paginação
select throws_ok($q$select * from public.search_perfumes(p_limit => 1000)$q$, '22023', null, 'limit 1000 levanta 22023');
select throws_ok($q$select * from public.search_perfumes(p_limit => 0)$q$, '22023', null, 'limit 0 levanta 22023');
select throws_ok($q$select * from public.search_perfumes(p_offset => -1)$q$, '22023', null, 'offset negativo levanta 22023');
select is(
  (select array_agg(r.slug) || array[min(r.total_count)::text] from public.search_perfumes(p_brand_slugs => pg_temp.fx(), p_sort => 'name_asc', p_limit => 2, p_offset => 2) r),
  array['st-zephyr', 'st-zorro-puro', '5'],
  'total_count conta tudo antes do limite, com offset'
);
select is(
  (select count(*) from public.search_perfumes(p_brand_slugs => pg_temp.fx(), p_limit => 2, p_offset => 10)),
  0::bigint,
  'offset além do fim devolve zero linhas (limitação documentada)'
);
select is(
  pg_temp.s(p_brands => array['st-twins'], p_sort => 'newest', p_limit => 1, p_offset => 0)
    || pg_temp.s(p_brands => array['st-twins'], p_sort => 'newest', p_limit => 1, p_offset => 1),
  array['st-gemeo-a', 'st-gemeo-b'],
  'desempate por slug: páginas consecutivas não repetem nem pulam empatados'
);

-- Papéis e privacidade
select ok(has_function_privilege('anon', 'public.search_perfumes(text,text[],text[],public.note_position,public.olfactive_family[],public.concentration_type[],public.perfume_gender[],int,int,text,int,int)', 'execute'), 'anon executa a função');
select pg_temp.act_authenticated();
select is(pg_temp.s(p_sort => 'top_rated'), array['st-alpha', 'st-cafe-noir', 'st-zorro', 'st-zephyr', 'st-zorro-puro'], 'authenticated executa e vê o mesmo resultado público');
select pg_temp.act_postgres();
select is(
  (select (proargnames)[13:] from pg_proc where oid = 'public.search_perfumes(text,text[],text[],public.note_position,public.olfactive_family[],public.concentration_type[],public.perfume_gender[],int,int,text,int,int)'::regprocedure),
  array['id', 'slug', 'name', 'brand_name', 'brand_slug', 'concentration', 'gender', 'release_year', 'image_path', 'families', 'total_count'],
  'colunas de retorno: nada de reviews além do agregado (sem user_id nem comment)'
);
select is(
  (select array[prosecdef::text, provolatile::text, array_to_string(proconfig, ',')] from pg_proc where oid = 'public.search_perfumes(text,text[],text[],public.note_position,public.olfactive_family[],public.concentration_type[],public.perfume_gender[],int,int,text,int,int)'::regprocedure),
  array['false', 's', 'search_path=""'],
  'função é SECURITY INVOKER, STABLE e search_path vazio'
);
select ok(not has_function_privilege('public', 'public.search_perfumes(text,text[],text[],public.note_position,public.olfactive_family[],public.concentration_type[],public.perfume_gender[],int,int,text,int,int)', 'execute'), 'PUBLIC não executa (só anon e authenticated, por grant explícito)');

select * from finish();
rollback;
