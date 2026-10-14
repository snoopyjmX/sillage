-- Os perfumistas agora vivem em `perfumers` / `perfume_perfumers` (migration anterior, que já fez
-- o backfill). A coluna de texto sai junto com o check `perfumes_perfumer_not_blank`.

alter table public.perfumes
  drop column perfumer;
