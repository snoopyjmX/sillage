import { Button } from '@/components/ui/button';
import {
  CONCENTRATION_LABELS,
  FAMILY_LABELS,
  GENDER_LABELS,
  POSITION_LABELS,
} from '@/constants/labels';
import type { CatalogFilters } from '@/schemas/catalogSearch';
import type { BrandOption, NoteOption } from '@/types/catalog';
import { FilterChip } from './FilterChip';

interface ActiveFiltersProps {
  filters: CatalogFilters;
  brands: BrandOption[];
  notes: NoteOption[];
  onToggleBrand: (slug: string) => void;
  onToggleNote: (slug: string) => void;
  onToggleFamily: (family: CatalogFilters['families'][number]) => void;
  onToggleConcentration: (value: CatalogFilters['concentrations'][number]) => void;
  onToggleGender: (value: CatalogFilters['genders'][number]) => void;
  onClearPosition: () => void;
  onClearYears: () => void;
  onClear: () => void;
}

// Filtros ativos como chips removíveis + "Limpar filtros". Some quando não há nenhum.
export function ActiveFilters({
  filters,
  brands,
  notes,
  onToggleBrand,
  onToggleNote,
  onToggleFamily,
  onToggleConcentration,
  onToggleGender,
  onClearPosition,
  onClearYears,
  onClear,
}: ActiveFiltersProps) {
  const brandName = (slug: string) => brands.find((brand) => brand.slug === slug)?.name ?? slug;
  const noteName = (slug: string) => notes.find((note) => note.slug === slug)?.name ?? slug;

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.brands.map((slug) => ({
      key: `brand-${slug}`,
      label: brandName(slug),
      onRemove: () => onToggleBrand(slug),
    })),
    ...filters.notes.map((slug) => ({
      key: `note-${slug}`,
      label: `Nota: ${noteName(slug)}`,
      onRemove: () => onToggleNote(slug),
    })),
    ...(filters.pos
      ? [
          {
            key: 'pos',
            label: `Posição: ${POSITION_LABELS[filters.pos]}`,
            onRemove: onClearPosition,
          },
        ]
      : []),
    ...filters.families.map((family) => ({
      key: `family-${family}`,
      label: FAMILY_LABELS[family],
      onRemove: () => onToggleFamily(family),
    })),
    ...filters.concentrations.map((value) => ({
      key: `conc-${value}`,
      label: CONCENTRATION_LABELS[value],
      onRemove: () => onToggleConcentration(value),
    })),
    ...filters.genders.map((value) => ({
      key: `gender-${value}`,
      label: GENDER_LABELS[value],
      onRemove: () => onToggleGender(value),
    })),
    ...(filters.yearMin !== null || filters.yearMax !== null
      ? [
          {
            key: 'years',
            label: `Ano: ${filters.yearMin ?? '…'} a ${filters.yearMax ?? '…'}`,
            onRemove: onClearYears,
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div aria-label="Filtros ativos" role="group" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <Button variant="link" size="sm" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  );
}
