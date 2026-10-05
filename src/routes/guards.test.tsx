import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { search: () => Promise.resolve({ items: [], total: 0 }) },
}));
vi.mock('@/services/referenceService', () => ({
  referenceService: { listBrands: () => Promise.resolve([]), listNotes: () => Promise.resolve([]) },
}));

const location = (router: { state: { location: { pathname: string; search: string } } }) =>
  `${router.state.location.pathname}${router.state.location.search}`;

describe('RequireAuth', () => {
  beforeEach(() => auth.reset());

  it('visitante em rota privada vai para /login?redirect=<rota original>', async () => {
    const { router } = renderApp('/profile?aba=dados');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    expect(location(router)).toBe('/login?redirect=%2Fprofile%3Faba%3Ddados');
  });

  it('depois do login volta para o destino original', async () => {
    const { router } = renderApp('/profile');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    act(() => auth.emit('SIGNED_IN', fakeSession()));
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    expect(location(router)).toBe('/profile');
  });

  it('com sessão aberta entra direto, sem passar pelo login', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/profile');
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    expect(location(router)).toBe('/profile');
  });
});

describe('GuestOnly', () => {
  beforeEach(() => auth.reset());

  it('autenticado em /login vai para a Home (que leva ao catálogo)', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/login');
    await waitFor(() => expect(location(router)).toBe('/catalog'));
  });

  it('autenticado em /register respeita ?redirect=', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/register?redirect=%2Fprofile');
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    expect(location(router)).toBe('/profile');
  });

  it('ignora ?redirect= que aponta para fora do app', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/login?redirect=https%3A%2F%2Fevil.test');
    await waitFor(() => expect(location(router)).toBe('/catalog'));
  });
});

describe('AuthProvider', () => {
  beforeEach(() => auth.reset());

  it('SIGNED_OUT limpa só o cache privado e navega para /', async () => {
    auth.setInitialSession(fakeSession());
    const { router, client } = renderApp('/profile');
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    client.setQueryData(['private', 'u1', 'collection'], [1]);
    client.setQueryData(['public', 'perfumes', 'list'], [2]);

    act(() => auth.emit('SIGNED_OUT', null));

    await waitFor(() => expect(location(router)).toBe('/catalog'));
    expect(client.getQueryData(['private', 'u1', 'collection'])).toBeUndefined();
    expect(client.getQueryData(['public', 'perfumes', 'list'])).toEqual([2]);
  });

  it('PASSWORD_RECOVERY navega para /reset-password', async () => {
    const { router } = renderApp('/catalog');
    await screen.findByRole('heading', { name: 'Catálogo', level: 1 });
    act(() => auth.emit('PASSWORD_RECOVERY', fakeSession()));
    await screen.findByRole('heading', { name: 'Nova senha', level: 1 });
    expect(location(router)).toBe('/reset-password');
  });

  it('o listener é síncrono: não devolve promise', async () => {
    renderApp('/catalog');
    await screen.findByRole('heading', { name: 'Catálogo', level: 1 });
    const registered = auth.service.onAuthStateChange.mock.calls[0]?.[0];
    expect(registered?.('TOKEN_REFRESHED', fakeSession())).toBeUndefined();
  });
});
