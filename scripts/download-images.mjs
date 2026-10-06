// Baixa uma foto candidata de cada perfume do seed (supabase/seed.sql) para scripts/raw-images/.
//
// Como funciona: usa o fetch nativo do Node. Pega o token `vqd` na página de busca do DuckDuckGo,
// consulta a API JSON de imagens (i.js) e, se ele bloquear, usa o Bing. Entre os resultados escolhe
// o 1º de uma fonte confiável (TRUSTED_DOMAINS); sem nenhum, falha (com --loose, aceita o 1º que
// não seja banco de imagens, mas o resultado costuma ser errado).
// Salva em scripts/raw-images/{marca}/{perfume}.jpg. Perfumes que já têm arquivo (qualquer extensão)
// são pulados, a menos que se passe --force (npm run images:download -- --force).
//
// ATENÇÃO:
//  - O primeiro resultado da busca nem sempre é o frasco certo. CONFIRA cada imagem em
//    scripts/raw-images/ antes de subir.
//  - Fotos de frascos têm direitos autorais (docs/PRODUCT.md, Seção 11). Para algo além de
//    desenvolvimento local, troque por fotos próprias ou liberadas pela marca.
//  - Se o DuckDuckGo mudar a API ou limitar as requisições, o perfume é pulado e o script continua;
//    nesse caso, jogue a foto à mão na pasta da marca.
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'raw-images');
const PAUSE_MIN_MS = 1000; // intervalo entre buscas, para não parecer rajada
const PAUSE_MAX_MS = 1500;
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

const FORCE = process.argv.includes('--force'); // substitui fotos já baixadas

const LOOSE = process.argv.includes('--loose'); // aceita fontes fora de TRUSTED_DOMAINS

// Fontes preferidas: sites das marcas, e-commerces de perfumaria e CDNs de produto
const TRUSTED_DOMAINS = [
  'granado.com.br',
  'natura.com.br',
  'boticario.com.br',
  'avatim.com.br',
  'belezanaweb.com.br',
  'epocacosmeticos.com.br',
  'sephora.com.br',
  'fragrantica.com.br',
  'thekingofdecants.com.br',
  'perfumariagizelda.com.br',
  'cloudinary.com',
  'amazon.com.br',
  'mercadolivre.com.br',
  'mlstatic.com',
];

// Bancos de imagens e fontes genéricas: nunca são foto de produto
const STOCK_DOMAINS = [
  'shutterstock.com',
  'istockphoto.com',
  'gettyimages.com',
  'alamy.com',
  'dreamstime.com',
  'depositphotos.com',
  '123rf.com',
  'freepik.com',
  'vecteezy.com',
  'pinterest.com',
  'pinimg.com',
  'wikipedia.org',
  'wikimedia.org',
  'facebook.com',
  'instagram.com',
  'tripadvisor.com',
];

// URLs diretas ({marca}/{perfume}) de lojas oficiais / Beleza na Web: têm prioridade sobre a busca
const DIRECT_URLS = {
  'granado/bossa':
    'https://loja.granado.com.br/media/catalog/product/e/a/ean7896512981530_04.jpg?optimize=high&fit=bounds&height=2152&width=1672',
  'granado/boemia':
    'https://loja.granado.com.br/media/catalog/product/e/a/ean7896512981776_06.jpg?optimize=high&fit=bounds&height=&width=',
  'granado/folha-imperial': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.70585.avif',
  'natura/essencial-unico-masculino':
    'https://production.na01.natura.com/on/demandware.static/-/Sites-natura-br-storefront-catalog/default/dw786e4bc3/NATBRA-103348_1.jpg',
  'natura/essencial-mirra': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.63631.avif',
  'natura/ekos-alma': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.109347.avif',
  'o-boticario/malbec-signature': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.52818.avif',
  'o-boticario/malbec-black': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.55804.avif',
  'o-boticario/lily-le-parfum': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.75818.avif',
  'o-boticario/egeo-vanilla-vibe':
    'https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:eco,w_800/v1/imagens/products/B84213/Egeo-Des-Col-Van-Vibe-90Ml-B84213_.jpg',
  'avatim/gigi':
    'https://cdn.vnda.com.br/1250x/avatim/2026/07/07/18_43_18_218_img_9968-18071230.JPG?v=1783460601',
  'avatim/bonissimo':
    'https://cdn.vnda.com.br/1250x/avatim/2026/07/07/18_48_43_47_img_9973-18079740.JPG?v=1783460925',
  'avatim/apoena':
    'https://cdn.vnda.com.br/1250x/avatim/2024/07/11/10_37_40_222_10_7_6_637_relicarioapoena.jpg?v=1720705060',
  'al-wataniah/sabah-al-ward': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.64579.avif',
  'al-wataniah/qimmah': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.82793.avif',
  'al-wataniah/kayaan-classic': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.82472.avif',
  'al-wataniah/attar-al-wesal':
    'https://cabanamagazine.com.br/image/cache/catalog/Perfumes/Al%20Wataniah/perfume-attar-al-wesal-al-wataniah-masculino-100-ml2-1200x1200.jpg',
  'phytoderm/glamour':
    'https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:eco,w_1800,c_limit/e_trim/v1/imagens/product/78697/37112737-b852-4ded-9a06-267c3b677817-glamour-phytoderm-deo-colonia-perfume-feminino-100ml.png',
  'phytoderm/black': 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.94140.avif',
};

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

// Já existe {slug}.* na pasta da marca? (qualquer extensão de imagem)
const alreadyDownloaded = async (brand, slug) => {
  try {
    const files = await readdir(join(OUTPUT_DIR, brand));
    return files.some((file) => parse(file).name === slug);
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pause = () => PAUSE_MIN_MS + Math.random() * (PAUSE_MAX_MS - PAUSE_MIN_MS);

const fetchOk = async (url, headers) => {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${new URL(url).hostname} respondeu ${response.status}`);
  return response;
};

const searchDuckDuckGo = async (query) => {
  const page = await fetchOk(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images`,
    HEADERS
  );
  const vqd = /vqd=["']?([^"'>&]+)/.exec(await page.text())?.[1];
  if (!vqd) throw new Error('token vqd não encontrado (bloqueio do robô?); coloque a foto à mão');

  const api = await fetchOk(
    `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`,
    { ...HEADERS, Referer: 'https://duckduckgo.com/' }
  );
  const data = await api.json();
  const urls = (data.results ?? []).map((result) => result.image).filter(Boolean);
  if (urls.length === 0) throw new Error('a busca não devolveu imagens');
  return urls;
};

// Fallback quando o DuckDuckGo bloqueia: todos os `murl` (URL original) do HTML do Bing
const searchBing = async (query) => {
  const page = await fetchOk(
    `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`,
    HEADERS
  );
  const urls = [...(await page.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map(
    (match) => match[1]
  );
  if (urls.length === 0) throw new Error('o Bing não devolveu imagens; coloque a foto à mão');
  return urls;
};

const hostnameOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const matchesDomain = (hostname, domains) =>
  domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

// 1º resultado de fonte confiável; senão, o 1º que não seja banco de imagens genérico
const pickImage = (urls) => {
  const trusted = urls.find((url) => matchesDomain(hostnameOf(url), TRUSTED_DOMAINS));
  if (trusted) return { url: trusted, trusted: true };
  // Fora da lista o resultado costuma ser lixo (mapas, jogos, tutoriais): só com --loose
  if (!LOOSE) throw new Error('nenhum resultado de fonte confiável; coloque a foto à mão');
  const product = urls.find((url) => {
    const hostname = hostnameOf(url);
    return hostname !== '' && !matchesDomain(hostname, STOCK_DOMAINS);
  });
  if (!product) throw new Error('nenhum resultado utilizável (só bancos de imagens)');
  return { url: product, trusted: false };
};

const downloadOne = async ([brand, slug, term]) => {
  if (!FORCE && (await alreadyDownloaded(brand, slug))) {
    console.log(`↷ ${brand}/${slug}: já existe, pulando`);
    return 'skipped';
  }

  let imageUrl = DIRECT_URLS[`${brand}/${slug}`];
  let trusted = true;
  if (!imageUrl) {
    const query = `frasco perfume ${term}`;
    let urls;
    try {
      urls = await searchDuckDuckGo(query);
    } catch (error) {
      console.warn(
        `! ${brand}/${slug}: DuckDuckGo falhou (${error instanceof Error ? error.message : error}), tentando o Bing`
      );
      urls = await searchBing(query);
    }
    ({ url: imageUrl, trusted } = pickImage(urls));
  }

  const image = await fetchOk(imageUrl, { ...HEADERS, Referer: 'https://www.fragrantica.com.br/' });
  const buffer = Buffer.from(await image.arrayBuffer());
  if (buffer.length === 0) throw new Error('arquivo vazio');

  const target = join(OUTPUT_DIR, brand, `${slug}.jpg`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
  console.log(
    `✔ ${brand}/${slug}.jpg (${Math.round(buffer.length / 1024)} KB) ← ${hostnameOf(imageUrl)} ${trusted ? '[confiável]' : '[fonte fora da lista]'}\n    ${imageUrl}`
  );
  return 'saved';
};

const main = async () => {
  const counts = { saved: 0, skipped: 0, failed: 0 };

  for (const entry of PERFUMES) {
    try {
      const result = await downloadOne(entry);
      counts[result] += 1;
      if (result === 'saved') await sleep(pause());
    } catch (error) {
      counts.failed += 1;
      console.error(`✖ ${entry[0]}/${entry[1]}: ${error instanceof Error ? error.message : error}`);
      await sleep(pause());
    }
  }

  console.log(
    `\n${counts.saved} baixadas, ${counts.skipped} já existiam, ${counts.failed} com falha. Confira as fotos em scripts/raw-images/ antes de seguir.`
  );
};

await main();
