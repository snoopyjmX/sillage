// Formatos da coleção (docs/PRODUCT.md, RN11 e Fase 17A). Só perfumes em "Tenho" têm formato.
export type CollectionFormat = 'bottle' | 'decant' | 'sample';

export const FORMAT_LABELS: Record<CollectionFormat, string> = {
  bottle: 'Frasco',
  decant: 'Decant',
  sample: 'Amostra',
};

export const COLLECTION_FORMATS = Object.keys(FORMAT_LABELS) as CollectionFormat[];

// Volumes sugeridos por formato, em ml (D9): o valor certo quase sempre está a um toque
export const FORMAT_VOLUMES: Record<CollectionFormat, readonly number[]> = {
  bottle: [30, 50, 75, 100, 200],
  decant: [2, 5, 10, 15, 20],
  sample: [1, 2, 3],
};

// Mesmos limites do banco (CHECK collection_items_volume_valid)
export const VOLUME_MAX_ML = 1000;
