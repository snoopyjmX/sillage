import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AsyncBoundary } from './async-boundary';

const setOnline = (online: boolean) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
};

const renderBoundary = (props: Partial<React.ComponentProps<typeof AsyncBoundary>> = {}) =>
  render(
    <AsyncBoundary
      status="success"
      loading={<p>carregando</p>}
      empty={<p>nada por aqui</p>}
      {...props}
    >
      <p>conteúdo</p>
    </AsyncBoundary>
  );

describe('AsyncBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mostra o skeleton enquanto carrega', () => {
    renderBoundary({ status: 'pending' });
    expect(screen.getByText('carregando')).toBeInTheDocument();
  });

  it('mostra o conteúdo no sucesso', () => {
    renderBoundary();
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há itens', () => {
    renderBoundary({ isEmpty: true });
    expect(screen.getByText('nada por aqui')).toBeInTheDocument();
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument();
  });

  it('mostra o erro com a ação de tentar de novo', () => {
    const onRetry = vi.fn();
    renderBoundary({ status: 'error', onRetry, errorDescription: 'Mensagem segura.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Mensagem segura.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  describe('offline', () => {
    it('sem dados, explica que está offline em vez de carregar ou de mostrar erro', () => {
      setOnline(false);
      renderBoundary({ status: 'pending' });
      expect(screen.getByRole('heading', { name: 'Você está offline' })).toBeInTheDocument();
      expect(screen.queryByText('carregando')).not.toBeInTheDocument();
    });

    it('um erro vindo da falta de rede também vira o estado offline', () => {
      setOnline(false);
      renderBoundary({ status: 'error' });
      expect(screen.getByRole('heading', { name: 'Você está offline' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('com dados na mão, segue mostrando o conteúdo', () => {
      setOnline(false);
      renderBoundary({ status: 'success' });
      expect(screen.getByText('conteúdo')).toBeInTheDocument();
    });

    it('oferece tentar de novo e reage quando a conexão volta', () => {
      setOnline(false);
      const onRetry = vi.fn();
      renderBoundary({ status: 'pending', onRetry });
      fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
      expect(onRetry).toHaveBeenCalledOnce();

      setOnline(true);
      expect(screen.getByText('carregando')).toBeInTheDocument();
    });
  });
});
