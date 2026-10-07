import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GEO_HINT_KEY } from '@/constants/weather';
import { useGeolocation } from './useGeolocation';

type PositionSuccess = (position: GeolocationPosition) => void;
type PositionFailure = (error: GeolocationPositionError) => void;

const getCurrentPosition = vi.fn<(ok: PositionSuccess, fail: PositionFailure) => void>();
const query = vi.fn();

const setNavigator = (name: 'geolocation' | 'permissions', value: unknown) =>
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true });

const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as GeolocationPosition;

const failure = (code: number) => ({ code }) as GeolocationPositionError;

const grantWith = (latitude = -22.906847, longitude = -43.172896) =>
  getCurrentPosition.mockImplementation((ok) => ok(position(latitude, longitude)));

// Serialização de tudo que o app poderia ter gravado
const storedText = () => JSON.stringify({ ...window.localStorage, ...window.sessionStorage });

describe('useGeolocation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    getCurrentPosition.mockReset();
    query.mockReset();
    setNavigator('geolocation', { getCurrentPosition });
    setNavigator('permissions', { query });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'geolocation');
    Reflect.deleteProperty(navigator, 'permissions');
  });

  it('permissão granted: usa a localização direto, sem clique, arredondada a 2 casas', async () => {
    query.mockResolvedValue({ state: 'granted' });
    grantWith();
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() =>
      expect(result.current.coords).toEqual({ latitude: -22.91, longitude: -43.17 })
    );
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(GEO_HINT_KEY)).toBe('1');
  });

  it('permissão prompt: não pede nada ao abrir, nem com aviso antigo; só no clique', async () => {
    window.localStorage.setItem(GEO_HINT_KEY, '1');
    query.mockResolvedValue({ state: 'prompt' });
    grantWith();
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(window.localStorage.getItem(GEO_HINT_KEY)).toBeNull());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.coords).toBeNull();

    act(() => result.current.request());
    expect(result.current.coords).toEqual({ latitude: -22.91, longitude: -43.17 });
    expect(window.localStorage.getItem(GEO_HINT_KEY)).toBe('1');
  });

  it('permissão denied: nunca pede sozinha e apaga o aviso', async () => {
    window.localStorage.setItem(GEO_HINT_KEY, '1');
    query.mockResolvedValue({ state: 'denied' });
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(window.localStorage.getItem(GEO_HINT_KEY)).toBeNull());
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('clique negado: status denied, aviso apagado e nenhum pedido novo automático', async () => {
    query.mockResolvedValue({ state: 'prompt' });
    getCurrentPosition.mockImplementation((_ok, fail) => fail(failure(1)));
    const { result, rerender } = renderHook(() => useGeolocation());
    await waitFor(() => expect(query).toHaveBeenCalled());

    act(() => result.current.request());
    expect(result.current.status).toBe('denied');
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(GEO_HINT_KEY)).toBeNull();

    rerender();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(result.current.coords).toBeNull();
  });

  it('erro que não é de permissão (timeout) mantém o aviso e vira status failed', async () => {
    window.localStorage.setItem(GEO_HINT_KEY, '1');
    query.mockResolvedValue({ state: 'granted' });
    getCurrentPosition.mockImplementation((_ok, fail) => fail(failure(3)));
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(window.localStorage.getItem(GEO_HINT_KEY)).toBe('1');
  });

  describe('Permissions API indisponível', () => {
    beforeEach(() => setNavigator('permissions', undefined));

    it('com o aviso gravado, chama a geolocalização direto', async () => {
      window.localStorage.setItem(GEO_HINT_KEY, '1');
      grantWith();
      const { result } = renderHook(() => useGeolocation());
      await waitFor(() => expect(result.current.coords).not.toBeNull());
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('sem o aviso, não pede nada ao abrir', async () => {
      renderHook(() => useGeolocation());
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(getCurrentPosition).not.toHaveBeenCalled();
    });

    it('aviso e permissão negada: o aviso é apagado e não há novo pedido', async () => {
      window.localStorage.setItem(GEO_HINT_KEY, '1');
      getCurrentPosition.mockImplementation((_ok, fail) => fail(failure(1)));
      const { result } = renderHook(() => useGeolocation());
      await waitFor(() => expect(result.current.status).toBe('denied'));
      expect(window.localStorage.getItem(GEO_HINT_KEY)).toBeNull();
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });
  });

  it('Permissions API que falha (query rejeita) cai no aviso booleano', async () => {
    query.mockRejectedValue(new TypeError('geolocation não suportado'));
    window.localStorage.setItem(GEO_HINT_KEY, '1');
    grantWith();
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.coords).not.toBeNull());
  });

  it('coordenadas nunca vão para o storage: só o aviso "1"', async () => {
    query.mockResolvedValue({ state: 'granted' });
    grantWith(-22.906847, -43.172896);
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.coords).not.toBeNull());
    expect(storedText()).not.toMatch(/22\.9|43\.1/);
    expect(JSON.parse(storedText())).toEqual({ [GEO_HINT_KEY]: '1' });
  });

  it('sem geolocalização no navegador: supported é false e nada é chamado', () => {
    Reflect.deleteProperty(navigator, 'geolocation');
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.supported).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});
