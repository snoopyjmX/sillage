import { MotionConfig } from 'motion/react';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/toast';
import '@/styles/globals.css';

// Vitrine só em desenvolvimento: em produção `import.meta.env.DEV` é false e o chunk some do build.
const Showcase = import.meta.env.DEV ? lazy(() => import('@/dev/Showcase')) : null;
const showShowcase =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('vitrine');

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        {Showcase && showShowcase ? (
          <Suspense fallback={null}>
            <Showcase />
          </Suspense>
        ) : (
          <App />
        )}
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
);
