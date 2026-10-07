// Acesso a dados do perfil (RN01). Só services importam o cliente do Supabase.
// A autorização é a RLS: o dono lê e edita só a própria linha de `profiles`.
import { AppError, toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';

// Erro cru do Supabase nunca chega à interface: rede continua "rede", o resto vira falha do perfil
const toProfileError = (
  error: Parameters<typeof toAppError>[0],
  code: 'profile_load_failed' | 'profile_failed' | 'avatar_failed'
): AppError => {
  const appError = toAppError(error);
  return appError.code === 'unknown' ? new AppError(code, { cause: error }) : appError;
};

const AVATAR_BUCKET = 'avatars';

// Leitura local da sessão (sem rede); a RLS confere o id contra o JWT de qualquer forma
const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new AppError('session_expired');
  return userId;
};

// Grava `profiles.avatar_url`; zero linhas afetadas é falha, nunca finge que salvou
const saveAvatarUrl = async (userId: string, avatarUrl: string | null): Promise<void> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select('id');
  if (error) throw toProfileError(error, 'avatar_failed');
  if (data.length === 0) throw new AppError('avatar_failed');
};

export const profileService = {
  // null se a linha não existe (a RLS devolve só a do dono)
  get: async (): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, timezone, avatar_url')
      .maybeSingle();
    if (error) throw toProfileError(error, 'profile_load_failed');
    return data
      ? { displayName: data.display_name, timezone: data.timezone, avatarUrl: data.avatar_url }
      : null;
  },

  update: async (values: Profile): Promise<void> => {
    // Leitura local da sessão (sem rede); a RLS confere o id contra o JWT de qualquer forma
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user.id;
    if (!userId) throw new AppError('session_expired');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: values.displayName,
        timezone: values.timezone,
        avatar_url: values.avatarUrl,
      })
      .eq('id', userId)
      .select('id');
    if (error) throw toProfileError(error, 'profile_failed');
    // Zero linhas: a RLS não deixou (ou o perfil não existe). Nunca finge que salvou.
    if (data.length === 0) throw new AppError('profile_failed');
  },

  // Foto de perfil em `avatars/<user_id>/avatar.webp` (policy de dono). A URL leva um parâmetro
  // de tempo para o navegador não servir a foto antiga do cache.
  uploadAvatar: async (blob: Blob): Promise<string> => {
    const userId = await requireUserId();
    const path = `${userId}/avatar.webp`;
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, blob, { contentType: blob.type || 'image/webp', upsert: true });
    if (error) throw toProfileError(error, 'avatar_failed');
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await saveAvatarUrl(userId, url);
    return url;
  },

  removeAvatar: async (): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar.webp`]);
    if (error) throw toProfileError(error, 'avatar_failed');
    await saveAvatarUrl(userId, null);
  },
};
