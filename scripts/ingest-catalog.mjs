// Ingestão em lote do backlog (docs/CATALOGO_EXPANSAO.md): para cada perfume ainda não cadastrado,
// pergunta ao Gemini, baixa a foto do frasco e GERA UMA MIGRATION SQL idempotente com o lote todo.
// Nada é gravado no banco: você revisa o SQL e aplica (`npx supabase migration up`, `db push`).
// O que falhar (validação, foto) vai para a quarentena scripts/batch/erros-ingest.json e o lote segue.
//
// Uso: npm run ingest:catalog -- [--section <chave>]... [--group <slug>]... [--limit N] [--name lote1]
//                                [--dry-run] [--loose]
//   --section   prioridade | nacional | contratipos | global (repetível)
//   --group     marca/grupo do backlog, ex.: granado-phebo, natura (repetível); soma com --section
//   --limit     máximo de perfumes consultados no Gemini
//   --name      sufixo da migration (padrão "lote")
//   --dry-run   só lista a seleção: não chama o Gemini nem baixa nada
//   --loose     aceita fotos de fontes fora de TRUSTED_DOMAINS (confira uma a uma)
// Depois das fotos processadas (`npm run images`):
//   --apply-images <migration>   troca os image_path provisórios pelos com hash (manifest.json)
//   --mark-done <lote.json>      marca [x] no backlog os perfumes do lote
//
// Variáveis (ambiente ou .env.local): GEMINI_API_KEY, GEMINI_MODEL (opcional) e, para a checagem
// de duplicatas no banco, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (leitura pública).
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { pickImage, searchBing, searchDuckDuckGo } from './download-images.mjs';
import {
  PerfumeSchema,
  buildGeminiPrompt,
  buildMigrationSql,
  downloadImage,
  resolveSlugs,
  slugify,
  toGeminiSchema,
  validatePerfume,
} from './ingest-perfume.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKLOG_FILE = join(ROOT, 'docs', 'CATALOGO_EXPANSAO.md');
const SEED_FILE = join(ROOT, 'supabase', 'seed.sql');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const RAW_IMAGES_DIR = join(ROOT, 'scripts', 'raw-images');
const MANIFEST_FILE = join(ROOT, 'scripts', 'processed-images', 'manifest.json');
const BATCH_DIR = join(ROOT, 'scripts', 'batch');
const ERRORS_FILE = join(BATCH_DIR, 'erros-ingest.json');

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(join(ROOT, file));
  } catch {
    // arquivo ausente: segue
  }
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
const PAUSE_MIN_MS = 2000; // intervalo entre chamadas ao Gemini (limite de requisições)
const PAUSE_MAX_MS = 3000;
const SECTIONS = ['prioridade', 'nacional', 'contratipos', 'global'];

export const USAGE =
  'Uso: npm run ingest:catalog -- [--section <chave>] [--group <slug>] [--limit N] [--name lote1] [--dry-run] [--loose] | --apply-images <migration> | --mark-done <lote.json>';

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const errorMessage = (error) => (error instanceof Error ? error.message : String(error));

// ---------------------------------------------------------------------------
// Backlog (Markdown) -> itens
// ---------------------------------------------------------------------------

const sectionKeyOf = (heading) => {
  if (/prioridade/i.test(heading)) return 'prioridade';
  if (/perfumaria nacional/i.test(heading)) return 'nacional';
  if (/contratipos/i.test(heading)) return 'contratipos';
  if (/global|luxo/i.test(heading)) return 'global';
  return slugify(heading);
};

// "- [ ] Nome, Marca _(No seed atual)_" -> { checked, name, brand }; outra linha -> null
export const parseListLine = (line) => {
  const match = /^- \[( |x)\] (.+)$/i.exec(line.trim());
  if (!match) return null;
  const body = match[2].replace(/\s*_\(.*?\)_\s*$/, '').trim();
  const comma = body.lastIndexOf(',');
  if (comma <= 0) return null;
  return {
    checked: match[1].toLowerCase() === 'x',
    name: body.slice(0, comma).trim(),
    brand: body.slice(comma + 1).trim(),
  };
};

// Fichas (`### N. Nome (Marca)`, com os dados oficiais no corpo) e itens de lista, sem os já
// marcados [x]. A ficha vence o item de lista do mesmo perfume (traz fonte para o Gemini).
export const parseBacklog = (markdown) => {
  const sheets = [];
  const listed = [];
  let section = '';
  let group = '';
  let sheet = null;
  const closeSheet = () => {
    if (sheet) sheets.push({ ...sheet, sheet: sheet.lines.join('\n').trim(), lines: undefined });
    sheet = null;
  };
  for (const line of markdown.split(/\r?\n/)) {
    const h2 = /^## (.+)$/.exec(line);
    if (h2) {
      closeSheet();
      section = sectionKeyOf(h2[1]);
      group = '';
      continue;
    }
    const h3 = /^### (.+)$/.exec(line);
    if (h3) {
      closeSheet();
      const ficha = /^\d+\.\s+(.+?)\s+\(([^)]+)\)\s*$/.exec(h3[1]);
      if (ficha) {
        group = 'prioridade-1';
        sheet = { section, group, name: ficha[1].trim(), brand: ficha[2].trim(), checked: false };
        sheet.lines = [];
      } else {
        group = slugify(h3[1].replace(/\(\d+ perfumes?\)/i, ''));
      }
      continue;
    }
    if (line.trim() === '---') {
      closeSheet();
      continue;
    }
    if (sheet) {
      sheet.lines.push(line);
      continue;
    }
    const item = parseListLine(line);
    if (item) listed.push({ section, group, ...item, sheet: null });
  }
  closeSheet();

  const key = (item) => `${slugify(item.brand)}/${slugify(item.name)}`;
  const sheetKeys = new Set(sheets.map(key));
  return [...sheets, ...listed.filter((item) => !sheetKeys.has(key(item)))].filter(
    (item) => !item.checked
  );
};

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------

export const parseCatalogArgs = (argv) => {
  const options = {
    sections: [],
    groups: [],
    limit: null,
    name: 'lote',
    dryRun: false,
    loose: false,
    applyImages: null,
    markDone: null,
  };
  const valueOf = (flag, index) => {
    const value = argv[index + 1];
    return value === undefined || value.startsWith('--') ? null : value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--loose') options.loose = true;
    else if (
      ['--section', '--group', '--limit', '--name', '--apply-images', '--mark-done'].includes(arg)
    ) {
      const value = valueOf(arg, index);
      if (value === null) return { error: `${arg} precisa de um valor. ${USAGE}` };
      index += 1;
      if (arg === '--section') {
        if (!SECTIONS.includes(value)) {
          return { error: `Seção desconhecida: ${value} (use ${SECTIONS.join(', ')}).` };
        }
        options.sections.push(value);
      } else if (arg === '--group') {
        options.groups.push(slugify(value));
      } else if (arg === '--limit') {
        if (!/^[1-9]\d*$/.test(value)) return { error: '--limit precisa ser um inteiro positivo.' };
        options.limit = Number(value);
      } else if (arg === '--name') {
        if (!/^[a-z0-9_]+$/.test(value)) {
          return { error: '--name aceita só letras minúsculas, números e "_".' };
        }
        options.name = value;
      } else if (arg === '--apply-images') options.applyImages = value;
      else options.markDone = value;
    } else {
      return { error: `Argumento desconhecido: ${arg}. ${USAGE}` };
    }
  }
  if (options.applyImages !== null && options.markDone !== null) {
    return { error: 'Use --apply-images ou --mark-done, não os dois.' };
  }
  const ingesting = options.applyImages === null && options.markDone === null;
  if (ingesting && options.sections.length === 0 && options.groups.length === 0) {
    return { error: `Informe --section ou --group. ${USAGE}` };
  }
  return { options };
};

// Seção OU grupo (soma), depois o limite
export const selectItems = (items, { sections, groups, limit }) => {
  const picked = items.filter(
    (item) => sections.includes(item.section) || groups.includes(item.group)
  );
  return limit === null ? picked : picked.slice(0, limit);
};

// ---------------------------------------------------------------------------
// Duplicatas, perfumistas e nome da migration
// ---------------------------------------------------------------------------

// slug do perfume -> slug da marca, lido do seed e das migrations geradas pelo ingest
export const parseKnownPerfumes = (sql) => {
  const known = new Map();
  const seedBlock = /insert into public\.perfumes[\s\S]*?\bfrom \(values([\s\S]*?)\) as v/i.exec(
    sql
  );
  if (seedBlock) {
    for (const row of seedBlock[1].matchAll(/^\s+\('([a-z0-9-]+)', '([a-z0-9-]+)', /gm)) {
      known.set(row[1], row[2]);
    }
  }
  for (const row of sql.matchAll(
    /select '([a-z0-9-]+)', b\.id[\s\S]*?from public\.brands b where b\.slug = '([a-z0-9-]+)'/g
  )) {
    known.set(row[1], row[2]);
  }
  return known;
};

export const loadKnownPerfumes = async ({
  seedFile = SEED_FILE,
  migrationsDir = MIGRATIONS_DIR,
} = {}) => {
  const known = new Map();
  const files = [seedFile];
  try {
    for (const name of await readdir(migrationsDir)) {
      if (/_ingest_.*\.sql$/.test(name)) files.push(join(migrationsDir, name));
    }
  } catch {
    // sem pasta de migrations: só o seed
  }
  for (const file of files) {
    try {
      for (const [slug, brand] of parseKnownPerfumes(await readFile(file, 'utf8'))) {
        known.set(slug, brand);
      }
    } catch {
      // arquivo ausente: segue
    }
  }
  return known;
};

const loadRemotePerfumes = async (known) => {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;
  try {
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('perfumes')
      .select('slug, brands(slug)')
      .limit(5000);
    if (error) throw new Error(error.message);
    for (const row of data) if (row.brands?.slug) known.set(row.slug, row.brands.slug);
  } catch (error) {
    console.warn(
      `! Banco indisponível para checar duplicatas (${errorMessage(error)}); sigo só com seed e migrations.`
    );
  }
};

// Autoria de marca ("Casa Granado", "Granado") não é nariz: perfumers modela só pessoas físicas
export const normalizePerfumers = (names, brand) => {
  const brandSlug = slugify(brand);
  return names.filter((raw) => {
    const slug = slugify(raw);
    if (!slug) return false;
    if (/^casa-/.test(slug) || /^(equipe|time|laboratorio)\b/.test(slug)) return false;
    return !(
      brandSlug &&
      (slug === brandSlug || slug.includes(brandSlug) || brandSlug.includes(slug))
    );
  });
};

const formatTimestamp = (date) => date.toISOString().replace(/\D/g, '').slice(0, 14);

// Sempre depois da última migration existente, mesmo com o relógio da máquina atrás
export const nextMigrationTimestamp = (fileNames, now = new Date()) => {
  const stamps = fileNames.map((name) => /^(\d{14})_/.exec(name)?.[1]).filter(Boolean);
  const latest = stamps.sort().at(-1);
  const current = formatTimestamp(now);
  if (!latest || current > latest) return current;
  const [, y, mo, d, h, mi, s] = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(latest);
  return formatTimestamp(new Date(Date.UTC(+y, mo - 1, +d, +h, +mi, +s + 1)));
};

// ---------------------------------------------------------------------------
// Foto do frasco
// ---------------------------------------------------------------------------

// og:image da página oficial do produto (URL absoluta) ou null
export const extractOgImage = (html, pageUrl) => {
  const tag = /<meta[^>]+(?:property|name)=["']og:image(?::url)?["'][^>]*>/i.exec(html)?.[0];
  const content = tag && /content=["']([^"']+)["']/i.exec(tag)?.[1];
  if (!content) return null;
  try {
    return new URL(content, pageUrl).toString();
  } catch {
    return null;
  }
};

const searchImages = async (query) => {
  try {
    return await searchDuckDuckGo(query);
  } catch {
    return searchBing(query);
  }
};

const findRawImage = async (brandSlug, perfumeSlug, dir) => {
  try {
    const found = (await readdir(join(dir, brandSlug))).find(
      (file) => parse(file).name === perfumeSlug
    );
    return found ? join(dir, brandSlug, found) : null;
  } catch {
    return null;
  }
};

// Ordem: foto que já está em raw-images; URL do Gemini; og:image da página oficial; busca na web
// (só domínios confiáveis, salvo loose). Falhou tudo: erro com o motivo de cada tentativa.
export const captureImage = async (
  { name, brand, imageUrl, officialUrl },
  { brandSlug, perfumeSlug },
  { dir = RAW_IMAGES_DIR, loose = false, search = searchImages, fetchPage = fetchRawHtml } = {}
) => {
  const existing = await findRawImage(brandSlug, perfumeSlug, dir);
  if (existing) return { file: existing, source: 'raw-images' };

  const reasons = [];
  const attempt = async (label, getUrl) => {
    try {
      const url = await getUrl();
      if (!url) throw new Error('sem URL');
      return { file: await downloadImage(url, brandSlug, perfumeSlug, dir), source: label };
    } catch (error) {
      reasons.push(`${label}: ${errorMessage(error)}`);
      return null;
    }
  };

  let saved = imageUrl ? await attempt('gemini', async () => imageUrl) : null;
  if (!saved && officialUrl) {
    saved = await attempt('og:image', async () =>
      extractOgImage(await fetchPage(officialUrl), officialUrl)
    );
  }
  saved ??= await attempt(
    'busca',
    async () => pickImage(await search(`frasco perfume ${brand} ${name}`), { loose }).url
  );
  if (!saved) throw new Error(`Sem foto utilizável (${reasons.join('; ')}).`);
  return saved;
};

async function fetchRawHtml(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SillageIngest/1.0)' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${url} respondeu ${response.status}`);
  return (await response.text()).slice(0, 2_000_000);
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

const CatalogSchema = PerfumeSchema.extend({
  imageUrl: z
    .string()
    .nullable()
    .describe(
      'URL https direta da foto do frasco numa loja ou site oficial; null se não tiver certeza'
    ),
});
const RESPONSE_JSON_SCHEMA = toGeminiSchema(z.toJSONSchema(CatalogSchema));

export const buildItemPrompt = (item) =>
  [
    buildGeminiPrompt(`${item.brand} ${item.name}`, item.sheet),
    `Use exatamente a marca "${item.brand}" e o nome "${item.name}". "Deo Parfum" equivale a edp.`,
    'Cada nota recebe UMA das famílias permitidas, mesmo que a ficha use uma família composta.',
    'imageUrl: só se souber uma URL https direta da foto do frasco; senão null (não invente).',
  ].join('\n');

export const parseItemResponse = (text, item) => {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('O Gemini não devolveu um JSON válido.');
  }
  const data = validatePerfume(raw, `${item.brand} ${item.name}`);
  const imageUrl =
    typeof raw.imageUrl === 'string' && /^https?:\/\//.test(raw.imageUrl) ? raw.imageUrl : null;
  // O backlog é a lista curada: marca e nome dele mandam, para o slug bater com o documento
  return {
    data: {
      ...data,
      brand: item.brand,
      name: item.name,
      perfumers: normalizePerfumers(data.perfumers, item.brand),
    },
    imageUrl,
  };
};

const askGemini = async (ai, item) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildItemPrompt(item),
        config: { responseMimeType: 'application/json', responseJsonSchema: RESPONSE_JSON_SCHEMA },
      });
      return parseItemResponse(response.text ?? '', item);
    } catch (error) {
      const retryable = /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(errorMessage(error));
      if (!retryable || attempt >= 3) throw error;
      await sleep(15_000 * attempt);
    }
  }
};

// Link oficial da ficha ("**Link Oficial:** `https://...`")
export const officialUrlOf = (sheet) =>
  /\*\*Link Oficial:\*\*\s*`?(https?:\/\/[^\s`]+)`?/i.exec(sheet ?? '')?.[1] ?? null;

// ---------------------------------------------------------------------------
// Pós-processamento: image_path com hash e [x] no backlog
// ---------------------------------------------------------------------------

// manifest: { slug: 'marca/slug.<hash>.webp' }; o SQL traz 'marca/slug.webp' (provisório)
export const applyImagePaths = (sql, manifest) => {
  let updated = sql;
  const applied = [];
  for (const finalPath of Object.values(manifest)) {
    const provisional = finalPath.replace(/\.[0-9a-f]{8}\.webp$/, '.webp');
    if (provisional === finalPath) continue;
    const literal = `'${provisional}'`;
    if (updated.includes(literal)) {
      updated = updated.split(literal).join(`'${finalPath}'`);
      applied.push(finalPath);
    }
  }
  return { sql: updated, applied };
};

export const markDone = (markdown, items) => {
  const done = new Set(items.map((item) => `${slugify(item.brand)}/${slugify(item.name)}`));
  let marked = 0;
  const lines = markdown.split('\n').map((line) => {
    const item = parseListLine(line);
    if (!item || item.checked || !done.has(`${slugify(item.brand)}/${slugify(item.name)}`))
      return line;
    marked += 1;
    return line.replace('- [ ]', '- [x]');
  });
  return { markdown: lines.join('\n'), marked };
};

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const saveErrors = async (failures) => {
  const previous = await readJson(ERRORS_FILE, []);
  const key = (e) => `${slugify(e.brand)}/${slugify(e.name)}`;
  const fresh = new Set(failures.map(key));
  await mkdir(BATCH_DIR, { recursive: true });
  await writeFile(
    ERRORS_FILE,
    `${JSON.stringify([...previous.filter((e) => !fresh.has(key(e))), ...failures], null, 2)}\n`
  );
};

const runIngest = async (options) => {
  const backlog = parseBacklog(await readFile(BACKLOG_FILE, 'utf8'));
  const known = await loadKnownPerfumes();
  await loadRemotePerfumes(known);

  const selected = selectItems(backlog, options).filter((item) => {
    return known.get(slugify(item.name)) !== slugify(item.brand);
  });
  console.log(`${selected.length} perfumes a ingerir (backlog sem [x] e fora do banco/seed):`);
  for (const item of selected)
    console.log(`  - ${item.brand} — ${item.name}${item.sheet ? ' [ficha]' : ''}`);
  if (options.dryRun) return console.log('✔ --dry-run: nada foi consultado nem gravado.');
  if (selected.length === 0) return;
  if (!process.env.GEMINI_API_KEY) fail('Defina GEMINI_API_KEY no .env.local.');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const blocks = [];
  const ingested = [];
  const failures = [];
  for (const [index, item] of selected.entries()) {
    const label = `${item.brand} — ${item.name}`;
    try {
      const { data, imageUrl } = await askGemini(ai, item);
      const slugs = resolveSlugs(data, known);
      if (slugs.duplicate) {
        console.log(`↷ ${label}: já cadastrado (${slugs.perfumeSlug})`);
        continue;
      }
      const photo = await captureImage(
        { name: item.name, brand: item.brand, imageUrl, officialUrl: officialUrlOf(item.sheet) },
        slugs,
        { loose: options.loose }
      );
      known.set(slugs.perfumeSlug, slugs.brandSlug);
      blocks.push(buildMigrationSql(data, slugs));
      ingested.push({ brand: item.brand, name: item.name, ...slugs, image: photo.file });
      console.log(`✔ ${label} (${data.notes.length} notas, foto: ${photo.source})`);
    } catch (error) {
      failures.push({
        brand: item.brand,
        name: item.name,
        reason: errorMessage(error),
        at: new Date().toISOString(),
      });
      console.error(`✖ ${label}: ${errorMessage(error)}`);
    }
    if (index < selected.length - 1)
      await sleep(PAUSE_MIN_MS + Math.random() * (PAUSE_MAX_MS - PAUSE_MIN_MS));
  }

  if (failures.length > 0) await saveErrors(failures);
  let migration = null;
  if (blocks.length > 0) {
    const stamp = nextMigrationTimestamp(await readdir(MIGRATIONS_DIR));
    migration = join(MIGRATIONS_DIR, `${stamp}_ingest_catalog_${options.name}.sql`);
    await writeFile(
      migration,
      `-- Gerado por scripts/ingest-catalog.mjs: ${ingested.length} perfumes. Revise antes de aplicar.\n\n${blocks.join('\n')}`,
      'utf8'
    );
    await mkdir(BATCH_DIR, { recursive: true });
    await writeFile(
      join(BATCH_DIR, `${options.name}.json`),
      `${JSON.stringify({ migration, items: ingested }, null, 2)}\n`
    );
  }
  console.log(`\n${ingested.length} ingeridos, ${failures.length} na quarentena (${ERRORS_FILE}).`);
  if (migration) {
    console.log(`Migration: ${migration}`);
    console.log('Próximos passos: conferir as fotos em scripts/raw-images/, `npm run images`,');
    console.log(`  --apply-images ${migration}, --mark-done scripts/batch/${options.name}.json`);
  }
  for (const f of failures) console.log(`  falhou: ${f.brand} — ${f.name}: ${f.reason}`);
};

const runApplyImages = async (file) => {
  const manifest = await readJson(MANIFEST_FILE, null);
  if (!manifest) fail('scripts/processed-images/manifest.json não existe. Rode `npm run images`.');
  const { sql, applied } = applyImagePaths(await readFile(file, 'utf8'), manifest);
  await writeFile(file, sql, 'utf8');
  const left = [...sql.matchAll(/'([a-z0-9-]+\/[a-z0-9-]+\.webp)'/g)].map((m) => m[1]);
  console.log(`✔ ${applied.length} image_path com hash aplicados em ${file}`);
  if (left.length > 0)
    console.warn(`! Ainda provisórios (sem foto processada): ${left.join(', ')}`);
};

const runMarkDone = async (file) => {
  const batch = await readJson(file, null);
  if (!batch?.items) fail(`${file} não é um lote válido.`);
  const { markdown, marked } = markDone(await readFile(BACKLOG_FILE, 'utf8'), batch.items);
  await writeFile(BACKLOG_FILE, markdown, 'utf8');
  console.log(`✔ ${marked} itens marcados [x] em docs/CATALOGO_EXPANSAO.md`);
};

const main = async () => {
  const parsed = parseCatalogArgs(process.argv.slice(2));
  if (parsed.error) fail(parsed.error);
  const { options } = parsed;
  if (options.applyImages !== null) return runApplyImages(resolve(options.applyImages));
  if (options.markDone !== null) return runMarkDone(resolve(options.markDone));
  return runIngest(options);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => fail(errorMessage(error)));
}
