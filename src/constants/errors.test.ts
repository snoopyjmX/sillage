import { describe, expect, it } from 'vitest';
import { AppError, ERROR_MESSAGES, getErrorMessage, toAuthError } from './errors';

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
