// Origem: própria. Padroniza os estados de uma tela assíncrona (docs/PRODUCT.md, Seção 11):
// carregando, vazio, erro (com tentar de novo), offline e sucesso. Nenhum texto técnico passa por aqui.
import { WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from './button';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

interface AsyncBoundaryProps {
  status: 'pending' | 'error' | 'success';
  isEmpty?: boolean;
  // Skeleton com as mesmas dimensões do conteúdo final
  loading: ReactNode;
  empty?: ReactNode;
  onRetry?: () => void;
  errorTitle?: string;
  errorDescription?: string;
  offlineTitle?: string;
  offlineDescription?: string;
  retryLabel?: string;
  children: ReactNode;
}

export function AsyncBoundary({
  status,
  isEmpty = false,
  loading,
  empty,
  onRetry,
  errorTitle,
  errorDescription,
  offlineTitle = 'Você está offline',
  offlineDescription = 'Conecte-se à internet para carregar estes dados.',
  retryLabel = 'Tentar novamente',
  children,
}: AsyncBoundaryProps) {
  const online = useOnlineStatus();

  // Offline sem dados na mão: explica em vez de girar para sempre ou mostrar erro técnico.
  // Com dados (sucesso), a tela segue mostrando o que já tem.
  if (!online && status !== 'success') {
    return (
      <EmptyState
        icon={WifiOff}
        title={offlineTitle}
        description={offlineDescription}
        action={
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          )
        }
      />
    );
  }
  if (status === 'error') {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={onRetry}
        retryLabel={retryLabel}
      />
    );
  }
  if (status === 'pending') return <>{loading}</>;
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}
