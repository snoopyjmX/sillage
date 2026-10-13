// Valida a resposta de public.get_olfactory_dna() antes de ela chegar ao app.
import { z } from 'zod';
import { FAMILIES } from '@/constants/labels';
import type { OlfactoryDna } from '@/types/dna';

const family = z.enum(FAMILIES);
const count = z.number().int().nonnegative();

const dnaSchema = z.object({
  families: z.array(z.object({ family, weight: count })),
  top_notes: z.array(z.object({ slug: z.string(), name: z.string(), family, weight: count })),
  wish_family: family.nullable(),
  wanted_count: count,
  perfume_count: count,
  memorial_days: count,
});

// Resposta fora do formato vira `null` e o service a trata como falha
export const parseOlfactoryDna = (value: unknown): OlfactoryDna | null => {
  const parsed = dnaSchema.safeParse(value);
  if (!parsed.success) return null;
  const dna = parsed.data;
  return {
    families: dna.families,
    topNotes: dna.top_notes,
    wishFamily: dna.wish_family,
    wantedCount: dna.wanted_count,
    perfumeCount: dna.perfume_count,
    memorialDays: dna.memorial_days,
  };
};
