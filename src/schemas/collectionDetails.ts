// Formato e volume de um perfume em "Tenho" (RN11). Os limites espelham os CHECKs do banco.
import { z } from 'zod';
import { COLLECTION_FORMATS, VOLUME_MAX_ML } from '@/constants/collection';

// Uma casa decimal (numeric(5,1)): 2,5 ml vale, 2,55 não
const isOneDecimal = (value: number): boolean =>
  Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;

export const collectionDetailsSchema = z
  .object({
    format: z.enum(COLLECTION_FORMATS).nullable(),
    volumeMl: z.number().nullable(),
  })
  .superRefine((value, context) => {
    if (value.volumeMl === null) return;
    if (value.format === null) {
      context.addIssue({
        code: 'custom',
        path: ['volumeMl'],
        message: 'Escolha o formato antes do volume.',
      });
      return;
    }
    if (!(value.volumeMl > 0) || value.volumeMl > VOLUME_MAX_ML || !isOneDecimal(value.volumeMl)) {
      context.addIssue({
        code: 'custom',
        path: ['volumeMl'],
        message: 'Informe um volume de até 1.000 ml, com no máximo uma casa decimal.',
      });
    }
  });

export type CollectionDetailsInput = z.infer<typeof collectionDetailsSchema>;

// "2,5" ou "2.5" -> 2.5; vazio -> null; texto inválido -> NaN (o schema rejeita)
export const parseVolumeInput = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : Number.NaN;
};
