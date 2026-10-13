// CORS compartilhado pelas Edge Functions chamadas pelo app (nez-ai, delete-account).
// Origens do app que podem chamar a função (lista separada por vírgula no secret ALLOWED_ORIGINS,
// ex.: https://sillage.vercel.app). Sem o secret, só o ambiente local. Origem fora da lista não
// recebe Access-Control-Allow-Origin e o navegador bloqueia a resposta; o JWT segue obrigatório.
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

export const corsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
};
