import { FAMILIES } from '@/constants/labels';
import type { PerfumeDetail, PerfumeSummary } from '@/types/catalog';

// A página de detalhes tem o perfume completo; a coleção guarda o resumo (o mesmo do card).
// Famílias derivadas das notas, na ordem do enum, como a função de busca devolve.
export const toPerfumeSummary = (detail: PerfumeDetail): PerfumeSummary => ({
  id: detail.id,
  slug: detail.slug,
  name: detail.name,
  brandName: detail.brandName,
  brandSlug: detail.brandSlug,
  concentration: detail.concentration,
  gender: detail.gender,
  releaseYear: detail.releaseYear,
  imagePath: null,
  families: FAMILIES.filter((family) => detail.notes.some((note) => note.family === family)),
});
