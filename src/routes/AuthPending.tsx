import { Skeleton } from '@/components/ui/skeleton';

// Enquanto a sessão inicial é lida: esqueleto equivalente a um cartão de formulário.
export function AuthPending() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Verificando sua sessão"
      className="mx-auto flex w-full max-w-md flex-col gap-4 pt-8"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
