# Banco de dados

Fonte: `docs/PRODUCT.md` (Seções 5 e 6). Tudo vive em `supabase/migrations/` e é reproduzível com `npm run db:reset`. Testes: `supabase/tests/database/` (`npm run db:test`).

## Migrations

| Arquivo                                 | Conteúdo                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `20261005120000_schema.sql`             | Extensões, enums, tabelas, constraints e índices                                        |
| `20261005120100_functions_triggers.sql` | `set_updated_at`, `set_search_name`, `handle_new_user`, `is_admin`, `set_daily_perfume` |
| `20261005120200_rls_policies.sql`       | RLS nas 8 tabelas, policies, `revoke`/`grant` e a view `perfume_review_stats`           |
| `20261005120300_storage.sql`            | Bucket `perfume-images` e suas policies                                                 |

## Extensões e enums

- `unaccent` e `pg_trgm`, no schema `extensions`.
- `collection_status` (`owned`, `wanted`), `note_position` (`top`, `heart`, `base`), `perfume_gender` (`masculine`, `feminine`, `unisex`), `concentration_type` (`parfum`, `extrait`, `edp`, `edt`, `edc`, `other`), `olfactive_family` (`citrus`, `floral`, `woody`, `green`, `aquatic`, `oriental`, `spicy`, `fruity`, `aromatic`, `musky`).

## Tabelas

| Tabela             | Garante                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `profiles`         | `id` → `auth.users` com `CASCADE`; `timezone` padrão `America/Sao_Paulo` (RN06). Criada pelo trigger de cadastro. |
| `brands`           | `slug` único; `search_name` mantido por trigger.                                                                  |
| `perfumes`         | `brand_id` `RESTRICT`; `slug` único; `release_year` entre 1700 e ano atual + 1.                                   |
| `notes`            | `slug` único; `family` é `olfactive_family`.                                                                      |
| `perfume_notes`    | PK `(perfume_id, note_id, position)`; FKs `CASCADE`.                                                              |
| `collection_items` | `UNIQUE(user_id, perfume_id)` (RN02); `perfume_id` `RESTRICT`.                                                    |
| `daily_perfumes`   | `UNIQUE(user_id, date)` (RN06); `perfume_id` `RESTRICT`.                                                          |
| `perfume_reviews`  | `UNIQUE(user_id, perfume_id)` (RN04); ratings `smallint` entre 1 e 5 (RN05); `comment` com até 1000 caracteres.   |

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
| `perfume_reviews`                              | dono                    | dono e RN03                      | dono         | nenhuma (só cascade da conta) |

- **RN03:** a policy `reviews: insert if authorized` exige `owned` agora ou histórico em `daily_perfumes`.
- **UPDATE de avaliação:** a policy só confere o dono, então a migration restringe o privilégio de UPDATE às colunas `longevity_rating`, `projection_rating` e `comment`. Assim `perfume_id` e `user_id` não mudam depois de criados (sem isso, o dono driblaria a RN03). Consequência para o front: o `reviewService` faz `update` por `id` ou `insert`, nunca um `upsert` que reescreva `perfume_id`.
- **`daily_perfumes`:** `INSERT` e `UPDATE` revogados de `authenticated`; sem policy de DELETE.

## View `perfume_review_stats` (RN08)

`perfume_id, review_count, avg_longevity, avg_projection`, com `security_invoker = false` para ignorar a RLS de `perfume_reviews`. Expõe só agregados, nunca `user_id` nem `comment`. `anon` e `authenticated` têm `SELECT`.

## Storage

Bucket público `perfume-images`: `SELECT` para `anon` e `authenticated`; `INSERT`, `UPDATE` e `DELETE` só com `is_admin()`. Não há bucket de avatars no MVP. O Storage bloqueia `DELETE` direto em `storage.objects` por trigger; remoções devem passar pela API do Storage.

## Seed

`supabase/seed.sql` é idempotente (`on conflict do nothing`): 3 marcas, 3 perfumes, 27 notas (compartilhadas em uma linha só) e 30 ligações de pirâmide. Concentrações marcadas com `PLACEHOLDER: confirmar` precisam de conferência. `image_path` é `NULL` por direitos de imagem.

## Fora desta fase

`search_perfumes` (Seção 8), a Edge Function de exclusão de conta e a geração de tipos TypeScript.
