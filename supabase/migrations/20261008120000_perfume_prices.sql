-- Comparador de preços (catálogo real): melhor preço encontrado e a loja que o oferece.
-- Preço em centavos (integer) para não haver erro de ponto flutuante.
-- Leitura e escrita seguem as policies já existentes de `perfumes` (público lê, admin escreve).

alter table public.perfumes
  add column lowest_price_cents integer,
  add column store_name text,
  add column store_url text;

alter table public.perfumes
  add constraint perfumes_lowest_price_cents_positive
    check (lowest_price_cents is null or lowest_price_cents > 0),
  -- só http(s): o link é exibido como <a href> no front
  add constraint perfumes_store_url_http
    check (store_url is null or store_url ~* '^https?://[^\s]+$'),
  add constraint perfumes_store_name_not_blank
    check (store_name is null or char_length(btrim(store_name)) between 1 and 80);
