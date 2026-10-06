// Nez, o Mestre Perfumista virtual (Fase 10). Só usuário logado: o JWT é validado com
// auth.getUser(token) (verify_jwt fica desligado no gateway para o 401 sair em JSON, no nosso formato).
// A chave do Gemini vem do secret GEMINI_API_KEY e nunca chega ao front. Erros do provedor não
// vazam: o front recebe só um código estável.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { GoogleGenAI } from 'npm:@google/genai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const MAX_QUESTION = 500;
const MAX_CONTEXT = 4000;

const SYSTEM_PROMPT =
  'Você é Nez, o Mestre Perfumista (Le Nez) virtual da casa Sillage. Você fala português de forma elegante, poética e concisa (máx 3 frases). Você baseia suas recomendações nas notas e famílias olfativas dos perfumes que o usuário enviar no contexto.';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

const readBearer = (req: Request): string | null => {
  const header = req.headers.get('Authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const asText = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim().slice(0, max) : null;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // 1. Autenticação: sem Authorization, ou token que o Auth não reconhece, é 401
  const token = readBearer(req);
  if (!token) return json({ error: 'unauthorized' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data.user) return json({ error: 'unauthorized' }, 401);

  // 2. Entrada: a pergunta e, opcionalmente, o contexto (perfume, notas e famílias)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }
  const payload = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const question = asText(payload.question, MAX_QUESTION);
  if (!question) return json({ error: 'invalid_request' }, 400);
  const context = asText(payload.context, MAX_CONTEXT);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.error('nez-ai: GEMINI_API_KEY ausente');
    return json({ error: 'unavailable' }, 503);
  }

  // 3. Gemini
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = context
      ? `Contexto dos perfumes:\n${context}\n\nPergunta: ${question}`
      : `Pergunta: ${question}`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.8, maxOutputTokens: 300 },
    });
    const text = response.text?.trim();
    if (!text) return json({ error: 'empty_response' }, 502);
    return json({ text });
  } catch (error) {
    console.error('nez-ai: falha no Gemini', error);
    return json({ error: 'upstream_failed' }, 502);
  }
});
