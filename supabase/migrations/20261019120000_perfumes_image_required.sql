-- Catálogo só com foto oficial: `perfumes.image_path` passa a ser NOT NULL.
-- Antes disso, os perfumes sem foto (stubs) são apagados. A coleção, o diário e as reviews
-- referenciam `perfumes` com ON DELETE RESTRICT: se algum perfume sem foto ainda tiver dado de
-- usuário, a migration FALHA (e nada é apagado) em vez de destruir esse dado. Nesse caso, decida o
-- destino dos dados (ou suba a foto do perfume) e rode de novo.

do $$
declare
  blocked text;
begin
  select string_agg(p.slug, ', ' order by p.slug) into blocked
  from public.perfumes p
  where p.image_path is null
    and (
      exists (select 1 from public.collection_items c where c.perfume_id = p.id)
      or exists (select 1 from public.daily_perfumes d where d.perfume_id = p.id)
      or exists (select 1 from public.perfume_reviews r where r.perfume_id = p.id)
    );
  if blocked is not null then
    raise exception 'perfumes sem foto ainda têm dados de usuário: %', blocked;
  end if;
end $$;

-- perfume_notes e perfume_perfumers caem em cascata
delete from public.perfumes where image_path is null;

alter table public.perfumes
  alter column image_path set not null;
