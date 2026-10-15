# Sillage — Especificação: Login por Biometria (Passkeys / WebAuthn)

Esta especificação define a implementação de autenticação biométrica (Face ID, Touch ID, Windows Hello) via **Passkeys (WebAuthn / FIDO2)** no Sillage.

---

## 1. Contexto e Objetivos

O **Sillage** é um PWA (Progressive Web App) mobile-first voltado para experiência contemplativa e segura. O login tradicional por e-mail e senha com confirmação ativada já está operando em produção.

O objetivo desta fase é permitir que usuários com conta confirmada registrem seus dispositivos biométricos para logins futuros com apenas 1 clique ou leitura facial/digital, dispensando a digitação de senhas.

### Benefícios:

- **UX de App Nativo:** Desbloqueio instantâneo via Face ID (iOS/macOS), Touch ID ou biometria Android.
- **Segurança FIDO2:** Criptografia assimétrica de chaves públicas/privadas. A chave privada reside permanentemente no chip seguro do aparelho do usuário (Secure Enclave / TPM / TEE) e nunca trafega pela rede nem é armazenada pelo Supabase.

---

## 2. Decisões Arquiteturais

1. **Camadas do Sillage:**
   `Page → Component → Hook → Service → Supabase`
   Nenhum componente acessa diretamente o SDK do Supabase. Apenas `authService.ts` interage com `supabase.auth`.

2. **Gerenciamento de Estado e Cache:**
   - As passkeys cadastradas do usuário são consultadas via TanStack Query usando a query key privada:  
     `['private', userId, 'passkeys']`  
     _(Regra estrita: nunca persistida no IndexedDB; destruída no logout)._

3. **Compatibilidade e Degradação Suave:**
   - O app verifica suporte nativo no navegador com:  
     `window.PublicKeyCredential && typeof window.PublicKeyCredential === 'function'` e `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`.
   - Dispositivos ou navegadores sem suporte não exibem botões quebrados; a interface mantém apenas o formulário padrão de e-mail e senha.

4. **Tratamento de Cancelamento:**
   - Se o usuário cancelar ou fechar o popup biométrico do sistema operacional, o erro é interceptado silenciosamente como cancelamento voluntário, sem exibir alertas de erro alarmantes na tela.
   - Atenção: fechar o diálogo do sistema **não** gera `ERROR_CEREMONY_ABORTED` (esse código só aparece quando o próprio app aborta a cerimônia por `AbortSignal`). O navegador lança `NotAllowedError`, que o `supabase-js` repassa como `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY` com o erro original em `cause`. Os dois casos viram o código interno `passkey_cancelled`, que a interface nunca exibe (`isSilentError`).

---

## 3. Estrutura de Arquivos e Alterações

### 3.1 Configuração Supabase Local (`supabase/config.toml`)

Habilitar os blocos que já constam no arquivo:

```toml
[auth.passkey]
enabled = true

[auth.webauthn]
rp_display_name = "Sillage"
rp_id = "localhost"
rp_origins = ["http://localhost:5173", "http://localhost:4173"]
```

### 3.2 Serviço de Autenticação (`src/services/authService.ts`)

Adicionar os métodos (assinaturas conferidas no `@supabase/supabase-js` 2.117):

- `registerPasskey(name?: string)`: chama `supabase.auth.registerPasskey()`. O SDK **não aceita nome** no cadastro: com `name`, o service chama em seguida `supabase.auth.passkey.update({ passkeyId, friendlyName })`. Se o nome falhar, a passkey continua válida, só sem nome.
- `signInWithPasskey()`: chama `supabase.auth.signInWithPasskey()`. A sessão chega pelo `onAuthStateChange` e a `GuestOnly` volta ao `?redirect=`.
- `listPasskeys()`: chama `supabase.auth.passkey.list()` e converte para `Passkey` (`id`, `name`, `createdAt`, `lastUsedAt`), em `src/types/passkey.ts`.
- `deletePasskey(id: string)`: chama `supabase.auth.passkey.delete({ passkeyId: id })` (o parâmetro é `passkeyId`, não `id`).

### 3.3 Tratamento de Erros (`src/constants/errors.ts`)

`toPasskeyError` converte `WebAuthnError` e erro do GoTrue em códigos estáveis:

- `passkey_failed`: "Não foi possível autenticar com biometria. Tente novamente ou use sua senha." (inclui `webauthn_challenge_expired` e erros desconhecidos)
- `passkey_not_supported`: "Este dispositivo ou navegador não suporta biometria." (`NotSupportedError`)
- `passkey_already_registered`: "Este aparelho já está cadastrado para entrar com biometria." (`ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED`)
- `passkey_cancelled`: recusa voluntária, nunca exibida (ver 2.4); `isSilentError` decide isso fora dos componentes.
- `passkey_list_failed` e `passkey_delete_failed`: gestão no Perfil.
- Rede e limite de tentativas mantêm as mensagens `network` e `rate_limited`.

### 3.4 Hooks React Query (`src/hooks/usePasskeys.ts`)

- `usePasskeys()`: busca a lista de biometrias ativas do usuário.
- `useRegisterPasskey()`: mutação para registrar novo aparelho, com o nome derivado do aparelho ("iPhone", "Android", "Windows"...).
- `useDeletePasskey()`: mutação para remover chave cadastrada.
- `useSignInWithPasskey()`: mutação para login por biometria.
- `usePasskeySupport()`: `null` enquanto verifica, depois `true`/`false`.
- Funções puras em `src/lib/passkey.ts` (fora do arquivo de hooks, para testar sem React): `checkBiometricsSupport(): Promise<boolean>` e `getDeviceLabel(userAgent, maxTouchPoints)`.

### 3.5 Interface do Usuário (UI)

- **Perfil (`src/components/profile/PasskeyManager.tsx` e `src/pages/ProfilePage.tsx`):**
  - Bloco "Login biométrico (Face ID / Digital)".
  - Lista de credenciais com data e botão de revogação.
  - Botão "Cadastrar este aparelho".
- **Login (`src/pages/auth/LoginPage.tsx`):**
  - Botão "Entrar com Face ID ou Digital" no topo do formulário (renderizado condicionalmente se houver suporte no navegador).
  - Divisor visual neutro "ou com e-mail e senha".

### 3.6 Testes

- `src/hooks/usePasskeys.test.tsx`: testes unitários dos hooks com mocks do `authService`.
- `src/pages/auth/auth-pages.test.tsx`: teste do botão de biometria na tela de login.
- `src/components/profile/PasskeyManager.test.tsx`: testes de listagem e exclusão de credenciais.
- `src/lib/passkey.test.ts`, `src/constants/errors.test.ts` e `src/services/authService.test.ts`: suporte, rótulo do aparelho, mapeamento de erros e chamadas ao SDK.
- Sem pgTAP novo: as passkeys ficam no schema `auth` (GoTrue) e nenhuma policy mudou.

---

## 4. Configuração em Produção (Supabase Cloud)

Após o deploy do código, o mantenedor realiza no painel do Supabase:

1. **Authentication** → **Passkeys / WebAuthn**:
   - **Enable Passkey authentication:** LIGADO
   - **Relying Party Display Name:** `Sillage`
   - **Relying Party ID:** `sillage-ashy-gamma.vercel.app`
   - **Relying Party Origins:** `https://sillage-ashy-gamma.vercel.app`
2. Salvar configurações.
