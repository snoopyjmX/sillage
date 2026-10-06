// Nez, o Mestre Perfumista virtual (Fase 10). Só usuário logado: o JWT é validado com
// auth.getUser(token) (verify_jwt fica desligado no gateway para o 401 sair em JSON, no nosso formato).
// A chave do Gemini vem do secret GEMINI_API_KEY e nunca chega ao front. Erros do provedor não
// vazam: o front recebe só um código estável.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { GoogleGenAI } from 'npm:@google/genai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
// Usado quando o principal segue indisponível depois do retry. `gemini-flash-latest` e os 2.5 não
// servem: o alias engasga em picos de demanda (503 depois de ~20 s) e os 2.5 saíram para contas novas.
const FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-3.5-flash';
const MAX_QUESTION = 500;
const MAX_CONTEXT = 4000;
// Teto da resposta: 2 a 3 frases curtas. Com thinking mínimo, os tokens vão para o texto.
const MAX_OUTPUT_TOKENS = 220;
// Orçamento total da requisição, abaixo do wall clock do isolate da Edge Function
const DEADLINE_MS = 20_000;
// Cada tentativa tem prazo próprio: modelo sobrecarregado demora a falhar, e a reserva precisa de tempo
const ATTEMPT_MS = 8_000;
const RETRY_DELAY_MS = 600;
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

const SYSTEM_PROMPT =
  'Você é Nez, o Mestre Perfumista (Le Nez) virtual da casa Sillage. Você fala português de forma elegante, poética e concisa: no máximo 3 frases curtas, sem listas nem títulos. Você baseia suas recomendações nas notas e famílias olfativas dos perfumes que o usuário enviar no contexto.';

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

  // SUPABASE_URL e SUPABASE_ANON_KEY são injetados pelo runtime (local e produção). Token que o
  // Auth não valida é 401, sem exceção: nada de aceitar JWT só por estar bem formado.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let userValid = false;
  try {
    const { data, error: authError } = await supabase.auth.getUser(token);
    userValid = !authError && Boolean(data.user);
  } catch (error) {
    console.error('nez-ai: falha ao validar o token', error);
  }
  if (!userValid) return json({ error: 'unauthorized' }, 401);

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

  // 3. Gemini: 1 retry no modelo principal e depois o modelo de reserva, só para erro transitório
  // (503 "high demand", 429, 5xx, rede). Tudo dentro de um prazo total para não estourar o isolate.
  const ai = new GoogleGenAI({ apiKey });
  const prompt = context
    ? `Contexto dos perfumes:\n${context}\n\nPergunta: ${question}`
    : `Pergunta: ${question}`;
  const deadline = AbortSignal.timeout(DEADLINE_MS);

  const generate = async (model: string): Promise<string | null> => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // Família 3.x pensa por padrão (e gasta os tokens da resposta); `minimal` mantém só o texto
        thinkingConfig: { thinkingLevel: 'MINIMAL' },
        abortSignal: AbortSignal.any([deadline, AbortSignal.timeout(ATTEMPT_MS)]),
      },
    });
    return response.text?.trim() || null;
  };

  const attempts = [MODEL, MODEL, FALLBACK_MODEL];
  for (const [index, model] of attempts.entries()) {
    if (deadline.aborted) break;
    try {
      const text = await generate(model);
      if (text) return json({ text });
    } catch (error) {
      const status = (error as { status?: number }).status;
      console.warn(`nez-ai: tentativa ${index + 1} (${model}) falhou`, status ?? error);
      // Erro definitivo (chave inválida, pedido recusado): repetir não adianta
      if (status !== undefined && !TRANSIENT_STATUS.has(status)) break;
    }
    if (index < attempts.length - 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  return json({ error: 'upstream_failed' }, 502);
});
