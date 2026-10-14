// Conteúdo do card da retrospectiva (Fase 23): textos já formatados, sem layout nem canvas.
import { SEASON_LABELS, SEASONS } from '@/constants/recap';
import type { OlfactiveFamily } from '@/constants/labels';
import { formatCount } from '@/lib/format';
import { consistencyPercent } from '@/lib/recap';
import type { AnnualRecap } from '@/types/recap';

export interface RecapCardContent {
  year: number;
  daysLabel: string;
  consistencyLabel: string;
  signature: { brand: string; name: string; daysLabel: string; imageUrl: string | null } | null;
  // Sempre as quatro estações, na ordem; sem registros, perfume nulo
  seasons: { label: string; perfume: string | null }[];
  topNote: string | null;
  // Cor do palco quando a foto não carrega
  family: OlfactiveFamily | null;
}

export const buildRecapCardContent = (recap: AnnualRecap): RecapCardContent => ({
  year: recap.year,
  daysLabel: `${formatCount(recap.daysWorn, 'dia', 'dias')} com perfume`,
  consistencyLabel: `${consistencyPercent(recap.consistency)}% do ano`,
  signature: recap.signature && {
    brand: recap.signature.brandName,
    name: recap.signature.name,
    daysLabel: formatCount(recap.signature.days, 'dia', 'dias'),
    imageUrl: recap.signature.imageUrl,
  },
  seasons: SEASONS.map((season) => ({
    label: SEASON_LABELS[season],
    perfume: recap.seasons[season]?.name ?? null,
  })),
  topNote: recap.topNote?.name ?? null,
  family: recap.topNote?.family ?? null,
});
