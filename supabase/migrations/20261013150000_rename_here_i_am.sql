-- Phytoderm "Black" passa a se chamar "Here I Am".
-- O trigger set_search_name recalcula search_name; image_path não muda (o arquivo no bucket é o mesmo).
update public.perfumes
set name = 'Here I Am', slug = 'here-i-am'
where slug = 'black';
