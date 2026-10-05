import type { Session, User } from '@supabase/supabase-js';
import { createContext } from 'react';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
