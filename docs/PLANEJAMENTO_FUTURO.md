# Planejamento de Produto, Pesquisa de Mercado e Diferenciais

Este documento registra a pesquisa de mercado, a análise competitiva e o planejamento das fases de produto do Sillage depois da Fase 15. A revisão de 13/10/2026 conferiu cada premissa contra o código, corrigiu as que não batiam e fechou as decisões de produto (seção 4). Andamento: a **16B** (`feat/sotd-share-card`), a **16A** (`feat/olfactory-dna`) e a **17B** (`feat/closet-suggestion`) a **17A** (`feat/collection-formats`) a **18A** (`feat/affinity`) e a **18B** (`feat/compare`) estão implementadas; o restante não. Ao implementar cada fase, a especificação passa para `PRODUCT.md`, `DATABASE.md` e `DESIGN_SYSTEM.md` no mesmo PR.

---

## 1. Pesquisa de Mercado e Benchmarking Competitivo

A indústria digital de perfumaria é dominada por plataformas legadas ou corporativas. Nenhuma solução atual une **experiência mobile-first de luxo**, **adaptação ao clima brasileiro** e **ferramentas modernas para colecionadores de nicho**.

### Comparativo Direto

| Plataforma                                 | Pontos Fortes                                                                                                 | Fraquezas Críticas                                                                                                                | Oportunidade para o Sillage                                                                                 |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Fragrantica** (Global / BR)              | Maior base de dados do mundo; comunidade massiva e SEO dominante.                                             | Interface sobrecarregada com anúncios invasivos, sem PWA, avaliações frequentemente desorganizadas, sem foco em design.           | Ser o **antídoto de luxo**: limpo, calmo, sem anúncios, rápido, com experiência de aplicativo nativo (PWA). |
| **Parfumo** (Europa)                       | Visual mais limpo que o Fragrantica, ferramenta de _Scent of the Day_ (SOTD), gráficos de pirâmide.           | Foco quase exclusivo no mercado europeu/americano, design analítico frio, sem recomendações para o clima brasileiro.              | Trazer **calor sensorial**, linguagem em pt-BR com alta curadoria e foco no clima de quem usa.              |
| **Wikiparfum** (Puig)                      | Rodas olfativas visuais atraentes, design limpo.                                                              | Parcial (favorece marcas de conglomerados comerciais), sem foco em perfumaria de nicho independente, sem área de coleção pessoal. | Manter a **independência editorial**, foco em nicho real e experiência de coleção pessoal profunda.         |
| **Letterboxd / Notion** (Paradigmas de UX) | Referência em senso de posse, estética minimalista, diário pessoal rico e cards estéticos para redes sociais. | Não atuam no segmento de perfumaria.                                                                                              | **O norte do Sillage:** se consolidar como o _"Letterboxd da Perfumaria de Nicho"_.                         |

---

## 2. Pilares de Diferenciação do Sillage

1. **Clima no dia a dia:** a sugestão usa a temperatura da cidade do usuário (Open-Meteo) e a curadoria da casa para indicar quais famílias tendem a funcionar hoje (RN10). São heurísticas editoriais e o produto as declara assim; a umidade aparece na barra de clima, mas não entra na pontuação. Não prometer "física da evaporação" nem "janela de evolução" em copy: a Landing só descreve o que o produto faz.
2. **Realidade do colecionador brasileiro (decants e amostras):** frascos de nicho custam caro; boa parte dos entusiastas coleciona frações (decants de 5 ml ou 10 ml, amostras). O Sillage reconhece e organiza esses formatos.
3. **DNA olfativo pessoal:** a coleção e o memorial viram um perfil sensorial legível (famílias e notas que mais aparecem) e uma leitura de afinidade com perfumes novos.
4. **Card de compartilhamento (SOTD):** imagem 9:16 para stories gerada no próprio aparelho, sem emojis, com a tipografia e a paleta do projeto.

O fio que une os pilares: **ajudar a decidir o que vestir hoje e o que provar em seguida**, com o que a pessoa já tem. É isso que nenhum concorrente faz e o que justifica a ordem das fases (seção 6).

---

## 3. Premissas corrigidas na revisão

A versão anterior deste documento assumia coisas que o código não sustenta. Ficam registradas para não voltarem:

| Premissa anterior                                          | O que o código mostra                                                                                                                                                                                            | Consequência                                                                                                   |
| :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| DNA derivado do cache, sem migration                       | O cache da coleção e do memorial só traz a **família** de cada nota (`PERFUME_ROW_SELECT` em `src/lib/perfume.ts`), não o nome; o cache `['private', userId, 'daily']` tem hoje e mais 12 dias (`HISTORY_LIMIT`) | DNA vem de uma função SQL `get_olfactory_dna()` (migration só de função, sem tabela)                           |
| Espectro com `bg-chip-*`                                   | Já existe `FamilyBar` (`components/perfume`) com os tokens `bg-family-*`, animação de `scaleX` e legenda acessível ("Amadeirado 60%")                                                                            | Reutilizar o `FamilyBar`; nada de componente novo para a barra                                                 |
| Card SOTD com esforço baixo e três notas do Perfume do Dia | `DailyEntry.perfume` é um `PerfumeSummary` (sem notas) e `DailyHighlight` não recebe o clima                                                                                                                     | Buscar o detalhe pela query pública `perfumes.detail(slug)`; a `HomePage` passa o `WeatherView`. Esforço médio |
| Formatos como colunas opcionais, sem mais regra            | `collectionService.setStatus` faz upsert só do `status`: ao ir de "Tenho" para "Quero", formato e volume ficariam órfãos                                                                                         | `CHECK` no banco + o upsert de `wanted` limpa os campos (nova RN11)                                            |
| Pontuação climática do armário com os dados da coleção     | `perfumeTempRange` pesa pela família de **cada nota**, com repetição; `PerfumeSummary.families` vem sem repetição                                                                                                | Expor `noteFamilies` no `PerfumeSummary` (o `fromPerfumeRow` já recebe esse dado); sem isso, o % diverge       |
| Sugestão do armário dentro da RN10 como está               | A RN10 diz "a mesma data dá o mesmo perfume **para todos**"                                                                                                                                                      | RN10 revisada (seção 5.4)                                                                                      |
| Fases 18 e 19 prontas para priorizar                       | Só existiam na tabela RICE, sem especificação                                                                                                                                                                    | Especificação inicial na seção 5.5; refinar antes de estimar                                                   |
| Regras RN01–RN08                                           | `PRODUCT.md` já vai até a RN10                                                                                                                                                                                   | Formatos entram como RN11                                                                                      |

---

## 4. Decisões de produto

Tomadas pensando em quem usa o app todo dia e no que diferencia o Sillage:

| #   | Decisão                                                                                                                                                                                     | Por quê                                                                                                                                          |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Peso do DNA:** cada perfume em "Tenho" vale 1 e cada dia no memorial vale 1. "Quero" fica fora do espectro.                                                                               | O DNA descreve quem a pessoa _é_ (o que tem e o que veste de verdade). Usar muito um perfume deve pesar; desejo não é perfil.                    |
| D2  | **"Quero" vira uma leitura à parte:** com 3 ou mais itens em "Quero", se a família mais frequente ali for diferente da principal do DNA, o card diz "Seus desejos apontam para Amadeirado". | É o tipo de leitura que nenhum concorrente oferece e custa só um campo a mais na mesma função SQL.                                               |
| D3  | **Mínimo de 3 perfumes distintos** (Tenho ∪ memorial) para mostrar o DNA. Abaixo disso, estado vazio com o progresso ("Faltam 2 perfumes para o seu DNA aparecer").                         | Com 1 ou 2 perfumes o "perfil" seria 100% de uma família: mais enganoso que útil. O progresso transforma o vazio em convite.                     |
| D4  | **Card SOTD sem clima:** gera o card sem o selo, nunca bloqueia.                                                                                                                            | O clima é enfeite do card, não o conteúdo. Bloquear frustraria justamente quem negou a localização.                                              |
| D5  | **Cidade no card SOTD:** caixa "Mostrar a cidade" no diálogo, ligada por padrão e lembrada (`localStorage` `sillage-share-city`). A temperatura aparece sempre que houver clima.            | "Curitiba · 19 °C" é o charme do card, mas é localização num post público: a pessoa precisa ver e poder tirar.                                   |
| D6  | **Formato da imagem: JPEG** (qualidade 0,92, 1080 × 1920), não WebP.                                                                                                                        | O fundo é sólido (não precisa de transparência) e JPEG é o que Instagram, WhatsApp e o share sheet do iOS aceitam sem conversão.                 |
| D7  | **Ocasiões saem da Fase 17.** Fica só formato e volume.                                                                                                                                     | Nada no app consumiria a ocasião; seria um campo a mais no formulário sem retorno. Volta quando a sugestão do armário puder filtrar por ocasião. |
| D8  | **Formato é opcional e nunca bloqueia.** Sem formato = "não informado" (nada no selo); não presumimos "Frasco". Depois de marcar "Tenho", o toast oferece "Detalhar formato".               | Marcar "Tenho" precisa continuar a um toque. Detalhar é para quem quer.                                                                          |
| D9  | **Volumes sugeridos por formato:** Frasco 30/50/75/100/200 ml; Decant 2/5/10/15/20 ml; Amostra 1/2/3 ml; e "Outro" (número com uma casa decimal).                                           | Um seletor único com 2 ml e 100 ml misturados obriga a pensar; por formato, o valor certo quase sempre está a um toque.                          |
| D10 | **Modo "Meu armário" é o padrão quando há 3 ou mais perfumes em "Tenho"** e o usuário ainda não escolheu; a escolha explícita é lembrada (`localStorage` `sillage-home-source`).            | "O que vestir hoje do que já tenho" é o motivo para abrir o app todo dia, o hábito que o Letterboxd tem e o Fragrantica não.                     |
| D11 | **Armário varia:** entre os perfumes com clima adequado até 10 pontos abaixo do melhor, evita os vestidos nos últimos 3 dias (se sobrar algum).                                             | Sugerir o mesmo frasco toda semana de calor faria a função parecer quebrada; quem coleciona quer rodar a coleção.                                |
| D12 | **Afinidade, não "risco de blind buy":** a Fase 18 mostra "Afinidade alta / média / baixa" com os motivos, sem porcentagem. Média ou baixa sugere "Prove num decant antes".                 | Um "risco 37%" passa precisão que uma heurística não tem. O rótulo com motivo é honesto e conecta os pilares 2 e 3.                              |
| D13 | **Duelos (votação social) ficam fora;** o comparador entra sem eles.                                                                                                                        | Votação exige tabelas novas, moderação e anti-abuso. O comparador entrega o valor (decidir entre dois) com dados públicos que já existem.        |
| D14 | **Numeração:** o modo armário é a **RN10 revisada** (mesma regra: sugestão por clima); formatos viram a **RN11**, com garantia no banco.                                                    | A RN10 continua sendo "a regra da sugestão"; a RN11 segue o padrão das regras com mecanismo no banco.                                            |

---

## 5. Especificação

Vale para tudo: **zero emojis**, ícones só de `lucide-react`, só tokens de `tokens.css`, arquitetura `Page → Component → Hook → Service → Supabase`, texto visível em pt-BR, os quatro estados (carregando com skeleton equivalente, vazio, erro, offline), 360 px+ e um único momento de assinatura por tela.

### 5.1 Fase 16A: DNA Olfativo (Perfil)

- **Local:** `ProfilePage`, nova seção "Seu DNA olfativo" entre "Resumo" e "Seus dados", em `AsyncBoundary` próprio (falha do DNA não esconde o resto).
- **Componente:** `components/profile/OlfactoryDnaCard.tsx` sobre o `Card`. Ícone `Fingerprint` no cabeçalho.
- **Conteúdo:**
  - Espectro de famílias com o `FamilyBar` (barra decorativa + legenda com porcentagem; a cor nunca é a única informação).
  - "Notas que mais aparecem": até 3 `Chip` neutros, cada um link para `/catalog?notes=<slug>`.
  - Linha de desejo (D2), quando se aplica.
  - Rodapé discreto: "Baseado em N perfumes e M dias no memorial."
- **Motion:** calmo. O momento de assinatura do Perfil continua sendo a entrada do avatar; o `FamilyBar` já anima `scaleX` com `transitions.short` e respeita reduced motion.
- **Dados:** função `public.get_olfactory_dna()` (`security invoker`, `stable`, `set search_path = ''`, `execute` só para `authenticated`). Lê `collection_items` (`owned`) e todo o `daily_perfumes` do próprio usuário (a RLS de dono filtra; RN01). Devolve `families` (família e peso), `top_notes` (slug, nome, família, peso; até 3), `wish_family` (ou nulo) e `perfume_count` / `memorial_days`.
- **Front:** `dnaService.get()`, `useOlfactoryDna()`, chave `['private', userId, 'olfactory-dna']` em `queryKeys`. Invalidar no `onSettled` das mutações da coleção e no `onSuccess` de `useWearToday`. Regras puras em `lib/olfactoryDna.ts` (pesos → `FamilyShare[]`, mínimo da D3, texto da D2).
- **Estados:** skeleton com a altura do card; vazio com progresso (D3) e "Explorar o catálogo"; erro com tentar de novo; offline com `offlineDescription`.
- **Testes:** pgTAP (dono vê só os próprios dados; outro usuário recebe vazio; `anon` sem `execute`; pesos de Tenho e memorial); Vitest de `lib/olfactoryDna.ts` e dos 4 estados do card.
- **Docs:** `DATABASE.md` (função), `PRODUCT.md` (Perfil), `DESIGN_SYSTEM.md` (seção Perfil).

### 5.2 Fase 16B: Card SOTD (Home)

- **Gatilho:** em `DailyHighlight` (que é sempre o Perfume do Dia de hoje), `Button` `outline` com `Share2` e "Compartilhar dia".
- **Diálogo:** `Dialog` de `components/ui` com a prévia 9:16 (a própria imagem gerada, em escala), a caixa "Mostrar a cidade" (D5) e as ações:
  - "Compartilhar" (`Share2`): só aparece quando `navigator.canShare({ files })` é verdadeiro (em geral celular).
  - "Baixar imagem" (`Download`): sempre disponível; no desktop é o caminho principal.
- **Conteúdo do card (1080 × 1920, JPEG, D6):** fundo `--surface` com borda `--border`; palco com a foto (fundo transparente da 15B) ou o placeholder da primeira família; marca em caixa alta (Inter); nome em Fraunces com quebra de linha; concentração; uma nota por camada ("Topo · Coração · Fundo", completando com as demais se faltar camada); selo de clima com ícone (`Sun`, `Cloud`, `CloudRain`…), temperatura e, se marcada, a cidade (sem clima, sem selo, D4); data por extenso; wordmark "Sillage".
- **Tema:** o card segue o tema ativo; a prévia é exatamente o que será compartilhado.
- **Implementação:** `lib/sotdCanvas.ts` dividido em layout puro (posições, quebra de texto com função de medida injetada, testável sem DOM) e desenho. Cores lidas dos tokens com `getComputedStyle` (sem hex no código); `document.fonts.load` de Fraunces e Inter antes de desenhar; imagem por `fetch` → `createImageBitmap` (o Storage público envia CORS, então o canvas não fica bloqueado para exportar); falha da imagem cai no placeholder. Hook `useShareCard` orquestra detalhe (`perfumes.detail(slug)`), clima e geração.
- **Estados:** gerando (skeleton 9:16 no lugar da prévia); erro de geração com tentar de novo; offline gera com o que estiver em cache (sem notas, se o detalhe não estiver).
- **Testes:** Vitest do layout (nomes longos, sem notas, sem clima, sem cidade) e do diálogo (com e sem `canShare`); E2E do download.

### 5.3 Fase 17A: Formatos na Coleção (Coleção)

- **Banco:** migration com `create type public.collection_format as enum ('bottle', 'decant', 'sample')` e as colunas `format collection_format null` e `volume_ml numeric(5,1) null` em `collection_items`, com:
  - `CHECK (status = 'owned' OR (format IS NULL AND volume_ml IS NULL))` (RN11);
  - `CHECK (volume_ml IS NULL OR (format IS NOT NULL AND volume_ml > 0 AND volume_ml <= 1000))`.
  - A policy "collection: owner update" já cobre as colunas; nenhuma policy nova.
- **RN11 (nova): Formato só em "Tenho".** Formato e volume só existem com `status = 'owned'`. Garantia: os `CHECK` acima + o upsert de `wanted` envia `format: null, volume_ml: null`; o de `owned` envia só o `status` (preserva o que já foi detalhado).
- **Front:** `npm run db:types`; `collectionService.setDetails(perfumeId, { format, volumeMl })`; `useSetCollectionDetails` com o mesmo padrão otimista de `useCollection`; schema Zod.
- **UI:**
  - Na aba "Tenho" da Coleção, selo discreto no card (via prop do `PerfumeCard`, que é compartilhado com o catálogo): `FlaskConical` "Frasco 100 ml", `Pipette` "Decant 10 ml", `Droplet` "Amostra 2 ml". Sem formato, sem selo.
  - Ação "Detalhar" no card abre um `Dialog` com o formato (três opções com ícone, alvo de 44 px) e os volumes sugeridos daquele formato (D9).
  - Depois de marcar "Tenho", o toast de sucesso traz a ação "Detalhar formato" (D8); se a `lib/toast` não expuser ação, estendê-la.
- **Testes:** pgTAP (`00_structure` com colunas e tipo; `02_rn02` com a troca `owned` → `wanted` limpando os campos; `CHECK` rejeita formato em `wanted` e volume sem formato; outro usuário não altera); Vitest do service, do hook e do diálogo.
- **Docs:** `PRODUCT.md` (RN11 e matriz de testes, seção 12), `DATABASE.md`, `DESIGN_SYSTEM.md`.

### 5.4 Fase 17B: Sugestão do próprio armário (Home)

- **Interface:** seletor em pílula acima da sugestão, com `aria-pressed`: `Compass` "Catálogo" e `Library` "Meu armário". Padrão pela D10. No modo armário o filtro de gênero some (a coleção já é a escolha da pessoa).
- **Mecânica:**
  1. Candidatos: itens com `status = 'owned'` do cache da coleção.
  2. Com clima: `climateFit(perfumeTempRange(noteFamilies), temperatura)`. A faixa fica entre o melhor fit e 10 pontos abaixo; tira os vestidos nos últimos 3 dias (memorial em cache), se sobrar algum (D11); escolha estável com `pickDaily` sobre a faixa ordenada por nome.
  3. Sem clima: mesma regra de variação, `pickDaily` sobre todo o "Tenho"; o card mostra "Clima indisponível".
  4. Detalhe e resumo de avaliações pelos services públicos já existentes (`perfumeService.getBySlug`, `reviewService.getSummary`); o card é o mesmo `DailySuggestionCard`, com o rótulo "Do seu armário · Marca" e "Vestir hoje" habilitado (RN06).
  5. "Tenho" vazio: `EmptyState` com `Library`, "Sua prateleira está vazia" e "Explorar catálogo".
- **Dados:** `fromPerfumeRow` passa a expor `noteFamilies` (família de cada nota, com repetição); sem migration. Regras puras em `lib/closetSuggestion.ts`. Chave privada `['private', userId, 'home', 'closet', date]` (depende da coleção; nunca persistida).
- **RN10 revisada:** "No modo Catálogo, a mesma data dá o mesmo perfume para todos. No modo Meu armário, a escolha vem só do 'Tenho' do usuário e é estável na mesma data, salvo mudança na coleção ou no memorial." Números (10 pontos, 3 dias, mínimo de 3 para o padrão) vão para `constants/climate.ts`.
- **Testes:** Vitest de `lib/closetSuggestion.ts` (faixa, variação, sem clima, coleção de 1 item, todos vestidos recentemente), do `noteFamilies` em `fromPerfumeRow` e do seletor na `HomePage`; E2E do modo armário.

### 5.5 Fases 18 e 19 (especificação inicial; refinar antes de estimar)

**18A: "Combina com você?" (afinidade, D12).** No detalhe do perfume, um bloco calmo com "Afinidade alta / média / baixa" e até dois motivos ("Divide Amadeirado e Âmbar com a sua coleção"; "Você ainda não tem nada Aquático"). Regra pura em `lib/affinity.ts` sobre o DNA (16A) e as famílias e notas do perfume; sem migration. Com afinidade média ou baixa: "Prove num decant antes". Sem DNA suficiente (D3): "Seu DNA ainda está se formando". Não aparece para perfumes que a pessoa já tem.

**18B: Comparador.** `/compare?a=<slug>&b=<slug>`, entrada pelo detalhe ("Comparar com…") com busca. Lado a lado: pirâmide resumida, famílias (`FamilyBar`), fixação e rastro, clima adequado hoje, melhor preço e afinidade de cada um. Só dados públicos e o DNA; sem migration. Sem duelos (D13).

**19: Memorial em calendário.** Grade mensal na tela do memorial com a miniatura do perfume em cada dia e navegação entre meses; toque abre o perfume. Service `dailyService.getRange(from, to)` (o índice `(user_id, date desc)` já atende); as datas já são civis no fuso do perfil, sem conversão. Ideia seguinte, que reaproveita o `sotdCanvas`: **"Seu ano em perfumes"**, uma retrospectiva compartilhável no fim do ano.

---

## 6. Priorização

| Ordem | Funcionalidade                         | Alcance |  Impacto   | Confiança | Esforço | Migration  |  Fase   |
| :---: | :------------------------------------- | :-----: | :--------: | :-------: | :-----: | :--------- | :-----: |
|   1   | **Card SOTD (stories)**                |  Alto   |    Alto    |    85%    |  Médio  | Não        | **16B** |
|   2   | **DNA Olfativo no Perfil**             |  Alto   |    Alto    |    90%    |  Médio  | Só função  | **16A** |
|   3   | **Sugestão do Meu armário na Home**    |  Alto   | Muito Alto |    85%    |  Médio  | Não        | **17B** |
|   4   | **Formatos (Frasco, Decant, Amostra)** |  Médio  |    Alto    |    90%    |  Médio  | Sim (RN11) | **17A** |
|   5   | **"Combina com você?" (afinidade)**    |  Médio  |    Alto    |    75%    |  Médio  | Não        | **18A** |
|   6   | **Comparador**                         |  Médio  |   Médio    |    80%    |  Médio  | Não        | **18B** |
|   7   | **Memorial em calendário**             |  Médio  |   Médio    |    90%    |  Baixo  | Não        | **19**  |

Por que esta ordem:

- **16B antes de 16A:** maior retorno sem tocar no banco, e cada story é divulgação orgânica do Sillage.
- **17B antes de 17A:** a sugestão do armário dá motivo para abrir o app todo dia e para manter o "Tenho" atualizado; só depois vale pedir que a pessoa detalhe a coleção. Por isso o alcance de 17B subiu para Alto (com D10, vira o padrão para quem tem coleção).
- **18A antes de 18B:** a afinidade reaproveita o DNA recém-entregue e ajuda a decidir compras caras, a dor central do colecionador de nicho.

Cada linha é um PR próprio, com docs e testes no mesmo PR (`AGENTS.md`).
