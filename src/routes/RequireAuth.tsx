// Só UX: a segurança real é a RLS (docs/PRODUCT.md, Seção 7).
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { buildLoginPath } from '@/lib/redirect';
import { AuthPending } from './AuthPending';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthPending />;
  if (status === 'unauthenticated') {
    return (
      <Navigate
        to={buildLoginPath(`${location.pathname}${location.search}${location.hash}`)}
        replace
      />
    );
  }
  return <Outlet />;
}
