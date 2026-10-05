// Mensagens ao usuário por código estável. Nenhum texto técnico do Supabase chega à interface.
export type ErrorCode = 'network' | 'invalid_request' | 'unknown';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  network: 'Sem conexão com o servidor. Verifique sua internet e tente de novo.',
  invalid_request: 'Não foi possível processar essa busca. Ajuste os filtros e tente de novo.',
  unknown: 'Não foi possível carregar agora. Tente novamente em instantes.',
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
}

// Converte o erro de uma chamada ao Supabase em AppError (código estável).
export const toAppError = (error: SupabaseLikeError): AppError => {
  if (error.code === '22023') return new AppError('invalid_request', { cause: error });
  // supabase-js devolve "Failed to fetch"/"NetworkError" quando não há rede
  if (/fetch|network/i.test(error.message ?? '')) return new AppError('network', { cause: error });
  return new AppError('unknown', { cause: error });
};

export const getErrorMessage = (error: unknown): string =>
  error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
