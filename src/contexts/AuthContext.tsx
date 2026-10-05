// Sessão do app (docs/PRODUCT.md, Seção 7). Lê a sessão inicial, assina onAuthStateChange e
// reage a SIGNED_OUT e PASSWORD_RECOVERY. Precisa ficar DENTRO do router (usa useNavigate).
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { AuthContext, type AuthContextValue } from './auth-context';

const toValue = (session: Session | null): AuthContextValue => ({
  status: session ? 'authenticated' : 'unauthenticated',
  session,
  user: session?.user ?? null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<AuthContextValue>({
    status: 'loading',
    session: null,
    user: null,
  });

  useEffect(() => {
    let active = true;

    // Callback síncrono: sem await em chamadas ao Supabase aqui dentro (risco de deadlock).
    const unsubscribe = authService.onAuthStateChange((event, session) => {
      if (!active) return;
      setValue(toValue(session));
      if (event === 'SIGNED_OUT') {
        // Dados privados saem da memória; o cache ['public'] (catálogo) permanece
        queryClient.removeQueries({ queryKey: ['private'] });
        setTimeout(() => navigate('/', { replace: true }), 0);
      } else if (event === 'PASSWORD_RECOVERY') {
        setTimeout(() => navigate('/reset-password', { replace: true }), 0);
      }
      // TOKEN_REFRESHED e demais eventos: só atualizam a sessão, nada a fazer na UI
    });

    // Se onAuthStateChange já respondeu, a sessão inicial não sobrescreve o estado mais novo
    const settleInitial = (session: Session | null) => {
      if (active)
        setValue((current) => (current.status === 'loading' ? toValue(session) : current));
    };
    authService.getSession().then(settleInitial, () => settleInitial(null));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate, queryClient]);

  const memo = useMemo(() => value, [value]);
  return <AuthContext.Provider value={memo}>{children}</AuthContext.Provider>;
}
