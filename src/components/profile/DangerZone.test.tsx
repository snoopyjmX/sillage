import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { DangerZone } from './DangerZone';

const deleteAccount = vi.fn();
vi.mock('@/services/authService', () => ({
  authService: { deleteAccount: () => deleteAccount() },
}));
const toastSuccess = vi.fn();
vi.mock('@/lib/toast', () => ({ toast: { success: (m: string) => toastSuccess(m) } }));

const openDialog = async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DangerZone />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));
  return screen.findByRole('dialog', { name: 'Excluir a sua conta?' });
};

const confirmButton = () => screen.getByRole('button', { name: 'Excluir conta definitivamente' });

describe('DangerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('o botão fica desativado até digitar EXCLUIR exatamente', async () => {
    await openDialog();
    const input = screen.getByLabelText('Digite EXCLUIR para confirmar');
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(input, { target: { value: 'excluir' } });
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    expect(confirmButton()).toBeEnabled();
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it('confirmar chama a exclusão e avisa', async () => {
    deleteAccount.mockResolvedValueOnce(undefined);
    await openDialog();
    fireEvent.change(screen.getByLabelText('Digite EXCLUIR para confirmar'), {
      target: { value: 'EXCLUIR' },
    });
    fireEvent.click(confirmButton());
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Sua conta foi excluída.'));
  });

  it('falha mostra a mensagem amigável e mantém o dialog aberto', async () => {
    deleteAccount.mockRejectedValueOnce(new AppError('account_delete_failed'));
    await openDialog();
    fireEvent.change(screen.getByLabelText('Digite EXCLUIR para confirmar'), {
      target: { value: 'EXCLUIR' },
    });
    fireEvent.click(confirmButton());
    expect(
      await screen.findByText('Não foi possível excluir a sua conta. Tente novamente em instantes.')
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cancelar fecha e limpa o campo ao reabrir', async () => {
    await openDialog();
    fireEvent.change(screen.getByLabelText('Digite EXCLUIR para confirmar'), {
      target: { value: 'EXCLUIR' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));
    expect(await screen.findByLabelText('Digite EXCLUIR para confirmar')).toHaveValue('');
  });

  it('offline: o botão fica desativado mesmo com o texto certo', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    await openDialog();
    fireEvent.change(screen.getByLabelText('Digite EXCLUIR para confirmar'), {
      target: { value: 'EXCLUIR' },
    });
    expect(confirmButton()).toBeDisabled();
    vi.restoreAllMocks();
  });
});
