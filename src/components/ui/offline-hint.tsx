// Origem: própria. Envolve uma ação de escrita: offline, o botão filho já vem desabilitado (quem
// usa passa `disabled`) e o wrapper, focável, mostra um tooltip explicando o motivo. Online, não
// renderiza nada além do filho.
import type { ReactNode } from 'react';
import { OFFLINE_ACTION_HINT } from '@/constants/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface OfflineHintProps {
  children: ReactNode;
  className?: string;
}

export function OfflineHint({ children, className }: OfflineHintProps) {
  const online = useOnlineStatus();
  if (online) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* O botão desabilitado não recebe foco nem ponteiro: o span carrega o tooltip */}
          <span
            tabIndex={0}
            aria-label={OFFLINE_ACTION_HINT}
            className={cn(
              'inline-flex rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              className
            )}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>{OFFLINE_ACTION_HINT}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
