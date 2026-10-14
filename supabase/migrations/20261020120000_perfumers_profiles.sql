-- Perfil dos nove perfumistas do projeto (bio em pt-BR e país), com upsert por `slug`.
-- As bios trazem só fatos amplamente documentados; onde não há fonte à mão a bio fica curta e
-- neutra. As ligações em `perfume_perfumers` NÃO entram aqui: só com a autoria confirmada na
-- página da marca ou da casa de fragrância (migration de ingestão do perfume).

insert into public.perfumers (slug, name, country, bio) values
  ('veronica-kato', 'Verônica Kato', 'Brasil',
   'Perfumista brasileira, criadora de fragrâncias para a perfumaria nacional.'),
  ('eurico-mazzini', 'Eurico Mazzini', 'Brasil',
   'Perfumista brasileiro, criador de fragrâncias para a perfumaria nacional.'),
  ('adilson-rato', 'Adilson Rato', 'Brasil',
   'Perfumista brasileiro, criador de fragrâncias para a perfumaria nacional.'),
  ('alberto-morillas', 'Alberto Morillas', 'Espanha',
   'Perfumista nascido na Espanha e radicado na Suíça, conhecido por fragrâncias de grande sucesso comercial como CK One e Acqua di Giò, de Giorgio Armani.'),
  ('francis-kurkdjian', 'Francis Kurkdjian', 'França',
   'Perfumista francês, autor de Le Mâle, de Jean Paul Gaultier, fundador da Maison Francis Kurkdjian e diretor criativo da Dior Parfums.'),
  ('dominique-ropion', 'Dominique Ropion', 'França',
   'Perfumista francês, criador de fragrâncias como Portrait of a Lady e Carnal Flower, da Editions de Parfums Frédéric Malle.'),
  ('jean-claude-ellena', 'Jean-Claude Ellena', 'França',
   'Perfumista francês, nascido em Grasse, e perfumista exclusivo da Hermès por mais de uma década, autor de Terre d''Hermès e Un Jardin en Méditerranée.'),
  ('quentin-bisch', 'Quentin Bisch', 'França',
   'Perfumista francês da nova geração da perfumaria.'),
  ('isaac-sinclair', 'Isaac Sinclair', 'Nova Zelândia',
   'Perfumista neozelandês, criador de fragrâncias para marcas internacionais.')
on conflict (slug) do update
  set name = excluded.name,
      country = excluded.country,
      bio = excluded.bio;
