import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/auth-context';
import { queryKeys } from '@/lib/queryKeys';
import { fakeSession } from '@/test/authMock';
import type { ReviewsOverview, UserReview } from '@/types/review';
import { useDeleteReview, useUpsertReview, useUserReview } from './useReviews';

const getUserReview = vi.fn();
const getPerfumeReviews = vi.fn();
const upsertReview = vi.fn();
const deleteReview = vi.fn();
vi.mock('@/services/reviewService', () => ({
  reviewService: {
    getUserReview: (id: string) => getUserReview(id),
    getPerfumeReviews: (id: string) => getPerfumeReviews(id),
    upsertReview: (id: string, input: unknown) => upsertReview(id, input),
    deleteReview: (id: string) => deleteReview(id),
  },
}));
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

const session = fakeSession();
const mineKey = queryKeys.reviews.mine('u1', 'p1');
const listKey = queryKeys.reviews.list('p1');

const mine: UserReview = {
  id: 'r1',
  perfumeId: 'p1',
  longevity: 2,
  projection: 3,
  comment: null,
  updatedAt: '2026-10-06T12:00:00Z',
};
const overview: ReviewsOverview = {
  summary: { count: 1, avgLongevity: 2, avgProjection: 3 },
  reviews: [],
};

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={{ status: 'authenticated', session, user: session.user }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
  return { client, wrapper };
};

describe('useReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserReview.mockResolvedValue(mine);
    getPerfumeReviews.mockResolvedValue(overview);
  });

  it('a avaliação do usuário usa a chave privada com o id dele', async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useUserReview('p1'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(mine));
    expect(client.getQueryData(mineKey)).toEqual(mine);
  });

  it('upsert atualiza o cache e o resumo antes da resposta e confirma com toast', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(mineKey, null);
    client.setQueryData(listKey, {
      ...overview,
      summary: { count: 0, avgLongevity: null, avgProjection: null },
    });
    let resolve: (value: UserReview) => void = () => undefined;
    upsertReview.mockReturnValue(new Promise<UserReview>((r) => (resolve = r)));

    const { result } = renderHook(() => useUpsertReview('p1'), { wrapper });
    act(() => result.current.mutate({ longevity: 4, projection: 5, comment: 'ótimo' }));

    await waitFor(() =>
      expect(client.getQueryData<UserReview>(mineKey)).toMatchObject({
        longevity: 4,
        comment: 'ótimo',
      })
    );
    expect(client.getQueryData<ReviewsOverview>(listKey)?.summary).toEqual({
      count: 1,
      avgLongevity: 4,
      avgProjection: 5,
    });

    await act(async () => resolve({ ...mine, longevity: 4, projection: 5 }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Avaliação enviada.'));
  });

  it('editar uma avaliação existente avisa "atualizada"', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(mineKey, mine);
    client.setQueryData(listKey, overview);
    upsertReview.mockResolvedValue(mine);
    const { result } = renderHook(() => useUpsertReview('p1'), { wrapper });
    await act(async () => result.current.mutate({ longevity: 5, projection: 5, comment: '' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Avaliação atualizada.'));
  });

  it('falha no upsert desfaz o cache e mostra mensagem amigável', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(mineKey, mine);
    client.setQueryData(listKey, overview);
    upsertReview.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useUpsertReview('p1'), { wrapper });
    await act(async () => result.current.mutate({ longevity: 5, projection: 5, comment: '' }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    await waitFor(() => expect(client.getQueryData(mineKey)).toEqual(mine));
    expect(client.getQueryData(listKey)).toEqual(overview);
  });

  it('delete zera a avaliação e o resumo; falha devolve tudo', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(mineKey, mine);
    client.setQueryData(listKey, overview);
    let reject: (reason: Error) => void = () => undefined;
    deleteReview.mockReturnValue(new Promise<void>((_, r) => (reject = r)));

    const { result } = renderHook(() => useDeleteReview('p1'), { wrapper });
    act(() => result.current.mutate());
    await waitFor(() => expect(client.getQueryData(mineKey)).toBeNull());
    expect(client.getQueryData<ReviewsOverview>(listKey)?.summary.count).toBe(0);

    await act(async () => reject(new Error('x')));
    await waitFor(() => expect(client.getQueryData(mineKey)).toEqual(mine));
    expect(toastError).toHaveBeenCalled();
  });
});
