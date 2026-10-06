// Só UX: a segurança real é a RLS (docs/PRODUCT.md, Seção 7). Visitante vai para a Landing ("/")
// com ?redirect=<rota original>; o gate NÃO é barreira de dados (a leitura do catálogo segue pública no banco).
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { buildGatePath } from '@/lib/redirect';
import { AuthPending } from './AuthPending';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthPending />;
  if (status === 'unauthenticated') {
    return (
      <Navigate
        to={buildGatePath(`${location.pathname}${location.search}${location.hash}`)}
        replace
      />
    );
  }
  return <Outlet />;
}
