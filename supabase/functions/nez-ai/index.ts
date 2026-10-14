// Nez, o Mestre Perfumista virtual (Fase 10). Só usuário logado: o JWT é validado com
// auth.getUser(token) (verify_jwt fica desligado no gateway para o 401 sair em JSON, no nosso formato).
// A chave do Gemini vem do secret GEMINI_API_KEY e nunca chega ao front. Erros do provedor não
// vazam: o front recebe só um código estável.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { GoogleGenAI, type GenerateContentConfig } from 'npm:@google/genai';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildDiscoveryPrompt,
  buildResponseSchema,
  CANDIDATE_LIMIT,
  climateFamilies,
  DISCOVERY_SYSTEM_PROMPT,
  parseCandidates,
  parseDiscoveryRequest,
  preferredFamilies,
  topDnaFamilies,
  validateAnswer,
} from './discovery.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
// Usado quando o principal segue indisponível depois do retry. `gemini-flash-latest` e os 2.5 não
// servem: o alias engasga em picos de demanda (503 depois de ~20 s) e os 2.5 saíram para contas novas.
const FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-3.5-flash';
const MAX_QUESTION = 500;
const MAX_CONTEXT = 4000;
// Memória da conversa: só as últimas mensagens, cada uma com tamanho limitado
const MAX_HISTORY = 6;
const MAX_HISTORY_TEXT = 1200;
// Teto da resposta (2 a 4 frases, com folga para não cortar no meio). Com thinking mínimo, os tokens vão para o texto.
const MAX_OUTPUT_TOKENS = 380;
// A descoberta devolve JSON (texto + slugs), então precisa de mais folga que o chat
const DISCOVERY_MAX_OUTPUT_TOKENS = 700;
// Orçamento total da requisição, abaixo do wall clock do isolate da Edge Function
const DEADLINE_MS = 20_000;
// Cada tentativa tem prazo próprio: modelo sobrecarregado demora a falhar, e a reserva precisa de tempo
const ATTEMPT_MS = 8_000;
const RETRY_DELAY_MS = 600;
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

const SYSTEM_PROMPT = `Você é Nez, o Mestre Perfumista (Le Nez) da casa Sillage: um curador de alta perfumaria, caloroso e preciso, que fala português do Brasil.

Repertório: você domina a pirâmide olfativa (notas de topo, de coração e de fundo), as famílias olfativas (cítrica, floral, amadeirada, verde, aquática, oriental/ambarada, especiada, frutada, aromática, almiscarada) e os acordes clássicos (chypre, fougère, gourmand, ambarado), além de fixação (quanto dura na pele) e projeção (o rastro que deixa).

Volatilidade e clima: notas cítricas e aquáticas são muito voláteis e evaporam depressa no calor, então brilham na abertura e pedem reaplicação; notas balsâmicas, amadeiradas e especiadas são pesadas, duram mais e desabrocham no frio, quando o perfume se abre devagar. No calor, a pele amplifica a projeção; no frio, ela se recolhe.

Evolução: um perfume se revela em etapas. O topo é a abertura volátil, que some em minutos; o coração carrega a identidade da fragrância e dura algumas horas; o fundo é a fixação, que permanece na pele e na roupa. Explique essa transição com naturalidade, como uma história que muda ao longo do dia, sem soar como aula.

Como responder:
- 2 a 4 frases envolventes, em prosa fluida: sem listas, marcadores, negritos, títulos, markdown ou emojis. Tom caloroso, elegante e acolhedor. Poético, mas concreto; evite clichês vazios ("uma viagem sensorial", "cativante").
- Quando o clima ou a estação entrar na conversa, relacione-os com a volatilidade das notas e com a fase da pirâmide que mais aparece.
- Quando houver um perfume em foco no contexto, cruze a pergunta com as notas específicas dele, citando-as pelo nome, e diga em que camada da pirâmide elas aparecem.
- Quando não houver contexto, recomende caminhos olfativos (famílias, acordes e notas), sem inventar perfumes ou marcas específicos.
- Use só o que o contexto informa sobre o perfume em foco. Se não souber algo (preço, lançamento, fixação exata), diga com naturalidade em vez de inventar.
- Mantenha a coerência com o que já foi dito na conversa e responda apenas sobre perfumaria; para outros assuntos, convide gentilmente a voltar ao universo dos perfumes.`;

const readBearer = (req: Request): string | null => {
  const header = req.headers.get('Authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const asText = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim().slice(0, max) : null;

interface Turn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Aceita só { role: 'user' | 'assistant', text } válidos; o Gemini chama o assistente de "model"
const parseHistory = (value: unknown): Turn[] => {
  if (!Array.isArray(value)) return [];
  const turns: Turn[] = [];
  for (const item of value.slice(-MAX_HISTORY)) {
    const entry = (typeof item === 'object' && item !== null ? item : {}) as Record<
      string,
      unknown
    >;
    const text = asText(entry.text, MAX_HISTORY_TEXT);
    if (!text || (entry.role !== 'user' && entry.role !== 'assistant')) continue;
    turns.push({ role: entry.role === 'user' ? 'user' : 'model', parts: [{ text }] });
  }
  // A conversa precisa começar por uma fala do usuário
  while (turns[0]?.role === 'model') turns.shift();
  return turns;
};

// 1 retry no modelo principal e depois o modelo de reserva, só para erro transitório (503 "high
// demand", 429, 5xx, rede). Tudo dentro de um prazo total para não estourar o isolate. `accept`
// converte o texto do modelo no resultado; devolver null conta como tentativa falha.
const generateWithRetries = async <T>(
  ai: GoogleGenAI,
  contents: Turn[],
  config: GenerateContentConfig,
  accept: (text: string) => T | null
): Promise<T | null> => {
  const deadline = AbortSignal.timeout(DEADLINE_MS);
  const attempts = [MODEL, MODEL, FALLBACK_MODEL];
  for (const [index, model] of attempts.entries()) {
    if (deadline.aborted) break;
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          ...config,
          // Família 3.x pensa por padrão (e gasta os tokens da resposta); `minimal` mantém só o texto
          thinkingConfig: { thinkingLevel: 'MINIMAL' },
          abortSignal: AbortSignal.any([deadline, AbortSignal.timeout(ATTEMPT_MS)]),
        },
      });
      const result = accept(response.text?.trim() ?? '');
      if (result !== null) return result;
      console.warn(`nez-ai: tentativa ${index + 1} (${model}) devolveu resposta inválida`);
    } catch (error) {
      const status = (error as { status?: number }).status;
      console.warn(`nez-ai: tentativa ${index + 1} (${model}) falhou`, status ?? error);
      // Erro definitivo (chave inválida, pedido recusado): repetir não adianta
      if (status !== undefined && !TRANSIENT_STATUS.has(status)) break;
    }
    if (index < attempts.length - 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  return null;
};

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  const json = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
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
  const isDiscovery = payload.mode === 'discovery';
  // Sem `mode`, é o chat de sempre; qualquer outro valor é pedido inválido
  if (payload.mode !== undefined && !isDiscovery && payload.mode !== 'chat') {
    return json({ error: 'invalid_request' }, 400);
  }
  const discovery = isDiscovery ? parseDiscoveryRequest(payload) : null;
  if (isDiscovery && !discovery) return json({ error: 'invalid_request' }, 400);
  const question = asText(payload.question, MAX_QUESTION);
  if (!isDiscovery && !question) return json({ error: 'invalid_request' }, 400);
  const context = asText(payload.context, MAX_CONTEXT);
  const history = parseHistory(payload.history);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.error('nez-ai: GEMINI_API_KEY ausente');
    return json({ error: 'unavailable' }, 503);
  }

  const ai = new GoogleGenAI({ apiKey });

  // 3a. Descoberta guiada: o banco pré-seleciona os candidatos, o Gemini escolhe entre eles e o
  // servidor confere a escolha antes de responder.
  if (discovery) {
    // Cliente com o JWT do usuário: a RLS e o auth.uid() do banco valem (nunca service_role)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    let dnaFamilies: ReturnType<typeof topDnaFamilies> = [];
    if (discovery.useDna) {
      const { data, error } = await userClient.rpc('get_olfactory_dna');
      if (error) {
        console.error('nez-ai: get_olfactory_dna falhou', error.code);
        return json({ error: 'upstream_failed' }, 502);
      }
      dnaFamilies = topDnaFamilies(data);
    }
    const preferred = preferredFamilies(discovery, dnaFamilies);

    const { data: rows, error: candidatesError } = await userClient.rpc(
      'get_discovery_candidates',
      {
        p_climate_families: climateFamilies(discovery.climate),
        p_preferred_families: preferred,
        p_limit: CANDIDATE_LIMIT,
      }
    );
    if (candidatesError) {
      console.error('nez-ai: get_discovery_candidates falhou', candidatesError.code);
      return json({ error: 'upstream_failed' }, 502);
    }
    const candidates = parseCandidates(rows);
    // Sem candidatos não há o que recomendar: nem chama o Gemini (sem custo, sem invenção)
    if (candidates.length === 0) return json({ text: '', picks: [] });

    const answer = await generateWithRetries(
      ai,
      [
        {
          role: 'user',
          parts: [{ text: buildDiscoveryPrompt(discovery, dnaFamilies, candidates) }],
        },
      ],
      {
        systemInstruction: DISCOVERY_SYSTEM_PROMPT,
        temperature: 0.6,
        maxOutputTokens: DISCOVERY_MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
        responseJsonSchema: buildResponseSchema(candidates.map((candidate) => candidate.slug)),
      },
      (text) => validateAnswer(text, candidates)
    );
    return answer ? json(answer) : json({ error: 'upstream_failed' }, 502);
  }

  // 3b. Chat: pergunta, contexto do perfume em foco e as últimas mensagens
  if (!question) return json({ error: 'invalid_request' }, 400);
  const prompt = context
    ? `Perfume em foco na tela:
${context}

Pergunta: ${question}`
    : `Pergunta: ${question}`;
  const contents: Turn[] = [...history, { role: 'user', parts: [{ text: prompt }] }];
  const text = await generateWithRetries(
    ai,
    contents,
    { systemInstruction: SYSTEM_PROMPT, temperature: 0.7, maxOutputTokens: MAX_OUTPUT_TOKENS },
    (reply) => reply || null
  );
  if (text) return json({ text });
  return json({ error: 'upstream_failed' }, 502);
});
