# Sillage — Especificação v1.2

Oct 4, 2026 · @João Marcelo

## 1. Visão geral e o que mudou na v1.2

PWA de catálogo e coleção de perfumaria de nicho, em português (BR), mobile-first, feito como case de portfólio full-stack: UI premium com animações, regras de negócio garantidas no banco e QA automatizado.

**Objetivos**

1.  Catálogo pesquisável com filtros por nota, posição da nota, família, marca e concentração.

2.  Página do perfume com pirâmide olfativa interativa.

3.  Conta de usuário com coleção (Tenho / Quero), Perfume do Dia com histórico e avaliações de fixação e projeção.

4.  Privacidade real: dados privados protegidos por RLS, nunca só pelo frontend.

5.  PWA instalável, com shell offline e catálogo público consultável sem rede.

6.  Visual de perfumaria de nicho (minimalista, luxuoso), consistente porque nasce de um design system e não de componentes soltos.

**Mudanças em relação à v1.0**

| Mudança                                                               | Por quê                                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN03 (avaliação autorizada) virou policy SQL com `EXISTS`             | Depende de duas tabelas; um `CHECK` não alcança.                                                                                                         |
| Perfume do Dia é gravado por função no banco, no fuso do usuário      | Evita que um registro às 22h (UTC-3) caia no dia seguinte e quebre a RN06.                                                                               |
| Avaliações privadas + média pública por view agregada                 | A v1.0 tinha contradição: RN01 dizia privado, mas "mais avaliados" exigia agregar.                                                                       |
| Perfil passa a ser privado                                            | A v1.0 dizia "informações públicas" na tabela e "privado" na RN01.                                                                                       |
| Admin identificado por `app_metadata` do JWT                          | Define a RN07 sem permitir autopromoção; `user_metadata` é editável pelo usuário.                                                                        |
| Busca por RPC com `unaccent` e `pg_trgm`                              | Combinar nota + posição + família + contagem total fica frágil só com filtros do PostgREST.                                                              |
| Offline: cache persistido apenas de queries públicas, limpo no logout | Resolve o conflito entre offline e privacidade (seção 11).                                                                                               |
| Rotas de esqueci/redefinir senha, callback e 404                      | Faltavam na v1.0; a recuperação de senha não funciona sem elas.                                                                                          |
| shadcn/ui + 21st.dev como origem dos componentes                      | Mesma base (Radix + Tailwind + Motion), com regras de curadoria (seção 10).                                                                              |
| 5 arquivos de IA viram `AGENTS.md` + `DESIGN_SYSTEM.md`               | Menos manutenção, mais efeito sobre o resultado visual (seção 13).                                                                                       |
| CI e deploy na Fase 1, não na 12                                      | Cada fase já nasce com preview e checagens.                                                                                                              |
| Índice de busca normalizado para pg_trgm                              | unaccent() é STABLE e não pode ser usado diretamente em uma expressão de índice; search_name será mantido por trigger e indexado com GIN + pg_trgm.      |
| Histórico do Perfume do Dia protegido contra DELETE direto            | O histórico não pode ser apagado pelo usuário; a função permite apenas substituir o registro do dia atual. Exclusão ocorre somente por cascata da conta. |
| Exclusão de conta via Edge Function protegida                         | auth.admin.deleteUser() exige privilégios administrativos; o service_role fica somente no runtime da função, nunca no frontend.                          |
| Logout preserva cache público e remove apenas dados privados          | O catálogo público offline continua disponível após sair da conta, enquanto queries privadas são removidas da memória e nunca são persistidas.           |

## 2. Escopo do MVP

O MVP entrega seis blocos: catálogo, detalhes, autenticação, coleção, Perfume do Dia e avaliações. Painel administrativo fica de fora, mas o schema e as policies já o suportam (seção 6).

**Catálogo.** Cards com nome, marca, imagem, concentração, ano e famílias olfativas. Busca por nome e marca (sem diferenciar acentos). Filtros: marca, família, nota, posição da nota, concentração, gênero e ano. Ordenação: A-Z, Z-A, mais recentes, mais avaliados e, quando há texto de busca, por relevância.

**Detalhes.** Uma página por slug (`/perfumes/amyi-2-15`) com hero, informações principais, descrição, pirâmide olfativa interativa, média pública de avaliações, estado na coleção, ações de coleção e de Perfume do Dia, e a avaliação do próprio usuário.

**Autenticação.** Supabase Auth com cadastro, login, logout, recuperação de senha, sessão persistida, rotas privadas e redirecionamento de volta ao destino original após o login.

**Coleção.** Cada perfume está em `Tenho` ou `Quero` por usuário, nunca nos dois. Ações: adicionar, remover, alternar estado, listar e filtrar.

**Perfume do Dia.** Um por data, no fuso do usuário, com histórico completo consultável. Escolher de novo no mesmo dia substitui o anterior.

**Avaliações.** Fixação e projeção de 1 a 5, comentário opcional, uma por usuário e perfume. O comentário é privado; o público vê apenas média e contagem.

**Fora do MVP:** painel admin, perfis públicos, compartilhamento, notificações, importação de dados, recomendação.

## 3. Regras de negócio

São oito regras; cada uma tem um mecanismo de garantia no banco, e o frontend apenas reflete o resultado.

| Regra                     | Enunciado                                                                                                  | Garantia                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| RN01 Privacidade          | Perfil, coleção, Perfume do Dia e avaliações só são visíveis e editáveis pelo próprio dono.                | RLS com `user_id = auth.uid()`                       |
| RN02 Coleção única        | Um perfume tem um único estado (`owned` ou `wanted`) por usuário; trocar de estado atualiza a mesma linha. | `UNIQUE(user_id, perfume_id)` + `upsert`             |
| RN03 Avaliação autorizada | Só avalia quem tem o perfume em `owned` agora ou já o usou como Perfume do Dia.                            | Policy de `INSERT` com `EXISTS`                      |
| RN04 Avaliação única      | Uma avaliação por usuário e perfume; reenviar atualiza.                                                    | `UNIQUE(user_id, perfume_id)` + `upsert`             |
| RN05 Ratings 1 a 5        | Fixação e projeção só aceitam inteiros de 1 a 5.                                                           | `CHECK` no banco + Zod no front                      |
| RN06 Um por data          | Um Perfume do Dia por usuário e por data, calculada no fuso do usuário.                                    | `UNIQUE(user_id, date)` + função `set_daily_perfume` |
| RN07 Catálogo             | Leitura pública; escrita só para administradores.                                                          | Policies com `is_admin()`                            |
| RN08 Agregados públicos   | Média e contagem de avaliações são públicas e anônimas; comentário e autor nunca.                          | View `perfume_review_stats`                          |

**Decisões que a v1.0 deixava em aberto**

- **Editar avaliação existente:** permitido ao dono mesmo que o perfume tenha saído de `owned`. A RN03 vale para criar; revogar a edição por uma mudança de coleção seria confuso.

- **Autorização autodeclarada:** o histórico de Perfume do Dia é gravado pelo próprio usuário, então a RN03 funciona como filtro de coerência, não como prova de posse. Isso é aceitável para o produto e deve constar em `SECURITY.md`.

- **Fuso:** o fuso fica em `profiles.timezone` (padrão `America/Sao_Paulo`), preenchido com o fuso do navegador no cadastro. O banco calcula a data; o cliente nunca a envia.

- **Perfume do Dia no passado ou futuro:** não é permitido no MVP; só a data de hoje.

## 4. Stack tecnológica

A stack da v1.0 se mantém; entram shadcn/ui e 21st.dev como origem dos componentes visuais, e algumas bibliotecas de apoio que já são padrão nesse ecossistema.

| Camada                       | Escolha                                              | Observação                                                                                            |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Build e UI                   | React, Vite, TypeScript strict                       | `noUncheckedIndexedAccess` ligado                                                                     |
| Rotas                        | React Router (data router)                           | Rotas com `lazy()` para code splitting                                                                |
| Estilo                       | Tailwind CSS                                         | Tokens como CSS variables; CSS próprio só para safe areas, variáveis e casos que o Tailwind não cobre |
| Componentes                  | shadcn/ui (Radix + Tailwind)                         | Código copiado para `src/components/ui`, não dependência                                              |
| Fonte de componentes visuais | 21st.dev (e Magic MCP)                               | Sempre via curadoria (seção 10)                                                                       |
| Utilitários de estilo        | `class-variance-authority`, `clsx`, `tailwind-merge` | Padrão do shadcn                                                                                      |
| Animação                     | Motion for React (`motion/react`)                    | Única biblioteca de animação                                                                          |
| Ícones                       | Lucide React                                         | Stroke e tamanho padronizados                                                                         |
| Toasts                       | Sonner (via shadcn)                                  | Feedback de mutations                                                                                 |
| Dados assíncronos            | TanStack Query + `persistQueryClient`                | Persistência só de queries públicas                                                                   |
| Formulários                  | React Hook Form + Zod                                | Schemas em `src/schemas`, reaproveitados nos testes                                                   |
| Backend                      | Supabase (Postgres, Auth, RLS, Storage)              | SDK oficial; CLI para migrations locais                                                               |
| Tipos do banco               | `supabase gen types typescript`                      | Gerados, nunca escritos à mão                                                                         |
| PWA                          | `vite-plugin-pwa` (Workbox)                          | `registerType: 'prompt'`                                                                              |
| Fontes                       | `@fontsource` (self-hosted)                          | Funciona offline e não depende de CDN                                                                 |
| Testes                       | Vitest, Playwright, `@axe-core/playwright`, pgTAP    | Seção 12                                                                                              |
| Qualidade                    | ESLint, Prettier, TypeScript                         | Rodam no CI                                                                                           |
| Hospedagem                   | Vercel + GitHub Actions                              | Preview por PR                                                                                        |

**Regra de dependências.** Nenhuma biblioteca nova entra sem uma linha em `ARCHITECTURE.md` dizendo o que resolve e por que o que já existe não resolve. Componentes do 21st.dev que tragam outra lib de animação ou de ícones são adaptados para `motion` e `lucide-react` antes de entrar.

## 5. Modelo de dados

São oito tabelas, cinco enums, duas extensões de busca e uma view; as regras de negócio viram constraints sempre que possível.

Extensões: unaccent e pg_trgm para busca; ids usam gen_random_uuid() nativo quando disponível. Como unaccent() é STABLE, a busca não indexa a expressão unaccent() diretamente: brands.name e perfumes.name alimentam uma coluna search_name normalizada por trigger, e o índice GIN usa search_name com pg_trgm.

**Enums**

| Enum                 | Valores                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `collection_status`  | `owned`, `wanted`                                                                                                                                |
| `note_position`      | `top`, `heart`, `base`                                                                                                                           |
| `perfume_gender`     | `masculine`, `feminine`, `unisex`                                                                                                                |
| `concentration_type` | `parfum`, `extrait`, `edp`, `edt`, `edc`, `other`                                                                                                |
| `olfactive_family`   | `citrus`, `floral`, `woody`, `green`, `aquatic`, `oriental`, `spicy`, `fruity`, `aromatic`, `musky` (rótulos em português ficam em `constants/`) |

**Tabelas**

| Tabela             | Campos principais                                                                                               | Constraints e relacionamentos                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `profiles`         | `id`, `display_name`, `avatar_url`, `timezone`, `created_at`, `updated_at`                                      | `id` → `auth.users` `ON DELETE CASCADE`; criada por trigger no cadastro                                                     |
| `brands`           | id, name, search_name, slug, description, website_url, timestamps                                               | slug UNIQUE; search_name mantido por trigger; índice GIN trigram em search_name                                             |
| `perfumes`         | id, brand_id, name, search_name, slug, description, gender, concentration, release_year, image_path, timestamps | brand_id → brands RESTRICT; slug UNIQUE; search_name mantido por trigger; release_year com CHECK (1700 até o ano atual + 1) |
| `notes`            | `id`, `name`, `slug`, `family`, timestamps                                                                      | `slug UNIQUE`; `family` é `olfactive_family`                                                                                |
| `perfume_notes`    | `perfume_id`, `note_id`, `position`                                                                             | PK composta `(perfume_id, note_id, position)`; ambas as FKs `CASCADE`                                                       |
| `collection_items` | `id`, `user_id`, `perfume_id`, `status`, timestamps                                                             | `UNIQUE(user_id, perfume_id)`; `user_id` → `profiles` `CASCADE`; `perfume_id` → `perfumes` `RESTRICT`                       |
| `daily_perfumes`   | `id`, `user_id`, `perfume_id`, `date`, `created_at`                                                             | `UNIQUE(user_id, date)`; mesmas FKs da coleção                                                                              |
| `perfume_reviews`  | `id`, `user_id`, `perfume_id`, `longevity_rating`, `projection_rating`, `comment`, timestamps                   | `UNIQUE(user_id, perfume_id)`; ratings `smallint CHECK BETWEEN 1 AND 5`; `comment` com `CHECK (char_length <= 1000)`        |

**Decisões de modelagem**

- **Nome da coluna:** `longevity_rating` (como na v1.0), exibido como "Fixação" na interface.

- **Imagem:** guardar `image_path` (caminho no Storage), não URL completa; a URL é montada no frontend e o domínio pode mudar sem migration.

- **Famílias do perfume:** derivadas das notas (`notes.family`), sem coluna duplicada em `perfumes`. O filtro por família procura perfumes com ao menos uma nota daquela família.

- **Notas sempre por `slug`:** filtros usam `bergamota`, não o texto "Bergamota" com acento.

- **FKs de dados do usuário para `perfumes` são `RESTRICT`:** um perfume do catálogo não some levando coleção e histórico junto. Despublicar, se necessário no futuro, será por flag.

- **Exclusão de conta (LGPD):** `ON DELETE CASCADE` a partir de `auth.users` remove perfil, coleção, histórico e avaliações.

**Índices**

- FKs: `perfumes(brand_id)`, `perfume_notes(note_id, position)`, `collection_items(user_id, status)`, `daily_perfumes(user_id, date DESC)`, `perfume_reviews(perfume_id)`.

- Busca: GIN trigram em brands.search_name e perfumes.search_name; search_name contém lower(unaccent(name)) e é mantido por trigger.

- Ordenação: `perfumes(release_year DESC NULLS LAST)`.

**Triggers e funções**

- `set_updated_at()` em todas as tabelas com `updated_at`.

- `handle_new_user()` cria o `profiles` ao inserir em `auth.users`.

- `set_daily_perfume(p_perfume_id uuid)`: calcula `(now() at time zone profiles.timezone)::date` e faz `upsert` em `daily_perfumes`. Roda com `SECURITY DEFINER` e `search_path` vazio, valida `auth.uid()` e é o único caminho de escrita nessa tabela (seção 6).

- `search_perfumes(...)`: ver seção 8.

- `is_admin()`: ver seção 6.

**View pública**

`perfume_review_stats(perfume_id, review_count, avg_longevity, avg_projection)`, criada para expor só agregados. Detalhes de acesso na seção 6.

**Migrations e seed.** Tudo em `supabase/migrations`, versionado; `supabase/seed.sql` roda em `supabase db reset` e é reproduzível. Os três perfumes iniciais (Amyi 2.15, Caipi d'Argent, Irish Green Man) entram com marca, descrição, slug e pirâmide completa. **Imagens:** fotos de frascos costumam ter direitos autorais; para o portfólio, use fotos próprias, imagens liberadas pela marca ou ilustrações/placeholders consistentes.

## 6. Segurança e RLS

A autorização vive no banco: RLS ligada em todas as tabelas, sem `INSERT` direto onde a data ou o dono não podem ser confiados ao cliente. A `anon key` é pública por desenho; o que protege os dados são as policies.

**Policies por tabela**

| Tabela                                         | SELECT                   | INSERT                                           | UPDATE             | DELETE                                         |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------ | ------------------ | ---------------------------------------------- |
| `brands`, `perfumes`, `notes`, `perfume_notes` | `anon` e `authenticated` | `is_admin()`                                     | `is_admin()`       | `is_admin()`                                   |
| `profiles`                                     | dono                     | só o trigger `handle_new_user`                   | dono               | só por cascade                                 |
| `collection_items`                             | dono                     | dono                                             | dono               | dono                                           |
| `daily_perfumes`                               | dono                     | **nenhuma** (só pela função `set_daily_perfume`) | **nenhuma** (idem) | nenhuma (somente cascade de exclusão da conta) |
| `perfume_reviews`                              | dono                     | dono **e** RN03                                  | dono               | nenhuma (somente cascade de exclusão da conta) |
| `perfume_review_stats` (view)                  | `anon` e `authenticated` | n/a                                              | n/a                | n/a                                            |

"Dono" significa `(select auth.uid()) = user_id` no `USING` e no `WITH CHECK`. O `select` em volta de `auth.uid()` faz o Postgres avaliar uma vez por consulta, não por linha.

**Padrão de policy de dono** (exemplo: coleção)

```sql
alter table public.collection_items enable row level security;

create policy "collection: owner select" on public.collection_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "collection: owner insert" on public.collection_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "collection: owner update" on public.collection_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "collection: owner delete" on public.collection_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);
```

**RN03 em SQL** (avaliação autorizada)

```sql
create policy "reviews: insert if authorized" on public.perfume_reviews
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      exists (
        select 1 from public.collection_items c
        where c.user_id = (select auth.uid())
          and c.perfume_id = perfume_reviews.perfume_id
          and c.status = 'owned'
      )
      or exists (
        select 1 from public.daily_perfumes d
        where d.user_id = (select auth.uid())
          and d.perfume_id = perfume_reviews.perfume_id
      )
    )
  );
```

Atenção ao `upsert`: no Postgres, o `WITH CHECK` do `INSERT` é avaliado antes de detectar o conflito. Para **editar** uma avaliação existente de um perfume que já saiu de `owned`, o `reviewService` faz `update` por `id` quando a avaliação existe e `insert` quando não existe, em vez de um `upsert` cego.

**Perfume do Dia (RN06)**

```sql
create function public.set_daily_perfume(p_perfume_id uuid)
returns public.daily_perfumes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_date date;
  v_row public.daily_perfumes;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select (now() at time zone p.timezone)::date into v_date
    from public.profiles p where p.id = v_uid;
  insert into public.daily_perfumes (user_id, perfume_id, date)
    values (v_uid, p_perfume_id, v_date)
  on conflict (user_id, date) do update set perfume_id = excluded.perfume_id
  returning * into v_row;
  return v_row;
end $$;

revoke insert, update on public.daily_perfumes from authenticated;
revoke all on function public.set_daily_perfume(uuid) from public, anon;
grant execute on function public.set_daily_perfume(uuid) to authenticated;
```

Com isso o cliente não consegue gravar uma data arbitrária nem escrever para outro usuário.

O usuário também não pode apagar registros de daily_perfumes diretamente. A função só substitui o registro da data atual; o histórico permanece preservado até a exclusão da conta, quando as FKs fazem CASCADE.

**Admin (RN07)**

```sql
create function public.is_admin() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' $$;
```

O papel fica em `app_metadata`, que só pode ser alterado com `service_role` (painel do Supabase ou script local). Nunca em `user_metadata`, que o próprio usuário edita pelo SDK. A claim chega ao JWT no próximo refresh do token.

**View de agregados (RN08)**

```sql
create view public.perfume_review_stats
with (security_invoker = false) as
select perfume_id,
       count(*)                          as review_count,
       round(avg(longevity_rating), 1)   as avg_longevity,
       round(avg(projection_rating), 1)  as avg_projection
from public.perfume_reviews
group by perfume_id;

grant select on public.perfume_review_stats to anon, authenticated;
```

A view roda com os privilégios do dono para ignorar a RLS de `perfume_reviews`, e por isso expõe apenas colunas agregadas: nunca `user_id` nem `comment`. No MVP a média aparece a partir de 1 avaliação; revisar esse limite se a base de usuários crescer.

**Storage**

- `perfume-images`: leitura pública, escrita só para `is_admin()`.

- `avatars` (se entrar no MVP): caminho `avatars/<user_id>/...`, com policy `(storage.foldername(name))[1] = (select auth.uid())::text`.

**Secrets e ambiente**

- Frontend usa só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. `service_role` nunca entra no frontend, no repositório ou em variáveis `VITE_*`.

- `.env` fora do Git, `.env.example` sem valores, secret scanning ligado no GitHub.

- Em produção: confirmação de e-mail ligada, lista de redirect URLs do Auth restrita ao domínio e aos previews da Vercel, tamanho mínimo de senha definido.

Exclusão de conta (LGPD): o frontend chama uma Edge Function autenticada; a função executa auth.admin.deleteUser() com service_role disponível somente no runtime. O service_role nunca é enviado ao navegador, não entra em VITE\_\* e não é versionado.

**Modelo de ameaça básico**

| Ameaça                                   | Mitigação                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Usuário A lê ou altera dados do B        | RLS por dono + testes pgTAP e de integração com dois usuários                                      |
| Cliente envia `user_id` de outro         | `WITH CHECK (auth.uid() = user_id)`                                                                |
| Cliente forja a data do Perfume do Dia   | Sem `INSERT`/`UPDATE` direto; função calcula a data                                                |
| Autopromoção a admin                     | Papel em `app_metadata`, escrita só com `service_role`                                             |
| Vazar comentários por agregados          | View expõe apenas contagem e médias                                                                |
| XSS em comentário                        | React escapa por padrão; proibido `dangerouslySetInnerHTML`; limite de 1000 caracteres             |
| Dados privados em aparelho compartilhado | Cache privado nunca persistido; removeQueries no logout; cache público do catálogo pode permanecer |
| Chave privada vazada                     | Secret scanning, `service_role` fora do app, rotação se houver suspeita                            |
| Usuário tenta excluir a conta de outro   | Edge Function valida auth.uid(); service_role fica apenas no runtime e não é exposto ao cliente    |

## 7. Arquitetura front-end e rotas

O fluxo é `Page → Component → Hook → Service → Supabase`, e só os services conhecem o cliente do Supabase. Componentes visuais não fazem consultas nem carregam regra de negócio.

**Responsabilidades**

- **Page:** compõe a tela, lê parâmetros da URL, escolhe estados de carregamento, vazio e erro.

- **Component:** apresentação e interação; recebe dados e callbacks por props ou por hooks de domínio.

- **Hook:** encapsula TanStack Query (`usePerfumes`, `useCollection`, `useSetDailyPerfume`, `useReview`), invalidação e _optimistic updates_ quando fizer sentido.

- **Service:** funções puras de acesso a dados (`perfumeService.search`, `collectionService.setStatus`); converte erros do Supabase em `AppError` com um código estável.

- **Mensagens ao usuário:** ficam em `constants/errors.ts`, mapeadas por código. Nenhum texto técnico do Supabase chega à interface.

**Chaves de query com dois namespaces**

```ts
[
  'public',
  'perfumes',
  'list',
  filters,
] // persistível offline
[('public', 'perfumes', 'detail', slug)][
  ('private', userId, 'collection')
] // nunca persistido; removido no logout
[('private', userId, 'daily')][('private', userId, 'review', perfumeId)];
```

A fábrica fica em `lib/queryKeys.ts`. O prefixo decide o que o `persistQueryClient` grava (`public`) e o que o logout apaga (`private`).

**Estrutura de pastas**

```text
src/
├── components/
│   ├── ui/            # shadcn + componentes curados do 21st.dev
│   ├── layout/        # AppShell, Navbar, BottomNav, PageTransition
│   ├── perfume/       # PerfumeCard, OlfactoryPyramid, ...
│   ├── collection/    # CollectionToggle
│   ├── reviews/       # RatingStars, ReviewForm
│   └── filters/       # FilterPanel, NoteCombobox
├── pages/             # Home, Catalog, PerfumeDetails, Collection, Daily,
│                      # Login, Register, ForgotPassword, ResetPassword, Profile, NotFound
├── hooks/
├── services/          # auth, perfumes, collection, daily-perfume, reviews
├── lib/               # supabase.ts, queryClient.ts, queryKeys.ts, motion.ts, utils.ts
├── schemas/           # Zod
├── types/             # database.types.ts (gerado) + tipos de domínio
├── constants/         # errors.ts, labels pt-BR (famílias, concentrações...)
├── routes/            # router, RequireAuth, redirects
└── styles/            # tokens.css, globals.css, safe-areas
supabase/
├── migrations/  seed.sql  tests/ (pgTAP)
```

**Rotas**

| Rota                  | Acesso             | Função                                              |
| --------------------- | ------------------ | --------------------------------------------------- |
| `/`                   | pública            | Home com destaques e entrada para o catálogo        |
| `/catalog`            | pública            | Busca, filtros e resultados; estado na query string |
| `/perfumes/:slug`     | pública            | Detalhes; ações de coleção e avaliação exigem login |
| `/login`, `/register` | só visitantes      | Autenticação; aceita `?redirect=`                   |
| `/forgot-password`    | só visitantes      | Pede o e-mail de recuperação                        |
| `/reset-password`     | via link do e-mail | Define a nova senha (evento `PASSWORD_RECOVERY`)    |
| `/collection`         | privada            | Coleção com abas Tenho e Quero                      |
| `/daily`              | privada            | Perfume do Dia de hoje e histórico                  |
| `/profile`            | privada            | Nome de exibição, fuso, excluir conta               |
| `*`                   | pública            | 404                                                 |

**Fluxo de autenticação**

1.  `AuthProvider` lê a sessão inicial e assina `onAuthStateChange`.

2.  `RequireAuth` redireciona para `/login?redirect=<rota original>`; depois do login, volta para ela.

3.  SIGNED_OUT: remove queries privadas do TanStack Query, preserva o cache público persistido do catálogo e navega para /.

4.  `PASSWORD_RECOVERY`: navega para `/reset-password`.

5.  `TOKEN_REFRESHED`: nada a fazer na UI.

6.  Dentro do callback de `onAuthStateChange` não se deve fazer `await` em chamadas ao Supabase (risco conhecido de deadlock); dispare o trabalho depois, fora do callback.

A proteção de rota no React serve só para UX. A segurança real é a RLS.

## 8. Catálogo, busca e paginação

A busca roda numa função SQL (`search_perfumes`) chamada por RPC, porque combinar nota, posição, família e contagem total em uma só consulta é mais previsível em SQL do que em filtros encadeados do PostgREST.

**Assinatura**

```sql
search_perfumes(
  p_query            text                 default null,
  p_brand_slugs      text[]               default null,
  p_note_slugs       text[]               default null,
  p_note_position    note_position        default null,
  p_families         olfactive_family[]   default null,
  p_concentrations   concentration_type[] default null,
  p_genders          perfume_gender[]     default null,
  p_year_min         int                  default null,
  p_year_max         int                  default null,
  p_sort             text                 default 'relevance',
  p_limit            int                  default 24,
  p_offset           int                  default 0
) returns table (..., total_count bigint)
```

`SECURITY INVOKER` e `STABLE`: a RLS vale e o resultado só contém dados públicos.

**Semântica dos filtros**

- **Entre grupos:** `AND` (marca e nota e concentração).

- **Várias notas:** `AND`. O perfume precisa ter todas as notas escolhidas. Se `p_note_position` vier preenchido, ele vale para todas.

- **Várias marcas, famílias, concentrações ou gêneros:** `OR` dentro do grupo.

- **Texto:** compara `unaccent(lower(...))` com nome do perfume e da marca; "cafe" encontra "Café". Usa `pg_trgm` para tolerar pequenos erros de digitação.

- **Consulta exemplo:** "perfumes com bergamota no topo" é `p_note_slugs = ['bergamota']` com `p_note_position = 'top'`.

**Ordenação**

| Valor de `p_sort`       | Critério                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `name_asc`, `name_desc` | Nome do perfume                                                                     |
| `newest`                | `release_year` decrescente, nulos por último                                        |
| `top_rated`             | Média de `perfume_review_stats`, desempate por contagem                             |
| `relevance`             | Similaridade do texto; só disponível quando há `p_query`, senão cai para `name_asc` |

O valor de `p_sort` é validado contra essa lista dentro da função; nunca concatenado em SQL dinâmico.

**Paginação.** Paginação por página, 24 itens, com `total_count` retornado na mesma consulta. A página, a busca e os filtros vivem na URL (`/catalog?q=ambar&notes=bergamota,limao&pos=top&sort=newest&page=2`), o que torna o estado compartilhável e restaurável ao voltar. A troca de página usa `placeholderData` do TanStack Query para não piscar a lista. A busca por texto tem _debounce_ de 300 ms. Infinite scroll fica para quando a base crescer e houver motivo de UX.

**Detalhes do perfume.** Uma única consulta por `slug` traz perfume, marca e `perfume_notes` com `notes` embutidos; a pirâmide é montada no cliente agrupando por `position`. Slug inexistente cai no 404.

**SEO.** O app é uma SPA do Vite, então não há renderização no servidor. No MVP cada página define título e meta tags (por exemplo com `react-helmet-async`), o que basta para compartilhamento e portfólio. Indexação séria do catálogo exigiria pré-renderização ou SSR e fica explicitamente fora do escopo.

## 9. Design system e direção visual

A direção é escuro, quente e silencioso: um tema _dark-first_ com acento champagne, tipografia serifada nos títulos e vidro apenas onde há camadas flutuantes. Os valores abaixo são o ponto de partida; a fonte de verdade passa a ser `src/styles/tokens.css`, documentado em `docs/DESIGN_SYSTEM.md`.

**Princípios**

1.  **Um momento de assinatura por tela** (a pirâmide nos detalhes, o hero na home); o resto é calmo.

2.  **Hierarquia antes de efeito:** contraste, espaço e tipografia fazem o trabalho; blur e movimento reforçam.

3.  **Tokens, nunca valores soltos:** nenhuma cor hexadecimal ou `px` mágico em componentes.

4.  **Não deve parecer:** infantil, colorido demais, template de dashboard ou futurista exagerado.

**Cores (tema escuro inicial)**

| Token                           | Valor                             | Uso                                                  |
| ------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `background`                    | `#0B0A0C`                         | Fundo do app                                         |
| `surface`                       | `#141217`                         | Cards e painéis                                      |
| `surface-elevated`              | `#1C1920`                         | Modais, popovers, item em foco                       |
| `border`                        | `rgba(255,255,255,0.08)`          | Divisórias e contornos                               |
| `text-primary`                  | `#F4EFE8`                         | Títulos e texto principal                            |
| `text-secondary`                | `#B9B1A6`                         | Texto de apoio                                       |
| `text-muted`                    | `#8A847B`                         | Legendas e placeholders (≥ 4,5:1 sobre `background`) |
| `primary`                       | `#C8A97E`                         | Acento champagne: botões, foco, estado ativo         |
| `primary-soft`                  | `rgba(200,169,126,0.14)`          | Fundo de chips e seleção                             |
| `success` / `warning` / `error` | `#6FAF8F` / `#D9A55B` / `#D6685F` | Feedback                                             |

Os tokens seguem os nomes do shadcn (`--background`, `--card`, `--primary`...) para que componentes do 21st.dev herdem o tema sem retrabalho. Tema claro fica para depois do MVP; o `theme-color` do manifest acompanha `background`.

**Tipografia**

| Papel             | Fonte                            | Tamanho / altura de linha (mobile → desktop)            |
| ----------------- | -------------------------------- | ------------------------------------------------------- |
| Display           | Cormorant Garamond (ou Fraunces) | 40/44 → 56/60                                           |
| Heading 1 / 2 / 3 | Cormorant Garamond               | 32/38, 24/30, 20/26                                     |
| Body              | Inter                            | 16/24                                                   |
| Small             | Inter                            | 14/20                                                   |
| Caption / Label   | Inter                            | 12/16; label em caixa alta com `letter-spacing: 0.08em` |

A serifada só é usada a partir de 20 px, porque em tamanhos menores perde legibilidade. Campos de formulário ficam em 16 px ou mais para o iOS não dar zoom ao focar. Fontes entram por `@fontsource`, empacotadas no app.

**Espaçamento, raio e sombras**

- **Spacing:** escala de 4 pt (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).

- **Radius:** `sm` 6, `md` 10, `lg` 14, `xl` 20, `2xl` 28, `full`.

- **Sombras:** `subtle`, `card`, `floating`, `modal`. No tema escuro a elevação vem mais de superfície e borda do que de sombra; defina cada uma como combinação de `box-shadow` e borda nos tokens.

**Glassmorphism com regras**

- **Onde:** navbar, bottom navigation, drawers e modais, barra flutuante de filtros.

- **Receita:** fundo `rgba(20,18,23,0.6)`, `backdrop-filter: blur(16px–24px)`, borda de 1 px a 8%, sombra suave.

- **Limites:** no máximo duas camadas de vidro visíveis ao mesmo tempo; nada de blur em itens de lista que rolam (custa caro em Android intermediário, como o viewport tipo Huawei P30 da matriz de testes).

- **Fallback:** fundo sólido de `surface-elevated` quando `backdrop-filter` não é suportado e quando o usuário pede menos transparência.

**Pirâmide olfativa**

É o componente mais importante do produto e tem especificação própria.

- **Estrutura:** três camadas (Topo, Coração, Fundo), em largura crescente para sugerir a pirâmide, cada uma com seus chips de notas.

- **Interação:** cada camada é um botão com `aria-expanded` que abre e fecha; no mobile só o Topo começa aberto, no desktop todas. Tocar numa nota leva ao catálogo filtrado (`/catalog?notes=<slug>&pos=<top|heart|base>`), e uma nota já filtrada aparece destacada.

- **Movimento:** altura animada com spring curta, chips entram com _stagger_ de até 40 ms, nada bloqueia o toque durante a animação.

- **Acessibilidade:** teclado (Enter/Espaço), foco visível, ordem de leitura Topo → Coração → Fundo, e animação desligada com `prefers-reduced-motion`.

**Inventário de componentes.** Cada componente em `components/ui` entra no `DESIGN_SYSTEM.md` com origem (shadcn, 21st.dev ou próprio), variantes e estados. Ordem de construção da Fase 3: tokens, Button, Input, Card, Pill/Chip, Dialog, Drawer, Tabs, Rating, Skeleton, EmptyState, ErrorState, Toast.

## 10. Motion e 21st.dev

O movimento serve a três coisas (confirmar uma ação, mostrar hierarquia, suavizar mudanças de estado), e os componentes do 21st.dev entram só depois de passar pela mesma curadoria que qualquer código do projeto.

**Tokens de motion** (em `src/lib/motion.ts`; componentes importam, não repetem números)

| Categoria       | Duração                                | Curva                                  | Uso                                                                    |
| --------------- | -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Microinteração  | 120–180 ms                             | `ease-out`                             | Pressão de botão (`scale 0.97`), seleção de filtro, toggle Tenho/Quero |
| Transição curta | 200–280 ms                             | `cubic-bezier(0.22, 1, 0.36, 1)`       | Troca de aba, expandir camada da pirâmide, toasts                      |
| Página          | 320–420 ms                             | mesma curva                            | `opacity` + `y` de 8–12 px na entrada; saída em até 200 ms             |
| Modal e drawer  | 240–320 ms                             | spring (`stiffness 380`, `damping 34`) | Dialog, Drawer, filtros em tela cheia                                  |
| Spring físico   | spring (`stiffness 400`, `damping 30`) | n/a                                    | Indicador de aba com `layoutId`, elementos arrastáveis                 |

**Regras**

1.  Animar só `transform` e `opacity`. Altura apenas quando necessário (pirâmide, accordion).

2.  _Stagger_ só em até 12 itens, com no máximo 40 ms entre eles. Listas longas aparecem de uma vez.

3.  Saídas nunca passam de 200 ms e nunca bloqueiam a próxima ação.

4.  `MotionConfig reducedMotion="user"` na raiz do app e `@media (prefers-reduced-motion: reduce)` no CSS: transformações e _shimmer_ dos skeletons desligam, mudanças de estado ficam como fade curto.

5.  Uma única biblioteca de animação: `motion/react`. Efeitos de CSS só para o que é simples (shimmer, press em elementos sem estado).

6.  No Playwright, `reducedMotion: 'reduce'` fica ligado por padrão para estabilizar os testes; há um teste dedicado com animação ligada para o fluxo da pirâmide.

**Fluxo de curadoria do 21st.dev**

O objetivo é aproveitar o acabamento dos componentes sem importar uma colcha de retalhos de estilos.

1.  **Partir de uma necessidade do inventário** (por exemplo, um Drawer de filtros), não de "o que é bonito hoje".

2.  **Escolher só o que for shadcn/Radix + Tailwind.** Isso garante acessibilidade de base e o mesmo sistema de tokens.

3.  **Inspecionar antes de colar:** licença, dependências extras, outra biblioteca de animação (`framer-motion` vira `motion/react`), outra biblioteca de ícones (vira Lucide), textos em inglês fixos.

4.  **Copiar para `components/ui/<nome>.tsx`** e trocar toda cor, raio, sombra e duração por tokens.

5.  **Passar o checklist de aceite:** teclado, foco visível, `aria-*`, `prefers-reduced-motion`, 360 px de largura, contraste, nenhum blur extra em lista.

6.  **Registrar no `DESIGN_SYSTEM.md`:** origem (URL), data, o que foi alterado.

7.  **Remover o que sobrou:** demos, dependências sem uso, estilos duplicados.

**Limites**

- Efeitos pesados (WebGL, partículas, fundos tipo aurora em tela cheia) no máximo um por página e nunca na lista do catálogo; medir LCP e INP antes de manter.

- Blocos prontos de landing/hero não entram _como estão_, porque é o caminho mais curto para o visual de template que a seção 9 proíbe. Use como referência de composição.

- O Magic MCP (geração dentro do editor) é um acelerador: o prompt deve apontar para `DESIGN_SYSTEM.md` e para os tokens, e a saída passa pelo mesmo fluxo de sete passos.

## 11. Estados de UI, PWA, acessibilidade e performance

O shell e as imagens vêm do Service Worker; os dados públicos do catálogo vêm do cache persistido do TanStack Query; os dados privados nunca ficam em disco.

**Estados de UI.** Toda tela que depende de dados assíncronos trata cinco estados: carregando, sucesso, vazio, erro (com ação de tentar de novo) e offline. Um componente único (`AsyncBoundary`) padroniza isso. Skeletons têm as mesmas dimensões do conteúdo final (proporção de imagem fixa, altura de linha igual), o que mantém o CLS abaixo de 0,1. Spinner central sozinho não é aceito.

**Manifest e instalação**

- `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color` e `background_color` iguais aos tokens `background`.

- Ícones 192 e 512 px, mais um 512 _maskable_; `apple-touch-icon` de 180 px.

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` e `env(safe-area-inset-*)` em navbar, bottom navigation, drawers e modais.

- **Android/Chrome:** botão próprio de instalar, acionado pelo evento `beforeinstallprompt`.

- **iOS/Safari:** não existe esse evento; uma folha explicativa mostra "Compartilhar → Adicionar à Tela de Início".

**Service Worker (`vite-plugin-pwa`, `registerType: 'prompt'`)**

| O que                                  | Estratégia                           | Observação                                                          |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| JS, CSS, fontes, ícones, `index.html`  | Precache                             | App shell abre offline                                              |
| Imagens do Storage (`perfume-images`)  | `CacheFirst`, até 100 itens, 30 dias | Só bucket público                                                   |
| Chamadas ao Supabase (REST, RPC, Auth) | `NetworkOnly`                        | Nada de dados privados no cache do SW; RPC é `POST` e não cacheável |

Com `prompt`, uma atualização do app aparece como toast "Nova versão disponível" com botão Atualizar, em vez de recarregar a tela no meio de uma ação.

**Offline e privacidade**

- O catálogo offline vem de `persistQueryClient` (storage assíncrono em IndexedDB), gravando apenas queries com chave `['public', ...]` e status de sucesso, com validade de 7 dias e `buster` atrelado à versão do app.

- Queries \['private', userId, ...\] não são persistidas. No SIGNED_OUT: removeQueries({ queryKey: \['private'\] }); o cache persistido público permanece para que o catálogo continue disponível offline. Não há dados privados persistidos para limpar.

- Offline, o app mostra um banner, serve o que está em cache e **desabilita as mutations** com explicação (adicionar à coleção, definir Perfume do Dia, avaliar). Não há fila de escrita no MVP. Ao voltar a conexão, o TanStack Query refaz as consultas ativas.

**Acessibilidade (meta: WCAG 2.2 AA)**

- Contraste de 4,5:1 para texto e 3:1 para componentes de interface; áreas de toque de pelo menos 44×44 px.

- `lang="pt-BR"`, _skip link_, landmarks, foco visível com anel na cor `primary`, tudo operável por teclado.

- Formulários com `label` real, erros ligados por `aria-describedby` e anunciados em região `aria-live`.

- Avaliação por estrelas implementada como grupo de rádios (setas do teclado), não como `span` clicável; botões só de ícone com `aria-label`.

- Dialogs, popovers e selects vêm de Radix (foco preso e devolvido corretamente); toasts com `role="status"`.

- `prefers-reduced-motion` e `prefers-reduced-transparency` respeitados; zoom de 200% sem perda de conteúdo.

**Performance**

- **Metas (p75, mobile, rede 4G simulada):** LCP \< 2,5 s, CLS \< 0,1, INP \< 200 ms, medidas com Lighthouse CI no pipeline.

- **JavaScript:** orçamento inicial sugerido de 200 KB gzip na rota de entrada, a ajustar após a primeira medição; rotas com `lazy()`, bibliotecas pesadas carregadas sob demanda.

- **Fontes:** só os pesos usados, subset latino, `font-display: swap`.

- **LCP:** imagem do hero com `fetchpriority="high"`; imagens abaixo da dobra com `loading="lazy"`.

**Imagens.** Três tamanhos por perfume (`thumb` 320 px, `medium` 640 px, `large` 1280 px) em WebP ou AVIF, usados com `srcset` e `sizes`, e largura e altura declaradas para não deslocar o layout. Se o plano do Supabase incluir transformação de imagens, ela gera os tamanhos sob demanda; se não, os três arquivos são gerados no seed e enviados ao bucket (`<slug>/thumb.webp` etc.).

## 12. Testes e QA

As regras de segurança e de negócio são testadas **no banco** (pgTAP) e por integração com dois usuários reais; o Playwright cobre fluxos de interface, não segurança. A v1.0 colocava o teste "usuário A acessa dados do B" no E2E, onde ele só provaria que a tela esconde dados.

**Camadas**

| Camada         | Ferramenta                                 | Cobre                                                                                                         | Roda                                                     |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Banco          | pgTAP (`supabase test db`)                 | RLS, constraints, funções, view, enums                                                                        | Todo PR                                                  |
| Unitário       | Vitest + Testing Library                   | Schemas Zod, utilitários, serialização URL↔filtros, mapeamento de erros, services com cliente simulado, hooks | Todo PR                                                  |
| Integração     | Vitest contra Supabase local               | Usuário A vs B pelo SDK com `anon key` e sessão real                                                          | Todo PR                                                  |
| E2E            | Playwright                                 | Fluxos críticos em vários viewports, offline, recuperação de senha                                            | Todo PR (suite completa em 2 projetos, smoke nos demais) |
| Acessibilidade | `@axe-core/playwright` + testes de teclado | Páginas principais, pirâmide, dialogs, formulários                                                            | Todo PR                                                  |
| Desempenho     | Lighthouse CI                              | LCP, CLS, INP/TBT, orçamento de JS                                                                            | PR para `main`                                           |

**Casos obrigatórios no banco e na integração (RLS)**

- Usuário A não lê, não altera e não apaga linhas de B em `profiles`, `collection_items`, `daily_perfumes` e `perfume_reviews`.

- Inserir com `user_id` de outro usuário é rejeitado.

- **RN02:** segunda linha para o mesmo `(user_id, perfume_id)` falha; trocar `wanted` → `owned` mantém uma linha.

- **RN03:** avaliar com perfume em `owned` passa; avaliar com histórico de Perfume do Dia passa; avaliar perfume em `wanted` sem histórico é rejeitado; editar avaliação existente passa mesmo após sair de `owned`.

- **RN05:** rating 0 e 6 são rejeitados.

- **RN06:** `set_daily_perfume` chamado duas vezes no mesmo dia mantém uma linha; `INSERT` direto em `daily_perfumes` é negado; a data respeita `profiles.timezone` (testar com `Pacific/Kiritimati` e `Pacific/Pago_Pago`, que têm datas diferentes no mesmo instante).

- **RN07:** usuário comum não escreve em `perfumes`; usuário com `app_metadata.role = 'admin'` escreve; alterar `user_metadata.role` **não** concede acesso.

- **RN08:** `perfume_review_stats` devolve apenas agregados; consulta direta a `perfume_reviews` por `anon` retorna zero linhas.

**Fluxos E2E críticos**

- **Autenticação:** cadastro, login válido, login inválido (mensagem em português, não o código do Supabase), logout, esqueci a senha até redefinir (e-mail capturado pelo Mailpit do Supabase local), rota privada redirecionando para login e voltando.

- **Catálogo:** abrir, buscar sem acento, filtrar por nota, por posição, combinar filtros, URL restaurando o estado, abrir detalhes, slug inexistente no 404.

- **Coleção:** adicionar como Quero, como Tenho, alternar nos dois sentidos, remover; contagem de linhas permanece 1.

- **Perfume do Dia:** definir, trocar no mesmo dia, histórico exibido.

- **Avaliação:** avaliar `Tenho`, avaliar perfume do histórico, bloqueio com mensagem clara para perfume sem direito, editar.

- PWA/offline: contra o build de produção (vite build + vite preview), com Service Worker ativo: shell abre offline, catálogo visitado antes aparece offline, mutations desabilitadas, após logout nenhum dado privado aparece offline, enquanto o catálogo público previamente visitado continua disponível; teste do manifest (campos e ícones).

**Matriz de dispositivos (Playwright)**

| Projeto                  | Engine / viewport        | Escopo                          |
| ------------------------ | ------------------------ | ------------------------------- |
| Desktop Chromium         | 1280×800                 | Suite completa                  |
| Android                  | `Pixel 7` (Chromium)     | Suite completa                  |
| iPhone                   | `iPhone 14` (WebKit)     | Smoke + coleção + PWA/offline   |
| Mobile pequeno           | 360×780 (referência P30) | Smoke + layout e safe areas     |
| Tablet                   | `iPad Mini`              | Smoke + layout                  |
| Desktop Firefox e WebKit | 1280×800                 | Smoke (auth, catálogo, coleção) |

O comportamento real de instalação do PWA no iOS e no Android não é totalmente reproduzível em automação: antes de cada release, uma passagem manual em um iPhone e um Android (instalar, abrir offline, atualizar versão).

**Dados e estabilidade.** Seed determinístico; cada teste cria o próprio usuário (e-mail com UUID) para rodar em paralelo; confirmação de e-mail desligada no ambiente local; `reducedMotion: 'reduce'` por padrão. Regressão visual com screenshots é opcional e só vale a pena depois que o design estabilizar.

**Critérios de aprovação.** PR só entra com lint, `tsc --noEmit`, testes de banco, unitários, integração, E2E e axe passando, e sem violações novas de acessibilidade. Todo bug corrigido ganha um teste que o reproduz.

## 13. Documentação, instruções para IA, CI e qualidade

O repositório mantém seis documentos em `docs/` e **um único arquivo de instruções para as IAs**. Menos arquivos, todos curtos, para que sejam lidos e se mantenham atualizados.

**Documentos do projeto**

| Arquivo                 | Conteúdo                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `docs/PRODUCT.md`       | Esta especificação: escopo, regras RN01–RN08, Definition of Done                                                |
| `docs/ARCHITECTURE.md`  | Camadas, pastas, query keys, rotas, decisões e dependências com justificativa, padrões de service/hook/mutation |
| `docs/DATABASE.md`      | Diagrama, tabelas, enums, índices, funções, policies                                                            |
| `docs/SECURITY.md`      | Autenticação, RLS, admin, Storage, secrets, modelo de ameaça, limitação da RN03                                 |
| `docs/DESIGN_SYSTEM.md` | Tokens, tipografia, motion, glassmorphism, pirâmide, inventário de componentes com origem                       |
| `docs/QA.md`            | Camadas de teste, casos críticos, matriz de dispositivos, critérios de aprovação                                |

**O que muda em relação aos arquivos de IA da v1.0**

- `agents.md` com nove personas, `skills.md` e `qa.md` na raiz saem: personas genéricas pouco alteram o resultado, e catálogos de padrões duplicam o que já está em `ARCHITECTURE.md` e `DESIGN_SYSTEM.md`, divergindo com o tempo.

- Entram `AGENTS.md` (fonte única, lido por vários agentes) e, se você usar Claude Code e Gemini CLI, dois arquivos de uma linha (`CLAUDE.md` e `GEMINI.md`) que apontam para ele. Confira na documentação de cada ferramenta a sintaxe de importação (`@AGENTS.md`).

- O que realmente melhora um site bonito é o `DESIGN_SYSTEM.md` bem escrito, referenciado pelo `AGENTS.md`.

- Se uma tarefa se repetir muito (por exemplo, "criar componente de UI"), vira uma _skill_ de verdade depois, em vez de um `skills.md` genérico no início.

**Rascunho do `AGENTS.md`**

```markdown
# AGENTS.md — perfume-pwa

## Fonte de verdade

docs/PRODUCT.md (regras RN01–RN08), DATABASE.md, SECURITY.md,
ARCHITECTURE.md, DESIGN_SYSTEM.md, QA.md. Leia o relevante antes de mexer.
Mudança estrutural = atualizar o doc no mesmo PR.

## Arquitetura

Page → Component → Hook → Service → Supabase.
Só services importam o cliente do Supabase. Sem regra de negócio em componente.
Query keys: ['public', ...] (persistível) e ['private', userId, ...] (nunca persistir).
Não trocar a stack nem adicionar dependência sem justificar em ARCHITECTURE.md.

## Segurança (inegociável)

- RLS é a autorização. Nunca service_role no front. Nunca user_metadata para papéis.
- Nunca exibir mensagem crua do Supabase: usar constants/errors.ts.
- Alterou migration ou policy → atualizar os testes pgTAP.

## UI (ler docs/DESIGN_SYSTEM.md antes de criar ou alterar qualquer tela)

- Só tokens (cores, radius, sombras, motion de lib/motion.ts). Sem hex nem px soltos.
- Procurar primeiro em components/ui. Componente do 21st.dev só pelo fluxo de curadoria.
- Animação só com motion/react, só transform e opacity, respeitando reduced motion.
- Todo componente assíncrono: loading (skeleton equivalente), vazio, erro e offline.
- Um momento de assinatura por tela; o resto é calmo.
- Texto visível em pt-BR; código em inglês.

## Código

TypeScript strict, sem any. ESLint e Prettier limpos. Handlers como arrow functions.
Não desabilitar teste ou regra de lint para passar.

## Pronto quando

Funciona, tem os estados, é responsivo (360 px+), acessível, passa em tsc/eslint/testes
e não enfraquece nenhuma policy de RLS.
```

**Git.** Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `style:`, `chore:`). Para um projeto solo, o fluxo é `main` protegida mais branches curtas `feat/*`, `fix/*` e `test/*` com PR; a branch `develop` da v1.0 sai.

**CI/CD (GitHub Actions + Vercel), configurado já na Fase 1**

1.  **Em todo PR:** lint, `tsc --noEmit`, testes unitários, banco (`supabase start` + pgTAP + integração), build, E2E contra o build de produção, axe.

2.  **PR para `main`:** Lighthouse CI.

3.  **Deploy do frontend:** integração Git da Vercel (preview por PR, produção no merge).

4.  **Deploy do banco:** `supabase db push` em workflow manual e protegido; nunca automático a partir de PR.

**Definition of Done**

- [ ] Funciona e está integrada ao backend

- [ ] Tem loading, vazio, erro e offline quando aplicável

- [ ] Responsiva a partir de 360 px e acessível (teclado, foco, contraste)

- [ ] Motion segue os tokens e respeita reduced motion

- [ ] `tsc`, ESLint e testes passam; fluxos críticos têm E2E

- [ ] Qualquer mudança em banco tem migration e teste pgTAP; RLS não foi enfraquecida

- [ ] Componentes novos estão no inventário do `DESIGN_SYSTEM.md`

- [ ] Documentação atualizada quando há impacto arquitetural

**Riscos e mitigação**

| Risco                                                   | Mitigação                                                                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Código gerado por IA sem revisão                        | Testes obrigatórios, `AGENTS.md` curto, PRs revisados por você antes do merge                                                 |
| Visual de colcha de retalhos por mistura de componentes | Fluxo de curadoria do 21st.dev, tokens únicos, inventário com origem                                                          |
| Segurança só no frontend                                | RLS, funções no banco, testes pgTAP e de integração                                                                           |
| Dados privados em cache do dispositivo                  | Namespaces `public`/`private`, limpeza no logout, `NetworkOnly` no SW                                                         |
| Animação e blur pesados em Android intermediário        | Regras de motion, limites de vidro, medição de INP em CI e em aparelho real                                                   |
| Direitos de imagem dos frascos                          | Fotos próprias, liberadas pela marca ou placeholders consistentes                                                             |
| Demo fora do ar                                         | Projetos do plano gratuito do Supabase podem ser pausados por inatividade; conferir o projeto antes de apresentar o portfólio |
| Crescer o escopo (admin, social, recomendação)          | Escopo do MVP fechado na seção 2; ideias novas vão para uma lista pós-MVP                                                     |

## 14. Roadmap

<img src="media/image.png" style="width:6in;height:3.15178in" alt="roadmap · 12 fases, 4 blocos, 4 critérios de passagem" />

roadmap · 12 fases, 4 blocos, 4 critérios de passagem

Os critérios A a D valem como portões: o bloco seguinte só começa quando o anterior cumpre o seu. As fases 1 e 2 já incluem CI, deploy de preview e a configuração-base do PWA; a fase 11 valida o PWA completo (offline, instalação) e as metas de performance.

> **Nota (Fase 2):** o preview por PR do Gate A ainda está pendente por falta de hospedagem (Vercel). Até lá, o CI roda `quality` e `database`, sem preview.
