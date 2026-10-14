import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError, ERROR_MESSAGES } from '@/constants/errors';
import { weatherService } from './weatherService';

const fetchMock = vi.fn();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const rejects = async (promise: Promise<unknown>, code: AppError['code']) => {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe(code);
  return error as AppError;
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('weatherService.getCurrent', () => {
  it('valida a resposta e pede só as variáveis current necessárias', async () => {
    fetchMock.mockResolvedValue(
      json({ current: { temperature_2m: 27.4, relative_humidity_2m: 61, weather_code: 3 } })
    );
    await expect(
      weatherService.getCurrent({ latitude: -23.55, longitude: -46.63 })
    ).resolves.toEqual({
      temperature: 27.4,
      humidity: 61,
      code: 3,
    });
    const url = fetchMock.mock.calls[0]?.[0] as URL;
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('-23.55');
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,relative_humidity_2m,weather_code'
    );
  });

  it('4xx e 5xx viram weather_failed, sem expor texto cru', async () => {
    for (const status of [400, 404, 500, 503]) {
      fetchMock.mockResolvedValue(json({ reason: 'texto cru do servidor' }, status));
      const error = await rejects(
        weatherService.getCurrent({ latitude: 0, longitude: 0 }),
        'weather_failed'
      );
      expect(error.message).toBe(ERROR_MESSAGES.weather_failed);
      expect(error.message).not.toMatch(/cru/);
    }
  });

  it('429 vira weather_rate_limited', async () => {
    fetchMock.mockResolvedValue(json({}, 429));
    await rejects(weatherService.getCurrent({ latitude: 0, longitude: 0 }), 'weather_rate_limited');
  });

  it('resposta fora do formato vira weather_failed', async () => {
    fetchMock.mockResolvedValue(json({ current: { temperature_2m: 'quente' } }));
    await rejects(weatherService.getCurrent({ latitude: 0, longitude: 0 }), 'weather_failed');
  });

  it('corpo que não é JSON vira weather_failed', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }));
    await rejects(weatherService.getCurrent({ latitude: 0, longitude: 0 }), 'weather_failed');
  });

  it('sem rede vira network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await rejects(weatherService.getCurrent({ latitude: 0, longitude: 0 }), 'network');
  });

  it('estourar o timeout aborta e vira weather_timeout', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: URL, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          );
        })
    );
    const pending = rejects(
      weatherService.getCurrent({ latitude: 0, longitude: 0 }),
      'weather_timeout'
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
  });
});

describe('weatherService.searchCity', () => {
  it('mapeia os resultados do geocoding', async () => {
    fetchMock.mockResolvedValue(
      json({
        results: [
          {
            id: 1,
            name: 'São Paulo',
            country: 'Brasil',
            country_code: 'BR',
            latitude: -23.5475,
            longitude: -46.63611,
            timezone: 'America/Sao_Paulo',
          },
        ],
      })
    );
    await expect(weatherService.searchCity('Sao Paulo')).resolves.toEqual([
      {
        name: 'São Paulo',
        country: 'Brasil',
        countryCode: 'BR',
        latitude: -23.5475,
        longitude: -46.63611,
        timezone: 'America/Sao_Paulo',
      },
    ]);
    const url = fetchMock.mock.calls[0]?.[0] as URL;
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(url.searchParams.get('name')).toBe('Sao Paulo');
    expect(url.searchParams.get('language')).toBe('pt');
  });

  it('busca sem resultado (sem a chave results) devolve lista vazia', async () => {
    fetchMock.mockResolvedValue(json({ generationtime_ms: 0.4 }));
    await expect(weatherService.searchCity('Xyzzy')).resolves.toEqual([]);
  });

  it('5xx vira weather_failed', async () => {
    fetchMock.mockResolvedValue(json({}, 502));
    await rejects(weatherService.searchCity('Sao Paulo'), 'weather_failed');
  });
});

describe('weatherService.reverseGeocode', () => {
  it('pede só latitude, longitude e idioma, e reduz a resposta ao que o rótulo usa', async () => {
    fetchMock.mockResolvedValue(
      json({
        locality: 'Curitiba',
        city: 'Região Metropolitana de Curitiba',
        principalSubdivisionCode: 'BR-PR',
        postcode: '',
        plusCode: '586GHPCJ+22',
      })
    );
    await expect(
      weatherService.reverseGeocode({ latitude: -25.43, longitude: -49.27 })
    ).resolves.toEqual({
      locality: 'Curitiba',
      city: 'Região Metropolitana de Curitiba',
      subdivisionCode: 'BR-PR',
    });
    const url = fetchMock.mock.calls[0]?.[0] as URL;
    expect(url.origin + url.pathname).toBe(
      'https://api.bigdatacloud.net/data/reverse-geocode-client'
    );
    expect([...url.searchParams.keys()].sort()).toEqual([
      'latitude',
      'localityLanguage',
      'longitude',
    ]);
    expect(url.searchParams.get('latitude')).toBe('-25.43');
  });

  it('campos vazios viram null', async () => {
    fetchMock.mockResolvedValue(json({ locality: '', city: '', principalSubdivisionCode: '' }));
    await expect(weatherService.reverseGeocode({ latitude: 0, longitude: 0 })).resolves.toEqual({
      locality: null,
      city: null,
      subdivisionCode: null,
    });
  });

  it('5xx vira weather_failed', async () => {
    fetchMock.mockResolvedValue(json({}, 503));
    await rejects(weatherService.reverseGeocode({ latitude: 0, longitude: 0 }), 'weather_failed');
  });
});
