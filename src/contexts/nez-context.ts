import { createContext } from 'react';

// Pergunta sugerida por uma tela. Objeto novo a cada pedido: sugerir o mesmo texto de novo conta.
export interface NezDraft {
  text: string;
}

export interface NezContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  // Perfume em foco na tela (texto de notas e famílias); a página de detalhes registra e limpa
  perfumeContext: string | null;
  setPerfumeContext: (context: string | null) => void;
  // O drawer coloca o texto no campo (sem enviar) quando chega um rascunho novo
  draft: NezDraft | null;
  setDraft: (draft: NezDraft) => void;
}

export const NezContext = createContext<NezContextValue | null>(null);
