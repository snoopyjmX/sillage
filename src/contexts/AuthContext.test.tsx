import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mayHaveSession } from '@/lib/sessionHint';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

// Sem sessão guardada neste navegador: o app não espera o Supabase para mostrar a Landing
describe('AuthProvider: atalho de visitante', () => {
  beforeEach(() => {
    auth.reset();
    vi.mocked(mayHaveSession).mockReturnValue(false);
  });

  it('mostra a Landing sem esperar o Supabase e depois assina as mudanças de sessão', async () => {
    renderApp('/');
    expect(
      await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas' })
    ).toBeInTheDocument();
    await vi.waitFor(() => expect(auth.service.onAuthStateChange).toHaveBeenCalled());

    // Um login feito depois do carregamento tardio do Supabase ainda é percebido: a Landing sai
    await act(async () => auth.emit('SIGNED_IN', fakeSession()));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Descubra perfumes pelas suas notas' })
      ).toBeNull()
    );
  });

  it('login rápido, antes da assinatura, também é aplicado pela leitura inicial', async () => {
    auth.setInitialSession(fakeSession());
    renderApp('/');
    await vi.waitFor(() => expect(auth.service.getSession).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Descubra perfumes pelas suas notas' })
      ).toBeNull()
    );
  });
});
