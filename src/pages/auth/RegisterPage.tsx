import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLink } from '@/components/auth/AuthLink';
import { SeoHead } from '@/components/seo/SeoHead';
import { Field } from '@/components/ui/field';
import { PasswordField } from '@/components/ui/password-field';
import { FormAlert } from '@/components/ui/form-alert';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage } from '@/constants/errors';
import { useSignUp } from '@/hooks/useAuthActions';
import { zodResolver } from '@/lib/zodResolver';
import {
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  registerSchema,
  type RegisterValues,
} from '@/schemas/auth';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const redirect = searchParams.get('redirect');
  const search = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  const onSubmit = handleSubmit((values) => signUp.mutate(values));
  const needsConfirmation = signUp.data?.needsEmailConfirmation === true;

  return (
    <>
      <SeoHead
        title="Criar conta"
        description="Monte sua coleção, avalie perfumes e escolha o Perfume do Dia."
      />
      <AuthCard
        title="Criar conta"
        description="Monte sua coleção, avalie perfumes e escolha o Perfume do Dia."
        footer={
          <>
            Já tem conta? <AuthLink to={`/login${search}`}>Entrar</AuthLink>
          </>
        }
      >
        {needsConfirmation ? (
          <FormAlert tone="success">
            Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme para poder
            entrar.
          </FormAlert>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {signUp.isError && <FormAlert>{getErrorMessage(signUp.error)}</FormAlert>}
            <Field
              label="Nome"
              autoComplete="name"
              maxLength={MAX_NAME_LENGTH}
              error={errors.displayName?.message}
              {...register('displayName')}
            />
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

              autoComplete="new-password"
              hint={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres, com letras e números.`}
              error={errors.password?.message}
              {...register('password')}
            />
            <SubmitButton loading={signUp.isPending} loadingLabel="Criando conta…">
              Criar conta
            </SubmitButton>
          </form>
        )}
      </AuthCard>
    </>
  );
}
