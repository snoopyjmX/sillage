# Segurança

Fonte: `docs/PRODUCT.md` (Seção 6). A autorização vive no banco; o frontend só reflete.

## Autorização por RLS

- RLS ligada nas 8 tabelas. Dados privados (`profiles`, `collection_items`, `daily_perfumes`, `perfume_reviews`) só aparecem para o dono (`(select auth.uid()) = user_id`).
- O catálogo é público para leitura. Escrita exige `is_admin()` (RN07).
- Não há policy de `INSERT`/`UPDATE`/`DELETE` onde o cliente não pode ser confiado: `daily_perfumes` só é escrita por `set_daily_perfume`, que calcula a data no fuso do perfil; `profiles` só nasce pelo trigger; `daily_perfumes` só é apagada por cascade da exclusão da conta. `perfume_reviews` o dono apaga e edita (só as colunas de nota e comentário); nunca a de outro.
- A `anon key` é pública por desenho. O que protege os dados são as policies.
- Toda mudança em migration ou policy exige atualizar os testes pgTAP (`supabase/tests/database/`).

## Admin

O papel vem de `app_metadata.role = 'admin'` no JWT, lido por `is_admin()`. `app_metadata` só muda com `service_role` (painel do Supabase ou script local). `user_metadata`, que o usuário edita pelo SDK, nunca concede acesso (coberto por teste). A claim chega no próximo refresh do token.

## Agregados e comentários

A tabela `perfume_reviews` segue fechada (RLS de dono). A leitura pública passa por duas views: `perfume_review_stats` (contagem e médias) e `perfume_reviews_public` (notas, comentário e `author_name` = nome de exibição, mais `id` da avaliação). Nenhuma expõe `user_id`, e-mail, fuso ou avatar (coberto por `columns_are` no pgTAP). O comentário é texto do usuário: a interface o renderiza sempre como texto (nunca HTML).

## Busca (`search_perfumes`)

- `SECURITY INVOKER` e `search_path` vazio: roda com os privilégios e a RLS de quem chama, então só devolve dados públicos do catálogo. Não é `SECURITY DEFINER`.
- `EXECUTE` revogado de `public` e concedido só a `anon` e `authenticated`. `anon` pode buscar: o catálogo é público (RN07).
- Sem SQL dinâmico. `p_sort` é validado contra uma lista fixa e a ordenação é um `CASE` estático; valor inválido levanta `22023`.
- Limites contra consulta abusiva: `p_limit` entre 1 e 100 e `p_offset >= 0`, senão `22023`.
- Os curingas do `LIKE` (prefixo e trecho; barra invertida, `%` e `_`) no texto do usuário são escapados.
- Avaliações entram só pelo agregado (`perfume_review_stats`) usado em `top_rated`; a função não devolve `user_id` nem `comment` (coberto por teste).

## Storage

Bucket `perfume-images`: leitura pública, escrita só admin. Sem bucket de avatars no MVP.

## Secrets

- O cliente do Supabase vive só em `src/lib/supabase.ts` e só os services o importam. `.env.local` (valores do Supabase local, vindos de `supabase status -o env`: só API_URL e ANON_KEY) fica fora do Git; `.env.example` não tem valores.

- O frontend usa só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- `service_role` nunca entra no frontend, no repositório nem em variáveis `VITE_*`.
- `.env` fica fora do Git; `.env.example` não tem valores.
- Produção: confirmação de e-mail ligada (no local ela fica desligada para testes), redirect URLs restritas e tamanho mínimo de senha definido.

## Clima e localização (Fase 14D)

- **Terceiro:** o navegador chama o Open-Meteo (previsão e geocoding) direto, sem chave e sem cookies (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`). O Open-Meteo vê o IP do usuário e a cidade ou as coordenadas consultadas; nada disso passa pelo nosso backend. Sem migration e sem mudança de policy: a RLS segue igual (`supabase test db` verde).
- **Cidade:** vem de `profiles.timezone` (já privado, RN01). Só o nome da cidade vai ao geocoding.
- **Geolocalização do aparelho:** só por clique em "Usar minha localização" ou, se a Permissions API já disser `granted`, direto. Nunca é pedida ao abrir a página.
- **Coordenadas nunca persistem:** arredondadas a 2 casas (~1 km), vivem só em estado de memória do hook `useGeolocation` e na chave `['private', userId, 'weather', 'current', lat, lon]`, que **nunca** é persistida (`shouldPersistQuery` só aceita `['public', ...]`). Não vão para `localStorage`, `sessionStorage`, IndexedDB, banco, nem para chave persistida, e não são enviadas ao nosso backend. O E2E confere o storage.
- **Respostas validadas** com Zod; falha de formato vira `weather_failed`. Mensagens ao usuário só por `constants/errors.ts`.
- **Limitação:** o Open-Meteo não tem SLA e a API gratuita é não comercial; a barra de clima degrada para "Clima indisponível" e a sugestão do dia segue funcionando sem clima.

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
| Vazar localização do usuário                             | Só por clique, arredondada, só em memória; chave privada nunca persistida    |
| Chave privada vazada                                     | Secret scanning, `service_role` fora do app, rotação se houver suspeita      |

## Limitações conhecidas

- **RN03 é autodeclarada.** O histórico de Perfume do Dia é gravado pelo próprio usuário via `set_daily_perfume`, então "já usou o perfume" funciona como filtro de coerência, não como prova de posse. Qualquer usuário pode escolher um perfume como Perfume do Dia e depois avaliá-lo. Isso é aceito para o produto.
- **Fuso inválido em `profiles.timezone`.** O trigger de cadastro valida o fuso, mas o dono pode editar o campo depois. Um valor inexistente faz `set_daily_perfume` falhar para ele (só para ele). Validar no front (Zod) e, se necessário, no banco numa fase futura.
- **Exclusão de conta** (Edge Function com `service_role`) ainda não existe nesta fase.
