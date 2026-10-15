-- Gerado por scripts/ingest-catalog.mjs: 3 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Avatim Gigi Lazuli. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('avatim', 'Avatim')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cereja', 'Cereja', 'fruity'::public.olfactive_family, 'Frutado suculento e adocicado'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico luminoso e efervescente'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral branco envolvente e sedutor'),
  ('narciso', 'Narciso', 'floral'::public.olfactive_family, 'Floral opulento e refinado'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce, cremoso e reconfortante'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Aveludado e suave sensação de segunda pele')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'gigi-lazuli', b.id, 'Gigi Lazuli', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2023, 'Inspirada no azul profundo da gema lápis-lazúli, é uma fragrância oriental floral elegante que une a sensualidade da cereja a um buquê de flores brancas radiantes e fundo adocicado cremoso.',
  'avatim/gigi-lazuli.29291750.webp'
from public.brands b where b.slug = 'avatim'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('edison-fujita', 'Edison Fujita')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('edison-fujita', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'gigi-lazuli'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cereja', 'top'),
  ('bergamota', 'top'),
  ('jasmim', 'heart'),
  ('narciso', 'heart'),
  ('baunilha', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'gigi-lazuli'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: In The Box Infinite Horizon. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('in-the-box', 'In The Box')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cidra-siciliana', 'Cidra Siciliana', 'citrus'::public.olfactive_family, 'Cítrico e efervescente'),
  ('bergamota-da-calabria', 'Bergamota da Calábria', 'citrus'::public.olfactive_family, 'Fresco e luminoso'),
  ('neroli-tunisiano', 'Néroli Tunisiano', 'floral'::public.olfactive_family, 'Floral branco cítrico'),
  ('gengibre-nigeriano', 'Gengibre Nigeriano', 'spicy'::public.olfactive_family, 'Picante e refrescante'),
  ('canela-do-ceilao', 'Canela do Ceilão', 'spicy'::public.olfactive_family, 'Especiado quente e aromático'),
  ('ambroxan', 'Ambroxan', 'musky'::public.olfactive_family, 'Ambarado, limpo e aveludado'),
  ('cha-preto-chines', 'Chá Preto Chinês', 'aromatic'::public.olfactive_family, 'Herbal, seco e sofisticado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'infinite-horizon', b.id, 'Infinite Horizon', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2025, 'Fragrância revigorante e refinada inspirada na sensação de liberdade infinita, destacando uma saída cítrica cintilante de cidra e bergamota com o conforto reconfortante do chá preto e ambroxan.',
  'in-the-box/infinite-horizon.2f5eee69.webp'
from public.brands b where b.slug = 'in-the-box'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cidra-siciliana', 'top'),
  ('bergamota-da-calabria', 'top'),
  ('neroli-tunisiano', 'heart'),
  ('gengibre-nigeriano', 'heart'),
  ('canela-do-ceilao', 'heart'),
  ('ambroxan', 'base'),
  ('cha-preto-chines', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'infinite-horizon'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Opera Hell. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('abacaxi', 'Abacaxi', 'fruity'::public.olfactive_family, 'Frutado tropical doce e vibrante'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco e cintilante'),
  ('geranio', 'Gerânio', 'aromatic'::public.olfactive_family, 'Floral aromático verde e refinado'),
  ('magnolia', 'Magnólia', 'floral'::public.olfactive_family, 'Floral aveludado e luminoso'),
  ('praline', 'Pralinê', 'oriental'::public.olfactive_family, 'Doce gourmand caloroso e cremoso'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Terroso amadeirado e profundo'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado nobre e estruturado'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Amadeirado seco e elegante')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'opera-hell', b.id, 'Opera Hell', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2024, 'Composição magnética e sedutora que combina abertura frutada efervescente de abacaxi com um corpo floral nobre e uma base densa de pralinê, vetiver e cedro.',
  'maison-viegas/opera-hell.9a73e670.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('abacaxi', 'top'),
  ('bergamota', 'top'),
  ('geranio', 'heart'),
  ('magnolia', 'heart'),
  ('praline', 'base'),
  ('patchouli', 'base'),
  ('cedro', 'base'),
  ('vetiver', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'opera-hell'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
