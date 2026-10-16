# Plano: Resiliência de Clima/SOTD, UX de Catálogo/Armário e Varal de Memórias (21st.dev)

Data: 16 de outubro de 2026  
Status: Aprovado para execução pelo Claude Code  
Branch sugerida: `feat/ux-resilience-and-memorial-line`

---

## 1. Contexto e Objetivos

Este plano reúne correções de resiliência identificadas em ambiente de produção (mobile 4G) e melhorias de usabilidade e experiência sensorial (UX) frente a concorrentes de perfumaria (Fragrantica, Parfumo, Basenotes), além da curadoria e integração do componente de varal com fotos instantâneas do 21st.dev para o Memorial.

### Metas

1. **Resiliência do Clima e Cidade no Mobile (4G CGNAT):** Garantir que o nome da cidade nunca suma na barra de clima e no selo do card SOTD quando a geocodificação reversa falhar ou sofrer timeout.
2. **Navegação Cruzada no Catálogo:** Tornar marcas e famílias olfativas em links diretos para exploração no catálogo (`/catalog?brands=...` e `/catalog?families=...`).
3. **Ativação Contextual do Nez:** Disponibilizar botão de ação "Perguntar ao Nez" nos detalhes do perfume, aproveitando o contexto olfativo já injetado na sessão.
4. **Navegação e Busca na Coleção (Armário):** Transformar os cartões de estatísticas do perfil em atalhos clicáveis (`/collection`, `/collection?tab=wanted`, `/memorial`), sincronizar as abas da coleção via URL (`?tab=...`) e incluir busca instantânea em memória para armários com muitos itens.
5. **Varal de Memórias (`PolaroidLineCarousel`):** Integrar o componente de fotos presas em varal do 21st.dev como visualização alternativa acolhedora em `/memorial` (`[ 📅 Calendário | 📷 Varal de Memórias ]`), adaptado com rigor para os tokens e regras do Design System do Sillage (zero cores literais, respeito a `prefers-reduced-motion` e alvos de 44 px).

---

## 2. Diagnóstico Técnico Detalhado

### 2.1. O Bug da Cidade no 4G Mobile

- **Causa Raiz:** No hook `src/hooks/useWeather.ts`, quando a geolocalização do aparelho é obtida (`geo.coords`), o aplicativo consulta a BigDataCloud via `weatherService.reverseGeocode`. Em redes móveis (4G/5G com CGNAT), milhares de aparelhos compartilham o mesmo IP público, causando esgotamento do limite gratuito de requisições da BigDataCloud (HTTP 429) ou atraso superior a 5 segundos.
- **Efeito em Cascata:** Como `placeQuery` tinha `retry: false`, a consulta falhava e o hook recorria ao rótulo genérico `'Sua localização'` (`DEVICE_LOCATION_LABEL`). Na função `cityFromLabel` (`src/lib/sotdCard.ts`), o rótulo `'Sua localização'` é descartado por não ser uma cidade de verdade, fazendo com que a cidade sumisse da `WeatherBar` e a opção de exibir a cidade ficasse desabilitada/invisível no `ShareCardDialog.tsx`.
- **Solução:**
  1. Habilitar 1 retentativa (`retry: 1`) em `placeQuery`.
  2. Implementar fallback para a cidade do fuso horário do usuário (`cityQuery.data` ou `cityFromTimezone(timezone)`) quando a geocodificação reversa falhar.
  3. No `ShareCardDialog.tsx` e `sotdCard.ts`, usar a cidade de fallback do perfil caso a localização do aparelho retorne rótulo genérico.

### 2.2. Lacunas de Navegação e Interação (Benchmark com Parfumo / Fragrantica)

- **Marca como link:** Em `PerfumeDetailsPage.tsx` e `ComparePage.tsx`, `perfume.brandName` era apenas texto simples, enquanto os perfumistas eram links para `/perfumers/:slug`.
- **Famílias clicáveis:** Na legenda da pirâmide em `FamilyBar.tsx`, as famílias olfativas com suas porcentagens eram itens de lista sem ação.
- **Cards de resumo no perfil:** Em `ProfileStats.tsx`, "Tenho", "Quero" e "No memorial" eram cartões estáticos sem redirecionamento.
- **Filtro no Armário:** Usuários com 20+ perfumes precisavam percorrer toda a lista na `CollectionPage.tsx` sem uma barra de busca rápida.

### 2.3. Curadoria do Componente `polaroid-line-carousel.tsx` (21st.dev)

- **Regras do Design System violadas no código bruto:**
  1. _Cores literais:_ O arquivo original do 21st.dev continha paletas com cores `#hex` e `rgba(...)`. No Sillage, o teste `src/components/no-loose-values.test.ts` proíbe terminantemente valores literais em `src/components/**`.
  2. _Acessibilidade vestibular:_ O componente continha física de mola e oscilação contínua que viola as diretrizes de acessibilidade para usuários com `prefers-reduced-motion`.
- **Adaptações de Curadoria:**
  - Extração de todas as cores para tokens CSS semânticos de `tokens.css` (`--card`, `--foreground`, `--border`, `--muted-foreground`, `--stage`, `--primary`).
  - Desativação do balanço (`swing = 0`) e das oscilações quando `prefers-reduced-motion` estiver ativo.
  - Alvos de clique de 44x44 px e textos ARIA em português do Brasil.
  - Conexão com os dados reais de `DailyEntry[]` do Sillage (fotos reais dos frascos, títulos e datas formatadas).

---

## 3. Especificação das Tarefas

### Tarefa 1: Resiliência de Geocodificação e Cidade

- **Arquivos:** `src/hooks/useWeather.ts`, `src/lib/sotdCard.ts`, `src/components/daily/ShareCardDialog.tsx`.
- **Alterações:**
  - Em `useWeather.ts`: se `geo.coords !== null` mas `placeQuery.data` não estiver disponível (erro ou pendência), compor o label usando a cidade do fuso horário como fallback (`${cityFromTimezone(timezone)} (aparelho)` ou simplesmente o nome da cidade).
  - Adicionar `retry: 1` em `placeQuery`.
  - Em `sotdCard.ts`: permitir que a cidade do fuso sirva de fallback para `weather.city` no card de compartilhamento.

### Tarefa 2: Navegação Cruzada de Catálogo

- **Arquivos:** `src/pages/PerfumeDetailsPage.tsx`, `src/pages/ComparePage.tsx`, `src/components/perfume/FamilyBar.tsx`.
- **Alterações:**
  - Converter `perfume.brandName` em `<Link to={`/catalog?brands=${perfume.brandSlug}`}>` com estilo de hover e foco acessível.
  - Em `FamilyBar.tsx`, envolver os itens de legenda em `<Link to={`/catalog?families=${family}`}>` com alvo mínimo de 44 px.

### Tarefa 3: Ação Rápida com o Nez

- **Arquivos:** `src/pages/PerfumeDetailsPage.tsx`.
- **Alterações:**
  - Adicionar botão "Perguntar ao Nez" com ícone `Sparkles` no bloco de ações do perfume.
  - Acionar o drawer do Nez com a mensagem contextualizada sobre a fragrância.

### Tarefa 4: Navegação no Perfil e Busca na Coleção

- **Arquivos:** `src/components/profile/ProfileStats.tsx`, `src/pages/collection/CollectionPage.tsx`.
- **Alterações:**
  - Em `ProfileStats.tsx`: transformar cada `StatCard` em link navegável (`/collection`, `/collection?tab=wanted`, `/memorial`).
  - Em `CollectionPage.tsx`: ler e atualizar o parâmetro de busca `?tab=wanted` / `?tab=owned` via `useSearchParams`.
  - Adicionar campo de busca textual em memória (filtro por nome e marca) quando houver perfumes na lista.

### Tarefa 5: Componente `polaroid-line-carousel.tsx` (Curadoria UI)

- **Arquivo:** `src/components/ui/polaroid-line-carousel.tsx`.
- **Alterações:**
  - Implementar o componente atômico sem cores literais (usando tokens).
  - Suporte a arrasto por toque/mouse, setas do teclado e botões de navegação acessíveis.
  - Integração com `useReducedMotion()`.

### Tarefa 6: Visão em Varal no Memorial (`MemorialLine.tsx`)

- **Arquivos:** `src/components/daily/MemorialLine.tsx`, `src/pages/MemorialPage.tsx`.
- **Alterações:**
  - Criar `MemorialLine.tsx` consumindo `entries: readonly DailyEntry[]` e montando os slides com as miniaturas dos perfumes e datas.
  - Em `MemorialPage.tsx`, adicionar alternância de visualização `[ Calendário | Varal de Memórias ]`.

### Tarefa 7: Testes Automatizados e Documentação

- **Arquivos:** `src/hooks/useWeather.test.ts`, `src/components/perfume/FamilyBar.test.tsx`, `src/components/profile/ProfileStats.test.tsx`, `src/components/ui/polaroid-line-carousel.test.tsx`, `docs/DESIGN_SYSTEM.md`.
- **Alterações:**
  - Cobertura de testes unitários para todas as novas interações e fallbacks.
  - Atualização do `DESIGN_SYSTEM.md` catalogando o novo componente e a tela do Memorial.

---

## 4. Critérios de Aceite e Verificação

A fase estará concluída quando:

1. `npm run lint` — sem erros nem warnings de ESLint.
2. `npm run typecheck` — TypeScript estrito sem erros.
3. `npm run format:check` — Prettier formatado.
4. `npm run test` — Toda a suíte de testes unitários verde (1250+ testes).
5. `npm run check:contrast` — Tokens e contrastes aprovados no padrão WCAG AA.
6. `npm run build` — Bundle de produção gerado com sucesso.
7. O teste `src/components/no-loose-values.test.ts` passar 100% sem nenhuma cor solta.

---

## 5. Revisão do plano (16/10/2026)

A análise contra o código mudou os pontos abaixo. Onde houver conflito com as seções 2 e 3, vale esta seção.

1. **Tarefa 1 (cidade).** `cityQuery.data` nunca existe com a localização do aparelho (`enabled: geo.coords === null`); o fallback é só `cityFromTimezone`. Como o fuso `America/Sao_Paulo` cobre quase todo o Brasil, mostrar "São Paulo" como se fosse o local daria a cidade errada (e no card compartilhado, pior). Decisão: a cidade do fuso entra **marcada como aproximada** ("Região de São Paulo") e nunca como nome exato. Também: `retry: 1`, coordenadas arredondadas (2 casas) na query key e na chamada, para reaproveitar cache. O rótulo vale para a `WeatherBar` e para o card (sem sufixo "(aparelho)"). A causa (429 por CGNAT) é hipótese: conferir a aba Network em um aparelho em 4G.
2. **Tarefa 2 (famílias).** `FamilyBar` é usada na pirâmide, no comparador e no DNA olfativo. Nova prop opcional `linkFamilies`, ligada na pirâmide e no comparador; o DNA do perfil segue sem links.
3. **Tarefa 3 (Nez).** O texto da pergunta é estado interno do `NezDrawer`. Adicionar `draft`/`setDraft` ao `NezContext` (mudança estrutural: atualizar ARCHITECTURE.md). O botão **preenche** o campo, sem enviar sozinho (evita gastar IA sem confirmação), e só aparece para quem está logado (o `NezAssistant` não existe para visitantes).
4. **Tarefa 4 (perfil e coleção).** `<dl>` só aceita `dt`/`dd`/`div` como filhos: cada cartão vira `div > Link`. `?tab=` usa `replace`, e valor inválido cai em `owned`. O filtro (sem acento, nome e marca) fica em `lib/`, com estado "nenhum resultado" e ação "Limpar busca".
5. **Tarefa 5 (carrossel).** O código original do 21st.dev ainda não está no repositório: seguir os 7 passos de PRODUCT.md §10 (licença, dependências, `framer-motion` para `motion/react`, tokens, checklist, registro com URL e data). Padrão de carrossel acessível (`aria-roledescription`, "3 de 12", região `aria-live`), sem px solto e sem oscilação contínua: o balanço só ocorre ao arrastar ou trocar de foto.
6. **Tarefa 6 (Memorial).** `goTo` hoje troca todos os parâmetros (`setParams({ mes })`); preservar `?vista=`. Seletor com o `Tabs` existente; o varal tem skeleton e vazio próprios.
7. **Testes extras.** `CollectionPage`, `MemorialPage`, `PerfumeDetailsPage`, `ComparePage`, `ShareCardDialog`, `WeatherBar`, `sotdCard`/`useShareCard`; `useWeather.test` é novo. Atualizar a matriz de PRODUCT.md §12.

### Ordem de execução e commits

| #   | Commit                                                              |
| --- | ------------------------------------------------------------------- |
| 0   | `docs:` este plano revisado                                         |
| 1   | `fix(weather):` retry, coordenadas arredondadas e cidade aproximada |
| 2   | `feat(catalog):` marca e famílias como links                        |
| 3   | `feat(profile):` cartões do resumo como links e abas na URL         |
| 4   | `feat(collection):` busca em memória                                |
| 5   | `feat(nez):` "Perguntar ao Nez" com `draft` no contexto             |
| 6   | `feat(ui):` `polaroid-line-carousel` (curadoria)                    |
| 7   | `feat(memorial):` `MemorialLine` e seletor Calendário/Varal         |
| 8   | `docs:` DESIGN_SYSTEM, ARCHITECTURE, matriz §12 e verificação final |
