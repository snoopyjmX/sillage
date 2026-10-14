import { useMutation, useQuery } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { NezContext, type NezContextValue } from '@/contexts/nez-context';
import { queryKeys } from '@/lib/queryKeys';
import { aiService, type NezDiscoveryRequest, type NezRequest } from '@/services/aiService';
import { perfumeService } from '@/services/perfumeService';

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

// Trilha de descoberta: cada envio é uma consulta nova ao Nez (mutation, resposta privada)
export const useNezDiscovery = () =>
  useMutation({ mutationFn: (request: NezDiscoveryRequest) => aiService.discoverNez(request) });

// Cards das escolhas do Nez: os perfumes são do catálogo público, então a query é persistível
export const useNezPicks = (slugs: string[]) =>
  useQuery({
    queryKey: queryKeys.perfumes.bySlugs(slugs),
    queryFn: () => perfumeService.getSummariesBySlugs(slugs),
    enabled: slugs.length > 0,
  });
