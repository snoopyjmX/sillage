<h1 align="center">Sillage</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
</p>

PWA de catálogo e coleção de perfumaria de nicho.  
Oferece uma UI premium mobile-first com regras de negócio blindadas no banco de dados, foco em performance e suporte ao modo offline.

---

## 🏛️ O Desafio / Arquitetura

O **Sillage** foi construído como um case full-stack robusto, provando que é possível unir uma interface refinada a uma arquitetura segura, coesa e testável.

- **Clean Architecture no Frontend:** O fluxo de dados segue estritamente a direção `Page → Component → Hook → Service → Supabase`. Os componentes visuais (criados sobre _shadcn/ui_ e primitivas acessíveis do _Radix_) são puros, isolados de regras de negócios ou chamadas de API.
- **KISS & YAGNI:** A complexidade prematura foi evitada. O estado da aplicação é gerido pelo `TanStack Query`, dispensando dependências globais pesadas de estado. A funcionalidade PWA offline trabalha com uma divisão rígida de estado: cache público seguro (persistido no IndexedDB) versus cache privado (puramente em memória, eviscerado durante o logout).
- **Banco de Dados como Única Fonte da Verdade:** A lógica crítica do negócio não fica no frontend. Regras vitais, como limite diário de uso e verificação de posse do Perfume do Dia no fuso horário local do usuário, são garantidas através de constraints e funções PL/pgSQL transacionais.

## ✨ Features Principais

- **Progressive Web App (PWA):** Suporte nativo à instalação e navegação offline-first via Service Worker otimizado (Workbox), fazendo o precache do _app shell_ e estratégias de _CacheFirst_ para imagens de perfumes.
- **Catálogo Rápido e Indexação Avançada:** Busca full-text tolerante a sotaques (acentuação) implementada através de extensões PostgreSQL (`pg_trgm` e `unaccent`) baseada num índice invertido GIN tridimensional.
- **Coleção Pessoal e "Perfume do Dia":** Gerenciamento dinâmico do acervo entre "Tenho" e "Quero", e gravação de uso diário que se baseia nas limitações espaço-temporais do aparelho que origina a ação, processadas no backend.
- **Integração Segura com Inteligência Artificial (Nez):** Assistente de recomendação implementado numa arquitetura _serverless_ via Supabase Edge Functions (Deno). A chave da Gemini API fica invisível para o client-side e a execução exige validação direta de JWT do usuário no backend.
- **Design System Acessível e Premium:** Visuais luxuosos construídos sob Tailwind CSS e orquestrados puramente por `motion/react`, respeitando estritamente os padrões ARIA, _focus-traps_ e preferências _reduced-motion_.

## 🛡️ Segurança e QA

Segurança neste projeto é uma cidadã de primeira classe e as práticas defensivas evitam a dependência exclusiva do frontend:

- **Row Level Security (RLS) Nativamente:** A autorização baseia-se puramente em PostgreSQL Policies. Um usuário jamais terá o poder de ler ou gravar sobre coleções de outro cliente — a própria tabela avalia o `auth.uid()` em toda operação DML.
- **Prevenção de Escalada de Privilégios (Privilege Escalation):** Operações admin-only, como inserções em catálogo, validam regras contra o objeto `app_metadata` no payload do JWT (blindado de alterações geradas pelo cliente via `user_metadata`).
- **Agregados Seguros via SQL Views:** O sistema mascara os metadados dos autores utilizando as _Views_ `perfume_review_stats` e `perfume_reviews_public` limitadas, servindo apenas o necessário ao público e ocultando e-mails, avatares ou fuso horário no tráfego de rede.
- **Validação de Inputs Otimizada:** Schema validation forte no frontend orquestrada pelo React Hook Form + Zod, parando o envio de payloads problemáticos antes mesmo que atinjam o consumo da banda ou os endpoints.
- **Matriz de Testes Automatizada em CI:**
  - **E2E:** Automação realista Playwright reproduzindo fluxos autênticos em mobile e desktop browser instances.
  - **Acessibilidade:** Inspeção rigorosa no fluxo renderizado com `@axe-core/playwright`.
  - **Camada de Banco:** `pgTAP` roda extensos testes locais para confirmar que nenhuma query restrita e nenhuma nova _policy_ passe batida com vulnerabilidades no RLS.

## 🚀 Como Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sillage.git
cd sillage

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# (Preencha as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local)

# Suba a infraestrutura do banco de dados via Docker (Supabase CLI) e aplique as migrations
npm run db:start

# Inicie o servidor de desenvolvimento
npm run dev
```

## 👨‍💻 Autor

**João Marcelo Sousa Garcês de Araújo**  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-linkedin)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-github)
