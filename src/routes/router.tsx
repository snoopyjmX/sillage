import type { ComponentType } from 'react';
import { createBrowserRouter, redirect, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from './AuthLayout';
import { GuestOnly } from './GuestOnly';
import { PageFallback } from './PageFallback';
import { RequireAuth } from './RequireAuth';
import { RouteError } from './RouteError';

// Rotas: / -> /catalog, /catalog, /perfumes/:slug, /collection e /profile (privadas), autenticação e * (404). Páginas carregam sob demanda.
// AuthLayout (sessão) fica na raiz; GuestOnly e RequireAuth são guardas de UX (a segurança é a RLS).
// Perfume do Dia ainda não tem rota: aparece desabilitado na navegação.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteError />,
        HydrateFallback: PageFallback,
        children: [
          { index: true, loader: () => redirect('/catalog') },
          { path: 'catalog', lazy: page(() => import('@/pages/CatalogPage')) },
          { path: 'perfumes/:slug', lazy: page(() => import('@/pages/PerfumeDetailsPage')) },
          {
            element: <GuestOnly />,
            children: [
              { path: 'login', lazy: page(() => import('@/pages/auth/LoginPage')) },
              { path: 'register', lazy: page(() => import('@/pages/auth/RegisterPage')) },
              {
                path: 'forgot-password',
                lazy: page(() => import('@/pages/auth/ForgotPasswordPage')),
              },
            ],
          },
          // Acessível por qualquer um: o link do e-mail traz a sessão de recuperação
          { path: 'reset-password', lazy: page(() => import('@/pages/auth/ResetPasswordPage')) },
          {
            element: <RequireAuth />,
            children: [
              { path: 'collection', lazy: page(() => import('@/pages/collection/CollectionPage')) },
              { path: 'profile', lazy: page(() => import('@/pages/ProfilePage')) },
            ],
          },
          { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
