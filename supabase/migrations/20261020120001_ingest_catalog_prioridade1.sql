-- Gerado por scripts/ingest-catalog.mjs: 8 perfumes. Revise antes de aplicar.

-- Gerado por scripts/ingest-perfume.mjs: Granado Nostalgia. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('granado', 'Granado')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pimenta-rosa', 'Pimenta-rosa', 'spicy'::public.olfactive_family, 'Baga rosada, picante e levemente doce. Dá um brilho efervescente à abertura.'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco, com um toque floral e levemente amargo. Abre o perfume com luz e elegância.'),
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico doce e suculento, mais macio que o limão. Traz alegria e frescor à saída.'),
  ('lirio', 'Lírio', 'floral'::public.olfactive_family, 'Flor branca, cremosa e levemente atalcada. Dá um coração elegante e luminoso.'),
  ('flor-de-laranjeira', 'Flor de laranjeira', 'floral'::public.olfactive_family, 'Floral branco, solar e adocicado, com um fundo de mel. Lembra jardim de cidade pequena.'),
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Pétala macia, romântica e levemente frutada. É o clássico coração floral.'),
  ('cashmeran', 'Cashmeran', 'woody'::public.olfactive_family, 'Madeira macia, aveludada e levemente especiada. Dá conforto, como um suéter de lã.'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Acorde macio e limpo que lembra pele aquecida. Prolonga o perfume e deixa um rastro suave.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'nostalgia', b.id, 'Nostalgia', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2022, 'Criação elegante que homenageia a história centenária da Granado, unindo pimenta rosa e notas florais a uma base confortável de cashmeran e âmbar.',
  'granado/nostalgia.webp'
from public.brands b where b.slug = 'granado'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('jasmine-liu', 'Jasmine Liu')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('jasmine-liu', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'nostalgia'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pimenta-rosa', 'top'),
  ('bergamota', 'top'),
  ('mandarina', 'top'),
  ('lirio', 'heart'),
  ('flor-de-laranjeira', 'heart'),
  ('rosa', 'heart'),
  ('cashmeran', 'base'),
  ('ambar', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'nostalgia'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Granado Époque Tropical. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('granado', 'Granado')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('caju', 'Caju', 'fruity'::public.olfactive_family, 'Fruta tropical, suculenta e levemente adstringente. Traz um frescor solar e brasileiro.'),
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico doce e suculento, mais macio que o limão. Traz alegria e frescor à saída.'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiaria fresca, verde e levemente canforada. Dá um picante limpo e sofisticado.'),
  ('magnolia', 'Magnólia', 'floral'::public.olfactive_family, 'Flor cremosa com nuance cítrica, elegante e luminosa. Lembra jardim ao entardecer.'),
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Pétala macia, romântica e levemente frutada. É o clássico coração floral.'),
  ('geranio', 'Gerânio', 'floral'::public.olfactive_family, 'Folha rosada, verde e levemente mentolada. Dá frescor aos corações florais.'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira cremosa, suave e levemente láctea. É um fundo macio que abraça a pele.'),
  ('fava-tonka', 'Fava tonka', 'oriental'::public.olfactive_family, 'Semente doce, com baunilha, amêndoa e feno. Cheira a conforto e calor.'),
  ('madeira-guaiaco', 'Madeira guaiaco', 'woody'::public.olfactive_family, 'Madeira escura, defumada e levemente adocicada. Lembra chá e fumaça de lareira.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'epoque-tropical', b.id, 'Époque Tropical', 'edp'::public.concentration_type,
  'unisex'::public.perfume_gender, 2021, 'Uma viagem sensorial pelo Rio de Janeiro da Belle Époque, com o frescor inusitado do caju e cardamomo sobre o calor nobre da fava tonka e sândalo.',
  'granado/epoque-tropical.webp'
from public.brands b where b.slug = 'granado'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('guillaume-flavigny', 'Guillaume Flavigny')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('guillaume-flavigny', 1)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'epoque-tropical'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('caju', 'top'),
  ('mandarina', 'top'),
  ('cardamomo', 'top'),
  ('magnolia', 'heart'),
  ('rosa', 'heart'),
  ('geranio', 'heart'),
  ('sandalo', 'base'),
  ('fava-tonka', 'base'),
  ('madeira-guaiaco', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'epoque-tropical'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Granado Carioca. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('granado', 'Granado')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco, com um toque floral e levemente amargo. Abre o perfume com luz e elegância.'),
  ('lima', 'Lima', 'citrus'::public.olfactive_family, 'Cítrico verde, ácido e vibrante. Dá um frescor imediato de limonada.'),
  ('fresia', 'Frésia', 'floral'::public.olfactive_family, 'Flor delicada e fresca, com ar de pera e cítrico. Leve e translúcida.'),
  ('lirio-do-vale', 'Lírio-do-vale', 'floral'::public.olfactive_family, 'Floral verde e aquoso, limpo e delicado. Evoca primavera e roupa lavada.'),
  ('jasmim', 'Jasmim', 'floral'::public.olfactive_family, 'Floral branco, intenso e levemente indólico. Sensual e embriagante.'),
  ('flor-de-violeta', 'Flor de violeta', 'floral'::public.olfactive_family, 'Pétala empoada, doce e levemente verde. Dá uma suavidade romântica.'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Acorde macio e limpo que lembra pele aquecida. Prolonga o perfume e deixa um rastro suave.'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira cremosa, suave e levemente láctea. É um fundo macio que abraça a pele.'),
  ('fava-tonka', 'Fava tonka', 'oriental'::public.olfactive_family, 'Semente doce, com baunilha, amêndoa e feno. Cheira a conforto e calor.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'carioca', b.id, 'Carioca', 'edt'::public.concentration_type,
  'unisex'::public.perfume_gender, 2015, 'Homenagem solar à cidade do Rio de Janeiro, mesclando o frescor da bergamota e lima com a suavidade da flor de violeta e o calor do sândalo.',
  'granado/carioca.webp'
from public.brands b where b.slug = 'granado'
on conflict (slug) do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('bergamota', 'top'),
  ('lima', 'top'),
  ('fresia', 'top'),
  ('lirio-do-vale', 'heart'),
  ('jasmim', 'heart'),
  ('flor-de-violeta', 'heart'),
  ('almiscar', 'base'),
  ('sandalo', 'base'),
  ('fava-tonka', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'carioca'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Natura Essencial Oud Masculino. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('natura', 'Natura')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco, com um toque floral e levemente amargo. Abre o perfume com luz e elegância.'),
  ('cardamomo', 'Cardamomo', 'spicy'::public.olfactive_family, 'Especiaria fresca, verde e levemente canforada. Dá um picante limpo e sofisticado.'),
  ('acafrao', 'Açafrão', 'spicy'::public.olfactive_family, 'Especiaria dourada, amadeirada e levemente couro. Dá riqueza ao topo.'),
  ('elemi', 'Elemi', 'citrus'::public.olfactive_family, 'Resina de aroma cítrico, fresco e levemente pimentado. Dá vivacidade ao topo.'),
  ('canela', 'Canela', 'spicy'::public.olfactive_family, 'Casca doce, quente e picante. Aquece e adoça o coração do perfume.'),
  ('praline', 'Praliné', 'oriental'::public.olfactive_family, 'Doçura de avelã caramelizada, gulosa e cremosa. Dá um coração de confeitaria.'),
  ('geranio', 'Gerânio', 'floral'::public.olfactive_family, 'Folha rosada, verde e levemente mentolada. Dá frescor aos corações florais.'),
  ('cypriol', 'Cypriol', 'woody'::public.olfactive_family, 'Raiz de aroma terroso, defumado e levemente picante. Dá profundidade escura.'),
  ('oud', 'Oud', 'woody'::public.olfactive_family, 'Madeira escura e resinosa, intensa, fumê e levemente animálica. É a joia da perfumaria árabe.'),
  ('copaiba', 'Copaíba', 'woody'::public.olfactive_family, 'Resina amazônica de aroma amadeirado e balsâmico, quase medicinal. Traz um calor discreto.'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Madeira seca, limpa e lembra lápis recém-apontado. Dá estrutura e um ar sóbrio.'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira cremosa, suave e levemente láctea. É um fundo macio que abraça a pele.'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Folha terrosa, úmida e escura, com um toque achocolatado. Marca o fundo com personalidade.'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'essencial-oud-masculino', b.id, 'Essencial Oud Masculino', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2017, 'O encontro memorável do precioso óleo de Oud (o ouro líquido da perfumaria) com a exuberância e calor da copaíba da biodiversidade amazônica.',
  'natura/essencial-oud-masculino.webp'
from public.brands b where b.slug = 'natura'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('veronica-kato', 'Verônica Kato'),
  ('pierre-constantin-gueros', 'Pierre-Constantin Guéros')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('veronica-kato', 1),
  ('pierre-constantin-gueros', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'essencial-oud-masculino'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('bergamota', 'top'),
  ('cardamomo', 'top'),
  ('acafrao', 'top'),
  ('elemi', 'top'),
  ('canela', 'heart'),
  ('praline', 'heart'),
  ('geranio', 'heart'),
  ('cypriol', 'heart'),
  ('oud', 'base'),
  ('copaiba', 'base'),
  ('cedro', 'base'),
  ('sandalo', 'base'),
  ('patchouli', 'base'),
  ('ambar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'essencial-oud-masculino'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: Natura Homem Cor.Agio. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('natura', 'Natura')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('pimenta-preta', 'Pimenta-preta', 'spicy'::public.olfactive_family, 'Grão seco, quente e mordaz. Dá energia e a sensação de especiaria recém-moída.'),
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco, com um toque floral e levemente amargo. Abre o perfume com luz e elegância.'),
  ('noz-moscada', 'Noz-moscada', 'spicy'::public.olfactive_family, 'Semente quente, adocicada e levemente amadeirada. Aquece o perfume.'),
  ('canela', 'Canela', 'spicy'::public.olfactive_family, 'Casca doce, quente e picante. Aquece e adoça o coração do perfume.'),
  ('couro', 'Couro', 'woody'::public.olfactive_family, 'Aroma de couro curtido, defumado e levemente picante. Dá um ar noturno e marcante.'),
  ('lavandin', 'Lavandin', 'aromatic'::public.olfactive_family, 'Parente mais forte da lavanda, herbal e canforado. Marca os perfumes masculinos clássicos.'),
  ('rosa', 'Rosa', 'floral'::public.olfactive_family, 'Pétala macia, romântica e levemente frutada. É o clássico coração floral.'),
  ('angelica', 'Angélica', 'green'::public.olfactive_family, 'Raiz verde, terrosa e levemente almiscarada. Dá uma elegância herbal.'),
  ('copaiba', 'Copaíba', 'woody'::public.olfactive_family, 'Resina amazônica de aroma amadeirado e balsâmico, quase medicinal. Traz um calor discreto.'),
  ('cumaru', 'Cumaru', 'oriental'::public.olfactive_family, 'Semente de aroma doce, com feno e amêndoa. É a fava amazônica, quente e envolvente.'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Madeira seca, limpa e lembra lápis recém-apontado. Dá estrutura e um ar sóbrio.'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.'),
  ('cistus-labdano', 'Cistus lábdano', 'oriental'::public.olfactive_family, 'Resina escura de âmbar e couro, levemente animálica. Dá um fundo quente e profundo.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'homem-cor-agio', b.id, 'Homem Cor.Agio', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2018, 'O contraste arrebatador entre o calor da copaíba e do cumaru com o arrepio picante e metálico da pimenta preta e especiarias frias.',
  'natura/homem-cor-agio.webp'
from public.brands b where b.slug = 'natura'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('veronica-kato', 'Verônica Kato'),
  ('jean-christophe-herault', 'Jean-Christophe Hérault')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('veronica-kato', 1),
  ('jean-christophe-herault', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'homem-cor-agio'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('pimenta-preta', 'top'),
  ('bergamota', 'top'),
  ('noz-moscada', 'top'),
  ('canela', 'top'),
  ('couro', 'heart'),
  ('lavandin', 'heart'),
  ('rosa', 'heart'),
  ('angelica', 'heart'),
  ('copaiba', 'base'),
  ('cumaru', 'base'),
  ('cedro', 'base'),
  ('ambar', 'base'),
  ('cistus-labdano', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'homem-cor-agio'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: O Boticário Elysée Tradicional. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('o-boticario', 'O Boticário')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('mandarina', 'Mandarina', 'citrus'::public.olfactive_family, 'Cítrico doce e suculento, mais macio que o limão. Traz alegria e frescor à saída.'),
  ('fresia', 'Frésia', 'floral'::public.olfactive_family, 'Flor delicada e fresca, com ar de pera e cítrico. Leve e translúcida.'),
  ('pimenta-rosa', 'Pimenta-rosa', 'spicy'::public.olfactive_family, 'Baga rosada, picante e levemente doce. Dá um brilho efervescente à abertura.'),
  ('framboesa', 'Framboesa', 'fruity'::public.olfactive_family, 'Fruta vermelha, doce e levemente ácida. Traz suculência ao topo.'),
  ('rosa-damascena', 'Rosa damascena', 'floral'::public.olfactive_family, 'Rosa de pétalas densas, com mel e especiarias. Clássica, rica e envolvente.'),
  ('peonia', 'Peônia', 'floral'::public.olfactive_family, 'Flor macia, rosada e levemente aquosa. Delicada e feminina.'),
  ('ylang-ylang', 'Ylang-ylang', 'floral'::public.olfactive_family, 'Flor amarela cremosa, tropical e levemente frutada. Dá corpo sensual ao coração.'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Folha terrosa, úmida e escura, com um toque achocolatado. Marca o fundo com personalidade.'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira cremosa, suave e levemente láctea. É um fundo macio que abraça a pele.'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Madeira seca, limpa e lembra lápis recém-apontado. Dá estrutura e um ar sóbrio.'),
  ('baunilha', 'Baunilha', 'oriental'::public.olfactive_family, 'Cheiro cremoso, doce e reconfortante de fava e creme. Dá um fundo acolhedor.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'elysee-tradicional', b.id, 'Elysée Tradicional', 'edp'::public.concentration_type,
  'feminine'::public.perfume_gender, 2015, 'Joia da perfumaria feminina nacional criada com a técnica Orpur, combinando o frescor da mandarina à sofisticação da rosa damascena e do patchouli.',
  'o-boticario/elysee-tradicional.webp'
from public.brands b where b.slug = 'o-boticario'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('jacques-huclier', 'Jacques Huclier'),
  ('hernan-figoli', 'Hernan Fígoli')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('jacques-huclier', 1),
  ('hernan-figoli', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'elysee-tradicional'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('mandarina', 'top'),
  ('fresia', 'top'),
  ('pimenta-rosa', 'top'),
  ('framboesa', 'top'),
  ('rosa-damascena', 'heart'),
  ('peonia', 'heart'),
  ('ylang-ylang', 'heart'),
  ('patchouli', 'base'),
  ('sandalo', 'base'),
  ('ambar', 'base'),
  ('cedro', 'base'),
  ('baunilha', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'elysee-tradicional'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

-- Gerado por scripts/ingest-perfume.mjs: O Boticário Zaad Santal. Revise antes de aplicar.

insert into public.brands (slug, name) values
  ('o-boticario', 'O Boticário')
on conflict (slug) do nothing;

insert into public.notes (slug, name, family, description) values
  ('bergamota', 'Bergamota', 'citrus'::public.olfactive_family, 'Cítrico fresco, com um toque floral e levemente amargo. Abre o perfume com luz e elegância.'),
  ('pimenta-sichuan', 'Pimenta sichuan', 'spicy'::public.olfactive_family, 'Baga cítrica, picante e levemente formigante. Dá um topo vibrante.'),
  ('gengibre', 'Gengibre', 'spicy'::public.olfactive_family, 'Raiz fresca, picante e cítrica. Dá energia e brilho à abertura.'),
  ('noz-moscada', 'Noz-moscada', 'spicy'::public.olfactive_family, 'Semente quente, adocicada e levemente amadeirada. Aquece o perfume.'),
  ('sandalo', 'Sândalo', 'woody'::public.olfactive_family, 'Madeira cremosa, suave e levemente láctea. É um fundo macio que abraça a pele.'),
  ('lavanda', 'Lavanda', 'aromatic'::public.olfactive_family, 'Flor aromática limpa, herbal e levemente doce. É o cheiro clássico de frescor e de barbearia.'),
  ('acorde-de-whisky', 'Acorde de whisky', 'oriental'::public.olfactive_family, 'Efeito de destilado envelhecido, adocicado, defumado e amadeirado. Dá um ar licoroso.'),
  ('folha-de-violeta', 'Folha de violeta', 'green'::public.olfactive_family, 'Folha verde, aquosa e levemente metálica. Dá um frescor elegante.'),
  ('cedro', 'Cedro', 'woody'::public.olfactive_family, 'Madeira seca, limpa e lembra lápis recém-apontado. Dá estrutura e um ar sóbrio.'),
  ('patchouli', 'Patchouli', 'woody'::public.olfactive_family, 'Folha terrosa, úmida e escura, com um toque achocolatado. Marca o fundo com personalidade.'),
  ('vetiver', 'Vetiver', 'woody'::public.olfactive_family, 'Raiz de capim aromático, terrosa, fresca e levemente defumada. Dá elegância e muita fixação.'),
  ('ambar', 'Âmbar', 'oriental'::public.olfactive_family, 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.'),
  ('almiscar', 'Almíscar', 'musky'::public.olfactive_family, 'Acorde macio e limpo que lembra pele aquecida. Prolonga o perfume e deixa um rastro suave.')
on conflict (slug) do nothing;

insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, description, image_path)
select 'zaad-santal', b.id, 'Zaad Santal', 'edp'::public.concentration_type,
  'masculine'::public.perfume_gender, 2021, 'A sofisticação do sândalo da Nova Caledônia contrastada com o toque licoroso do whisky e especiarias frias como pimenta sichuan e gengibre.',
  'o-boticario/zaad-santal.webp'
from public.brands b where b.slug = 'o-boticario'
on conflict (slug) do nothing;

insert into public.perfumers (slug, name) values
  ('christian-alori', 'Christian Alori'),
  ('natasha-cote', 'Natasha Côté')
on conflict (slug) do nothing;

insert into public.perfume_perfumers (perfume_id, perfumer_id, position)
select p.id, pf.id, v.position::smallint
from (values
  ('christian-alori', 1),
  ('natasha-cote', 2)
) as v (perfumer_slug, position)
join public.perfumes p on p.slug = 'zaad-santal'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

insert into public.perfume_notes (perfume_id, note_id, position)
select p.id, n.id, v.position::public.note_position
from (values
  ('bergamota', 'top'),
  ('pimenta-sichuan', 'top'),
  ('gengibre', 'top'),
  ('noz-moscada', 'top'),
  ('sandalo', 'heart'),
  ('lavanda', 'heart'),
  ('acorde-de-whisky', 'heart'),
  ('folha-de-violeta', 'heart'),
  ('cedro', 'base'),
  ('patchouli', 'base'),
  ('vetiver', 'base'),
  ('ambar', 'base'),
  ('almiscar', 'base')
) as v (note_slug, position)
join public.perfumes p on p.slug = 'zaad-santal'
join public.notes n on n.slug = v.note_slug
on conflict do nothing;

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
  'avatim/seleto.webp'
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
join public.perfumes p on p.slug = 'seleto'
join public.perfumers pf on pf.slug = v.perfumer_slug
on conflict do nothing;

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
