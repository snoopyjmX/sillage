import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

// Chip removível de filtro ativo. O botão inteiro remove; o alvo de toque chega a 44 px.
export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remover filtro: ${label}`}
      className="relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border bg-secondary px-3 text-sm font-medium whitespace-nowrap text-secondary-foreground outline-none after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {label}
      <X className="size-4" aria-hidden />
    </button>
  );
}
