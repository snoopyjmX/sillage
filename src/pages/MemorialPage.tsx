import {
  ArrowLeft,
  CalendarDays,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Gift,
  Images,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { MemorialCalendar, MemorialCalendarSkeleton } from '@/components/daily/MemorialCalendar';
import { MemorialLine, MemorialLineSkeleton } from '@/components/daily/MemorialLine';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getErrorMessage } from '@/constants/errors';
import { useDailyRange } from '@/hooks/useDailyRange';
import { useProfileTimezone } from '@/hooks/useProfileTimezone';
import { MIN_MONTH, monthBounds, monthOf, resolveMonth, shiftMonth } from '@/lib/calendar';
import { formatCount, formatMonthYear } from '@/lib/format';
import { yearOf } from '@/lib/recap';
import { DEFAULT_TIMEZONE, todayInTimezone } from '@/lib/timezone';

type MemorialView = 'calendario' | 'varal';

const isView = (value: string): value is MemorialView =>
  value === 'calendario' || value === 'varal';

// Rota privada (RequireAuth). Calendário mensal do Perfume do Dia: cada dia com a miniatura do
// perfume e o link para ele. O mês vem da URL (`?mes=AAAA-MM`), validado: inválido ou futuro volta
// para o mês de hoje. A visão (`?vista=varal`) alterna o calendário e o varal de fotos; as duas
// mostram o mesmo mês. As datas já são civis no fuso do perfil, sem conversão.
export default function MemorialPage() {
  const [params, setParams] = useSearchParams();
  const timezone = useProfileTimezone();
  // Sem o fuso não há "hoje": espera. Fuso inválido ou consulta com falha cai no padrão.
  const today = timezone.isPending ? null : todayInTimezone(timezone.data ?? DEFAULT_TIMEZONE);
  const ready = today !== null;
  const month = resolveMonth(params.get('mes'), today ?? '9999-12-31');
  const { from, to } = monthBounds(month);
  const range = useDailyRange(from, to, ready);

  const currentMonth = today === null ? month : monthOf(today);
  const isCurrent = month >= currentMonth;
  const entries = range.data ?? [];
  const label = formatMonthYear(from);
  const viewParam = params.get('vista') ?? '';
  const view: MemorialView = isView(viewParam) ? viewParam : 'calendario';
  // Trocar o mês mantém a visão, e trocar a visão mantém o mês
  const goTo = (next: string) => {
    const merged = new URLSearchParams(params);
    merged.set('mes', next);
    setParams(merged);
  };
  const handleViewChange = (value: string) => {
    if (!isView(value)) return;
    const merged = new URLSearchParams(params);
    if (value === 'calendario') merged.delete('vista');
    else merged.set('vista', value);
    setParams(merged, { replace: true });
  };

  return (
    <>
      <SeoHead title="Memorial" description="Os perfumes que você escolheu, dia a dia." />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4 md:pt-8">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-medium text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao início
        </Link>

        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-medium md:text-4xl">Memorial</h1>
          <p className="text-sm text-muted-foreground">Os perfumes que você escolheu, dia a dia.</p>
          {today !== null && (
            <Link
              to={`/recap/${yearOf(today)}`}
              className="mt-2 inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-medium text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Gift className="size-4" aria-hidden />
              Seu ano em perfumes
            </Link>
          )}
        </header>

        <nav aria-label="Mês" className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mês anterior"
            disabled={!ready || month <= MIN_MONTH}
            onClick={() => goTo(shiftMonth(month, -1))}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <div className="flex flex-col items-center gap-1">
            {ready ? (
              <h2
                aria-live="polite"
                className="font-heading text-xl font-medium first-letter:uppercase"
              >
                {label}
              </h2>
            ) : (
              <Skeleton className="h-7 w-40" />
            )}
            {ready && !isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={() => goTo(currentMonth)}
              >
                Ir para este mês
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo mês"
            disabled={!ready || isCurrent}
            onClick={() => goTo(shiftMonth(month, 1))}
          >
            <ChevronRight aria-hidden />
          </Button>
        </nav>

        <Tabs value={view} onValueChange={handleViewChange} className="gap-4">
          <TabsList aria-label="Visão do memorial" className="sm:max-w-sm">
            <TabsTrigger value="calendario">
              <CalendarDays aria-hidden />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="varal">
              <Images aria-hidden />
              Varal de memórias
            </TabsTrigger>
          </TabsList>

          {(['calendario', 'varal'] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              <AsyncBoundary
                status={ready ? range.status : 'pending'}
                loading={tab === 'varal' ? <MemorialLineSkeleton /> : <MemorialCalendarSkeleton />}
                onRetry={() => void range.refetch()}
                errorTitle={
                  tab === 'varal'
                    ? 'Não foi possível carregar o varal'
                    : 'Não foi possível carregar o calendário'
                }
                errorDescription={getErrorMessage(range.error)}
                offlineDescription={
                  tab === 'varal'
                    ? 'Conecte-se à internet para ver o varal do memorial.'
                    : 'Conecte-se à internet para ver o calendário do memorial.'
                }
              >
                {today !== null && (
                  <div className="flex flex-col gap-4">
                    {tab === 'calendario' && (
                      <MemorialCalendar month={month} today={today} entries={entries} />
                    )}
                    {tab === 'varal' && entries.length > 0 && (
                      <MemorialLine entries={entries} monthLabel={label} />
                    )}
                    {entries.length === 0 ? (
                      <EmptyState
                        icon={CalendarHeart}
                        title="Nenhum perfume neste mês"
                        description="Os dias em que você veste um perfume aparecem aqui."
                        action={
                          <Button asChild variant="outline">
                            <Link to="/catalog">Explorar o catálogo</Link>
                          </Button>
                        }
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {formatCount(entries.length, 'dia registrado', 'dias registrados')} em{' '}
                        {label}.
                      </p>
                    )}
                  </div>
                )}
              </AsyncBoundary>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
