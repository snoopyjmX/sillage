import { useForm } from 'react-hook-form';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLink } from '@/components/auth/AuthLink';
import { Field } from '@/components/ui/field';
import { FormAlert } from '@/components/ui/form-alert';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage } from '@/constants/errors';
import { useSendPasswordReset } from '@/hooks/useAuthActions';
import { zodResolver } from '@/lib/zodResolver';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/schemas/auth';

export default function ForgotPasswordPage() {
  const sendReset = useSendPasswordReset();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(({ email }) => sendReset.mutate(email));

  return (
    <>
      <title>Recuperar senha · Sillage</title>
      <AuthCard
        title="Recuperar senha"
        description="Informe seu e-mail e enviaremos um link para criar uma nova senha."
        footer={<AuthLink to="/login">Voltar para o login</AuthLink>}
      >
        {sendReset.isSuccess ? (
          // Mesma resposta exista a conta ou não: não revela quais e-mails estão cadastrados
          <FormAlert tone="success">
            Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha. Confira
            também a caixa de spam.
          </FormAlert>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {sendReset.isError && <FormAlert>{getErrorMessage(sendReset.error)}</FormAlert>}
            <Field
              label="E-mail"
              type="email"
              autoComplete="email"
              inputMode="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <SubmitButton loading={sendReset.isPending} loadingLabel="Enviando…">
              Enviar link
            </SubmitButton>
          </form>
        )}
      </AuthCard>
    </>
  );
}
