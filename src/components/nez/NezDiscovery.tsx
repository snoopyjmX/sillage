import { ArrowLeft, Briefcase, Cloud, Dna, Moon, Snowflake, Sparkles, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SubmitButton } from '@/components/ui/submit-button';
import type { TempBand } from '@/constants/climate';
import { getErrorMessage } from '@/constants/errors';
import { FAMILIES, FAMILY_LABELS, type OlfactiveFamily } from '@/constants/labels';
import {
  NEZ_CLIMATES,
  NEZ_CLIMATE_LABELS,
  NEZ_MAX_FAMILIES,
  NEZ_OCCASIONS,
  NEZ_OCCASION_LABELS,
  type NezOccasion,
} from '@/constants/nez';
import { useNezDiscovery } from '@/hooks/useNez';
import { useWeather } from '@/hooks/useWeather';
import { temperatureBand } from '@/lib/climate';
import { cn } from '@/lib/utils';
import { NezDiscoveryLoading, NezDiscoveryResult } from './NezDiscoveryResult';

const CLIMATE_ICONS: Record<TempBand, LucideIcon> = { cold: Snowflake, mild: Cloud, hot: Sun };
const OCCASION_ICONS: Record<NezOccasion, LucideIcon> = {
  work: Briefcase,
  night: Moon,
  casual: Sun,
  special: Sparkles,
};

type Step = 'climate' | 'occasion' | 'taste';
const STEPS: Step[] = ['climate', 'occasion', 'taste'];
const STEP_TITLES: Record<Step, string> = {
  climate: 'Como está o clima?',
  occasion: 'Para qual momento?',
  taste: 'O que você gosta de sentir?',
};

interface ChoiceProps {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

// Opção única de um passo: botão de 44 px com ícone, anunciado como selecionado (aria-pressed)
function Choice({ icon: Icon, label, selected, onSelect }: ChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected && 'border-primary ring-2 ring-primary'
      )}
    >
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      {label}
    </button>
  );
}

interface NezDiscoveryProps {
  // Volta para a conversa
  onBack: () => void;
  // Fecha o drawer ao seguir para um perfume
  onNavigate: () => void;
}

// Trilha guiada do Nez: clima, ocasião e preferências, e então a curadoria com perfumes do catálogo.
// Só apresenta; a escolha dos perfumes é do servidor (banco + Gemini, conferido).
export function NezDiscovery({ onBack, onNavigate }: NezDiscoveryProps) {
  const weather = useWeather();
  const discovery = useNezDiscovery();
  const [stepIndex, setStepIndex] = useState(0);
  const [pickedClimate, setPickedClimate] = useState<TempBand | null>(null);
  const [occasion, setOccasion] = useState<NezOccasion | null>(null);
  const [families, setFamilies] = useState<OlfactiveFamily[]>([]);
  const [useDna, setUseDna] = useState(false);

  // Clima de agora, quando há previsão: já vem marcado, mas a pessoa pode trocar
  const autoClimate =
    weather.view.status === 'ready' ? temperatureBand(weather.view.weather.temperature) : null;
  const climate = pickedClimate ?? autoClimate;

  const step = STEPS[stepIndex] ?? 'climate';
  const canAdvance =
    step === 'climate' ? climate !== null : step === 'occasion' && occasion !== null;
  const canSubmit = climate !== null && occasion !== null && (families.length > 0 || useDna);

  const toggleFamily = (family: OlfactiveFamily) =>
    setFamilies((current) =>
      current.includes(family)
        ? current.filter((item) => item !== family)
        : // Passando do limite, a escolha mais antiga sai
          [...current, family].slice(-NEZ_MAX_FAMILIES)
    );

  const submit = () => {
    if (climate === null || occasion === null || !canSubmit || discovery.isPending) return;
    discovery.mutate({ climate, occasion, families, useDna });
  };

  const restart = () => {
    discovery.reset();
    setStepIndex(0);
  };

  if (discovery.status !== 'idle') {
    return (
      <AsyncBoundary
        status={
          discovery.status === 'success'
            ? 'success'
            : discovery.status === 'error'
              ? 'error'
              : 'pending'
        }
        loading={<NezDiscoveryLoading />}
        onRetry={submit}
        errorTitle="O Nez não respondeu"
        errorDescription={getErrorMessage(discovery.error)}
        offlineDescription="Conecte-se à internet para falar com o Nez."
      >
        {discovery.data && (
          <NezDiscoveryResult result={discovery.data} onRestart={restart} onNavigate={onNavigate} />
        )}
      </AsyncBoundary>
    );
  }

  return (
    <section aria-labelledby="nez-discovery-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wider text-text-secondary uppercase">
          Passo {stepIndex + 1} de {STEPS.length}
        </p>
        <h3 id="nez-discovery-title" className="font-heading text-xl font-medium">
          {STEP_TITLES[step]}
        </h3>
      </div>

      {step === 'climate' && (
        <div role="group" aria-labelledby="nez-discovery-title" className="flex flex-col gap-2">
          {NEZ_CLIMATES.map((band) => (
            <Choice
              key={band}
              icon={CLIMATE_ICONS[band]}
              label={NEZ_CLIMATE_LABELS[band]}
              selected={climate === band}
              onSelect={() => setPickedClimate(band)}
            />
          ))}
          {autoClimate !== null && pickedClimate === null && (
            <p className="text-sm text-text-secondary">
              Marcamos pelo clima de agora na sua cidade. Troque se preferir.
            </p>
          )}
        </div>
      )}

      {step === 'occasion' && (
        <div role="group" aria-labelledby="nez-discovery-title" className="flex flex-col gap-2">
          {NEZ_OCCASIONS.map((item) => (
            <Choice
              key={item}
              icon={OCCASION_ICONS[item]}
              label={NEZ_OCCASION_LABELS[item]}
              selected={occasion === item}
              onSelect={() => setOccasion(item)}
            />
          ))}
        </div>
      )}

      {step === 'taste' && (
        <div className="flex flex-col gap-4">
          <div
            role="group"
            aria-label={`Famílias olfativas, até ${NEZ_MAX_FAMILIES}`}
            className="flex flex-wrap gap-2"
          >
            {FAMILIES.map((family) => (
              <Chip
                key={family}
                family={family}
                selected={families.includes(family)}
                onClick={() => toggleFamily(family)}
              >
                {FAMILY_LABELS[family]}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            Escolha até {NEZ_MAX_FAMILIES}. Ao marcar mais uma, a mais antiga sai.
          </p>
          <Choice
            icon={Dna}
            label="Usar o meu DNA olfativo"
            selected={useDna}
            onSelect={() => setUseDna((current) => !current)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="ghost"
          onClick={stepIndex === 0 ? onBack : () => setStepIndex(stepIndex - 1)}
        >
          <ArrowLeft aria-hidden />
          {stepIndex === 0 ? 'Voltar à conversa' : 'Voltar'}
        </Button>
        {step === 'taste' ? (
          <SubmitButton
            loading={discovery.isPending}
            loadingLabel="Nez está escolhendo…"
            disabled={!canSubmit}
            onClick={submit}
          >
            Pedir a curadoria
          </SubmitButton>
        ) : (
          <Button disabled={!canAdvance} onClick={() => setStepIndex(stepIndex + 1)}>
            Continuar
          </Button>
        )}
      </div>
    </section>
  );
}
