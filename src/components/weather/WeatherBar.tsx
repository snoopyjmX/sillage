import { CloudOff, Droplets, LocateFixed, MapPin, RotateCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { FAMILY_LABELS } from '@/constants/labels';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatInteger } from '@/lib/format';
import type { GeolocationStatus, WeatherView } from '@/types/weather';

interface LocationControls {
  supported: boolean;
  status: GeolocationStatus;
  error: string | null;
  // Coordenadas do aparelho em uso (em vez da cidade do perfil)
  active: boolean;
  request: () => void;
  clear: () => void;
}

interface WeatherBarProps {
  view: WeatherView;
  location: LocationControls;
  onRetry: () => void;
}

function LocationButton({ location }: { location: LocationControls }) {
  if (!location.supported) return null;
  if (location.active) {
    return (
      <Button variant="ghost" size="sm" onClick={location.clear}>
        <MapPin aria-hidden />
        Voltar à minha cidade
      </Button>
    );
  }
  const requesting = location.status === 'requesting';
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={location.request}
      aria-disabled={requesting}
      aria-busy={requesting}
    >
      <LocateFixed aria-hidden />
      {requesting ? 'Localizando…' : 'Usar minha localização'}
    </Button>
  );
}

const SHELL =
  'flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card px-4 py-3 text-card-foreground shadow-subtle';

// Barra de clima no topo da Home. Só apresenta: tudo chega pronto por props.
export function WeatherBar({ view, location, onRetry }: WeatherBarProps) {
  const online = useOnlineStatus();

  if (view.status === 'loading') {
    return (
      <div role="status" aria-busy="true" aria-label="Carregando o clima" className={SHELL}>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-56" />
      </div>
    );
  }

  if (view.status !== 'ready') {
    const offline = !online;
    const Icon = offline ? WifiOff : CloudOff;
    const title = offline ? 'Você está offline' : 'Clima indisponível';
    const detail =
      view.status === 'error'
        ? view.message
        : offline
          ? 'Conecte-se à internet para ver o clima.'
          : 'Não encontramos o clima da sua cidade.';
    return (
      <section aria-label="Clima de hoje" className={SHELL}>
        <p className="flex items-center gap-2 text-sm">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground">{detail}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
          {view.status === 'error' && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              <RotateCw aria-hidden />
              Tentar novamente
            </Button>
          )}
          <LocationButton location={location} />
        </div>
        {location.error && (
          <p role="alert" className="basis-full text-sm text-error">
            {location.error}
          </p>
        )}
      </section>
    );
  }

  const { weather, location: place, description, phrase, families } = view;
  return (
    <section aria-label="Clima de hoje" className={SHELL}>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="size-4 text-primary" aria-hidden />
        {place.label}
      </p>
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-3xl leading-none font-medium">
          {formatInteger(Math.round(weather.temperature))}°C
        </span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Droplets className="size-4" aria-hidden />
        Umidade {formatInteger(Math.round(weather.humidity))}%
      </p>
      <p className="text-sm text-text-secondary">{phrase}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Sillage ótima
        </span>
        <ul aria-label="Famílias em destaque hoje" className="flex flex-wrap gap-1.5">
          {families.map((family) => (
            <li key={family}>
              <Chip family={family}>{FAMILY_LABELS[family]}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div className="sm:ms-auto">
        <LocationButton location={location} />
      </div>
      {location.error && (
        <p role="alert" className="basis-full text-sm text-error">
          {location.error}
        </p>
      )}
    </section>
  );
}
