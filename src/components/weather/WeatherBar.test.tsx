import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeatherBar } from '@/components/weather/WeatherBar';
import type { WeatherView } from '@/types/weather';

const ready: WeatherView = {
  status: 'ready',
  location: { latitude: 0, longitude: 0, label: 'São Paulo, BRASIL' },
  weather: { temperature: 28.4, humidity: 61, code: 2 },
  description: 'Parcialmente nublado',
  phrase: 'Projeção ideal para dias quentes',
  families: ['citrus', 'green'],
};

type Location = ComponentProps<typeof WeatherBar>['location'];

const idle: Location = { supported: true, status: 'idle', error: null, request: vi.fn() };

const setup = (view: WeatherView, location = idle, onRetry = vi.fn()) =>
  render(<WeatherBar view={view} location={location} onRetry={onRetry} />);

afterEach(() => vi.restoreAllMocks());

describe('WeatherBar', () => {
  it('pronto: cidade, temperatura, descrição, umidade, frase e famílias', () => {
    setup(ready);
    const bar = screen.getByRole('region', { name: 'Clima de hoje' });
    expect(within(bar).getByText('São Paulo, BRASIL')).toBeInTheDocument();
    expect(within(bar).getByText('28°C')).toBeInTheDocument();
    expect(within(bar).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(bar).getByText('Umidade 61%')).toBeInTheDocument();
    expect(within(bar).getByText('Projeção ideal para dias quentes')).toBeInTheDocument();
    expect(within(bar).getByText('Sillage recomendada')).toBeInTheDocument();
    const list = within(bar).getByRole('list', { name: 'Famílias em destaque hoje' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('pronto: botão de localização dispara o pedido', async () => {
    const request = vi.fn();
    setup(ready, { ...idle, request });
    fireEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }));
    expect(request).toHaveBeenCalledOnce();
  });

  it('localizando: botão ocupado', () => {
    setup(ready, { ...idle, status: 'requesting' });
    expect(screen.getByRole('button', { name: 'Localizando…' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('sem suporte a geolocalização, não mostra o botão', () => {
    setup(ready, { ...idle, supported: false });
    expect(screen.queryByRole('button', { name: /localização/ })).not.toBeInTheDocument();
  });

  it('negação de localização aparece em role="alert"', () => {
    setup(ready, { ...idle, status: 'denied', error: 'Permissão negada.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Permissão negada.');
  });

  it('carregando: skeleton com status ocupado', () => {
    setup({ status: 'loading' });
    expect(screen.getByRole('status', { name: 'Carregando o clima' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('erro: mensagem e tentar de novo', async () => {
    const onRetry = vi.fn();
    setup({ status: 'error', message: 'Clima indisponível no momento.' }, idle, onRetry);
    expect(screen.getByText('Clima indisponível no momento.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('indisponível: avisa que a cidade não foi encontrada', () => {
    setup({ status: 'unavailable' });
    expect(screen.getByText('Clima indisponível')).toBeInTheDocument();
    expect(screen.getByText('Não encontramos o clima da sua cidade.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('offline: mostra "Você está offline"', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    setup({ status: 'unavailable' });
    expect(screen.getByText('Você está offline')).toBeInTheDocument();
  });
});
