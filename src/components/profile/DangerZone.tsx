import { TriangleAlert } from 'lucide-react';
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

// "Zona de perigo". A exclusão de conta (Edge Function com service_role) fica para uma fase
// própria: o dialog de confirmação já existe, mas a ação está desativada ("Em breve") e nada é chamado.
export function DangerZone() {
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
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-destructive text-error sm:self-start">
            Excluir conta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir a sua conta?</DialogTitle>
            <DialogDescription>
              Tudo o que está ligado à conta será apagado de forma permanente. A exclusão de conta
              ainda não está disponível: ela chega em uma próxima fase.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" disabled>
              Em breve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
