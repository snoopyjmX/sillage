// Simulação do authService para testes de UI: controla a sessão e dispara eventos do Supabase.
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { vi } from 'vitest';

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

export const fakeSession = (email = 'ana@exemplo.com'): Session =>
  ({
    access_token: 'token',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'u1', email },
  }) as Session;

export const createAuthMock = () => {
  let listener: Listener | null = null;
  let initial: Session | null = null;
  const service = {
    getSession: vi.fn(() => Promise.resolve(initial)),
    onAuthStateChange: vi.fn((next: Listener) => {
      listener = next;
      return () => {
        listener = null;
      };
    }),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
  };
  return {
    service,
    setInitialSession: (session: Session | null) => {
      initial = session;
    },
    emit: (event: AuthChangeEvent, session: Session | null) => listener?.(event, session),
    reset: () => {
      listener = null;
      initial = null;
      Object.values(service).forEach((fn) => fn.mockReset());
      service.getSession.mockImplementation(() => Promise.resolve(initial));
      service.onAuthStateChange.mockImplementation((next: Listener) => {
        listener = next;
        return () => {
          listener = null;
        };
      });
    },
  };
};
