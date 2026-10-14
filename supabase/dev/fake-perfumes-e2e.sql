-- E2E Seed: 3 perfumes reais (Caipi d'Argent, Amyi 2.15, Irish Green Man)
-- Rodar: npm run db:fake:e2e    Limpar: npm run db:fake:clear

do $e2e_seed$
begin
  -- Limpar dados anteriores
  delete from public.perfume_reviews where user_id in (select id from auth.users where email like 'e2e-%@e2e.local');
  delete from auth.users where email like 'e2e-%@e2e.local';
  delete from public.perfume_notes where perfume_id in (select id from public.perfumes where slug in ('caipi-argent', 'amyi-2-15', 'irish-green-man'));
  delete from public.perfumes where slug in ('caipi-argent', 'amyi-2-15', 'irish-green-man');
  delete from public.brands where slug in ('maison-cond', 'amyi-fragrances', 'irish-green');
  delete from public.notes where slug in ('bergamota', 'lima', 'coração', 'base-madeira');

  -- 3 marcas
  insert into public.brands (slug, name) values
    ('maison-cond', 'Maison Condé'),
    ('amyi-fragrances', 'Amyi Fragrances'),
    ('irish-green', 'Irish Green');

  -- 4 notas chave para os testes
  insert into public.notes (slug, name, family) values
    ('bergamota', 'Bergamota', 'citrus'),
    ('lima', 'Lima', 'citrus'),
    ('coração', 'Notas de Coração', 'floral'),
    ('base-madeira', 'Madeira', 'woody');

  -- 3 perfumes
  insert into public.perfumes (slug, name, brand_id, gender, concentration, release_year, image_path) values
    ('caipi-argent', 'Caipi d''Argent', (select id from public.brands where slug = 'maison-cond'), 'unisex', 'edt', 2020, 'teste/foto.webp'),
    ('amyi-2-15', 'Amyi 2.15', (select id from public.brands where slug = 'amyi-fragrances'), 'unisex', 'edp', 2022, 'teste/foto.webp'),
    ('irish-green-man', 'Irish Green Man', (select id from public.brands where slug = 'irish-green'), 'masculine', 'edc', 2021, 'teste/foto.webp');

  -- Notas para Caipi: bergamota + lima (top)
  insert into public.perfume_notes (perfume_id, note_id, position) values
    ((select id from public.perfumes where slug = 'caipi-argent'), (select id from public.notes where slug = 'bergamota'), 'top'),
    ((select id from public.perfumes where slug = 'caipi-argent'), (select id from public.notes where slug = 'lima'), 'top');

  -- Notas para Amyi: bergamota (top)
  insert into public.perfume_notes (perfume_id, note_id, position) values
    ((select id from public.perfumes where slug = 'amyi-2-15'), (select id from public.notes where slug = 'bergamota'), 'top');

  -- Notas para Irish Green: lima (top)
  insert into public.perfume_notes (perfume_id, note_id, position) values
    ((select id from public.perfumes where slug = 'irish-green-man'), (select id from public.notes where slug = 'lima'), 'top');

  raise notice 'E2E Seed: 3 perfumes com notas específicas criados';
end $e2e_seed$;
