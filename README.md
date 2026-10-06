# Sillage

PWA de catálogo e coleção de perfumaria de nicho, em português (BR), mobile-first, desenvolvido com foco em interface de alta fidelidade e regras de negócio garantidas no banco de dados.

## Stack

- **Frontend & Build:** React 19, Vite, TypeScript (strict mode)
- **Estilização & Design System:** Tailwind CSS v4, tokens CSS customizados, Motion
- **Qualidade & Testes:** ESLint, Prettier, Vitest, Testing Library (`@testing-library/react`, `@testing-library/jest-dom`), jsdom
- **Backend & Dados (próximas fases):** Supabase (PostgreSQL, RLS, Edge Functions, pgTAP)

## Pré-requisitos

- [Node.js](https://nodejs.org/) versão LTS recomendada: `24.14.0` (ou qualquer versão compatível conforme engines: `^20.19.0 || >=22.12.0`). O repositório inclui `.nvmrc` para conveniência (`nvm use`).
- npm 10+ (ou compatível com a versão do Node)

## Como rodar

Instale as dependências e inicialize o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.

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

Nada é baixado automaticamente: o script só processa o que você colocar na pasta.

## Documentação

Para diretrizes completas de produto, regras de negócio (RN01–RN08), arquitetura e cronograma, consulte a especificação em [docs/PRODUCT.md](docs/PRODUCT.md).

## Status

Em desenvolvimento — **Fase 1 de 12** do Roadmap (Fundação, higiene de repositório e infraestrutura de CI).
