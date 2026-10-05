// Mensagens ao usuário por código estável. Nenhum texto técnico do Supabase chega à interface.
export type ErrorCode =
  | 'network'
  | 'invalid_request'
  | 'not_found'
  | 'unknown'
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'same_password'
  | 'email_not_confirmed'
  | 'rate_limited'
  | 'session_expired';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  network: 'Sem conexão com o servidor. Verifique sua internet e tente de novo.',
  invalid_request: 'Não foi possível processar essa busca. Ajuste os filtros e tente de novo.',
  not_found: 'Não encontramos o que você procurou.',
  unknown: 'Não foi possível carregar agora. Tente novamente em instantes.',
  invalid_credentials: 'E-mail ou senha incorretos. Confira os dados e tente de novo.',
  email_taken: 'Esse e-mail já está cadastrado. Entre na sua conta ou recupere a senha.',
  weak_password: 'Essa senha é fraca demais. Use pelo menos 8 caracteres, com letras e números.',
  same_password: 'A nova senha precisa ser diferente da senha atual.',
  email_not_confirmed:
    'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.',
  rate_limited: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.',
  session_expired: 'O link expirou ou já foi usado. Peça um novo e-mail de recuperação.',
};

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, options?: { cause?: unknown }) {
    super(ERROR_MESSAGES[code], options);
    this.name = 'AppError';
    this.code = code;
  }
}

interface SupabaseLikeError {
  code?: string;
  message?: string;
  status?: number;
}

const isNetworkError = (error: SupabaseLikeError): boolean =>
  /fetch|network/i.test(error.message ?? '');

// Converte o erro de uma chamada ao Supabase em AppError (código estável).
export const toAppError = (error: SupabaseLikeError): AppError => {
  if (error.code === '22023') return new AppError('invalid_request', { cause: error });
  // supabase-js devolve "Failed to fetch"/"NetworkError" quando não há rede
  if (isNetworkError(error)) return new AppError('network', { cause: error });
  return new AppError('unknown', { cause: error });
};

// Códigos estáveis do GoTrue (Supabase Auth) -> código de UI. O texto cru nunca é exibido.
const AUTH_CODES: Record<string, ErrorCode> = {
  invalid_credentials: 'invalid_credentials',
  user_already_exists: 'email_taken',
  email_exists: 'email_taken',
  weak_password: 'weak_password',
  same_password: 'same_password',
  email_not_confirmed: 'email_not_confirmed',
  over_request_rate_limit: 'rate_limited',
  over_email_send_rate_limit: 'rate_limited',
  session_not_found: 'session_expired',
  session_expired: 'session_expired',
  otp_expired: 'session_expired',
  bad_jwt: 'session_expired',
  validation_failed: 'invalid_request',
};

export const toAuthError = (error: SupabaseLikeError): AppError => {
  const mapped = error.code ? AUTH_CODES[error.code] : undefined;
  if (mapped) return new AppError(mapped, { cause: error });
  if (error.status === 429) return new AppError('rate_limited', { cause: error });
  if (error.status === 0 || isNetworkError(error)) return new AppError('network', { cause: error });
  return new AppError('unknown', { cause: error });
};

export const getErrorMessage = (error: unknown): string =>
  error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
