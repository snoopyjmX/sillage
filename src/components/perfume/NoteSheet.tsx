import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
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
import { FAMILY_LABELS, POSITION_LABELS } from '@/constants/labels';
import { LAYER_DETAILS } from '@/constants/pyramid';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { noteCatalogHref } from '@/lib/pyramid';
import type { PyramidNote } from '@/types/catalog';

const NO_DESCRIPTION = 'Descrição em breve.';

interface NoteSheetProps {
  // Última nota escolhida: continua aqui depois de fechar, para o conteúdo não esvaziar na animação de saída
  note: PyramidNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Radix só devolve o foco sozinho a um Trigger; aqui o chip fica fora, então quem usa devolve
  onCloseAutoFocus?: (event: Event) => void;
}

function NoteBody({ note }: { note: PyramidNote }) {
  const layer = POSITION_LABELS[note.position];
  return (
    <div className="flex flex-col gap-4 px-4 pb-6 md:px-0 md:pb-0">
      <div>
        <Chip family={note.family}>{FAMILY_LABELS[note.family]}</Chip>
      </div>
      <p className="text-base text-secondary-foreground">{note.description ?? NO_DESCRIPTION}</p>
      <Button asChild variant="outline">
        <Link to={noteCatalogHref(note)}>
          Ver perfumes com {note.name} no {layer}
        </Link>
      </Button>
    </div>
  );
}

// Painel de uma nota da pirâmide. Desktop (≥ 768 px): Dialog centralizado; celular: bottom-sheet.
// Só um dos dois existe no DOM por vez (mesmo padrão do ReviewSheet).
export function NoteSheet({ note, open, onOpenChange, onCloseAutoFocus }: NoteSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 48rem)');
  const subtitle = note
    ? `${POSITION_LABELS[note.position]} · ${LAYER_DETAILS[note.position].timing}`
    : '';

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
          {note && (
            <>
              <DialogHeader>
                <DialogTitle>{note.name}</DialogTitle>
                <DialogDescription>{subtitle}</DialogDescription>
              </DialogHeader>
              <NoteBody note={note} />
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent onCloseAutoFocus={onCloseAutoFocus}>
        {note && (
          <>
            <DrawerHeader>
              <DrawerTitle>{note.name}</DrawerTitle>
              <DrawerDescription>{subtitle}</DrawerDescription>
            </DrawerHeader>
            <NoteBody note={note} />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
