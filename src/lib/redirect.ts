// `?redirect=` é entrada do usuário: só caminhos internos passam (evita open redirect).
export const DEFAULT_REDIRECT = '/';

export const getSafeRedirect = (value: string | null | undefined): string => {
  if (!value || !value.startsWith('/')) return DEFAULT_REDIRECT;
  // "//host" e "/\host" são interpretados pelo navegador como outra origem
  if (value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_REDIRECT;
  // Voltar para as telas de auth criaria um laço
  if (/^\/(login|register|forgot-password|reset-password)(\/|\?|#|$)/.test(value)) {
    return DEFAULT_REDIRECT;
  }
  return value;
};

export const buildLoginPath = (from: string): string =>
  `/login?redirect=${encodeURIComponent(from)}`;
