import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { UserReview } from '@/types/review';
import { ReviewForm } from './ReviewForm';

interface ReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfume: { id: string; name: string };
  existing: UserReview | null;
}

// Desktop (≥ 768 px): Dialog centralizado. Celular: bottom-sheet (Drawer, arrasta pela alça para fechar).
// Só um dos dois existe no DOM por vez (evita ids e campos duplicados).
export function ReviewSheet({ open, onOpenChange, perfume, existing }: ReviewSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 48rem)');
  const title = existing ? 'Editar avaliação' : 'Avaliar fragrância';
  const description = `${perfume.name}: fixação e projeção de 1 a 5, e um comentário opcional.`;
  const close = () => onOpenChange(false);
  const form = <ReviewForm perfumeId={perfume.id} existing={existing} onDone={close} />;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {form}
      </DrawerContent>
    </Drawer>
  );
}
