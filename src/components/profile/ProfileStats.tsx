import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInteger } from '@/lib/format';

interface StatCardProps {
  label: string;
  // Destino do atalho: o cartão inteiro é o link
  to: string;
  value: number;
  hint: string;
}

const StatCard = ({ label, to, value, hint }: StatCardProps) => (
  <div>
    <Link
      to={to}
      className="block h-full rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card className="h-full gap-1 p-4 shadow-subtle transition-colors hover:bg-accent">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="flex flex-col gap-1">
          <span className="font-heading text-3xl leading-tight font-medium text-foreground">
            {formatInteger(value)}
          </span>
          <span className="text-sm text-muted-foreground">{hint}</span>
        </dd>
      </Card>
    </Link>
  </div>
);

export function ProfileStatsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o resumo"
      className="grid gap-3 sm:grid-cols-3"
    >
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

interface ProfileStatsProps {
  owned: number;
  wanted: number;
  memorialDays: number;
}

// Cartões de resumo: números reais da coleção e do memorial, cada um como atalho para a tela
// correspondente. Só apresenta.
export function ProfileStats({ owned, wanted, memorialDays }: ProfileStatsProps) {
  return (
    <dl aria-label="Resumo" className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="Tenho"
        to="/collection"
        value={owned}
        hint={owned === 1 ? 'perfume' : 'perfumes'}
      />
      <StatCard
        label="Quero"
        to="/collection?tab=wanted"
        value={wanted}
        hint={wanted === 1 ? 'perfume' : 'perfumes'}
      />
      <StatCard
        label="No memorial"
        to="/memorial"
        value={memorialDays}
        hint={memorialDays === 1 ? 'dia registrado' : 'dias registrados'}
      />
    </dl>
  );
}
