import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

describe('páginas de autenticação', () => {
  beforeEach(() => auth.reset());

  it('login: erros de campo ficam ligados ao input por aria-describedby', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    const email = screen.getByLabelText('E-mail');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    const describedBy = email.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)).toHaveTextContent('Informe seu e-mail.');
    expect(auth.service.signIn).not.toHaveBeenCalled();
  });

  it('login: credencial inválida mostra mensagem amigável, não a do Supabase', async () => {
    auth.service.signIn.mockRejectedValue(new AppError('invalid_credentials'));
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
    expect(auth.service.signIn).toHaveBeenCalledWith('ana@exemplo.com', 'errada123');
  });

  it('login: botão fica ocupado durante o envio e ignora o segundo clique', async () => {
    let finish: () => void = () => undefined;
    auth.service.signIn.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    const busy = await screen.findByRole('button', { name: 'Entrando…' });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(busy);
    expect(auth.service.signIn).toHaveBeenCalledOnce();
    await act(async () => finish());
  });

  it('cadastro: envia nome, e-mail e senha', async () => {
    auth.service.signUp.mockResolvedValue({ needsEmailConfirmation: false });
    renderApp('/register');
    await screen.findByRole('heading', { name: 'Criar conta', level: 1 });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(auth.service.signUp).toHaveBeenCalled());
    expect(auth.service.signUp.mock.calls[0]?.slice(0, 4)).toEqual([
      'ana@exemplo.com',
      'segredo123',
      'Ana',
      expect.stringMatching(/\//) as unknown as string,
    ]);
  });

  it('cadastro: e-mail repetido mostra a mensagem mapeada', async () => {
    auth.service.signUp.mockRejectedValue(new AppError('email_taken'));
    renderApp('/register');
    await screen.findByRole('heading', { name: 'Criar conta', level: 1 });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('já está cadastrado');
  });

  it('esqueci a senha: resposta neutra, sem revelar se a conta existe', async () => {
    auth.service.sendPasswordReset.mockResolvedValue(undefined);
    renderApp('/forgot-password');
    await screen.findByRole('heading', { name: 'Recuperar senha', level: 1 });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ninguem@exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Se esse e-mail estiver cadastrado'
    );
  });

  it('redefinir senha sem sessão mostra "link inválido ou expirado"', async () => {
    renderApp('/reset-password');
    expect(
      await screen.findByRole('heading', { name: 'Link inválido ou expirado' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir novo link' })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('redefinir senha com sessão de recuperação valida confirmação e salva', async () => {
    auth.setInitialSession(fakeSession());
    auth.service.updatePassword.mockResolvedValue(undefined);
    const { router } = renderApp('/reset-password');
    await screen.findByRole('heading', { name: 'Nova senha', level: 1 });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'novasenha1' } });
    fireEvent.change(screen.getByLabelText('Repita a nova senha'), {
      target: { value: 'diferente1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByText('As senhas não são iguais.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Repita a nova senha'), {
      target: { value: 'novasenha1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    await waitFor(() => expect(auth.service.updatePassword).toHaveBeenCalledWith('novasenha1'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
