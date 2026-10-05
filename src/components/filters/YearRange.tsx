import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MIN_YEAR, maxYear, parseYearInput } from '@/schemas/catalogSearch';

interface YearFieldProps {
  label: string;
  value: number | null;
  onCommit: (year: number | null) => void;
}

// Confirma ao sair do campo ou com Enter (não a cada tecla). Texto inválido volta ao valor atual.
function YearField({ label, value, onCommit }: YearFieldProps) {
  const id = useId();
  const [text, setText] = useState(value?.toString() ?? '');
  const [seen, setSeen] = useState(value);

  // A URL mudou por fora (chip removido, limpar filtros): o campo acompanha
  if (value !== seen) {
    setSeen(value);
    setText(value?.toString() ?? '');
  }

  const commit = () => {
    if (text.trim() === '') {
      if (value !== null) onCommit(null);
      return;
    }
    const year = parseYearInput(text);
    if (year === null) {
      setText(value?.toString() ?? '');
      return;
    }
    if (year !== value) onCommit(year);
  };

  return (
    <div className="flex flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-sm text-text-secondary">
        {label}
      </label>
      <Input
        id={id}
        value={text}
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder={label === 'De' ? String(MIN_YEAR) : String(maxYear())}
        onChange={(event) => setText(event.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
      />
    </div>
  );
}

interface YearRangeProps {
  yearMin: number | null;
  yearMax: number | null;
  onChange: (range: { yearMin?: number | null; yearMax?: number | null }) => void;
}

export function YearRange({ yearMin, yearMax, onChange }: YearRangeProps) {
  return (
    <div className="flex gap-3">
      <YearField label="De" value={yearMin} onCommit={(year) => onChange({ yearMin: year })} />
      <YearField label="Até" value={yearMax} onCommit={(year) => onChange({ yearMax: year })} />
    </div>
  );
}
