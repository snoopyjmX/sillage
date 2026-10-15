-- Gerado por scripts/ingest-catalog.mjs: 9 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Costa Riviera. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('algas-marinhas', 'Algas Marinhas', 'aquatic'::public.olfactive_family, 'Salino e marinho revigorante'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado fresco e aromático'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Floral herbáceo limpo'),
  ('murta', 'Murta', 'aromatic'::public.olfactive_family, 'Herbáceo canforado'),
  ('madeira-flutuante', 'Madeira Flutuante', 'woody'::public.olfactive_family, 'Madeira envelhecida pelo mar'),
  ('carvalho', 'Carvalho', 'woody'::public.olfactive_family, 'Amadeirado nobre e estruturado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'costa-riviera', b.id, 'Costa Riviera', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2024, 'Um convite para viver a brisa salgada e o frescor mediterrâneo, harmonizando algas marinhas, cítricos vibrantes e madeiras nobres.',
  'nuancielo/costa-riviera.d472554a.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('algas-marinhas', 'top'),
  ('cardamomo', 'top'),
  ('lavanda', 'heart'),
  ('murta', 'heart'),
  ('madeira-flutuante', 'base'),
  ('carvalho', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'costa-riviera'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Pharazon. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('olibano', 'Olíbano', 'oriental'::public.olfactive_family, 'Resinoso místico e esfumaçado'),
  ('pimenta-de-szechuan', 'Pimenta de Szechuan', 'spicy'::public.olfactive_family, 'Picante e vibrante'),
  ('acafrao', 'Açafrão', 'spicy'::public.olfactive_family, 'Couroide exótico e refinado'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Terroso profundo'),
  ('agarwood-oud', 'Agarwood (Oud)', 'woody'::public.olfactive_family, 'Amadeirado escuro e imponente'),
  ('ambar-cinzento', 'Âmbar Cinzento', 'oriental'::public.olfactive_family, 'Mineral marinho e quente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'pharazon', b.id, 'Pharazon', 'extrait'::public.concentration_type,
  'masculine'::public.perfume_gender, 2024, 'Uma fragrância opulenta e monumental que projeta poder através de olíbano fumegante, especiarias quentes e resinas de oud.',
  'nuancielo/pharazon.f016cb81.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('olibano', 'top'),
  ('pimenta-de-szechuan', 'top'),
  ('acafrao', 'heart'),
  ('patchouli', 'heart'),
  ('agarwood-oud', 'base'),
  ('ambar-cinzento', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'pharazon'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Sahara Absolu. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('groselha-preta', 'Groselha Preta', 'fruity'::public.olfactive_family, 'Frutado suculento e levemente ácido'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico luminoso e cortante'),
  ('praline', 'Pralinê', 'oriental'::public.olfactive_family, 'Doce aveludado e caramelizado'),
  ('violeta', 'Violeta', 'floral'::public.olfactive_family, 'Floral macio e atalcado'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Madeira seca e refinada'),
  ('ambar-negro', 'Âmbar Negro', 'oriental'::public.olfactive_family, 'Resinoso quente e balsâmico')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'sahara-absolu', b.id, 'Sahara Absolu', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2024, 'Aura ensolarada e envolvente que une a efervescência de groselha e cítricos à cremosidade gourmand de pralinê e âmbar negro.',
  'nuancielo/sahara-absolu.8f60c832.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('groselha-preta', 'top'),
  ('bergamota', 'top'),
  ('praline', 'heart'),
  ('violeta', 'heart'),
  ('cedro', 'base'),
  ('ambar-negro', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'sahara-absolu'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Everest. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('bergamota-da-calabria', 'Bergamota da Calábria', 'citrus'::public.olfactive_family, 'Cítrico brilhante e tônico'),
  ('toranja', 'Toranja', 'citrus'::public.olfactive_family, 'Amargo refrescante e revigorante'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado cremoso límpido'),
  ('ambroxan', 'Ambroxan', 'musky'::public.olfactive_family, 'Ambarado mineral e moderno'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Seco e aromático estruturado'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Limpo, aveludado e suave')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'everest', b.id, 'Everest', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2023, 'Sensação gélida e revigorante inspirada em montanhas nevadas, equilibrando cítricos cristalinos com sândalo e ambroxan.',
  'nuancielo/everest.f74076b4.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('bergamota-da-calabria', 'top'),
  ('toranja', 'top'),
  ('sandalo', 'heart'),
  ('ambroxan', 'base'),
  ('cedro', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'everest'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Blue Celestia. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('laranja-siciliana', 'Laranja Siciliana', 'citrus'::public.olfactive_family, 'Cítrico adocicado e solar'),
  ('limao', 'Limão', 'citrus'::public.olfactive_family, 'Ácido e efervescente'),
  ('pessego', 'Pêssego', 'fruity'::public.olfactive_family, 'Frutado aveludado e macio'),
  ('baunilha-de-madagascar', 'Baunilha de Madagascar', 'oriental'::public.olfactive_family, 'Doce cremosa e aconchegante'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Quente e envolvente'),
  ('almiscar-branco', 'Almíscar Branco', 'musky'::public.olfactive_family, 'Confortável sensação de pureza')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'blue-celestia', b.id, 'Blue Celestia', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2024, 'Uma sinfonia luminosa que mescla cítricos mediterrâneos suculentos a um coração aveludado de pêssego e baunilha.',
  'nuancielo/blue-celestia.c3a7e784.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('laranja-siciliana', 'top'),
  ('limao', 'top'),
  ('pessego', 'heart'),
  ('baunilha-de-madagascar', 'base'),
  ('ambar', 'base'),
  ('almiscar-branco', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'blue-celestia'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Alpha Leggera. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('limao-siciliano', 'Limão Siciliano', 'citrus'::public.olfactive_family, 'Cítrico azedo e radiante'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Fresco e refinado'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Picante quente e tônico'),
  ('neroli', 'Néroli', 'floral'::public.olfactive_family, 'Floral branco cítrico e limpo'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado seco viril'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Macio e transparente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'alpha-leggera', b.id, 'Alpha Leggera', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2020, 'Explosão esportiva e vibrante com notas cítricas cintilantes que evoluem para um fundo amadeirado elegante.',
  'nuancielo/alpha-leggera.69e1051b.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('limao-siciliano', 'top'),
  ('bergamota', 'top'),
  ('gengibre', 'heart'),
  ('neroli', 'heart'),
  ('cedro', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'alpha-leggera'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Alpha Blanche. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('limao-verdadeiro', 'Limão Verdadeiro', 'citrus'::public.olfactive_family, 'Cítrico revigorante e suculento'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Fresco solar'),
  ('pimenta-rosa', 'Pimenta Rosa', 'spicy'::public.olfactive_family, 'Especiado leve e floral'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira cremosa e refinada'),
  ('baunilha-de-madagascar', 'Baunilha de Madagascar', 'oriental'::public.olfactive_family, 'Doce aveludado e sofisticado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico amendoado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'alpha-blanche', b.id, 'Alpha Blanche', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2021, 'Harmonia primorosa entre a acidez luminosa do limão e o conforto amendoado da baunilha de Madagascar.',
  'nuancielo/alpha-blanche.7931fc5d.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('limao-verdadeiro', 'top'),
  ('bergamota', 'top'),
  ('pimenta-rosa', 'heart'),
  ('sandalo', 'heart'),
  ('baunilha-de-madagascar', 'base'),
  ('fava-tonka', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'alpha-blanche'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Noām. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Floral aromático relaxante'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico brilhante'),
  ('mel', 'Mel', 'oriental'::public.olfactive_family, 'Doce licoroso e denso'),
  ('canela', 'Canela', 'spicy'::public.olfactive_family, 'Especiado quente e acolhedor'),
  ('folha-de-tabaco', 'Folha de Tabaco', 'aromatic'::public.olfactive_family, 'Aromático seco amadeirado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce morno e balsâmico')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'noam', b.id, 'Noām', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2021, 'Composição rica e sedutora onde o mel dourado e o tabaco nobre se entrelaçam com lavanda clássica e canela.',
  'nuancielo/noam.2258df96.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('lavanda', 'top'),
  ('bergamota', 'top'),
  ('mel', 'heart'),
  ('canela', 'heart'),
  ('folha-de-tabaco', 'base'),
  ('fava-tonka', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'noam'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Nuancielo Ginger Club. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('nuancielo', 'Nuancielo')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Picante efervescente e revigorante'),
  ('toranja', 'Toranja', 'citrus'::public.olfactive_family, 'Amargor cítrico moderno'),
  ('salvia', 'Sálvia', 'aromatic'::public.olfactive_family, 'Herbáceo elegante'),
  ('geranio', 'Gerânio', 'floral'::public.olfactive_family, 'Floral verde refrescante'),
  ('ambroxan', 'Ambroxan', 'musky'::public.olfactive_family, 'Ambarado mineral de fixação alta'),
  ('ladano', 'Ládano', 'oriental'::public.olfactive_family, 'Resinoso morno profundo')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'ginger-club', b.id, 'Ginger Club', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2024, 'Fragrância elétrica e moderna centrada em gengibre efervescente contrastado com âmbar mineral sofisticado.',
  'nuancielo/ginger-club.e24972b5.webp'
from public.brands b where b.slug = 'nuancielo'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('gengibre', 'top'),
  ('toranja', 'top'),
  ('salvia', 'heart'),
  ('geranio', 'heart'),
  ('ambroxan', 'base'),
  ('ladano', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'ginger-club'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
