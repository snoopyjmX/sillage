-- Gerado por scripts/ingest-catalog.mjs: 42 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Fresco e mentolado revigorante'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Floral aromático e clássico de barbearia'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado doce e aromático'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco limpo e iluminado'),
  ('canela', 'Canela', 'spicy'::public.olfactive_family, 'Especiado quente e adocicado'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce, quente e envolvente'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Amendoado doce e balsâmico'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso e aveludado'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado cremoso e suave')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male', b.id, 'Le Male', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 1995, 'Um ícone atemporal da perfumaria que presta homenagem à figura do marinheiro viril e sedutor. Combina o frescor mentolado da barbearia tradicional com a sensualidade doce e reconfortante da baunilha, criando um rastro inesquecível.',
  'jean-paul-gaultier/le-male.dba66217.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('hortela', 'top'),
  ('lavanda', 'top'),
  ('cardamomo', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('canela', 'heart'),
  ('baunilha', 'base'),
  ('fava-tonka', 'base'),
  ('ambar', 'base'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male Le Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado quente e aromático refinado'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Aromático fresco e refinado'),
  ('iris', 'Íris', 'floral'::public.olfactive_family, 'Floral atalcado e elegante'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce aveludada e misteriosa'),
  ('notas-orientais', 'Notas Orientais', 'oriental'::public.olfactive_family, 'Acorde ambarado e suntuoso'),
  ('notas-amadeiradas', 'Notas Amadeiradas', 'woody'::public.olfactive_family, 'Amadeirado seco e estruturado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-le-parfum', b.id, 'Le Male Le Parfum', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2020, 'Assumindo o comando da linha com autoridade e sofisticação, esta fragrância traz um acorde nobre de íris e cardamomo que se une à clássica lavanda em uma base oriental escura de baunilha oriental intensa e madeiras nobres.',
  'jean-paul-gaultier/le-male-le-parfum.f96f5b63.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('nathalie-gracia-cetto', 'Nathalie Gracia-Cetto')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('nathalie-gracia-cetto', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-le-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cardamomo', 'top'),
  ('lavanda', 'heart'),
  ('iris', 'heart'),
  ('baunilha', 'base'),
  ('notas-orientais', 'base'),
  ('notas-amadeiradas', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-le-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male Elixir. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Aromático fresco e penetrante'),
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Fresco e herbal cortante'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce, licorosa e opulenta'),
  ('benjoim', 'Benjoim', 'oriental'::public.olfactive_family, 'Resinoso quente e ambarado'),
  ('mel', 'Mel', 'oriental'::public.olfactive_family, 'Adocicado denso e animálico dourado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce amendoador e tostado'),
  ('tabaco', 'Tabaco', 'woody'::public.olfactive_family, 'Seco, aromático e fumado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-elixir', b.id, 'Le Male Elixir', 'parfum'::public.concentration_type,
  'masculine'::public.perfume_gender, 2023, 'Uma infusão escaldante de sensualidade envolta em ouro reluzente. A lavanda aromática incendeia-se com as facetas ricas de benjoim balsâmico, mel selvagem e tabaco tostado, resultando em uma potência viciante e magnética.',
  'jean-paul-gaultier/le-male-elixir.950a58c5.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-elixir'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('lavanda', 'top'),
  ('hortela', 'top'),
  ('baunilha', 'heart'),
  ('benjoim', 'heart'),
  ('mel', 'base'),
  ('fava-tonka', 'base'),
  ('tabaco', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-elixir'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Ultra Male. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pera', 'Pera', 'fruity'::public.olfactive_family, 'Frutado suculento e doce'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Herbal fresco e limpo'),
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Fresco e canforado'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico cítrico e efervescente'),
  ('canela', 'Canela', 'spicy'::public.olfactive_family, 'Especiado quente e picante'),
  ('salvia-esclareia', 'Sálvia Esclareia', 'aromatic'::public.olfactive_family, 'Herbal refinado e texturizado'),
  ('casca-de-baunilha-negra', 'Casca de Baunilha Negra', 'oriental'::public.olfactive_family, 'Doce escuro, cremoso e sedutor'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso e aveludado'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado nobre e viril')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'ultra-male', b.id, 'Ultra Male', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2015, 'Uma explosão gourmand e irresistível de pera suculenta banhada em especiarias negras e baunilha sedutora. Um perfume vibrante e baladeiro por excelência, desenvolvido para projetar intensidade e charme sem limites.',
  'jean-paul-gaultier/ultra-male.1af1f61e.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'ultra-male'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pera', 'top'),
  ('lavanda', 'top'),
  ('hortela', 'top'),
  ('bergamota', 'top'),
  ('canela', 'heart'),
  ('salvia-esclareia', 'heart'),
  ('casca-de-baunilha-negra', 'base'),
  ('ambar', 'base'),
  ('cedro', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'ultra-male'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Beau. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco e brilhante'),
  ('coco', 'Coco', 'fruity'::public.olfactive_family, 'Tropical, leitoso e amadeirado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce, amendoada e balsâmica')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-beau', b.id, 'Le Beau', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2019, 'Inspirado no Jardim das Tentações, Le Beau é um torso masculino esculpido com folha de videira dourada. Destaca uma fusão ultra sensual de madeira de coco fresca, bergamota revigorante e fava tonka torrada.',
  'jean-paul-gaultier/le-beau.6d6a817b.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('sonia-constant', 'Sonia Constant')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('sonia-constant', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-beau'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('bergamota', 'top'),
  ('coco', 'heart'),
  ('fava-tonka', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-beau'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Beau Le Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('abacaxi', 'Abacaxi', 'fruity'::public.olfactive_family, 'Frutado tropical doce e cortante'),
  ('iris', 'Íris', 'floral'::public.olfactive_family, 'Floral atalcado e requintado'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Especiado fresco e picante'),
  ('coco', 'Coco', 'fruity'::public.olfactive_family, 'Cremoso, tostado e exótico'),
  ('notas-amadeiradas', 'Notas Amadeiradas', 'woody'::public.olfactive_family, 'Madeiras intensas e encorpadas'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico quente e resinoso'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado cremoso e sensual'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Ambarado aveludado e fixador')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-beau-le-parfum', b.id, 'Le Beau Le Parfum', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2022, 'Uma tentação tropical levada ao ápice da intensidade. A madeira de coco ganha nuances amadeiradas profundas de sândalo e cipreste, enquanto o acorde de abacaxi suculento e fava tonka incendeia o rastro com sedução voraz.',
  'jean-paul-gaultier/le-beau-le-parfum.1cd5afd8.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-beau-le-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('abacaxi', 'top'),
  ('iris', 'top'),
  ('gengibre', 'top'),
  ('coco', 'heart'),
  ('notas-amadeiradas', 'heart'),
  ('fava-tonka', 'base'),
  ('sandalo', 'base'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-beau-le-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Beau Paradise Garden. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('notas-aquaticas', 'Notas Aquáticas', 'aquatic'::public.olfactive_family, 'Fresco, oceânico e salino'),
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Verde revigorante e gélido'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Picante e efervescente'),
  ('figo', 'Figo', 'fruity'::public.olfactive_family, 'Frutado verde lactônico e sofisticado'),
  ('coco', 'Coco', 'fruity'::public.olfactive_family, 'Leitoso cremoso e solar'),
  ('sal', 'Sal', 'aquatic'::public.olfactive_family, 'Mineral cristalino e moderno'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce amendoado e envolvente'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado aveludado e nobre')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-beau-paradise-garden', b.id, 'Le Beau Paradise Garden', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2024, 'Um éden aquático e verdejante de paixão libertadora. O frescor radiante da água salgada e da hortelã encontra a textura aveludada do figo verde e a doçura tropical do coco, repousando em sândalo elegante.',
  'jean-paul-gaultier/le-beau-paradise-garden.fe6c46f3.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-beau-paradise-garden'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('notas-aquaticas', 'top'),
  ('hortela', 'top'),
  ('gengibre', 'top'),
  ('figo', 'heart'),
  ('coco', 'heart'),
  ('sal', 'heart'),
  ('fava-tonka', 'base'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-beau-paradise-garden'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal Pour Homme. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('salvia-esclareia', 'Sálvia Esclareia', 'aromatic'::public.olfactive_family, 'Aromático herbal e elegante'),
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico suculento e alegre'),
  ('caramelo', 'Caramelo', 'oriental'::public.olfactive_family, 'Gourmand doce e tostado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico amendoado refinado'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Terroso, seco e sofisticado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-pour-homme', b.id, 'Scandal Pour Homme', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2021, 'O campeão do ringue que seduz com um nocaute olfativo. Uma combinação viciante de caramelo tostado com a masculinidade aromática da sálvia esclareia e a elegância terrosa do vetiver, coroado com imponência real.',
  'jean-paul-gaultier/scandal-pour-homme.312b5dfb.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('christophe-raynaud', 'Christophe Raynaud'),
  ('nathalie-gracia-cetto', 'Nathalie Gracia-Cetto')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('christophe-raynaud', 2),
  ('nathalie-gracia-cetto', 3)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-pour-homme'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('salvia-esclareia', 'top'),
  ('mandarina', 'top'),
  ('caramelo', 'heart'),
  ('fava-tonka', 'heart'),
  ('vetiver', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-pour-homme'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal Pour Homme Le Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('geranio', 'Gerânio', 'floral'::public.olfactive_family, 'Floral aromático picante e vivo'),
  ('caramelo', 'Caramelo', 'oriental'::public.olfactive_family, 'Denso, cremoso e tostado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce aveludado e sedutor'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira nobre e cremosa')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-pour-homme-le-parfum', b.id, 'Scandal Pour Homme Le Parfum', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2022, 'O pugilista retorna ainda mais audacioso e escandaloso. O caramelo adquire tonalidades intensas com o calor do gerânio aromático e a riqueza da fava tonka e sândalo amadeirado, projetando pura sensualidade viril.',
  'jean-paul-gaultier/scandal-pour-homme-le-parfum.5e709def.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('nathalie-gracia-cetto', 'Nathalie Gracia-Cetto'),
  ('christophe-raynaud', 'Christophe Raynaud')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('nathalie-gracia-cetto', 2),
  ('christophe-raynaud', 3)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-pour-homme-le-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('geranio', 'top'),
  ('caramelo', 'heart'),
  ('fava-tonka', 'base'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-pour-homme-le-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal Pour Homme Absolu. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('ameixa-mirabelle', 'Ameixa Mirabelle', 'fruity'::public.olfactive_family, 'Frutado doce, licoroso e dourado'),
  ('castanha', 'Castanha', 'oriental'::public.olfactive_family, 'Gourmand quente, tostado e amendoado'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado sedoso e opulento')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-pour-homme-absolu', b.id, 'Scandal Pour Homme Absolu', 'parfum'::public.concentration_type,
  'masculine'::public.perfume_gender, 2024, 'Livre de convenções e coroado em ouro opulento, este parfum une o licor suculento da ameixa mirabelle ao acorde gourmand de castanha tostada e uma overdose magnética de sândalo cremoso.',
  'jean-paul-gaultier/scandal-pour-homme-absolu.2c2ba9ee.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('nathalie-gracia-cetto', 'Nathalie Gracia-Cetto'),
  ('christophe-raynaud', 'Christophe Raynaud')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('nathalie-gracia-cetto', 2),
  ('christophe-raynaud', 3)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-pour-homme-absolu'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('ameixa-mirabelle', 'top'),
  ('castanha', 'heart'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-pour-homme-absolu'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral solar e radiante'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Especiado fresco e picante'),
  ('anis-estrelado', 'Anis Estrelado', 'spicy'::public.olfactive_family, 'Especiado aromático e anisado'),
  ('ylang-ylang', 'Ylang Ylang', 'floral'::public.olfactive_family, 'Floral exótico, cremoso e doce'),
  ('iris', 'Íris', 'floral'::public.olfactive_family, 'Atalcado requintado e sedoso'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce aveludado e sensual'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso aconchegante e quente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique', b.id, 'Classique', 'edt'::public.concentration_type,
  'feminine'::public.perfume_gender, 1993, 'O espartilho mais famoso do mundo em forma de fragrância. Um tributo à feminilidade fatal que mistura a flor de laranjeira luminosa à provocação do gengibre picante e a doçura acariciante da baunilha e do âmbar.',
  'jean-paul-gaultier/classique.048f3017.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('jacques-cavallier', 'Jacques Cavallier')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('jacques-cavallier', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('flor-de-laranjeira', 'top'),
  ('gengibre', 'top'),
  ('anis-estrelado', 'top'),
  ('ylang-ylang', 'heart'),
  ('iris', 'heart'),
  ('baunilha', 'base'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Eau de Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Floral aveludado e clássico'),
  ('rum', 'Rum', 'oriental'::public.olfactive_family, 'Licoroso alcoólico e envolvente'),
  ('orquidea-baunilha', 'Orquídea Baunilha', 'floral'::public.olfactive_family, 'Floral exótico e adocicado'),
  ('narciso', 'Narciso', 'floral'::public.olfactive_family, 'Floral branco denso e narcótico'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Gourmand doce e cremoso'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico quente e sedutor'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado macio e persistente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-eau-de-parfum', b.id, 'Classique Eau de Parfum', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 1990, 'Uma versão ainda mais carnal, calorosa e inebriante do clássico atemporal. O narciso suntuoso e a orquídea baunilha fundem-se a notas de rum licoroso e fava tonka sobre um espartilho de renda vermelha.',
  'jean-paul-gaultier/classique-eau-de-parfum.a14baf3d.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('jacques-cavallier', 'Jacques Cavallier')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('jacques-cavallier', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-eau-de-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('rosa', 'top'),
  ('rum', 'top'),
  ('orquidea-baunilha', 'heart'),
  ('narciso', 'heart'),
  ('baunilha', 'base'),
  ('fava-tonka', 'base'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-eau-de-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier La Belle. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pera', 'Pera', 'fruity'::public.olfactive_family, 'Frutado aquoso, doce e cristalino'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico cintilante e fresco'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce gourmand suntuoso e profundo')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'la-belle', b.id, 'La Belle', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2019, 'Nascida no Jardim do Éden para arrebatar os sentidos, La Belle é o fruto proibido em forma de pera caramelizada suculenta, equilibrada pelo brilho da bergamota e envolvida por uma baunilha oriental hipnótica.',
  'jean-paul-gaultier/la-belle.78c22392.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('sonia-constant', 'Sonia Constant')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('sonia-constant', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'la-belle'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pera', 'top'),
  ('bergamota', 'top'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'la-belle'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier La Belle Le Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pera', 'Pera', 'fruity'::public.olfactive_family, 'Frutado quente, assado e licoroso'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce balsâmico e tostado'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral branco opulento e feminino'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Gourmand escuro e ultra viciante')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'la-belle-le-parfum', b.id, 'La Belle Le Parfum', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2021, 'A versão intensa da maçã tentadora. A pera assada com calda de caramelo se funde à fava tonka sedutora e à fita aveludada do jasmim, repousando sobre uma base de baunilha oriental ultra encorpada.',
  'jean-paul-gaultier/la-belle-le-parfum.1757aeaa.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('sonia-constant', 'Sonia Constant')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('sonia-constant', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'la-belle-le-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pera', 'top'),
  ('fava-tonka', 'heart'),
  ('jasmim', 'heart'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'la-belle-le-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier La Belle Paradise Garden. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('lotus-azul', 'Lótus Azul', 'aquatic'::public.olfactive_family, 'Floral aquático cristalino e sereno'),
  ('iris', 'Íris', 'floral'::public.olfactive_family, 'Floral nobre, atalcado e elegante'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce suave, solar e acolhedor')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'la-belle-paradise-garden', b.id, 'La Belle Paradise Garden', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2024, 'Um jardim paradisíaco iluminado pelo sol exótico. O lótus azul aquático flutua sobre um véu de íris nobre e atalcada, finalizado com uma baunilha paradisíaca que veste a pele com frescor e sensualidade radiante.',
  'jean-paul-gaultier/la-belle-paradise-garden.05bf4fe9.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'la-belle-paradise-garden'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('lotus-azul', 'top'),
  ('iris', 'heart'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'la-belle-paradise-garden'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('laranja-sanguinea', 'Laranja Sanguínea', 'citrus'::public.olfactive_family, 'Cítrico vibrante e sumarento'),
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico doce e ensolarado'),
  ('mel', 'Mel', 'oriental'::public.olfactive_family, 'Gourmand espesso, dourado e doce'),
  ('gardenia', 'Gardênia', 'floral'::public.olfactive_family, 'Floral branco cremoso e sedutor'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral limpo e radiante'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Amadeirado terroso e elegante'),
  ('cera-de-abelha', 'Cera de Abelha', 'oriental'::public.olfactive_family, 'Ceroso quente e balsâmico')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal', b.id, 'Scandal', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2017, 'Um escândalo de feminilidade para mulheres elegantes de dia e desinibidas à noite. Uma overdose de mel cremoso e flor de laranjeira combinada ao patchouli amadeirado, criando um rastro aditivo e gourmand.',
  'jean-paul-gaultier/scandal.2f7781dc.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey'),
  ('fabrice-pellegrin', 'Fabrice Pellegrin'),
  ('christophe-raynaud', 'Christophe Raynaud')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1),
  ('fabrice-pellegrin', 2),
  ('christophe-raynaud', 3)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('laranja-sanguinea', 'top'),
  ('mandarina', 'top'),
  ('mel', 'heart'),
  ('gardenia', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('patchouli', 'base'),
  ('cera-de-abelha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal By Night. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('mel', 'Mel', 'oriental'::public.olfactive_family, 'Denso, licoroso e gourmand'),
  ('laranja-amarga', 'Laranja Amarga', 'citrus'::public.olfactive_family, 'Cítrico tônico e cintilante'),
  ('tuberosa', 'Tuberosa', 'floral'::public.olfactive_family, 'Floral branco narcótico e carnal'),
  ('cereja', 'Cereja', 'fruity'::public.olfactive_family, 'Frutado vermelho doce e licoroso'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico amendoado e envolvente'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Terroso amadeirado encorpado'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Cremoso e aveludado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-by-night', b.id, 'Scandal By Night', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2018, 'A faceta mais audaciosa e noturna de Scandal. A tuberosa inebriante se junta ao mel aveludado e à fava tonka, complementados por notas licorosas de cereja para dominar as pistas com sensualidade magnética.',
  'jean-paul-gaultier/scandal-by-night.fc045e02.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-by-night'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('mel', 'top'),
  ('laranja-amarga', 'top'),
  ('tuberosa', 'heart'),
  ('cereja', 'heart'),
  ('fava-tonka', 'base'),
  ('patchouli', 'base'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-by-night'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal A Paris. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pera', 'Pera', 'fruity'::public.olfactive_family, 'Fresco, frutado e cristalino'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral branco etéreo e sofisticado'),
  ('mel', 'Mel', 'oriental'::public.olfactive_family, 'Doce dourado, macio e aveludado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-a-paris', b.id, 'Scandal A Paris', 'edt'::public.concentration_type,
  'feminine'::public.perfume_gender, 2019, 'Um escândalo arejado e luminoso que desfila pelas avenidas parisienses. A doçura translúcida da pera suculenta abre caminho para um coração elegante de jasmim fresco e um toque aveludado de mel radiante.',
  'jean-paul-gaultier/scandal-a-paris.be9189a1.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-a-paris'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pera', 'top'),
  ('jasmim', 'heart'),
  ('mel', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-a-paris'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal Le Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral branco luminoso e cativante'),
  ('caramelo-salgado', 'Caramelo Salgado', 'oriental'::public.olfactive_family, 'Gourmand doce com contraste salino'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Aveludada, quente e sensual')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-le-parfum', b.id, 'Scandal Le Parfum', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2022, 'Um frasco em vermelho flamejante que quebra todas as regras. O jasmim opulento é abraçado por um caramelo salgado quente e uma baunilha cremosa extraordinária, garantindo um rastro doce, impactante e viciante.',
  'jean-paul-gaultier/scandal-le-parfum.50fa2fde.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('fabrice-pellegrin', 'Fabrice Pellegrin'),
  ('daphne-bugey', 'Daphné Bugey'),
  ('ane-ayo', 'Ane Ayo')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('fabrice-pellegrin', 1),
  ('daphne-bugey', 2),
  ('ane-ayo', 3)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-le-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('jasmim', 'top'),
  ('caramelo-salgado', 'heart'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-le-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Scandal Absolu. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('figo-negro', 'Figo Negro', 'fruity'::public.olfactive_family, 'Frutado escuro denso e suculento'),
  ('tuberosa', 'Tuberosa', 'floral'::public.olfactive_family, 'Floral branco opulento e sedutor'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado cremoso e sofisticado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'scandal-absolu', b.id, 'Scandal Absolu', 'parfum'::public.concentration_type,
  'feminine'::public.perfume_gender, 2024, 'O escândalo atinge o status de mito em ouro puro. A doçura carnuda do figo negro se entrelaça com a intensidade narcótica da tuberosa e a suntuosidade amadeirada do sândalo, resultando em luxo irresistível.',
  'jean-paul-gaultier/scandal-absolu.37217e7e.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey'),
  ('fabrice-pellegrin', 'Fabrice Pellegrin'),
  ('ane-ayo', 'Ane Ayo')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1),
  ('fabrice-pellegrin', 2),
  ('ane-ayo', 3)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'scandal-absolu'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('figo-negro', 'top'),
  ('tuberosa', 'heart'),
  ('sandalo', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'scandal-absolu'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Gaultier Divine. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('brisa-marinha', 'Brisa Marinha', 'aquatic'::public.olfactive_family, 'Salino, iodado e fresco'),
  ('frutas-vermelhas', 'Frutas Vermelhas', 'fruity'::public.olfactive_family, 'Doce suave e cintilante'),
  ('lirio', 'Lírio', 'floral'::public.olfactive_family, 'Floral branco luminoso e majestoso'),
  ('ylang-ylang', 'Ylang Ylang', 'floral'::public.olfactive_family, 'Exótico, solar e cremoso'),
  ('suspiro', 'Suspiro', 'oriental'::public.olfactive_family, 'Doce aéreo açucarado e delicado'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Estruturado, terroso e chique')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'gaultier-divine', b.id, 'Gaultier Divine', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2023, 'Uma celebração da divindade feminina com seu icônico espartilho cônico dourado. Uma fusão inédita e radiante de lírio floral exuberante, suspiro doce gourmand e uma brisa marinha salgada e magnética.',
  'jean-paul-gaultier/gaultier-divine.12825702.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'gaultier-divine'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('brisa-marinha', 'top'),
  ('frutas-vermelhas', 'top'),
  ('lirio', 'heart'),
  ('ylang-ylang', 'heart'),
  ('suspiro', 'base'),
  ('patchouli', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'gaultier-divine'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Gaultier Divine Le Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('notas-solares', 'Notas Solares', 'floral'::public.olfactive_family, 'Quente radiante e luminoso'),
  ('lirio', 'Lírio', 'floral'::public.olfactive_family, 'Floral branco majestoso'),
  ('frangipani', 'Frangipani', 'floral'::public.olfactive_family, 'Floral tropical cremoso e envolvente'),
  ('sal-marinho', 'Sal Marinho', 'aquatic'::public.olfactive_family, 'Mineral cristalino e contrastante'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso dourado e acolhedor'),
  ('benjoim', 'Benjoim', 'oriental'::public.olfactive_family, 'Balsâmico doce e sofisticado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'gaultier-divine-le-parfum', b.id, 'Gaultier Divine Le Parfum', 'parfum'::public.concentration_type,
  'feminine'::public.perfume_gender, 2024, 'A divindade solar em sua plenitude dourada. Notas solares intensas iluminam a flor de frangipani e o lírio sagrado sobre uma cama profunda de âmbar resinoso e benjoim quente banhado por sal marinho.',
  'jean-paul-gaultier/gaultier-divine-le-parfum.85c83471.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'gaultier-divine-le-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('notas-solares', 'top'),
  ('lirio', 'top'),
  ('frangipani', 'heart'),
  ('sal-marinho', 'heart'),
  ('ambar', 'base'),
  ('benjoim', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'gaultier-divine-le-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Fleur du Mâle. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('petitgrain', 'Petitgrain', 'green'::public.olfactive_family, 'Verde cítrico amargo e fresco'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco narcótico e limpo'),
  ('feno', 'Feno', 'green'::public.olfactive_family, 'Seco, herbáceo e reconfortante'),
  ('camomila', 'Camomila', 'aromatic'::public.olfactive_family, 'Herbal doce e relaxante')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'fleur-du-male', b.id, 'Fleur du Mâle', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2007, 'Uma revolução audaciosa que colocou a flor de laranjeira no centro da masculinidade. Apresentado em um busto de porcelana branca impecável, alia o frescor verde do petitgrain à cremosidade floral e feno acolhedor.',
  'jean-paul-gaultier/fleur-du-male.29ce9a12.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'fleur-du-male'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('petitgrain', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('feno', 'base'),
  ('camomila', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'fleur-du-male'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Kokorico. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('folha-de-figo', 'Folha de Figo', 'green'::public.olfactive_family, 'Verde folhoso, fresco e vegetal'),
  ('cacau', 'Cacau', 'oriental'::public.olfactive_family, 'Gourmand escuro, terroso e amargo'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Amadeirado úmido e profundo'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Seco e arquitetônico'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Terroso e elegante')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'kokorico', b.id, 'Kokorico', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2011, 'Um grito viril de conquista contido em um frasco escultural de perfil duplo. Revela o frescor botânico da folha de figo que se aprofunda em uma nota intensa de cacau amargo e patchouli amadeirado sofisticado.',
  'jean-paul-gaultier/kokorico.0ab34ecb.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('olivier-cresp', 'Olivier Cresp'),
  ('annick-menardo', 'Annick Menardo')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('olivier-cresp', 1),
  ('annick-menardo', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'kokorico'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('folha-de-figo', 'top'),
  ('cacau', 'heart'),
  ('patchouli', 'heart'),
  ('cedro', 'base'),
  ('vetiver', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'kokorico'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Ma Dame. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('laranja', 'Laranja', 'citrus'::public.olfactive_family, 'Cítrico doce e energizante'),
  ('roma', 'Romã', 'fruity'::public.olfactive_family, 'Frutado doce, ácido e efervescente'),
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Floral orvalhado e jovial'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Macio, sedoso e acolhedor'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado limpo e linear')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'ma-dame', b.id, 'Ma Dame', 'edt'::public.concentration_type,
  'feminine'::public.perfume_gender, 2008, 'Uma fragrância eletrizante, rebelde e jovial em um bloco de vidro rosa neon. Uma combinação efervescente de groselha e xarope de romã com rosa fresca e almíscar limpo, pura energia pop.',
  'jean-paul-gaultier/ma-dame.d462d393.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'ma-dame'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('laranja', 'top'),
  ('roma', 'heart'),
  ('rosa', 'heart'),
  ('almiscar', 'base'),
  ('cedro', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'ma-dame'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Fragile. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('tangerina', 'Tangerina', 'citrus'::public.olfactive_family, 'Cítrico doce e suculento'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Especiado picante e brilhante'),
  ('tuberosa', 'Tuberosa', 'floral'::public.olfactive_family, 'Floral branco voluptuoso e narcótico'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral opulento e feminino'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso quente e acolhedor'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce envolvente e balsâmico')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'fragile', b.id, 'Fragile', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 1999, 'Eternizado em um mítico globo de neve com partículas de ouro flutuantes. Uma obra-prima exuberante focada na tuberosa narcótica, iluminada por tangerina e gengibre sobre uma rica base de âmbar e baunilha.',
  'jean-paul-gaultier/fragile.1e4ccda9.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'fragile'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('tangerina', 'top'),
  ('gengibre', 'top'),
  ('tuberosa', 'heart'),
  ('jasmim', 'heart'),
  ('ambar', 'base'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'fragile'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Ma Dame Eau de Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pimenta-rosa', 'Pimenta Rosa', 'spicy'::public.olfactive_family, 'Especiado fresco e frutado'),
  ('rosa-negra', 'Rosa Negra', 'floral'::public.olfactive_family, 'Floral aveludado, denso e profundo'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Amadeirado terroso e misterioso'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Sensual, limpo e envolvente'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado seco e elegante')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'ma-dame-eau-de-parfum', b.id, 'Ma Dame Eau de Parfum', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2010, 'A versão black rocker da mulher Ma Dame. A rosa ganha facetas escuras e aveludadas acompanhada por patchouli esfumaçado, almíscar sensual e um toque licoroso de pimenta rosa.',
  'jean-paul-gaultier/ma-dame-eau-de-parfum.6109ad13.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'ma-dame-eau-de-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pimenta-rosa', 'top'),
  ('rosa-negra', 'heart'),
  ('patchouli', 'base'),
  ('almiscar', 'base'),
  ('cedro', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'ma-dame-eau-de-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male On Board. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico cítrico refrescante e cintilante'),
  ('geranio', 'Gerânio', 'floral'::public.olfactive_family, 'Verde floral picante'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Doce amendoado e acolhedor'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Ambarado suave e almiscarado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-on-board', b.id, 'Le Male On Board', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2021, 'Frequentemente buscado como On The Beach, este flanker traz a tripulação para a brisa solar de alto-mar. Combina a bergamota refrescante ao gerânio aromático e à doçura suave da fava tonka e âmbar mineral.',
  'jean-paul-gaultier/le-male-on-board.9754c9c6.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('christophe-raynaud', 'Christophe Raynaud')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('christophe-raynaud', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-on-board'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('bergamota', 'top'),
  ('geranio', 'heart'),
  ('fava-tonka', 'heart'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-on-board'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male Aviator. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Gélido, fresco e revigorante'),
  ('folha-de-violeta', 'Folha de Violeta', 'green'::public.olfactive_family, 'Verde aquoso ozônico e elegante'),
  ('notas-amadeiradas', 'Notas Amadeiradas', 'woody'::public.olfactive_family, 'Amadeirado nobre e estruturado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-aviator', b.id, 'Le Male Aviator', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2020, 'Vestido com uma estampa militar cáqui de aviador, este fougère moderno eleva os sentidos aos céus com uma rajada revigorante de hortelã fresca, folhas de violeta elegantes e uma base amadeirada sutil.',
  'jean-paul-gaultier/le-male-aviator.aff8f287.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('christophe-raynaud', 'Christophe Raynaud')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('christophe-raynaud', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-aviator'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('hortela', 'top'),
  ('folha-de-violeta', 'heart'),
  ('notas-amadeiradas', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-aviator'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male Pride Edition. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('laranja-sanguinea', 'Laranja Sanguínea', 'citrus'::public.olfactive_family, 'Cítrico efervescente e vibrante'),
  ('yuzu', 'Yuzu', 'citrus'::public.olfactive_family, 'Cítrico aromático e exótico'),
  ('neroli', 'Néroli', 'floral'::public.olfactive_family, 'Floral branco limpo e cintilante'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral solar radiante'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Confortável, suave e envolvente'),
  ('madeiras-claras', 'Madeiras Claras', 'woody'::public.olfactive_family, 'Amadeirado leve e moderno')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-pride-edition', b.id, 'Le Male Pride Edition', 'edt'::public.concentration_type,
  'unisex'::public.perfume_gender, 2022, 'Um manifesto olfativo de orgulho e liberdade. Compartilhável e vibrante, abre com uma explosão de néroli fresco e laranjeira cítrica que se fundem a um coração floral limpo sobre almíscar e madeiras claras.',
  'jean-paul-gaultier/le-male-pride-edition.fdde6b65.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('nathalie-cetto', 'Nathalie Cetto'),
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('nathalie-cetto', 1),
  ('quentin-bisch', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-pride-edition'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('laranja-sanguinea', 'top'),
  ('yuzu', 'top'),
  ('neroli', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('almiscar', 'base'),
  ('madeiras-claras', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-pride-edition'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Pride Edition. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('yuzu', 'Yuzu', 'citrus'::public.olfactive_family, 'Cítrico verde e revigorante'),
  ('laranja-sanguinea', 'Laranja Sanguínea', 'citrus'::public.olfactive_family, 'Suculento, doce e vibrante'),
  ('neroli', 'Néroli', 'floral'::public.olfactive_family, 'Floral alaranjado refinado'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Branco floral e solar'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Macio e sedoso'),
  ('madeiras-brancas', 'Madeiras Brancas', 'woody'::public.olfactive_family, 'Seco, arejado e elegante')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-pride-edition', b.id, 'Classique Pride Edition', 'edt'::public.concentration_type,
  'unisex'::public.perfume_gender, 2022, 'Celebrando todas as cores do amor no espartilho com as listras do arco-íris. Uma composição compartilhável e radiante com néroli solar, yuzu luminoso e uma infusão almiscarada reconfortante.',
  'jean-paul-gaultier/classique-pride-edition.db52d320.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('nathalie-cetto', 'Nathalie Cetto'),
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('nathalie-cetto', 1),
  ('quentin-bisch', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-pride-edition'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('yuzu', 'top'),
  ('laranja-sanguinea', 'top'),
  ('neroli', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('almiscar', 'base'),
  ('madeiras-brancas', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-pride-edition'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male Essence de Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado picante e quente'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco e límpido'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Aromático limpo e contemporâneo'),
  ('couro', 'Couro', 'oriental'::public.olfactive_family, 'Aveludado, rico e esfumado'),
  ('costus', 'Costus', 'musky'::public.olfactive_family, 'Animálico sensual e macio'),
  ('madeira-de-ambar', 'Madeira de Âmbar', 'woody'::public.olfactive_family, 'Amadeirado quente e persistente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-essence-de-parfum', b.id, 'Le Male Essence de Parfum', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2016, 'Com ombros mais largos e cintura esguia, esta reinterpretação moderna traz uma abertura picante de cardamomo unida a uma nota distinta de couro aveludado e madeiras nobres, envoltas em lavanda contemporânea.',
  'jean-paul-gaultier/le-male-essence-de-parfum.cc138a3b.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-essence-de-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cardamomo', 'top'),
  ('bergamota', 'top'),
  ('lavanda', 'heart'),
  ('couro', 'heart'),
  ('costus', 'base'),
  ('madeira-de-ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-essence-de-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Essence de Parfum. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Especiado picante e efervescente'),
  ('tangerina', 'Tangerina', 'citrus'::public.olfactive_family, 'Doce suculento e cítrico'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco doce e sedutor'),
  ('jasmim-sambac', 'Jasmim Sambac', 'floral'::public.olfactive_family, 'Floral opulento e feminino'),
  ('chantilly', 'Chantilly', 'oriental'::public.olfactive_family, 'Gourmand leitoso e adocicado'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Quente cremosa e envolvente'),
  ('benjoim', 'Benjoim', 'oriental'::public.olfactive_family, 'Resinoso balsâmico ambarado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-essence-de-parfum', b.id, 'Classique Essence de Parfum', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2016, 'Com silhueta mais geométrica e curvilínea, abre com gengibre e tangerina picantes que revelam um coração cremoso de flor de laranjeira e jasmim, adocicado por chantilly delicioso e baunilha amadeirada.',
  'jean-paul-gaultier/classique-essence-de-parfum.780789e8.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-essence-de-parfum'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('gengibre', 'top'),
  ('tangerina', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('jasmim-sambac', 'heart'),
  ('chantilly', 'base'),
  ('baunilha', 'base'),
  ('benjoim', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-essence-de-parfum'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male In The Navy. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Refrescante, herbal e mentolado'),
  ('notas-aquaticas', 'Notas Aquáticas', 'aquatic'::public.olfactive_family, 'Oceânico fresco e salgado'),
  ('notas-oceanicas', 'Notas Oceânicas', 'aquatic'::public.olfactive_family, 'Brisa marinha iodada'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce aveludado e reconfortante'),
  ('ambar-cinzento', 'Âmbar Cinzento', 'oriental'::public.olfactive_family, 'Mineral quente e sensual')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-in-the-navy', b.id, 'Le Male In The Navy', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2018, 'O marinheiro mais audacioso dos mares. Uma fragrância revigorante e marinha que combina a frescura gélida da hortelã a notas oceânicas salgadas, contrastadas pela base clássica de baunilha e âmbar sensual.',
  'jean-paul-gaultier/le-male-in-the-navy.ba3f3040.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('quentin-bisch', 'Quentin Bisch'),
  ('christophe-raynaud', 'Christophe Raynaud')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('quentin-bisch', 1),
  ('christophe-raynaud', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-in-the-navy'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('hortela', 'top'),
  ('notas-aquaticas', 'top'),
  ('notas-oceanicas', 'heart'),
  ('baunilha', 'base'),
  ('ambar-cinzento', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-in-the-navy'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Cabaret. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Picante estimulante e fresco'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco voluptuoso e doce'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce sedutor e aveludado'),
  ('ambar-cinzento', 'Âmbar Cinzento', 'oriental'::public.olfactive_family, 'Mineral quente e sofisticado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-cabaret', b.id, 'Classique Cabaret', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2019, 'Vestido com um espartilho vermelho brilhante com lantejoulas digno dos palcos parisienses. Uma homenagem ao glamour com flor de laranjeira caramelizada, toque picante de gengibre e uma base gourmand de baunilha e âmbar cinzento.',
  'jean-paul-gaultier/classique-cabaret.1f234ab0.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('fabrice-pellegrin', 'Fabrice Pellegrin')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('fabrice-pellegrin', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-cabaret'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('gengibre', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('baunilha', 'base'),
  ('ambar-cinzento', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-cabaret'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Pin Up. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Especiado picante e alegre'),
  ('cidra', 'Cidra', 'citrus'::public.olfactive_family, 'Cítrico aromático e zesty'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco luminoso'),
  ('marshmallow', 'Marshmallow', 'oriental'::public.olfactive_family, 'Gourmand fofo, doce e açucarado'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Cremoso, suave e acolhedor'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso macio e fixador')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-pin-up', b.id, 'Classique Pin Up', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2020, 'Uma estrela cor-de-rosa cintilante que desfila com charme retrô. Abre com o contraste cítrico do cidra e gengibre, revelando um coração irresistível de flor de laranjeira banhada em marshmallow fofo e baunilha suave.',
  'jean-paul-gaultier/classique-pin-up.75452344.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('fabrice-pellegrin', 'Fabrice Pellegrin')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('fabrice-pellegrin', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-pin-up'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('gengibre', 'top'),
  ('cidra', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('marshmallow', 'heart'),
  ('baunilha', 'base'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-pin-up'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Airlines. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('rum', 'Rum', 'oriental'::public.olfactive_family, 'Licoroso quente e sofisticado'),
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Floral clássico elegante'),
  ('orquidea-baunilha', 'Orquídea Baunilha', 'floral'::public.olfactive_family, 'Floral doce e cremoso'),
  ('narciso', 'Narciso', 'floral'::public.olfactive_family, 'Floral branco opulento'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce envolvente e profundo'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Resinoso e aveludado'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Amendoado doce balsâmico')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-airlines', b.id, 'Classique Airlines', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2020, 'Edição especial comemorativa que veste o icônico espartilho para uma viagem de primeira classe. Traz a assinatura inebriante do clássico com rum aveludado, rosa sedosa, orquídea baunilha e notas resinosas envolventes.',
  'jean-paul-gaultier/classique-airlines.5517ae76.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-airlines'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('rum', 'top'),
  ('rosa', 'top'),
  ('orquidea-baunilha', 'heart'),
  ('narciso', 'heart'),
  ('baunilha', 'base'),
  ('ambar', 'base'),
  ('fava-tonka', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-airlines'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Le Male Airlines. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('hortela', 'Hortelã', 'aromatic'::public.olfactive_family, 'Fresco cortante e mentolado'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado picante aromático'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Floral aromático clássico'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral fresco e suave'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce aveludada e quente'),
  ('fava-tonka', 'Fava Tonka', 'oriental'::public.olfactive_family, 'Balsâmico amendoado refinado'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado nobre e estruturado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'le-male-airlines', b.id, 'Le Male Airlines', 'edt'::public.concentration_type,
  'masculine'::public.perfume_gender, 2020, 'Pronto para decolar em estilo com o uniforme icônico de comandante de bordo. A fórmula clássica e consagrada de Le Male em frasco de colecionador, com menta gelada, lavanda aromática e base sensual de baunilha.',
  'jean-paul-gaultier/le-male-airlines.86754679.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'le-male-airlines'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('hortela', 'top'),
  ('cardamomo', 'top'),
  ('lavanda', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('baunilha', 'base'),
  ('fava-tonka', 'base'),
  ('cedro', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'le-male-airlines'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Wonder Woman. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('sorvete-de-limao', 'Sorvete de Limão', 'citrus'::public.olfactive_family, 'Cítrico gelado e adocicado'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Picante e efervescente'),
  ('cana-de-acucar', 'Cana-de-Açúcar', 'oriental'::public.olfactive_family, 'Doce açucarado e fresco'),
  ('flor-de-tiare', 'Flor de Tiaré', 'floral'::public.olfactive_family, 'Floral tropical e solar'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral branco delicado'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Cremoso doce e aconchegante'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Sedoso e envolvente')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-wonder-woman', b.id, 'Classique Wonder Woman', 'edt'::public.concentration_type,
  'feminine'::public.perfume_gender, 2017, 'Uma homenagem heroica e solar à Mulher-Maravilha. Um coquetel energizante de sorvete de limão, suco de cana-de-açúcar e gengibre, que se funde à flor de tiaré tropical e uma base macia de baunilha e almíscar.',
  'jean-paul-gaultier/classique-wonder-woman.ef7b63d6.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-wonder-woman'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('sorvete-de-limao', 'top'),
  ('gengibre', 'top'),
  ('cana-de-acucar', 'top'),
  ('flor-de-tiare', 'heart'),
  ('jasmim', 'heart'),
  ('baunilha', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-wonder-woman'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique I Love Gaultier. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('sorvete-de-limao', 'Sorvete de Limão', 'citrus'::public.olfactive_family, 'Gélido cítrico e açucarado'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Picante refrescante'),
  ('flor-de-tiare', 'Flor de Tiaré', 'floral'::public.olfactive_family, 'Exótico cremoso e tropical'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral solar e limpo'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce macio e sedutor'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Sensual e aveludado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-i-love-gaultier', b.id, 'Classique I Love Gaultier', 'edt'::public.concentration_type,
  'feminine'::public.perfume_gender, 2017, 'Edição limitada de colecionador estampada com a declaração I Love Gaultier. Destaca a vivacidade do sorbet de limão e gengibre fundidos à exuberância da flor de tiaré e flor de laranjeira sobre baunilha.',
  'jean-paul-gaultier/classique-i-love-gaultier.ef7b63d6.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('daphne-bugey', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-i-love-gaultier'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('sorvete-de-limao', 'top'),
  ('gengibre', 'top'),
  ('flor-de-tiare', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('baunilha', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-i-love-gaultier'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier Classique Intense. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('flor-de-tiare', 'Flor de Tiaré', 'floral'::public.olfactive_family, 'Floral solar rico e exótico'),
  ('roma', 'Romã', 'fruity'::public.olfactive_family, 'Frutado doce e suculento'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco radiante e opulento'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral sedutor e aveludado'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Doce dourado e profundo'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Amadeirado elegante e estruturado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'classique-intense', b.id, 'Classique Intense', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2014, 'Uma metamorfose dourada do clássico, vestida inteiramente em ouro metálico. A flor de tiare solar e a romã brilhante unem-se a uma overdose de flor de laranjeira e baunilha rica e ambarada.',
  'jean-paul-gaultier/classique-intense.64fc2ad9.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('francis-kurkdjian', 'Francis Kurkdjian')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('francis-kurkdjian', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'classique-intense'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('flor-de-tiare', 'top'),
  ('roma', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('jasmim', 'heart'),
  ('baunilha', 'base'),
  ('patchouli', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'classique-intense'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Jean Paul Gaultier So Scandal!. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('jean-paul-gaultier', 'Jean Paul Gaultier')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('framboesa', 'Framboesa', 'fruity'::public.olfactive_family, 'Frutado vermelho suculento e doce'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Floral branco radiante e cintilante'),
  ('tuberosa', 'Tuberosa', 'floral'::public.olfactive_family, 'Floral opulento carnal e sedutor'),
  ('jasmim-sambac', 'Jasmim Sambac', 'floral'::public.olfactive_family, 'Floral rico feminino e envolvente'),
  ('leite', 'Leite', 'oriental'::public.olfactive_family, 'Lactônico macio, aveludado e cremoso')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'so-scandal', b.id, 'So Scandal!', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2020, 'Um escândalo floral frutado com silhueta plissada couture em tom framboesa profundo. Uma explosão desinibida de framboesa suculenta e leite aveludado que envolvem uma trindade inebriante de tuberosa, jasmim e flor de laranjeira.',
  'jean-paul-gaultier/so-scandal.2f46e05c.webp'
from public.brands b where b.slug = 'jean-paul-gaultier'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('fabrice-pellegrin', 'Fabrice Pellegrin'),
  ('daphne-bugey', 'Daphné Bugey')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('fabrice-pellegrin', 1),
  ('daphne-bugey', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'so-scandal'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('framboesa', 'top'),
  ('flor-de-laranjeira', 'heart'),
  ('tuberosa', 'heart'),
  ('jasmim-sambac', 'heart'),
  ('leite', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'so-scandal'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
