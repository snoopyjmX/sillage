import { useId } from 'react';
import { SORT_LABELS, type CatalogSortValue } from '@/constants/labels';
import { SORT_VALUES } from '@/schemas/catalogSearch';

interface SortSelectProps {
  value: CatalogSortValue;
  // "Relevância" só existe quando há texto de busca
  hasQuery: boolean;
  onChange: (sort: CatalogSortValue) => void;
}

export function SortSelect({ value, hasQuery, onChange }: SortSelectProps) {
  const id = useId();
  const options = SORT_VALUES.filter((sort) => sort !== 'relevance' || hasQuery);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-text-secondary">
        Ordenar por
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as CatalogSortValue)}
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        {options.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </select>
    </div>
  );
}
