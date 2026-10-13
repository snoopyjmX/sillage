import type { NotePosition } from '@/constants/labels';

// Textos fixos de cada camada da pirâmide (docs/PRODUCT.md, Seção 9): quanto tempo dura e o que ela faz
export const LAYER_DETAILS: Record<NotePosition, { timing: string; summary: string }> = {
  top: { timing: '0–30 min', summary: 'A abertura: o que você sente ao borrifar' },
  heart: { timing: '30 min–4 h', summary: 'A identidade do perfume' },
  base: { timing: '4 h ou mais', summary: 'A fixação na pele e na roupa' },
};
