# 📋 SILLAGE — GUIA DE CONTINUIDADE E TRANSIÇÃO (HANDOFF)

Este documento registra o estado atual do projeto para transição entre computadores sem perda de contexto.

---

## 1. 📌 Estado Atual do Projeto

- **Branch Ativa:** `feat/phase-15-catalog-and-auth`
- **Subfases Concluídas:**
  - ✅ **15A (Infra & Auth Online):**
    - Painel do Supabase configurado: Confirmação de e-mail desativada (OFF).
    - URLs configuradas: Site URL apontando para a Vercel e Redirect URLs com wildcards (`https://seu-app.vercel.app/**` e `http://localhost:5173/**`).
    - Documentação de segurança atualizada em `docs/SECURITY.md` e `docs/PRODUCT.md` com o risco registrado e mitigado por RLS.
  - ✅ **15B (Catálogo, Concentração & Imagens Transparentes):**
    - Migration criada: `20261010120000_remove_concentration_other.sql` (migra linhas `other` para `extrait`, recria enum `concentration_type` com apenas `parfum`, `extrait`, `edp`, `edt`, `edc`, e recria funções com grants).
    - Seed, labels, Zod schemas, tipos e docs atualizados.
    - Script de ingestão rejeita perfumes sem concentração oficial confirmada.
    - Script `scripts/process-images.mjs` totalmente local com `sharp`: algoritmo determinístico de flood fill que remove fundo branco preservando o interior do frasco e rótulos. Dependência externa do Remove.bg completamente removida.
    - Testes: 257 testes pgTAP (`supabase test db`) e 519 testes Vitest passando 100% verde.
  - ✅ **15C (Perfume do Dia restrito à coleção, RN06):**
    - Migration `20261011120000_daily_perfume_owned_only.sql`: `set_daily_perfume` exige `collection_items.status = 'owned'` (`42501`, `perfume not owned`); erro `daily_not_owned` no front; "Vestir hoje" na aba "Tenho" da Coleção e botão da sugestão da Home desabilitado fora do "Tenho".
  - ✅ **15D (Perfil: foto de avatar e fuso automático):**
    - Migration `20261012120000_avatars_storage.sql`: bucket público `avatars` e 4 policies (leitura pública, escrita do dono na própria pasta), com testes pgTAP em `11_storage.test.sql`.
    - `src/lib/avatar.ts` (valida, recorta 1:1 e reexporta em WebP no canvas), `profileService.uploadAvatar/removeAvatar`, `ProfileAvatar` editável e hooks `useUploadAvatar`/`useRemoveAvatar`.
    - `ProfileForm`: caixa "Detectar fuso horário automaticamente" (padrão ligada, `localStorage` `sillage-timezone-auto`).
  - ✅ **15E (Home: filtro de gênero, card de clima e prompt do Nez):**
    - Filtro "Todos / Feminino / Masculino / Unissex" na Sugestão do dia (`lib/homeGender.ts`, chips com `aria-pressed`, preferência em `localStorage` `sillage-home-gender`, padrão `all`); `homeService.getDailySuggestion(date, families, gender)` repassa `genders` à RPC `search_perfumes` (sem migration) e o gênero entra na query key.
    - `WeatherBar` reorganizado: cabeçalho (cidade + botão de 44 px), métricas (temperatura grande, descrição, umidade) e linha "Sillage recomendada" com fundo `bg-accent/40`; todos os estados mantidos.
    - `SYSTEM_PROMPT` do `nez-ai` com volatilidade das notas por clima e evolução da pirâmide.
    - Testes: `HomePage.test.tsx` (filtro), novo `WeatherBar.test.tsx` e e2e do filtro em `weather.spec.ts`.
  - 🟡 **15F (Auditoria de bundle e Lighthouse) — parcial:**
    - Feito: `rollup-plugin-visualizer@7.1.1` (devDependency) ligado ao `vite.config.ts` via `npm run analyze` (gera `stats.html`, gitignorado); vendor chunks `vendor-react`, `vendor-router`, `vendor-supabase`, `vendor-query`, `vendor-forms` e `vendor-radix` (`build.rolldownOptions.output.codeSplitting`). Motion ficou fora dos grupos de propósito: `main.tsx` só usa `MotionConfig`, e agrupar arrastava ~42 kB gz para o caminho crítico. O radix exclui `react-slot`/`compose-refs`/`primitive` (usados pelo `button`) pelo mesmo motivo. JS do caminho crítico: ~193 → ~189 kB gz; o ganho principal é cache estável por vendor. Precache do SW cobre os novos chunks (85 entradas) e `/rest|auth|functions/v1/` segue `NetworkOnly`.
    - **Pendente (decisão do dono):** o gate do Lighthouse já reprovava antes da 15F (performance 0,80–0,82 e LCP 4,1–4,4 s em `/`, `/login`, `/register`, throttling mobile; a causa é a cascata do SPA, não o tamanho dos chunks). `/catalog` é rota privada e está em `Disallow` no `robots.txt`: sem login o Lighthouse audita o redirect `/?redirect=%2Fcatalog` e o SEO reprova (0,66). Por isso `/catalog` **não** entrou no `lighthouserc.json`.
- **Commits realizados nesta branch:**
  - `d0cd4a1` docs(security): registra a confirmação de e-mail desativada como risco aceito
  - `361cb93` feat(catalog): remove a concentração other
  - `17c40f8` feat(images): remove o fundo branco localmente com sharp e tira o Remove.bg

---

## 2. 🗺️ Próximo Passo Imediato (Onde Retomar)

A 15F está parcial (bundle feito; gate do Lighthouse pendente, ver acima). Decidir como tratar o gate de performance e a auditoria autenticada de `/catalog` antes de encerrar a Fase 15.

---

## 3. 💻 Como Retomar no Outro Computador

No outro computador:

```powershell
# 1. Puxar as novidades do repositório
git fetch origin

# 2. Mudar para a branch de trabalho da Fase 15
git checkout feat/phase-15-catalog-and-auth
git pull origin feat/phase-15-catalog-and-auth

# 3. Se for rodar os testes de banco locais no outro PC:
npx supabase db reset
npx supabase test db
```

---

## 4. 🚀 Comando de Retomada com a IA

Ao abrir o chat no outro computador, basta dizer:

> _"Estou no outro PC. Vamos retomar da Subfase 15F do HANDOFF.md na branch feat/phase-15-catalog-and-auth."_
