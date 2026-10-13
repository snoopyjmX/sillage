// Audita os `store_url` cadastrados: lista os quebrados (404, soft 404, redirecionamento, erro HTTP ou de rede)
// e os bloqueados (403/429), que precisam de conferência manual no navegador.
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

// 403/429 = a loja bloqueia robôs: não prova que o link quebrou, vira "conferir manualmente"
const BLOCKED_STATUS = new Set([403, 429]);
// Lojas devolvem 200 com uma página de "não encontrado" (soft 404): olha o <title> e o início do corpo
const SOFT_404 = /n[aã]o encontrad|p[aá]gina n[aã]o existe|404|nenhum resultado/i;

export const classify = async (requestedUrl, response) => {
  if (BLOCKED_STATUS.has(response.status))
    return { kind: 'blocked', reason: `HTTP ${response.status}` };
  if (!response.ok) return { kind: 'broken', reason: `HTTP ${response.status}` };
  const finalUrl = new URL(response.url);
  const asked = new URL(requestedUrl);
  // Redirecionar para outra página (ex.: account-verification) não é o produto pedido
  const path = (url) => url.pathname.replace(/\/$/, '');
  if (finalUrl.hostname !== asked.hostname || path(finalUrl) !== path(asked)) {
    return { kind: 'broken', reason: `redirecionou para ${response.url}` };
  }
  const html = (await response.text()).slice(0, 20_000);
  const title = /<title[^>]*>([^<]*)/i.exec(html)?.[1] ?? '';
  if (SOFT_404.test(title))
    return { kind: 'broken', reason: `soft 404 (título: "${title.trim()}")` };
  return { kind: 'ok' };
};

const check = async (storeUrl) => {
  try {
    // GET: o HEAD não deixa ler o título para detectar soft 404
    return await classify(storeUrl, await request(storeUrl, 'GET'));
  } catch (error) {
    // Conexão derrubada (ECONNRESET) é a proteção anti-robô de algumas lojas, não link quebrado
    if (
      error instanceof Error &&
      (error.cause?.code === 'ECONNRESET' || error.name === 'TimeoutError')
    ) {
      return { kind: 'blocked', reason: 'conexão recusada ao robô' };
    }
    return {
      kind: 'broken',
      reason: `erro de rede (${error instanceof Error ? error.name : 'desconhecido'})`,
    };
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
const blocked = [];
const queue = [...data];
const worker = async () => {
  for (let perfume = queue.shift(); perfume; perfume = queue.shift()) {
    const { kind, reason } = await check(perfume.store_url);
    if (kind === 'broken') broken.push({ ...perfume, reason });
    if (kind === 'blocked') blocked.push({ ...perfume, reason });
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (blocked.length > 0) {
  console.log(`${blocked.length} link(s) bloqueado(s) para robôs, confira manualmente no navegador:
`);
  for (const { name, store_url, reason } of blocked)
    console.log(`- ${name}
  ${reason}: ${store_url}`);
  console.log('');
}
if (broken.length === 0) {
  console.log('Nenhum link quebrado.');
} else {
  console.log(`${broken.length} link(s) quebrado(s):
`);
  for (const { id, name, store_url, reason } of broken) {
    console.log(`- ${name} [${id}]
  ${reason}: ${store_url}`);
  }
  process.exitCode = 1;
}
