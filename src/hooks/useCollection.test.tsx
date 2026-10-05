import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/auth-context';
import { queryKeys } from '@/lib/queryKeys';
import { fakeSession } from '@/test/authMock';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionItem } from '@/types/collection';
import { useCollection, useRemoveFromCollection, useSetCollectionStatus } from './useCollection';

const list = vi.fn();
const setStatus = vi.fn();
const remove = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: {
    list: () => list(),
    setStatus: (id: string, status: string) => setStatus(id, status),
    remove: (id: string) => remove(id),
  },
}));
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

const perfume = (id: string, name: string): PerfumeSummary => ({
  id,
  slug: id,
  name,
  brandName: 'Amyi',
  brandSlug: 'amyi',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: null,
  imagePath: null,
  families: [],
});

const A = perfume('a', 'Alfa');
const B = perfume('b', 'Beta');
const initial: CollectionItem[] = [{ status: 'wanted', updatedAt: '2026-01-01', perfume: A }];

const session = fakeSession();
const key = queryKeys.collection.list('u1');

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={{ status: 'authenticated', session, user: session.user }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
  return { client, wrapper };
};

describe('useCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue(initial);
  });

  it('usa a chave ["private", userId, "collection"]', async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(['private', 'u1', 'collection'])).toEqual(initial);
  });

  it('setStatus troca o estado no cache antes da resposta e confirma depois', async () => {
    let resolve: () => void = () => undefined;
    setStatus.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    const { client, wrapper } = setup();
    const query = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useSetCollectionStatus(), { wrapper });

    act(() => result.current.mutate({ perfume: A, status: 'owned' }));
    await waitFor(() =>
      expect(client.getQueryData<CollectionItem[]>(key)?.[0]).toMatchObject({ status: 'owned' })
    );
    expect(setStatus).toHaveBeenCalledWith('a', 'owned');

    list.mockResolvedValue([{ ...initial[0], status: 'owned' }]);
    resolve();
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Alfa foi para “Tenho”.'));
  });

  it('adiciona um perfume novo à lista antes da resposta', async () => {
    setStatus.mockReturnValue(new Promise(() => undefined));
    const { client, wrapper } = setup();
    const query = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useSetCollectionStatus(), { wrapper });

    act(() => result.current.mutate({ perfume: B, status: 'wanted' }));
    await waitFor(() =>
      expect(client.getQueryData<CollectionItem[]>(key)?.map((i) => i.perfume.id)).toEqual([
        'b',
        'a',
      ])
    );
  });

  it('desfaz a atualização e avisa com mensagem amigável quando a API falha', async () => {
    setStatus.mockRejectedValue(new Error('duplicate key value violates constraint'));
    const { client, wrapper } = setup();
    const query = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useSetCollectionStatus(), { wrapper });

    act(() => result.current.mutate({ perfume: A, status: 'owned' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError.mock.calls[0]?.[0]).not.toMatch(/duplicate/);
    expect(client.getQueryData<CollectionItem[]>(key)).toEqual(initial);
  });

  it('remove tira o item do cache e desfaz se falhar', async () => {
    remove.mockRejectedValue(new Error('x'));
    const { client, wrapper } = setup();
    const query = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useRemoveFromCollection(), { wrapper });

    act(() => result.current.mutate({ perfume: A }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(client.getQueryData<CollectionItem[]>(key)).toEqual(initial);
  });

  it('remove com sucesso: lista vazia e aviso', async () => {
    remove.mockResolvedValue(undefined);
    list.mockResolvedValue([]);
    const { client, wrapper } = setup();
    const query = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    const { result } = renderHook(() => useRemoveFromCollection(), { wrapper });

    act(() => result.current.mutate({ perfume: A }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Alfa saiu da sua coleção.'));
    expect(client.getQueryData<CollectionItem[]>(key)).toEqual([]);
  });
});
