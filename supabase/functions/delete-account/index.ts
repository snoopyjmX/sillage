// Exclusão da própria conta (docs/PRODUCT.md, Zona de perigo). Só usuário logado: o JWT é validado
// com auth.getUser(token) (verify_jwt fica desligado no gateway para o 401 sair em JSON). A
// service_role existe só aqui, no runtime, e apaga SEMPRE o usuário do token, nunca um id do corpo.
// O banco cuida do resto: auth.users → profiles → coleção, memorial e avaliações (on delete cascade).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const AVATAR_BUCKET = 'avatars';

const readBearer = (req: Request): string | null => {
  const header = req.headers.get('Authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  const json = (body: unknown, status: number): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);

  const token = readBearer(req);
  if (!token) return json({ code: 'unauthorized' }, 401);

  // SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados pelo runtime (local e produção)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  let userId: string | null = null;
  try {
    const { data, error } = await admin.auth.getUser(token);
    userId = !error && data.user ? data.user.id : null;
  } catch (error) {
    console.error('delete-account: falha ao validar o token', error);
  }
  if (!userId) return json({ code: 'unauthorized' }, 401);

  try {
    // Foto de perfil: se não existir, o remove não falha; erro real vai para o log e a conta segue
    const { error: storageError } = await admin.storage
      .from(AVATAR_BUCKET)
      .remove([`${userId}/avatar.webp`]);
    if (storageError) console.error('delete-account: falha ao remover o avatar', storageError);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (error) {
    console.error('delete-account: falha ao excluir a conta', error);
    return json({ code: 'account_delete_failed' }, 500);
  }

  return new Response(null, { status: 204, headers: cors });
});
