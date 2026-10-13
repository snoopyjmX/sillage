-- store_url passa a apontar para a página real do produto (localizada nas lojas; Natura e O Boticário
-- respondem 403 a robôs, então a conferência final é no navegador). Perfume sem página confiável fica sem
-- oferta (preço, loja e link nulos): o BestPrice some sozinho. lowest_price_cents segue como dado de TESTE.

update public.perfumes set store_name = 'Granado', store_url = 'https://www.granado.com.br/granado/eau-de-toilette-bossa-100ml' where slug = 'bossa';
update public.perfumes set store_name = 'Granado', store_url = 'https://www.granado.com.br/granado/perfume-boemia-75ml-granado' where slug = 'boemia';
update public.perfumes set lowest_price_cents = null, store_name = null, store_url = null where slug = 'folha-imperial';
update public.perfumes set store_name = 'Natura', store_url = 'https://www.natura.com.br/p/desodorante-perfume-essencial-unico-masculino-90-ml/NATBRA-103348' where slug = 'essencial-unico-masculino';
update public.perfumes set store_name = 'Natura', store_url = 'https://www.natura.com.br/p/deo-parfum-essencial-mirra-masculino-100-ml/NATBRA-27263' where slug = 'essencial-mirra';
update public.perfumes set store_name = 'Natura', store_url = 'https://www.natura.com.br/p/homem-sagaz-da-natura/NATBRA-81951' where slug = 'homem-sagaz';
update public.perfumes set store_name = 'Natura', store_url = 'https://www.natura.com.br/p/eau-de-parfum-ekos-alma-50-ml/NATBRA-148479' where slug = 'ekos-alma';
update public.perfumes set store_name = 'O Boticário', store_url = 'https://www.boticario.com.br/produto/malbec-signature-eau-de-parfum-90ml' where slug = 'malbec-signature';
update public.perfumes set lowest_price_cents = null, store_name = null, store_url = null where slug = 'malbec-black';
update public.perfumes set store_name = 'O Boticário', store_url = 'https://www.boticario.com.br/lily/le-parfum' where slug = 'lily-le-parfum';
update public.perfumes set store_name = 'O Boticário', store_url = 'https://www.boticario.com.br/egeo-vanilla-vibe-desodorante-colonia-90ml/' where slug = 'egeo-vanilla-vibe';
update public.perfumes set store_name = 'Avatim', store_url = 'https://www.avatim.com.br/produto/deo-parfum-gigi-100ml-398' where slug = 'gigi';
update public.perfumes set store_name = 'Avatim', store_url = 'https://www.avatim.com.br/produto/deo-colonia-bonissimo-100ml-48' where slug = 'bonissimo';
update public.perfumes set store_name = 'Avatim', store_url = 'https://www.avatim.com.br/produto/deo-colonia-apoena-100ml-relicario-393' where slug = 'apoena';
update public.perfumes set store_name = 'Drogaria São Paulo', store_url = 'https://www.drogariasaopaulo.com.br/al-wataniah-sabah-al-ward-eau-de-parfum-perfume-feminino-17659k9243v201e1/p' where slug = 'sabah-al-ward';
update public.perfumes set lowest_price_cents = null, store_name = null, store_url = null where slug = 'qimmah';
update public.perfumes set lowest_price_cents = null, store_name = null, store_url = null where slug = 'kayaan-classic';
update public.perfumes set store_name = 'Drogasil', store_url = 'https://www.drogasil.com.br/al-wataniah-attar-al-wesal-masculino-eau-de-parfum-100ml-773216.html' where slug = 'attar-al-wesal';
update public.perfumes set store_name = 'Drogasil', store_url = 'https://www.drogasil.com.br/phytoderm-perfume-glamour-100ml-963561.html' where slug = 'glamour';
