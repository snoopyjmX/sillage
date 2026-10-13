import { TriangleAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { FormAlert } from '@/components/ui/form-alert';
import { OfflineHint } from '@/components/ui/offline-hint';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage } from '@/constants/errors';
import { useDeleteAccount } from '@/hooks/useAuthActions';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const CONFIRMATION_WORD = 'EXCLUIR';

// "Zona de perigo": a exclusão só liga depois de digitar EXCLUIR. Quem apaga é a Edge Function
// delete-account; no sucesso a sessão cai e o app volta para a Home.
export function DangerZone() {
  const online = useOnlineStatus();
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const confirmed = typed === CONFIRMATION_WORD;

  const handleOpenChange = (next: boolean) => {
    // Não fecha no meio da exclusão
    if (!next && deleteAccount.isPending) return;
    setOpen(next);
    if (!next) {
      setTyped('');
      deleteAccount.reset();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmed || !online) return;
    deleteAccount.mutate();
  };

  return (
    <section
      aria-labelledby="danger-zone-title"
      className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-5"
    >
      <h2
        id="danger-zone-title"
        className="flex items-center gap-2 font-heading text-xl font-medium text-error"
      >
        <TriangleAlert className="size-5" aria-hidden />
        Zona de perigo
      </h2>
      <p className="text-sm text-text-secondary">
        Excluir a conta apaga o seu perfil, a sua coleção, o memorial e as suas avaliações. Essa
        ação não poderá ser desfeita.
      </p>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-destructive text-error sm:self-start">
            Excluir conta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>Excluir a sua conta?</DialogTitle>
              <DialogDescription>
                Tudo o que está ligado à conta será apagado de forma permanente: perfil, coleção,
                memorial e avaliações.
              </DialogDescription>
            </DialogHeader>
            <Field
              label={`Digite ${CONFIRMATION_WORD} para confirmar`}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            {deleteAccount.isError && <FormAlert>{getErrorMessage(deleteAccount.error)}</FormAlert>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteAccount.isPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <OfflineHint>
                <SubmitButton
                  variant="destructive"
                  loading={deleteAccount.isPending}
                  loadingLabel="Excluindo…"
                  disabled={!confirmed || !online}
                >
                  Excluir conta definitivamente
                </SubmitButton>
              </OfflineHint>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
