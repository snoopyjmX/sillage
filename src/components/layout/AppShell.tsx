import { lazy, Suspense, useSyncExternalStore, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { NezAssistant } from '@/components/nez/NezAssistant';
import { NezProvider } from '@/contexts/NezContext';
import {
  getCollectionDetailsTarget,
  subscribeCollectionDetails,
} from '@/lib/collectionDetailsStore';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { OfflineBanner } from './OfflineBanner';

// O diálogo "Detalhar formato" (Fase 17A) só carrega quando alguém o abre: fica fora do bundle da casca
const CollectionDetailsHost = lazy(async () => ({
  default: (await import('@/components/collection/CollectionDetailsHost')).CollectionDetailsHost,
}));

const hasCollectionDetailsTarget = () => getCollectionDetailsTarget() !== null;

// `children` serve à rota "/" (Home do logado); nas demais, o conteúdo vem do {children ?? <Outlet />}.
export function AppShell({ children }: { children?: ReactNode }) {
  const detailsOpen = useSyncExternalStore(
    subscribeCollectionDetails,
    hasCollectionDetailsTarget,
    hasCollectionDetailsTarget
  );
  return (
    <NezProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        >
          Ir para o conteúdo
        </a>
        <Navbar />
        <OfflineBanner />
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-8">
          {children ?? <Outlet />}
        </main>
        {/* Reserva o espaço do botão flutuante do Nez e a área segura de baixo */}
        <Footer className="pb-[calc(5rem+env(safe-area-inset-bottom))]" />
        <NezAssistant />
        {detailsOpen && (
          <Suspense fallback={null}>
            <CollectionDetailsHost />
          </Suspense>
        )}
      </div>
    </NezProvider>
  );
}
