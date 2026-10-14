// Retrospectiva anual (Fase 23). Só services importam o cliente do Supabase.
// A função get_annual_recap() é SECURITY INVOKER: a RLS de dono filtra o memorial (RN01).
import { AppError, toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import { recapRowSchema, type RecapRow } from '@/schemas/recap';
import type { AnnualRecap, RecapPerfume } from '@/types/recap';

// Erro cru do Supabase nunca chega à interface: rede continua "rede", o resto vira falha da retrospectiva
const toRecapError = (error: Parameters<typeof toAppError>[0]): AppError => {
  const appError = toAppError(error);
  return appError.code === 'unknown' ? new AppError('recap_failed', { cause: error }) : appError;
};

const imageUrlFor = (imagePath: string | null): string | null =>
  imagePath ? supabase.storage.from('perfume-images').getPublicUrl(imagePath).data.publicUrl : null;

const toPerfume = (row: RecapRow['signature']): RecapPerfume | null =>
  row && {
    slug: row.slug,
    name: row.name,
    brandName: row.brand_name,
    imageUrl: imageUrlFor(row.image_path),
    days: row.days,
  };

export const recapService = {
  get: async (year: number): Promise<AnnualRecap> => {
    const { data, error } = await supabase.rpc('get_annual_recap', { p_year: year });
    if (error) throw toRecapError(error);
    const parsed = recapRowSchema.safeParse(data);
    if (!parsed.success) throw new AppError('recap_failed', { cause: parsed.error });

    const row = parsed.data;
    return {
      year: row.year,
      daysWorn: row.days_worn,
      daysElapsed: row.days_elapsed,
      consistency: row.consistency,
      signature: toPerfume(row.signature),
      seasons: {
        summer: toPerfume(row.seasons.summer),
        autumn: toPerfume(row.seasons.autumn),
        winter: toPerfume(row.seasons.winter),
        spring: toPerfume(row.seasons.spring),
      },
      topNote: row.top_note,
      families: {
        firstSemester: row.families.first_semester,
        secondSemester: row.families.second_semester,
      },
    };
  },
};
