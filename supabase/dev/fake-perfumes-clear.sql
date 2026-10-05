-- SOMENTE DESENVOLVIMENTO: apaga os dados de volume criados por fake-perfumes.sql.
-- Só toca em linhas cujo slug começa com 'fake-' (e nos usuários fake-*@fake.local).
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
analyze public.perfumes;
analyze public.brands;
end
$fake$;
