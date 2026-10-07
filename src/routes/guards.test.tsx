import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const search = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { search: (filters: unknown) => search(filters) },
}));
vi.mock('@/services/dailyService', () => ({
  dailyService: { getOverview: () => Promise.resolve({ today: null, history: [] }) },
}));
vi.mock('@/services/referenceService', () => ({
  referenceService: { listBrands: () => Promise.resolve([]), listNotes: () => Promise.resolve([]) },
}));

const location = (router: { state: { location: { pathname: string; search: string } } }) =>
  `${router.state.location.pathname}${router.state.location.search}`;

const LANDING = { name: 'Descubra perfumes pelas suas notas', level: 1 } as const;

describe('gate de acesso (RequireAuth)', () => {
  beforeEach(() => {
    auth.reset();
    search.mockReset();
    search.mockResolvedValue({ items: [], total: 0 });
  });

  it.each([
    ['/catalog', '/?redirect=%2Fcatalog'],
    ['/perfumes/malbec-signature', '/?redirect=%2Fperfumes%2Fmalbec-signature'],
    ['/perfumes/nao-existe-xyz', '/?redirect=%2Fperfumes%2Fnao-existe-xyz'],
    ['/collection', '/?redirect=%2Fcollection'],
    ['/profile?aba=dados', '/?redirect=%2Fprofile%3Faba%3Ddados'],
    ['/rota-inventada', '/?redirect=%2Frota-inventada'],
  ])('NEGADO: visitante em %s cai na Landing em %s', async (path, expected) => {
    const { router } = renderApp(path);
    await screen.findByRole('heading', LANDING);
    expect(location(router)).toBe(expected);
    // Nenhum dado do catálogo aparece, e nada é consultado
    expect(screen.queryByRole('heading', { name: 'Catálogo', level: 1 })).not.toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });

  it.each(['/login', '/register', '/forgot-password', '/reset-password'])(
    'PERMITIDO: visitante abre %s sem ser desviado',
    async (path) => {
      const { router } = renderApp(path);
      await waitFor(() => expect(location(router)).toBe(path));
      expect(screen.queryByRole('heading', LANDING)).not.toBeInTheDocument();
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    }
  );

  it('PERMITIDO: visitante abre "/" e vê a Landing, sem Home', async () => {
    const { router } = renderApp('/');
    await screen.findByRole('heading', LANDING);
    expect(location(router)).toBe('/');
    expect(
      screen.queryByRole('heading', { name: 'Descubra a fragrância de hoje' })
    ).not.toBeInTheDocument();
  });

  it('os botões da Landing repassam o redirect para o login e o cadastro', async () => {
    renderApp('/profile');
    await screen.findByRole('heading', LANDING);
    const main = within(screen.getByRole('main'));
    expect(main.getAllByRole('link', { name: /Criar conta/ })[0]).toHaveAttribute(
      'href',
      '/register?redirect=%2Fprofile'
    );
    expect(main.getAllByRole('link', { name: 'Entrar' })[0]).toHaveAttribute(
      'href',
      '/login?redirect=%2Fprofile'
    );
  });

  it.each(['//evil.com', 'https://evil.com', 'javascript:alert(1)'])(
    'NEGADO: ?redirect=%s malicioso é descartado nos botões da Landing',
    async (evil) => {
      renderApp(`/?redirect=${encodeURIComponent(evil)}`);
      await screen.findByRole('heading', LANDING);
      const main = within(screen.getByRole('main'));
      expect(main.getAllByRole('link', { name: 'Entrar' })[0]).toHaveAttribute('href', '/login');
      expect(main.getAllByRole('link', { name: /Criar conta/ })[0]).toHaveAttribute(
        'href',
        '/register'
      );
    }
  );

  it('depois do login volta para o destino original', async () => {
    const { router } = renderApp('/profile');
    await screen.findByRole('heading', LANDING);
    expect(location(router)).toBe('/?redirect=%2Fprofile');
    // Landing -> Entrar (leva o redirect) -> sessão surge -> destino original
    fireEvent.click(
      within(screen.getByRole('main')).getAllByRole('link', { name: 'Entrar' })[0] as HTMLElement
    );
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    expect(location(router)).toBe('/login?redirect=%2Fprofile');
    act(() => auth.emit('SIGNED_IN', fakeSession()));
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    expect(location(router)).toBe('/profile');
  });

  it('com sessão aberta entra direto, sem passar pela Landing', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/profile');
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    expect(location(router)).toBe('/profile');
  });

  it('logado em "/" vê a Home, não a Landing', async () => {
    auth.setInitialSession(fakeSession());
    renderApp('/');
    await screen.findByRole('heading', { name: 'Descubra a fragrância de hoje', level: 1 });
    expect(screen.queryByRole('heading', LANDING)).not.toBeInTheDocument();
  });

  it('enquanto a sessão carrega mostra o esqueleto, nunca a Landing', async () => {
    auth.setInitialSession(fakeSession());
    renderApp('/');
    expect(screen.getByRole('status', { name: 'Verificando sua sessão' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', LANDING)).not.toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Descubra a fragrância de hoje', level: 1 });
  });
});

describe('GuestOnly', () => {
  beforeEach(() => auth.reset());

  it('autenticado em /login vai para a Home', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/login');
    await waitFor(() => expect(location(router)).toBe('/'));
  });

  it('autenticado em /register respeita ?redirect=', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/register?redirect=%2Fprofile');
    await screen.findByRole('heading', { name: 'Perfil', level: 1 });
    expect(location(router)).toBe('/profile');
  });

  it('NEGADO: autenticado em /register volta para "/"', async () => {
    auth.setInitialSession(fakeSession());
    const { router } = renderApp('/register');
    await waitFor(() => expect(location(router)).toBe('/'));
    await screen.findByRole('heading', { name: 'Descubra a fragrância de hoje', level: 1 });
  });

  it.each(['https://evil.test', '//evil.com', 'javascript:alert(1)'])(
    'ignora ?redirect=%s que aponta para fora do app',
    async (evil) => {
      auth.setInitialSession(fakeSession());
      const { router } = renderApp(`/login?redirect=${encodeURIComponent(evil)}`);
      await waitFor(() => expect(location(router)).toBe('/'));
    }
  );
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

    await waitFor(() => expect(location(router)).toBe('/'));
    expect(client.getQueryData(['private', 'u1', 'collection'])).toBeUndefined();
    expect(client.getQueryData(['public', 'perfumes', 'list'])).toEqual([2]);
  });

  it('PASSWORD_RECOVERY navega para /reset-password', async () => {
    const { router } = renderApp('/');
    await screen.findByRole('heading', LANDING);
    act(() => auth.emit('PASSWORD_RECOVERY', fakeSession()));
    await screen.findByRole('heading', { name: 'Nova senha', level: 1 });
    expect(location(router)).toBe('/reset-password');
  });

  it('o listener é síncrono: não devolve promise', async () => {
    renderApp('/');
    await screen.findByRole('heading', LANDING);
    const registered = auth.service.onAuthStateChange.mock.calls[0]?.[0];
    expect(registered?.('TOKEN_REFRESHED', fakeSession())).toBeUndefined();
  });
});
