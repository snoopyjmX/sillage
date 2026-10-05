// Origem: própria. Grupo de rádios (role="radiogroup"/"radio") com tabulação roving:
// setas movem e selecionam, Home/End vão ao primeiro/último. Alvo de toque de 44x44px.
// Sem lógica de negócio: o valor sobe por onValueChange.
import { Star } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { formatDecimal } from '@/lib/format';
import { cn } from '@/lib/utils';

interface RatingBase {
  /** Nome acessível do grupo, ex.: "Fixação" */
  label: string;
  max?: number;
  showValue?: boolean;
  className?: string;
}

interface RatingInput extends RatingBase {
  readOnly?: false;
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
}

interface RatingDisplay extends RatingBase {
  readOnly: true;
  /** Pode ser decimal (média) */
  value: number;
}

type RatingProps = RatingInput | RatingDisplay;

const starLabel = (n: number): string => `${n} ${n === 1 ? 'estrela' : 'estrelas'}`;

function RatingReadOnly({ label, value, max = 5, showValue, className }: RatingDisplay) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const stars = Array.from({ length: max }, (_, i) => i);
  return (
    <span
      role="img"
      aria-label={`${label}: ${formatDecimal(value)} de ${max}`}
      data-slot="rating"
      className={cn('inline-flex items-center gap-2', className)}
    >
      <span className="relative inline-flex" aria-hidden>
        <span className="inline-flex text-muted-foreground">
          {stars.map((i) => (
            <Star key={i} className="size-4" />
          ))}
        </span>
        <span
          className="absolute inset-y-0 left-0 inline-flex overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          {stars.map((i) => (
            <Star key={i} className="size-4 shrink-0 fill-primary text-primary" />
          ))}
        </span>
      </span>
      {showValue && (
        <span aria-hidden className="text-sm tabular-nums">
          {formatDecimal(value)}
        </span>
      )}
    </span>
  );
}

function RatingRadios({
  label,
  max = 5,
  showValue,
  className,
  value,
  defaultValue = null,
  onValueChange,
  disabled = false,
}: RatingInput) {
  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
  });
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusable = current ?? 1;

  const select = (n: number) => {
    setCurrent(n);
    refs.current[n - 1]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, n: number) => {
    if (disabled) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = n === max ? 1 : n + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = n === 1 ? max : n - 1;
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(next);
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)} data-slot="rating">
      <div
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
        className="inline-flex"
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            ref={(node) => {
              refs.current[n - 1] = node;
            }}
            type="button"
            role="radio"
            aria-checked={n === current}
            aria-label={starLabel(n)}
            disabled={disabled}
            tabIndex={n === focusable ? 0 : -1}
            onClick={() => select(n)}
            onKeyDown={(event) => onKeyDown(event, n)}
            className="grid size-11 place-items-center rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          >
            <Star
              aria-hidden
              className={cn(
                'size-6',
                current !== null && n <= current
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>
      {showValue && current !== null && (
        <span aria-hidden className="min-w-8 text-sm tabular-nums">
          {formatDecimal(current)}
        </span>
      )}
    </div>
  );
}

export function Rating(props: RatingProps) {
  return props.readOnly ? <RatingReadOnly {...props} /> : <RatingRadios {...props} />;
}
