import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { AuthContext } from '@/contexts/auth-context';
import { queryKeys } from '@/lib/queryKeys';
import { fakeSession } from '@/test/authMock';
import type { Passkey } from '@/types/passkey';
import {
  useDeletePasskey,
  usePasskeySupport,
  usePasskeys,
  useRegisterPasskey,
  useSignInWithPasskey,
} from './usePasskeys';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const checkSupport = vi.fn();
vi.mock('@/lib/passkey', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/passkey')>()),
  checkBiometricsSupport: () => checkSupport(),
}));
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

const session = fakeSession();
const listKey = queryKeys.passkeys.list('u1');
const passkeys: Passkey[] = [
  { id: 'pk1', name: 'iPhone', createdAt: '2026-10-01T12:00:00Z', lastUsedAt: null },
];

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={{ status: 'authenticated', session, user: session.user }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
  return { client, wrapper };
};

describe('usePasskeys', () => {
  beforeEach(() => {
    auth.reset();
    vi.clearAllMocks();
    auth.service.listPasskeys.mockResolvedValue(passkeys);
  });

  it('a lista usa a chave privada do usuário (nunca persistida)', async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => usePasskeys(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(passkeys));
    expect(listKey).toEqual(['private', 'u1', 'passkeys']);
    expect(client.getQueryData(listKey)).toEqual(passkeys);
  });

  it('cadastrar envia o nome do aparelho, confirma com toast e recarrega a lista', async () => {
    auth.service.registerPasskey.mockResolvedValue(undefined);
    const { client, wrapper } = setup();
    client.setQueryData(listKey, []);
    const { result } = renderHook(() => useRegisterPasskey(), { wrapper });
    await act(() => result.current.mutateAsync());
    expect(auth.service.registerPasskey).toHaveBeenCalledWith(expect.any(String));
    expect(toastSuccess).toHaveBeenCalled();
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it('cancelar a biometria no cadastro não mostra erro', async () => {
    auth.service.registerPasskey.mockRejectedValue(new AppError('passkey_cancelled'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useRegisterPasskey(), { wrapper });
    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).not.toHaveBeenCalled();
  });

  it('falha no cadastro mostra a mensagem mapeada', async () => {
    auth.service.registerPasskey.mockRejectedValue(new AppError('passkey_already_registered'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useRegisterPasskey(), { wrapper });
    act(() => result.current.mutate());
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringContaining('já está cadastrado'))
    );
  });

  it('remover chama o service com o id e recarrega a lista', async () => {
    auth.service.deletePasskey.mockResolvedValue(undefined);
    const { client, wrapper } = setup();
    client.setQueryData(listKey, passkeys);
    const { result } = renderHook(() => useDeletePasskey(), { wrapper });
    await act(() => result.current.mutateAsync('pk1'));
    expect(auth.service.deletePasskey).toHaveBeenCalledWith('pk1');
    expect(toastSuccess).toHaveBeenCalledWith('Aparelho removido.');
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it('login por biometria chama o service', async () => {
    auth.service.signInWithPasskey.mockResolvedValue(undefined);
    const { wrapper } = setup();
    const { result } = renderHook(() => useSignInWithPasskey(), { wrapper });
    await act(() => result.current.mutateAsync());
    expect(auth.service.signInWithPasskey).toHaveBeenCalled();
  });

  it('suporte começa em null e resolve com a verificação do navegador', async () => {
    checkSupport.mockResolvedValue(true);
    const { wrapper } = setup();
    const { result } = renderHook(() => usePasskeySupport(), { wrapper });
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(true));
  });
});
