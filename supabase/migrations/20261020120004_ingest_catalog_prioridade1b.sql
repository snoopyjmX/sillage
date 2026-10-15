-- Gerado por scripts/ingest-catalog.mjs: 1 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Avatim Seleto. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('avatim', 'Avatim')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('salvia', 'Sálvia', 'aromatic'::public.olfactive_family, 'Erva aromática de folha prateada, seca e herbal. Traz um frescor verde, limpo e levemente canforado.'),
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico doce e suculento, mais macio que o limão. Traz alegria e frescor à saída.'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiaria fresca, verde e levemente canforada. Dá um picante limpo e sofisticado.'),
  ('pomelo', 'Pomelo', 'citrus'::public.olfactive_family, 'Cítrico suculento e levemente amargo. Traz um frescor rosado e vivo.'),
  ('flor-de-iris', 'Flor de íris', 'floral'::public.olfactive_family, 'Raiz empoada, fria e elegante, de ar de batom. Dá sofisticação ao coração.'),
  ('coentro', 'Coentro', 'spicy'::public.olfactive_family, 'Semente cítrica, verde e levemente picante. Dá um frescor especiado.'),
  ('fava-tonka', 'Fava tonka', 'oriental'::public.olfactive_family, 'Semente doce, com baunilha, amêndoa e feno. Cheira a conforto e calor.'),
  ('oud', 'Oud', 'woody'::public.olfactive_family, 'Madeira escura e resinosa, intensa, fumê e levemente animálica. É a joia da perfumaria árabe.'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Cheiro cremoso, doce e reconfortante de fava e creme. Dá um fundo acolhedor.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'seleto', b.id, 'Seleto', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2018, 'Perfume marcante e discreto que traduz sofisticação com o frescor da sálvia e do cardamomo sobre o calor da fava tonka e do oud.',
  'avatim/seleto.cc6ccfb5.webp'
from public.brands b where b.slug = 'avatim'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('salvia', 'top'),
  ('mandarina', 'top'),
  ('cardamomo', 'top'),
  ('pomelo', 'top'),
  ('flor-de-iris', 'heart'),
  ('coentro', 'heart'),
  ('fava-tonka', 'heart'),
  ('oud', 'base'),
  ('ambar', 'base'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'seleto'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
