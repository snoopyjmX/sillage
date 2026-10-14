// Acesso a dados dos perfumistas. Só services importam o cliente do Supabase.
// Leitura pública (RLS: perfumers e perfume_perfumers lêem para anon e authenticated).
import { AppError, toAppError } from '@/constants/errors';
import { fromPerfumeRow, PERFUME_ROW_SELECT } from '@/lib/perfume';
import { supabase } from '@/lib/supabase';
import type { PerfumerDetail } from '@/types/catalog';

export const perfumerService = {
  getBySlug: async (slug: string): Promise<PerfumerDetail> => {
    const { data, error } = await supabase
      .from('perfumers')
      .select(`id, slug, name, bio, country, perfume_perfumers(${PERFUME_ROW_SELECT})`)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw toAppError(error);
    if (!data) throw new AppError('not_found');

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      bio: data.bio,
      country: data.country,
      perfumes: data.perfume_perfumers
        .map(({ perfume }) =>
          fromPerfumeRow(
            perfume,
            perfume.image_path
              ? supabase.storage.from('perfume-images').getPublicUrl(perfume.image_path).data
                  .publicUrl
              : null
          )
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    };
  },
};
