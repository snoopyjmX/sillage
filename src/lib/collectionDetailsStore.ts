// Qual perfume está com o diálogo "Detalhar formato" aberto. Um único diálogo vive no AppShell
// (CollectionDetailsHost) e qualquer ponto do app o abre por aqui: o botão "Detalhar" da Coleção e
// a ação do toast de "Tenho". Fora do React de propósito: o toast sobrevive à tela que o disparou.
import type { PerfumeSummary } from '@/types/catalog';

type Listener = () => void;

let target: PerfumeSummary | null = null;
const listeners = new Set<Listener>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const openCollectionDetails = (perfume: PerfumeSummary): void => {
  target = perfume;
  emit();
};

export const closeCollectionDetails = (): void => {
  target = null;
  emit();
};

export const subscribeCollectionDetails = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getCollectionDetailsTarget = (): PerfumeSummary | null => target;
