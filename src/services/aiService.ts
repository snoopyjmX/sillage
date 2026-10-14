// Acesso ao Nez (Edge Function nez-ai). A chave do Gemini fica só no servidor; aqui vai apenas
// a sessão do usuário. Só services importam o cliente do Supabase.
import { z } from 'zod';
import type { TempBand } from '@/constants/climate';
import { AppError } from '@/constants/errors';
import type { OlfactiveFamily } from '@/constants/labels';
import type { NezOccasion } from '@/constants/nez';
import { supabase } from '@/lib/supabase';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

const UNAUTHORIZED = 401;
// Acima do prazo da função (20 s): evita um spinner eterno se o servidor travar
const REQUEST_TIMEOUT_MS = 30_000;

// POST na Edge Function com a sessão do usuário. Erro do servidor nunca chega cru: vira código estável.
const postToNez = async (payload: unknown): Promise<unknown> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AppError('session_expired');

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/nez-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'TimeoutError') {
      throw new AppError('nez_failed', { cause });
    }
    throw new AppError('network', { cause });
  }

  if (response.status === UNAUTHORIZED) throw new AppError('session_expired');
  if (!response.ok) throw new AppError('nez_failed', { cause: response.status });
  return response.json().catch(() => null);
};

export interface NezMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface NezRequest {
  question: string;
  // Texto do perfume em foco (notas e famílias); opcional
  context?: string;
  // Mensagens anteriores da sessão (o servidor usa só as últimas)
  history?: NezMessage[];
}

// Trilha de descoberta: o DNA nunca vai do app; com `useDna` o servidor lê o do próprio usuário
export interface NezDiscoveryRequest {
  climate: TempBand;
  occasion: NezOccasion;
  // 0 a 2 famílias de predileção (com `useDna` pode não haver nenhuma)
  families: OlfactiveFamily[];
  useDna: boolean;
}

// `picks` são slugs de perfumes do catálogo, já conferidos pelo servidor; vazio = sem candidatos
const discoveryResponseSchema = z.object({
  text: z.string(),
  picks: z.array(z.string()).max(3),
});
export type NezDiscoveryResult = z.infer<typeof discoveryResponseSchema>;

export const aiService = {
  askNez: async ({ question, context, history }: NezRequest): Promise<string> => {
    const body = (await postToNez({ question, context, history })) as { text?: unknown } | null;
    // O corpo do servidor nunca é exibido: só o campo `text`
    if (typeof body?.text !== 'string' || body.text === '') throw new AppError('nez_failed');
    return body.text;
  },

  discoverNez: async (request: NezDiscoveryRequest): Promise<NezDiscoveryResult> => {
    const parsed = discoveryResponseSchema.safeParse(
      await postToNez({ mode: 'discovery', ...request })
    );
    if (!parsed.success) throw new AppError('nez_failed', { cause: parsed.error });
    return parsed.data;
  },
};
