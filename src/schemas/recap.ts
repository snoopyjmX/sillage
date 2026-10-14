// Valida a resposta crua de get_annual_recap: o banco devolve jsonb, que o gerador de tipos não
// enxerga. Formato inesperado vira erro (nunca dado torto na tela).
import { z } from 'zod';
import { FAMILIES } from '@/constants/labels';

const family = z.enum(FAMILIES);

const perfume = z.object({
  slug: z.string(),
  name: z.string(),
  brand_name: z.string(),
  image_path: z.string().nullable(),
  days: z.number().int().nonnegative(),
});

const familyWeights = z.array(z.object({ family, weight: z.number().int().positive() }));

export const recapRowSchema = z.object({
  year: z.number().int(),
  days_worn: z.number().int().nonnegative(),
  days_elapsed: z.number().int().positive(),
  consistency: z.number().min(0).max(1),
  signature: perfume.nullable(),
  seasons: z.object({
    summer: perfume.nullable(),
    autumn: perfume.nullable(),
    winter: perfume.nullable(),
    spring: perfume.nullable(),
  }),
  top_note: z
    .object({ slug: z.string(), name: z.string(), family, weight: z.number().int().positive() })
    .nullable(),
  families: z.object({ first_semester: familyWeights, second_semester: familyWeights }),
});

export type RecapRow = z.infer<typeof recapRowSchema>;
