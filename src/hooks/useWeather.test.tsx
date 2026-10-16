import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';
import { fakeSession } from '@/test/authMock';
import { DEVICE_LOCATION_LABEL, useWeather } from './useWeather';

const reverseGeocode = vi.fn();
const getCurrent = vi.fn();
vi.mock('@/services/weatherService', () => ({
  weatherService: {
    reverseGeocode: (...args: unknown[]) => reverseGeocode(...args),
    getCurrent: (...args: unknown[]) => getCurrent(...args),
    searchCity: () => Promise.resolve([]),
  },
}));

const timezone = vi.hoisted(() => ({ value: 'America/Sao_Paulo' }));
vi.mock('@/hooks/useProfileTimezone', () => ({
  useProfileTimezone: () => ({ data: timezone.value, isPending: false }),
}));
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    supported: true,
    status: 'idle',
    coords: { latitude: -16.686891, longitude: -49.264794 },
    request: vi.fn(),
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  const value: AuthContextValue = {
    status: 'authenticated',
    session: fakeSession(),
    user: fakeSession().user,
  };
  return (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
};

const labelOf = (view: ReturnType<typeof useWeather>['view']) =>
  view.status === 'ready' ? view.location.label : null;

describe('useWeather com a localização do aparelho', () => {
  beforeEach(() => {
    reverseGeocode.mockReset();
    getCurrent.mockReset();
    getCurrent.mockResolvedValue({ temperature: 28, humidity: 60, code: 2 });
    timezone.value = 'America/Sao_Paulo';
  });

  it('usa o nome do local quando a geocodificação reversa responde', async () => {
    reverseGeocode.mockResolvedValue({
      locality: 'Setor Bueno',
      city: 'Goiânia',
      subdivisionCode: 'BR-GO',
    });
    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => expect(labelOf(result.current.view)).toBe('Setor Bueno, GO'));
  });

  it('tenta de novo uma vez e se recupera da falha passageira', async () => {
    reverseGeocode
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue({ locality: null, city: 'Goiânia', subdivisionCode: 'BR-GO' });
    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => expect(labelOf(result.current.view)).toBe('Goiânia, GO'));
    expect(reverseGeocode).toHaveBeenCalledTimes(2);
  });

  it('se falhar de vez, mostra a cidade do fuso marcada como aproximada', async () => {
    reverseGeocode.mockRejectedValue(new Error('429'));
    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => expect(labelOf(result.current.view)).toBe('Região de São Paulo'));
    expect(reverseGeocode).toHaveBeenCalledTimes(2);
  });

  it('fuso sem cidade e geocodificação com falha: rótulo genérico', async () => {
    timezone.value = 'UTC';
    reverseGeocode.mockRejectedValue(new Error('429'));
    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => expect(reverseGeocode).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(labelOf(result.current.view)).toBe(DEVICE_LOCATION_LABEL));
  });

  it('consulta o nome com as coordenadas arredondadas', async () => {
    reverseGeocode.mockResolvedValue({ locality: null, city: 'Goiânia', subdivisionCode: null });
    renderHook(() => useWeather(), { wrapper });
    await waitFor(() =>
      expect(reverseGeocode).toHaveBeenCalledWith({ latitude: -16.69, longitude: -49.26 })
    );
  });
});
