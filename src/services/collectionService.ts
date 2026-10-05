// Acesso a dados da Coleção (RN02). Só services importam o cliente do Supabase.
// A autorização é a RLS: o usuário só enxerga e altera as próprias linhas.
import { AppError, toAppError } from '@/constants/errors';
import { FAMILIES } from '@/constants/labels';
import { supabase } from '@/lib/supabase';
import type { CollectionItem, CollectionStatus } from '@/types/collection';

// Uma consulta só (item + perfume + marca + famílias das notas), sem N+1.
// perfume_notes entra só para derivar as famílias do card, como faz a search_perfumes.
const LIST_SELECT =
  'status, updated_at, perfume:perfumes(*, brand:brands(*), perfume_notes(note:notes(family)))';

// Erro cru do Supabase nunca chega à interface: rede continua "rede", o resto vira falha de coleção
const toCollectionError = (error: Parameters<typeof toAppError>[0]): AppError => {
  const appError = toAppError(error);
  return appError.code === 'unknown'
    ? new AppError('collection_failed', { cause: error })
    : appError;
};

export const collectionService = {
  list: async (): Promise<CollectionItem[]> => {
    const { data, error } = await supabase
      .from('collection_items')
      .select(LIST_SELECT)
      .order('updated_at', { ascending: false });
    if (error) throw toCollectionError(error);

    return data.map(({ status, updated_at, perfume }) => {
      const present = new Set(perfume.perfume_notes.map(({ note }) => note.family));
      return {
        status,
        updatedAt: updated_at,
        perfume: {
          id: perfume.id,
          slug: perfume.slug,
          name: perfume.name,
          brandName: perfume.brand.name,
          brandSlug: perfume.brand.slug,
          concentration: perfume.concentration,
          gender: perfume.gender,
          releaseYear: perfume.release_year,
          imagePath: perfume.image_path,
          // Na ordem do enum, como a função de busca devolve
          families: FAMILIES.filter((family) => present.has(family)),
        },
      };
    });
  },

  // upsert atômico: UNIQUE(user_id, perfume_id) garante uma linha por perfume; trocar o estado
  // atualiza a mesma linha em vez de falhar ou duplicar.
  setStatus: async (perfumeId: string, status: CollectionStatus): Promise<void> => {
    // Leitura local da sessão (sem rede); a RLS confere o user_id contra o JWT de qualquer forma
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user.id;
    if (!userId) throw new AppError('session_expired');

    const { error } = await supabase
      .from('collection_items')
      .upsert(
        { user_id: userId, perfume_id: perfumeId, status },
        { onConflict: 'user_id, perfume_id' }
      );
    if (error) throw toCollectionError(error);
  },

  // A RLS limita o delete às linhas do próprio usuário
  remove: async (perfumeId: string): Promise<void> => {
    const { error } = await supabase.from('collection_items').delete().eq('perfume_id', perfumeId);
    if (error) throw toCollectionError(error);
  },
};
