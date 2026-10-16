import { motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';
import { Chip } from '@/components/ui/chip';
import { FAMILY_LABELS, POSITION_LABELS, POSITIONS, type NotePosition } from '@/constants/labels';
import { LAYER_DETAILS } from '@/constants/pyramid';
import { formatCount } from '@/lib/format';
import { staggerDelay, transitions } from '@/lib/motion';
import { dominantFamilies, familyBreakdown, groupByLayer } from '@/lib/pyramid';
import { cn } from '@/lib/utils';
import type { PyramidNote } from '@/types/catalog';
import { FamilyBar } from './FamilyBar';
import { NoteSheet } from './NoteSheet';
import { PyramidShape } from './PyramidShape';

interface OlfactoryPyramidProps {
  notes: PyramidNote[];
}

// Showpiece da página de detalhes (docs/PRODUCT.md, Seção 9). Pirâmide grande com o nome de cada
// camada na faixa e, ao lado (abaixo no celular), o acorde dominante e as três camadas sempre
// abertas. Tocar numa nota abre o painel dela (descrição e link para o catálogo). Passar o mouse
// ou focar uma camada realça a faixa correspondente, e vice-versa.
export function OlfactoryPyramid({ notes }: OlfactoryPyramidProps) {
  const reduceMotion = useReducedMotion() === true;
  const baseId = useId();
  const [active, setActive] = useState<NotePosition | null>(null);
  const [selected, setSelected] = useState<PyramidNote | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);

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
  const families = Object.fromEntries(
    POSITIONS.map((position) => [
      position,
      notes.filter((note) => note.position === position).map((note) => note.family),
    ])
  ) as Parameters<typeof PyramidShape>[0]['families'];
  const dominant = dominantFamilies(notes);

  return (
    <div
      data-slot="olfactory-pyramid"
      className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8"
      role="group"
      aria-label="Pirâmide olfativa"
    >
      <PyramidShape
        families={families}
        active={active}
        onActiveChange={setActive}
        className="mx-auto max-w-sm shrink-0 md:sticky md:top-24 md:mx-0 md:w-2/5 md:max-w-none"
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
            <FamilyBar shares={familyBreakdown(notes)} linkFamilies />
          </div>
        )}
        {layers.map(({ position, notes: layerNotes }) => {
          const label = POSITION_LABELS[position];
          const { timing, summary } = LAYER_DETAILS[position];
          const titleId = `${baseId}-${position}-title`;

          return (
            <section
              key={position}
              data-position={position}
              aria-labelledby={titleId}
              onMouseEnter={() => setActive(position)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(position)}
              onBlur={() => setActive(null)}
              className={cn(
                'flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-card',
                'transition-colors duration-150 ease-out motion-reduce:transition-none',
                active === position && 'border-primary'
              )}
            >
              <div className="flex flex-col">
                <h3 id={titleId} className="font-heading text-lg font-medium">
                  {label}
                </h3>
                <p className="font-sans text-xs text-muted-foreground">
                  {timing} · {formatCount(layerNotes.length, 'nota', 'notas')}
                </p>
              </div>
              <p className="text-sm text-secondary-foreground">{summary}</p>
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
            </section>
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
