import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';
import { createAppRouter } from '@/routes/router';
import '@/styles/globals.css';

// Vitrine só em desenvolvimento: em produção `import.meta.env.DEV` é false e o chunk some do build.
const Showcase = import.meta.env.DEV ? lazy(() => import('@/dev/Showcase')) : null;
const showShowcase =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('vitrine');

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

const router = showShowcase ? null : createAppRouter();

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          {Showcase && showShowcase ? (
            <Suspense fallback={null}>
              <Showcase />
            </Suspense>
          ) : (
            router && <RouterProvider router={router} />
          )}
        </QueryClientProvider>
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
);
