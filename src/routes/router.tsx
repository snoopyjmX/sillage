import { createBrowserRouter, redirect, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageFallback } from './PageFallback';
import { RouteError } from './RouteError';

// Rotas desta fase: / -> /catalog, /catalog, /perfumes/:slug e * (404). Páginas carregam sob demanda (lazy).
// Coleção, Perfume do Dia e Perfil ainda não têm rota: aparecem desabilitados na navegação.
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    HydrateFallback: PageFallback,
    children: [
      { index: true, loader: () => redirect('/catalog') },
      {
        path: 'catalog',
        lazy: async () => ({ Component: (await import('@/pages/CatalogPage')).default }),
      },
      {
        path: 'perfumes/:slug',
        lazy: async () => ({ Component: (await import('@/pages/PerfumeDetailsPage')).default }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).default }),
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
