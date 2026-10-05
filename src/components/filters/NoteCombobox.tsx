// Combobox de seleção múltipla (padrão ARIA 1.2: input role=combobox + listbox).
// Setas movem, Enter marca/desmarca, Esc fecha a lista. A lista é absoluta (não empurra o layout):
// se fosse no fluxo, ao fechar no blur ela deslocaria o botão clicado entre o mouse-down e o mouse-up
// e o clique se perderia.
import { Check } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { FAMILY_LABELS } from '@/constants/labels';
import { cn } from '@/lib/utils';
import type { NoteOption } from '@/types/catalog';

const MAX_OPTIONS = 50;

// "Lírio" casa com "lirio": compara sem acento e sem caixa
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

interface NoteComboboxProps {
  notes: NoteOption[];
  selected: string[];
  onToggle: (slug: string) => void;
  label?: string;
}

export function NoteCombobox({ notes, selected, onToggle, label = 'Notas' }: NoteComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(() => {
    const term = fold(query.trim());
    return notes
      .filter((note) => term === '' || fold(note.name).includes(term))
      .slice(0, MAX_OPTIONS);
  }, [notes, query]);

  const activeOption = open ? options[Math.min(activeIndex, options.length - 1)] : undefined;
  const optionId = (slug: string) => `${id}-opt-${slug}`;

  const choose = (slug: string) => {
    onToggle(slug);
    setQuery('');
    // Fecha a lista (o foco fica no campo): ela cobriria os controles logo abaixo
    setOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-text-secondary">
        {label}
      </label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption ? optionId(activeOption.slug) : undefined}
        autoComplete="off"
        placeholder="Buscar nota (ex.: bergamota)"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, options.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && open && activeOption) {
            event.preventDefault();
            choose(activeOption.slug);
          } else if (event.key === 'Escape' && open) {
            setOpen(false);
          }
        }}
      />
      {open && options.length === 0 && (
        <p
          role="status"
          className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border bg-popover px-3 py-2 text-sm text-text-secondary shadow-floating"
        >
          Nenhuma nota encontrada
        </p>
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label={label}
        aria-multiselectable="true"
        hidden={!open || options.length === 0}
        className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-floating"
      >
        {options.map((note) => {
          const isSelected = selected.includes(note.slug);
          const isActive = note.slug === activeOption?.slug;
          return (
            <li
              key={note.slug}
              id={optionId(note.slug)}
              role="option"
              aria-selected={isSelected}
              // mousedown (e não click) com preventDefault: o campo não perde o foco ao escolher
              onMouseDown={(event) => {
                event.preventDefault();
                choose(note.slug);
              }}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-base',
                isActive && 'bg-accent'
              )}
            >
              <span>
                {note.name}{' '}
                <span className="text-sm text-text-secondary">({FAMILY_LABELS[note.family]})</span>
              </span>
              {isSelected && <Check className="size-4 text-primary" aria-hidden />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
