import { afterEach, describe, expect, it, vi } from 'vitest';

// O setup global troca este módulo por um mock: aqui vale o real
const { mayHaveSession } = await vi.importActual<typeof import('./sessionHint')>('./sessionHint');

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('mayHaveSession', () => {
  it('sem sessão guardada nem parâmetros na URL: false', () => {
    expect(mayHaveSession()).toBe(false);
  });

  it('com a chave de sessão do supabase-js no localStorage: true', () => {
    window.localStorage.setItem('sb-abc-auth-token', '{}');
    expect(mayHaveSession()).toBe(true);
  });

  it('outras chaves do localStorage não contam', () => {
    window.localStorage.setItem('sillage-theme', 'dark');
    expect(mayHaveSession()).toBe(false);
  });

  it.each([
    ['/auth/confirmed#access_token=abc&type=signup'],
    ['/auth/confirmed?code=abc'],
    ['/auth/confirmed#error=access_denied&error_code=otp_expired'],
  ])('link de e-mail com token ou erro na URL (%s): true', (url) => {
    window.history.replaceState(null, '', url);
    expect(mayHaveSession()).toBe(true);
  });
});
