// Ciclo de vida do PWA: registro do Service Worker (toast de atualização) e captura do evento
// `beforeinstallprompt`, que pode disparar antes de o React montar (por isso o ouvinte é global).
import { registerSW } from 'virtual:pwa-register';
import { toast } from '@/lib/toast';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const subscribeInstall = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getInstallEvent = (): BeforeInstallPromptEvent | null => deferred;
export const clearInstallEvent = (): void => {
  deferred = null;
  notify();
};

export const listenForInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', clearInstallEvent);
};

// Com `registerType: 'prompt'` a nova versão espera o aceite: nada recarrega no meio de uma ação.
export const registerServiceWorker = (): void => {
  const updateSW = registerSW({
    onNeedRefresh: () => {
      toast('Nova versão disponível', {
        duration: Infinity,
        action: { label: 'Atualizar', onClick: () => void updateSW(true) },
      });
    },
  });
};
