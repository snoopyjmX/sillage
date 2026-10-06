-- Fase 10 (RN09): perfumes parecidos pelo número de notas em comum.
-- SECURITY INVOKER: a RLS do chamador vale (catálogo é público). Sem SQL dinâmico.
-- Notas em comum = notas distintas (a mesma nota em posições diferentes conta uma vez).
-- Empate no número de notas: ordem alfabética do nome, para o resultado ser estável.

create function public.get_similar_perfumes(target_id uuid, limit_count int default 6)
returns table (
  id            uuid,
  name          text,
  brand_id      uuid,
  slug          text,
  image_path    text,
  brand_name    text,
  brand_slug    text,
  concentration public.concentration_type,
  gender        public.perfume_gender,
  release_year  smallint,
  families      public.olfactive_family[],
  common_notes  bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_limit int := coalesce(limit_count, 6);
begin
  if v_limit < 1 or v_limit > 24 then
    raise exception 'limit must be between 1 and 24' using errcode = '22023';
  end if;

  return query
  with target_notes as (
    select distinct pn.note_id from public.perfume_notes pn where pn.perfume_id = target_id
  ),
  shared as (
    select pn.perfume_id, count(distinct pn.note_id) as common_notes
    from public.perfume_notes pn
    join target_notes tn on tn.note_id = pn.note_id
    where pn.perfume_id <> target_id
    group by pn.perfume_id
  )
  select p.id, p.name, p.brand_id, p.slug, p.image_path,
         b.name, b.slug, p.concentration, p.gender, p.release_year,
         coalesce(
           (select array_agg(f order by f)
            from (select distinct n.family as f
                  from public.perfume_notes pn
                  join public.notes n on n.id = pn.note_id
                  where pn.perfume_id = p.id) fam),
           '{}'::public.olfactive_family[]
         ),
         s.common_notes
  from shared s
  join public.perfumes p on p.id = s.perfume_id
  join public.brands b on b.id = p.brand_id
  order by s.common_notes desc, p.name asc, p.id asc
  limit v_limit;
end $$;

revoke all on function public.get_similar_perfumes(uuid, int) from public;
grant execute on function public.get_similar_perfumes(uuid, int) to anon, authenticated;
