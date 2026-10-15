# Plano: Checkbox e medidor de força de senha

Planejamento para levar um `Checkbox` próprio e um medidor de força de senha ao Sillage. Revisado em 2026-10-15 contra o código e os docs (DESIGN_SYSTEM, ARCHITECTURE, PRODUCT §10–12, SECURITY). **Status: planejado, não executado.**

---

## 1. Objetivo

1. Um `Checkbox` em `src/components/ui/checkbox.tsx` que substitui os dois `<input type="checkbox" className="size-5 accent-primary">` do app.
2. Um medidor de força de senha no cadastro (`/register`) e na redefinição (`/reset-password`), com as regras de `src/schemas/auth.ts` como única fonte.
3. Ambos na vitrine (`src/dev/Showcase.tsx`) e catalogados em `docs/DESIGN_SYSTEM.md`.

Fora de escopo: login (não cria senha), o campo "Repita a nova senha", e qualquer mudança no Supabase Auth (ver §8).

---

## 2. O que a revisão mudou em relação à versão anterior

| Versão anterior                                                      | Realidade do código                                                                                                                                  | Decisão                                                                                                                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `React.forwardRef<HTMLInputElement>`                                 | React 19; nenhum `forwardRef` no projeto. `Input` usa `ComponentProps<'input'>` e `ref` chega como prop.                                             | Mesmo padrão do `Input`. Sem `forwardRef`.                                                                                                                             |
| Barra de força nova, com `role="meter"` próprio                      | Já existe `src/components/ui/meter.tsx` (`role="meter"`, `aria-valuetext`, `scaleX`, sem animação), usado em Rastro e no Comparador.                 | Reaproveitar o `Meter` e adicionar a prop opcional `tone`. Sem segundo medidor.                                                                                        |
| `PasswordStrength` em `components/ui` com hook `usePasswordStrength` | DESIGN_SYSTEM: "Nenhum componente contém regra de negócio… textos de tela vêm de quem usa". ARCHITECTURE: regra em `lib`/service, não no componente. | Regra pura em `src/lib/passwordStrength.ts` (testada). Componente de tela em `src/components/auth/PasswordStrength.tsx`. Sem hook: é cálculo síncrono e puro.          |
| Regex de letra/número reescritas no medidor                          | Já estão em `newPassword` (`schemas/auth.ts`).                                                                                                       | Exportar `PASSWORD_LETTER` e `PASSWORD_DIGIT` do schema; schema e medidor importam as mesmas constantes, junto com `MIN_PASSWORD_LENGTH`.                              |
| Preenchimento animado por `motion/react`, anúncio com debounce       | Nas telas de acesso o momento de assinatura é a frase digitada (DESIGN_SYSTEM, "Telas de autenticação"). O `Meter` atual não anima.                  | **Sem animação** no medidor e no checkbox: telas calmas e nada a desligar em reduced motion. O anúncio muda só quando o **nível** muda, então não precisa de debounce. |
| Nível 3 "Boa" em `text-warning` / `text-success`                     | Ambíguo.                                                                                                                                             | Tabela fechada em §4.2. `success`, `warning` e `error` já passam 4,5:1 em `surface` e `background` (`check:contrast`).                                                 |
| Rótulo "Vazia" no score 0                                            | Ruído: o `hint` do campo já diz o mínimo.                                                                                                            | Senha vazia não mostra medidor. A região `aria-live` continua montada.                                                                                                 |
| Checkbox com wrapper de 44 px novo                                   | `ShareCardDialog` já tem `min-h-11` no `label`; `ProfileForm` **não tem**.                                                                           | O próprio `Checkbox` renderiza o `label` com `min-h-11`. Isso corrige o `ProfileForm` e padroniza.                                                                     |
| Branch criada a partir do branch atual                               | O branch atual (`feat/catalogo-expansao-batch`) tem trabalho de catálogo sem commit.                                                                 | Criar o branch a partir de `main` depois de commitar ou guardar o catálogo (§6, passo 0).                                                                              |

---

## 3. Checkbox (`src/components/ui/checkbox.tsx`)

**Origem:** própria (snippet externo usado só como referência visual; não é do 21st.dev, então o fluxo de curadoria não se aplica, mas a origem fica registrada).

**API**

```ts
type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  label: ReactNode; // texto visível, pt-BR, vem de quem usa
};
```

**Estrutura:** `label` (`flex min-h-11 items-center gap-3 text-sm cursor-pointer`) → `span relative size-5` com:

- um `<input type="checkbox">` nativo com `peer appearance-none` ocupando a caixa (o input continua sendo o elemento real: `getByRole('checkbox')`, `.uncheck()` do Playwright, `onChange(event.target.checked)` e `register()` do RHF seguem iguais);
- o ícone `Check` do Lucide (`aria-hidden`, `pointer-events-none`), visível com `peer-checked:opacity-100`.

**Estados (só tokens)**

| Estado       | Classes                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Desmarcado   | `rounded-sm border border-input bg-card`                                                                             |
| Marcado      | `checked:border-primary checked:bg-primary`; ícone `text-primary-foreground`                                         |
| Hover        | `hover:border-primary`                                                                                               |
| Foco         | `outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` (padrão do `Input`) |
| Desabilitado | `disabled:cursor-not-allowed disabled:opacity-50`; no label, `has-[:disabled]:cursor-not-allowed`                    |

Sem animação: a troca é imediata, como no `Meter`.

---

## 4. Medidor de força de senha

### 4.1. Regra pura: `src/lib/passwordStrength.ts`

```ts
export type PasswordLevel = 0 | 1 | 2 | 3 | 4;
export interface PasswordStrength {
  level: PasswordLevel; // 0 = vazia
  meetsPolicy: boolean; // mesmas exigências do schema
  checks: { length: boolean; letter: boolean; digit: boolean };
  weakPattern: boolean;
}
export const evaluatePassword = (value: string): PasswordStrength => { … };
```

- `length`: `value.length >= MIN_PASSWORD_LENGTH`; `letter`: `PASSWORD_LETTER`; `digit`: `PASSWORD_DIGIT` (tudo importado de `schemas/auth.ts`).
- **Pontuação**
  - vazia → 0
  - não cumpre a política → 1
  - cumpre → 2, mais 1 ponto para cada extra: comprimento ≥ 12, símbolo (`/[^A-Za-z0-9]/`), maiúscula e minúscula juntas. Teto 4.
  - `weakPattern` (sequência conhecida como `123456`, `abcdef`, `qwerty`, `senha`, `password`; ou 4+ caracteres iguais seguidos) → teto 2.
- Não bloqueia nada. A validação de envio continua sendo só o Zod.

### 4.2. Tela: `src/components/auth/PasswordStrength.tsx`

`<PasswordStrength value={password} />`, com textos pt-BR aqui, não no `ui`:

| Nível | Rótulo     | `tone` do `Meter` |
| ----- | ---------- | ----------------- |
| 1     | "Fraca"    | `error`           |
| 2     | "Razoável" | `warning`         |
| 3     | "Boa"      | `success`         |
| 4     | "Forte"    | `success`         |

- `Meter label="Força da senha" min={0} max={4} value={level} valueText={rótulo} tone={…}`. O rótulo é texto visível, então a cor não é o único sinal.
- Com `weakPattern`: linha `text-sm text-text-secondary` com "Evite sequências ou repetições, como 123456 ou aaaa."
- Vazia: não renderiza o `Meter`.
- `<p className="sr-only" aria-live="polite">` sempre montado, com "Força da senha: {rótulo}". Muda só quando o nível muda, então o leitor de tela não fala a cada tecla.
- Sem lista de critérios: o `hint` do `PasswordField` já descreve a política e está ligado ao input por `aria-describedby`. Duplicar só faria ruído.

### 4.3. `Meter`: prop `tone`

`tone?: 'primary' | 'error' | 'warning' | 'success'` (padrão `primary`), mapeado para `bg-primary`, `bg-error`, `bg-warning` e `bg-success` no preenchimento. Rastro e Comparador não mudam. O preenchimento continua por `scaleX` e sem animação.

---

## 5. Arquivos

**Novos**

| Arquivo                                         | Conteúdo |
| ----------------------------------------------- | -------- |
| `src/components/ui/checkbox.tsx`                | §3       |
| `src/components/ui/checkbox.test.tsx`           | §7       |
| `src/lib/passwordStrength.ts`                   | §4.1     |
| `src/lib/passwordStrength.test.ts`              | §7       |
| `src/components/auth/PasswordStrength.tsx`      | §4.2     |
| `src/components/auth/PasswordStrength.test.tsx` | §7       |

**Alterados**

| Arquivo                                    | Mudança                                                                                                                                                                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/schemas/auth.ts`                      | Exportar `PASSWORD_LETTER = /[A-Za-z]/` e `PASSWORD_DIGIT = /\d/` e usá-los em `newPassword`. Mensagens iguais.                                                                                                  |
| `src/components/ui/meter.tsx`              | Prop `tone` (§4.3).                                                                                                                                                                                              |
| `src/components/profile/ProfileForm.tsx`   | Trocar o `label` + `input` por `<Checkbox label="Detectar fuso horário automaticamente" checked={auto} onChange={…} />`. Ganha o alvo de 44 px que faltava.                                                      |
| `src/components/daily/ShareCardDialog.tsx` | Mesma troca, `label="Mostrar a cidade"`.                                                                                                                                                                         |
| `src/pages/auth/RegisterPage.tsx`          | `watch` do `useForm`; `const password = watch('password') ?? ''`; `<PasswordStrength value={password} />` logo depois do `PasswordField`. Remover a linha em branco solta dentro do `PasswordField`.             |
| `src/pages/auth/ResetPasswordPage.tsx`     | O mesmo, depois do campo "Nova senha" (não no de confirmação).                                                                                                                                                   |
| `src/dev/Showcase.tsx`                     | Seção "Checkbox" (desmarcado, marcado, desabilitado, desabilitado marcado) e "Força da senha" (um `PasswordField` controlado com o medidor), nos dois painéis.                                                   |
| `src/pages/auth/auth-pages.test.tsx`       | Casos novos (§7).                                                                                                                                                                                                |
| `docs/DESIGN_SYSTEM.md`                    | Inventário: linha `Checkbox` e `tone` na linha `Meter`. "Telas de autenticação": linha `PasswordStrength`. Card SOTD (linha 235): trocar "`accent-primary`" por "`Checkbox`". `ProfileForm`: citar o `Checkbox`. |
| `docs/PRODUCT.md` §12                      | Se a matriz lista testes de componentes e de autenticação, acrescentar o medidor e o checkbox.                                                                                                                   |

Nada muda em `ARCHITECTURE.md` (sem dependência nova; o `Check` vem do `lucide-react`), em migrations, RLS ou pgTAP.

---

## 6. Ordem de execução

0. **Preparar o branch.** Commitar (ou `git stash -u`) o trabalho de catálogo de `feat/catalogo-expansao-batch`, depois `git switch main && git pull && git switch -c feat/ui-checkbox-password-strength`. Este plano está fora do git e vai junto.
1. **Regra e schema.** `schemas/auth.ts` (exports) e `lib/passwordStrength.ts` com o teste. `npx vitest run src/lib/passwordStrength.test.ts src/pages/auth`.
2. **Componentes base.** `Meter` com `tone`; `Checkbox` com o teste. `npx vitest run src/components/ui`.
3. **Trocar os checkboxes.** `ProfileForm` e `ShareCardDialog`. `npx vitest run src/components/profile src/components/daily`. Os testes atuais (`getByRole('checkbox', { name })`, `toBeChecked`) têm de passar **sem mudança**: isso prova que a semântica foi mantida.
4. **Medidor nas telas.** `PasswordStrength` com o teste; integrar em Register e Reset; casos novos em `auth-pages.test.tsx`.
5. **Vitrine e docs.** `Showcase` e `DESIGN_SYSTEM.md` (e PRODUCT §12, se couber). Abrir `?vitrine` a 360 px nos modos claro e escuro.
6. **Validar** (§9). Sugestão de commits: `feat(ui): Checkbox`, `feat(auth): medidor de força de senha`, `docs: …`.

---

## 7. Testes

**`lib/passwordStrength.test.ts`** (tabela com `it.each`)

- `''` → 0; `'abc'` → 1; `'abcdefgh'` (sem número) → 1 com `digit: false`; `'abcdefg1'` → 2 e `meetsPolicy`.
- `'Abcdefg1'` → 3; `'Abcdefg1!xyz'` → 4.
- `'12345678a'`, `'qwerty12'`, `'aaaa1234'` → `weakPattern` e nível ≤ 2.
- Propriedade: `meetsPolicy === registerSchema.shape.password.safeParse(v).success` para uma lista de amostras. É isso que garante que medidor e schema não divergem.

**`ui/checkbox.test.tsx`**

- `getByRole('checkbox', { name })` pelo `label`; clicar no texto alterna; `disabled` não alterna; `onChange` recebe `checked`; `ref` chega ao `input`.

**`auth/PasswordStrength.test.tsx`**

- Vazio: sem `meter`, e a região viva existe vazia.
- `'abcdefg1'`: `getByRole('meter', { name: 'Força da senha' })` com `aria-valuenow="2"` e `aria-valuetext="Razoável"`.
- Padrão fraco mostra o aviso; a região viva traz "Força da senha: …".

**`auth-pages.test.tsx`**

- Cadastro: digitar no campo "Senha" faz o `meter` aparecer. Os testes atuais usam `getByLabelText('Senha')` com match exato, então o `aria-label` "Força da senha" não conflita, mas é bom confirmar.
- Redefinição: o medidor aparece só uma vez (no campo "Nova senha").

**Sem alteração:** `ProfileForm.test.tsx`, `ShareCardDialog.test.tsx`, `e2e/profile.spec.ts` (`.uncheck()` em input nativo) e `no-loose-values.test.ts`.

---

## 8. Riscos e pendências

- **Política só no cliente.** `supabase/config.toml` tem `minimum_password_length = 8` e `password_requirements = ""`: a exigência de letra e número é só do Zod. Fica **fora deste PR** (é mudança de Auth e de `SECURITY.md`), mas está registrada: o candidato é `password_requirements = "letters_digits"` no `config.toml` e no painel de produção, com um teste E2E de cadastro. Antes, confirmar que `letters_digits` existe na versão do GoTrue em uso.
- **Re-render por tecla.** `watch('password')` re-renderiza o formulário a cada tecla. Num formulário de três campos isso é irrelevante. Se aparecer no profiler, trocar por `useWatch` num componente filho.
- **Lista de padrões fracos.** Fica pequena de propósito (sem dicionário, sem dependência nova). Não é estimativa de entropia, e o texto da tela não promete isso.

---

## 9. Pronto quando

- [ ] Nenhuma cor literal em `src/components/**` (`no-loose-values.test.ts` verde); só tokens existentes, nenhum token novo.
- [ ] Textos visíveis e anúncios em pt-BR; nenhum texto de tela dentro de `components/ui`.
- [ ] Checkbox com alvo ≥ 44 px nos dois usos, foco visível, `role="checkbox"` nativo.
- [ ] Medidor com `role="meter"`, valor em texto visível (não só cor) e anúncio só na troca de nível.
- [ ] Regra do medidor importa as constantes do schema; o teste de propriedade garante `meetsPolicy` ≡ Zod.
- [ ] Testes existentes de Perfil, Card SOTD e E2E de perfil passam sem edição.
- [ ] Vitrine conferida a 360 px nos modos claro e escuro; `DESIGN_SYSTEM.md` atualizado.
- [ ] Todos estes comandos terminam com código 0:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run check:contrast
npm run build
```

`npm run e2e` (precisa do Supabase local no Docker) roda antes do merge, pelo menos `e2e/profile.spec.ts` e o fluxo de cadastro.
