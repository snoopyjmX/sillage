// Sessão do app (docs/PRODUCT.md, Seção 7). Lê a sessão inicial, assina onAuthStateChange e
// reage a SIGNED_OUT e PASSWORD_RECOVERY. Precisa ficar DENTRO do router (usa useNavigate).
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { mayHaveSession } from '@/lib/sessionHint';
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
  // Quem nunca entrou já nasce visitante: a Landing não espera o Supabase (carregado depois)
  const [skipLookup] = useState(() => !mayHaveSession());
  const [value, setValue] = useState<AuthContextValue>({
    status: skipLookup ? 'unauthenticated' : 'loading',
    session: null,
    user: null,
  });

  // A navegação só acontece depois da renderização: os efeitos dos filhos (a guarda RequireAuth
  // redirecionando para o login) rodam antes deste, então a Home vence e o logout não vira
  // /login?redirect=<rota atual>.
  const [pending, setPending] = useState<{ id: number; to: string } | null>(null);
  useEffect(() => {
    if (pending) void navigate(pending.to, { replace: true });
  }, [pending, navigate]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const goTo = (to: string) => setPending((current) => ({ id: (current?.id ?? 0) + 1, to }));

    // Se onAuthStateChange já respondeu, a sessão inicial não sobrescreve o estado mais novo. No
    // atalho de visitante (sem sessão guardada) o estado já nasce "unauthenticated": só uma sessão
    // que apareceu enquanto o Supabase carregava (login muito rápido) o substitui.
    const settleInitial = (session: Session | null) => {
      if (!active) return;
      setValue((current) =>
        current.status === 'loading' || (skipLookup && session !== null && current.session === null)
          ? toValue(session)
          : current
      );
    };

    const subscribe = async () => {
      const { authService } = await import('@/services/authService');
      if (!active) return;
      // Callback síncrono: sem await em chamadas ao Supabase aqui dentro (risco de deadlock).
      unsubscribe = authService.onAuthStateChange((event, session) => {
        if (!active) return;
        setValue(toValue(session));
        if (event === 'SIGNED_OUT') {
          // Dados privados saem da memória; o cache ['public'] (catálogo) permanece
          queryClient.removeQueries({ queryKey: ['private'] });
          goTo('/');
        } else if (event === 'PASSWORD_RECOVERY') {
          goTo('/reset-password');
        }
        // TOKEN_REFRESHED e demais eventos: só atualizam a sessão, nada a fazer na UI
      });
      authService.getSession().then(settleInitial, () => settleInitial(null));
    };

    // Visitante: o Supabase carrega quando o navegador está ocioso, fora do caminho crítico da Landing
    let idleHandle: number | null = null;
    if (skipLookup && typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(() => void subscribe(), { timeout: 1500 });
    } else {
      void subscribe();
    }

    return () => {
      active = false;
      if (idleHandle !== null) window.cancelIdleCallback(idleHandle);
      unsubscribe();
    };
  }, [queryClient, skipLookup]);

  const memo = useMemo(() => value, [value]);
  return <AuthContext.Provider value={memo}>{children}</AuthContext.Provider>;
}
