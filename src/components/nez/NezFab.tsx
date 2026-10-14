import { Sparkles } from 'lucide-react';
import { DrawerTrigger } from '@/components/ui/drawer';
import { OFFLINE_ACTION_HINT } from '@/constants/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Botão fixo do Nez: vidro fosco, pílula com ícone e rótulo. É o gatilho do drawer (dentro dele),
// então o Radix devolve o foco a ele ao fechar.
export function NezFab() {
  const online = useOnlineStatus();
  return (
    <DrawerTrigger
      // O Nez precisa da rede (Edge Function): offline fica desabilitado, mas focável e explicado
      aria-label="Abrir o Nez"
      aria-disabled={!online || undefined}
      title={online ? undefined : OFFLINE_ACTION_HINT}
      onClick={online ? undefined : (event) => event.preventDefault()}
      className={[
        'fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex size-12 items-center justify-center gap-2 rounded-full',
        'sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:w-auto sm:px-5',
        'border border-border bg-surface/80 text-foreground shadow-floating backdrop-blur-md',
        'font-medium outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
      ].join(' ')}
    >
      <Sparkles className="size-4 text-primary" aria-hidden />
      <span className="hidden sm:inline">Nez</span>
    </DrawerTrigger>
  );
}
