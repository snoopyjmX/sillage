import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLink } from '@/components/auth/AuthLink';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { SeoHead } from '@/components/seo/SeoHead';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { FormAlert } from '@/components/ui/form-alert';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { useUpdatePassword } from '@/hooks/useAuthActions';
import { toast } from '@/lib/toast';
import { zodResolver } from '@/lib/zodResolver';
import { MIN_PASSWORD_LENGTH, resetPasswordSchema, type ResetPasswordValues } from '@/schemas/auth';
import { AuthPending } from '@/routes/AuthPending';

// Chegada pelo link do e-mail: o Supabase troca o token por uma sessão de recuperação.
// Sem sessão (link expirado, já usado ou acesso direto) não há o que redefinir.
export default function ResetPasswordPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const updatePassword = useUpdatePassword();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });
  const password = useWatch({ control, name: 'password' }) ?? '';

  const onSubmit = handleSubmit(({ password }) =>
    updatePassword.mutate(password, {
      onSuccess: () => {
        toast.success('Senha atualizada com sucesso.');
        void navigate('/', { replace: true });
      },
    })
  );

  if (status === 'loading') return <AuthPending />;

  if (status === 'unauthenticated') {
    return (
      <>
        <SeoHead title="Link inválido" description="O link de recuperação é inválido ou expirou." />
        <AuthCard
          title="Link inválido ou expirado"
          description="Peça um novo e-mail de recuperação para criar sua nova senha."
        >
          <Button asChild>
            <Link to="/forgot-password">Pedir novo link</Link>
          </Button>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Nova senha" description="Escolha uma senha nova para a sua conta." />
      <AuthCard
        title="Nova senha"
        description="Escolha uma senha nova para a sua conta."
        footer={<AuthLink to="/catalog">Cancelar</AuthLink>}
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {updatePassword.isError && <FormAlert>{getErrorMessage(updatePassword.error)}</FormAlert>}
          <PasswordField
            label="Nova senha"
            autoComplete="new-password"
            hint={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres, com letras e números.`}
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength value={password} />
          <PasswordField
            label="Repita a nova senha"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <SubmitButton loading={updatePassword.isPending} loadingLabel="Salvando…">
            Salvar nova senha
          </SubmitButton>
        </form>
      </AuthCard>
    </>
  );
}
