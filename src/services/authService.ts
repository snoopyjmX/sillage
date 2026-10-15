// Autenticação (docs/PRODUCT.md, Seção 7). Único ponto que fala com supabase.auth.
// Erros viram AppError com código estável; a mensagem crua do Supabase nunca sai daqui.
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AppError, toAuthError, toPasskeyError, type ErrorCode } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import type { Passkey } from '@/types/passkey';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;
const UNAUTHORIZED = 401;
// Acima do prazo razoável da função: evita um spinner eterno se o servidor travar
const DELETE_TIMEOUT_MS = 30_000;

export type AuthStateListener = (event: AuthChangeEvent, session: Session | null) => void;

// Destino do link de confirmação do e-mail (a Redirect URL precisa estar liberada no Supabase)
const confirmedUrl = (): string => `${window.location.origin}/auth/confirmed`;

// Gestão das passkeys: rede e sessão vencida mantêm a mensagem própria; o resto vira `fallback`
const toPasskeyManageError = (
  error: { code?: string; message?: string; status?: number },
  fallback: ErrorCode
): AppError => {
  const mapped = toAuthError(error);
  return mapped.code === 'unknown' ? new AppError(fallback, { cause: error }) : mapped;
};

export const authService = {
  getSession: async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw toAuthError(error);
    return data.session;
  },

  // Quem chama é responsável por cancelar a assinatura. O listener deve ser síncrono: sem await
  // em chamadas ao Supabase dentro dele (risco de deadlock).
  onAuthStateChange: (listener: AuthStateListener): (() => void) => {
    const { data } = supabase.auth.onAuthStateChange(listener);
    return () => data.subscription.unsubscribe();
  },

  signIn: async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAuthError(error);
  },

  // displayName e timezone vão em options.data; o trigger handle_new_user cria o perfil com eles.
  signUp: async (
    email: string,
    password: string,
    displayName: string,
    timezone: string
  ): Promise<{ needsEmailConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, timezone },
        emailRedirectTo: confirmedUrl(),
      },
    });
    if (error) throw toAuthError(error);
    // Com confirmação de e-mail ligada o cadastro não devolve sessão até o clique no link
    return { needsEmailConfirmation: data.session === null };
  },

  // Reenvia o link de confirmação do cadastro. Resposta neutra: não revela se o e-mail existe.
  resendConfirmation: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: confirmedUrl() },
    });
    if (error) throw toAuthError(error);
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw toAuthError(error);
  },

  sendPasswordReset: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw toAuthError(error);
  },

  updatePassword: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw toAuthError(error);
  },

  // Passkeys (docs/PLANO_PASSKEYS.md). O supabase-js conduz a cerimônia WebAuthn inteira: a chave
  // privada fica no aparelho e o servidor só guarda a pública. A sessão chega pelo onAuthStateChange.
  signInWithPasskey: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) throw toPasskeyError(error);
  },

  // Exige sessão ativa. O SDK não aceita nome no cadastro: o nome amigável vai num update logo
  // depois e, se falhar, a passkey continua válida (só fica sem nome).
  registerPasskey: async (name?: string): Promise<void> => {
    const { data, error } = await supabase.auth.registerPasskey();
    if (error) throw toPasskeyError(error);
    if (!name) return;
    await supabase.auth.passkey.update({ passkeyId: data.id, friendlyName: name.slice(0, 120) });
  },

  listPasskeys: async (): Promise<Passkey[]> => {
    const { data, error } = await supabase.auth.passkey.list();
    if (error) throw toPasskeyManageError(error, 'passkey_list_failed');
    return data.map((item) => ({
      id: item.id,
      name: item.friendly_name ?? null,
      createdAt: item.created_at,
      lastUsedAt: item.last_used_at ?? null,
    }));
  },

  deletePasskey: async (id: string): Promise<void> => {
    const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
    if (error) throw toPasskeyManageError(error, 'passkey_delete_failed');
  },

  // Exclusão da própria conta pela Edge Function delete-account (a service_role só existe lá). O
  // corpo da resposta nunca é exibido. Depois do sucesso a sessão já não vale no servidor: o
  // signOut local limpa o armazenamento e dispara SIGNED_OUT (cache privado e redirecionamento).
  deleteAccount: async (): Promise<void> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new AppError('session_expired');

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(DELETE_TIMEOUT_MS),
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'TimeoutError') {
        throw new AppError('account_delete_failed', { cause });
      }
      throw new AppError('network', { cause });
    }

    if (response.status === UNAUTHORIZED) throw new AppError('session_expired');
    if (!response.ok) throw new AppError('account_delete_failed', { cause: response.status });

    await supabase.auth.signOut({ scope: 'local' });
  },
};
