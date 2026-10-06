# Sillage

**Produção:** https://sillage-ashy-gamma.vercel.app/

PWA de catálogo e coleção de perfumaria de nicho, em português (BR), mobile-first. Explore perfumes pela pirâmide olfativa, monte sua coleção (Tenho / Quero), avalie e pergunte ao Nez, o mestre perfumista virtual. Instalável no celular e com o catálogo disponível offline.

## Stack

- **Frontend:** React 19, Vite, TypeScript (strict), React Router, TanStack Query
- **UI:** Tailwind CSS v4, tokens CSS próprios, Radix, Motion
- **Backend:** Supabase (PostgreSQL com RLS, Auth, Storage, Edge Functions em Deno)
- **Qualidade:** ESLint, Prettier, Vitest, Playwright + axe, pgTAP, Lighthouse CI
- **Deploy:** Vercel (frontend) e GitHub Actions (CI)

## Desafios técnicos resolvidos

- **Catálogo offline:** o cache do TanStack Query é persistido em IndexedDB (só chaves `['public', ...]`), e o Service Worker faz precache do shell e cache das imagens. Dados privados nunca são persistidos.
- **Segurança ponta a ponta, sem regra de negócio no front:** RLS é a autorização; as regras RN01–RN08 vivem em constraints, funções e policies, cobertas por testes pgTAP. O front só usa a `anon key`, e erros do Supabase são traduzidos em mensagens próprias.
- **PWA instalável:** manifest, ícones maskable, atualização por prompt e instruções de instalação para iOS.
- **Edge Function (Nez AI):** a chave do Gemini fica só no servidor; o JWT é validado na função, com retry, modelo de reserva e códigos de erro estáveis.
- **Qualidade medida:** testes unitários, de banco e E2E em dois viewports, acessibilidade com axe e auditoria Lighthouse no CI.

## Pré-requisitos

- [Node.js](https://nodejs.org/) `24.14.0` (veja `.nvmrc`; `nvm use`). Compatível com `^20.19.0 || >=22.12.0`.
- npm 10+
- [Docker](https://www.docker.com/) aberto, para o Supabase local

## Como rodar localmente

```bash
npm install
npm run db:start                  # sobe o Supabase local (migrations + seed)
npx supabase status -o env        # copie API_URL e ANON_KEY
cp .env.example .env.local        # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Acesse `http://localhost:5173`. Para testar o Nez localmente, defina `GEMINI_API_KEY` em `supabase/functions/.env`. Nunca coloque `service_role` no front.

## Scripts disponíveis

| Script                 | Descrição                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`          | Inicia o servidor local de desenvolvimento Vite                                               |
| `npm run build`        | Valida tipagem com `tsc -b` e compila os assets de produção                                   |
| `npm run preview`      | Executa o preview local da compilação de produção                                             |
| `npm run lint`         | Executa a verificação estática com ESLint                                                     |
| `npm run lint:fix`     | Corrige problemas automáticos de lint com ESLint                                              |
| `npm run format`       | Formata o código com Prettier                                                                 |
| `npm run format:check` | Verifica a conformidade de formatação com Prettier                                            |
| `npm run typecheck`    | Executa checagem de tipos estáticos sem emitir arquivos (`tsc -b --noEmit`)                   |
| `npm run test`         | Executa os testes unitários e de componentes uma única vez com Vitest                         |
| `npm run test:watch`   | Executa a suíte de testes em modo observador (watch)                                          |
| `npm run e2e`          | Testes E2E (Playwright) contra o build de produção e o Supabase local                         |
| `npm run db:start`     | Sobe o Supabase local (precisa do Docker aberto); `db:reset` e `db:test` seguem               |
| `npm run db:types`     | Gera `src/types/database.types.ts` a partir do banco local                                    |
| `npm run images`       | Processa as fotos de `scripts/raw-images/` (800×800, WebP 80%) em `scripts/processed-images/` |

## Fotos dos perfumes

O banco já aponta cada perfume para `{marca}/{perfume}.webp` no bucket `perfume-images` (coluna `image_path`). Até a foto existir lá, a página mostra o placeholder.

1. Jogue as fotos cruas em `scripts/raw-images/{marca}/`, com o slug do perfume no nome: `scripts/raw-images/granado/bossa.jpg`. As pastas das marcas já existem (`granado`, `natura`, `o-boticario`, `avatim`, `al-wataniah`, `phytoderm`).
2. Rode `npm run images`: o resultado (800×800, WebP, qualidade 80) sai em `scripts/processed-images/{marca}/{perfume}.webp`.
3. Envie a pasta `scripts/processed-images/` para o bucket `perfume-images` mantendo a estrutura. Fotos de frascos podem ter direitos autorais: use fotos próprias ou liberadas pela marca.

Scripts do pipeline (todos locais; o `images:upload` usa a `service_role`, que só pode estar no `.env.local` como `SUPABASE_SERVICE_ROLE_KEY`, nunca com prefixo `VITE_`):

| Comando                   | O que faz                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run images:download` | Tenta baixar uma foto candidata por perfume (DuckDuckGo via Chromium). Hoje o site não devolve imagens a navegador automatizado: use as fotos à mão |
| `npm run images`          | Processa `raw-images/` em `processed-images/`                                                                                                       |
| `npm run images:upload`   | Envia `processed-images/` ao bucket `perfume-images` (só aceita Supabase local, a menos que `ALLOW_REMOTE_UPLOAD=1`)                                |
| `npm run images:all`      | Os três em sequência                                                                                                                                |

## Créditos

- **Clima:** [Weather data by Open-Meteo.com](https://open-meteo.com/) (dados sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). A API gratuita do Open-Meteo é para uso não comercial; este projeto a usa sem chave, direto do navegador, e mostra a atribuição no rodapé do app.

## Documentação

Para diretrizes completas de produto, regras de negócio (RN01–RN10), arquitetura e cronograma, consulte a especificação em [docs/PRODUCT.md](docs/PRODUCT.md).

## Status

**v1.0** — as 12 fases do Roadmap concluídas.
