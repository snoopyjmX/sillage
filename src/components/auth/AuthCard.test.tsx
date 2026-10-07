import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

const ROUTES = [
  { path: '/login', heading: 'Entrar', form: true },
  { path: '/register', heading: 'Criar conta', form: true },
  { path: '/forgot-password', heading: 'Recuperar senha', form: true },
  // Visitante sem sessão de recuperação: estado "link inválido" (sem formulário)
  { path: '/reset-password', heading: 'Link inválido ou expirado', form: false },
] as const;

const stubMedia = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

describe('AuthCard', () => {
  beforeEach(() => {
    auth.reset();
    vi.unstubAllGlobals();
  });

  it.each(ROUTES)('$path: a logo fica acima do título e do formulário', async (route) => {
    renderApp(route.path);
    const heading = await screen.findByRole('heading', { name: route.heading, level: 1 });
    const main = document.getElementById('conteudo') as HTMLElement;
    const logo = main.querySelector('a[href="/"]:has(img[src="/favicon-32x32.png"])');

    expect(logo).not.toBeNull();
    expect(logo).toHaveTextContent('Sillage');
    expect(logo?.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const form = main.querySelector('form');
    if (route.form) {
      expect(logo?.compareDocumentPosition(form as HTMLElement)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    }
    // Só uma logo na tela: a do painel de marca saiu
    expect(document.querySelectorAll('img[src="/favicon-32x32.png"]')).toHaveLength(1);
  });

  it('painel de marca: frase e assinatura, sem a pirâmide decorativa', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    const panel = document.querySelector('[data-slot="auth-brand-panel"]') as HTMLElement;

    expect(panel).toHaveTextContent('Todo perfume deixa um rastro. O seu começa aqui.');
    expect(panel).toHaveTextContent('— Sillage');
    expect(panel).not.toHaveTextContent('Coração');
  });

  it('a partir de md: a arte é decorativa (alt vazio, aria-hidden) e local', async () => {
    stubMedia(true);
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    const art = document.querySelector('[data-slot="auth-art"]') as HTMLImageElement;

    expect(art).not.toBeNull();
    expect(art.getAttribute('alt')).toBe('');
    expect(art).toHaveAttribute('aria-hidden', 'true');
    expect(art).toHaveAttribute('width');
    expect(art).toHaveAttribute('height');
    expect(art.getAttribute('src')).toMatch(/^\/auth-art\/.+\.webp$/);
    expect(art.getAttribute('srcset')).not.toMatch(/https?:/);
    expect(art).toHaveAttribute('sizes');
  });

  it('abaixo de md: a imagem nem entra na árvore (não é baixada)', async () => {
    stubMedia(false);
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });

    expect(document.querySelector('[data-slot="auth-art"]')).toBeNull();
    expect(document.querySelector('img[src*="auth-art"]')).toBeNull();
  });
});
