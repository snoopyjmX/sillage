-- Descrição curta de cada nota (1 a 240 caracteres), mostrada no painel da nota na pirâmide.
-- A RLS não muda: leitura pública, escrita só admin.
alter table public.notes
  add column description text check (description is null or char_length(description) between 1 and 240);

update public.notes set description = 'Fruta cítrica italiana de casca fina. Abre o perfume com um frescor luminoso, ligeiramente amargo e floral.' where slug = 'bergamota';
update public.notes set description = 'Limão de casca perfumada e acidez viva. Dá uma abertura limpa, vibrante e bem ensolarada.' where slug = 'limao-siciliano';
update public.notes set description = 'Cítrico mais doce e suave que o limão. Cheira a casca de tangerina recém-aberta, alegre e macia.' where slug = 'mandarina';
update public.notes set description = 'Fruta suculenta e translúcida, com um verde delicado. Traz uma doçura leve e refrescante.' where slug = 'pera';
update public.notes set description = 'Mistura de fruta madura, folha verde e um toque lácteo. Cheira a doçura natural e a sombra de figueira.' where slug = 'figo';
update public.notes set description = 'Fruta vermelha de acidez suculenta e um fundo levemente adstringente. Dá brilho e um tom ácido-doce.' where slug = 'roma';
update public.notes set description = 'Fruta tropical de doçura azeda e um toque de casca verde. Lembra o Brasil, solar e suculento.' where slug = 'caju';
update public.notes set description = 'Cheiro cremoso e adocicado de polpa e leite de coco. Evoca praia, protetor solar e calor.' where slug = 'coco';
update public.notes set description = 'Flor branca do Taiti, cremosa e levemente coco. Cheira a pele ao sol e a óleo monoï.' where slug = 'flor-de-tiare';
update public.notes set description = 'Flor branca intensa, doce e um pouco animálica. É o coração clássico de muitos perfumes florais.' where slug = 'jasmim';
update public.notes set description = 'A flor mais tradicional da perfumaria: aveludada, levemente frutada e romântica.' where slug = 'rosa';
update public.notes set description = 'Flor branca fresca, cerosa e elegante, com um toque verde. Cheira a pétala fria e limpa.' where slug = 'lirio';
update public.notes set description = 'Especiaria fresca, aromática e levemente cítrica. Dá uma abertura seca com um brilho verde.' where slug = 'cardamomo';
update public.notes set description = 'Especiaria seca e picante que faz cócegas no nariz. Traz energia e um ar mais masculino.' where slug = 'pimenta-preta';
update public.notes set description = 'Baga rosada de picância suave, com um toque frutado e resinoso. Aquece sem pesar.' where slug = 'pimenta-rosa';
update public.notes set description = 'Especiaria quente, levemente amadeirada e adocicada. Dá profundidade e aconchego ao coração.' where slug = 'noz-moscada';
update public.notes set description = 'Casca aromática de calor doce e envolvente. Lembra bolo, café e noites frias.' where slug = 'canela';
update public.notes set description = 'Doçura cremosa e reconfortante, vinda da vagem da orquídea. É a base mais gulosa e acolhedora.' where slug = 'baunilha';
update public.notes set description = 'Acorde quente, resinoso e levemente adocicado. Dá um fundo sensual que se espalha devagar.' where slug = 'ambar';
update public.notes set description = 'Cheiro de chocolate amargo, seco e envolvente. Traz uma gula elegante, sem excesso de açúcar.' where slug = 'cacau';
update public.notes set description = 'Grão torrado, escuro e levemente amargo. Dá um calor aromático e viciante.' where slug = 'cafe';
update public.notes set description = 'Doçura suave de marzipã, com um toque de leite e de madeira clara. Cheira a confeitaria fina.' where slug = 'amendoa';
update public.notes set description = 'Resina antiga, balsâmica e levemente amarga. Cheira a incenso e a ambientes de pedra.' where slug = 'mirra';
update public.notes set description = 'Açúcar queimado, cremoso e quente. Dá uma doçura de sobremesa que fica por horas.' where slug = 'caramelo';
update public.notes set description = 'Madeira cremosa, suave e levemente láctea. É um fundo macio que abraça a pele.' where slug = 'sandalo';
update public.notes set description = 'Madeira seca, limpa e lembra lápis recém-apontado. Dá estrutura e um ar sóbrio.' where slug = 'cedro';
update public.notes set description = 'Raiz de capim aromático, terrosa, fresca e levemente defumada. Dá elegância e muita fixação.' where slug = 'vetiver';
update public.notes set description = 'Folha terrosa, úmida e escura, com um toque achocolatado. Marca o fundo com personalidade.' where slug = 'patchouli';
update public.notes set description = 'Resina amazônica de aroma amadeirado e balsâmico, quase medicinal. Traz um calor discreto.' where slug = 'copaiba';
update public.notes set description = 'Raiz amazônica de aroma amadeirado, terroso e levemente cítrico. Assinatura da perfumaria brasileira.' where slug = 'priprioca';
update public.notes set description = 'Madeira sagrada sul-americana, doce, cítrica e resinosa. Cheira a incenso suave.' where slug = 'palo-santo';
update public.notes set description = 'Resina da Amazônia, fresca e levemente cítrica, com um fundo de incenso. Limpa e aromática.' where slug = 'breu-branco';
update public.notes set description = 'Madeira escura e resinosa, intensa, fumê e levemente animálica. É a joia da perfumaria árabe.' where slug = 'oud';
update public.notes set description = 'Folha seca, adocicada e levemente defumada. Lembra mel, feno e salões antigos.' where slug = 'tabaco';
update public.notes set description = 'Aroma de couro curtido, defumado e levemente picante. Dá um ar noturno e marcante.' where slug = 'couro';
update public.notes set description = 'Líquen de floresta úmida: verde, terroso e marinho. É a base clássica dos perfumes chipre.' where slug = 'musgo-de-carvalho';
update public.notes set description = 'Erva aromática de folha prateada, seca e herbal. Traz um frescor verde, limpo e levemente canforado.' where slug = 'salvia';
update public.notes set description = 'Erva fresca e resinosa, com um toque canforado. Dá uma abertura energizante e de jardim.' where slug = 'alecrim';
update public.notes set description = 'Flor aromática limpa, herbal e levemente doce. É o cheiro clássico de frescor e de barbearia.' where slug = 'lavanda';
update public.notes set description = 'Imitação do aroma de vinho tinto: frutado, fermentado e levemente amadeirado. Dá um ar sofisticado.' where slug = 'acorde-vinico';
update public.notes set description = 'Acorde macio e limpo que lembra pele aquecida. Prolonga o perfume e deixa um rastro suave.' where slug = 'almiscar';
