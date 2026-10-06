import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdaptivePillNav, type AdaptivePillNavMode } from './adaptive-pill-nav';

const renderNav = (mode: AdaptivePillNavMode, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdaptivePillNav mode={mode} />
    </MemoryRouter>
  );

const mainNav = () => screen.getByRole('navigation', { name: 'Principal' });

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = '';
});

describe('AdaptivePillNav', () => {
  it('modo app: itens são links e só o da rota atual tem aria-current', () => {
    renderNav('app', '/catalog');
    const nav = within(mainNav());
    expect(nav.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/catalog');
    expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
    expect(nav.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/profile');
  });

  it('modo app: "/" só fica ativo na própria página', () => {
    renderNav('app', '/collection');
    expect(within(mainNav()).getByRole('link', { name: 'Início' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('modo landing: âncoras das seções e botões Entrar e Criar conta', () => {
    renderNav('landing');
    const nav = within(mainNav());
    expect(nav.getByRole('link', { name: 'Como funciona' })).toHaveAttribute(
      'href',
      '#como-funciona'
    );
    expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'location');
    expect(nav.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(nav.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/register');
  });

  it('modo landing: o hash da URL define o item ativo', () => {
    window.location.hash = '#recursos';
    renderNav('landing');
    expect(within(mainNav()).getByRole('link', { name: 'Recursos' })).toHaveAttribute(
      'aria-current',
      'location'
    );
  });

  it('o celular mostra o rótulo ativo e o botão que abre o menu (Enter e Esc)', async () => {
    renderNav('app', '/collection');
    const trigger = screen.getByRole('button', { name: 'Abrir menu' });
    expect(screen.getAllByText('Coleção').length).toBeGreaterThan(0);
    trigger.focus();
    fireEvent.click(trigger);
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    expect(
      within(within(menu).getByRole('navigation', { name: 'Menu principal' })).getByRole('link', {
        name: 'Perfil',
      })
    ).toHaveAttribute('href', '/profile');
    fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
  });

  it('com reduced motion renderiza igual (sem indicador animado quebrando)', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
    renderNav('app', '/profile');
    expect(within(mainNav()).getByRole('link', { name: 'Perfil' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
