import { useMutation } from '@tanstack/react-query';
import { fireConfetti } from '@/components/ui/confetti';
import { toast } from '@/lib/toast';
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
    // No hook (não no componente): o redirecionamento da guarda pode desmontar a página antes do
    // callback de `mutate`. Vale com ou sem confirmação de e-mail pendente.
    onSuccess: fireConfetti,
  });

export const useResendConfirmation = () =>
  useMutation({ mutationFn: (email: string) => authService.resendConfirmation(email) });

export const useSignOut = () => useMutation({ mutationFn: () => authService.signOut() });

export const useSendPasswordReset = () =>
  useMutation({ mutationFn: (email: string) => authService.sendPasswordReset(email) });

export const useUpdatePassword = () =>
  useMutation({ mutationFn: (password: string) => authService.updatePassword(password) });

// O signOut local do service dispara SIGNED_OUT: o AuthProvider limpa o cache privado e vai para a Home
export const useDeleteAccount = () =>
  useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: () => toast.success('Sua conta foi excluída.'),
  });
