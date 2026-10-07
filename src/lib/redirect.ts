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

// Visitante em rota protegida (ou desconhecida) volta para a Landing, em "/", levando o destino.
export const buildGatePath = (from: string): string =>
  `${DEFAULT_REDIRECT}?redirect=${encodeURIComponent(from)}`;

// Anexa `?redirect=` (já saneado) a um caminho de autenticação; sem destino válido, devolve o caminho.
export const withRedirect = (path: string, redirect: string | null | undefined): string => {
  const safe = getSafeRedirect(redirect);
  return safe === DEFAULT_REDIRECT ? path : `${path}?redirect=${encodeURIComponent(safe)}`;
};
