import { KeyRound, ScanFace, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { OfflineHint } from '@/components/ui/offline-hint';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage } from '@/constants/errors';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  useDeletePasskey,
  usePasskeySupport,
  usePasskeys,
  useRegisterPasskey,
} from '@/hooks/usePasskeys';
import { formatLongDate } from '@/lib/format';
import type { Passkey } from '@/types/passkey';

const DEFAULT_NAME = 'Chave de acesso';

const PasskeyListSkeleton = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Carregando os aparelhos cadastrados"
    className="flex flex-col gap-2"
  >
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
);

interface PasskeyItemProps {
  passkey: Passkey;
  onRemove: (passkey: Passkey) => void;
  disabled: boolean;
}

const PasskeyItem = ({ passkey, onRemove, disabled }: PasskeyItemProps) => {
  const name = passkey.name ?? DEFAULT_NAME;
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
        <KeyRound className="size-5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        <span className="text-sm text-text-secondary">
          Cadastrado em {formatLongDate(passkey.createdAt)}
          {passkey.lastUsedAt && ` · Último uso em ${formatLongDate(passkey.lastUsedAt)}`}
        </span>
      </div>
      <OfflineHint>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remover ${name}`}
          disabled={disabled}
          onClick={() => onRemove(passkey)}
        >
          <Trash2 aria-hidden />
        </Button>
      </OfflineHint>
    </li>
  );
};

// Login biométrico no Perfil: lista as passkeys da conta, cadastra este aparelho e revoga as
// antigas. Sem suporte no navegador, não há botão de cadastro (as existentes ainda podem sair).
export function PasskeyManager() {
  const online = useOnlineStatus();
  const supported = usePasskeySupport();
  const passkeys = usePasskeys();
  const registerPasskey = useRegisterPasskey();
  const deletePasskey = useDeletePasskey();
  const [removing, setRemoving] = useState<Passkey | null>(null);

  const list = passkeys.data ?? [];

  const handleOpenChange = (open: boolean) => {
    // Não fecha no meio da remoção
    if (!open && !deletePasskey.isPending) setRemoving(null);
  };

  const handleConfirmRemove = () => {
    if (!removing || !online) return;
    deletePasskey.mutate(removing.id, { onSuccess: () => setRemoving(null) });
  };

  return (
    <section aria-labelledby="passkeys-title" className="flex flex-col gap-3">
      <h2 id="passkeys-title" className="flex items-center gap-2 font-heading text-xl font-medium">
        <ScanFace className="size-5 text-primary" aria-hidden />
        Login biométrico (Face ID / Digital)
      </h2>
      <p className="text-sm text-text-secondary">
        Entre com o desbloqueio do aparelho, sem digitar a senha. A biometria nunca sai do seu
        aparelho.
      </p>

      <AsyncBoundary
        status={passkeys.status}
        isEmpty={list.length === 0}
        loading={<PasskeyListSkeleton />}
        empty={
          <EmptyState
            icon={KeyRound}
            title="Nenhum aparelho cadastrado"
            description={
              supported === false
                ? 'Este dispositivo ou navegador não suporta biometria. Use um aparelho compatível para cadastrar.'
                : 'Cadastre este aparelho para entrar com Face ID, digital ou Windows Hello.'
            }
          />
        }
        onRetry={() => void passkeys.refetch()}
        errorTitle="Não foi possível carregar os aparelhos"
        errorDescription={passkeys.error ? getErrorMessage(passkeys.error) : undefined}
        offlineDescription="Conecte-se à internet para ver os aparelhos cadastrados."
      >
        <ul className="flex flex-col gap-2" aria-label="Aparelhos cadastrados">
          {list.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              passkey={passkey}
              onRemove={setRemoving}
              disabled={!online}
            />
          ))}
        </ul>
      </AsyncBoundary>

      {supported && (
        <OfflineHint className="sm:self-start">
          <SubmitButton
            variant="outline"
            loading={registerPasskey.isPending}
            loadingLabel="Aguardando a biometria…"
            disabled={!online}
            onClick={() => registerPasskey.mutate()}
          >
            <ScanFace aria-hidden />
            Cadastrar este aparelho
          </SubmitButton>
        </OfflineHint>
      )}

      <Dialog open={removing !== null} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover este aparelho?</DialogTitle>
            <DialogDescription>
              “{removing?.name ?? DEFAULT_NAME}” não poderá mais entrar com biometria. Você continua
              entrando com e-mail e senha e pode cadastrá-lo de novo quando quiser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deletePasskey.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <OfflineHint>
              <SubmitButton
                variant="destructive"
                loading={deletePasskey.isPending}
                loadingLabel="Removendo…"
                disabled={!online}
                onClick={handleConfirmRemove}
              >
                Remover aparelho
              </SubmitButton>
            </OfflineHint>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
