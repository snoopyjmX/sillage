-- Gerado por scripts/ingest-catalog.mjs: 6 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Domus. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('maca', 'Maçã', 'fruity'::public.olfactive_family, 'Frutado crocante e vivo'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Clássico e aromático'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado requintado'),
  ('geranio', 'Gerânio', 'floral'::public.olfactive_family, 'Verde floral picante'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Cremosa e aveludada'),
  ('madeira-guaiac', 'Madeira Guaiac', 'woody'::public.olfactive_family, 'Defumado amadeirado profundo')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'domus', b.id, 'Domus', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2021, 'Imponência e magnetismo com acordes quentes de maçã, especiarias orientais finas e madeira guaiac.',
  'nuancielo/domus.353c0b4e.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('maca', 'top'),
  ('lavanda', 'top'),
  ('cardamomo', 'heart'),
  ('geranio', 'heart'),
  ('baunilha', 'base'),
  ('madeira-guaiac', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'domus'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Supremacy. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('abacaxi', 'Abacaxi', 'fruity'::public.olfactive_family, 'Tropical vívido e suculento'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico cintilante'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Terroso e encorpado'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral opulento'),
  ('musgo-de-carvalho', 'Musgo de Carvalho', 'green'::public.olfactive_family, 'Verde úmido clássico'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Seco amadeirado nobre')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'supremacy', b.id, 'Supremacy', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2020, 'Símbolo de liderança e sofisticação com explosão frutada de abacaxi sobre base terrosa de musgo e madeiras.',
  'nuancielo/supremacy.0eec17bf.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('abacaxi', 'top'),
  ('bergamota', 'top'),
  ('patchouli', 'heart'),
  ('jasmim', 'heart'),
  ('musgo-de-carvalho', 'base'),
  ('cedro', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'supremacy'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Hills. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('magnolia', 'Magnólia', 'floral'::public.olfactive_family, 'Floral delicado orvalhado'),
  ('hedione', 'Hedione', 'floral'::public.olfactive_family, 'Jasmim transparente e aéreo'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Aveludado e envolvente'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado macio e cremoso'),
  ('amendoa', 'Amêndoa', 'oriental'::public.olfactive_family, 'Suave e amendoadado sutil')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'hills', b.id, 'Hills', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2021, 'Uma experiência almiscarada etérea com a radiância translúcida do hedione e magnólia sobre sândalo leitoso.',
  'nuancielo/hills.daaad4e7.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('magnolia', 'top'),
  ('hedione', 'heart'),
  ('almiscar', 'heart'),
  ('sandalo', 'base'),
  ('amendoa', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'hills'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Jocker. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pimenta-rosa', 'Pimenta Rosa', 'spicy'::public.olfactive_family, 'Picante efervescente refinado'),
  ('pera', 'Pêra', 'fruity'::public.olfactive_family, 'Frutado doce suave'),
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Floral moderno e denso'),
  ('cravo-da-india', 'Cravo-da-Índia', 'spicy'::public.olfactive_family, 'Especiado quente penetrante'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Terroso e amadeirado seco'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso e acolhedor')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'jocker', b.id, 'Jocker', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2021, 'Ousado e contemporâneo, combina rosa marcante com a picância da pimenta rosa e um fundo amadeirado de vetiver.',
  'nuancielo/jocker.175a44cf.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pimenta-rosa', 'top'),
  ('pera', 'top'),
  ('rosa', 'heart'),
  ('cravo-da-india', 'heart'),
  ('vetiver', 'base'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'jocker'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Maktub. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado morno aromático'),
  ('pimenta-sichuan', 'Pimenta Sichuan', 'spicy'::public.olfactive_family, 'Picante elétrico'),
  ('agarwood-oud', 'Agarwood (Oud)', 'woody'::public.olfactive_family, 'Amadeirado escuro e resinoso'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira macia e balsâmica'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce reconfortante'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico amendoado quente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'maktub', b.id, 'Maktub', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2019, 'Uma celebração ao misticismo do oud acompanhado de sândalo e cardamomo que cria uma assinatura imponente.',
  'nuancielo/maktub.403b508e.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cardamomo', 'top'),
  ('pimenta-sichuan', 'top'),
  ('agarwood-oud', 'heart'),
  ('sandalo', 'heart'),
  ('baunilha', 'base'),
  ('fava-tonka', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'maktub'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Elixir Babylone. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('acafrao', 'Açafrão', 'spicy'::public.olfactive_family, 'Couroide nobre e quente'),
  ('noz-moscada', 'Noz-moscada', 'spicy'::public.olfactive_family, 'Morno e levemente amadeirado'),
  ('cipriol', 'Cipriol', 'woody'::public.olfactive_family, 'Terroso amadeirado fumegante'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Seco e imponente'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce aveludado e rico'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Cremoso e sutil')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'elixir-babylone', b.id, 'Elixir Babylone', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2022, 'Opulência babilônica em forma líquida, combinando o calor do açafrão, notas amadeiradas de cipriol e baunilha.',
  'nuancielo/elixir-babylone.d52dd733.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('acafrao', 'top'),
  ('noz-moscada', 'top'),
  ('cipriol', 'heart'),
  ('cedro', 'heart'),
  ('baunilha', 'base'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'elixir-babylone'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
