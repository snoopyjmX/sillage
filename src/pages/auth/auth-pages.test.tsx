import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireConfetti } from '@/components/ui/confetti';
import { AppError } from '@/constants/errors';
import { getBrowserTimezone } from '@/lib/timezone';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

vi.mock('@/components/ui/confetti', () => ({ fireConfetti: vi.fn() }));

describe('páginas de autenticação', () => {
  beforeEach(() => {
    auth.reset();
    vi.mocked(fireConfetti).mockClear();
  });

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
      // O fuso é o do navegador: UTC no CI, São Paulo na máquina de quem roda local
      getBrowserTimezone(),
    ]);
  });

  it('cadastro: digitar a senha mostra o medidor de força', async () => {
    renderApp('/register');
    await screen.findByRole('heading', { name: 'Criar conta', level: 1 });
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    expect(await screen.findByRole('meter', { name: 'Força da senha' })).toBeInTheDocument();
  });

  it('redefinir senha: o medidor aparece uma vez, no campo "Nova senha"', async () => {
    auth.setInitialSession(fakeSession());
    renderApp('/reset-password');
    await screen.findByRole('heading', { name: 'Nova senha', level: 1 });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'novasenha1' } });
    expect(await screen.findAllByRole('meter')).toHaveLength(1);
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

  it('login: botão alterna a visibilidade da senha com rótulo em pt-BR', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    const password = screen.getByLabelText('Senha');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('páginas de auth ficam fora do AppShell e têm link Voltar para a Home', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/');
  });

  it('cadastro bem-sucedido dispara os confetes', async () => {
    auth.service.signUp.mockResolvedValue({ needsEmailConfirmation: true });
    renderApp('/register');
    await screen.findByRole('heading', { name: 'Criar conta', level: 1 });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(fireConfetti).toHaveBeenCalledOnce());
  });

  it('cadastro com erro não dispara confetes', async () => {
    auth.service.signUp.mockRejectedValue(new AppError('email_taken'));
    renderApp('/register');
    await screen.findByRole('heading', { name: 'Criar conta', level: 1 });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await screen.findByRole('alert');
    expect(fireConfetti).not.toHaveBeenCalled();
  });

  it('/auth/confirmed com sessão mostra "Conta confirmada" e o caminho para o início', async () => {
    auth.setInitialSession(fakeSession());
    renderApp('/auth/confirmed');
    expect(
      await screen.findByRole('heading', { name: 'Conta confirmada', level: 1 })
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/');
  });

  it('/auth/confirmed sem sessão mostra link expirado e reenvia o e-mail', async () => {
    auth.service.resendConfirmation.mockResolvedValue(undefined);
    renderApp('/auth/confirmed');
    expect(
      await screen.findByRole('heading', { name: 'Link inválido ou expirado', level: 1 })
    ).toBeVisible();

    const resend = screen.getByRole('button', { name: 'Reenviar e-mail de confirmação' });
    expect(resend).toHaveAttribute('aria-disabled', 'true');
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar e-mail de confirmação' }));

    await waitFor(() =>
      expect(auth.service.resendConfirmation).toHaveBeenCalledWith('ana@exemplo.com')
    );
    // Cooldown visível: não dá para pedir de novo na hora
    expect(await screen.findByRole('button', { name: /Reenviar em [0-9]+ s/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByRole('status')).toHaveTextContent('enviamos um novo link');
  });

  it('/auth/confirmed: falha no reenvio mostra a mensagem mapeada', async () => {
    auth.service.resendConfirmation.mockRejectedValue(new AppError('rate_limited'));
    renderApp('/auth/confirmed');
    await screen.findByRole('heading', { name: 'Link inválido ou expirado', level: 1 });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar e-mail de confirmação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
  });

  it('login com e-mail não confirmado oferece reenviar o link para o e-mail digitado', async () => {
    auth.service.signIn.mockRejectedValue(new AppError('email_not_confirmed'));
    auth.service.resendConfirmation.mockResolvedValue(undefined);
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Confirme seu e-mail');
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar e-mail de confirmação' }));
    await waitFor(() =>
      expect(auth.service.resendConfirmation).toHaveBeenCalledWith('ana@exemplo.com')
    );
  });

  it('login com outro erro não mostra o botão de reenviar', async () => {
    auth.service.signIn.mockRejectedValue(new AppError('invalid_credentials'));
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');
    expect(
      screen.queryByRole('button', { name: 'Reenviar e-mail de confirmação' })
    ).not.toBeInTheDocument();
  });

  it('cadastro com confirmação pendente permite reenviar o e-mail', async () => {
    auth.service.signUp.mockResolvedValue({ needsEmailConfirmation: true });
    auth.service.resendConfirmation.mockResolvedValue(undefined);
    renderApp('/register');
    await screen.findByRole('heading', { name: 'Criar conta', level: 1 });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Reenviar e-mail de confirmação' }));
    await waitFor(() =>
      expect(auth.service.resendConfirmation).toHaveBeenCalledWith('ana@exemplo.com')
    );
  });
});

describe('login por biometria', () => {
  const stubSupport = (available: boolean) =>
    vi.stubGlobal(
      'PublicKeyCredential',
      Object.assign(() => undefined, {
        isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(available),
      })
    );
  const passkeyButton = () =>
    screen.findByRole('button', { name: 'Entrar com Face ID ou Digital' });

  beforeEach(() => {
    auth.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sem suporte no navegador mostra só e-mail e senha', async () => {
    stubSupport(false);
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    await act(async () => undefined);
    expect(screen.queryByRole('button', { name: /Face ID/ })).toBeNull();
    expect(screen.queryByText('ou com e-mail e senha')).toBeNull();
  });

  it('com suporte mostra o botão e o divisor, e entra sem pedir a senha', async () => {
    stubSupport(true);
    auth.service.signInWithPasskey.mockResolvedValue(undefined);
    renderApp('/login');
    fireEvent.click(await passkeyButton());
    expect(screen.getByText('ou com e-mail e senha')).toBeInTheDocument();
    await waitFor(() => expect(auth.service.signInWithPasskey).toHaveBeenCalled());
    expect(auth.service.signIn).not.toHaveBeenCalled();
  });

  it('cancelar a biometria não mostra alerta', async () => {
    stubSupport(true);
    auth.service.signInWithPasskey.mockRejectedValue(new AppError('passkey_cancelled'));
    renderApp('/login');
    fireEvent.click(await passkeyButton());
    await waitFor(() => expect(auth.service.signInWithPasskey).toHaveBeenCalled());
    await act(async () => undefined);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falha na biometria mostra a mensagem mapeada e sugere a senha', async () => {
    stubSupport(true);
    auth.service.signInWithPasskey.mockRejectedValue(new AppError('passkey_failed'));
    renderApp('/login');
    fireEvent.click(await passkeyButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível autenticar com biometria. Tente novamente ou use sua senha.'
    );
  });

  it('com sucesso volta ao destino original (?redirect=)', async () => {
    stubSupport(true);
    auth.service.signInWithPasskey.mockImplementation(() => {
      auth.emit('SIGNED_IN', fakeSession());
      return Promise.resolve();
    });
    const { router } = renderApp('/login?redirect=%2Fcollection');
    fireEvent.click(await passkeyButton());
    await waitFor(() => expect(router.state.location.pathname).toBe('/collection'));
  });
});
