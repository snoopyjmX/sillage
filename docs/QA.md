# QA

Matriz de testes por fase. A estratégia geral está em `docs/PRODUCT.md`, Seção 12: regras de banco no pgTAP, regras puras no Vitest, fluxos de interface no Playwright (dois viewports, com axe).

## Fase 14D: Home, clima e sugestão do dia

| Camada                  | O que cobre                                                                                                                                                                                                                               | Onde                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Unitário (regras puras) | Faixas e frases, famílias em destaque, faixa do perfume, adequação, rótulo do Rastro, hash e escolha estável, cidade pelo fuso, resultado do geocoding, arredondamento, variantes de imagem                                               | `src/lib/climate.test.ts`, `location.test.ts`, `images.test.ts`, `perfume.test.ts`, `format.test.ts` |
| Unitário (service)      | `fetch` mockado: sucesso, 4xx, 5xx, 429, JSON inválido, fora do formato, sem rede, timeout; mensagens só de `constants/errors.ts`                                                                                                         | `src/services/weatherService.test.ts`                                                                |
| Componente / página     | Barra de clima, "Clima indisponível", erro com retry, sugestão com medidores e ações, atribuição no Footer                                                                                                                                | `src/pages/HomePage.test.tsx`, `Footer.test.tsx`                                                     |
| E2E                     | Open-Meteo **sempre interceptado** (`e2e/fixtures.ts`): clima, sugestão estável, "Vestir hoje", erro e retry, cidade não resolvida, geolocalização por clique sem gravar coordenadas, descobertas, atribuição, axe (claro, 360 e 1280 px) | `e2e/weather.spec.ts`, `e2e/home.spec.ts`                                                            |
| Banco                   | A fase não mexe em migration nem policy; `supabase test db` precisa seguir verde                                                                                                                                                          | `supabase/tests/database`                                                                            |

Regra: nenhum teste usa a rede real do Open-Meteo.
