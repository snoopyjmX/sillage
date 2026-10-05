-- Busca do catálogo (docs/PRODUCT.md, Seção 8)
-- SECURITY INVOKER: a RLS do chamador vale. Sem SQL dinâmico: a ordenação é um CASE estático.

create function public.search_perfumes(
  p_query          text                         default null,
  p_brand_slugs    text[]                       default null,
  p_note_slugs     text[]                       default null,
  p_note_position  public.note_position         default null,
  p_families       public.olfactive_family[]    default null,
  p_concentrations public.concentration_type[] default null,
  p_genders        public.perfume_gender[]      default null,
  p_year_min       int                          default null,
  p_year_max       int                          default null,
  p_sort           text                         default 'relevance',
  p_limit          int                          default 24,
  p_offset         int                          default 0
)
returns table (
  id            uuid,
  slug          text,
  name          text,
  brand_name    text,
  brand_slug    text,
  concentration public.concentration_type,
  gender        public.perfume_gender,
  release_year  smallint,
  image_path    text,
  families      public.olfactive_family[],
  total_count   bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_sort    text := coalesce(p_sort, 'relevance');
  v_limit   int  := coalesce(p_limit, 24);
  v_offset  int  := coalesce(p_offset, 0);
  v_q       text;
  v_prefix  text;
  v_notes   text[];
  v_n_notes int;
begin
  if v_sort not in ('name_asc', 'name_desc', 'newest', 'top_rated', 'relevance') then
    raise exception 'invalid sort' using errcode = '22023';
  end if;
  if v_limit < 1 or v_limit > 100 then
    raise exception 'limit must be between 1 and 100' using errcode = '22023';
  end if;
  if v_offset < 0 then
    raise exception 'offset must be >= 0' using errcode = '22023';
  end if;

  -- Mesma normalização do trigger set_search_name; vazio = sem filtro de texto
  v_q := lower(extensions.unaccent('extensions.unaccent', trim(coalesce(p_query, ''))));
  if v_q = '' then
    v_q := null;
  end if;
  if v_q is null and v_sort = 'relevance' then
    v_sort := 'name_asc';
  end if;

  -- Curingas do LIKE (\ % _) vindos do usuário viram texto literal
  v_prefix := replace(replace(replace(coalesce(v_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  v_notes := array(select distinct unnest(p_note_slugs));
  v_n_notes := cardinality(v_notes);

  -- A janela numera e conta tudo antes da página; as famílias só são calculadas
  -- para as linhas que sobram (é a parte mais cara do SELECT).
  return query
  select
    t.id, t.slug, t.name, t.brand_name, t.brand_slug, t.concentration, t.gender,
    t.release_year, t.image_path,
    array(
      select distinct n.family
      from public.perfume_notes pn
      join public.notes n on n.id = pn.note_id
      where pn.perfume_id = t.id
      order by n.family
    ),
    t.total_count
  from (
    select
      p.id,
      p.slug,
      p.name,
      b.name as brand_name,
      b.slug as brand_slug,
      p.concentration,
      p.gender,
      p.release_year,
      p.image_path,
      count(*) over () as total_count,
      row_number() over (
        order by
          case when v_sort = 'name_asc' then p.search_name end asc,
          case when v_sort = 'name_desc' then p.search_name end desc,
          case when v_sort = 'newest' then p.release_year end desc nulls last,
          case when v_sort = 'top_rated'
            then (s.avg_longevity + s.avg_projection) / 2 end desc nulls last,
          case when v_sort = 'top_rated' then s.review_count end desc nulls last,
          case when v_sort = 'relevance'
            then greatest(
              extensions.similarity(p.search_name, v_q),
              extensions.similarity(b.search_name, v_q)
            ) end desc nulls last,
          p.slug asc
      ) as rn
    from public.perfumes p
    join public.brands b on b.id = p.brand_id
    left join public.perfume_review_stats s on s.perfume_id = p.id
    where
      (
        v_q is null
        or case
             -- 3+ caracteres: duas buscas trigram unidas, cada uma com seu índice GIN.
             -- (Um OR entre perfume e marca depois do join obriga a ler a tabela toda.)
             when length(v_q) >= 3 then
               p.id in (
                 select p2.id from public.perfumes p2
                 where p2.search_name operator(extensions.%) v_q
                 union
                 select p3.id from public.perfumes p3
                 join public.brands b3 on b3.id = p3.brand_id
                 where b3.search_name operator(extensions.%) v_q
               )
             else
               p.search_name like v_prefix escape '\'
               or b.search_name like v_prefix escape '\'
           end
      )
      and (coalesce(cardinality(p_brand_slugs), 0) = 0 or b.slug = any (p_brand_slugs))
      and (coalesce(cardinality(p_concentrations), 0) = 0 or p.concentration = any (p_concentrations))
      and (coalesce(cardinality(p_genders), 0) = 0 or p.gender = any (p_genders))
      and (
        p_year_min is null and p_year_max is null
        or (
          p.release_year is not null
          and (p_year_min is null or p.release_year >= p_year_min)
          and (p_year_max is null or p.release_year <= p_year_max)
        )
      )
      and (
        coalesce(v_n_notes, 0) = 0
        or p.id in (
          select pn.perfume_id
          from public.perfume_notes pn
          join public.notes n on n.id = pn.note_id
          where n.slug = any (v_notes)
            and (p_note_position is null or pn.position = p_note_position)
          group by pn.perfume_id
          having count(distinct n.slug) = v_n_notes
        )
      )
      and (
        coalesce(cardinality(p_families), 0) = 0
        or exists (
          select 1
          from public.perfume_notes pn
          join public.notes n on n.id = pn.note_id
          where pn.perfume_id = p.id and n.family = any (p_families)
        )
      )
  ) t
  where t.rn > v_offset and t.rn <= v_offset + v_limit
  order by t.rn;
end;
$$;

revoke all on function public.search_perfumes(
  text, text[], text[], public.note_position, public.olfactive_family[],
  public.concentration_type[], public.perfume_gender[], int, int, text, int, int
) from public, anon, authenticated;
grant execute on function public.search_perfumes(
  text, text[], text[], public.note_position, public.olfactive_family[],
  public.concentration_type[], public.perfume_gender[], int, int, text, int, int
) to anon, authenticated;
