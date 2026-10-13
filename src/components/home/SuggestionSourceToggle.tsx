import { Compass, Library, type LucideIcon } from 'lucide-react';
import { HOME_SOURCE_OPTIONS } from '@/lib/homeSource';
import type { HomeSource } from '@/lib/closetSuggestion';
import { cn } from '@/lib/utils';

const ICONS: Record<HomeSource, LucideIcon> = { catalog: Compass, closet: Library };

interface SuggestionSourceToggleProps {
  value: HomeSource;
  onChange: (value: HomeSource) => void;
}

// De onde vem a sugestão do dia: do catálogo todo ou só do "Tenho". Dois botões em pílula com
// aria-pressed (o mesmo padrão dos filtros da Home); alvo de 44 px.
export function SuggestionSourceToggle({ value, onChange }: SuggestionSourceToggleProps) {
  return (
    <div
      role="group"
      aria-label="Origem da sugestão"
      className="inline-flex gap-1 rounded-full border bg-secondary p-1"
    >
      {HOME_SOURCE_OPTIONS.map((option) => {
        const Icon = ICONS[option.value];
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium outline-none',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
              selected
                ? 'bg-primary text-primary-foreground shadow-subtle'
                : 'text-secondary-foreground hover:bg-accent'
            )}
          >
            <Icon className="size-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
