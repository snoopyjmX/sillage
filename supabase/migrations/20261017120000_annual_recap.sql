-- Fase 23: "Seu ano em perfumes". Resumo do Memorial de um ano civil, calculado sobre os
-- daily_perfumes do próprio usuário. SECURITY INVOKER: a RLS de dono vale (RN01); o filtro explícito
-- por auth.uid() deixa a intenção clara. Sem SQL dinâmico.
--
-- Ano: de 2026 (primeiro ano do produto) até o ano de hoje no fuso do perfil; fora disso, 22023.
-- Dias decorridos: o ano inteiro para anos passados; de 1º de janeiro até hoje para o ano corrente
-- (consistência = dias vestidos / dias decorridos).
-- Estações (hemisfério Sul, meteorológicas, pelo mês do dia): verão dez-fev, outono mar-mai,
-- inverno jun-ago, primavera set-nov. O verão do ano N junta jan-fev e dez do mesmo ano civil.
-- Peso de nota e de família (mesma regra do DNA): cada dia vestido soma 1 a cada nota DISTINTA do
-- perfume; o peso da família é a soma dos pesos das suas notas.
-- Semestres: 1º = jan-jun, 2º = jul-dez. Empates: nome, depois id (ou slug), para ser estável.

create function public.get_annual_recap(p_year int)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tz text;
  v_today date;
  v_first date;
  v_last date;
  v_elapsed int;
  v_days int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select p.timezone into v_tz from public.profiles p where p.id = v_uid;
  v_today := (now() at time zone coalesce(v_tz, 'America/Sao_Paulo'))::date;

  if p_year is null or p_year < 2026 or p_year > extract(year from v_today)::int then
    raise exception 'year must be between 2026 and the current year' using errcode = '22023';
  end if;

  v_first := make_date(p_year, 1, 1);
  v_last := make_date(p_year, 12, 31);
  v_elapsed := (least(v_last, v_today) - v_first) + 1;

  select count(*)::int into v_days
  from public.daily_perfumes dp
  where dp.user_id = v_uid and dp.date between v_first and v_last;

  return (
    with worn as (
      select dp.perfume_id, dp.date,
             case when extract(month from dp.date) in (12, 1, 2) then 'summer'
                  when extract(month from dp.date) in (3, 4, 5) then 'autumn'
                  when extract(month from dp.date) in (6, 7, 8) then 'winter'
                  else 'spring' end as season,
             case when extract(month from dp.date) <= 6 then 1 else 2 end as semester
      from public.daily_perfumes dp
      where dp.user_id = v_uid and dp.date between v_first and v_last
    ),
    per_perfume as (
      select w.perfume_id, count(*)::int as days
      from worn w group by w.perfume_id
    ),
    signature as (
      select pp.perfume_id, pp.days
      from per_perfume pp
      join public.perfumes p on p.id = pp.perfume_id
      order by pp.days desc, p.name asc, p.id asc
      limit 1
    ),
    per_season as (
      select w.season, w.perfume_id, count(*)::int as days
      from worn w group by w.season, w.perfume_id
    ),
    season_top as (
      select distinct on (ps.season) ps.season, ps.perfume_id, ps.days
      from per_season ps
      join public.perfumes p on p.id = ps.perfume_id
      order by ps.season, ps.days desc, p.name asc, p.id asc
    ),
    distinct_notes as (
      select distinct pn.perfume_id, pn.note_id from public.perfume_notes pn
    ),
    note_weights as (
      select n.id, n.slug, n.name, n.family, sum(pp.days)::int as w
      from per_perfume pp
      join distinct_notes dn on dn.perfume_id = pp.perfume_id
      join public.notes n on n.id = dn.note_id
      group by n.id, n.slug, n.name, n.family
    ),
    family_by_semester as (
      select w.semester, n.family, count(*)::int as w
      from worn w
      join distinct_notes dn on dn.perfume_id = w.perfume_id
      join public.notes n on n.id = dn.note_id
      group by w.semester, n.family
    )
    select jsonb_build_object(
      'year', p_year,
      'days_worn', v_days,
      'days_elapsed', v_elapsed,
      'consistency', round(v_days::numeric / v_elapsed, 4),
      'signature', (
        select jsonb_build_object('slug', p.slug, 'name', p.name, 'brand_name', b.name,
                                  'image_path', p.image_path, 'days', s.days)
        from signature s
        join public.perfumes p on p.id = s.perfume_id
        join public.brands b on b.id = p.brand_id
      ),
      'seasons', jsonb_build_object(
        'summer', (select jsonb_build_object('slug', p.slug, 'name', p.name, 'brand_name', b.name,
                                             'image_path', p.image_path, 'days', st.days)
                   from season_top st join public.perfumes p on p.id = st.perfume_id
                   join public.brands b on b.id = p.brand_id where st.season = 'summer'),
        'autumn', (select jsonb_build_object('slug', p.slug, 'name', p.name, 'brand_name', b.name,
                                             'image_path', p.image_path, 'days', st.days)
                   from season_top st join public.perfumes p on p.id = st.perfume_id
                   join public.brands b on b.id = p.brand_id where st.season = 'autumn'),
        'winter', (select jsonb_build_object('slug', p.slug, 'name', p.name, 'brand_name', b.name,
                                             'image_path', p.image_path, 'days', st.days)
                   from season_top st join public.perfumes p on p.id = st.perfume_id
                   join public.brands b on b.id = p.brand_id where st.season = 'winter'),
        'spring', (select jsonb_build_object('slug', p.slug, 'name', p.name, 'brand_name', b.name,
                                             'image_path', p.image_path, 'days', st.days)
                   from season_top st join public.perfumes p on p.id = st.perfume_id
                   join public.brands b on b.id = p.brand_id where st.season = 'spring')
      ),
      'top_note', (
        select jsonb_build_object('slug', t.slug, 'name', t.name, 'family', t.family, 'weight', t.w)
        from (select * from note_weights order by w desc, name asc, id asc limit 1) t
      ),
      'families', jsonb_build_object(
        'first_semester', coalesce(
          (select jsonb_agg(jsonb_build_object('family', f.family, 'weight', f.w)
                            order by f.w desc, f.family asc)
           from family_by_semester f where f.semester = 1), '[]'::jsonb),
        'second_semester', coalesce(
          (select jsonb_agg(jsonb_build_object('family', f.family, 'weight', f.w)
                            order by f.w desc, f.family asc)
           from family_by_semester f where f.semester = 2), '[]'::jsonb)
      )
    )
  );
end;
$$;

revoke all on function public.get_annual_recap(int) from public, anon;
grant execute on function public.get_annual_recap(int) to authenticated;
