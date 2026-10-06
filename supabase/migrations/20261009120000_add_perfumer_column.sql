-- Perfumista (nariz) responsável pela fragrância. Opcional: nem todo perfume tem a informação.
-- Leitura e escrita seguem as policies já existentes de `perfumes` (público lê, admin escreve).

alter table public.perfumes
  add column perfumer text;

alter table public.perfumes
  add constraint perfumes_perfumer_not_blank
    check (perfumer is null or char_length(btrim(perfumer)) between 1 and 150);
