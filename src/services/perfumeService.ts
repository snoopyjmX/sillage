// Acesso a dados do catálogo. Só services importam o cliente do Supabase.
import { AppError, toAppError } from '@/constants/errors';
import { fromPerfumeRow } from '@/lib/perfume';
import { supabase } from '@/lib/supabase';
import { PAGE_SIZE, type CatalogFilters } from '@/schemas/catalogSearch';
import type {
  PerfumeDetail,
  PerfumeSearchResult,
  PerfumeSummary,
  SimilarPerfume,
} from '@/types/catalog';

// "ausente" vira undefined para a função usar o padrão (null/array vazio = sem filtro)
const orUndefined = <T>(list: T[]): T[] | undefined => (list.length > 0 ? list : undefined);

export const SIMILAR_LIMIT = 6;

export const perfumeService = {
  search: async (
    filters: CatalogFilters,
    limit: number = PAGE_SIZE
  ): Promise<PerfumeSearchResult> => {
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
      p_limit: limit,
      p_offset: (filters.page - 1) * limit,
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
        imageUrl: row.image_path
          ? supabase.storage.from('perfume-images').getPublicUrl(row.image_path).data.publicUrl
          : null,
        families: row.families,
      })),
      total: data[0]?.total_count ?? 0,
    };
  },

  // Resumos para cards a partir de slugs (ex.: as escolhas do Nez), na ordem pedida. Slug que não
  // existe mais no catálogo simplesmente fica de fora.
  getSummariesBySlugs: async (slugs: string[]): Promise<PerfumeSummary[]> => {
    if (slugs.length === 0) return [];
    const { data, error } = await supabase
      .from('perfumes')
      .select('*, brand:brands(*), perfume_notes(note:notes(family))')
      .in('slug', slugs);
    if (error) throw toAppError(error);

    const bySlug = new Map(
      data.map((row) => [
        row.slug,
        fromPerfumeRow(
          row,
          row.image_path
            ? supabase.storage.from('perfume-images').getPublicUrl(row.image_path).data.publicUrl
            : null
        ),
      ])
    );
    return slugs.flatMap((slug) => {
      const summary = bySlug.get(slug);
      return summary ? [summary] : [];
    });
  },

  // Uma consulta só (perfume + marca + notas embutidas), sem N+1. Slug inexistente = not_found.
  getBySlug: async (slug: string): Promise<PerfumeDetail> => {
    const { data, error } = await supabase
      .from('perfumes')
      .select(
        '*, brand:brands(*), perfume_notes(position, note:notes(*)), perfume_perfumers(position, perfumer:perfumers(slug, name))'
      )
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw toAppError(error);
    if (!data) throw new AppError('not_found');

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      brandName: data.brand.name,
      brandSlug: data.brand.slug,
      concentration: data.concentration,
      gender: data.gender,
      releaseYear: data.release_year,
      imageUrl: data.image_path
        ? supabase.storage.from('perfume-images').getPublicUrl(data.image_path).data.publicUrl
        : null,
      lowestPriceCents: data.lowest_price_cents,
      storeName: data.store_name,
      storeUrl: data.store_url,
      perfumers: data.perfume_perfumers
        .slice()
        .sort((a, b) => a.position - b.position)
        .map(({ perfumer }) => ({ slug: perfumer.slug, name: perfumer.name })),
      notes: data.perfume_notes
        .map(({ position, note }) => ({
          slug: note.slug,
          name: note.name,
          family: note.family,
          position,
          description: note.description,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    };
  },

  // RN09: perfumes com mais notas em comum com o alvo (nunca o próprio alvo)
  getSimilar: async (targetId: string, limit = SIMILAR_LIMIT): Promise<SimilarPerfume[]> => {
    const { data, error } = await supabase.rpc('get_similar_perfumes', {
      target_id: targetId,
      limit_count: limit,
    });
    if (error) throw toAppError(error);

    return data.map((row) => ({
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
      imageUrl: row.image_path
        ? supabase.storage.from('perfume-images').getPublicUrl(row.image_path).data.publicUrl
        : null,
      families: row.families,
      commonNotes: row.common_notes,
    }));
  },
};
