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
- **Commits realizados nesta branch:**
  - `d0cd4a1` docs(security): registra a confirmação de e-mail desativada como risco aceito
  - `361cb93` feat(catalog): remove a concentração other
  - `17c40f8` feat(images): remove o fundo branco localmente com sharp e tira o Remove.bg

---

## 2. 🗺️ Próximo Passo Imediato (Onde Retomar)

O próximo bloco de trabalho na mesma branch é a **Subfase 15C: Perfume do Dia Restrito à Coleção (RN06)**:
- Regra de negócio: só permitir vestir perfume que o usuário tenha na coleção (`status = 'owned'`).
- UI da Coleção: botão "Vestir hoje" na prateleira "Tenho".
- UI da Home & Detalhes: validação se o perfume do dia / sugerido pertence à prateleira "Tenho" antes de permitir vestir.

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
> *"Estou no outro PC. Vamos retomar da Subfase 15C do HANDOFF.md na branch feat/phase-15-catalog-and-auth."*

