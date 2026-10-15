import { describe, expect, it } from 'vitest';
import {
  AppError,
  ERROR_MESSAGES,
  getErrorMessage,
  isSilentError,
  toAuthError,
  toPasskeyError,
} from './errors';

describe('toAuthError', () => {
  it.each([
    ['invalid_credentials', 'invalid_credentials'],
    ['user_already_exists', 'email_taken'],
    ['email_exists', 'email_taken'],
    ['weak_password', 'weak_password'],
    ['same_password', 'same_password'],
    ['over_email_send_rate_limit', 'rate_limited'],
    ['otp_expired', 'session_expired'],
  ])('mapeia %s para %s', (code, expected) => {
    expect(toAuthError({ code, message: 'texto cru do servidor' }).code).toBe(expected);
  });

  it('trata 429 e falha de rede', () => {
    expect(toAuthError({ status: 429 }).code).toBe('rate_limited');
    expect(toAuthError({ status: 0, message: 'Failed to fetch' }).code).toBe('network');
  });

  it('código desconhecido vira unknown e nunca expõe a mensagem crua', () => {
    const error = toAuthError({ code: 'xyz', message: 'duplicate key value violates constraint' });
    expect(error.code).toBe('unknown');
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.unknown);
    expect(error.message).not.toMatch(/duplicate key/);
  });
});

describe('daily_not_owned', () => {
  it('tem mensagem própria orientando a usar "Tenho"', () => {
    expect(getErrorMessage(new AppError('daily_not_owned'))).toBe(ERROR_MESSAGES.daily_not_owned);
    expect(ERROR_MESSAGES.daily_not_owned).toContain('“Tenho”');
  });
});

describe('toPasskeyError', () => {
  const domError = (name: string) => Object.assign(new Error('texto cru do navegador'), { name });

  it('cancelamento do diálogo do sistema (NotAllowedError repassado) é silencioso', () => {
    const error = toPasskeyError({
      code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
      message: 'The operation either timed out or was not allowed.',
      cause: domError('NotAllowedError'),
    });
    expect(error.code).toBe('passkey_cancelled');
    expect(isSilentError(error)).toBe(true);
  });

  it('cerimônia abortada (ERROR_CEREMONY_ABORTED) é silenciosa', () => {
    expect(toPasskeyError({ code: 'ERROR_CEREMONY_ABORTED' }).code).toBe('passkey_cancelled');
  });

  it('aparelho já cadastrado tem mensagem própria', () => {
    expect(toPasskeyError({ code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' }).code).toBe(
      'passkey_already_registered'
    );
  });

  it('NotSupportedError vira passkey_not_supported', () => {
    expect(toPasskeyError({ cause: domError('NotSupportedError') }).code).toBe(
      'passkey_not_supported'
    );
  });

  it('desafio expirado e erros desconhecidos viram passkey_failed, sem texto cru', () => {
    const error = toPasskeyError({
      code: 'webauthn_challenge_expired',
      message: 'challenge expired',
    });
    expect(error.code).toBe('passkey_failed');
    expect(error.message).not.toMatch(/challenge/);
    expect(isSilentError(error)).toBe(false);
  });

  it('rede e limite de tentativas mantêm a mensagem própria', () => {
    expect(toPasskeyError({ status: 0, message: 'Failed to fetch' }).code).toBe('network');
    expect(toPasskeyError({ status: 429 }).code).toBe('rate_limited');
  });
});
