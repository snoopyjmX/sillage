-- Exclusão de conta: apagar auth.users (o que a Edge Function delete-account faz) leva junto
-- perfil, coleção, memorial e avaliações (on delete cascade), recalcula os agregados (RN08) e não
-- toca nos dados dos outros usuários. Nenhuma policy muda.
begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@test.local', '{"name":"Alice"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'b@test.local', '{"name":"Bruno"}');
insert into public.brands (id, name, slug) values ('22222222-0000-4000-8000-000000000001', 'Marca Teste', 'marca-teste');
insert into public.perfumes (id, brand_id, name, slug, gender, concentration, image_path) values
  ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Perfume 1', 'perfume-1', 'unisex', 'edp', 'teste/foto.webp');
insert into public.collection_items (user_id, perfume_id, status) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 'owned'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', 'owned');
insert into public.daily_perfumes (user_id, perfume_id, date) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', current_date),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', current_date);
insert into public.perfume_reviews (user_id, perfume_id, longevity_rating, projection_rating, comment) values
  ('a0000000-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-000000000001', 4, 5, 'de A'),
  ('b0000000-0000-4000-8000-00000000000b', '11111111-0000-4000-8000-000000000001', 2, 3, 'de B');

select is((select review_count from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 2::bigint, 'antes: 2 avaliações no agregado');

delete from auth.users where id = 'a0000000-0000-4000-8000-00000000000a';

select is((select count(*) from public.profiles where id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'o perfil some');
select is((select count(*) from public.collection_items where user_id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'a coleção some');
select is((select count(*) from public.daily_perfumes where user_id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'o memorial some');
select is((select count(*) from public.perfume_reviews where user_id = 'a0000000-0000-4000-8000-00000000000a'), 0::bigint, 'as avaliações somem');
select is((select review_count from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 1::bigint, 'RN08: o agregado é recalculado sem a avaliação apagada');
select is((select avg_longevity from public.perfume_review_stats where perfume_id = '11111111-0000-4000-8000-000000000001'), 2.0::numeric, 'RN08: a média passa a ser só a do outro usuário');
select is(
  (select count(*) from public.profiles where id = 'b0000000-0000-4000-8000-00000000000b')
  + (select count(*) from public.collection_items where user_id = 'b0000000-0000-4000-8000-00000000000b')
  + (select count(*) from public.daily_perfumes where user_id = 'b0000000-0000-4000-8000-00000000000b')
  + (select count(*) from public.perfume_reviews where user_id = 'b0000000-0000-4000-8000-00000000000b'),
  4::bigint,
  'os dados de outro usuário ficam intactos'
);

select * from finish();
rollback;
