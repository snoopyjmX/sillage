import { useMutation } from '@tanstack/react-query';
import { getBrowserTimezone } from '@/lib/timezone';
import type { LoginValues, RegisterValues } from '@/schemas/auth';
import { authService } from '@/services/authService';

// Mutations de autenticação. O estado da sessão não é tratado aqui: o AuthProvider reage ao
// onAuthStateChange e as guardas de rota fazem os redirecionamentos.
export const useSignIn = () =>
  useMutation({
    mutationFn: ({ email, password }: LoginValues) => authService.signIn(email, password),
  });

export const useSignUp = () =>
  useMutation({
    mutationFn: ({ email, password, displayName }: RegisterValues) =>
      authService.signUp(email, password, displayName, getBrowserTimezone()),
  });

export const useSignOut = () => useMutation({ mutationFn: () => authService.signOut() });

export const useSendPasswordReset = () =>
  useMutation({ mutationFn: (email: string) => authService.sendPasswordReset(email) });

export const useUpdatePassword = () =>
  useMutation({ mutationFn: (password: string) => authService.updatePassword(password) });
