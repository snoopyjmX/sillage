import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

// Raiz das rotas: o AuthProvider precisa estar dentro do router para poder navegar.
export function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
