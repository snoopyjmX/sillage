// Dica barata, sem carregar o Supabase: este navegador pode ter uma sessão? Quem nunca entrou (nem
// chega por um link de e-mail com token) vê a Landing sem esperar o cliente do Supabase, que fica
// fora do caminho crítico. Na dúvida, devolve true: o caminho lento é sempre o correto.
const STORED_SESSION_KEY = /^sb-.+-auth-token$/;
// Parâmetros que o supabase-js lê da URL (fluxo implícito no hash, PKCE na query) e erros do link
const AUTH_URL_PARAMS = /(?:^|[?#&])(access_token|refresh_token|code|error|error_code|type)=/;

export const mayHaveSession = (): boolean => {
  try {
    const { search, hash } = window.location;
    if (AUTH_URL_PARAMS.test(search) || AUTH_URL_PARAMS.test(hash)) return true;
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key !== null && STORED_SESSION_KEY.test(key)) return true;
    }
    return false;
  } catch {
    return true;
  }
};
