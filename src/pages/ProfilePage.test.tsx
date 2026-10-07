import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const getProfile = vi.fn();
const updateProfile = vi.fn();
vi.mock('@/services/profileService', () => ({
  profileService: { get: () => getProfile(), update: (v: unknown) => updateProfile(v) },
}));
const listCollection = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => listCollection() },
}));
const countDays = vi.fn();
vi.mock('@/services/dailyService', () => ({
  dailyService: {
    countDays: () => countDays(),
    getTimezone: () => Promise.resolve('America/Sao_Paulo'),
    getOverview: () => Promise.resolve({ today: null, history: [] }),
  },
}));
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));

const item = (status: 'owned' | 'wanted') => ({ status });

const statValue = (label: string): string => {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.nextElementSibling?.firstElementChild?.textContent ?? '';
};

describe('ProfilePage', () => {
  beforeEach(() => {
    auth.reset();
    vi.clearAllMocks();
    auth.setInitialSession(fakeSession('ana@exemplo.com'));
    getProfile.mockResolvedValue({ displayName: 'Ana Silva', timezone: 'America/Sao_Paulo' });
    updateProfile.mockResolvedValue(undefined);
    listCollection.mockResolvedValue([item('owned'), item('owned'), item('wanted')]);
    countDays.mockResolvedValue(5);
  });

  it('NEGADO: visitante em /profile cai na Landing (gate) com ?redirect e nada é consultado', async () => {
    auth.setInitialSession(null);
    const { router } = renderApp('/profile');
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(router.state.location.search).toBe('?redirect=%2Fprofile');
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('PERMITIDO: mostra iniciais, nome, fuso, e-mail e as contagens reais', async () => {
    renderApp('/profile');
    expect(await screen.findByRole('heading', { name: 'Ana Silva' })).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(screen.getByText('Fuso: America/Sao_Paulo')).toBeInTheDocument();
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument();
    await waitFor(() => expect(statValue('Tenho')).toBe('2'));
    expect(statValue('Quero')).toBe('1');
    expect(statValue('No memorial')).toBe('5');
  });

  it('sem dados: estado vazio claro com saída para o catálogo, sem número inventado', async () => {
    listCollection.mockResolvedValue([]);
    countDays.mockResolvedValue(0);
    renderApp('/profile');
    expect(
      await screen.findByRole('heading', { name: 'Sua coleção e o memorial ainda estão vazios' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
    expect(screen.queryByText('Tenho', { selector: 'dt' })).not.toBeInTheDocument();
  });

  it('falha no resumo mostra mensagem amigável e tenta de novo, sem esconder o formulário', async () => {
    countDays.mockRejectedValueOnce(new AppError('daily_failed'));
    renderApp('/profile');
    expect(await screen.findByText('Não foi possível carregar o resumo')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    countDays.mockResolvedValue(7);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(statValue('No memorial')).toBe('7'));
  });

  it('falha ao carregar o perfil mostra o erro com tentar de novo', async () => {
    getProfile.mockRejectedValueOnce(new AppError('profile_load_failed'));
    renderApp('/profile');
    expect(await screen.findByText('Não foi possível carregar o perfil')).toBeInTheDocument();
    expect(
      screen.getByText('Não foi possível carregar o seu perfil. Tente novamente em instantes.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Ana Silva' })).toBeInTheDocument();
  });

  it('carregando: skeleton do perfil enquanto a consulta não volta', async () => {
    getProfile.mockReturnValue(new Promise(() => undefined));
    renderApp('/profile');
    expect(await screen.findByRole('status', { name: 'Carregando o perfil' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Perfil', level: 1 })).toBeInTheDocument();
  });

  it('offline sem dados explica em vez de girar para sempre', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    getProfile.mockReturnValue(new Promise(() => undefined));
    renderApp('/profile');
    expect(await screen.findByText('Você está offline')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('PERMITIDO: edita nome e fuso e salva só esses dois campos', async () => {
    renderApp('/profile');
    const form = await screen.findByRole('form', { name: 'Dados do perfil' });
    fireEvent.change(within(form).getByLabelText('Nome'), { target: { value: '  Beatriz  ' } });
    fireEvent.change(within(form).getByLabelText('Fuso horário'), {
      target: { value: 'Europe/Lisbon' },
    });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        displayName: 'Beatriz',
        timezone: 'Europe/Lisbon',
      })
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Perfil atualizado.'));
  });

  it('NEGADO: fuso inválido é rejeitado e nada é salvo', async () => {
    renderApp('/profile');
    const form = await screen.findByRole('form', { name: 'Dados do perfil' });
    fireEvent.change(within(form).getByLabelText('Fuso horário'), {
      target: { value: 'Marte/Olympus' },
    });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }));
    expect(await within(form).findByText(/Fuso horário inválido/)).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('NEGADO: nome vazio e nome longo demais são rejeitados', async () => {
    renderApp('/profile');
    const form = await screen.findByRole('form', { name: 'Dados do perfil' });
    const name = within(form).getByLabelText('Nome');
    const save = within(form).getByRole('button', { name: 'Salvar alterações' });

    fireEvent.change(name, { target: { value: '   ' } });
    fireEvent.click(save);
    expect(await within(form).findByText('Informe como podemos chamar você.')).toBeInTheDocument();

    fireEvent.change(name, { target: { value: 'a'.repeat(61) } });
    fireEvent.click(save);
    expect(
      await within(form).findByText('O nome pode ter no máximo 60 caracteres.')
    ).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('falha ao salvar mostra a mensagem amigável', async () => {
    updateProfile.mockRejectedValueOnce(new AppError('profile_failed'));
    renderApp('/profile');
    const form = await screen.findByRole('form', { name: 'Dados do perfil' });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Não foi possível salvar o seu perfil. Tente novamente em instantes.'
      )
    );
  });

  it('zona de perigo: o dialog abre, a ação está desativada ("Em breve") e cancelar fecha', async () => {
    renderApp('/profile');
    await screen.findByRole('heading', { name: 'Zona de perigo' });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir a sua conta?' });
    expect(within(dialog).getByRole('button', { name: 'Em breve' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
