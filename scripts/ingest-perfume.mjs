// Ingere um perfume no catálogo: pergunta ao Gemini (saída estruturada) e GERA UMA MIGRATION SQL
// idempotente, que você revisa e aplica (`npx supabase migration up` local, `db push` em produção).
// Nada é gravado direto no banco: o script só lê marcas, notas e perfumes com a chave anon.
//
// Uso: npm run ingest -- [--dry-run] "Aventus Creed"
//
// Variáveis (ambiente, .env.local ou .env, nesta ordem):
//   GEMINI_API_KEY            chave da API do Google AI Studio (sem prefixo VITE_)
//   GEMINI_MODEL              opcional (padrão gemini-3.5-flash)
//   VITE_SUPABASE_URL         (ou SUPABASE_URL)
//   VITE_SUPABASE_ANON_KEY    (ou SUPABASE_ANON_KEY): leitura pública
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(join(ROOT, file));
  } catch {
    // arquivo ausente: segue
  }
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

// Enums espelham os do banco (src/types/database.types.ts)
const FAMILIES = [
  'citrus',
  'floral',
  'woody',
  'green',
  'aquatic',
  'oriental',
  'spicy',
  'fruity',
  'aromatic',
  'musky',
];
const POSITIONS = ['top', 'heart', 'base'];
const CONCENTRATIONS = ['parfum', 'extrait', 'edp', 'edt', 'edc'];
const GENDERS = ['masculine', 'feminine', 'unisex'];

export const PerfumeSchema = z.object({
  name: z.string().describe('Nome do perfume sem a marca, ex.: "Aventus"'),
  brand: z.string().describe('Nome da marca, ex.: "Creed"'),
  releaseYear: z.number().int().nullable().describe('Ano de lançamento; null se incerto'),
  concentration: z
    .enum(CONCENTRATIONS)
    .nullable()
    .describe('Concentração oficial; null se não for possível confirmar'),
  gender: z.enum(GENDERS),
  perfumer: z.string().nullable().describe('Perfumista (nariz); null se desconhecido'),
  description: z
    .string()
    .describe('Descrição envolvente em português do Brasil, até 600 caracteres'),
  notes: z
    .array(
      z.object({
        name: z.string().describe('Nome da nota em português do Brasil, ex.: "Bergamota"'),
        family: z.enum(FAMILIES).describe('Família olfativa principal da nota'),
        position: z.enum(POSITIONS),
        description: z
          .string()
          .min(1)
          .max(240)
          .describe('Descrição sensorial da nota em português do Brasil, de 1 a 240 caracteres'),
      })
    )
    .describe('Pirâmide olfativa completa'),
});

// A API do Gemini não aceita o `$schema` do Zod, e `anyOf: [X, null]` (de .nullable())
// vira `type: [X, 'null']`
const toGeminiSchema = (node) => {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node === null || typeof node !== 'object') return node;
  const { anyOf, $schema: _ignored, ...others } = node;
  const converted = Object.fromEntries(
    Object.entries(others).map(([key, value]) => [key, toGeminiSchema(value)])
  );
  if (Array.isArray(anyOf)) {
    const nonNull = anyOf.filter((item) => item.type !== 'null');
    if (nonNull.length === 1 && anyOf.length === 2 && typeof nonNull[0].type === 'string') {
      return { ...toGeminiSchema(nonNull[0]), ...converted, type: [nonNull[0].type, 'null'] };
    }
    return { ...converted, anyOf: toGeminiSchema(anyOf) };
  }
  return converted;
};
const RESPONSE_JSON_SCHEMA = toGeminiSchema(z.toJSONSchema(PerfumeSchema));

export const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Valida o formato e recusa concentração não confirmada (nunca chutar)
export const validatePerfume = (raw, query) => {
  const perfume = PerfumeSchema.parse(raw);
  if (perfume.concentration === null) {
    throw new Error(
      `Concentração oficial de "${query}" não confirmada (aceitas: ${CONCENTRATIONS.join(', ')}). Cadastro recusado.`
    );
  }
  return perfume;
};

// Literal SQL: aspas simples dobradas; o texto nunca vira identificador
export const sqlString = (value) =>
  value === null ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

// Notas são globais: uma por slug; a família e a descrição da primeira ocorrência vencem
export const uniqueNotes = (notes) => {
  const bySlug = new Map();
  for (const note of notes) {
    const slug = slugify(note.name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, { ...note, slug });
  }
  return [...bySlug.values()];
};

// `perfumes` = Map<slug do perfume, slug da marca>. Colisão com outra marca: o slug leva a marca
export const resolveSlugs = (data, perfumes) => {
  const brandSlug = slugify(data.brand);
  let perfumeSlug = slugify(data.name);
  const clash = perfumes.get(perfumeSlug);
  if (clash !== undefined) {
    if (clash === brandSlug) return { brandSlug, perfumeSlug, duplicate: true };
    perfumeSlug = slugify(`${data.brand} ${data.name}`);
  }
  return { brandSlug, perfumeSlug, duplicate: false };
};

export const buildMigrationSql = (data, { brandSlug, perfumeSlug }) => {
  const notes = uniqueNotes(data.notes);
  const links = new Map();
  for (const note of data.notes) {
    const slug = slugify(note.name);
    if (slug) links.set(`${slug}:${note.position}`, [slug, note.position]);
  }
  return [
    `-- Gerado por scripts/ingest-perfume.mjs: ${data.brand} ${data.name}. Revise antes de aplicar.`,
    '',
    'insert into public.brands (slug, name) values',
    `  (${sqlString(brandSlug)}, ${sqlString(data.brand)})`,
    'on conflict (slug) do nothing;',
    '',
    'insert into public.notes (slug, name, family, description) values',
    notes
      .map(
        (n) =>
          `  (${sqlString(n.slug)}, ${sqlString(n.name)}, ${sqlString(n.family)}::public.olfactive_family, ${sqlString(n.description)})`
      )
      .join(',\n'),
    'on conflict (slug) do nothing;',
    '',
    'insert into public.perfumes (slug, brand_id, name, concentration, gender, release_year, perfumer, description)',
    `select ${sqlString(perfumeSlug)}, b.id, ${sqlString(data.name)}, ${sqlString(data.concentration)}::public.concentration_type,`,
    `  ${sqlString(data.gender)}::public.perfume_gender, ${data.releaseYear ?? 'null'}, ${sqlString(data.perfumer?.trim() || null)}, ${sqlString(data.description)}`,
    `from public.brands b where b.slug = ${sqlString(brandSlug)}`,
    'on conflict (slug) do nothing;',
    '',
    'insert into public.perfume_notes (perfume_id, note_id, position)',
    'select p.id, n.id, v.position::public.note_position',
    'from (values',
    [...links.values()]
      .map(([slug, position]) => `  (${sqlString(slug)}, ${sqlString(position)})`)
      .join(',\n'),
    ') as v (note_slug, position)',
    `join public.perfumes p on p.slug = ${sqlString(perfumeSlug)}`,
    'join public.notes n on n.slug = v.note_slug',
    'on conflict do nothing;',
    '',
  ].join('\n');
};

const timestamp = (date = new Date()) => date.toISOString().replace(/\D/g, '').slice(0, 14);

const fetchFromGemini = async (query) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents:
      `Perfume: "${query}". Retorne os dados oficiais desse perfume. ` +
      'Use apenas informações em que você tem confiança: se não souber o ano ou o perfumista, ' +
      'use null; não invente notas. Nomes de notas em português do Brasil (ex.: Bergamota, Baunilha), ' +
      'cada uma com uma descrição sensorial curta (até 240 caracteres). ' +
      'A concentração deve ser exatamente uma de: parfum, extrait, edp, edt, edc. ' +
      'Se não for possível confirmar a concentração oficial, use null: não chute.',
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: RESPONSE_JSON_SCHEMA,
    },
  });
  // O SDK não valida: o Zod garante o formato antes de gerar o SQL
  return validatePerfume(JSON.parse(response.text ?? ''), query);
};

const unwrap = ({ data, error }, action) => {
  if (error) throw new Error(`${action}: ${error.message}`);
  return data;
};

const loadExisting = async (supabase, data) => {
  const [brands, notes, perfumes] = await Promise.all([
    supabase.from('brands').select('slug').eq('slug', slugify(data.brand)),
    supabase
      .from('notes')
      .select('slug')
      .in(
        'slug',
        uniqueNotes(data.notes).map((n) => n.slug)
      ),
    supabase
      .from('perfumes')
      .select('slug, brands(slug)')
      .in('slug', [slugify(data.name), slugify(`${data.brand} ${data.name}`)]),
  ]);
  return {
    brandExists: unwrap(brands, 'buscar marca').length > 0,
    noteCount: unwrap(notes, 'buscar notas').length,
    perfumes: new Map(unwrap(perfumes, 'verificar slug').map((r) => [r.slug, r.brands?.slug])),
  };
};

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const query = args
    .filter((arg) => arg !== '--dry-run')
    .join(' ')
    .trim();
  if (!query) fail('Informe o perfume. Ex.: npm run ingest -- [--dry-run] "Aventus Creed"');

  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!process.env.GEMINI_API_KEY) fail('Defina GEMINI_API_KEY no .env.local (veja .env.example).');
  if (!url || !anonKey) fail('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.');
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

  console.log(`Buscando dados no Gemini (${GEMINI_MODEL}) para "${query}"...`);
  const data = await fetchFromGemini(query);
  console.log(
    `  ${data.brand} — ${data.name} (${data.releaseYear ?? 'ano ?'}), ${data.notes.length} notas`
  );

  const existing = await loadExisting(supabase, data);
  const slugs = resolveSlugs(data, existing.perfumes);
  if (slugs.duplicate) {
    fail(
      `"${data.brand} ${data.name}" já está no catálogo (slug ${slugs.perfumeSlug}). Nada a fazer.`
    );
  }
  console.log(
    `  Marca ${existing.brandExists ? 'já existe' : 'nova'}; ${existing.noteCount} notas já existem`
  );

  const sql = buildMigrationSql(data, slugs);
  if (dryRun) {
    console.log(JSON.stringify(data, null, 2));
    console.log(`\n${sql}`);
    console.log('✔ --dry-run: nada foi gravado.');
    return;
  }
  const file = join(
    MIGRATIONS_DIR,
    `${timestamp()}_ingest_${slugs.perfumeSlug.replace(/-/g, '_')}.sql`
  );
  await mkdir(MIGRATIONS_DIR, { recursive: true });
  await writeFile(file, sql, 'utf8');
  console.log(`✔ Migration gerada: ${file}`);
  console.log(
    '  Revise o SQL e aplique com `npx supabase migration up` (local) ou `db push` (produção).'
  );
  console.log('  Adicione imagem e preço depois.');
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
}
