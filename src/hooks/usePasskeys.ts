// Login por biometria (passkeys / WebAuthn). Chave: ['private', userId, 'passkeys'].
// Cancelar o pedido de biometria não é erro para a pessoa: nada de toast nem alerta (isSilentError).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getErrorMessage, isSilentError } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { checkBiometricsSupport, getDeviceLabel } from '@/lib/passkey';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';
import { authService } from '@/services/authService';

// null enquanto verifica: quem usa não mostra nada até saber (sem botão piscando)
export const usePasskeySupport = (): boolean | null => {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void checkBiometricsSupport().then((value) => {
      if (active) setSupported(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return supported;
};

export const usePasskeys = (enabled = true) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.passkeys.list(userId),
    queryFn: authService.listPasskeys,
    enabled: enabled && userId !== '',
  });
};

export const useRegisterPasskey = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      authService.registerPasskey(getDeviceLabel(navigator.userAgent, navigator.maxTouchPoints)),
    onSuccess: () => {
      toast.success('Aparelho cadastrado. No próximo acesso, entre com biometria.');
      return client.invalidateQueries({ queryKey: queryKeys.passkeys.list(userId) });
    },
    onError: (error) => {
      if (!isSilentError(error)) toast.error(getErrorMessage(error));
    },
  });
};

export const useDeletePasskey = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authService.deletePasskey(id),
    onSuccess: () => {
      toast.success('Aparelho removido.');
      return client.invalidateQueries({ queryKey: queryKeys.passkeys.list(userId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

// A sessão chega pelo onAuthStateChange; a GuestOnly leva ao destino (?redirect=)
export const useSignInWithPasskey = () =>
  useMutation({ mutationFn: () => authService.signInWithPasskey() });
