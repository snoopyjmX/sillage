// Acesso a dados do perfil (RN01). Só services importam o cliente do Supabase.
// A autorização é a RLS: o dono lê e edita só a própria linha de `profiles`.
import { AppError, toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';

// Erro cru do Supabase nunca chega à interface: rede continua "rede", o resto vira falha do perfil
const toProfileError = (
  error: Parameters<typeof toAppError>[0],
  code: 'profile_load_failed' | 'profile_failed'
): AppError => {
  const appError = toAppError(error);
  return appError.code === 'unknown' ? new AppError(code, { cause: error }) : appError;
};

export const profileService = {
  // null se a linha não existe (a RLS devolve só a do dono)
  get: async (): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, timezone')
      .maybeSingle();
    if (error) throw toProfileError(error, 'profile_load_failed');
    return data ? { displayName: data.display_name, timezone: data.timezone } : null;
  },

  update: async (values: Profile): Promise<void> => {
    // Leitura local da sessão (sem rede); a RLS confere o id contra o JWT de qualquer forma
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user.id;
    if (!userId) throw new AppError('session_expired');

    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: values.displayName, timezone: values.timezone })
      .eq('id', userId)
      .select('id');
    if (error) throw toProfileError(error, 'profile_failed');
    // Zero linhas: a RLS não deixou (ou o perfil não existe). Nunca finge que salvou.
    if (data.length === 0) throw new AppError('profile_failed');
  },
};
