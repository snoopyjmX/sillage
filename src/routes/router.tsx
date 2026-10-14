import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { GuestOnly } from './GuestOnly';
import { PageFallback } from './PageFallback';
import { RequireAuth } from './RequireAuth';
import { RootEntry } from './RootEntry';
import { RouteError } from './RouteError';

// Rotas públicas: "/" (Landing para visitante, Home para logado), /login, /register, /forgot-password,
// /reset-password e /auth/confirmed. Todo o resto (catalog, perfumes/:slug, perfumers/:slug, collection, recap/:year, profile e o 404 "*") exige
// login. Páginas carregam sob demanda.
// AuthLayout (sessão) fica na raiz; GuestOnly e RequireAuth são guardas de UX: o gate NÃO é barreira
// de dados (a segurança é a RLS, e a leitura do catálogo segue pública no banco).
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <RootEntry /> },
      // Telas de autenticação ficam fora do AppShell e do PublicLayout: layout próprio (AuthCard),
      // dividido em duas colunas
      {
        errorElement: <RouteError />,
        HydrateFallback: PageFallback,
        children: [
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
          // Retorno do link de confirmação do e-mail: o supabase-js troca o token por sessão
          { path: 'auth/confirmed', lazy: page(() => import('@/pages/auth/ConfirmedPage')) },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            lazy: async () => ({
              Component: (await import('@/components/layout/AppShell')).AppShell,
            }),
            errorElement: <RouteError />,
            HydrateFallback: PageFallback,
            children: [
              { path: 'catalog', lazy: page(() => import('@/pages/CatalogPage')) },
              { path: 'perfumes/:slug', lazy: page(() => import('@/pages/PerfumeDetailsPage')) },
              {
                path: 'perfumers/:slug',
                lazy: page(() => import('@/pages/PerfumerDetailsPage')),
              },
              { path: 'collection', lazy: page(() => import('@/pages/collection/CollectionPage')) },
              { path: 'compare', lazy: page(() => import('@/pages/ComparePage')) },
              { path: 'memorial', lazy: page(() => import('@/pages/MemorialPage')) },
              { path: 'recap/:year', lazy: page(() => import('@/pages/RecapPage')) },
              { path: 'profile', lazy: page(() => import('@/pages/ProfilePage')) },
              { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
            ],
          },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
