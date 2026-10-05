// Proteção inversa: quem já está autenticado não vê login/cadastro. Também faz o retorno
// pós-login: quando a sessão surge, vai para `?redirect=` (só caminhos internos) ou para a Home.
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSafeRedirect } from '@/lib/redirect';
import { AuthPending } from './AuthPending';

export function GuestOnly() {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'loading') return <AuthPending />;
  if (status === 'authenticated') {
    return <Navigate to={getSafeRedirect(searchParams.get('redirect'))} replace />;
  }
  return <Outlet />;
}
