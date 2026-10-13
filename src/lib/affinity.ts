// Afinidade de um perfume com o DNA olfativo do usuário (Fase 18A, D12): um rótulo com os motivos,
// nunca uma porcentagem, porque uma heurística não tem a precisão que um número passa.
// Regra pura: os números vêm de constants/affinity.ts.
import {
  AFFINITY_HIGH_FROM,
  AFFINITY_MAX_REASONS,
  AFFINITY_MEDIUM_FROM,
  AFFINITY_NEW_FAMILY_BELOW,
  AFFINITY_NOTE_BONUS,
  AFFINITY_NOTE_BONUS_MAX,
  AFFINITY_SHARED_FAMILY_MIN,
} from '@/constants/affinity';
import { FAMILIES, FAMILY_LABELS, type OlfactiveFamily } from '@/constants/labels';
import { isDnaReady } from '@/lib/olfactoryDna';
import type { PyramidNote } from '@/types/catalog';
import type { OlfactoryDna } from '@/types/dna';

export type AffinityLevel = 'high' | 'medium' | 'low';

export const AFFINITY_LABELS: Record<AffinityLevel, string> = {
  high: 'Afinidade alta',
  medium: 'Afinidade média',
  low: 'Afinidade baixa',
};

export interface Affinity {
  level: AffinityLevel;
  // Até AFFINITY_MAX_REASONS frases curtas
  reasons: string[];
  // Média ou baixa: "Prove num decant antes"
  suggestDecant: boolean;
}

const joinNames = (names: readonly string[]): string =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`;

const levelFor = (score: number): AffinityLevel =>
  score >= AFFINITY_HIGH_FROM ? 'high' : score >= AFFINITY_MEDIUM_FROM ? 'medium' : 'low';

// Nulo quando não dá para avaliar: DNA ainda se formando (D3) ou perfume sem notas
export const computeAffinity = (
  dna: OlfactoryDna,
  notes: readonly PyramidNote[]
): Affinity | null => {
  if (!isDnaReady(dna)) return null;
  // A mesma nota em duas posições conta uma vez
  const distinct = [...new Map(notes.map((note) => [note.slug, note])).values()];
  if (distinct.length === 0) return null;

  const dnaTotal = dna.families.reduce((sum, { weight }) => sum + weight, 0);
  if (dnaTotal === 0) return null;
  const dnaShare = (family: OlfactiveFamily): number =>
    (dna.families.find((entry) => entry.family === family)?.weight ?? 0) / dnaTotal;
  const perfumeShare = (family: OlfactiveFamily): number =>
    distinct.filter((note) => note.family === family).length / distinct.length;

  const overlaps = FAMILIES.map((family) => ({
    family,
    overlap: Math.min(dnaShare(family), perfumeShare(family)),
  }));
  const overlap = overlaps.reduce((sum, entry) => sum + entry.overlap, 0);

  const topSlugs = new Set(dna.topNotes.map((note) => note.slug));
  const sharedNotes = distinct.filter((note) => topSlugs.has(note.slug));
  const bonus = AFFINITY_NOTE_BONUS * Math.min(sharedNotes.length, AFFINITY_NOTE_BONUS_MAX);
  const level = levelFor(Math.min(1, overlap + bonus));

  const sharedFamilies = overlaps
    .filter(
      ({ family, overlap: value }) =>
        value > 0 && dnaShare(family) >= AFFINITY_SHARED_FAMILY_MIN && perfumeShare(family) > 0
    )
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 2)
    .map(({ family }) => FAMILY_LABELS[family]);

  // A família que mais pesa no perfume; empate pela ordem do enum
  const dominant = FAMILIES.filter((family) => perfumeShare(family) > 0).sort(
    (a, b) => perfumeShare(b) - perfumeShare(a)
  )[0];
  const newTerritory =
    dominant !== undefined && dnaShare(dominant) < AFFINITY_NEW_FAMILY_BELOW
      ? `Você ainda não tem nada ${FAMILY_LABELS[dominant]}`
      : null;

  const familyReason =
    sharedFamilies.length > 0 ? `Divide ${joinNames(sharedFamilies)} com a sua coleção` : null;
  const noteNames = sharedNotes.slice(0, 2).map((note) => note.name);
  const noteReason =
    noteNames.length === 0
      ? null
      : noteNames.length === 1
        ? `Tem ${noteNames[0]}, uma das notas que mais aparecem na sua coleção`
        : `Tem ${joinNames(noteNames)}, notas que mais aparecem na sua coleção`;

  // Afinidade baixa abre pelo que é novo; as outras, pelo que já combina
  const ordered =
    level === 'low'
      ? [newTerritory, familyReason, noteReason]
      : [familyReason, noteReason, newTerritory];
  const reasons = ordered
    .filter((reason): reason is string => reason !== null)
    .slice(0, AFFINITY_MAX_REASONS);
  if (reasons.length === 0) reasons.push('Tem pouco em comum com o que você mais usa');

  return { level, reasons, suggestDecant: level !== 'high' };
};
