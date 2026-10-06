import { useMutation } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { NezContext, type NezContextValue } from '@/contexts/nez-context';
import { aiService, type NezRequest } from '@/services/aiService';

export const useNez = (): NezContextValue => {
  const context = useContext(NezContext);
  if (!context) throw new Error('useNez precisa estar dentro de <NezProvider>');
  return context;
};

// A página de detalhes diz ao Nez qual perfume está na tela; ao sair, o contexto é limpo
export const useNezPerfumeContext = (perfumeContext: string): void => {
  const { setPerfumeContext } = useNez();
  useEffect(() => {
    setPerfumeContext(perfumeContext);
    return () => setPerfumeContext(null);
  }, [perfumeContext, setPerfumeContext]);
};

// Pergunta ao Nez. Mutation (não query): cada envio é uma pergunta nova, e a resposta é privada.
export const useAskNez = () =>
  useMutation({ mutationFn: (request: NezRequest) => aiService.askNez(request) });
