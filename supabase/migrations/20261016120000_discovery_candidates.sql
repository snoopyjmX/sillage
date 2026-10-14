-- Fase 22: pré-seleção determinística de candidatos para a trilha de descoberta do Nez.
-- O banco escolhe quem pode ser recomendado; o Gemini só decide entre eles (e a Edge Function
-- confere a escolha). SECURITY INVOKER: a RLS do chamador vale (catálogo é público). Sem SQL dinâmico.
--
-- Pontuação (por perfume, sobre as famílias DISTINTAS das suas notas):
--   2 pontos por família que o usuário prefere (escolhidas na trilha e, se pediu, as do DNA)
--   1 ponto por família que combina com o clima
-- Perfume com 0 ponto não é candidato. Empate: nome e depois id, para o resultado ser estável.

create function public.get_discovery_candidates(
  p_climate_families public.olfactive_family[],
  p_preferred_families public.olfactive_family[],
  p_limit int default 12
)
returns table (
  id            uuid,
  slug          text,
  name          text,
  brand_name    text,
  concentration public.concentration_type,
  gender        public.perfume_gender,
  families      public.olfactive_family[],
  notes         jsonb,
  score         int
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_limit int := coalesce(p_limit, 12);
  v_climate public.olfactive_family[] := coalesce(p_climate_families, '{}'::public.olfactive_family[]);
  v_preferred public.olfactive_family[] := coalesce(p_preferred_families, '{}'::public.olfactive_family[]);
begin
  if v_limit < 1 or v_limit > 24 then
    raise exception 'limit must be between 1 and 24' using errcode = '22023';
  end if;

  return query
  with perfume_families as (
    select pn.perfume_id, n.family
    from public.perfume_notes pn
    join public.notes n on n.id = pn.note_id
    group by pn.perfume_id, n.family
  ),
  scored as (
    select pf.perfume_id,
           (2 * count(*) filter (where pf.family = any (v_preferred))
            + count(*) filter (where pf.family = any (v_climate)))::int as score,
           array_agg(pf.family order by pf.family) as families
    from perfume_families pf
    group by pf.perfume_id
  )
  select p.id, p.slug, p.name, b.name, p.concentration, p.gender, s.families,
         coalesce(
           (select jsonb_agg(jsonb_build_object('name', n.name, 'position', pn.position)
                             order by pn.position, n.name)
            from public.perfume_notes pn
            join public.notes n on n.id = pn.note_id
            where pn.perfume_id = p.id),
           '[]'::jsonb
         ),
         s.score
  from scored s
  join public.perfumes p on p.id = s.perfume_id
  join public.brands b on b.id = p.brand_id
  where s.score > 0
  order by s.score desc, p.name asc, p.id asc
  limit v_limit;
end;
$$;

-- Só quem está logado usa a trilha (a Edge Function chama com o JWT do usuário)
revoke all on function public.get_discovery_candidates(
  public.olfactive_family[], public.olfactive_family[], int
) from public, anon;
grant execute on function public.get_discovery_candidates(
  public.olfactive_family[], public.olfactive_family[], int
) to authenticated;
