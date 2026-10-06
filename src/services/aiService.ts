// Acesso ao Nez (Edge Function nez-ai). A chave do Gemini fica só no servidor; aqui vai apenas
// a sessão do usuário. Só services importam o cliente do Supabase.
import { AppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

const UNAUTHORIZED = 401;

export interface NezRequest {
  question: string;
  // Texto do perfume em foco (notas e famílias); opcional
  context?: string;
}

export const aiService = {
  askNez: async ({ question, context }: NezRequest): Promise<string> => {
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
        body: JSON.stringify({ question, context }),
      });
    } catch (cause) {
      throw new AppError('network', { cause });
    }

    if (response.status === UNAUTHORIZED) throw new AppError('session_expired');
    if (!response.ok) throw new AppError('nez_failed', { cause: response.status });

    // O corpo do servidor nunca é exibido: só o campo `text`
    const body = (await response.json().catch(() => null)) as { text?: unknown } | null;
    if (typeof body?.text !== 'string' || body.text === '') throw new AppError('nez_failed');
    return body.text;
  },
};
