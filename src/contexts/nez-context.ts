import { createContext } from 'react';

export interface NezContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  // Perfume em foco na tela (texto de notas e famílias); a página de detalhes registra e limpa
  perfumeContext: string | null;
  setPerfumeContext: (context: string | null) => void;
}

export const NezContext = createContext<NezContextValue | null>(null);
