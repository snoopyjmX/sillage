-- Fase 9: avaliações da comunidade.
-- A tabela perfume_reviews continua privada (RLS de dono). A leitura pública passa por uma view
-- com colunas seguras (nunca user_id nem e-mail) e o dono ganha o direito de apagar a própria.

-- Dono apaga a própria avaliação (a RN03 vale só para criar; apagar nunca dá acesso a nada)
create policy "reviews: owner delete" on public.perfume_reviews
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Avaliações públicas: autoria só pelo nome de exibição; `id` serve para o app reconhecer a própria
create view public.perfume_reviews_public
with (security_invoker = false) as
select r.id,
       r.perfume_id,
       r.longevity_rating,
       r.projection_rating,
       r.comment,
       r.created_at,
       r.updated_at,
       p.display_name as author_name
from public.perfume_reviews r
join public.profiles p on p.id = r.user_id;

grant select on public.perfume_reviews_public to anon, authenticated;
