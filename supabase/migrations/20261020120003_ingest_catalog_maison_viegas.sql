-- Gerado por scripts/ingest-catalog.mjs: 8 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Heaven. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cidra', 'Cidra', 'citrus'::public.olfactive_family, 'Cítrico efervescente e revigorante'),
  ('bergamota-da-calabria', 'Bergamota da Calábria', 'citrus'::public.olfactive_family, 'Cítrico luminoso e refinado'),
  ('laranja-siciliana', 'Laranja Siciliana', 'citrus'::public.olfactive_family, 'Cítrico suculento e doce'),
  ('neroli-tunisiano', 'Néroli Tunisiano', 'floral'::public.olfactive_family, 'Floral branco limpo e radiante'),
  ('gengibre-da-nigeria', 'Gengibre da Nigéria', 'spicy'::public.olfactive_family, 'Especiado picante e refrescante'),
  ('canela-do-ceilao', 'Canela do Ceilão', 'spicy'::public.olfactive_family, 'Especiado quente e aromático'),
  ('cha-preto-chines', 'Chá Preto Chinês', 'aromatic'::public.olfactive_family, 'Herbal sofisticado e elegante'),
  ('ambroxan', 'Ambroxan', 'musky'::public.olfactive_family, 'Ambarado limpo, moderno e aveludado'),
  ('olibano', 'Olíbano', 'oriental'::public.olfactive_family, 'Resinoso místico e envolvente'),
  ('madeira-guaiac', 'Madeira Guaiac', 'woody'::public.olfactive_family, 'Amadeirado profundo e levemente defumado')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'heaven', b.id, 'Heaven', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2021, 'Inspirado em Imagination, Heaven é uma criação luminosa e revigorante que equilibra o frescor cítrico refinado com a sofisticação aromática do chá preto e a sensualidade do ambroxan.',
  'maison-viegas/heaven.4b0bc883.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cidra', 'top'),
  ('bergamota-da-calabria', 'top'),
  ('laranja-siciliana', 'top'),
  ('neroli-tunisiano', 'heart'),
  ('gengibre-da-nigeria', 'heart'),
  ('canela-do-ceilao', 'heart'),
  ('cha-preto-chines', 'base'),
  ('ambroxan', 'base'),
  ('olibano', 'base'),
  ('madeira-guaiac', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'heaven'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Elite Pour Homme. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cha-darjeeling', 'Chá Darjeeling', 'aromatic'::public.olfactive_family, 'Herbal elegante e sutil'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Especiado picante e revigorante'),
  ('cha-preto', 'Chá Preto', 'aromatic'::public.olfactive_family, 'Chá aromático e refinado'),
  ('madeira-guaiac', 'Madeira Guaiac', 'woody'::public.olfactive_family, 'Amadeirado denso e exótico'),
  ('almiscar-branco', 'Almíscar Branco', 'musky'::public.olfactive_family, 'Almiscarado limpo e confortável'),
  ('ambreta', 'Ambreta', 'musky'::public.olfactive_family, 'Nuance aveludada e sensual')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'elite-pour-homme', b.id, 'Elite Pour Homme', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2025, 'Inspirado em Bvlgari Pour Homme EDP, traduz o conceito de luxo discreto através de uma saída fresca de chá Darjeeling e especiarias, repousando sobre madeiras e almíscar suave.',
  'maison-viegas/elite-pour-homme.ccd77109.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cha-darjeeling', 'top'),
  ('gengibre', 'top'),
  ('cha-preto', 'heart'),
  ('madeira-guaiac', 'heart'),
  ('almiscar-branco', 'base'),
  ('ambreta', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'elite-pour-homme'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Cuir. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiado nobre e refinado'),
  ('acafrao', 'Açafrão', 'spicy'::public.olfactive_family, 'Especiado seco com faceta de couro'),
  ('couro-preto', 'Couro Preto', 'oriental'::public.olfactive_family, 'Acorde animal elegante e imponente'),
  ('jasmim-sambac', 'Jasmim Sambac', 'floral'::public.olfactive_family, 'Floral branco que amacia o couro'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Terroso escuro e amadeirado'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Quente e resinoso')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'cuir', b.id, 'Cuir', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, null, 'O prestígio e o arrojo do couro nobre artesanal, envolto pelo calor aromático do açafrão, toques florais de jasmim da noite e musgo úmido.',
  'maison-viegas/cuir.5f03135a.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('cardamomo', 'top'),
  ('acafrao', 'top'),
  ('couro-preto', 'heart'),
  ('jasmim-sambac', 'heart'),
  ('patchouli', 'base'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'cuir'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Épices. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pimenta-preta', 'Pimenta Preta', 'spicy'::public.olfactive_family, 'Seca, picante e aromática'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Cítrico especiado revigorante'),
  ('canela', 'Canela', 'spicy'::public.olfactive_family, 'Doce, calorosa e envolvente'),
  ('cravo-da-india', 'Cravo-da-Índia', 'spicy'::public.olfactive_family, 'Aromático picante tradicional'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado firme e elegante'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Seco e terroso')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'epices', b.id, 'Épices', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, null, 'Uma jornada eletrizante pela rota das especiarias, unindo o frescor pungente de pimentas nobres com a calidez da canela e madeiras nobres.',
  'maison-viegas/epices.ece52465.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pimenta-preta', 'top'),
  ('gengibre', 'top'),
  ('canela', 'heart'),
  ('cravo-da-india', 'heart'),
  ('cedro', 'base'),
  ('vetiver', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'epices'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Fleur. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('lichia', 'Lichia', 'fruity'::public.olfactive_family, 'Frutado aquoso, doce e exótico'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico claro e cintilante'),
  ('peonia', 'Peônia', 'floral'::public.olfactive_family, 'Floral orvalhado e romântico'),
  ('flor-de-laranjeira', 'Flor de Laranjeira', 'floral'::public.olfactive_family, 'Branca, luminosa e sedutora'),
  ('musgo-de-carvalho', 'Musgo de Carvalho', 'woody'::public.olfactive_family, 'Toque terroso que equilibra as flores'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Aveludado e suave')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'fleur', b.id, 'Fleur', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2021, 'Inspirado em Fleur Narcotique, é um floral hipnotizante e arejado, enriquecido com a lichia suculenta, flor de laranjeira luminosa e peônia radiante.',
  'maison-viegas/fleur.cb9f86f0.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('lichia', 'top'),
  ('bergamota', 'top'),
  ('peonia', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('musgo-de-carvalho', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'fleur'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Rose. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('groselha-preta', 'Groselha Preta', 'fruity'::public.olfactive_family, 'Fruta vermelha ácida e suculenta'),
  ('pessego', 'Pêssego', 'fruity'::public.olfactive_family, 'Frutado aveludado doce'),
  ('rosa-de-maio', 'Rosa de Maio', 'floral'::public.olfactive_family, 'Floral puro, fresco e aveludado'),
  ('rosa-turca', 'Rosa Turca', 'floral'::public.olfactive_family, 'Floral rico, profundo e sensual'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Amadeirado estruturado e elegante'),
  ('almiscar-branco', 'Almíscar Branco', 'musky'::public.olfactive_family, 'Limpo, sedoso e duradouro')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'rose', b.id, 'Rose', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2025, 'Um tributo moderno à rainha das flores, trazendo a elegância cristalina da rosa de maio entrelaçada com notas frescas e fundo de cedro nobre.',
  'maison-viegas/rose.bbd32cfc.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('groselha-preta', 'top'),
  ('pessego', 'top'),
  ('rosa-de-maio', 'heart'),
  ('rosa-turca', 'heart'),
  ('cedro', 'base'),
  ('almiscar-branco', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'rose'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Jasmin. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico doce e alegre'),
  ('pera', 'Pera', 'fruity'::public.olfactive_family, 'Suculenta e orvalhada'),
  ('jasmim-sambac', 'Jasmim Sambac', 'floral'::public.olfactive_family, 'Floral branco opulento e solar'),
  ('jasmim-grandiflorum', 'Jasmim Grandiflorum', 'floral'::public.olfactive_family, 'Floral nobre e aveludado'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Amadeirado sedoso e aconchegante'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Macio e duradouro')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'jasmin', b.id, 'Jasmin', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, null, 'A sedução inebriante do jasmim colhido ao entardecer, revelando facetas solares, cremosas e sensuais sobre um leito macio de sândalo.',
  'maison-viegas/jasmin.64490903.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('mandarina', 'top'),
  ('pera', 'top'),
  ('jasmim-sambac', 'heart'),
  ('jasmim-grandiflorum', 'heart'),
  ('sandalo', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'jasmin'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Maison Viegas Iris. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('maison-viegas', 'Maison Viegas')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('folhas-de-laranjeira', 'Folhas de Laranjeira', 'green'::public.olfactive_family, 'Verde sutil e refrescante'),
  ('flor-de-limao', 'Flor de Limão', 'citrus'::public.olfactive_family, 'Cítrico floral delicado'),
  ('iris-florentina', 'Íris Florentina', 'floral'::public.olfactive_family, 'Atalcado refinado, terroso e nobre'),
  ('violeta', 'Violeta', 'floral'::public.olfactive_family, 'Floral aveludado nostálgico'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Amadeirado terroso e limpo'),
  ('almiscar-branco', 'Almíscar Branco', 'musky'::public.olfactive_family, 'Suave, etéreo e confortável')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'iris', b.id, 'Iris', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, null, 'A nobreza atalcada da raiz de íris em sua expressão máxima de elegância, entrelaçada com notas sutis de madeira ambarada e toques verdes.',
  'maison-viegas/iris.bbd32cfc.webp'
from public.brands b where b.slug = 'maison-viegas'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('folhas-de-laranjeira', 'top'),
  ('flor-de-limao', 'top'),
  ('iris-florentina', 'heart'),
  ('violeta', 'heart'),
  ('vetiver', 'base'),
  ('almiscar-branco', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'iris'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;
