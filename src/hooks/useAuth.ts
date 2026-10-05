import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return context;
};
