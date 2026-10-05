-- Seed determinístico e idempotente (docs/PRODUCT.md, Seção 5).
-- Dados pesquisados em fontes públicas; podem divergir de fontes oficiais.
-- image_path fica NULL por direitos de imagem.

-- Marcas
insert into public.brands (slug, name, description) values
  ('amyi', 'Amyi', 'Marca de perfumaria de nicho.'),
  ('conde-parfum', 'Condé Parfum', 'Marca de perfumaria de nicho.'),
  ('in-the-box', 'In The Box', 'Marca de perfumaria de nicho.')
on conflict (slug) do nothing;

-- Notas (cada nota é uma linha só, compartilhada entre perfumes)
insert into public.notes (slug, name, family) values
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family),
  ('lima', 'Lima', 'citrus'::public.olfactive_family),
  ('verbena-limao', 'Verbena-limão', 'citrus'::public.olfactive_family),
  ('limao-siciliano', 'Limão-siciliano', 'citrus'::public.olfactive_family),
  ('litsea-cubeba', 'Litsea cubeba', 'citrus'::public.olfactive_family),
  ('folha-de-cravo', 'Folha de cravo', 'spicy'::public.olfactive_family),
  ('mimosa', 'Mimosa', 'floral'::public.olfactive_family),
  ('magnolia', 'Magnólia', 'floral'::public.olfactive_family),
  ('lirio-do-vale', 'Lírio-do-vale', 'floral'::public.olfactive_family),
  ('iris', 'Íris', 'floral'::public.olfactive_family),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family),
  ('cumarina', 'Cumarina', 'oriental'::public.olfactive_family),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family),
  ('ambroxan', 'Ambroxan', 'musky'::public.olfactive_family),
  ('ambar-gris', 'Âmbar-gris', 'musky'::public.olfactive_family),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family),
  ('cedro-da-virginia', 'Cedro-da-Virgínia', 'woody'::public.olfactive_family),
  ('guaiaco', 'Guaiaco', 'woody'::public.olfactive_family),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family),
  ('folha-de-violeta', 'Folha de violeta', 'green'::public.olfactive_family),
  ('ruibarbo', 'Ruibarbo', 'green'::public.olfactive_family),
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family),
  ('hortela-pimenta', 'Hortelã-pimenta', 'aromatic'::public.olfactive_family),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family),
  ('manjerico', 'Manjericão', 'aromatic'::public.olfactive_family),
  ('acorde-alcoolico', 'Acorde alcoólico', 'aromatic'::public.olfactive_family)
on conflict (slug) do nothing;

-- Perfumes
insert into public.perfumes (slug, brand_id, name, release_year, gender, concentration, description)
select v.slug, b.id, v.name, v.release_year, v.gender::public.perfume_gender,
       v.concentration::public.concentration_type, v.description
from (values
  ('amyi-2-15', 'amyi', 'Amyi 2.15', 2021, 'unisex', 'other',
   'Perfume unissex de abertura cítrica e especiada, com coração floral e fundo amadeirado e baunilhado.'),  -- PLACEHOLDER: confirmar concentração
  ('caipi-d-argent', 'conde-parfum', 'Caipi d''Argent', 2023, 'unisex', 'edp',
   'Perfume unissex cítrico e herbal, com lima e hortelã e fundo amadeirado.'),  -- PLACEHOLDER: confirmar
  ('irish-green-man', 'in-the-box', 'Irish Green Man', 2019, 'masculine', 'other',
   'Perfume masculino verde e floral, com lima e íris no topo e fundo de âmbar e sândalo.')  -- PLACEHOLDER: confirmar concentração
) as v (slug, brand_slug, name, release_year, gender, concentration, description)
join public.brands b on b.slug = v.brand_slug
on conflict (slug) do nothing;

-- Pirâmide olfativa
insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('amyi-2-15', 'folha-de-cravo', 'top'),
  ('amyi-2-15', 'bergamota', 'top'),
  ('amyi-2-15', 'mimosa', 'heart'),
  ('amyi-2-15', 'magnolia', 'heart'),
  ('amyi-2-15', 'lirio-do-vale', 'heart'),
  ('amyi-2-15', 'baunilha', 'base'),
  ('amyi-2-15', 'patchouli', 'base'),
  ('amyi-2-15', 'almiscar', 'base'),
  ('amyi-2-15', 'vetiver', 'base'),
  ('caipi-d-argent', 'lima', 'top'),
  ('caipi-d-argent', 'acorde-alcoolico', 'top'),
  ('caipi-d-argent', 'verbena-limao', 'top'),
  ('caipi-d-argent', 'limao-siciliano', 'top'),
  ('caipi-d-argent', 'bergamota', 'top'),
  ('caipi-d-argent', 'litsea-cubeba', 'top'),
  ('caipi-d-argent', 'hortela', 'heart'),
  ('caipi-d-argent', 'hortela-pimenta', 'heart'),
  ('caipi-d-argent', 'lavanda', 'heart'),
  ('caipi-d-argent', 'ruibarbo', 'heart'),
  ('caipi-d-argent', 'manjerico', 'heart'),
  ('caipi-d-argent', 'ambroxan', 'base'),
  ('caipi-d-argent', 'cumarina', 'base'),
  ('caipi-d-argent', 'vetiver', 'base'),
  ('caipi-d-argent', 'cedro-da-virginia', 'base'),
  ('caipi-d-argent', 'guaiaco', 'base'),
  ('irish-green-man', 'lima', 'top'),
  ('irish-green-man', 'iris', 'top'),
  ('irish-green-man', 'folha-de-violeta', 'heart'),
  ('irish-green-man', 'ambar-gris', 'base'),
  ('irish-green-man', 'sandalo', 'base')
) as v (perfume_slug, note_slug, position)
join public.perfumes p on p.slug = v.perfume_slug
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
