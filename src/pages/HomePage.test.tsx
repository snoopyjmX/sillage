import { fireEvent, screen, within } from '@testing-library/react';
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
const getClosetSuggestion = vi.fn();
vi.mock('@/services/homeService', () => ({
  homeService: {
    getDailySuggestion: (...args: unknown[]) => getDailySuggestion(...args),
    getClosetSuggestion: (...args: unknown[]) => getClosetSuggestion(...args),
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
    window.localStorage.clear();
    auth.reset();
    getOverview.mockReset();
    getTimezone.mockReset();
    getTimezone.mockResolvedValue('America/Sao_Paulo');
    getCurrent.mockReset();
    searchCity.mockReset();
    getDailySuggestion.mockReset();
    getClosetSuggestion.mockReset();
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
          [],
          null
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
        [],
        null
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
        [],
        null
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
        perfumers: [],
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
        perfumers: [],
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

  describe('filtro de gênero da sugestão', () => {
    const filter = () => screen.findByRole('list', { name: 'Filtrar sugestão por gênero' });

    it('começa em "Todos" e consulta sem gênero', async () => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      renderApp('/');
      const group = await filter();
      expect(within(group).getByRole('button', { name: 'Todos' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await vi.waitFor(() =>
        expect(getDailySuggestion).toHaveBeenCalledWith(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          expect.any(Array),
          null
        )
      );
    });

    it('trocar o filtro consulta com o gênero e guarda a preferência', async () => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      renderApp('/');
      const group = await filter();
      fireEvent.click(within(group).getByRole('button', { name: 'Feminino' }));
      expect(within(group).getByRole('button', { name: 'Feminino' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(within(group).getByRole('button', { name: 'Todos' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      await vi.waitFor(() =>
        expect(getDailySuggestion).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Array),
          'feminine'
        )
      );
      expect(window.localStorage.getItem('sillage-home-gender')).toBe('feminine');
    });

    it('lê a preferência guardada e ignora valor inválido', async () => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      window.localStorage.setItem('sillage-home-gender', 'masculine');
      renderApp('/');
      const group = await filter();
      expect(within(group).getByRole('button', { name: 'Masculino' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('valor inválido guardado volta para "Todos"', async () => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      window.localStorage.setItem('sillage-home-gender', 'robot');
      renderApp('/');
      const group = await filter();
      expect(within(group).getByRole('button', { name: 'Todos' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('gênero sem candidatos mostra o estado vazio com link para o catálogo', async () => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      renderApp('/');
      const group = await filter();
      fireEvent.click(within(group).getByRole('button', { name: 'Unissex' }));
      expect(await screen.findByText('Nenhuma sugestão por enquanto')).toBeInTheDocument();
      expect(screen.getByText(/Não há perfumes deste gênero/)).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: 'Explorar o catálogo' })[0]).toHaveAttribute(
        'href',
        '/catalog'
      );
    });
  });

  describe('origem da sugestão: Catálogo e Meu armário (17B)', () => {
    const owned = (name: string) => ({
      status: 'owned',
      updatedAt: '2026-10-06T12:00:00Z',
      perfume: { ...entry('2026-10-06', name).perfume, noteFamilies: ['citrus', 'citrus'] },
    });
    const shelf = () => ['Alfa', 'Beta', 'Gama'].map(owned);
    const source = () => screen.findByRole('group', { name: 'Origem da sugestão' });

    beforeEach(() => {
      auth.setInitialSession(fakeSession());
      getOverview.mockResolvedValue({ today: null, history: [] });
      getClosetSuggestion.mockImplementation(({ id, slug }: { id: string; slug: string }) =>
        Promise.resolve({
          perfume: {
            ...entry('2026-10-06', id).perfume,
            slug,
            description: null,
            imageUrl: null,
            lowestPriceCents: null,
            storeName: null,
            storeUrl: null,
            perfumers: [],
            notes: [{ slug: 'limao', name: 'Limão', family: 'citrus', position: 'top' }],
          },
          summary: { count: 0, avgLongevity: null, avgProjection: null },
        })
      );
    });

    it('com 3 ou mais em "Tenho" e sem escolha, o armário é o padrão e o filtro de gênero some', async () => {
      listCollection.mockResolvedValue(shelf());
      renderApp('/');
      const group = await source();
      await vi.waitFor(() =>
        expect(within(group).getByRole('button', { name: 'Meu armário' })).toHaveAttribute(
          'aria-pressed',
          'true'
        )
      );
      const card = await screen.findByRole('article', { name: 'Sugestão do dia' });
      expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent(
        /^Do seu armário · O Boticário$/
      );
      expect(
        screen.queryByRole('list', { name: 'Filtrar sugestão por gênero' })
      ).not.toBeInTheDocument();
      expect(getDailySuggestion).not.toHaveBeenCalled();
    });

    it('com menos de 3 em "Tenho" e sem escolha, o padrão é o Catálogo', async () => {
      listCollection.mockResolvedValue(shelf().slice(0, 2));
      renderApp('/');
      const group = await source();
      await vi.waitFor(() =>
        expect(within(group).getByRole('button', { name: 'Catálogo' })).toHaveAttribute(
          'aria-pressed',
          'true'
        )
      );
      expect(
        await screen.findByRole('list', { name: 'Filtrar sugestão por gênero' })
      ).toBeVisible();
      expect(getClosetSuggestion).not.toHaveBeenCalled();
    });

    it('a escolha explícita vale e é lembrada', async () => {
      listCollection.mockResolvedValue(shelf());
      renderApp('/');
      const group = await source();
      await screen.findByRole('article', { name: 'Sugestão do dia' });
      fireEvent.click(within(group).getByRole('button', { name: 'Catálogo' }));
      expect(window.localStorage.getItem('sillage-home-source')).toBe('catalog');
      expect(
        await screen.findByRole('list', { name: 'Filtrar sugestão por gênero' })
      ).toBeVisible();
      fireEvent.click(within(group).getByRole('button', { name: 'Meu armário' }));
      expect(window.localStorage.getItem('sillage-home-source')).toBe('closet');
    });

    it('lê a escolha guardada mesmo com poucos perfumes', async () => {
      window.localStorage.setItem('sillage-home-source', 'closet');
      listCollection.mockResolvedValue([owned('Alfa')]);
      renderApp('/');
      const card = await screen.findByRole('article', { name: 'Sugestão do dia' });
      expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent('Alfa');
    });

    it('"Vestir hoje" já vem habilitado: o perfume é do "Tenho" (RN06)', async () => {
      listCollection.mockResolvedValue(shelf());
      renderApp('/');
      const card = await screen.findByRole('article', { name: 'Sugestão do dia' });
      expect(await within(card).findByRole('button', { name: 'Vestir hoje' })).toBeEnabled();
    });

    it('"Tenho" vazio no modo armário mostra a prateleira vazia com saída para o catálogo', async () => {
      window.localStorage.setItem('sillage-home-source', 'closet');
      listCollection.mockResolvedValue([]);
      renderApp('/');
      expect(await screen.findByText('Sua prateleira está vazia')).toBeInTheDocument();
      expect(getClosetSuggestion).not.toHaveBeenCalled();
    });

    it('falha no detalhe mostra o erro com tentar de novo', async () => {
      window.localStorage.setItem('sillage-home-source', 'closet');
      listCollection.mockResolvedValue(shelf());
      getClosetSuggestion.mockRejectedValueOnce(new AppError('network'));
      renderApp('/');
      expect(
        await screen.findByText('Não foi possível carregar a sugestão do dia')
      ).toBeInTheDocument();
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Tentar novamente' })[0] as HTMLElement
      );
      expect(await screen.findByRole('article', { name: 'Sugestão do dia' })).toBeInTheDocument();
    });
  });
});
