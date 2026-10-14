import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/form-alert';
import { OFFLINE_ACTION_HINT } from '@/constants/offline';
import { getErrorMessage } from '@/constants/errors';
import { useResendConfirmation } from '@/hooks/useAuthActions';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useResendCooldown } from '@/hooks/useResendCooldown';

interface ResendConfirmationProps {
  email: string;
}

// "Reenviar e-mail de confirmação" com espera visível entre os envios. Offline fica desabilitado
// e explicado. A resposta de sucesso é neutra (não diz se a conta existe).
export function ResendConfirmation({ email }: ResendConfirmationProps) {
  const resend = useResendConfirmation();
  const online = useOnlineStatus();
  const cooldown = useResendCooldown();

  const blocked = resend.isPending || cooldown.remaining > 0 || !online || email.trim() === '';

  const handleResend = () => {
    if (blocked) return;
    resend.mutate(email.trim(), { onSuccess: cooldown.start });
  };

  return (
    <div className="flex flex-col gap-3">
      {resend.isError && <FormAlert>{getErrorMessage(resend.error)}</FormAlert>}
      {resend.isSuccess && (
        <FormAlert tone="success">
          Se esse e-mail tiver um cadastro pendente, enviamos um novo link. Confira também o spam.
        </FormAlert>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleResend}
        aria-disabled={blocked || undefined}
        aria-busy={resend.isPending || undefined}
        title={online ? undefined : OFFLINE_ACTION_HINT}
        className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        {resend.isPending
          ? 'Enviando…'
          : cooldown.remaining > 0
            ? `Reenviar em ${cooldown.remaining} s`
            : 'Reenviar e-mail de confirmação'}
      </Button>
    </div>
  );
}
