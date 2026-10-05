# Segurança

Fonte: `docs/PRODUCT.md` (Seção 6). A autorização vive no banco; o frontend só reflete.

## Autorização por RLS

- RLS ligada nas 8 tabelas. Dados privados (`profiles`, `collection_items`, `daily_perfumes`, `perfume_reviews`) só aparecem para o dono (`(select auth.uid()) = user_id`).
- O catálogo é público para leitura. Escrita exige `is_admin()` (RN07).
- Não há policy de `INSERT`/`UPDATE`/`DELETE` onde o cliente não pode ser confiado: `daily_perfumes` só é escrita por `set_daily_perfume`, que calcula a data no fuso do perfil; `profiles` só nasce pelo trigger; `perfume_reviews` e `daily_perfumes` só são apagadas por cascade da exclusão da conta.
- A `anon key` é pública por desenho. O que protege os dados são as policies.
- Toda mudança em migration ou policy exige atualizar os testes pgTAP (`supabase/tests/database/`).

## Admin

O papel vem de `app_metadata.role = 'admin'` no JWT, lido por `is_admin()`. `app_metadata` só muda com `service_role` (painel do Supabase ou script local). `user_metadata`, que o usuário edita pelo SDK, nunca concede acesso (coberto por teste). A claim chega no próximo refresh do token.

## Agregados e comentários

`perfume_review_stats` é a única forma pública de ver avaliações e expõe apenas contagem e médias. Comentário e autor nunca saem da tabela privada (RN08).

## Busca (`search_perfumes`)

- `SECURITY INVOKER` e `search_path` vazio: roda com os privilégios e a RLS de quem chama, então só devolve dados públicos do catálogo. Não é `SECURITY DEFINER`.
- `EXECUTE` revogado de `public` e concedido só a `anon` e `authenticated`. `anon` pode buscar: o catálogo é público (RN07).
- Sem SQL dinâmico. `p_sort` é validado contra uma lista fixa e a ordenação é um `CASE` estático; valor inválido levanta `22023`.
- Limites contra consulta abusiva: `p_limit` entre 1 e 100 e `p_offset >= 0`, senão `22023`.
- Os curingas do `LIKE` (barra invertida, `%` e `_`) no texto do usuário são escapados.
- Avaliações entram só pelo agregado (`perfume_review_stats`) usado em `top_rated`; a função não devolve `user_id` nem `comment` (coberto por teste).

## Storage

Bucket `perfume-images`: leitura pública, escrita só admin. Sem bucket de avatars no MVP.

## Secrets

- O frontend usa só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- `service_role` nunca entra no frontend, no repositório nem em variáveis `VITE_*`.
- `.env` fica fora do Git; `.env.example` não tem valores.
- Produção: confirmação de e-mail ligada (no local ela fica desligada para testes), redirect URLs restritas e tamanho mínimo de senha definido.

## Modelo de ameaça

| Ameaça                                                   | Mitigação                                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Usuário A lê ou altera dados do B                        | RLS por dono + pgTAP com dois usuários                                       |
| Cliente envia `user_id` de outro                         | `WITH CHECK ((select auth.uid()) = user_id)`                                 |
| Cliente forja a data do Perfume do Dia                   | Sem `INSERT`/`UPDATE` direto; a função calcula a data                        |
| Autopromoção a admin                                     | Papel em `app_metadata`; `user_metadata` não vale                            |
| Vazar comentários por agregados                          | View expõe só contagem e médias                                              |
| Busca abusiva ou injeção via ordenação                   | `p_limit` 1 a 100, `p_offset >= 0`, `p_sort` em lista fixa, sem SQL dinâmico |
| Trocar `perfume_id` de uma avaliação para driblar a RN03 | `UPDATE` restrito por coluna (`perfume_id` e `user_id` imutáveis)            |
| XSS em comentário                                        | React escapa; sem `dangerouslySetInnerHTML`; limite de 1000 caracteres       |
| Chave privada vazada                                     | Secret scanning, `service_role` fora do app, rotação se houver suspeita      |

## Limitações conhecidas

- **RN03 é autodeclarada.** O histórico de Perfume do Dia é gravado pelo próprio usuário via `set_daily_perfume`, então "já usou o perfume" funciona como filtro de coerência, não como prova de posse. Qualquer usuário pode escolher um perfume como Perfume do Dia e depois avaliá-lo. Isso é aceito para o produto.
- **Fuso inválido em `profiles.timezone`.** O trigger de cadastro valida o fuso, mas o dono pode editar o campo depois. Um valor inexistente faz `set_daily_perfume` falhar para ele (só para ele). Validar no front (Zod) e, se necessário, no banco numa fase futura.
- **Exclusão de conta** (Edge Function com `service_role`) ainda não existe nesta fase.
