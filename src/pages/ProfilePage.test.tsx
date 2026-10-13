import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const getProfile = vi.fn();
const updateProfile = vi.fn();
const uploadAvatar = vi.fn();
const removeAvatar = vi.fn();
vi.mock('@/services/profileService', () => ({
  profileService: {
    get: () => getProfile(),
    update: (v: unknown) => updateProfile(v),
    uploadAvatar: (b: unknown) => uploadAvatar(b),
    removeAvatar: () => removeAvatar(),
  },
}));
const processAvatarImage = vi.fn();
vi.mock('@/lib/avatar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/avatar')>()),
  processAvatarImage: (f: unknown) => processAvatarImage(f),
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
const getDna = vi.fn();
vi.mock('@/services/dnaService', () => ({ dnaService: { get: () => getDna() } }));
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
    info: vi.fn(),
  },
}));

const readyDna = {
  families: [{ family: 'woody', weight: 6 }],
  topNotes: [{ slug: 'cedro', name: 'Cedro', family: 'woody', weight: 4 }],
  wishFamily: null,
  wantedCount: 0,
  perfumeCount: 4,
  memorialDays: 2,
};

const AUTO_TZ = 'Detectar fuso horário automaticamente';

const item = (status: 'owned' | 'wanted') => ({ status });

const statValue = (label: string): string => {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.nextElementSibling?.firstElementChild?.textContent ?? '';
};

describe('ProfilePage', () => {
  beforeEach(() => {
    auth.reset();
    vi.clearAllMocks();
    window.localStorage.clear();
    auth.setInitialSession(fakeSession('ana@exemplo.com'));
    getProfile.mockResolvedValue({ displayName: 'Ana Silva', timezone: 'America/Sao_Paulo' });
    updateProfile.mockResolvedValue(undefined);
    processAvatarImage.mockResolvedValue(new Blob(['x'], { type: 'image/webp' }));
    uploadAvatar.mockResolvedValue('https://cdn/avatars/u/avatar.webp?t=1');
    removeAvatar.mockResolvedValue(undefined);
    listCollection.mockResolvedValue([item('owned'), item('owned'), item('wanted')]);
    countDays.mockResolvedValue(5);
    getDna.mockResolvedValue(readyDna);
  });

  describe('DNA olfativo', () => {
    it('mostra o DNA entre o resumo e os dados', async () => {
      renderApp('/profile');
      const heading = await screen.findByRole('heading', { name: 'Seu DNA olfativo' });
      expect(heading).toBeInTheDocument();
      const legend = await screen.findByRole('list', { name: 'Famílias olfativas' });
      expect(within(legend).getByText('Amadeirado 100%')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cedro' })).toHaveAttribute(
        'href',
        '/catalog?notes=cedro'
      );
      const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
      expect(titles.indexOf('Resumo')).toBeLessThan(titles.indexOf('Seu DNA olfativo'));
      expect(titles.indexOf('Seu DNA olfativo')).toBeLessThan(titles.indexOf('Seus dados'));
    });

    it('com menos de 3 perfumes mostra o progresso (D3)', async () => {
      getDna.mockResolvedValue({ ...readyDna, perfumeCount: 1 });
      renderApp('/profile');
      expect(
        await screen.findByRole('heading', { name: 'Faltam 2 perfumes para o seu DNA aparecer' })
      ).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: 'Famílias olfativas' })).not.toBeInTheDocument();
    });

    it('falha do DNA mostra erro com tentar de novo e não esconde o resto', async () => {
      getDna.mockRejectedValueOnce(new AppError('dna_failed'));
      renderApp('/profile');
      expect(
        await screen.findByText(
          'Não foi possível carregar o seu DNA olfativo. Tente novamente em instantes.'
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Seus dados' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
      expect(await screen.findByRole('list', { name: 'Famílias olfativas' })).toBeInTheDocument();
    });
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
    fireEvent.click(within(form).getByRole('checkbox', { name: AUTO_TZ }));
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
    fireEvent.click(within(form).getByRole('checkbox', { name: AUTO_TZ }));
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

  it('zona de perigo: o dialog abre, a exclusão pede EXCLUIR e cancelar fecha', async () => {
    renderApp('/profile');
    await screen.findByRole('heading', { name: 'Zona de perigo' });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir a sua conta?' });
    expect(
      within(dialog).getByRole('button', { name: 'Excluir conta definitivamente' })
    ).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('avatar: escolhe a foto, processa no navegador, envia e avisa', async () => {
    renderApp('/profile');
    const input = await screen.findByLabelText('Alterar foto de perfil');
    const file = new File(['x'], 'eu.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(processAvatarImage).toHaveBeenCalledWith(file));
    await waitFor(() => expect(uploadAvatar).toHaveBeenCalledOnce());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Foto de perfil atualizada.'));
  });

  it('avatar: foto inválida mostra a mensagem amigável e nada é enviado', async () => {
    processAvatarImage.mockRejectedValueOnce(new AppError('avatar_too_large'));
    renderApp('/profile');
    const input = await screen.findByLabelText('Alterar foto de perfil');
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'g.png', { type: 'image/png' })] },
    });
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'A imagem escolhida é muito grande. Escolha uma foto de até 5 MB.'
      )
    );
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('avatar: com foto salva mostra a imagem e permite remover', async () => {
    getProfile.mockResolvedValue({
      displayName: 'Ana Silva',
      timezone: 'America/Sao_Paulo',
      avatarUrl: 'https://cdn/avatars/u/avatar.webp?t=1',
    });
    renderApp('/profile');
    fireEvent.click(await screen.findByRole('button', { name: 'Remover foto de perfil' }));
    await waitFor(() => expect(removeAvatar).toHaveBeenCalledOnce());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Foto de perfil removida.'));
  });

  it('salvar com fuso automático envia o fuso do navegador e não mexe na foto', async () => {
    renderApp('/profile');
    const form = await screen.findByRole('form', { name: 'Dados do perfil' });
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await waitFor(() =>
      expect(within(form).getByLabelText('Fuso horário')).toHaveValue(browserZone)
    );
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        displayName: 'Ana Silva',
        timezone: browserZone,
      })
    );
  });
});
