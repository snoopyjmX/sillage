// Origem: própria. Medidor somente leitura (role="meter"): trilho + preenchimento por transform
// (scaleX), sem animação. Texto de valor e rótulo vêm de quem usa; não só cor transmite o valor.
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  primary: 'bg-primary',
  error: 'bg-error',
  warning: 'bg-warning',
  success: 'bg-success',
} as const;

interface MeterProps {
  /** Nome acessível, ex.: "Rastro" */
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Texto legível do valor, ex.: "Moderado" ou "87%" */
  valueText: string;
  /** Cor do preenchimento; o valor continua em texto, a cor não é o único sinal. */
  tone?: keyof typeof TONE_CLASS;
  className?: string;
}

export function Meter({
  label,
  value,
  min = 0,
  max = 100,
  valueText,
  tone = 'primary',
  className,
}: MeterProps) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <div data-slot="meter" className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{valueText}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full origin-left rounded-full', TONE_CLASS[tone])}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}
