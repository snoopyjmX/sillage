import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';
import { Chip } from '@/components/ui/chip';
import { FAMILY_LABELS, POSITION_LABELS, POSITIONS, type NotePosition } from '@/constants/labels';
import { LAYER_DETAILS } from '@/constants/pyramid';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCount } from '@/lib/format';
import { springs, staggerDelay, transitions } from '@/lib/motion';
import { dominantFamilies, familyBreakdown, groupByLayer } from '@/lib/pyramid';
import { cn } from '@/lib/utils';
import type { PyramidNote } from '@/types/catalog';
import { FamilyBar } from './FamilyBar';
import { NoteSheet } from './NoteSheet';
import { PyramidShape } from './PyramidShape';

interface OlfactoryPyramidProps {
  notes: PyramidNote[];
}

// Showpiece da página de detalhes (docs/PRODUCT.md, Seção 9). Forma de pirâmide, acorde dominante e
// três camadas, cada uma um botão com aria-expanded (no celular só o Topo começa aberto; a partir
// de md, todas). Tocar numa nota abre o painel dela (descrição e link para o catálogo).
export function OlfactoryPyramid({ notes }: OlfactoryPyramidProps) {
  const isDesktop = useMediaQuery('(min-width: 48rem)');
  const reduceMotion = useReducedMotion() === true;
  const baseId = useId();
  const [open, setOpen] = useState<Record<NotePosition, boolean>>(() => ({
    top: true,
    heart: isDesktop,
    base: isDesktop,
  }));
  const [selected, setSelected] = useState<PyramidNote | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);

  const toggle = (position: NotePosition) =>
    setOpen((current) => ({ ...current, [position]: !current[position] }));

  const openNote = (note: PyramidNote, element: HTMLElement) => {
    trigger.current = element;
    setSelected(note);
    setSheetOpen(true);
  };

  // Radix só devolve o foco a um Trigger; o chip que abriu o painel recebe o foco de volta aqui
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    trigger.current?.focus();
  };

  const layers = groupByLayer(notes);
  const present = Object.fromEntries(
    POSITIONS.map((position) => [position, layers.some((layer) => layer.position === position)])
  ) as Record<NotePosition, boolean>;
  const dominant = dominantFamilies(notes);

  return (
    <div
      data-slot="olfactory-pyramid"
      className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8"
      role="group"
      aria-label="Pirâmide olfativa"
    >
      <PyramidShape
        present={present}
        open={open}
        className="mx-auto w-28 shrink-0 md:sticky md:top-24 md:mx-0 md:w-44"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {dominant.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Acorde dominante:{' '}
              <span className="font-medium text-foreground">
                {dominant.map((family) => FAMILY_LABELS[family]).join(' · ')}
              </span>
            </p>
            <FamilyBar shares={familyBreakdown(notes)} />
          </div>
        )}
        {layers.map(({ position, notes: layerNotes }) => {
          const label = POSITION_LABELS[position];
          const { timing, summary } = LAYER_DETAILS[position];
          const isOpen = open[position];
          const buttonId = `${baseId}-${position}-button`;
          const panelId = `${baseId}-${position}-panel`;

          return (
            <div
              key={position}
              data-position={position}
              className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card"
            >
              <h3 className="font-heading">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(position)}
                  className={cn(
                    'flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left outline-none',
                    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'
                  )}
                >
                  <span className="flex flex-col">
                    <span className="text-lg font-medium">{label}</span>
                    <span className="font-sans text-xs text-muted-foreground">
                      {timing} · {formatCount(layerNotes.length, 'nota', 'notas')}
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      'size-5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out motion-reduce:transition-none',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={reduceMotion ? { duration: 0 } : springs.modal}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
                      <p className="text-sm text-secondary-foreground">{summary}</p>
                      <FamilyBar shares={familyBreakdown(layerNotes)} delay={0.08} />
                      <ul className="flex flex-wrap gap-2">
                        {layerNotes.map((note, index) => (
                          <motion.li
                            key={note.slug}
                            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : { ...transitions.short, delay: staggerDelay(index) }
                            }
                          >
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              aria-label={`${note.name}: ver detalhes da nota (${label})`}
                              onClick={(event) => openNote(note, event.currentTarget)}
                              className={cn(
                                'relative inline-flex cursor-pointer rounded-full outline-none after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""]',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                              )}
                            >
                              <Chip family={note.family}>{note.name}</Chip>
                            </button>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <NoteSheet
        note={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCloseAutoFocus={restoreFocus}
      />
    </div>
  );
}
