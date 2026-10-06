// Baixa uma foto candidata de cada perfume do seed (supabase/seed.sql) para scripts/raw-images/.
//
// Como funciona: abre a busca de imagens do DuckDuckGo no Chromium do Playwright, espera a rede
// acalmar, pega a 3ª <img> com src http (as primeiras são logos da página) e salva o arquivo em
// scripts/raw-images/{marca}/{perfume}.jpg. Perfumes que já têm arquivo são pulados.
//
// ATENÇÃO:
//  - É a miniatura do resultado de busca, não a foto original: baixa resolução, e o resultado nem
//    sempre é o frasco certo. CONFIRA cada imagem em scripts/raw-images/ antes de subir.
//  - Fotos de frascos têm direitos autorais (docs/PRODUCT.md, Seção 11). Para algo além de
//    desenvolvimento local, troque por fotos próprias ou liberadas pela marca.
//  - Se o DuckDuckGo mudar a página ou bloquear o robô, o perfume é pulado e o script continua;
//    nesse caso, jogue a foto à mão na pasta da marca.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'raw-images');
const IMAGE_INDEX = 2; // pula as duas primeiras imagens (logos do topo)
const PAUSE_MS = 1500; // intervalo entre buscas, para não parecer rajada

// [pasta da marca (slug), slug do perfume, termo de busca]
const PERFUMES = [
  ['granado', 'bossa', 'Granado Bossa'],
  ['granado', 'boemia', 'Granado Boemia'],
  ['granado', 'folha-imperial', 'Granado Folha Imperial'],
  ['natura', 'essencial-unico-masculino', 'Natura Essencial Único Masculino'],
  ['natura', 'essencial-mirra', 'Natura Essencial Mirra'],
  ['natura', 'homem-sagaz', 'Natura Homem Sagaz'],
  ['natura', 'ekos-alma', 'Natura Ekos Alma'],
  ['o-boticario', 'malbec-signature', 'O Boticário Malbec Signature'],
  ['o-boticario', 'malbec-black', 'O Boticário Malbec Black'],
  ['o-boticario', 'lily-le-parfum', 'O Boticário Lily Le Parfum'],
  ['o-boticario', 'egeo-vanilla-vibe', 'O Boticário Egeo Vanilla Vibe'],
  ['avatim', 'gigi', 'Avatim Gigi'],
  ['avatim', 'bonissimo', 'Avatim Boníssimo'],
  ['avatim', 'apoena', 'Avatim Apoena'],
  ['al-wataniah', 'sabah-al-ward', 'Al Wataniah Sabah Al Ward'],
  ['al-wataniah', 'qimmah', 'Al Wataniah Qimmah'],
  ['al-wataniah', 'kayaan-classic', 'Al Wataniah Kayaan Classic'],
  ['al-wataniah', 'attar-al-wesal', 'Al Wataniah Attar Al Wesal'],
  ['phytoderm', 'glamour', 'Phytoderm Glamour'],
  ['phytoderm', 'black', 'Phytoderm Black'],
];

const exists = (path) =>
  stat(path).then(
    () => true,
    () => false
  );

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadOne = async (page, [brand, slug, term]) => {
  const target = join(OUTPUT_DIR, brand, `${slug}.jpg`);
  if (await exists(target)) {
    console.log(`↷ ${brand}/${slug}: já existe, pulando`);
    return 'skipped';
  }

  const url = `https://duckduckgo.com/?q=${encodeURIComponent(`frasco perfume ${term}`)}&iar=images`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const image = page.locator('img[src^="http"]').nth(IMAGE_INDEX);
  try {
    await image.waitFor({ state: 'visible', timeout: 15_000 });
  } catch {
    // O DuckDuckGo costuma responder "Nenhuma imagem encontrada" a navegador automatizado
    throw new Error('a busca não devolveu imagens (bloqueio do robô?); coloque a foto à mão');
  }
  const src = await image.getAttribute('src');
  if (!src) throw new Error('imagem sem src');

  const response = await page.request.get(src);
  if (!response.ok()) throw new Error(`download respondeu ${response.status()}`);
  const buffer = await response.body();
  if (buffer.length === 0) throw new Error('arquivo vazio');

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
  console.log(`✔ ${brand}/${slug}.jpg (${Math.round(buffer.length / 1024)} KB)`);
  return 'saved';
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'pt-BR' });
  const page = await context.newPage();
  const counts = { saved: 0, skipped: 0, failed: 0 };

  try {
    for (const entry of PERFUMES) {
      try {
        const result = await downloadOne(page, entry);
        counts[result] += 1;
        if (result === 'saved') await sleep(PAUSE_MS);
      } catch (error) {
        counts.failed += 1;
        console.error(
          `✖ ${entry[0]}/${entry[1]}: ${error instanceof Error ? error.message : error}`
        );
      }
    }
  } finally {
    await browser.close();
  }

  console.log(
    `\n${counts.saved} baixadas, ${counts.skipped} já existiam, ${counts.failed} com falha. Confira as fotos em scripts/raw-images/ antes de seguir.`
  );
};

await main();
