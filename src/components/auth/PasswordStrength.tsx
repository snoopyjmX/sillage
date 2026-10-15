// Medidor de força da senha nas telas de cadastro e redefinição. Textos em pt-BR vivem aqui.
import { Meter } from '@/components/ui/meter';
import { evaluatePassword, type PasswordLevel } from '@/lib/passwordStrength';

type RatedLevel = Exclude<PasswordLevel, 0>;

const LEVELS: Record<RatedLevel, { label: string; tone: 'error' | 'warning' | 'success' }> = {
  1: { label: 'Fraca', tone: 'error' },
  2: { label: 'Razoável', tone: 'warning' },
  3: { label: 'Boa', tone: 'success' },
  4: { label: 'Forte', tone: 'success' },
};

export function PasswordStrength({ value }: { value: string }) {
  const { level, weakPattern } = evaluatePassword(value);
  const rated = level === 0 ? null : LEVELS[level];

  return (
    <div className="flex flex-col gap-2">
      {rated && (
        <Meter
          label="Força da senha"
          min={0}
          max={4}
          value={level}
          valueText={rated.label}
          tone={rated.tone}
        />
      )}
      {weakPattern && (
        <p className="text-sm text-text-secondary">
          Evite sequências ou repetições, como 123456 ou aaaa.
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {rated ? `Força da senha: ${rated.label}` : ''}
      </p>
    </div>
  );
}
