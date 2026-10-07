import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';
import type { DailyEntry } from '@/types/daily';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const getOverview = vi.fn();
const getTimezone = vi.fn();
vi.mock('@/services/dailyService', () => ({
  dailyService: {
    getOverview: () => getOverview(),
    getTimezone: () => getTimezone(),
    setToday: () => Promise.resolve(),
  },
}));
const getCurrent = vi.fn();
const searchCity = vi.fn();
vi.mock('@/services/weatherService', () => ({
  weatherService: {
    getCurrent: (...args: unknown[]) => getCurrent(...args),
    searchCity: (...args: unknown[]) => searchCity(...args),
  },
}));
const getDailySuggestion = vi.fn();
vi.mock('@/services/homeService', () => ({
  homeService: {
    getDailySuggestion: (...args: unknown[]) => getDailySuggestion(...args),
    getRecent: () => Promise.resolve([]),
  },
}));
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { getSimilar: () => Promise.resolve([]) },
}));
const listCollection = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => listCollection() },
}));

const entry = (date: string, name: string): DailyEntry => {
  const perfume: PerfumeSummary = {
    id: name,
    slug: name.toLowerCase(),
    name,
    brandName: 'O Boticário',
    brandSlug: 'o-boticario',
    concentration: 'edp',
    gender: 'unisex',
    releaseYear: 2022,
    imagePath: null,
    families: ['citrus'],
  };
  return { date, perfume };
};

describe('HomePage', () => {
  beforeEach(() => {
    auth.reset();
    getOverview.mockReset();
    getTimezone.mockReset();
    getTimezone.mockResolvedValue('America/Sao_Paulo');
    getCurrent.mockReset();
    searchCity.mockReset();
    getDailySuggestion.mockReset();
    listCollection.mockReset();
    listCollection.mockResolvedValue([]);
    searchCity.mockResolvedValue([
      {
        name: 'São Paulo',
        country: 'Brasil',
        countryCode: 'BR',
        latitude: -23.55,
        longitude: -46.63,
        timezone: 'America/Sao_Paulo',
      },
    ]);
    getCurrent.mockResolvedValue({ temperature: 28, humidity: 60, code: 2 });
    getDailySuggestion.mockResolvedValue(null);
  });

  it('visitante vê a Landing, sem consultar o Perfume do Dia (é privado)', async () => {
    auth.setInitialSession(null);
    renderApp('/');
    expect(
      await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Descubra a fragrância de hoje' })
    ).not.toBeInTheDocument();
    expect(getOverview).not.toHaveBeenCalled();
  });

  it('logado vê o Perfume do Dia em destaque e o histórico', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({
      today: entry('2026-10-05', 'Alfa'),
      history: [entry('2026-10-04', 'Beta'), entry('2026-10-03', 'Gama')],
    });
    renderApp('/');
    const highlight = await screen.findByRole('article', { name: 'Perfume do Dia' });
    expect(within(highlight).getByRole('heading', { name: 'Alfa' })).toBeInTheDocument();
    const history = screen.getByRole('list', { name: 'Perfumes dos dias anteriores' });
    expect(within(history).getAllByRole('listitem')).toHaveLength(2);
    expect(within(history).getByRole('link', { name: /Beta/ })).toHaveAttribute(
      'href',
      '/perfumes/beta'
    );
  });

  it('sem Perfume do Dia hoje, mas com histórico, mostra os dois estados', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [entry('2026-10-04', 'Beta')] });
    renderApp('/');
    expect(await screen.findByText('Hoje ainda não tem Perfume do Dia')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Perfumes dos dias anteriores' })).toBeInTheDocument();
  });

  it('conta nova (nada ainda) mostra o estado vazio com saída para o catálogo', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    renderApp('/');
    expect(
      await screen.findByRole('heading', { name: 'Você ainda não escolheu um Perfume do Dia' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
  });

  it('falha mostra mensagem amigável e permite tentar de novo', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockRejectedValue(new AppError('daily_failed'));
    renderApp('/');
    expect(
      await screen.findByText(
        'Não foi possível carregar o Perfume do Dia. Tente novamente em instantes.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('mostra a barra de clima com cidade, temperatura, frase e famílias em destaque', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    renderApp('/');
    const bar = await screen.findByRole('region', { name: 'Clima de hoje' });
    expect(await within(bar).findByText('São Paulo, BRASIL')).toBeInTheDocument();
    expect(within(bar).getByText('28°C')).toBeInTheDocument();
    expect(within(bar).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(bar).getByText('Umidade 60%')).toBeInTheDocument();
    expect(within(bar).getByText('Projeção ideal para dias quentes')).toBeInTheDocument();
    expect(
      within(bar).getByRole('list', { name: 'Famílias em destaque hoje' })
    ).toBeInTheDocument();
  });

  it.each(['Marte/Olympus', 'xx', '', 'Etc/Nope', "'; drop table profiles; --"])(
    'fuso inválido salvo no perfil (%j) não quebra a Home: data no padrão e clima indisponível',
    async (invalid) => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      getTimezone.mockResolvedValue(invalid);
      renderApp('/');
      const bar = await screen.findByRole('region', { name: 'Clima de hoje' });
      expect(await within(bar).findByText('Clima indisponível')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Descubra a fragrância de hoje' })).toBeVisible();
      expect(getCurrent).not.toHaveBeenCalled();
      await vi.waitFor(() =>
        expect(getDailySuggestion).toHaveBeenCalledWith(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          []
        )
      );
    }
  );

  it('consulta do fuso falhando: a sugestão não fica carregando para sempre', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    getTimezone.mockRejectedValue(new AppError('network'));
    renderApp('/');
    const bar = await screen.findByRole('region', { name: 'Clima de hoje' });
    expect(await within(bar).findByText('Clima indisponível')).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(getDailySuggestion).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        []
      )
    );
    expect(await screen.findByText('Nenhuma sugestão por enquanto')).toBeInTheDocument();
  });

  it('fuso que não resolve cidade mostra "Clima indisponível" e a sugestão cai no catálogo todo', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    searchCity.mockResolvedValue([]);
    renderApp('/');
    const bar = await screen.findByRole('region', { name: 'Clima de hoje' });
    expect(await within(bar).findByText('Clima indisponível')).toBeInTheDocument();
    expect(getCurrent).not.toHaveBeenCalled();
    // Sem famílias em destaque: catálogo todo
    await vi.waitFor(() =>
      expect(getDailySuggestion).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        []
      )
    );
  });

  it('falha do clima mostra a mensagem amigável e tentar de novo', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    getCurrent.mockRejectedValue(new AppError('weather_failed'));
    renderApp('/');
    const bar = await screen.findByRole('region', { name: 'Clima de hoje' });
    expect(
      await within(bar).findByText('Clima indisponível no momento. Tente novamente em instantes.')
    ).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('mostra a sugestão do dia com medidores e as duas ações', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    const perfume = entry('2026-10-06', 'Sugerido').perfume;
    listCollection.mockResolvedValue([
      { status: 'owned', updatedAt: '2026-10-06T12:00:00Z', perfume },
    ]);
    getDailySuggestion.mockResolvedValue({
      perfume: {
        ...perfume,
        description: 'Fresco e luminoso.',
        imageUrl: null,
        lowestPriceCents: null,
        storeName: null,
        storeUrl: null,
        perfumer: null,
        notes: [
          { slug: 'limao', name: 'Limão', family: 'citrus', position: 'top' },
          { slug: 'cedro', name: 'Cedro', family: 'woody', position: 'base' },
        ],
      },
      summary: { count: 2, avgLongevity: 4, avgProjection: 3 },
    });
    renderApp('/');
    const card = await screen.findByRole('article', { name: 'Sugestão do dia' });
    expect(within(card).getByRole('heading', { name: 'Sugerido' })).toBeInTheDocument();
    expect(within(card).getByText('Limão')).toBeInTheDocument();
    expect(within(card).getByRole('img', { name: 'Fixação: 4,0 de 5' })).toBeInTheDocument();
    expect(within(card).getByRole('meter', { name: 'Rastro' })).toHaveAttribute(
      'aria-valuetext',
      'Moderado (3,0 de 5)'
    );
    expect(within(card).getByRole('meter', { name: 'Clima adequado' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Vestir hoje' })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Ver detalhes' })).toHaveAttribute(
      'href',
      '/perfumes/sugerido'
    );
  });

  it('sugestão fora do "Tenho" mostra o botão desabilitado com orientação', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    const perfume = entry('2026-10-06', 'Sugerido').perfume;
    getDailySuggestion.mockResolvedValue({
      perfume: {
        ...perfume,
        description: null,
        imageUrl: null,
        lowestPriceCents: null,
        storeName: null,
        storeUrl: null,
        perfumer: null,
        notes: [],
      },
      summary: { count: 0, avgLongevity: null, avgProjection: null },
    });
    renderApp('/');
    const card = await screen.findByRole('article', { name: 'Sugestão do dia' });
    expect(
      await within(card).findByRole('button', { name: 'Adicione a Tenho para vestir' })
    ).toBeDisabled();
  });
});
