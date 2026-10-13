// "Combina com você?" (docs/PRODUCT.md, Fase 18A). Heurística editorial, não dado de perfumaria: o
// rótulo (alta, média, baixa) vem de uma sobreposição entre o DNA olfativo e as notas do perfume.
// Mudou um número aqui, mude o doc.

// Sobreposição de 0 a 1: soma, por família, do menor entre o peso da família no DNA e no perfume
export const AFFINITY_HIGH_FROM = 0.6;
export const AFFINITY_MEDIUM_FROM = 0.35;

// Cada nota do perfume que está entre as que mais aparecem no DNA soma este tanto (até o teto)
export const AFFINITY_NOTE_BONUS = 0.1;
export const AFFINITY_NOTE_BONUS_MAX = 2;

// Uma família "divide" com o DNA quando pesa pelo menos isto nele; "ainda não tem nada" quando pesa
// menos que o segundo valor
export const AFFINITY_SHARED_FAMILY_MIN = 0.15;
export const AFFINITY_NEW_FAMILY_BELOW = 0.05;

// No máximo este tanto de motivos na tela
export const AFFINITY_MAX_REASONS = 2;
