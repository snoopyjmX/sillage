// Envia as imagens de scripts/processed-images/ para o bucket `perfume-images` do Supabase,
// mantendo a estrutura {marca}/{perfume}.webp (o mesmo caminho gravado em perfumes.image_path).
// Sobe só o que está em processed-images/manifest.json: o arquivo-base ({perfume}.{hash}.webp) e as
// variantes -thumb, -medium e -large ao lado dele. O hash no nome faz o cache de 1 ano ser seguro.
//
// Variáveis (lidas do ambiente, de .env.local ou de .env, nesta ordem):
//   SUPABASE_URL                (ou VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY   (local: `npx supabase status -o env`, campo SERVICE_ROLE_KEY)
//
// A service_role ignora a RLS: use só neste script, na sua máquina. Nunca com prefixo VITE_
// (iria para o bundle do front) e nunca commitada. Por segurança, o script só aceita um Supabase
// local; para outro destino, rode com ALLOW_REMOTE_UPLOAD=1 sabendo o que está fazendo.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT_DIR = join(ROOT, 'scripts', 'processed-images');
const BUCKET = 'perfume-images';
const ONE_YEAR_SECONDS = '31536000';

// Carrega o primeiro arquivo que existir, sem sobrescrever o que já veio do ambiente
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(join(ROOT, file));
  } catch {
    // arquivo ausente: segue
  }
}

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

if (!url) fail('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) no .env.local.');
if (!serviceKey) {
  fail(
    'Defina SUPABASE_SERVICE_ROLE_KEY no .env.local (rode `npx supabase status -o env` e copie SERVICE_ROLE_KEY).'
  );
}
const { hostname } = new URL(url);
if (!['127.0.0.1', 'localhost'].includes(hostname) && process.env.ALLOW_REMOTE_UPLOAD !== '1') {
  fail(`${hostname} não é um Supabase local. Para enviar mesmo assim, use ALLOW_REMOTE_UPLOAD=1.`);
}

const VARIANT_SUFFIXES = ['', '-thumb', '-medium', '-large'];

// Caminhos (relativos a processed-images) de todos os arquivos que o manifest referencia
const listManifestFiles = async () => {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(INPUT_DIR, 'manifest.json'), 'utf8'));
  } catch {
    fail('scripts/processed-images/manifest.json não existe. Rode `npm run images` antes.');
  }
  return Object.values(manifest).flatMap((imagePath) =>
    VARIANT_SUFFIXES.map((suffix) => imagePath.replace(/\.webp$/, `${suffix}.webp`))
  );
};

const main = async () => {
  const paths = await listManifestFiles();
  if (paths.length === 0) fail('O manifest.json está vazio.');

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  let failures = 0;

  for (const path of paths) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, await readFile(join(INPUT_DIR, path)), {
        contentType: 'image/webp',
        cacheControl: ONE_YEAR_SECONDS,
        upsert: true,
      });
    if (error) {
      failures += 1;
      console.error(`✖ ${path}: ${error.message}`);
    } else {
      console.log(`✔ ${BUCKET}/${path}`);
    }
  }

  console.log(`\n${paths.length - failures} de ${paths.length} enviadas para o bucket ${BUCKET}.`);
  if (failures > 0) process.exitCode = 1;
};

await main();
