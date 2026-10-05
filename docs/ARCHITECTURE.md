# Arquitetura

## Dependências

| Dependência            | Tipo | O que resolve                                                                                             | Por que o que já existe não resolve                                                                                                                    |
| ---------------------- | ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase` (CLI)       | dev  | Sobe o Supabase local (Docker), aplica migrations/seed e roda os testes pgTAP (`supabase test db`).       | O SDK `@supabase/supabase-js` só fala com um projeto já existente; não gerencia banco local nem migrations.                                            |
| `radix-ui`             | prod | Primitivas acessíveis (Dialog, Tabs, Slot): foco preso e devolvido, teclado, `aria-*`. Base do shadcn/ui. | Escrever focus trap e navegação por teclado à mão seria mais código e mais risco de acessibilidade. Um pacote só em vez de vários `@radix-ui/react-*`. |
| `@fontsource/fraunces` | prod | Fonte serifada dos títulos (pesos 500 e 600, subset latino), empacotada no app.                           | Substitui a Cormorant Garamond da Fase 1 (pacote removido). Sem CDN, funciona offline.                                                                 |

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
