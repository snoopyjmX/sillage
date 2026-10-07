// Perfil do usuário logado (nome e fuso). Chave: ['private', userId, 'profile', 'detail'].
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { processAvatarImage } from '@/lib/avatar';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';
import { profileService } from '@/services/profileService';
import type { Profile } from '@/types/profile';

export const useProfile = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.profile.detail(userId),
    queryFn: profileService.get,
    enabled: userId !== '',
  });
};

// Salvar muda o fuso, e com ele "hoje" (RN06) e a cidade do clima: refaz o que depende do perfil
export const useUpdateProfile = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: Profile) => profileService.update(values),
    onSuccess: async () => {
      toast.success('Perfil atualizado.');
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.profile.all(userId) }),
        client.invalidateQueries({ queryKey: queryKeys.daily.overview(userId) }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

// Foto de perfil: recorta e converte no navegador, envia ao bucket `avatars` e atualiza o perfil
export const useUploadAvatar = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => profileService.uploadAvatar(await processAvatarImage(file)),
    onSuccess: () => {
      toast.success('Foto de perfil atualizada.');
      return client.invalidateQueries({ queryKey: queryKeys.profile.all(userId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useRemoveAvatar = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => profileService.removeAvatar(),
    onSuccess: () => {
      toast.success('Foto de perfil removida.');
      return client.invalidateQueries({ queryKey: queryKeys.profile.all(userId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
