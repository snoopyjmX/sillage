import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import type { PerfumeSummary } from '@/types/catalog';
import type { WeatherView } from '@/types/weather';
import { NezDiscovery } from './NezDiscovery';

const weather = vi.hoisted(() => ({ view: { status: 'unavailable' } as WeatherView }));
vi.mock('@/hooks/useWeather', () => ({ useWeather: () => ({ view: weather.view }) }));

const discoverNez = vi.fn();
vi.mock('@/services/aiService', () => ({
  aiService: { discoverNez: (request: unknown) => discoverNez(request) },
}));

const getSummariesBySlugs = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { getSummariesBySlugs: (slugs: string[]) => getSummariesBySlugs(slugs) },
}));

const bossa: PerfumeSummary = {
  id: 'p1',
  slug: 'bossa',
  name: 'Bossa',
  brandName: 'Granado',
  brandSlug: 'granado',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2023,
  imagePath: null,
  families: ['woody'],
};

const onBack = vi.fn();
const onNavigate = vi.fn();

const renderDiscovery = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <NezDiscovery onBack={onBack} onNavigate={onNavigate} />
      </MemoryRouter>
    </QueryClientProvider>
  );

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

// Percorre os três passos: frio, noite e a família amadeirada
const answerAll = () => {
  click('Frio intenso');
  click('Continuar');
  click('Noite e encontro');
  click('Continuar');
  click('Amadeirado');
  click('Pedir a curadoria');
};

describe('trilha de descoberta do Nez', () => {
  beforeEach(() => {
    weather.view = { status: 'unavailable' };
    discoverNez.mockReset();
    getSummariesBySlugs.mockReset();
    onBack.mockReset();
    onNavigate.mockReset();
  });

  it('começa pelo clima e só avança depois de escolher', () => {
    renderDiscovery();
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Como está o clima?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    click('Ameno');
    expect(screen.getByRole('button', { name: 'Ameno' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('com a previsão pronta, o clima de agora já vem marcado', () => {
    weather.view = {
      status: 'ready',
      location: { latitude: 0, longitude: 0, label: 'Curitiba, PR' },
      weather: { temperature: 8, humidity: 60, code: 3 },
      description: 'Nublado',
      phrase: 'Projeção ideal para dias frios',
      families: ['woody'],
    };
    renderDiscovery();
    expect(screen.getByRole('button', { name: 'Frio intenso' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    expect(screen.getByText(/clima de agora/)).toBeInTheDocument();
  });

  it('o último passo exige uma família ou o DNA para pedir a curadoria', () => {
    renderDiscovery();
    click('Frio intenso');
    click('Continuar');
    click('Trabalho e foco');
    click('Continuar');
    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pedir a curadoria' })).toBeDisabled();
    click('Usar o meu DNA olfativo');
    expect(screen.getByRole('button', { name: 'Pedir a curadoria' })).toBeEnabled();
  });

  it('só guarda 2 famílias: a terceira tira a mais antiga', () => {
    renderDiscovery();
    click('Frio intenso');
    click('Continuar');
    click('Trabalho e foco');
    click('Continuar');
    click('Amadeirado');
    click('Cítrico');
    click('Floral');
    expect(screen.getByRole('button', { name: 'Amadeirado' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Cítrico' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Floral' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Voltar retorna ao passo anterior e, no primeiro, à conversa', () => {
    renderDiscovery();
    click('Voltar à conversa');
    expect(onBack).toHaveBeenCalledTimes(1);
    click('Frio intenso');
    click('Continuar');
    click('Voltar');
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  });

  it('envia as escolhas ao servidor e mostra a curadoria com os perfumes do catálogo', async () => {
    discoverNez.mockResolvedValue({ text: 'Para a noite fria, o Bossa.', picks: ['bossa'] });
    getSummariesBySlugs.mockResolvedValue([bossa]);
    renderDiscovery();
    answerAll();

    await waitFor(() =>
      expect(discoverNez).toHaveBeenCalledWith({
        climate: 'cold',
        occasion: 'night',
        families: ['woody'],
        useDna: false,
      })
    );
    const link = await screen.findByRole('link', { name: 'Ver pirâmide e detalhes' });
    expect(link).toHaveAttribute('href', '/perfumes/bossa');
    expect(getSummariesBySlugs).toHaveBeenCalledWith(['bossa']);
    expect(screen.getByRole('heading', { name: 'Bossa' })).toBeInTheDocument();

    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('sem candidatos mostra o estado vazio e deixa refazer a trilha', async () => {
    discoverNez.mockResolvedValue({ text: '', picks: [] });
    renderDiscovery();
    answerAll();
    expect(await screen.findByText('Nenhum perfume combinou desta vez')).toBeInTheDocument();
    expect(getSummariesBySlugs).not.toHaveBeenCalled();
    click('Refazer a trilha');
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  });

  it('falha mostra erro com Tentar novamente, sem texto técnico, e repete o pedido', async () => {
    discoverNez.mockRejectedValueOnce(new AppError('nez_failed'));
    renderDiscovery();
    answerAll();
    expect(await screen.findByText('O Nez não respondeu')).toBeInTheDocument();
    expect(screen.queryByText(/GEMINI|502/)).not.toBeInTheDocument();

    discoverNez.mockResolvedValueOnce({ text: 'Bossa.', picks: ['bossa'] });
    getSummariesBySlugs.mockResolvedValue([bossa]);
    click('Tentar novamente');
    expect(
      await screen.findByRole('link', { name: 'Ver pirâmide e detalhes' })
    ).toBeInTheDocument();
    expect(discoverNez).toHaveBeenCalledTimes(2);
  });

  it('enquanto o Nez escolhe, mostra o skeleton de carregamento', async () => {
    discoverNez.mockReturnValue(new Promise(() => undefined));
    renderDiscovery();
    answerAll();
    expect(
      await screen.findByRole('status', { name: 'O Nez está escolhendo' })
    ).toBeInTheDocument();
  });
});
