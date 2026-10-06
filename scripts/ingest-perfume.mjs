// Ingere um perfume no catálogo: pergunta ao Gemini (saída estruturada) e grava no Supabase,
// reaproveitando marcas e notas que já existem.
//
// Uso: npm run ingest -- "Aventus Creed"
//
// Variáveis (ambiente, .env.local ou .env, nesta ordem):
//   GEMINI_API_KEY              chave da API do Google AI Studio
//   SUPABASE_URL                (ou VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY   ignora a RLS: só neste script, na sua máquina, nunca com VITE_
// Por segurança só aceita um Supabase local; para outro destino use ALLOW_REMOTE_INGEST=1.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(join(ROOT, file));
  } catch {
    // arquivo ausente: segue
  }
}

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
const CONCENTRATIONS = ['parfum', 'extrait', 'edp', 'edt', 'edc', 'other'];
const GENDERS = ['masculine', 'feminine', 'unisex'];

const PerfumeSchema = z.object({
  name: z.string().describe('Nome do perfume sem a marca, ex.: "Aventus"'),
  brand: z.string().describe('Nome da marca, ex.: "Creed"'),
  releaseYear: z.number().int().nullable().describe('Ano de lançamento; null se incerto'),
  concentration: z.enum(CONCENTRATIONS),
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
      })
    )
    .describe('Pirâmide olfativa completa'),
});

// Sem o `$schema` que o Zod acrescenta: a API do Gemini só quer a definição do objeto
const { $schema: _ignored, ...RESPONSE_JSON_SCHEMA } = z.toJSONSchema(PerfumeSchema);

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fetchFromGemini = async (query) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents:
      `Perfume: "${query}". Retorne os dados oficiais desse perfume. ` +
      'Use apenas informações em que você tem confiança: se não souber o ano ou o perfumista, ' +
      'use null; não invente notas. Nomes de notas em português do Brasil (ex.: Bergamota, Baunilha). ' +
      'Concentração "other" só se nenhuma das opções couber.',
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: RESPONSE_JSON_SCHEMA,
    },
  });
  // O SDK não valida: o Zod garante o formato antes de tocar no banco
  return PerfumeSchema.parse(JSON.parse(response.text ?? ''));
};

const unwrap = ({ data, error }, action) => {
  if (error) throw new Error(`${action}: ${error.message}`);
  return data;
};

const getOrCreateBrand = async (supabase, name) => {
  const slug = slugify(name);
  const existing = unwrap(
    await supabase.from('brands').select('id').eq('slug', slug).maybeSingle(),
    'buscar marca'
  );
  if (existing) {
    console.log(`  Marca já existe: ${name} (${slug})`);
    return existing.id;
  }
  const created = unwrap(
    await supabase.from('brands').insert({ name, slug }).select('id').single(),
    'criar marca'
  );
  console.log(`  Marca criada: ${name} (${slug})`);
  return created.id;
};

// Notas são globais: reaproveita pelo slug e só insere as que faltam (família da primeira vez vence)
const resolveNotes = async (supabase, notes) => {
  const bySlug = new Map();
  for (const note of notes) {
    const slug = slugify(note.name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, { slug, name: note.name, family: note.family });
  }
  const slugs = [...bySlug.keys()];
  const found = unwrap(
    await supabase.from('notes').select('id, slug').in('slug', slugs),
    'buscar notas'
  );
  const ids = new Map(found.map((row) => [row.slug, row.id]));
  const missing = slugs.filter((slug) => !ids.has(slug)).map((slug) => bySlug.get(slug));

  if (missing.length > 0) {
    const created = unwrap(
      await supabase.from('notes').insert(missing).select('id, slug'),
      'criar notas'
    );
    for (const row of created) ids.set(row.slug, row.id);
  }
  console.log(`  Notas: ${found.length} reaproveitadas, ${missing.length} criadas`);
  return ids;
};

const insertPerfume = async (supabase, data, brandId) => {
  let slug = slugify(data.name);
  const clash = unwrap(
    await supabase.from('perfumes').select('id, brand_id').eq('slug', slug).maybeSingle(),
    'verificar slug'
  );
  if (clash) {
    if (clash.brand_id === brandId) {
      fail(`"${data.brand} ${data.name}" já está no catálogo (slug ${slug}). Nada a fazer.`);
    }
    slug = slugify(`${data.brand} ${data.name}`);
  }
  const created = unwrap(
    await supabase
      .from('perfumes')
      .insert({
        slug,
        name: data.name,
        brand_id: brandId,
        concentration: data.concentration,
        gender: data.gender,
        release_year: data.releaseYear,
        perfumer: data.perfumer?.trim() || null,
        description: data.description,
      })
      .select('id')
      .single(),
    'criar perfume'
  );
  console.log(`  Perfume criado: ${data.name} (${slug})`);
  return created.id;
};

const main = async () => {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) fail('Informe o perfume. Ex.: npm run ingest -- "Aventus Creed"');

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.GEMINI_API_KEY) fail('Defina GEMINI_API_KEY no .env.local.');
  if (!url) fail('Defina SUPABASE_URL (ou VITE_SUPABASE_URL) no .env.local.');
  if (!serviceKey) fail('Defina SUPABASE_SERVICE_ROLE_KEY no .env.local.');
  const { hostname } = new URL(url);
  if (!['127.0.0.1', 'localhost'].includes(hostname) && process.env.ALLOW_REMOTE_INGEST !== '1') {
    fail(
      `${hostname} não é um Supabase local. Para gravar mesmo assim, use ALLOW_REMOTE_INGEST=1.`
    );
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log(`Buscando dados no Gemini (${GEMINI_MODEL}) para "${query}"...`);
  const data = await fetchFromGemini(query);
  console.log(
    `  ${data.brand} — ${data.name} (${data.releaseYear ?? 'ano ?'}), ${data.notes.length} notas`
  );

  console.log('Gravando a marca...');
  const brandId = await getOrCreateBrand(supabase, data.brand);

  console.log('Gravando o perfume...');
  const perfumeId = await insertPerfume(supabase, data, brandId);

  try {
    console.log('Inserindo notas...');
    const noteIds = await resolveNotes(supabase, data.notes);
    const links = new Map();
    for (const note of data.notes) {
      const noteId = noteIds.get(slugify(note.name));
      if (noteId) {
        links.set(`${noteId}:${note.position}`, {
          perfume_id: perfumeId,
          note_id: noteId,
          position: note.position,
        });
      }
    }
    unwrap(await supabase.from('perfume_notes').insert([...links.values()]), 'ligar notas');
    console.log(`  ${links.size} relações criadas`);
  } catch (error) {
    // Sem pirâmide o perfume ficaria pela metade: desfaz (perfume_notes cai em cascade)
    await supabase.from('perfumes').delete().eq('id', perfumeId);
    throw error;
  }

  console.log(
    `✔ Concluído. Revise o registro (descrição, notas) e adicione imagem e preço depois.`
  );
};

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
