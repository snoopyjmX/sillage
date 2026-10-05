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
