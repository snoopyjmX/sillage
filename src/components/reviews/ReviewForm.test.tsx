import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/auth-context';
import { fakeSession } from '@/test/authMock';
import type { UserReview } from '@/types/review';
import { ReviewForm } from './ReviewForm';

const upsertReview = vi.fn();
const deleteReview = vi.fn();
vi.mock('@/services/reviewService', () => ({
  reviewService: {
    upsertReview: (id: string, input: unknown) => upsertReview(id, input),
    deleteReview: (id: string) => deleteReview(id),
    getUserReview: () => Promise.resolve(null),
    getPerfumeReviews: () => Promise.resolve(null),
  },
}));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const session = fakeSession();
const existing: UserReview = {
  id: 'r1',
  perfumeId: 'p1',
  longevity: 2,
  projection: 3,
  comment: 'ok',
  updatedAt: '2026-10-06T12:00:00Z',
};

const setup = (review: UserReview | null = null) => {
  const onDone = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AuthContext.Provider value={{ status: 'authenticated', session, user: session.user }}>
      <QueryClientProvider client={client}>
        <ReviewForm perfumeId="p1" existing={review} onDone={onDone} />
      </QueryClientProvider>
    </AuthContext.Provider>
  );
  return { onDone };
};

const group = (name: string) => screen.getByRole('radiogroup', { name });

describe('ReviewForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fixação e projeção são grupos de rádios com 5 estrelas, sem nenhuma marcada', () => {
    setup();
    for (const name of ['Fixação', 'Projeção']) {
      const radios = within(group(name)).getAllByRole('radio');
      expect(radios).toHaveLength(5);
      expect(radios.every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true);
      // Alvo de toque de 44 px (size-11)
      expect(radios.every((radio) => radio.className.includes('size-11'))).toBe(true);
    }
  });

  it('as setas do teclado movem e escolhem a nota; só uma estrela entra na ordem do Tab', () => {
    setup();
    const radios = within(group('Fixação')).getAllByRole('radio');
    expect(radios.filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
    fireEvent.keyDown(radios[0] as HTMLElement, { key: 'ArrowRight' });
    expect(within(group('Fixação')).getByRole('radio', { name: '2 estrelas' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    fireEvent.keyDown(radios[1] as HTMLElement, { key: 'End' });
    expect(within(group('Fixação')).getByRole('radio', { name: '5 estrelas' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('enviar sem notas mostra os erros e não chama o serviço', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));
    expect(
      await screen.findByText('Escolha a nota de fixação de 1 a 5 estrelas.')
    ).toBeInTheDocument();
    expect(screen.getByText('Escolha a nota de projeção de 1 a 5 estrelas.')).toBeInTheDocument();
    expect(upsertReview).not.toHaveBeenCalled();
  });

  it('envia notas e comentário e avisa que terminou', async () => {
    upsertReview.mockResolvedValue(existing);
    const { onDone } = setup();
    fireEvent.click(within(group('Fixação')).getByRole('radio', { name: '4 estrelas' }));
    fireEvent.click(within(group('Projeção')).getByRole('radio', { name: '5 estrelas' }));
    fireEvent.change(screen.getByLabelText('Comentário (opcional)'), {
      target: { value: 'Dura o dia todo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(upsertReview).toHaveBeenCalledWith('p1', {
      longevity: 4,
      projection: 5,
      comment: 'Dura o dia todo',
    });
  });

  it('edição vem preenchida e remover pede confirmação', async () => {
    deleteReview.mockResolvedValue(undefined);
    const { onDone } = setup(existing);
    expect(within(group('Fixação')).getByRole('radio', { name: '2 estrelas' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByLabelText('Comentário (opcional)')).toHaveValue('ok');

    fireEvent.click(screen.getByRole('button', { name: 'Remover minha avaliação' }));
    expect(deleteReview).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, remover' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(deleteReview).toHaveBeenCalledWith('p1');
  });
});
