import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chip } from '@/components/ui/chip';
import { POSITION_LABELS, POSITIONS, type NotePosition } from '@/constants/labels';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { springs, staggerDelay, transitions } from '@/lib/motion';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PyramidNote } from '@/types/catalog';

// Larguras crescentes sugerem a pirâmide (classes inteiras, o Tailwind precisa vê-las).
// No celular a diferença é menor, para sobrar espaço aos chips.
const LAYER_WIDTH: Record<NotePosition, string> = {
  top: 'w-4/5 md:w-3/5',
  heart: 'w-9/10 md:w-4/5',
  base: 'w-full',
};

const catalogHref = (note: PyramidNote) =>
  `/catalog?${new URLSearchParams({ notes: note.slug, pos: note.position }).toString()}`;

interface OlfactoryPyramidProps {
  notes: PyramidNote[];
}

// Showpiece da página de detalhes (docs/PRODUCT.md, Seção 9). Cada camada é um botão com
// aria-expanded: no celular só o Topo começa aberto; a partir de md, todas.
export function OlfactoryPyramid({ notes }: OlfactoryPyramidProps) {
  const isDesktop = useMediaQuery('(min-width: 48rem)');
  const reduceMotion = useReducedMotion() === true;
  const baseId = useId();
  const [open, setOpen] = useState<Record<NotePosition, boolean>>(() => ({
    top: true,
    heart: isDesktop,
    base: isDesktop,
  }));

  const toggle = (position: NotePosition) =>
    setOpen((current) => ({ ...current, [position]: !current[position] }));

  // Camadas sem nota não aparecem (a pirâmide pode estar incompleta no catálogo)
  const layers = POSITIONS.map((position) => ({
    position,
    notes: notes.filter((note) => note.position === position),
  })).filter((layer) => layer.notes.length > 0);

  return (
    <div
      data-slot="olfactory-pyramid"
      className="flex flex-col items-center gap-2"
      role="group"
      aria-label="Pirâmide olfativa"
    >
      {layers.map(({ position, notes: layerNotes }) => {
        const label = POSITION_LABELS[position];
        const isOpen = open[position];
        const buttonId = `${baseId}-${position}-button`;
        const panelId = `${baseId}-${position}-panel`;

        return (
          <div
            key={position}
            data-position={position}
            className={cn(
              'overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card',
              LAYER_WIDTH[position]
            )}
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
                    {formatCount(layerNotes.length, 'nota', 'notas')}
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
                  <ul className="flex flex-wrap gap-2 px-4 pt-1 pb-4">
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
                        <Link
                          to={catalogHref(note)}
                          aria-label={`${note.name}: ver perfumes com esta nota (${label})`}
                          className={cn(
                            'relative inline-flex rounded-full outline-none after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""]',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                          )}
                        >
                          <Chip family={note.family}>{note.name}</Chip>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
