import { Link } from 'react-router-dom';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { Skeleton } from '@/components/ui/skeleton';
import { WEEKDAYS } from '@/constants/calendar';
import { dayNumber, monthGrid } from '@/lib/calendar';
import { formatCivilDate, formatMonthYear } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DailyEntry } from '@/types/daily';

const CELL = 'relative aspect-square overflow-hidden rounded-lg';

interface MemorialCalendarProps {
  // Mês civil AAAA-MM
  month: string;
  // Hoje (AAAA-MM-DD, no fuso do perfil): ganha o destaque
  today: string;
  entries: readonly DailyEntry[];
}

function DayNumber({ date }: { date: string }) {
  return (
    <span
      aria-hidden
      className="absolute top-0.5 left-0.5 z-10 rounded-md bg-background/80 px-1 text-xs leading-tight font-medium tabular-nums text-foreground"
    >
      {dayNumber(date)}
    </span>
  );
}

// Grade mensal do memorial: cada dia com perfume mostra a miniatura e leva ao perfume. A tabela
// tem legenda e cabeçalhos de coluna; a cor nunca é a única informação (o dia de hoje também vem
// no rótulo). Só apresenta: tudo chega pronto por props.
export function MemorialCalendar({ month, today, entries }: MemorialCalendarProps) {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const monthLabel = formatMonthYear(`${month}-01`);

  return (
    <table className="w-full table-fixed border-separate border-spacing-0.5">
      <caption className="sr-only">Perfumes do mês de {monthLabel}</caption>
      <thead>
        <tr>
          {WEEKDAYS.map(({ short, full }) => (
            <th
              key={short}
              scope="col"
              abbr={full}
              className="pb-1 text-xs font-medium text-text-secondary uppercase"
            >
              {short}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {monthGrid(month).map((week) => (
          <tr key={week.find((date) => date !== null) ?? 'empty'}>
            {week.map((date, index) => {
              if (date === null) return <td key={`blank-${index}`} aria-hidden className="p-0" />;
              const entry = byDate.get(date);
              const isToday = date === today;
              const label = `${formatCivilDate(date)}${isToday ? ' (hoje)' : ''}`;
              return (
                <td key={date} className="p-0">
                  {entry ? (
                    <Link
                      to={`/perfumes/${entry.perfume.slug}`}
                      aria-label={`${label}: ${entry.perfume.name}, ${entry.perfume.brandName}`}
                      className={cn(
                        CELL,
                        'block bg-stage outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        isToday && 'ring-2 ring-primary'
                      )}
                    >
                      <DayNumber date={date} />
                      <PerfumeImage
                        key={entry.perfume.imageUrl}
                        url={entry.perfume.imageUrl}
                        variant="thumb"
                        alt=""
                        width={80}
                        height={80}
                        className="size-full object-contain p-1"
                        fallback={
                          <PerfumePlaceholder
                            family={entry.perfume.families[0]}
                            className="size-full"
                          />
                        }
                      />
                    </Link>
                  ) : (
                    <div className={cn(CELL, 'bg-muted/50', isToday && 'ring-2 ring-primary')}>
                      <DayNumber date={date} />
                      <span className="sr-only">{label}: sem perfume</span>
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Mesmo tamanho da grade (6 semanas de 7 dias), para não deslocar a tela
export function MemorialCalendarSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o calendário"
      className="grid grid-cols-7 gap-0.5"
    >
      {Array.from({ length: 42 }, (_, index) => (
        <Skeleton key={index} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}
