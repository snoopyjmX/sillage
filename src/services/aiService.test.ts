import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import type { NezDiscoveryRequest } from './aiService';

const getSession = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: () => getSession() } },
}));

const { aiService } = await import('./aiService');

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const request: NezDiscoveryRequest = {
  climate: 'cold',
  occasion: 'night',
  families: ['woody'],
  useDna: true,
};

beforeEach(() => {
  fetchMock.mockReset();
  getSession.mockReset();
  getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario' } } });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('aiService.discoverNez', () => {
  it('envia o modo discovery com as escolhas e o JWT, e nunca o DNA', async () => {
    fetchMock.mockResolvedValue(json({ text: 'Para a noite fria, o Bossa.', picks: ['bossa'] }));
    await expect(aiService.discoverNez(request)).resolves.toEqual({
      text: 'Para a noite fria, o Bossa.',
      picks: ['bossa'],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/functions/v1/nez-ai');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-do-usuario');
    expect(JSON.parse(init.body as string)).toEqual({ mode: 'discovery', ...request });
  });

  it('sem candidatos o servidor devolve picks vazio, e isso é um resultado válido', async () => {
    fetchMock.mockResolvedValue(json({ text: '', picks: [] }));
    await expect(aiService.discoverNez(request)).resolves.toEqual({ text: '', picks: [] });
  });

  it('sem sessão, session_expired e nenhuma chamada à rede', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(aiService.discoverNez(request)).rejects.toMatchObject({ code: 'session_expired' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('401 vira session_expired', async () => {
    fetchMock.mockResolvedValue(json({ error: 'unauthorized' }, 401));
    await expect(aiService.discoverNez(request)).rejects.toMatchObject({ code: 'session_expired' });
  });

  it('erro do servidor vira nez_failed, sem expor o corpo', async () => {
    fetchMock.mockResolvedValue(json({ error: 'GEMINI_API_KEY inválida' }, 502));
    const error = await aiService.discoverNez(request).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('nez_failed');
    expect(String((error as AppError).message)).not.toContain('GEMINI');
  });

  it('resposta fora do formato vira nez_failed', async () => {
    for (const body of [
      { text: 'oi' },
      { text: 'oi', picks: 'bossa' },
      { text: 1, picks: [] },
      null,
    ]) {
      fetchMock.mockResolvedValue(json(body));
      await expect(aiService.discoverNez(request)).rejects.toMatchObject({ code: 'nez_failed' });
    }
  });

  it('mais de 3 escolhas é recusado', async () => {
    fetchMock.mockResolvedValue(json({ text: 'oi', picks: ['a', 'b', 'c', 'd'] }));
    await expect(aiService.discoverNez(request)).rejects.toMatchObject({ code: 'nez_failed' });
  });

  it('sem rede vira network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(aiService.discoverNez(request)).rejects.toMatchObject({ code: 'network' });
  });
});

describe('aiService.askNez (o chat segue igual)', () => {
  it('manda pergunta, contexto e histórico, sem o campo mode', async () => {
    fetchMock.mockResolvedValue(json({ text: 'Cítricos brilham no calor.' }));
    await expect(
      aiService.askNez({ question: 'Que nota refresca?', context: 'Bossa', history: [] })
    ).resolves.toBe('Cítricos brilham no calor.');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      question: 'Que nota refresca?',
      context: 'Bossa',
      history: [],
    });
  });

  it('resposta sem texto vira nez_failed', async () => {
    fetchMock.mockResolvedValue(json({ text: '' }));
    await expect(aiService.askNez({ question: 'oi' })).rejects.toMatchObject({
      code: 'nez_failed',
    });
  });
});
