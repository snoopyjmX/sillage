# Arquitetura

## Dependências

| Dependência            | Tipo | O que resolve                                                                                                           | Por que o que já existe não resolve                                                                                                                    |
| ---------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase` (CLI)       | dev  | Sobe o Supabase local (Docker), aplica migrations/seed e roda os testes pgTAP (`supabase test db`).                     | O SDK `@supabase/supabase-js` só fala com um projeto já existente; não gerencia banco local nem migrations.                                            |
| `radix-ui`             | prod | Primitivas acessíveis (Dialog, Tabs, DropdownMenu, Slot): foco preso e devolvido, teclado, `aria-*`. Base do shadcn/ui. | Escrever focus trap e navegação por teclado à mão seria mais código e mais risco de acessibilidade. Um pacote só em vez de vários `@radix-ui/react-*`. |
| `@fontsource/fraunces` | prod | Fonte serifada dos títulos (pesos 500 e 600, subset latino), empacotada no app.                                         | Substitui a Cormorant Garamond da Fase 1 (pacote removido). Sem CDN, funciona offline.                                                                 |

**Decisões da Fase 3 (o que NÃO foi instalado)**

- **`next-themes`:** feito para Next. O tema usa um `ThemeProvider` próprio (`components/layout`), no estilo do guia do shadcn para Vite, com script inline no `index.html` contra o flash de tema.
- **`tw-animate-css`:** o shadcn usa para animar Dialog/Tabs. Não instalado; as animações usam `motion/react`, a única biblioteca de animação do projeto.
- **`vaul` (Drawer do shadcn):** não instalado; o Drawer é próprio, sobre Radix Dialog + `motion/react`.
- **`get-contrast` e similares:** a fórmula WCAG está em `scripts/verify-contrast.js`, sem dependências.
- **CLI do shadcn:** não foi instalada nem executada com `init` (o init sobrescreveria tokens e CSS e traz presets com outras fontes). O `components.json` foi escrito à mão e o código oficial dos componentes foi consultado com `npx shadcn add --view`/`--dry-run`, que não escrevem nada.
- **`sonner`:** já estava no projeto desde a Fase 1 (Toast do shadcn); só ganhou o wrapper `Toaster` temado.

## Decisões da Fase 4 (catálogo, rotas e E2E)

| Dependência            | Tipo | O que resolve                                                                          | Por que o que já existe não resolve                                                                                                  |
| ---------------------- | ---- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@playwright/test`     | dev  | E2E do catálogo contra o build de produção, em Desktop Chromium e Pixel 7.             | Vitest + jsdom não renderizam layout, gaveta, foco nem teclado reais.                                                                |
| `@axe-core/playwright` | dev  | Auditoria WCAG (contraste, ARIA, nomes) em páginas reais, em claro e escuro, a 360 px. | O jsdom não calcula contraste nem composição de camadas (achou, por exemplo, o contraste do texto de apoio sobre o vidro da gaveta). |

**O que NÃO foi instalado**

- **`react-helmet-async`:** o React 19 move `<title>` e `<meta>` renderizados em qualquer componente para o `<head>`. Verificado em teste de unidade (`document.title`) e no E2E contra o build de produção (`toHaveTitle`). Sem a biblioteca.
- **`@testing-library/user-event`:** `fireEvent` basta para os testes de unidade; o fluxo real de teclado e mouse fica no Playwright.
- **Persistência do cache (`persistQueryClient`):** é da Fase 11; o `QueryClient` desta fase só vive em memória. As chaves já seguem `['public', ...]` (fábrica em `lib/queryKeys.ts`).

**Estrutura:** `src/lib/supabase.ts` (único cliente; exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, com erro claro se faltarem), `queryClient.ts`, `queryKeys.ts`; `services/` (`perfumeService`, `referenceService`) → `hooks/` (`usePerfumes`, `useBrands`, `useNotes`, `useCatalogFilters`) → `components/` → `pages/`; rotas em `routes/router.tsx` (data router com `lazy()`). Testes E2E em `e2e/` (`npm run e2e`), com `tsconfig.e2e.json` próprio.

## Decisões da Fase 6 (autenticação)

- **Sem dependência nova.** `react-hook-form` e `zod` já estavam instalados; a ponte entre eles é `lib/zodResolver.ts` (~20 linhas), em vez de `@hookform/resolvers`. Os testes de UI usam `fireEvent`, sem `user-event`.
- **Só o service toca em `supabase.auth`.** `authService` expõe `getSession` e `onAuthStateChange` além das ações; o `AuthProvider` (`contexts/AuthContext.tsx`) fica dentro do router (`routes/AuthLayout.tsx`) porque navega.
- **Navegação do logout depois da renderização.** `SIGNED_OUT` e `PASSWORD_RECOVERY` guardam o destino em estado e o `useEffect` do provider navega. Efeitos de filhos rodam antes dos do pai, então a Home vence o redirecionamento da `RequireAuth` (sem isso o logout em `/profile` acabava em `/login?redirect=/profile`).
- **`?redirect=` só aceita caminho interno** (`lib/redirect.ts`): sem `//host`, sem `\`, sem voltar para telas de auth.
- **Caixa de e-mail do E2E é o Mailpit** (`http://127.0.0.1:54324`, `/api/v1/search` e `/api/v1/message/:id`). A CLI atual substituiu o Inbucket e `/api/v1/mailbox` não existe mais; ver `e2e/mailbox.ts`.
- **`supabase/config.toml` (só local):** `site_url` e `additional_redirect_urls` com `localhost:5173` e `localhost:4173` (sem isso o link de recuperação cai na `site_url`), senha mínima de 8, limites de e-mail e de login mais altos para o E2E rodar em paralelo.

## Decisões da Fase 8 (Perfume do Dia e pacote 21st.dev)

| Dependência              | Tipo | O que resolve                                                    | Por que o que já existe não resolve                                                                    |
| ------------------------ | ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `canvas-confetti`        | prod | Feedback visual de celebração premium (Confete) após o cadastro. | `motion/react` anima elementos do DOM; centenas de partículas com física pedem um `<canvas>` dedicado. |
| `@types/canvas-confetti` | dev  | Tipos da lib (ela não traz os próprios).                         | TypeScript strict, sem `any`.                                                                          |

- **Confete:** `components/ui/confetti.tsx` lê as cores dos tokens (`--primary` etc.) em tempo de execução e usa `disableForReducedMotion`. Dispara uma vez, no sucesso do cadastro.
- **Perfume do Dia:** `dailyService` lê `daily_perfumes` (tabela com RLS de dono; não é view) e `profiles.timezone`. A data de "hoje" é calculada no fuso do perfil, a mesma regra de `set_daily_perfume` (RN06).

## Decisões da Fase 9 (avaliações)

- **Sem dependência nova.** O formulário usa `react-hook-form` + `zod` (já presentes) e o `Rating` da Fase 3.
- **Leitura pública por views, escrita só do dono.** `reviewService` lê `perfume_review_stats` (resumo) e `perfume_reviews_public` (lista, sem `user_id`) e escreve em `perfume_reviews`. Detalhes em `docs/DATABASE.md` e `docs/SECURITY.md`.
- **Salvar = `update` por `id` se já existe, senão `insert`** (e, se outra aba criou no meio, vira `update`): o `WITH CHECK` da RN03 roda antes do conflito, então um `upsert` cego impediria editar depois de sair de "Tenho".
- **Optimistic update** do resumo e da avaliação própria (`useReviews`); a lista pública espera o servidor, que sabe autor e data.
- **Chaves:** `['public','perfumes',perfumeId,'reviews']` e `['private',userId,'reviews',perfumeId]`.

## Decisões da Fase 10 (Nez e similaridade)

- **Edge Function `nez-ai`** (Deno, `supabase/functions/nez-ai`): `verify_jwt = false` no gateway e a validação é feita no código com `auth.getUser(token)`, para devolver 401 em JSON no nosso formato. SDK `npm:@google/genai`; modelo em `GEMINI_MODEL` (padrão `gemini-2.5-flash`); secret `GEMINI_API_KEY` só no servidor (local: `supabase/functions/.env` ou `supabase secrets set`). Erros do provedor vão para o log e o front recebe só um código estável (`nez_failed`).
- **Front:** `aiService.askNez` (único ponto que chama a função), `useAskNez` (mutation: a resposta é privada, nunca persistida), `NezProvider` no `AppShell` e `useNezPerfumeContext` para a página de detalhes informar o perfume em foco (notas e famílias). O botão do Nez é o `DrawerTrigger` do drawer, para o foco voltar a ele ao fechar. Só aparece para quem está logado.
- **Similaridade:** `useSimilarPerfumes` (chave pública `['public','perfumes',id,'similar']`) e a seção "Fragrâncias com a mesma alma" abaixo das avaliações. Detalhes da função em `DATABASE.md`.
- **E2E:** `e2e/nez.spec.ts` intercepta `**/functions/v1/nez-ai` com `page.route`; o teste nunca chama o Gemini. Os cards de similares também têm botão de coleção, então testes que miram o botão do perfume da página usam `.first()`.
