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
  | 'session_expired'
  | 'collection_failed'
  | 'daily_failed'
  | 'daily_not_owned'
  | 'review_failed'
  | 'review_forbidden'
  | 'nez_failed'
  | 'weather_failed'
  | 'weather_timeout'
  | 'weather_rate_limited'
  | 'location_denied'
  | 'location_failed'
  | 'profile_load_failed'
  | 'profile_failed'
  | 'avatar_failed'
  | 'avatar_too_large'
  | 'avatar_invalid_type'
  | 'account_delete_failed'
  | 'share_card_failed'
  | 'share_failed'
  | 'dna_failed'
  | 'recap_failed';

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
  collection_failed: 'Não foi possível atualizar sua coleção. Tente novamente em instantes.',
  daily_failed: 'Não foi possível carregar o Perfume do Dia. Tente novamente em instantes.',
  daily_not_owned:
    'Você só pode escolher como Perfume do Dia uma fragrância que está na sua coleção em “Tenho”.',
  review_failed: 'Não foi possível salvar sua avaliação. Tente novamente em instantes.',
  review_forbidden:
    'Para avaliar, coloque o perfume em “Tenho” ou escolha-o como Perfume do Dia primeiro.',
  nez_failed: 'O Nez não conseguiu responder agora. Tente novamente em instantes.',
  weather_failed: 'Clima indisponível no momento. Tente novamente em instantes.',
  weather_timeout: 'O serviço de clima demorou a responder. Tente novamente em instantes.',
  weather_rate_limited: 'O serviço de clima recebeu pedidos demais. Tente de novo mais tarde.',
  location_denied: 'Não foi possível usar a sua localização. Verifique a permissão do navegador.',
  location_failed: 'Não conseguimos obter a sua localização agora. Tente novamente em instantes.',
  profile_load_failed: 'Não foi possível carregar o seu perfil. Tente novamente em instantes.',
  profile_failed: 'Não foi possível salvar o seu perfil. Tente novamente em instantes.',
  avatar_failed: 'Não foi possível salvar sua foto de perfil. Tente novamente em instantes.',
  avatar_too_large: 'A imagem escolhida é muito grande. Escolha uma foto de até 5 MB.',
  avatar_invalid_type: 'Formato de imagem não suportado. Use JPG, PNG ou WebP.',
  account_delete_failed: 'Não foi possível excluir a sua conta. Tente novamente em instantes.',
  share_card_failed: 'Não foi possível gerar a imagem agora. Tente novamente em instantes.',
  share_failed: 'Não foi possível compartilhar a imagem. Tente baixá-la.',
  dna_failed: 'Não foi possível carregar o seu DNA olfativo. Tente novamente em instantes.',
  recap_failed: 'Não foi possível montar a sua retrospectiva agora. Tente novamente em instantes.',
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
