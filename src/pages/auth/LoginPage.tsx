import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLink } from '@/components/auth/AuthLink';
import { Field } from '@/components/ui/field';
import { FormAlert } from '@/components/ui/form-alert';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage } from '@/constants/errors';
import { useSignIn } from '@/hooks/useAuthActions';
import { zodResolver } from '@/lib/zodResolver';
import { loginSchema, type LoginValues } from '@/schemas/auth';

// O retorno ao destino original (?redirect=) é feito pela GuestOnly quando a sessão surge.
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const search = searchParams.get('redirect')
    ? `?redirect=${encodeURIComponent(searchParams.get('redirect') ?? '')}`
    : '';

  const onSubmit = handleSubmit((values) => signIn.mutate(values));

  return (
    <>
      <title>Entrar · Sillage</title>
      <AuthCard
        title="Entrar"
        description="Acesse sua coleção e seu Perfume do Dia."
        footer={
          <>
            Ainda não tem conta? <AuthLink to={`/register${search}`}>Criar conta</AuthLink>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {signIn.isError && <FormAlert>{getErrorMessage(signIn.error)}</FormAlert>}
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Field
            label="Senha"
            type="password"
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
