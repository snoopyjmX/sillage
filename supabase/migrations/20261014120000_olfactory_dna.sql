-- Fase 16A: DNA olfativo do usuário (perfil sensorial a partir da coleção e do memorial).
-- SECURITY INVOKER: a RLS de dono de collection_items e daily_perfumes vale (RN01); o filtro
-- explícito por auth.uid() deixa a intenção clara e devolve vazio para anon. Sem SQL dinâmico.
--
-- Peso de cada perfume (D1): 1 por estar em "Tenho" + 1 por dia no memorial. "Quero" fica fora do
-- espectro. Cada perfume pesa em cada nota DISTINTA que tem (a mesma nota em duas posições conta
-- uma vez); o peso da família é a soma dos pesos das suas notas. "Quero" só alimenta wish_family
-- (D2): a família mais frequente entre os perfumes desejados (empate: ordem do enum).

create function public.get_olfactory_dna()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select auth.uid() as uid
  ),
  owned as (
    select ci.perfume_id, 1 as w
    from public.collection_items ci, me
    where ci.user_id = me.uid and ci.status = 'owned'
  ),
  worn as (
    select dp.perfume_id, count(*)::int as w
    from public.daily_perfumes dp, me
    where dp.user_id = me.uid
    group by dp.perfume_id
  ),
  weights as (
    select u.perfume_id, sum(u.w)::int as w
    from (select * from owned union all select * from worn) u
    group by u.perfume_id
  ),
  distinct_notes as (
    select distinct pn.perfume_id, pn.note_id from public.perfume_notes pn
  ),
  note_weights as (
    select n.id, n.slug, n.name, n.family, sum(wt.w)::int as w
    from weights wt
    join distinct_notes dn on dn.perfume_id = wt.perfume_id
    join public.notes n on n.id = dn.note_id
    group by n.id, n.slug, n.name, n.family
  ),
  family_weights as (
    select nw.family, sum(nw.w)::int as w from note_weights nw group by nw.family
  ),
  wanted as (
    select ci.perfume_id
    from public.collection_items ci, me
    where ci.user_id = me.uid and ci.status = 'wanted'
  ),
  wish as (
    select n.family, count(*) as c
    from wanted wa
    join distinct_notes dn on dn.perfume_id = wa.perfume_id
    join public.notes n on n.id = dn.note_id
    group by n.family
    order by count(*) desc, n.family asc
    limit 1
  )
  select jsonb_build_object(
    'families', coalesce(
      (select jsonb_agg(jsonb_build_object('family', fw.family, 'weight', fw.w) order by fw.w desc, fw.family asc)
       from family_weights fw),
      '[]'::jsonb),
    'top_notes', coalesce(
      (select jsonb_agg(jsonb_build_object('slug', t.slug, 'name', t.name, 'family', t.family, 'weight', t.w)
                        order by t.w desc, t.name asc)
       from (select * from note_weights order by w desc, name asc limit 3) t),
      '[]'::jsonb),
    'wish_family', (select family from wish),
    'wanted_count', (select count(*) from wanted),
    'perfume_count', (select count(*) from weights),
    'memorial_days', (select coalesce(sum(w), 0)::int from worn)
  );
$$;

revoke all on function public.get_olfactory_dna() from public, anon;
grant execute on function public.get_olfactory_dna() to authenticated;
