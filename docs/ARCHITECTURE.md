# Arquitetura

## Dependências

| Dependência            | Tipo | O que resolve                                                                                                                            | Por que o que já existe não resolve                                                                                                                    |
| ---------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sharp`                | dev  | `scripts/process-images.mjs`: recorta para 800×800, converte para WebP (qualidade 80) as fotos dos perfumes antes de subirem ao Storage. | Nenhuma API do navegador ou do Node processa imagem; fazer à mão no editor não é reprodutível. Só roda localmente, nunca entra no bundle.              |
| `supabase` (CLI)       | dev  | Sobe o Supabase local (Docker), aplica migrations/seed e roda os testes pgTAP (`supabase test db`).                                      | O SDK `@supabase/supabase-js` só fala com um projeto já existente; não gerencia banco local nem migrations.                                            |
| `radix-ui`             | prod | Primitivas acessíveis (Dialog, Tabs, DropdownMenu, Slot): foco preso e devolvido, teclado, `aria-*`. Base do shadcn/ui.                  | Escrever focus trap e navegação por teclado à mão seria mais código e mais risco de acessibilidade. Um pacote só em vez de vários `@radix-ui/react-*`. |
| `@fontsource/fraunces` | prod | Fonte serifada dos títulos (pesos 500 e 600, subset latino), empacotada no app.                                                          | Substitui a Cormorant Garamond da Fase 1 (pacote removido). Sem CDN, funciona offline.                                                                 |

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
- **Persistência do cache (`persistQueryClient`):** feita na Fase 11 (ver abaixo); nesta fase o `QueryClient` só vivia em memória. As chaves já seguem `['public', ...]` (fábrica em `lib/queryKeys.ts`).

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

- **Edge Function `nez-ai`** (Deno, `supabase/functions/nez-ai`): `verify_jwt = false` no gateway e a validação é feita no código com `auth.getUser(token)`, para devolver 401 em JSON no nosso formato. SDK `npm:@google/genai`; modelo em `GEMINI_MODEL` (padrão `gemini-3.5-flash-lite`, reserva `gemini-3.5-flash`, `thinkingLevel` mínimo, histórico da conversa (últimas 6 mensagens) como turnos do chat, retry só em erro transitório, prazo de 20 s); secret `GEMINI_API_KEY` só no servidor (local: `supabase/functions/.env` ou `supabase secrets set`). Erros do provedor vão para o log e o front recebe só um código estável (`nez_failed`).
- **Front:** `aiService.askNez` (único ponto que chama a função), `useAskNez` (mutation: a resposta é privada, nunca persistida), `NezProvider` no `AppShell` e `useNezPerfumeContext` para a página de detalhes informar o perfume em foco (notas e famílias). O botão do Nez é o `DrawerTrigger` do drawer, para o foco voltar a ele ao fechar. Só aparece para quem está logado.
- **Similaridade:** `useSimilarPerfumes` (chave pública `['public','perfumes',id,'similar']`) e a seção "Fragrâncias com a mesma alma" abaixo das avaliações. Detalhes da função em `DATABASE.md`.
- **E2E:** `e2e/nez.spec.ts` intercepta `**/functions/v1/nez-ai` com `page.route`; o teste nunca chama o Gemini. Os cards de similares também têm botão de coleção, então testes que miram o botão do perfume da página usam `.first()`.

## Decisões da Fase 11 (PWA e offline)

| Dependência                            | Tipo | O que resolve                                                                                                       | Por que o que já existe não resolve                                                                                            |
| -------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `vite-plugin-pwa`                      | dev  | Gera manifest e Service Worker (Workbox) no build; `registerType: 'prompt'`.                                        | Escrever o SW e o precache à mão exigiria listar os arquivos com hash a cada build.                                            |
| `workbox-window`                       | dev  | Peer do plugin: registro e ciclo de atualização do SW (`virtual:pwa-register`).                                     | Exigido pelo `vite-plugin-pwa`.                                                                                                |
| `@tanstack/react-query-persist-client` | prod | `PersistQueryClientProvider`: restaura e grava o cache do TanStack Query com `maxAge`, `buster` e filtro de chaves. | O `QueryClient` só vive em memória; sem isso o catálogo não sobrevive a recarregar a página offline.                           |
| `idb-keyval`                           | prod | Storage assíncrono em IndexedDB para o persister (~600 B).                                                          | `localStorage` é síncrono e limitado a ~5 MB; a spec (Seção 11) pede IndexedDB. Não precisa de `query-sync-storage-persister`. |

**Service Worker (`vite.config.ts`)**

- **Precache** do shell: JS, CSS, fontes (`@fontsource` empacotadas), ícones e `index.html` (com `navigateFallback`), então o app abre offline.
- **`CacheFirst`** para imagens públicas do Storage (`/storage/v1/object/public/perfume-images/`): até 100 itens e 30 dias.
- **`NetworkOnly`** para `/rest/v1`, `/auth/v1` e `/functions/v1` (REST, RPC, Auth e Edge Functions): nenhum dado privado fica no cache do SW.
- `registerType: 'prompt'`: uma versão nova mostra o toast "Nova versão disponível" com o botão Atualizar (`lib/pwa.ts`). O SW só é registrado em produção (`import.meta.env.PROD`).
- Ícones 192, 512 e 512 _maskable_ em `public/`, gerados a partir de `docs/design/favicon.png` (recorte do tile, escala; o maskable tem o ícone na zona segura sobre o fundo creme).

**Persistência: divisão rígida `public` × `private`** (`lib/persist.ts`)

| Chave                      | Memória | IndexedDB | Observação                                                                                                          |
| -------------------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `['public', ...]`          | sim     | **sim**   | Só com status de sucesso; validade de 7 dias; `buster` = versão do app + instante do build.                         |
| `['private', userId, ...]` | sim     | **nunca** | `shouldPersistQuery` exige `queryKey[0] === 'public'`. No `SIGNED_OUT`, `removeQueries({ queryKey: ['private'] })`. |

- `gcTime` padrão de 7 dias em `queryClient.ts` (precisa ser ≥ ao `maxAge`, senão o cache restaurado é coletado).
- Testes: `lib/persist.test.ts` (filtro) e `e2e/pwa-offline.spec.ts` (o IndexedDB não contém `"private"` nem o e-mail do usuário).

**UX offline**

- `useOnlineStatus` (já existente) alimenta o `OfflineBanner` (AppShell), o `OfflineHint` (tooltip nos botões de escrita: Coleção e Avaliar) e o estado `aria-disabled` do `NezFab`. Não há fila de escrita.
- Instalação: `InstallAppButton` (Navbar e menu do celular). O evento `beforeinstallprompt` é capturado em `lib/pwa.ts` (pode disparar antes do React montar); no iOS, uma folha explica "Compartilhar → Adicionar à Tela de Início".

## Decisões da Fase 14D (Home: clima, sugestão e descobertas)

- **Sem dependência nova e sem migration.** Fetch nativo com `AbortController` (8 s) e Zod, que já estavam no projeto.
- **Camadas:** `weatherService` (Open-Meteo, único arquivo que o chama) e `homeService` (sugestão e novidades) → hooks (`useWeather`, `useGeolocation`, `useProfileTimezone`, `useDailySuggestion`, `useRecentPerfumes`, `useWearToday`) → componentes só de apresentação (`WeatherBar`, `DailySuggestionCard`, `HomeHeader`, `RecentPerfumes`, `SimilarToToday`, `FamilyExplorer`) → `HomePage`.
- **Localização:** `useGeolocation` consulta a Permissions API uma vez ao montar (`granted` usa direto; sem a API, vale o aviso booleano de `lib/geoHint.ts`; `prompt` e `denied` nunca pedem sozinhos). Só o aviso `sillage-geo-hint` vai ao `localStorage`, nunca coordenadas (`docs/SECURITY.md`).
- **Perfil (14E):** `profileService` (lê e atualiza `display_name` e `timezone` do dono; 0 linhas afetadas é falha) e `dailyService.countDays` → hooks (`useProfile`, `useUpdateProfile`, `useProfileStats`, `useDailyCount`) → `ProfileAvatar`, `ProfileHeader`, `ProfileStats`, `ProfileForm`, `DangerZone` → `ProfilePage`. Chaves: `['private', userId, 'profile', 'detail']` e `['private', userId, 'daily', 'count']` (nunca persistidas); salvar invalida `profile` e `daily`. Regras puras em `lib/profile.ts` (iniciais, contagem) e schema em `schemas/profile.ts`. Sem dependência nova, migration ou mudança de policy.
- **Regras puras** em `src/lib` (`climate.ts`, `location.ts`, `images.ts`, `groupNotesByPosition` em `perfume.ts`) com teste unitário; números em `src/constants/climate.ts` e `src/constants/weather.ts`. As regras são a RN10 em `docs/PRODUCT.md`.
- **Query keys:** `['private', userId, 'weather', 'city' | 'current', ...]` e `['private', userId, 'profile', 'timezone']` (nunca persistidas); `['public', 'home', 'suggestion' | 'recent', ...]` (catálogo, persistível). A data da sugestão e as famílias entram na chave; o fuso do usuário não.
- **`perfumeService.search` ganhou o parâmetro `limit`** (padrão `PAGE_SIZE`; o teto da RPC é 100) para os 100 candidatos da sugestão. `dailyService` ganhou `getTimezone` e `setToday` (`set_daily_perfume`); `reviewService` expõe `getSummary`.
- **E2E:** `e2e/fixtures.ts` substitui o `test` do Playwright e dá a todo contexto respostas padrão do Open-Meteo; nenhum teste usa rede real.

## Decisões da Fase 14B (Landing e gate de rotas)

Sem dependência nova, sem migration e sem mudança de policy. O gate é só de interface (a RLS segue como estava; ver `docs/SECURITY.md`).

| Rota                                                     | Acesso             | Layout                       | Guarda                                        |
| -------------------------------------------------------- | ------------------ | ---------------------------- | --------------------------------------------- |
| `/`                                                      | pública            | `PublicLayout` ou `AppShell` | `RootEntry`: esqueleto, Landing ou Home       |
| `/login`, `/register`, `/forgot-password`                | só visitantes      | `AuthCard` (layout próprio)  | `GuestOnly` (logado volta ao destino)         |
| `/reset-password`                                        | via link do e-mail | `AuthCard` (layout próprio)  | nenhuma                                       |
| `/catalog`, `/perfumes/:slug`, `/collection`, `/profile` | privada            | `AppShell`                   | `RequireAuth` (visitante vai a `/?redirect=`) |
| `*` (404)                                                | privada            | `AppShell`                   | `RequireAuth`                                 |

- **`RootEntry`** (`routes/RootEntry.tsx`) decide a tela de `/` pelo `status` da sessão: `loading` mostra `AuthPending` (nunca a Landing para quem já está logado), `authenticated` mostra a Home no `AppShell` e `unauthenticated` mostra a Landing no `PublicLayout`. `AppShell` e `PublicLayout` aceitam `children` para esse caso e usam `<Outlet />` nas demais rotas.
- **`PublicLayout`** é pequeno de propósito: `Navbar` com a pílula em modo `landing`, `OfflineBanner` (sem a promessa de catálogo salvo), `Footer`. Não carrega a navegação privada nem o Nez.
- **`lib/redirect`**: `buildGatePath` (destino para `/?redirect=`) e `withRedirect` (repassa o destino saneado para `/login` e `/register`). Regra pura, com teste.
- A Landing é estática (não consulta o banco), então abre offline pelo shell em precache. A vitrine opcional de perfumes reais ficou de fora.
- **Lighthouse CI** (`lighthouserc.json`) audita `/`, `/login` e `/register`. O workflow `.github/workflows/lighthouse.yml` não muda.

## Decisões da Fase 14F (fechamento e arte de login/cadastro)

Sem dependência nova, sem migration e sem mudança de policy.

- **Estrutura de assets:** `public/auth-art/` guarda as variantes WebP da arte decorativa das telas de auth, geradas por `scripts/process-auth-art.mjs` a partir de `docs/design/arte login-cadastro.jpg` (o original não é servido). `public/` segue como único lugar de imagens estáticas; não existe `src/assets/`.
- **Carregamento:** a `<img>` da arte só é montada a partir de `md` (`useMediaQuery`), então o celular não a baixa. A arte é decorativa e de baixa prioridade (`fetchPriority="low"`).
- **PWA:** a arte fica **fora do precache** (o `globPatterns` do Workbox não inclui `webp`) e entra por `runtimeCaching` `StaleWhileRevalidate` (`auth-art`). Motivo: é decorativa, só aparece para o visitante e não deve inflar a instalação nem o precache obrigatório. Sem a imagem, o painel mostra a superfície de token.
- **Logo:** `Brand` (em `components/layout/Navbar.tsx`) passou a ser exportada e é a única logo, usada também no topo do formulário do `AuthCard`.
- **Layouts:** as telas de auth usam o layout próprio do `AuthCard`, fora do `PublicLayout` (que ficou só para a Landing).
