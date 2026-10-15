import { ScanFace } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLink } from '@/components/auth/AuthLink';
import { ResendConfirmation } from '@/components/auth/ResendConfirmation';
import { SeoHead } from '@/components/seo/SeoHead';
import { Field } from '@/components/ui/field';
import { PasswordField } from '@/components/ui/password-field';
import { FormAlert } from '@/components/ui/form-alert';
import { SubmitButton } from '@/components/ui/submit-button';
import { AppError, getErrorMessage, isSilentError } from '@/constants/errors';
import { useSignIn } from '@/hooks/useAuthActions';
import { usePasskeySupport, useSignInWithPasskey } from '@/hooks/usePasskeys';
import { zodResolver } from '@/lib/zodResolver';
import { loginSchema, type LoginValues } from '@/schemas/auth';

// O retorno ao destino original (?redirect=) é feito pela GuestOnly quando a sessão surge, venha ela
// da senha ou da biometria.
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const signIn = useSignIn();
  const passkeySupported = usePasskeySupport();
  const passkeySignIn = useSignInWithPasskey();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const search = searchParams.get('redirect')
    ? `?redirect=${encodeURIComponent(searchParams.get('redirect') ?? '')}`
    : '';

  const email = useWatch({ control, name: 'email' });
  // Uma forma de entrar por vez: o erro exibido é sempre o da última tentativa
  const onSubmit = handleSubmit((values) => {
    passkeySignIn.reset();
    signIn.mutate(values);
  });
  const handlePasskey = () => {
    signIn.reset();
    passkeySignIn.mutate();
  };
  const notConfirmed =
    signIn.error instanceof AppError && signIn.error.code === 'email_not_confirmed';
  const passkeyError =
    passkeySignIn.isError && !isSilentError(passkeySignIn.error) ? passkeySignIn.error : null;

  return (
    <>
      <SeoHead title="Entrar" description="Acesse sua coleção e seu Perfume do Dia." />
      <AuthCard
        title="Entrar"
        description="Acesse sua coleção e seu Perfume do Dia."
        footer={
          <>
            Ainda não tem conta? <AuthLink to={`/register${search}`}>Criar conta</AuthLink>
          </>
        }
      >
        {passkeySupported && (
          <div className="flex flex-col gap-4">
            {passkeyError && <FormAlert>{getErrorMessage(passkeyError)}</FormAlert>}
            <SubmitButton
              variant="outline"
              loading={passkeySignIn.isPending}
              loadingLabel="Aguardando a biometria…"
              disabled={signIn.isPending}
              onClick={handlePasskey}
            >
              <ScanFace aria-hidden />
              Entrar com Face ID ou Digital
            </SubmitButton>
            <p className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="h-px flex-1 bg-border" aria-hidden />
              ou com e-mail e senha
              <span className="h-px flex-1 bg-border" aria-hidden />
            </p>
          </div>
        )}
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {signIn.isError && <FormAlert>{getErrorMessage(signIn.error)}</FormAlert>}
          {notConfirmed && <ResendConfirmation email={email ?? ''} />}
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            label="Senha"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <SubmitButton loading={signIn.isPending} loadingLabel="Entrando…">
            Entrar
          </SubmitButton>
          <p className="text-center text-sm">
            <AuthLink to="/forgot-password">Esqueci minha senha</AuthLink>
          </p>
        </form>
      </AuthCard>
    </>
  );
}
