// Captura telas reais do Sillage em HiDPI (deviceScaleFactor 2) para o vídeo do LinkedIn.
//
// Pré-requisitos (os mesmos do E2E da raiz):
//   - Supabase local no ar com o seed (`npm run db:start` na raiz) e .env.local preenchido;
//   - Playwright instalado na raiz (o import abaixo sobe até ../node_modules).
// O script reaproveita um `vite preview` já aberto na porta 4173; se não houver, faz o build e o sobe.
// Os dados da demonstração (usuária Helena Vasconcelos) são semeados por SQL como dono do banco, no
// mesmo container do E2E. Clima e Nez são interceptados: nada sai para a rede real.
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIDEO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_DIR = resolve(VIDEO_DIR, '..');
const OUT_DIR = join(VIDEO_DIR, 'public', 'captures');
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;
const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? 'supabase_db_sillage';
const THEME_KEY = 'sillage-theme';
const MIN_BYTES = 20 * 1024;

const DEMO = {
  name: 'Helena Vasconcelos',
  email: 'helena.vasconcelos@sillage-demo.local',
  password: 'Sillage2026x',
};

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };
const YEAR = new Date().getFullYear();

// ---------- Banco ----------

const runSql = (sql) =>
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      DB_CONTAINER,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
    ],
    { input: sql, encoding: 'utf8' }
  );

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

// Remove a conta de uma execução anterior: o cadastro pela interface recria tudo do zero
const resetDemoUser = () => runSql(`delete from auth.users where email = ${quote(DEMO.email)};`);

// Coleção: "Tenho" com formatos variados (RN11) e "Quero"
const OWNED = [
  { slug: 'malbec-signature', format: 'bottle', volume: 100 },
  { slug: 'bossa', format: 'bottle', volume: 100 },
  { slug: 'le-male-elixir', format: 'decant', volume: 10 },
  { slug: 'folha-imperial', format: 'bottle', volume: 50 },
  { slug: 'scandal', format: 'sample', volume: 2 },
  { slug: 'maktub', format: 'decant', volume: 10 },
  { slug: 'ekos-alma', format: 'bottle', volume: 100 },
];
const WANTED = ['la-belle', 'sahara-absolu', 'gaultier-divine'];

// Memorial: perfume do dia ao longo do ano (dias atrás de hoje). O mês atual fica cheio para o
// calendário e o varal; os meses anteriores alimentam o DNA e a Retrospectiva.
const ROTATION = [
  'malbec-signature',
  'bossa',
  'le-male-elixir',
  'folha-imperial',
  'scandal',
  'maktub',
  'ekos-alma',
  'carioca',
  'zaad-santal',
  'fleur',
];

const seedDemoData = () => {
  const owned = OWNED.map(
    ({ slug, format, volume }) =>
      `(${quote(slug)}, 'owned'::public.collection_status, ${quote(format)}::public.collection_format, ${volume})`
  );
  const wanted = WANTED.map(
    (slug) =>
      `(${quote(slug)}, 'wanted'::public.collection_status, null::public.collection_format, null::numeric)`
  );

  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysAgo = new Set();
  // Mês atual: quase todos os dias até hoje
  for (let d = 0; d < dayOfMonth; d += 1) if (d % 5 !== 3) daysAgo.add(d);
  // Ano: dois ou três dias por semana para trás, até 1º de janeiro
  const startOfYear = new Date(YEAR, 0, 1);
  const maxBack = Math.floor((today - startOfYear) / 86_400_000);
  for (let d = dayOfMonth; d <= maxBack; d += 1)
    if (d % 7 === 0 || d % 7 === 3 || d % 11 === 5) daysAgo.add(d);
  const daily = [...daysAgo].map(
    (d, index) => `(${quote(ROTATION[(d * 7 + index) % ROTATION.length])}, ${d})`
  );

  runSql(`
    update public.profiles set display_name = ${quote(DEMO.name)}, timezone = 'America/Sao_Paulo'
    where id = (select id from auth.users where email = ${quote(DEMO.email)});

    insert into public.collection_items (user_id, perfume_id, status, format, volume_ml)
    select u.id, p.id, v.status, v.format, v.volume
    from auth.users u
    cross join (values ${[...owned, ...wanted].join(', ')}) as v (slug, status, format, volume)
    join public.perfumes p on p.slug = v.slug
    where u.email = ${quote(DEMO.email)}
    on conflict (user_id, perfume_id) do update
      set status = excluded.status, format = excluded.format, volume_ml = excluded.volume_ml;

    insert into public.daily_perfumes (user_id, perfume_id, date)
    select u.id, p.id, (now() at time zone pr.timezone)::date - v.days_ago
    from auth.users u
    join public.profiles pr on pr.id = u.id
    cross join (values ${daily.join(', ')}) as v (slug, days_ago)
    join public.perfumes p on p.slug = v.slug
    where u.email = ${quote(DEMO.email)}
    on conflict do nothing;
  `);
  return daily.length;
};

// ---------- Servidor ----------

const isUp = async () => {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch {
    return false;
  }
};

const ensureServer = async () => {
  if (await isUp()) {
    console.log(`Reaproveitando o servidor em ${BASE_URL}`);
    return null;
  }
  console.log('Gerando o build de produção do app (npm run build na raiz)…');
  execFileSync('npm', ['run', 'build'], { cwd: ROOT_DIR, stdio: 'inherit', shell: true });
  console.log(`Subindo o vite preview em ${BASE_URL}…`);
  const server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT_DIR,
    stdio: 'ignore',
    shell: true,
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isUp()) return server;
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error('O vite preview não respondeu em 60 s');
};

// No Windows o `shell: true` cria um cmd intermediário: só o taskkill derruba a árvore toda
const stopServer = (server) => {
  if (!server?.pid) return;
  if (process.platform === 'win32') {
    execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    server.kill();
  }
};

// ---------- Interceptações (clima e Nez) ----------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

const NEZ_DISCOVERY = {
  text: 'Para um dia ameno e um encontro à noite, escolhi três rastros que conversam com o seu DNA: madeiras macias, um acorde âmbar e um frescor verde que abre espaço para a pele.',
  picks: ['maktub', 'folha-imperial', 'malbec-signature'],
};

const daysBefore = (days) => new Date(Date.now() - days * 86_400_000).toISOString();
const DEMO_PASSKEYS = [
  {
    id: 'demo-passkey-iphone',
    friendly_name: 'iPhone da Helena',
    created_at: daysBefore(120),
    last_used_at: daysBefore(0),
  },
  {
    id: 'demo-passkey-mac',
    friendly_name: 'MacBook Air',
    created_at: daysBefore(64),
    last_used_at: daysBefore(3),
  },
];

const stubNetwork = async (context) => {
  // São Paulo, 22 °C, céu limpo (weather_code 0)
  await context.route('**://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: { current: { temperature_2m: 22, relative_humidity_2m: 58, weather_code: 0 } },
    })
  );
  await context.route('**://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            country: 'Brasil',
            country_code: 'BR',
            latitude: -23.5475,
            longitude: -46.63611,
            timezone: 'America/Sao_Paulo',
          },
        ],
      },
    })
  );
  await context.route('**://api.bigdatacloud.net/**', (route) =>
    route.fulfill({
      json: { locality: 'São Paulo', city: 'São Paulo', principalSubdivisionCode: 'BR-SP' },
    })
  );
  // O Supabase Auth local não expõe /passkeys: a lista do Perfil mostra dois aparelhos de exemplo
  await context.route('**/auth/v1/passkeys', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({ json: DEMO_PASSKEYS });
  });
  await context.route('**/functions/v1/nez-ai', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    await route.fulfill({ status: 200, headers: CORS, json: NEZ_DISCOVERY });
  });
};

// ---------- Navegador ----------

const newContext = async (browser, { viewport, theme, storageState }) => {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
    deviceScaleFactor: 2,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Sem animações pela metade no print: o app respeita reduced motion e mostra o estado final
    reducedMotion: 'reduce',
    colorScheme: theme,
    geolocation: { latitude: -23.55, longitude: -46.63 },
    permissions: ['geolocation'],
    storageState,
  });
  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [THEME_KEY, theme]
  );
  await stubNetwork(context);
  return context;
};

// Espera a rede assentar, as fontes e as imagens carregarem (sem skeletons no print)
const settle = async (page) => {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    // Imagens lazy fora da tela nunca carregariam sozinhas (e o print de página inteira as mostra)
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
    const images = [...document.images].filter((img) => !img.complete);
    const loaded = Promise.all(
      images.map(
        (img) =>
          new Promise((done) => {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          })
      )
    );
    // Teto de espera: uma imagem travada não pode segurar a captura inteira
    await Promise.race([loaded, new Promise((done) => setTimeout(done, 10_000))]);
  });
  await page.waitForTimeout(600);
};

const shoot = async (page, file, options = {}) => {
  await settle(page);
  const path = join(OUT_DIR, file);
  await page.screenshot({ path, ...options });
  console.log(`  ✓ ${file}`);
};

// Autenticador de plataforma virtual (CDP): o Chromium headless não tem biometria, e o app só mostra
// "Entrar com Face ID ou Digital" e as Passkeys quando o aparelho oferece uma
const openPage = async (context) => {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  return page;
};

const registerDemo = async (browser) => {
  const context = await newContext(browser, { viewport: DESKTOP, theme: 'light' });
  const page = await openPage(context);
  await page.goto('/register');
  await page.getByLabel('Nome').fill(DEMO.name);
  await page.getByLabel('E-mail').fill(DEMO.email);
  await page.getByLabel('Senha', { exact: true }).fill(DEMO.password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL(/\/$/);
  const state = await context.storageState();
  await context.close();
  return state;
};

// ---------- Capturas ----------

const capturePublic = async (browser) => {
  const landing = await newContext(browser, { viewport: DESKTOP, theme: 'light' });
  const page = await openPage(landing);
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await shoot(page, '01-landing-light-desktop.png');
  await landing.close();

  const auth = await newContext(browser, { viewport: MOBILE, theme: 'dark' });
  const login = await openPage(auth);
  await login.goto('/login');
  await login.getByRole('button', { name: 'Entrar com Face ID ou Digital' }).waitFor();
  await shoot(login, '02-auth-login-mobile.png');
  await auth.close();
};

const captureApp = async (browser, storageState) => {
  // Desktop claro
  const light = await newContext(browser, { viewport: DESKTOP, theme: 'light', storageState });
  const page = await openPage(light);

  await page.goto('/');
  await page.getByRole('region', { name: 'Clima de hoje' }).waitFor();
  await page.getByRole('article', { name: 'Sugestão do dia' }).waitFor();
  await shoot(page, '03-home-light-desktop.png');

  await page.getByRole('button', { name: 'Compartilhar dia' }).click();
  const share = page.getByRole('dialog', { name: 'Compartilhar o seu dia' });
  await share.getByRole('img', { name: /Card do Perfume do Dia/ }).waitFor();
  await shoot(page, '05-sotd-share-dialog.png');
  await page.keyboard.press('Escape');

  await page.goto('/catalog?families=woody,oriental');
  await page.getByRole('article').first().waitFor();
  await shoot(page, '06-catalog-light-desktop.png');

  await page.goto('/perfumes/malbec-black');
  await page.getByRole('heading', { level: 1, name: 'Malbec Black' }).waitFor();
  await shoot(page, '07-perfume-detail-pyramid.png', { fullPage: true });

  const affinity = page.getByRole('region', { name: 'Combina com você?' });
  await affinity.getByText(/^Afinidade/).waitFor();
  await affinity.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -96));
  await shoot(page, '08-perfume-affinity.png');

  await page.goto('/compare?a=malbec-signature&b=bossa');
  await page.getByRole('heading', { level: 2, name: 'Bossa' }).waitFor();
  await shoot(page, '09-compare-desktop.png');

  await page.goto('/perfumes/malbec-black');
  await page.getByRole('heading', { level: 1, name: 'Malbec Black' }).waitFor();
  await page.getByRole('button', { name: 'Abrir o Nez' }).click();
  const drawer = page.getByRole('dialog', { name: 'Nez, seu Mestre Perfumista' });
  await drawer.getByRole('button', { name: 'Guiar minha escolha' }).click();
  await drawer.getByRole('button', { name: 'Ameno' }).click();
  await drawer.getByRole('button', { name: 'Continuar' }).click();
  await drawer.getByRole('button', { name: 'Noite e encontro' }).click();
  await drawer.getByRole('button', { name: 'Continuar' }).click();
  await drawer.getByRole('button', { name: 'Amadeirado' }).click();
  await drawer.getByRole('button', { name: 'Usar o meu DNA olfativo' }).click();
  await drawer.getByRole('button', { name: 'Pedir a curadoria' }).click();
  await drawer.getByRole('list', { name: 'Perfumes escolhidos pelo Nez' }).waitFor();
  await shoot(page, '11-nez-discovery-drawer.png');

  await page.goto('/collection');
  await page.getByRole('tab', { name: /^Tenho/ }).waitFor();
  await page.getByRole('article').first().waitFor();
  await shoot(page, '12-collection-owned.png');

  await page.goto('/memorial');
  await page.getByRole('heading', { level: 1, name: 'Memorial' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 300));
  await shoot(page, '13-memorial-calendar.png');

  await page.goto('/memorial?vista=varal');
  await page.getByRole('heading', { level: 1, name: 'Memorial' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 230));
  await shoot(page, '14-memorial-varal.png');

  await page.goto(`/recap/${YEAR}`);
  await page.getByRole('heading', { level: 1, name: `Seu ano em perfumes · ${YEAR}` }).waitFor();
  await shoot(page, '15-recap-slide.png');

  await page.goto('/profile');
  await page.getByRole('heading', { level: 2, name: DEMO.name }).waitFor();
  await page.getByRole('heading', { name: 'Seu DNA olfativo' }).waitFor();
  await shoot(page, '16-profile-dna-passkeys.png', { fullPage: true });
  await light.close();

  // Desktop escuro
  const dark = await newContext(browser, { viewport: DESKTOP, theme: 'dark', storageState });
  const darkPage = await openPage(dark);
  await darkPage.goto('/');
  await darkPage.getByRole('region', { name: 'Clima de hoje' }).waitFor();
  await darkPage.getByRole('article', { name: 'Sugestão do dia' }).waitFor();
  await shoot(darkPage, '04-home-dark-desktop.png', { fullPage: true });
  await dark.close();

  // Celular (comparador em coluna)
  const mobile = await newContext(browser, { viewport: MOBILE, theme: 'light', storageState });
  const mobilePage = await openPage(mobile);
  await mobilePage.goto('/compare?a=malbec-signature&b=bossa');
  await mobilePage.getByRole('heading', { level: 2, name: 'Bossa' }).waitFor();
  await shoot(mobilePage, '10-compare-mobile.png', { fullPage: true });
  await mobile.close();
};

const EXPECTED = [
  '01-landing-light-desktop.png',
  '02-auth-login-mobile.png',
  '03-home-light-desktop.png',
  '04-home-dark-desktop.png',
  '05-sotd-share-dialog.png',
  '06-catalog-light-desktop.png',
  '07-perfume-detail-pyramid.png',
  '08-perfume-affinity.png',
  '09-compare-desktop.png',
  '10-compare-mobile.png',
  '11-nez-discovery-drawer.png',
  '12-collection-owned.png',
  '13-memorial-calendar.png',
  '14-memorial-varal.png',
  '15-recap-slide.png',
  '16-profile-dna-passkeys.png',
];

const validate = () => {
  const problems = [];
  for (const file of EXPECTED) {
    try {
      const { size } = statSync(join(OUT_DIR, file));
      if (size <= MIN_BYTES) problems.push(`${file}: ${size} bytes (mínimo ${MIN_BYTES})`);
      else console.log(`  ${file.padEnd(34)} ${(size / 1024).toFixed(0).padStart(6)} KB`);
    } catch {
      problems.push(`${file}: não foi gerado`);
    }
  }
  if (problems.length > 0) throw new Error(`Capturas inválidas:\n${problems.join('\n')}`);
};

const main = async () => {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const server = await ensureServer();
  const browser = await chromium.launch();
  try {
    console.log('Preparando a conta de demonstração…');
    resetDemoUser();
    const storageState = await registerDemo(browser);
    const days = seedDemoData();
    console.log(`  ${OWNED.length} em Tenho, ${WANTED.length} em Quero, ${days} dias no Memorial`);

    console.log('Capturando telas (HiDPI 2x)…');
    await capturePublic(browser);
    await captureApp(browser, storageState);

    console.log('Validando os arquivos…');
    validate();
    console.log(`Pronto: ${EXPECTED.length} capturas em ${OUT_DIR}`);
  } finally {
    await browser.close();
    stopServer(server);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
