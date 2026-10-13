-- Fase 17A (RN11): formato e volume dos perfumes em "Tenho" (frasco, decant ou amostra).
-- Opcionais: marcar "Tenho" continua a um toque e "não informado" é só a ausência dos dois campos.
-- A policy "collection: owner update" já cobre as colunas novas; nenhuma policy nova.
--
-- RN11: formato e volume só existem com status = 'owned'. O banco garante pelos CHECKs; o app, ao
-- gravar "Quero", envia format e volume_ml nulos (a troca owned -> wanted limpa os campos).

create type public.collection_format as enum ('bottle', 'decant', 'sample');

alter table public.collection_items
  add column format public.collection_format,
  add column volume_ml numeric(5, 1);

alter table public.collection_items
  add constraint collection_items_format_owned_only
    check (status = 'owned' or (format is null and volume_ml is null)),
  add constraint collection_items_volume_valid
    check (volume_ml is null or (format is not null and volume_ml > 0 and volume_ml <= 1000));
