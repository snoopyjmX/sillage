// Audita os `store_url` cadastrados e lista os que quebraram (404, erro HTTP ou de rede).
// Uso: node --env-file=.env.local scripts/validate-store-links.mjs
// Usa só a chave anon (leitura pública de `perfumes`); nunca service_role.
import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey } = process.env;
if (!url || !anonKey) {
  console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ex.: --env-file=.env.local).');
  process.exit(1);
}

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 5;
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; SillageLinkCheck/1.0)',
  accept: 'text/html,*/*',
};

const supabase = createClient(url, anonKey);

const request = (storeUrl, method) =>
  fetch(storeUrl, {
    method,
    headers: HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

// HEAD primeiro (barato); se a loja rejeitar HEAD, tenta GET antes de dar o link como quebrado
const check = async (storeUrl) => {
  try {
    let response = await request(storeUrl, 'HEAD');
    if (!response.ok) response = await request(storeUrl, 'GET');
    return response.ok ? null : `HTTP ${response.status}`;
  } catch (error) {
    return `erro de rede (${error instanceof Error ? error.name : 'desconhecido'})`;
  }
};

const { data, error } = await supabase
  .from('perfumes')
  .select('id, name, store_url')
  .not('store_url', 'is', null)
  .order('name');
if (error) {
  console.error(`Falha ao consultar o banco: ${error.message}`);
  process.exit(1);
}

console.log(`Verificando ${data.length} link(s)...\n`);

const broken = [];
const queue = [...data];
const worker = async () => {
  for (let perfume = queue.shift(); perfume; perfume = queue.shift()) {
    const reason = await check(perfume.store_url);
    if (reason) broken.push({ ...perfume, reason });
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (broken.length === 0) {
  console.log('Todos os links responderam com sucesso.');
} else {
  console.log(`${broken.length} link(s) quebrado(s):\n`);
  for (const { id, name, store_url, reason } of broken) {
    console.log(`- ${name} [${id}]\n  ${reason}: ${store_url}`);
  }
  process.exitCode = 1;
}
