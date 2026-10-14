// Trilha de descoberta do Nez (Fase 22): as opções do questionário. Os valores (`cold`, `work`...)
// são o contrato com a Edge Function nez-ai; os rótulos são o que a pessoa lê.
import type { TempBand } from './climate';

export const NEZ_OCCASIONS = ['work', 'night', 'casual', 'special'] as const;
export type NezOccasion = (typeof NEZ_OCCASIONS)[number];

export const NEZ_CLIMATE_LABELS: Record<TempBand, string> = {
  cold: 'Frio intenso',
  mild: 'Ameno',
  hot: 'Calor tropical',
};

export const NEZ_OCCASION_LABELS: Record<NezOccasion, string> = {
  work: 'Trabalho e foco',
  night: 'Noite e encontro',
  casual: 'Casual, de dia',
  special: 'Ocasião especial',
};

export const NEZ_CLIMATES = ['cold', 'mild', 'hot'] as const satisfies readonly TempBand[];

// Quantas famílias de predileção a pessoa pode marcar
export const NEZ_MAX_FAMILIES = 2;
