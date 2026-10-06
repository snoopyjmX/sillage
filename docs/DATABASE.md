# Banco de dados

Fonte: `docs/PRODUCT.md` (Seções 5 e 6). Tudo vive em `supabase/migrations/` e é reproduzível com `npm run db:reset`. Testes: `supabase/tests/database/` (`npm run db:test`).

## Migrations

| Arquivo                                 | Conteúdo                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `20261005120000_schema.sql`             | Extensões, enums, tabelas, constraints e índices                                        |
| `20261005120100_functions_triggers.sql` | `set_updated_at`, `set_search_name`, `handle_new_user`, `is_admin`, `set_daily_perfume` |
| `20261005120200_rls_policies.sql`       | RLS nas 8 tabelas, policies, `revoke`/`grant` e a view `perfume_review_stats`           |
| `20261005120300_storage.sql`            | Bucket `perfume-images` e suas policies                                                 |
| `20261005120400_search_perfumes.sql`    | Função `search_perfumes` (busca, filtros, ordenação e paginação do catálogo)            |
| `20261006120000_public_reviews.sql`     | Policy `reviews: owner delete` e a view `perfume_reviews_public` (Fase 9)               |
| `20261007120000_similar_perfumes.sql`   | Função `get_similar_perfumes` (similaridade por notas em comum, Fase 10 / RN09)         |
| `20261008120000_perfume_prices.sql`     | Colunas `lowest_price_cents`, `store_name` e `store_url` em `perfumes` (melhor preço)   |

## Extensões e enums

- `unaccent` e `pg_trgm`, no schema `extensions`.
- `collection_status` (`owned`, `wanted`), `note_position` (`top`, `heart`, `base`), `perfume_gender` (`masculine`, `feminine`, `unisex`), `concentration_type` (`parfum`, `extrait`, `edp`, `edt`, `edc`, `other`), `olfactive_family` (`citrus`, `floral`, `woody`, `green`, `aquatic`, `oriental`, `spicy`, `fruity`, `aromatic`, `musky`).

## Tabelas

| Tabela             | Garante                                                                                                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`         | `id` → `auth.users` com `CASCADE`; `timezone` padrão `America/Sao_Paulo` (RN06). Criada pelo trigger de cadastro.                                                                                                                         |
| `brands`           | `slug` único; `search_name` mantido por trigger.                                                                                                                                                                                          |
| `perfumes`         | `brand_id` `RESTRICT`; `slug` único; `release_year` entre 1700 e ano atual + 1. Oferta opcional: `lowest_price_cents` (centavos, `> 0`), `store_name` e `store_url` (só `http(s)`); as policies de `perfumes` já cobrem as colunas novas. |
| `notes`            | `slug` único; `family` é `olfactive_family`.                                                                                                                                                                                              |
| `perfume_notes`    | PK `(perfume_id, note_id, position)`; FKs `CASCADE`.                                                                                                                                                                                      |
| `collection_items` | `UNIQUE(user_id, perfume_id)` (RN02); `perfume_id` `RESTRICT`.                                                                                                                                                                            |
| `daily_perfumes`   | `UNIQUE(user_id, date)` (RN06); `perfume_id` `RESTRICT`.                                                                                                                                                                                  |
| `perfume_reviews`  | `UNIQUE(user_id, perfume_id)` (RN04); ratings `smallint` entre 1 e 5 (RN05); `comment` com até 1000 caracteres.                                                                                                                           |

O `CHECK` de `release_year` usa `now()` (não imutável). O Postgres aceita, mas um dump/restore de dados antigos pode precisar revalidá-lo.

## Índices

FKs: `perfumes(brand_id)`, `perfume_notes(note_id, position)`, `collection_items(user_id, status)`, `daily_perfumes(user_id, date desc)`, `perfume_reviews(perfume_id)`. Busca: GIN trigram (`extensions.gin_trgm_ops`) em `brands.search_name` e `perfumes.search_name`. Ordenação: `perfumes(release_year desc nulls last)`.

## Funções e triggers

| Função / trigger          | O que faz                                                                                                                                                                                                | Regra |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `set_updated_at()`        | Atualiza `updated_at` antes de UPDATE. Comum (não `security definer`), `search_path` vazio.                                                                                                              | —     |
| `set_search_name()`       | `lower(unaccent(name))` em `brands` e `perfumes`, antes de INSERT e de UPDATE de `name`.                                                                                                                 | Busca |
| `handle_new_user()`       | Após INSERT em `auth.users`, cria o perfil. Nome: `name`, depois `display_name`, senão `Membro`. Fuso: o dos metadados se existir em `pg_timezone_names`, senão `America/Sao_Paulo`. `security definer`. | RN01  |
| `is_admin()`              | `true` se `app_metadata.role = 'admin'` no JWT.                                                                                                                                                          | RN07  |
| `set_daily_perfume(uuid)` | Calcula a data no fuso do perfil e faz upsert em `daily_perfumes`. Único caminho de escrita. Só `authenticated` executa.                                                                                 | RN06  |

## Policies

"Dono" é `(select auth.uid()) = user_id` (em `profiles`, `= id`).

| Tabela                                         | SELECT                  | INSERT                           | UPDATE       | DELETE                        |
| ---------------------------------------------- | ----------------------- | -------------------------------- | ------------ | ----------------------------- |
| `brands`, `perfumes`, `notes`, `perfume_notes` | `anon`, `authenticated` | `is_admin()`                     | `is_admin()` | `is_admin()`                  |
| `profiles`                                     | dono                    | nenhuma (só o trigger)           | dono         | nenhuma (só cascade)          |
| `collection_items`                             | dono                    | dono                             | dono         | dono                          |
| `daily_perfumes`                               | dono                    | nenhuma (só `set_daily_perfume`) | nenhuma      | nenhuma (só cascade da conta) |
| `perfume_reviews`                              | dono                    | dono e RN03                      | dono         | dono                          |

- **RN03:** a policy `reviews: insert if authorized` exige `owned` agora ou histórico em `daily_perfumes`.
- **UPDATE de avaliação:** a policy só confere o dono, então a migration restringe o privilégio de UPDATE às colunas `longevity_rating`, `projection_rating` e `comment`. Assim `perfume_id` e `user_id` não mudam depois de criados (sem isso, o dono driblaria a RN03). Consequência para o front: o `reviewService` faz `update` por `id` ou `insert`, nunca um `upsert` que reescreva `perfume_id`.
- **`daily_perfumes`:** `INSERT` e `UPDATE` revogados de `authenticated`; sem policy de DELETE.

## View `perfume_review_stats` (RN08)

`perfume_id, review_count, avg_longevity, avg_projection`, com `security_invoker = false` para ignorar a RLS de `perfume_reviews`. Expõe só agregados, nunca `user_id` nem `comment`. `anon` e `authenticated` têm `SELECT`.

## View `perfume_reviews_public` (Fase 9)

`id, perfume_id, longevity_rating, projection_rating, comment, created_at, updated_at, author_name`, com `security_invoker = false`. Junta `perfume_reviews` e `profiles` e expõe só o nome de exibição do autor: nunca `user_id`, e-mail, fuso ou avatar. `anon` e `authenticated` têm `SELECT`; a view não aceita escrita. A tabela segue com RLS de dono.

## Storage

Bucket público `perfume-images`: `SELECT` para `anon` e `authenticated`; `INSERT`, `UPDATE` e `DELETE` só com `is_admin()`. Não há bucket de avatars no MVP. O Storage bloqueia `DELETE` direto em `storage.objects` por trigger; remoções devem passar pela API do Storage.

## Seed

`supabase/seed.sql` é o catálogo real de `docs/CATALOGO_REAL.md`, idempotente (`on conflict do nothing`): 6 marcas (Granado, Natura, O Boticário, Avatim, Al Wataniah e Phytoderm), 20 perfumes, 41 notas (compartilhadas em uma linha só) e 126 ligações de pirâmide (topo, coração e fundo em todos os perfumes). Notas, concentrações e descrições vêm de fontes públicas e podem divergir das oficiais; `release_year` e `image_path` ficam `NULL` (ano não confirmado; as fotos entram por `npm run images`). Preço, loja e link são dados de teste, realistas porém fictícios; o perfume Black (Phytoderm) fica sem oferta de propósito. Os testes E2E dependem desta topologia (ex.: bergamota só no topo, 6 perfumes).

## `search_perfumes`

Assinatura e semântica na Seção 8 do `PRODUCT.md`. `SECURITY INVOKER`, `STABLE`, `search_path` vazio; `EXECUTE` só para `anon` e `authenticated`. Sem SQL dinâmico.

| Parâmetro / regra | Comportamento                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `p_sort`          | `name_asc`, `name_desc`, `newest`, `top_rated`, `relevance`. Outro valor levanta erro `22023`. `relevance` sem texto vira `name_asc`; `null` vale `relevance`.                                                                                                                                                                                                                                             |
| `p_limit`         | Padrão 24. Fora de 1 a 100 levanta `22023` (não é cortado em silêncio).                                                                                                                                                                                                                                                                                                                                    |
| `p_offset`        | Padrão 0. Negativo levanta `22023`.                                                                                                                                                                                                                                                                                                                                                                        |
| Texto             | `lower(unaccent(trim(p_query)))` contra `search_name` do perfume ou da marca. Vazio = sem filtro. 3+ caracteres: trigram (`%`, limiar 0,3 do pg_trgm; tolera erro de digitação) **ou** trecho literal (`LIKE '%termo%'`; acha "vetiver" em um nome longo, onde o trigram sozinho não acha). 1 a 2 caracteres: prefixo com `LIKE`. Em todos os `LIKE`, barra invertida, `%` e `_` do usuário são escapados. |
| Filtros           | `AND` entre grupos. Notas em `AND` (slug repetido conta uma vez); `p_note_position` vale para todas. Marca, concentração e gênero em `OR`. Família: ao menos uma nota de qualquer família listada. Array vazio = sem filtro.                                                                                                                                                                               |
| Ano               | Faixa inclusiva. Perfume sem `release_year` só é excluído se algum limite foi informado.                                                                                                                                                                                                                                                                                                                   |
| Ordenação         | `search_name` (nome sem acento e minúsculo) nos dois `name_*`; `newest` = ano desc, nulos por último; `top_rated` = (`avg_longevity` + `avg_projection`) / 2 desc, depois `review_count`, sem avaliação por último; `relevance` = maior similaridade. Desempate final por `slug`, em todas.                                                                                                                |
| Retorno           | `id, slug, name, brand_name, brand_slug, concentration, gender, release_year, image_path, families, total_count`. `families` vem das notas, sem repetição, na ordem do enum. Nada de `perfume_reviews` além do agregado usado na ordenação.                                                                                                                                                                |

**Limitação: offset além do fim.** `total_count` é calculado junto com as linhas (`count(*) over ()`). Se `p_offset` passar do último resultado, a função devolve **zero linhas** e, portanto, nenhum `total_count`. O front não sabe o total nesse caso: ao receber página vazia com `page > 1`, deve voltar para a página 1.

**Tipos.** `src/types/database.types.ts` (`npm run db:types`) marca `image_path` e `release_year` como não nulos no retorno da função porque o gerador não enxerga nulabilidade em funções; no front, trate os dois como `| null`.

**Medições (somente local, dados falsos).** Com `npm run db:fake` (5.000 perfumes, 300 marcas, 30.000 ligações de notas, 6.000 avaliações), `EXPLAIN ANALYZE` da chamada completa, em faixas de execuções repetidas: texto 17 a 24 ms, prefixo de 2 letras 11 a 17 ms, nota + posição 3 a 9 ms, família 9 a 17 ms, `top_rated` 22 a 30 ms, página 50 de 24 itens 14 a 18 ms. A variação entre execuções é de alguns ms; são medições de uma máquina de desenvolvimento, não metas. O índice trigram é utilizável (com `enable_seqscan = off` a parte de texto cai de cerca de 9,5 para cerca de 5 ms), mas com 5.000 linhas o planejador escolhe varredura sequencial por conta própria. Um `OR` entre `perfumes.search_name` e `brands.search_name` depois do join impedia o uso do índice; por isso a função une duas buscas, cada uma indexável. Reavalie se o catálogo crescer uma ordem de grandeza.

## Dados de volume (só desenvolvimento)

`supabase/dev/fake-perfumes.sql` gera dados falsos com slug iniciando em `fake-` (e usuários `fake-*@fake.local`). `npm run db:fake` cria e `npm run db:fake:clear` apaga. Roda via `supabase db query --local`. Nunca entra em `seed.sql`, migrations nem nos testes do CI.

## Fora desta fase

A Edge Function de exclusão de conta.

## `get_similar_perfumes` (RN09)

`get_similar_perfumes(target_id uuid, limit_count int default 6)`. `SECURITY INVOKER`, `STABLE`, `search_path` vazio; `EXECUTE` só para `anon` e `authenticated`.

- Similaridade = número de notas **distintas** em comum com o alvo (a mesma nota em duas posições conta uma vez). Ordem: mais notas em comum, depois nome, depois `id`.
- Exclui o próprio `target_id` e perfumes sem nenhuma nota em comum. Alvo inexistente devolve lista vazia.
- `limit_count` fora de 1 a 24 levanta `22023`.
- Retorno: `id, name, brand_id, slug, image_path` (contrato da interface) mais `brand_name, brand_slug, concentration, gender, release_year, families, common_notes`, para o `PerfumeCard` não precisar de segunda consulta.
- Testes: `supabase/tests/database/14_similar_perfumes.test.sql`.
