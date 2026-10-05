// Único lugar que cria o cliente do Supabase; só os services importam este módulo.
// Só a anon key vai para o front (a segurança real é a RLS). Nunca service_role.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const url: unknown = import.meta.env.VITE_SUPABASE_URL;
const anonKey: unknown = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (typeof url !== 'string' || url === '' || typeof anonKey !== 'string' || anonKey === '') {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes. ' +
      'Copie .env.example para .env.local e preencha com `npx supabase status -o env`.'
  );
}

export const supabase = createClient<Database>(url, anonKey);
