# AGENTS.md — Sillage

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
