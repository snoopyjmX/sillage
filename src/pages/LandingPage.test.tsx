import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LANDING_ITEMS } from '@/constants/navigation';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const search = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { search: (filters: unknown) => search(filters) },
}));

describe('LandingPage', () => {
  beforeEach(() => {
    auth.reset();
    search.mockReset();
    auth.setInitialSession(null);
  });

  it('tem uma seção para cada âncora da pílula e a assinatura "Enciclopédia olfativa"', async () => {
    renderApp('/');
    await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 });
    const main = screen.getByRole('main');
    LANDING_ITEMS.forEach((item) => {
      expect(main.querySelector(item.hash)).not.toBeNull();
    });
    expect(within(main).getByText('Enciclopédia olfativa')).toBeInTheDocument();
  });

  it('dois CTAs visíveis: "Criar conta" (primário) e "Entrar"', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    const hero = within(screen.getByRole('main').querySelector('#inicio') as HTMLElement);
    expect(hero.getByRole('link', { name: /Criar conta/ })).toHaveAttribute('href', '/register');
    expect(hero.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('não consulta o catálogo (a Landing é estática) nem lista perfumes', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    expect(search).not.toHaveBeenCalled();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('a pirâmide decorativa fica fora da árvore de acessibilidade', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    const layers = document.querySelectorAll('[data-layer]');
    expect(layers).toHaveLength(3);
    expect(layers[0]?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
