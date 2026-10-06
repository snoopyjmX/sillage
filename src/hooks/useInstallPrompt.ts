import { useCallback, useSyncExternalStore } from 'react';
import { clearInstallEvent, getInstallEvent, subscribeInstall } from '@/lib/pwa';

const isStandalone = (): boolean =>
  (typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches) ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iOS não tem `beforeinstallprompt`: a instalação é manual (Compartilhar → Adicionar à Tela de Início)
const isIos = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export type InstallMode = 'prompt' | 'ios' | null;

export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribeInstall, getInstallEvent, () => null);
  const installed = isStandalone();
  const mode: InstallMode = installed ? null : event ? 'prompt' : isIos() ? 'ios' : null;

  const install = useCallback(async () => {
    const current = getInstallEvent();
    if (!current) return;
    await current.prompt();
    await current.userChoice;
    // O evento só pode ser usado uma vez
    clearInstallEvent();
  }, []);

  return { mode, install };
}
