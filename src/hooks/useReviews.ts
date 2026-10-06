// Avaliações de um perfume (RN04) com optimistic updates: o cache muda antes da resposta da API e
// volta ao estado anterior se ela falhar. Chaves: ['public', 'perfumes', perfumeId, 'reviews'] (lista
// e resumo) e ['private', userId, 'reviews', perfumeId] (a do usuário, nunca persistida).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { applyReviewToSummary } from '@/lib/reviews';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';
import { reviewService } from '@/services/reviewService';
import type { ReviewInput, ReviewsOverview, UserReview } from '@/types/review';

export const usePerfumeReviews = (perfumeId: string) =>
  useQuery({
    queryKey: queryKeys.reviews.list(perfumeId),
    queryFn: () => reviewService.getPerfumeReviews(perfumeId),
    enabled: perfumeId !== '',
  });

export const useUserReview = (perfumeId: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.reviews.mine(userId, perfumeId),
    queryFn: () => reviewService.getUserReview(perfumeId),
    enabled: userId !== '' && perfumeId !== '',
  });
};

interface Snapshot {
  // undefined = não estava em cache; null = carregado e sem avaliação
  mine: UserReview | null | undefined;
  overview: ReviewsOverview | undefined;
}

// Aplica `next` (a avaliação nova ou null para remover) no cache privado e no resumo público
const useOptimisticReview = (perfumeId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const mineKey = queryKeys.reviews.mine(userId, perfumeId);
  const listKey = queryKeys.reviews.list(perfumeId);

  const apply = async (next: ReviewInput | null): Promise<Snapshot> => {
    // Uma busca em andamento sobrescreveria a atualização otimista com dados antigos
    await Promise.all([
      queryClient.cancelQueries({ queryKey: mineKey }),
      queryClient.cancelQueries({ queryKey: listKey }),
    ]);
    const mine = queryClient.getQueryData<UserReview | null>(mineKey);
    const overview = queryClient.getQueryData<ReviewsOverview>(listKey);

    const optimistic: UserReview | null = next
      ? {
          id: mine?.id ?? 'otimista',
          perfumeId,
          longevity: next.longevity,
          projection: next.projection,
          comment: next.comment.trim() === '' ? null : next.comment.trim(),
          updatedAt: new Date().toISOString(),
        }
      : null;
    queryClient.setQueryData(mineKey, optimistic);
    if (overview) {
      queryClient.setQueryData<ReviewsOverview>(listKey, {
        // A lista de comentários espera o servidor (autor e data vêm de lá)
        ...overview,
        summary: applyReviewToSummary(overview.summary, mine ?? null, next),
      });
    }
    return { mine, overview };
  };

  const rollback = (snapshot: Snapshot | undefined) => {
    if (!snapshot) return;
    if (snapshot.mine !== undefined) queryClient.setQueryData(mineKey, snapshot.mine);
    if (snapshot.overview) queryClient.setQueryData(listKey, snapshot.overview);
  };

  // O servidor é a fonte de verdade: confirma (ou corrige) o que o cache assumiu
  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: mineKey }),
      queryClient.invalidateQueries({ queryKey: listKey }),
    ]);

  return { apply, rollback, settle };
};

export const useUpsertReview = (perfumeId: string) => {
  const { apply, rollback, settle } = useOptimisticReview(perfumeId);
  return useMutation({
    mutationFn: (input: ReviewInput) => reviewService.upsertReview(perfumeId, input),
    onMutate: (input) => apply(input),
    onError: (error, _input, snapshot) => {
      rollback(snapshot);
      toast.error(getErrorMessage(error));
    },
    onSuccess: (_review, _input, snapshot) => {
      toast.success(snapshot?.mine ? 'Avaliação atualizada.' : 'Avaliação enviada.');
    },
    onSettled: settle,
  });
};

export const useDeleteReview = (perfumeId: string) => {
  const { apply, rollback, settle } = useOptimisticReview(perfumeId);
  return useMutation({
    mutationFn: () => reviewService.deleteReview(perfumeId),
    onMutate: () => apply(null),
    onError: (error, _vars, snapshot) => {
      rollback(snapshot);
      toast.error(getErrorMessage(error));
    },
    onSuccess: () => {
      toast.success('Avaliação removida.');
    },
    onSettled: settle,
  });
};
