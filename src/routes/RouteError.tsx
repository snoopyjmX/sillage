import { useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/ui/error-state';

// Erro inesperado de rota (ex.: falha ao carregar o chunk da página). Nunca mostra a mensagem crua.
export function RouteError() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorState
        title="Algo deu errado"
        description="Não foi possível abrir esta página. Recarregue para tentar de novo."
        onRetry={() => window.location.reload()}
        retryLabel="Recarregar"
      />
    </div>
  );
}
