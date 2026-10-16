import { createContext } from 'react';

export interface NezContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  // Perfume em foco na tela (texto de notas e famílias); a página de detalhes registra e limpa
  perfumeContext: string | null;
  setPerfumeContext: (context: string | null) => void;
  // Pergunta sugerida por uma tela: o drawer a coloca no campo (sem enviar) e limpa o rascunho
  draft: string | null;
  setDraft: (draft: string | null) => void;
}

export const NezContext = createContext<NezContextValue | null>(null);
