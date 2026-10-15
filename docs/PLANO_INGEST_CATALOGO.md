# Sillage — Plano de Ingestão Automatizada do Catálogo (Backlog Expansão)

> **Documento de especificação para execução pelo Claude Code.**  
> **Origem:** `docs/CATALOGO_EXPANSAO.md`, `docs/PLANO_FINAL.md` (Seção 2.1) e `docs/ROADMAP_V2.md` (Fase 24).

---

## 1. Divergências encontradas na spec

1. **Perfumistas corporativos vs. pessoas físicas:** Em `docs/CATALOGO_EXPANSAO.md` constam termos como "Casa Granado" para perfumista. **Decisão adotada:** A tabela relacional `perfumers` modela estritamente narizes pessoas físicas. Quando for nariz pessoa física comprovado (ex.: Verônica Kato, Jacques Huclier, Jasmine Liu), insere em `perfumers` e relaciona em `perfume_perfumers`. Quando a marca divulgar apenas autoria institucional/anônima, o campo `perfumers` deve ser lista vazia `[]`.
2. **Enum de famílias olfativas:** O backlog possui famílias compostas ("Chypre Floral Amadeirado", "Amadeirado Floral Tropical"). **Decisão adotada:** O enum `olfactive_family` do banco possui exatamente 10 valores (`citrus, floral, woody, green, aquatic, oriental, spicy, fruity, aromatic, musky`). A família do perfume e das notas deve ser mapeada estritamente para um desses 10 valores.
3. **Concentração comercial "Deo Parfum":** No Brasil, marcas como Natura e Avatim utilizam "Deo Parfum". **Decisão adotada:** Mapeado para `edp` (Eau de Parfum), alinhado ao enum `concentration_type`.
4. **Regra de foto obrigatória (`image_path NOT NULL`):** Conforme `docs/PRODUCT.md` (linha 482) e migration `20261019120000_perfumes_image_required.sql`, nenhum perfume entra no catálogo sem imagem. Perfumes cujas fotos não puderem ser obtidas ou baixadas devem ser direcionados para uma quarentena (`scripts/batch/erros-ingest.json`) sem gerar migration.

---

## 2. Contexto e Escopo

- **O que já está pronto:**
  - `scripts/ingest-perfume.mjs`: integração com a API Gemini (`gemini-3.5-flash`), validação com Zod e geração de migrations idempotentes.
  - `scripts/download-images.mjs`: busca de imagens via DuckDuckGo e Bing priorizando domínios confiáveis (`belezanaweb.com.br`, `fragrantica.com.br`, `sephora.com.br`, CDNs de marcas) e descartando redes sociais e bancos de imagens.
  - `scripts/process-images.mjs`: recorte e remoção de fundo com Sharp, enquadramento 4:5 e cálculo de hash de conteúdo para cache.
  - `docs/CATALOGO_EXPANSAO.md`: catálogo com os ~720 perfumes catalogados por marcas.
- **O que NÃO entra nesta fase:**
  - Alteração de policies de RLS ou do schema do Supabase.
  - Inserção de dados fictícios ou perfumes sem foto oficial comprovada.

---

## 3. Instruções para o Claude Code

### Passo 0: Inspeção Inicial

1. Verifique a árvore de trabalho (`git status`).
2. Crie e alterne para a branch dedicada:
   ```bash
   git checkout -b feat/catalogo-expansao-batch
   ```
3. Inspecione os scripts existentes:
   - `scripts/ingest-perfume.mjs`
   - `scripts/download-images.mjs`
   - `docs/CATALOGO_EXPANSAO.md`

---

### Tarefa 1: Pipeline Integrado de Ingestão e Fotos (`scripts/ingest-catalog.mjs`)

1. Implementar o script `scripts/ingest-catalog.mjs`:
   - **Parser:** Extrai os perfumes de `docs/CATALOGO_EXPANSAO.md` (respeitando seções de marcas e marcas de seleção `[x]`).
   - **Verificação de duplicatas:** Consulta o banco Supabase ou o `supabase/seed.sql` por slug (`brands.slug` e `perfumes.slug`) para pular perfumes já cadastrados.
   - **Consulta ao Gemini:**
     - Utiliza `GEMINI_API_KEY` do `.env.local` e o schema estruturado `PerfumeSchema`.
     - Prompt instruído a retornar: nome, marca, ano, concentração válida, gênero, descrição em pt-BR, pirâmide olfativa com descrições sensoriais e famílias do enum, perfumistas comprovados e URL oficial do frasco.
     - Taxa de requisições: delay controlado de 2 a 3 segundos entre chamadas para evitar `RateLimitError`.
   - **Captura da Foto do Frasco:**
     - 1º: Tenta baixar a URL direta retornada pelo Gemini (se vier de CDN/loja acessível).
     - 2º (Fallback): Aciona o motor de busca do `scripts/download-images.mjs` com o termo `"frasco perfume {marca} {nome}"`, filtrando por `TRUSTED_DOMAINS` (`belezanaweb.com.br`, `fragrantica.com.br`, `sephora.com.br`, etc.).
     - Salva o arquivo em `scripts/raw-images/<marca-slug>/<perfume-slug>.<ext>`.
   - **Geração de Migrations & Quarentena:**
     - Perfumes válidos com foto baixada geram migration SQL idempotente em `supabase/migrations/` (`on conflict do nothing`), incluindo tabelas `perfumers` e `perfume_perfumers` quando houver perfumista.
     - Perfumes com falha de validação ou foto ausente são registrados com o motivo em `scripts/batch/erros-ingest.json`, permitindo que o lote continue rodando.
2. Adicionar o atalho no `package.json`:
   ```json
   "ingest:catalog": "node scripts/ingest-catalog.mjs"
   ```
3. Adicionar testes unitários das funções auxiliares em `scripts/ingest-extension.test.mjs`.

---

### Tarefa 2: Execução do Lote Inicial (Prioridade 1 + Granado)

1. Rodar a ingestão para o primeiro lote (Prioridade 1 e linha Granado & Phebo):
   ```bash
   node scripts/ingest-catalog.mjs --limit 45
   ```
2. Exibir o relatório com o total de sucessos, arquivos SQL gerados e a lista de falhas registradas em `erros-ingest.json`.

---

### Tarefa 3: Processamento e Preview de Imagens

1. Executar o recorte e otimização das imagens capturadas:
   ```bash
   npm run images
   ```
2. Atualizar o `image_path` das migrations geradas com o hash correspondente impresso pelo Sharp.
3. Gerar o mosaico de conferência visual:
   ```bash
   npm run images:preview
   ```
   Indicar o arquivo `processed-images/_preview.png` para inspeção visual rápida.

---

### Tarefa 4: Atualização dos Documentos

1. Em `docs/CATALOGO_EXPANSAO.md`, marcar com `[x]` todos os perfumes ingeridos com sucesso.
2. Atualizar `docs/CATALOGO_REAL.md` com os novos perfumes adicionados ao acervo.

---

## 4. Critério de Pronto

O trabalho está concluído quando os seguintes comandos executarem e passarem sem erros:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## 5. Regras Finais

- Trabalhe estritamente na branch `feat/catalogo-expansao-batch`.
- Commits organizados seguindo Conventional Commits (`feat:`, `test:`, `docs:`).
- Não realize `git push` ou merge sem autorização do usuário.
- Apresente ao final o caminho de `processed-images/_preview.png` e o resumo de quantos perfumes foram ingeridos com sucesso.
