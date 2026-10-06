import { FAMILIES, FAMILY_LABELS, POSITIONS, POSITION_LABELS } from '@/constants/labels';
import type { PerfumeDetail } from '@/types/catalog';

export const NEZ_QUESTION_MAX = 500;

// Contexto enviado ao Nez: o perfume em foco com notas por camada e famílias olfativas
export const buildPerfumeContext = (perfume: PerfumeDetail): string => {
  const layers = POSITIONS.map((position) => {
    const names = perfume.notes.filter((n) => n.position === position).map((n) => n.name);
    return names.length > 0 ? `${POSITION_LABELS[position]}: ${names.join(', ')}` : null;
  }).filter((line): line is string => line !== null);
  const families = FAMILIES.filter((family) => perfume.notes.some((n) => n.family === family)).map(
    (family) => FAMILY_LABELS[family]
  );

  return [
    `${perfume.name}, da marca ${perfume.brandName}`,
    ...layers,
    families.length > 0 ? `Famílias olfativas: ${families.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');
};
