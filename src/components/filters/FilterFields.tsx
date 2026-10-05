import type { ReactNode } from 'react';
import { useId } from 'react';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CONCENTRATION_LABELS,
  CONCENTRATIONS,
  FAMILIES,
  FAMILY_LABELS,
  GENDER_LABELS,
  GENDERS,
  POSITION_LABELS,
  POSITIONS,
} from '@/constants/labels';
import { getErrorMessage } from '@/constants/errors';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { useBrands, useNotes } from '@/hooks/useReferenceData';
import { FilterChip } from './FilterChip';
import { NoteCombobox } from './NoteCombobox';
import { YearRange } from './YearRange';

type Catalog = ReturnType<typeof useCatalogFilters>;

interface FilterFieldsProps {
  filters: Catalog['filters'];
  update: Catalog['update'];
  toggle: Catalog['toggle'];
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="text-xs font-medium tracking-wider text-text-secondary uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

const chipRow = 'flex flex-wrap gap-2';

const ChipSkeletons = () => (
  <div className={chipRow}>
    <Skeleton className="h-8 w-20 rounded-full" />
    <Skeleton className="h-8 w-24 rounded-full" />
    <Skeleton className="h-8 w-16 rounded-full" />
  </div>
);

// Os campos de filtro são os mesmos no painel lateral (desktop) e na gaveta (celular).
// Cada mudança vai direto para a URL: não há botão "aplicar".
export function FilterFields({ filters, update, toggle }: FilterFieldsProps) {
  const brands = useBrands();
  const notes = useNotes();

  return (
    <div className="flex flex-col gap-6">
      <Group title="Marca">
        <AsyncBoundary
          status={brands.status}
          isEmpty={brands.data?.length === 0}
          loading={<ChipSkeletons />}
          empty={<p className="text-sm text-text-secondary">Nenhuma marca cadastrada.</p>}
          onRetry={() => void brands.refetch()}
          errorTitle="Marcas indisponíveis"
          errorDescription={getErrorMessage(brands.error)}
        >
          <div role="group" aria-label="Marca" className={chipRow}>
            {brands.data?.map((brand) => (
              <Chip
                key={brand.slug}
                selected={filters.brands.includes(brand.slug)}
                onClick={() => toggle('brands', brand.slug)}
              >
                {brand.name}
              </Chip>
            ))}
          </div>
        </AsyncBoundary>
      </Group>

      <Group title="Família olfativa">
        <div role="group" aria-label="Família olfativa" className={chipRow}>
          {FAMILIES.map((family) => (
            <Chip
              key={family}
              family={family}
              selected={filters.families.includes(family)}
              onClick={() => toggle('families', family)}
            >
              {FAMILY_LABELS[family]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Nota">
        <AsyncBoundary
          status={notes.status}
          isEmpty={notes.data?.length === 0}
          loading={<Skeleton className="h-11 w-full" />}
          empty={<p className="text-sm text-text-secondary">Nenhuma nota cadastrada.</p>}
          onRetry={() => void notes.refetch()}
          errorTitle="Notas indisponíveis"
          errorDescription={getErrorMessage(notes.error)}
        >
          <NoteCombobox
            label="Buscar nota"
            notes={notes.data ?? []}
            selected={filters.notes}
            onToggle={(slug) => toggle('notes', slug)}
          />
        </AsyncBoundary>
        {filters.notes.length > 0 && (
          <>
            <div role="group" aria-label="Notas escolhidas" className={chipRow}>
              {filters.notes.map((slug) => (
                <FilterChip
                  key={slug}
                  label={notes.data?.find((note) => note.slug === slug)?.name ?? slug}
                  onRemove={() => toggle('notes', slug)}
                />
              ))}
            </div>
            <p className="text-sm text-text-secondary">
              O perfume precisa ter todas as notas escolhidas.
            </p>
            <div role="group" aria-label="Posição da nota" className={chipRow}>
              <Chip selected={filters.pos === null} onClick={() => update({ pos: null })}>
                Qualquer posição
              </Chip>
              {POSITIONS.map((position) => (
                <Chip
                  key={position}
                  selected={filters.pos === position}
                  onClick={() => update({ pos: position })}
                >
                  {POSITION_LABELS[position]}
                </Chip>
              ))}
            </div>
          </>
        )}
      </Group>

      <Group title="Concentração">
        <div role="group" aria-label="Concentração" className={chipRow}>
          {CONCENTRATIONS.map((value) => (
            <Chip
              key={value}
              selected={filters.concentrations.includes(value)}
              onClick={() => toggle('concentrations', value)}
            >
              {CONCENTRATION_LABELS[value]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Gênero">
        <div role="group" aria-label="Gênero" className={chipRow}>
          {GENDERS.map((value) => (
            <Chip
              key={value}
              selected={filters.genders.includes(value)}
              onClick={() => toggle('genders', value)}
            >
              {GENDER_LABELS[value]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Ano de lançamento">
        <YearRange
          yearMin={filters.yearMin}
          yearMax={filters.yearMax}
          onChange={(range) => update(range)}
        />
      </Group>
    </div>
  );
}
