import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { AuthContext } from '@/contexts/auth-context';
import { fakeSession } from '@/test/authMock';
import type { Passkey } from '@/types/passkey';
import { PasskeyManager } from './PasskeyManager';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const checkSupport = vi.fn();
vi.mock('@/lib/passkey', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/passkey')>()),
  checkBiometricsSupport: () => checkSupport(),
}));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const session = fakeSession();
const passkeys: Passkey[] = [
  {
    id: 'pk1',
    name: 'iPhone',
    createdAt: '2026-10-01T12:00:00Z',
    lastUsedAt: '2026-10-10T12:00:00Z',
  },
  { id: 'pk2', name: null, createdAt: '2026-10-02T12:00:00Z', lastUsedAt: null },
];

const renderManager = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AuthContext.Provider value={{ status: 'authenticated', session, user: session.user }}>
      <QueryClientProvider client={client}>
        <PasskeyManager />
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('PasskeyManager', () => {
  beforeEach(() => {
    auth.reset();
    vi.clearAllMocks();
    checkSupport.mockResolvedValue(true);
    auth.service.listPasskeys.mockResolvedValue(passkeys);
    auth.service.deletePasskey.mockResolvedValue(undefined);
    auth.service.registerPasskey.mockResolvedValue(undefined);
  });

  it('lista os aparelhos com data de cadastro e último uso', async () => {
    renderManager();
    const list = await screen.findByRole('list', { name: 'Aparelhos cadastrados' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('iPhone');
    expect(items[0]).toHaveTextContent('Cadastrado em 1 de outubro de 2026');
    expect(items[0]).toHaveTextContent('Último uso em 10 de outubro de 2026');
    // Sem nome: rótulo neutro; sem uso: só a data de cadastro
    expect(items[1]).toHaveTextContent('Chave de acesso');
    expect(items[1]).not.toHaveTextContent('Último uso');
  });

  it('remover pede confirmação e só então chama o service', async () => {
    renderManager();
    fireEvent.click(await screen.findByRole('button', { name: 'Remover iPhone' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remover este aparelho?' });
    expect(auth.service.deletePasskey).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remover aparelho' }));
    await waitFor(() => expect(auth.service.deletePasskey).toHaveBeenCalledWith('pk1'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancelar a remoção não chama o service', async () => {
    renderManager();
    fireEvent.click(await screen.findByRole('button', { name: 'Remover iPhone' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(auth.service.deletePasskey).not.toHaveBeenCalled();
  });

  it('cadastra este aparelho', async () => {
    renderManager();
    fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar este aparelho' }));
    await waitFor(() => expect(auth.service.registerPasskey).toHaveBeenCalled());
  });

  it('vazio: explica como cadastrar', async () => {
    auth.service.listPasskeys.mockResolvedValue([]);
    renderManager();
    expect(await screen.findByText('Nenhum aparelho cadastrado')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Cadastrar este aparelho' })).toBeEnabled();
  });

  it('sem suporte no navegador não mostra o botão de cadastro', async () => {
    checkSupport.mockResolvedValue(false);
    auth.service.listPasskeys.mockResolvedValue([]);
    renderManager();
    expect(
      await screen.findByText(/Este dispositivo ou navegador não suporta biometria/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar este aparelho' })).toBeNull();
  });

  it('erro ao carregar mostra mensagem amigável e tentar de novo', async () => {
    auth.service.listPasskeys.mockRejectedValue(new AppError('passkey_list_failed'));
    renderManager();
    expect(await screen.findByText('Não foi possível carregar os aparelhos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(auth.service.listPasskeys).toHaveBeenCalledTimes(2));
  });

  it('carregando mostra o skeleton', () => {
    auth.service.listPasskeys.mockReturnValue(new Promise(() => undefined));
    renderManager();
    expect(
      screen.getByRole('status', { name: 'Carregando os aparelhos cadastrados' })
    ).toBeInTheDocument();
  });
});
