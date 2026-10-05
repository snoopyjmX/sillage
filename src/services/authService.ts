// Autenticação (docs/PRODUCT.md, Seção 7). Único ponto que fala com supabase.auth.
// Erros viram AppError com código estável; a mensagem crua do Supabase nunca sai daqui.
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { toAuthError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';

export type AuthStateListener = (event: AuthChangeEvent, session: Session | null) => void;

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
  ): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, timezone } },
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
};
