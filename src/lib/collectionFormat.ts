// Regras puras dos formatos da coleção (RN11, Fase 17A).
import { FORMAT_LABELS, FORMAT_VOLUMES } from '@/constants/collection';
import { formatDecimal, formatInteger } from '@/lib/format';
import type { CollectionDetails, CollectionFormat } from '@/types/collection';

// "10 ml" / "2,5 ml"
export const formatVolume = (volumeMl: number): string =>
  `${Number.isInteger(volumeMl) ? formatInteger(volumeMl) : formatDecimal(volumeMl)} ml`;

// "Frasco 100 ml", "Decant 10 ml"; só o formato se faltar o volume; nulo sem formato (D8: não
// presumimos "Frasco")
export const formatBadgeLabel = ({ format, volumeMl }: CollectionDetails): string | null => {
  if (format === null) return null;
  return volumeMl === null
    ? FORMAT_LABELS[format]
    : `${FORMAT_LABELS[format]} ${formatVolume(volumeMl)}`;
};

// O volume atual é um dos sugeridos do formato? Senão, vira "Outro".
export const isSuggestedVolume = (format: CollectionFormat, volumeMl: number): boolean =>
  FORMAT_VOLUMES[format].includes(volumeMl);

// Valor para a caixa "Outro": vírgula decimal, sem zeros sobrando
export const volumeToInput = (volumeMl: number | null): string =>
  volumeMl === null ? '' : String(volumeMl).replace('.', ',');
