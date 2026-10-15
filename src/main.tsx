import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { MotionConfig } from 'motion/react';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/toast';
import {
  createIdbPersister,
  PERSIST_BUSTER,
  PERSIST_MAX_AGE,
  shouldPersistQuery,
} from '@/lib/persist';
import { listenForInstallPrompt, registerServiceWorker } from '@/lib/pwa';
import { queryClient } from '@/lib/queryClient';
import { createAppRouter } from '@/routes/router';
import { removeStaticSeoTags } from '@/lib/seoStatic';
import '@/styles/globals.css';

// Vitrine só em desenvolvimento: em produção `import.meta.env.DEV` é false e o chunk some do build.
const Showcase = import.meta.env.DEV ? lazy(() => import('@/dev/Showcase')) : null;
const showShowcase =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('vitrine');

// Só em produção: em dev o Service Worker atrapalharia o HMR
if (import.meta.env.PROD) {
  listenForInstallPrompt();
  registerServiceWorker();
}

const persister = createIdbPersister();

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

const router = showShowcase ? null : createAppRouter();
removeStaticSeoTags();

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: PERSIST_MAX_AGE,
            buster: PERSIST_BUSTER,
            // Só ['public', ...] com sucesso vai para o disco; ['private', ...] nunca
            dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
          }}
        >
          {Showcase && showShowcase ? (
            <Suspense fallback={null}>
              <Showcase />
            </Suspense>
          ) : (
            router && <RouterProvider router={router} />
          )}
        </PersistQueryClientProvider>
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
);
