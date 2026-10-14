-- SOMENTE DESENVOLVIMENTO (banco local): ~5.000 perfumes de mentira para medir desempenho.
-- Nunca entra em seed.sql, migrations ou testes do CI. Todo slug começa com 'fake-'.
-- Rodar: npm run db:fake    Limpar: npm run db:fake:clear

-- Idempotente: limpa o que já existir antes de gerar de novo
-- Embrulhado em DO porque 'supabase db query' aceita um comando só.
do $fake$
begin
delete from public.perfume_reviews
where user_id in (select id from auth.users where email like 'fake-%@fake.local');
delete from auth.users where email like 'fake-%@fake.local';
delete from public.perfume_notes
where perfume_id in (select id from public.perfumes where slug like 'fake-%');
delete from public.perfumes where slug like 'fake-%';
delete from public.brands where slug like 'fake-%';
delete from public.notes where slug like 'fake-%';

-- 300 marcas
insert into public.brands (slug, name)
select 'fake-brand-' || g,
       (array['Maison','Atelier','Parfums','Essence','Casa','Studio'])[1 + g % 6]
         || ' ' || (array['Aurora','Bosque','Cedro','Dunas','Éden','Fênix','Garoa','Horizonte'])[1 + g % 8]
         || ' ' || g
from generate_series(1, 300) g;

-- 80 notas, famílias em rodízio
insert into public.notes (slug, name, family)
select 'fake-note-' || g,
       'Nota Falsa ' || g,
       (enum_range(null::public.olfactive_family))[1 + g % 10]
from generate_series(1, 80) g;

-- 5.000 perfumes
insert into public.perfumes (slug, name, brand_id, gender, concentration, release_year, image_path)
select 'fake-perfume-' || g,
       (array['Café','Âmbar','Noite','Bosque','Rosa','Vetiver','Oud','Cítrico','Brisa','Maré','Jardim','Veludo'])[1 + g % 12]
         || ' ' || (array['Noir','Intenso','Absolu','Extraordinaire','Fresco','Profundo','Dourado'])[1 + (g / 12) % 7]
         || ' ' || g,
       (select id from public.brands where slug = 'fake-brand-' || (1 + g % 300)),
       (enum_range(null::public.perfume_gender))[1 + g % 3],
       (enum_range(null::public.concentration_type))[1 + g % 6],
       case when g % 10 = 0 then null else 1990 + g % 37 end,
       'teste/foto.webp'
from generate_series(1, 5000) g;

-- ~6 notas por perfume (2 por posição), ~30.000 ligações
insert into public.perfume_notes (perfume_id, note_id, position)
select distinct p.id, n.id, pos.position
from generate_series(1, 5000) g
cross join generate_series(0, 1) k
cross join (values (0, 'top'::public.note_position), (1, 'heart'), (2, 'base')) as pos(off, position)
join public.perfumes p on p.slug = 'fake-perfume-' || g
join public.notes n on n.slug = 'fake-note-' || (1 + (g * 7 + k * 13 + pos.off * 29) % 80);

-- 200 usuários e ~6.000 avaliações (para o top_rated)
insert into auth.users (id, aud, role, email, raw_user_meta_data)
select gen_random_uuid(), 'authenticated', 'authenticated',
       'fake-' || g || '@fake.local', jsonb_build_object('name', 'Fake ' || g)
from generate_series(1, 200) g;

insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating)
select u.id, p.id, 1 + (u.n + g) % 5, 1 + (u.n * 3 + g) % 5
from (select id, row_number() over (order by email) as n from auth.users where email like 'fake-%@fake.local') u
cross join generate_series(0, 29) g
join public.perfumes p on p.slug = 'fake-perfume-' || (1 + ((u.n * 37 + g * 101) % 5000))
on conflict do nothing;

analyze public.perfumes;
analyze public.brands;
analyze public.notes;
analyze public.perfume_notes;
analyze public.perfume_reviews;
end
$fake$;
