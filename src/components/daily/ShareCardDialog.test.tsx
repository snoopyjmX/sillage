import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';
import type { DailyEntry } from '@/types/daily';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const getOverview = vi.fn();
vi.mock('@/services/dailyService', () => ({
  dailyService: {
    getOverview: () => getOverview(),
    getTimezone: () => Promise.resolve('America/Sao_Paulo'),
    setToday: () => Promise.resolve(),
  },
}));
vi.mock('@/services/weatherService', () => ({
  weatherService: {
    getCurrent: () => Promise.resolve({ temperature: 19, humidity: 60, code: 0 }),
    searchCity: () =>
      Promise.resolve([
        {
          name: 'São Paulo',
          country: 'Brasil',
          countryCode: 'BR',
          latitude: -23.55,
          longitude: -46.63,
          timezone: 'America/Sao_Paulo',
        },
      ]),
  },
}));
vi.mock('@/services/homeService', () => ({
  homeService: {
    getDailySuggestion: () => Promise.resolve(null),
    getRecent: () => Promise.resolve([]),
  },
}));
const getBySlug = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: {
    getSimilar: () => Promise.resolve([]),
    getBySlug: (...args: unknown[]) => getBySlug(...args),
  },
}));
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => Promise.resolve([]) },
}));
const renderSotdCard = vi.fn();
vi.mock('@/lib/sotdCanvas', () => ({
  renderSotdCard: (...args: unknown[]) => renderSotdCard(...args),
}));

const perfume: PerfumeSummary = {
  id: 'p1',
  slug: 'malbec',
  name: 'Malbec',
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imagePath: null,
  families: ['woody'],
};
const today: DailyEntry = { date: '2026-10-13', perfume };

const jpeg = () => new Blob(['x'], { type: 'image/jpeg' });

const openDialog = async () => {
  auth.setInitialSession(fakeSession());
  getOverview.mockResolvedValue({ today, history: [] });
  renderApp('/');
  fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar dia' }));
  return screen.findByRole('dialog', { name: 'Compartilhar o seu dia' });
};

describe('ShareCardDialog', () => {
  beforeEach(() => {
    window.localStorage.clear();
    auth.reset();
    getOverview.mockReset();
    getBySlug.mockReset();
    getBySlug.mockResolvedValue({ id: 'p1', imageUrl: null, notes: [] });
    renderSotdCard.mockReset();
    renderSotdCard.mockResolvedValue(jpeg());
  });
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'canShare');
  });

  it('abre com a prévia gerada e oferece baixar a imagem', async () => {
    await openDialog();
    expect(
      await screen.findByRole('img', { name: /Card do Perfume do Dia: Malbec/ })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled();
  });

  it('sem canShare com arquivos, não mostra "Compartilhar"', async () => {
    await openDialog();
    await screen.findByRole('img', { name: /Card do Perfume do Dia/ });
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
  });

  it('com canShare com arquivos, mostra "Compartilhar" e chama o share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    await openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    Reflect.deleteProperty(navigator, 'share');
  });

  it('a cidade vem ligada por padrão, entra no card e a escolha é lembrada', async () => {
    await openDialog();
    const checkbox = await screen.findByRole('checkbox', { name: 'Mostrar a cidade' });
    expect(checkbox).toBeChecked();
    await waitFor(() =>
      expect(renderSotdCard).toHaveBeenLastCalledWith(
        expect.objectContaining({ weather: expect.objectContaining({ city: 'São Paulo' }) })
      )
    );

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(window.localStorage.getItem('sillage-share-city')).toBe('off');
    await waitFor(() =>
      expect(renderSotdCard).toHaveBeenLastCalledWith(
        expect.objectContaining({ weather: expect.objectContaining({ city: null }) })
      )
    );
  });

  it('lê a preferência guardada', async () => {
    window.localStorage.setItem('sillage-share-city', 'off');
    await openDialog();
    expect(await screen.findByRole('checkbox', { name: 'Mostrar a cidade' })).not.toBeChecked();
  });

  it('falha na geração mostra erro amigável e permite tentar de novo', async () => {
    renderSotdCard.mockRejectedValue(new AppError('share_card_failed'));
    await openDialog();
    expect(
      await screen.findByText(
        'Não foi possível gerar a imagem agora. Tente novamente em instantes.'
      )
    ).toBeVisible();
    renderSotdCard.mockResolvedValue(jpeg());
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('img', { name: /Card do Perfume do Dia/ })).toBeVisible();
  });

  it('detalhe indisponível não bloqueia: o card sai sem notas', async () => {
    getBySlug.mockRejectedValue(new AppError('network'));
    await openDialog();
    expect(await screen.findByRole('img', { name: /Card do Perfume do Dia/ })).toBeVisible();
    expect(renderSotdCard).toHaveBeenLastCalledWith(expect.objectContaining({ notes: [] }));
  });
});
