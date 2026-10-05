// Coleção do usuário (RN02) com optimistic updates: o cache muda antes da resposta da API e
// volta ao estado anterior se ela falhar. Chave: ['private', userId, 'collection'].
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';
import { collectionService } from '@/services/collectionService';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionItem, CollectionStatus } from '@/types/collection';

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  owned: 'Tenho',
  wanted: 'Quero',
};

const collectionQuery = (userId: string) => ({
  queryKey: queryKeys.collection.list(userId),
  queryFn: collectionService.list,
  enabled: userId !== '',
});

export const useCollection = () => {
  const { user } = useAuth();
  return useQuery(collectionQuery(user?.id ?? ''));
};

// Estado de um perfume na coleção: undefined enquanto a lista não chegou, null se não está nela
export const useCollectionStatus = (perfumeId: string): CollectionStatus | null | undefined => {
  const { user } = useAuth();
  const { data } = useQuery({
    ...collectionQuery(user?.id ?? ''),
    select: (items): CollectionStatus | null =>
      items.find((item) => item.perfume.id === perfumeId)?.status ?? null,
  });
  return data;
};

interface SetStatusVariables {
  perfume: PerfumeSummary;
  status: CollectionStatus;
}

interface RemoveVariables {
  perfume: PerfumeSummary;
}

const withStatus = (
  items: CollectionItem[],
  { perfume, status }: SetStatusVariables
): CollectionItem[] => [
  { status, updatedAt: new Date().toISOString(), perfume },
  ...items.filter((item) => item.perfume.id !== perfume.id),
];

const without = (items: CollectionItem[], { perfume }: RemoveVariables): CollectionItem[] =>
  items.filter((item) => item.perfume.id !== perfume.id);

const useOptimisticCollection = <V extends { perfume: PerfumeSummary }>(options: {
  mutationFn: (variables: V) => Promise<void>;
  apply: (items: CollectionItem[], variables: V) => CollectionItem[];
  successMessage: (variables: V) => string;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const key = queryKeys.collection.list(user?.id ?? '');

  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables: V) => {
      // Uma busca em andamento sobrescreveria a atualização otimista com dados antigos
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollectionItem[]>(key);
      // Lista ainda não carregada: nada para ajustar (e nada a desfazer); o refetch cuida
      if (previous)
        queryClient.setQueryData<CollectionItem[]>(key, options.apply(previous, variables));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(getErrorMessage(error));
    },
    onSuccess: (_data, variables) => {
      toast.success(options.successMessage(variables));
    },
    // O servidor é a fonte de verdade: confirma (ou corrige) o que o cache assumiu
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useSetCollectionStatus = () =>
  useOptimisticCollection<SetStatusVariables>({
    mutationFn: ({ perfume, status }) => collectionService.setStatus(perfume.id, status),
    apply: withStatus,
    successMessage: ({ perfume, status }) =>
      status === 'owned'
        ? `${perfume.name} foi para “Tenho”.`
        : `${perfume.name} foi para “Quero”.`,
  });

export const useRemoveFromCollection = () =>
  useOptimisticCollection<RemoveVariables>({
    mutationFn: ({ perfume }) => collectionService.remove(perfume.id),
    apply: without,
    successMessage: ({ perfume }) => `${perfume.name} saiu da sua coleção.`,
  });
