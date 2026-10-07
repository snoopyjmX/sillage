# Design system

Fonte de verdade dos valores: `src/styles/tokens.css`. Este documento descreve e cataloga; se divergir do CSS, vale o CSS. Direção: tema **claro (Verde Folha)** como base, escuro por alternância, serifada nos títulos, vidro só em camadas flutuantes (`docs/PRODUCT.md`, Seções 9 e 10). Referências visuais (só aparência): `docs/design/`.

## Regras

- Componentes usam **apenas tokens**: nenhuma cor literal (`#hex`, `rgb()`, `hsl()`) em `src/components/**`. O teste `src/components/no-loose-values.test.ts` falha se houver.
- Nenhum componente contém regra de negócio. Dados e ações chegam por props; textos de tela vêm de quem usa.
- Animar só `transform` e `opacity` (altura só no Drawer, e hoje nem ele a anima). Uma única biblioteca: `motion/react`.
- `npm run check:contrast` valida o contraste WCAG dos tokens e roda no CI.

## Tema

- Opções: claro, escuro e **sistema** (padrão). `ThemeProvider` (`components/layout`) aplica a classe `.dark` no `<html>`; o botão `ThemeToggle` alterna claro → escuro → sistema.
- A escolha vai para `localStorage` (chave `sillage-theme`, dentro de `try/catch`). Um script inline no `index.html` aplica o tema antes da primeira pintura, para não piscar o tema errado.
- Claro é a base (`:root`); o escuro redefine as variáveis em `.dark`, que também funciona em sub-árvores (a vitrine usa isso).

## Cores

Valores em hexadecimal; `rgba` quando há transparência. Classes Tailwind: `bg-background`, `text-muted-foreground`, `border-input` etc. (mapeadas em `@theme inline`).

| Token (CSS)                           | Claro                  | Escuro                   | Uso                                          |
| ------------------------------------- | ---------------------- | ------------------------ | -------------------------------------------- |
| `--background`                        | `#F6F4ED`              | `#0F1411`                | Fundo do app                                 |
| `--surface` / `--card` / `--popover`  | `#FFFFFF`              | `#181E1A`                | Cards, painéis, popovers                     |
| `--foreground` (`--text-primary`)     | `#17231C`              | `#EEF3EC`                | Texto principal                              |
| `--text-secondary`                    | `#4C5B52`              | `#B4C0B7`                | Texto de apoio                               |
| `--text-muted` (`--muted-foreground`) | `#5F6D64`              | `#8E9C93`                | Legendas, placeholders                       |
| `--primary` (`--ring`)                | `#36694C`              | `#86C9A2`                | Acento: botão, foco, estado ativo            |
| `--primary-foreground` (on-primary)   | `#FFFFFF`              | `#08150F`                | Texto sobre o primário                       |
| `--secondary` / `--muted`             | `#EEEBE2`              | `#202823`                | Fundos neutros (abas, skeleton, chip neutro) |
| `--accent`                            | `#E4EBE0`              | `#223028`                | Hover e seleção                              |
| `--border`                            | `rgba(0,0,0,0.08)`     | `rgba(255,255,255,0.10)` | Divisórias e contornos (decorativos)         |
| `--input`                             | `rgba(23,35,28,0.55)`  | `rgba(238,243,236,0.50)` | Borda de campos (≥ 3:1)                      |
| `--success`                           | `#2E7D5B`              | `#6FAF8F`                | Feedback (texto ≥ 4,5:1)                     |
| `--warning`                           | `#98641A`              | `#D9A55B`                | Feedback                                     |
| `--error` (`--destructive`)           | `#C0392B`              | `#E5776E`                | Feedback e ações destrutivas                 |
| `--destructive-foreground`            | `#FFFFFF`              | `#1A0907`                | Texto sobre destrutivo                       |
| `--badge-concentration`               | `rgba(54,105,76,0.10)` | `rgba(134,201,162,0.16)` | Fundo do selo de concentração                |
| `--badge-concentration-foreground`    | `#36694C`              | `#86C9A2`                | Texto do selo                                |
| `--overlay`                           | `rgba(23,35,28,0.40)`  | `rgba(0,0,0,0.60)`       | Scrim de Dialog/Drawer (sem blur)            |

### Famílias olfativas

No claro: fundo na cor da família, texto `#1F1B18`. No escuro: a cor a 22% de opacidade sobre o card, com o texto na cor clareada (35% em direção ao branco).

| Família  | Claro (fundo) | Escuro (fundo, 22%)      | Escuro (texto) |
| -------- | ------------- | ------------------------ | -------------- |
| citrus   | `#F6EE9A`     | `rgba(246,238,154,0.22)` | `#F9F4BD`      |
| floral   | `#F8CFE0`     | `rgba(248,207,224,0.22)` | `#FAE0EB`      |
| woody    | `#E6CDB0`     | `rgba(230,205,176,0.22)` | `#EFDECC`      |
| green    | `#CDE8B8`     | `rgba(205,232,184,0.22)` | `#DEF0D1`      |
| aquatic  | `#BFE2F2`     | `rgba(191,226,242,0.22)` | `#D5ECF7`      |
| oriental | `#F5C98F`     | `rgba(245,201,143,0.22)` | `#F8DCB6`      |
| spicy    | `#F4B9A6`     | `rgba(244,185,166,0.22)` | `#F8D2C5`      |
| fruity   | `#FBC3B8`     | `rgba(251,195,184,0.22)` | `#FCD8D1`      |
| aromatic | `#D8D2F0`     | `rgba(216,210,240,0.22)` | `#E6E2F5`      |
| musky    | `#E4DAD2`     | `rgba(228,218,210,0.22)` | `#EDE7E2`      |

### Ajustes de contraste feitos nesta fase

Cores aprovadas só mudam quando o script acusa falha. Antes → depois:

| Token (modo)                    | Antes     | Depois    | Motivo                                                                     |
| ------------------------------- | --------- | --------- | -------------------------------------------------------------------------- |
| `--warning` (claro)             | `#B7791F` | `#98641A` | Como texto dava 3,64:1 (surface) e 3,31:1 (background); agora 5,03 e 4,57. |
| `--secondary`/`--muted` (claro) | `#ECE9DF` | `#EEEBE2` | Token criado nesta fase (não estava na lista aprovada): 4,48:1 → 4,57:1.   |

## Tipografia

Fontes empacotadas com `@fontsource` (subset latino, `font-display: swap`).

| Papel             | Fonte    | Pesos         | Tamanho / altura de linha (mobile → desktop)            |
| ----------------- | -------- | ------------- | ------------------------------------------------------- |
| Display           | Fraunces | 500, 600      | 40/44 → 56/60                                           |
| Heading 1 / 2 / 3 | Fraunces | 500, 600      | 32/38, 24/30, 20/26                                     |
| Body              | Inter    | 400, 500, 600 | 16/24                                                   |
| Small             | Inter    | 400, 500      | 14/20                                                   |
| Caption / Label   | Inter    | 500           | 12/16; label em caixa alta com `letter-spacing: 0.08em` |

A serifada só a partir de 20 px. Campos de formulário em 16 px ou mais (iOS não dá zoom ao focar). Classes: `font-sans`, `font-heading`.

## Raios, elevação e vidro

- **Raios:** `sm` 6, `md` 10, `lg` 14, `xl` 20, `2xl` 28, `full`.
- **Elevação:** borda de 1px + sombras suaves: `shadow-subtle`, `shadow-card`, `shadow-floating`, `shadow-modal` e `shadow-pill` (relevo estático da pílula de navegação: realce interno + sombra suave; valores em `--elevation-*`, diferentes no escuro).
- **Vidro** (`.glass`): fundo `surface` a 70% + `backdrop-filter: blur(20px)` + borda. Usado em Dialog, Drawer e nas barras fixas (`.glass-bar`: a navbar); no máximo 2 camadas visíveis (as barras viram sólidas enquanto há Dialog/Drawer aberto, via `body[data-scroll-locked]`); nunca em itens de lista. Sobre vidro, texto de apoio usa `text-text-secondary` (não `muted-foreground`): o fundo efetivo é o vidro a 70% sobre o scrim e o muted cai abaixo de 4,5:1 no claro (apontado pelo axe). Fallback para `popover` sólido sem `backdrop-filter` e com `prefers-reduced-transparency`.

## Motion

Constantes em `src/lib/motion.ts` (componentes importam, não repetem números). Raiz do app com `MotionConfig reducedMotion="user"`; no CSS, `prefers-reduced-motion` desliga o shimmer e o press.

| Categoria       | Duração                                 | Curva                            | Uso                                 |
| --------------- | --------------------------------------- | -------------------------------- | ----------------------------------- |
| Microinteração  | 150 ms                                  | `ease-out`                       | Press do botão (`scale 0.97`), chip |
| Transição curta | 240 ms                                  | `cubic-bezier(0.22, 1, 0.36, 1)` | Aparição do scrim, troca de aba     |
| Página          | 360 ms                                  | mesma curva                      | `opacity` + `y` de 10 px na entrada |
| Saída           | 180 ms                                  | `ease-out`                       | Nunca passa de 200 ms               |
| Modal e drawer  | spring (`stiffness 380`, `damping 34`)  | n/a                              | Dialog, Drawer                      |
| Spring físico   | spring (`stiffness 400`, `damping 30`)  | n/a                              | Indicador de aba (`layoutId`)       |
| Stagger         | até 40 ms entre itens, no máx. 12 itens | n/a                              | `staggerDelay(index)`               |

## Inventário de componentes (`src/components/ui/`)

| Componente        | Origem                                  | Variantes e estados                                                                            | Notas                                                                                                                                                                                      |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`          | shadcn (adaptado)                       | default, secondary, outline, ghost, destructive, link; sm, default, lg, icon; disabled         | `asChild`; altura padrão 44 px; sem animação de cor                                                                                                                                        |
| `Input`           | shadcn (adaptado)                       | normal, `aria-invalid`, disabled                                                               | 16 px; borda ≥ 3:1                                                                                                                                                                         |
| `Card`            | shadcn (adaptado)                       | Header, Title, Description, Content, Footer                                                    | Borda + `shadow-card`                                                                                                                                                                      |
| `Chip`            | própria                                 | neutro; 10 famílias; selo de concentração; selecionável (`aria-pressed`)                       | Alvo de toque de 44 px no modo botão                                                                                                                                                       |
| `Dialog`          | shadcn sobre Radix (animação reescrita) | aberto/fechado, com Close                                                                      | Foco preso e devolvido pelo Radix; vidro; animação por `motion`                                                                                                                            |
| `Drawer`          | própria (Radix Dialog + motion)         | `bottom` (arrasta pela alça para fechar), `right`                                              | Não usa `vaul`; vidro; respeita safe area                                                                                                                                                  |
| `Tabs`            | shadcn sobre Radix (adaptado)           | genérica; indicador com `layoutId`                                                             | Sem aba padrão fixa: quem usa define `defaultValue`                                                                                                                                        |
| `Rating`          | própria                                 | radiogroup interativo (1 a 5); somente leitura com decimais; disabled                          | Setas, Home/End; alvos de 44×44 px; números com `Intl.NumberFormat('pt-BR')`                                                                                                               |
| `Skeleton`        | shadcn (adaptado)                       | bloco com shimmer                                                                              | Shimmer por `transform`; desliga em reduced motion                                                                                                                                         |
| `EmptyState`      | própria                                 | ícone, título, descrição, ação                                                                 | Sem texto fixo                                                                                                                                                                             |
| `ErrorState`      | própria                                 | `role="alert"`, ação de tentar de novo                                                         | Texto padrão genérico; mensagem do Supabase nunca chega aqui                                                                                                                               |
| `Field`           | própria                                 | Rótulo real + `Input` (16 px) + dica e erro ligados por `aria-describedby`; `aria-invalid`     | Sem erro: só rótulo (e dica, se houver)                                                                                                                                                    |
| `PasswordField`   | própria                                 | `Field` com botão "Mostrar senha"/"Ocultar senha" (`aria-pressed`, alvo de 44 px)              | Usa `endAdornment` do `Field`; a mensagem de erro vive numa região `aria-live="polite"` sempre montada                                                                                     |
| `SubmitButton`    | própria                                 | `Button` de envio com `aria-busy`/`aria-disabled` (continua focável) e spinner `motion`        | Carregando ignora novo clique e troca o texto (`loadingLabel`)                                                                                                                             |
| `FormAlert`       | própria                                 | `role="alert"` (erro) ou `role="status"` (sucesso), ícone + texto, não só cor                  | Texto vem de `constants/errors.ts`                                                                                                                                                         |
| `Toaster`         | shadcn (Sonner)                         | sucesso, erro, aviso, neutro                                                                   | Disparo por `@/lib/toast`; segue o tema                                                                                                                                                    |
| `ThemeToggle`     | própria                                 | claro, escuro, sistema                                                                         | Usa `ThemeProvider` e `useTheme`                                                                                                                                                           |
| `AsyncBoundary`   | própria                                 | carregando, vazio, erro (tentar de novo), offline, sucesso                                     | Offline = sem rede e sem dados na mão; mensagem do Supabase nunca passa                                                                                                                    |
| `HoverGlowButton` | 21st.dev (HoverButton)                  | normal, hover com brilho que segue o mouse, foco, `disabled` e `aria-disabled`                 | Base do `CollectionToggle` (card e detalhes do perfume)                                                                                                                                    |
| `DropdownMenu`    | shadcn sobre Radix (animação reescrita) | aberto/fechado; item, item de seleção única (`menuitemradio`, com check), separador            | Teclado e foco pelo Radix; não modal (o modo modal gera `aria-hidden-focus` no axe); itens de 44 px; animação por `motion` (`opacity` e `y` de 4 px, saída ≤ 200 ms), sem `tw-animate-css` |
| `Textarea`        | shadcn (adaptado)                       | normal, `aria-invalid`, disabled                                                               | 16 px; borda ≥ 3:1; usado no comentário da avaliação                                                                                                                                       |
| `ThemeToggler`    | 21st.dev (AnimatedThemeToggler)         | claro ⇄ escuro (parte do tema resolvido; o `ThemeToggle` segue com o ciclo que inclui sistema) | Usa `useTheme`; troca suave por View Transitions (fade, sem `clip-path`); sem transição em reduced motion                                                                                  |
| `BlurFade`        | 21st.dev (BlurFade)                     | aparece com `opacity` + deslocamento; `inView` anima ao entrar na tela; `blur` opcional        | Desfoque (`filter`) opt-in e desligado por padrão; pronto em reduced motion; atraso em listas até o 12º item; usado em `PerfumeGrid` e na Home                                             |
| `TypingAnimation` | 21st.dev (TypingAnimation)              | digita o texto; cursor que pisca por `opacity`                                                 | Texto completo em `sr-only` (a digitação é `aria-hidden`); espaço reservado, sem salto de layout; pronto em reduced motion                                                                 |
| `Meter`           | própria                                 | `role="meter"` somente leitura: trilho + preenchimento por `scaleX`, texto do valor visível    | Sem animação; usado em Rastro e Clima adequado da sugestão do dia                                                                                                                          |
| `fireConfetti`    | própria (sobre `canvas-confetti`)       | dois jatos laterais, cores lidas dos tokens                                                    | Dispara no sucesso do cadastro (`useSignUp`); `disableForReducedMotion`                                                                                                                    |

**21st.dev:** `HoverGlowButton` (HoverButton), `ThemeToggler` (AnimatedThemeToggler), `BlurFade` e `TypingAnimation`, todos passaram pelos 7 passos da Seção 10. Alterações comuns: cores só por tokens, só `transform` e `opacity` (o `clip-path` do toggler e o `filter` do BlurFade saíram ou ficaram opt-in), `motion/react` no lugar de `framer-motion`, pronto em reduced motion, alvos de 44 px e foco visível. Detalhes do `HoverGlowButton`: props de cor em hexadecimal removidas (fundo `bg-card`, texto `text-primary`, brilho `var(--primary)`); sem `tw-animate-css`; brilho desligado em reduced motion e em toque (só `pointerType` mouse). A Sidebar do 21st.dev foi avaliada e descartada (navegação de dashboard; os filtros ficam no `FilterPanel` e no `Drawer`). `AdaptivePillNav` (navbar "3d-adaptive-navigation-bar", 2026-10): reescrita com `motion/react`, tokens, links reais (react-router ou âncoras) com `aria-current`, sombra estática (`shadow-pill`) e sem animar width. O hover-only, os `button` com `scrollTo`, hex e px soltos do original saíram. Caminho escolhido: o **fallback** (pílula sempre aberta, indicador do item ativo por `layoutId` com o spring `physical`, só transform), porque recolher/expandir sem animar width exigiria medir e escalar camadas (distorce o raio) e esconderia links de quem navega por teclado ou toque. Em reduced motion o indicador troca sem movimento.

## Vitrine de desenvolvimento

`npm run dev` e abrir `http://localhost:5173/?vitrine`. Mostra todos os componentes nos modos claro e escuro lado a lado. Existe só em desenvolvimento (`import.meta.env.DEV`) e não entra no build.

## Componentes de tela (Fase 4)

| Componente                                             | Pasta                   | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BestPrice`                                            | `components/perfume`    | Seção "Melhor preço encontrado" da página de detalhes, abaixo dos botões de coleção e avaliação: cartão discreto (`bg-card`, borda, `shadow-subtle`), preço em `font-heading` e botão `outline` "Ver na loja" (`target="_blank"`, `rel="noopener noreferrer"`, só `http(s)`). Sem preço ou sem link válido, não renderiza nada                                                                                                                                                                                                                         |
| `AppShell`, `Navbar`                                   | `components/layout`     | Navbar de vidro (`.glass-bar`) com logo (`/favicon-32x32.png` + "Sillage" em Fraunces, sem inversão de cor; abaixo de 400 px só o logo é visível), `AdaptivePillNav`, `ThemeToggler` e "Entrar" (visitante). `Navbar` aceita `mode` (`app` padrão, `landing`). Safe areas e itens de 44 px ou mais                                                                                                                                                                                                                                                     |
| `AdaptivePillNav`                                      | `components/ui`         | Origem 21st.dev (ver acima). Modos: `app` (Início, Catálogo, Coleção, Perfil; `NavLink` com `aria-current="page"`) e `landing` (âncoras Início, Como funciona, Recursos, Acessar com `aria-current="location"` pelo hash, mais Entrar e Criar conta). Abaixo de 768 px: pílula compacta com o rótulo ativo (ou "Menu") e o botão "Abrir menu", que abre o `Drawer` `right` (nav "Menu principal"; `menuExtra` recebe "Instalar app"). Estados: ativo, hover, foco visível, reduced motion                                                              |
| `Footer`                                               | `components/layout`     | Wordmark "Sillage" com a definição da palavra e colunas Topo (Explorar), Coração (Sua conta) e Fundo (Projeto: crédito e versão do package.json). Visitante vê Entrar, Criar conta e "Esqueci minha senha" no lugar dos links privados. Rastro decorativo (`aria-hidden`): 3 fios sobem só com transform e opacity, loop lento (`durations.ambient`), desligado em reduced motion. Linha reservada para a atribuição do Open-Meteo (14D). No `AppShell` reserva o espaço do botão do Nez e a safe area. Sem link para o GitHub: o README não o declara |
| `PerfumeCard`                                          | `components/perfume`    | Link para `/perfumes/:slug` (página de detalhes da Fase 5). Sem foto: placeholder com o fundo da **primeira família** do resultado (a função devolve na ordem do enum, não por importância) e sem logo. Até 3 chips de família; o `CollectionToggle` fica fora do link, no rodapé                                                                                                                                                                                                                                                                      |
| `PerfumeCardSkeleton`, `PerfumeGrid`                   | `components/perfume`    | Skeleton com as mesmas dimensões do card; entrada com stagger (só opacity e y; desligada em reduced motion)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CollectionToggle`                                     | `components/collection` | Três estados num botão (`HoverGlowButton`): nenhum ("Adicionar à Coleção"), Tenho ou Quero. Logado abre `DropdownMenu` com Tenho, Quero e Remover; visitante vai para `/login?redirect=<url atual>`. Toast (Sonner) em cada ação; atualização otimista com rollback (`useCollection`). O nome do perfume entra só para leitores de tela                                                                                                                                                                                                                |
| `FilterPanel`, `FilterFields`                          | `components/filters`    | Painel lateral a partir de 1024 px; no celular, uma gaveta (Drawer) aberta por um botão. Só um dos dois existe no DOM. Cada mudança vai direto para a URL                                                                                                                                                                                                                                                                                                                                                                                              |
| `NoteCombobox`                                         | `components/filters`    | Combobox ARIA de seleção múltipla; compara sem acento. Lista absoluta que fecha ao escolher                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `SearchInput`, `SortSelect`, `Pagination`, `YearRange` | `components/filters`    | Busca com debounce de 300 ms (Enter busca já); ordenação por `select` nativo; anos confirmam ao sair do campo                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ActiveFilters`, `FilterChip`                          | `components/filters`    | Chips removíveis e "Limpar filtros"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## Componentes de tela (Fase 5)

| Componente               | Pasta                | Notas                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PerfumeDetailsPage`     | `pages`              | Rota `/perfumes/:slug`. Hero (imagem ou placeholder), marca, nome, concentração, descrição, `CollectionToggle` e pirâmide. Usa `AsyncBoundary`; slug inexistente (`AppError` `not_found`) mostra "Perfume não encontrado" com saída para o catálogo. O resumo do perfume para a coleção sai de `toPerfumeSummary` (`lib/perfume.ts`)                                                          |
| `CollectionPage`         | `pages/collection`   | Rota privada `/collection` (`RequireAuth`). `Tabs` Tenho/Quero com a contagem real de cada uma, grid de `PerfumeCard` dentro de `AsyncBoundary`. Vazio: "Sua coleção está vazia" (ou "Nenhum perfume em “Tenho”/“Quero”") com link para o catálogo. Quem sai de uma aba pelo toggle de um card muda de aba na hora (atualização otimista)                                                     |
| `OlfactoryPyramid`       | `components/perfume` | Momento de assinatura da página (Origem: própria). Três camadas em largura crescente, cada uma um botão com `aria-expanded` e `aria-controls`; no celular só o Topo abre, a partir de 768 px todas. Altura com `springs.modal`, chips com `staggerDelay` (até 40 ms), sem bloquear o toque; em reduced motion tudo é instantâneo. Cada nota é link para `/catalog?notes=<slug>&pos=<posição>` |
| `PerfumePlaceholder`     | `components/perfume` | Fundo na cor da família principal (e ícone de frasco no hero), usado pelo card e pela página enquanto não há fotos                                                                                                                                                                                                                                                                            |
| `PerfumeDetailsSkeleton` | `components/perfume` | Mesmas proporções do conteúdo final (hero 4/5, textos, CTA e três camadas)                                                                                                                                                                                                                                                                                                                    |

**Anel de foco.** No Tailwind 4, `outline-none` zera `--tw-outline-style` e o `focus-visible:outline-2` herdava esse "none", então o anel nunca aparecia. `globals.css` tem agora uma regra fora de `@layer` (`:focus-visible { --tw-outline-style: solid }`) que o devolve só no foco por teclado. Mantenha o padrão `outline-none focus-visible:outline-2 ...` nos componentes.

## Componentes de tela (Fase 8)

| Componente                                        | Pasta              | Notas                                                                                                                                                                                                                               |
| ------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomePage`                                        | `pages`            | Rota pública `/`. Momento de assinatura: o título digitado (`TypingAnimation`). Visitante vê o convite (Entrar e Criar conta); logado vê o Perfume de hoje e o Histórico. `AsyncBoundary` com `DailySkeleton`, vazio, erro, offline |
| `DailyHighlight`, `DailyHistory`, `DailySkeleton` | `components/daily` | Destaque maior (placeholder pela primeira família, chips, link para os detalhes) em `BlurFade`; histórico em grid compacto (até 12 dias anteriores); skeleton com as mesmas dimensões                                               |

## Componentes de tela (Fase 9)

| Componente                                        | Pasta                | Notas                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ReviewForm`                                      | `components/reviews` | Zod + react-hook-form. Fixação e projeção são `Rating` (radiogroup: setas, Home/End, uma parada de Tab por grupo, alvos de 44×44 px). Comentário opcional com contador (até 1000). Editar vem preenchido; remover pede confirmação. Offline: envio desabilitado com explicação. Texto de apoio usa `text-text-secondary` (fica sobre vidro) |
| `ReviewSheet`                                     | `components/reviews` | Dialog a partir de 768 px, bottom-sheet (`Drawer`) abaixo. Só um existe no DOM. O botão que abre fica fora do Radix, então `onCloseAutoFocus` devolve o foco a ele                                                                                                                                                                          |
| `ReviewActions`, `ReviewSummaryLine`              | `components/reviews` | Hero dos detalhes: nota média (fixação e projeção juntas) e contagem; botão "Avaliar fragrância" (visitante vai para `/login?redirect=`) que vira "Editar minha avaliação"                                                                                                                                                                  |
| `ReviewsSection`, `ReviewCard`, `ReviewsSkeleton` | `components/reviews` | Seção abaixo da pirâmide: médias, "Sua avaliação" primeiro e a lista pública (nome de exibição, data, notas, comentário) com `BlurFade` ao rolar. `AsyncBoundary`: skeleton, vazio, erro, offline. Comentário sempre como texto                                                                                                             |

## Componentes de tela (Fase 11)

| Componente               | Pasta               | Notas                                                                                                                                                                 |
| ------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OfflineBanner`          | `components/layout` | Faixa sob a Navbar só sem conexão ("Você está navegando offline. O catálogo salvo continua disponível."); `role="status"`; anima só `opacity` e `y`                   |
| `InstallAppButton`       | `components/layout` | Navbar (desktop) e menu (celular). Android: `beforeinstallprompt`; iOS: `Dialog` com "Compartilhar → Adicionar à Tela de Início". Some se já instalado ou sem suporte |
| `Tooltip`, `OfflineHint` | `components/ui`     | Tooltip sobre Radix, sem animação. `OfflineHint` envolve o botão de escrita desabilitado num wrapper focável com a explicação                                         |

Ajustes visuais da fase: `NezFab` respeita `env(safe-area-inset-bottom)` e o `<main>` reserva espaço embaixo; `PerfumeGrid` propaga `h-full` (`li` e `BlurFade`) e o placeholder do card ganhou o ícone de frasco; ícones soltos (Navbar, ReviewActions) com `size-*` explícito.

## Telas de autenticação (Fase 14C)

`/login`, `/register`, `/forgot-password` e `/reset-password` ficam fora do `AppShell` (rotas irmãs em `routes/router.tsx`). `AuthCard` é o layout dividido: formulário com link "Voltar" para `/` e, a partir de `md`, painel de marca (`bg-accent`, logo, pirâmide olfativa decorativa `aria-hidden` e frase com `TypingAnimation` assinada "Sillage"). Sem imagens externas. O momento de assinatura da tela é a frase digitada; confetes no cadastro continuam em `useSignUp`.

## Home (Fase 14D)

Momento de assinatura da tela: a digitação do título ("Descubra a fragrância de hoje"); o resto é calmo (`BlurFade` com stagger de até 12 itens e 40 ms). Só tokens, só `transform` e `opacity`.

| Componente                                           | Pasta                | Notas                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WeatherBar`                                         | `components/weather` | Cidade, temperatura, descrição, umidade, frase da faixa e chips de família ("Sillage ótima"). Estados: carregando (skeleton), pronto, erro com tentar de novo, indisponível, offline. Só o botão "Usar minha localização" (sem "voltar à cidade"); negação ou falha de localização em `role="alert"`; rótulo "Sua localização" |
| `HomeHeader`                                         | `components/home`    | Selo "Edição diária · mês de ano" (token `badge-concentration`) e o título com `TypingAnimation`                                                                                                                                                                                                                               |
| `DailySuggestionCard`                                | `components/home`    | Imagem (variante `medium`, fundo transparente sobre `accent`), concentração, marca, nome, descrição, notas por posição (chips), Fixação (`Rating` 1 a 5), Rastro e Clima adequado (`Meter`), "Vestir hoje" e "Ver detalhes". Sem dados inventados (nada de curadoria nº, volume ou evolução). Skeleton com as mesmas dimensões |
| `PerfumeImage`                                       | `components/perfume` | Cadeia variante → original → placeholder (`onError`), com largura e altura declaradas                                                                                                                                                                                                                                          |
| `RecentPerfumes`, `SimilarToToday`, `FamilyExplorer` | `components/home`    | Descobertas. Todas com `AsyncBoundary` (carregando, vazio, erro, offline); "Explore por família" são links para `/catalog?families=...` com alvo de 44 px                                                                                                                                                                      |

## Perfil (Fase 14E)

`/profile` usa o `AppShell` (pílula e Footer). Momento de assinatura da tela: a entrada do avatar de iniciais (escala e opacidade, mola `physical`, sem animar em reduced motion); o resto é calmo (`BlurFade` com stagger de 40 ms). Só tokens, só `transform` e `opacity`. Upload de foto está fora do MVP.

| Componente      | Pasta                | Notas                                                                                                                                                           |
| --------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProfileAvatar` | `components/profile` | Círculo de 64 px (`size-16`, `bg-accent`, `text-primary`, fonte de título) com as iniciais; sem letra, ícone `User`. `aria-hidden`: o nome vem em texto ao lado |
| `ProfileHeader` | `components/profile` | Avatar, nome (`h2`), fuso, e-mail e "Sair"; skeleton equivalente (`ProfileHeaderSkeleton`)                                                                      |
| `ProfileStats`  | `components/profile` | Cartões "Tenho", "Quero" e "No memorial" numa lista de definição (`dl`), 1 coluna a 360 px e 3 a partir de `sm`; skeleton com a mesma altura                    |
| `ProfileForm`   | `components/profile` | Nome e fuso (RHF + Zod) com `Field` (alvo de 44 px); o fuso usa `datalist` com os fusos do navegador; `SubmitButton` com "Salvando…"                            |
| `DangerZone`    | `components/profile` | Cartão com borda `destructive`, botão "Excluir conta" e `Dialog` de confirmação com "Cancelar" e a ação destrutiva desativada ("Em breve")                      |

Estados: o perfil e o resumo usam `AsyncBoundary` (skeleton, vazio, erro com tentar de novo, offline), cada um no seu bloco: falha do resumo não esconde o formulário. Sem dados, o resumo vira um `EmptyState` com link para o catálogo.
