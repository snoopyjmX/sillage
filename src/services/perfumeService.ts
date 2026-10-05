// Acesso a dados do catálogo. Só services importam o cliente do Supabase.
import { toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import { PAGE_SIZE, type CatalogFilters } from '@/schemas/catalogSearch';
import type { PerfumeSearchResult } from '@/types/catalog';

// "ausente" vira undefined para a função usar o padrão (null/array vazio = sem filtro)
const orUndefined = <T>(list: T[]): T[] | undefined => (list.length > 0 ? list : undefined);

export const perfumeService = {
  search: async (filters: CatalogFilters): Promise<PerfumeSearchResult> => {
    const { data, error } = await supabase.rpc('search_perfumes', {
      p_query: filters.q === '' ? undefined : filters.q,
      p_brand_slugs: orUndefined(filters.brands),
      p_note_slugs: orUndefined(filters.notes),
      p_note_position: filters.pos ?? undefined,
      p_families: orUndefined(filters.families),
      p_concentrations: orUndefined(filters.concentrations),
      p_genders: orUndefined(filters.genders),
      p_year_min: filters.yearMin ?? undefined,
      p_year_max: filters.yearMax ?? undefined,
      p_sort: filters.sort,
      p_limit: PAGE_SIZE,
      p_offset: (filters.page - 1) * PAGE_SIZE,
    });
    if (error) throw toAppError(error);

    return {
      items: data.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        brandName: row.brand_name,
        brandSlug: row.brand_slug,
        concentration: row.concentration,
        gender: row.gender,
        // O gerador de tipos não enxerga nulabilidade em funções; no banco os dois podem ser nulos
        releaseYear: (row.release_year as number | null) ?? null,
        imagePath: (row.image_path as string | null) ?? null,
        families: row.families,
      })),
      total: data[0]?.total_count ?? 0,
    };
  },
};
