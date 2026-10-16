// PWA e modo offline (docs/PRODUCT.md, Seção 11), contra o build de produção com Service Worker.
// Dados reais do seed: 20 perfumes de 6 marcas (catálogo real, Fase 12).
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { cards, registerViaUi } from './helpers.ts';

const BANNER = 'Você está navegando offline. O catálogo salvo continua disponível.';
const PERSIST_KEY = 'sillage-query-cache';

// A primeira visita instala o Service Worker; a seguinte já nasce controlada por ele.
const installServiceWorker = async (page: Page, path = '/catalog') => {
  await page.goto(path);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
};

// Texto bruto do cache persistido no IndexedDB (idb-keyval: banco "keyval-store")
const readPersisted = (page: Page): Promise<string | null> =>
  page.evaluate(
    (key) =>
      new Promise<string | null>((resolve, reject) => {
        const open = indexedDB.open('keyval-store');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('keyval')) return resolve(null);
          const get = db.transaction('keyval').objectStore('keyval').get(key);
          get.onerror = () => reject(get.error);
          get.onsuccess = () => resolve(get.result ? JSON.stringify(get.result) : null);
        };
      }),
    PERSIST_KEY
  );

test.describe('PWA', () => {
  test('manifest com nome, cores do tema e ícones (incluindo maskable)', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: { sizes: string; purpose?: string }[];
    };
    expect(manifest).toMatchObject({
      name: 'Sillage',
      short_name: 'Sillage',
      start_url: '/',
      display: 'standalone',
      theme_color: '#f6f4ed',
      background_color: '#f6f4ed',
    });
    const sizes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose ?? 'any'}`);
    expect(sizes).toEqual(
      expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable'])
    );
  });
});

test.describe('offline', () => {
  test('logado: o catálogo visitado antes continua aparecendo sem internet, com o banner', async ({
    page,
    context,
  }) => {
    await registerViaUi(page);
    await installServiceWorker(page);
    await expect(cards(page)).toHaveCount(20);
    // O cache persistido é gravado com atraso (throttle): espera aparecer no IndexedDB
    await expect.poll(() => readPersisted(page), { timeout: 10_000 }).toContain('"public"');

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByText(BANNER)).toBeVisible();
    await expect(cards(page)).toHaveCount(20);
    await expect(page.getByRole('heading', { level: 2, name: 'Malbec Signature' })).toBeVisible();
  });

  test('o banner aparece ao perder a conexão e some ao voltar', async ({ page, context }) => {
    await registerViaUi(page);
    await page.goto('/catalog');
    await expect(page.getByText(BANNER)).toHaveCount(0);
    await context.setOffline(true);
    await expect(page.getByText(BANNER)).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText(BANNER)).toHaveCount(0);
  });

  test('logado e offline: ações de escrita ficam desabilitadas, com explicação', async ({
    page,
    context,
    isMobile,
  }) => {
    await registerViaUi(page);
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(20);
    const toggle = cards(page)
      .first()
      .getByRole('button', { name: /Adicionar à Coleção|Tenho|Quero/ });
    await expect(toggle).toBeEnabled();

    await context.setOffline(true);
    await expect(toggle).toBeDisabled();

    // Nos detalhes (visitados online, então já em cache) a avaliação também fica desabilitada
    await context.setOffline(false);
    await cards(page).first().getByRole('link').first().click();
    await expect(page.getByRole('button', { name: 'Avaliar fragrância' })).toBeEnabled();
    await context.setOffline(true);
    await expect(page.getByRole('button', { name: 'Avaliar fragrância' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Abrir o Nez' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    // Cada ação desabilitada tem um wrapper focável com a explicação
    const hint = page.getByLabel(/Indisponível offline/).first();
    await expect(hint).toBeVisible();
    // Tooltip só no desktop: em toque (emulação do Pixel) o foco programático não abre o Radix
    if (!isMobile) {
      await hint.hover();
      await expect(page.getByRole('tooltip').first()).toContainText('Indisponível offline');
    }
  });

  test('nenhum dado privado vai para o IndexedDB', async ({ page }) => {
    const email = await registerViaUi(page);
    await page.goto('/collection');
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(20);
    await expect.poll(() => readPersisted(page), { timeout: 10_000 }).toContain('"public"');

    const raw = (await readPersisted(page)) ?? '';
    expect(raw).not.toContain('"private"');
    expect(raw).not.toContain(email);
  });

  // D7 (docs/PRODUCT.md, Seção 12): o cache público persistido continua existindo depois do logout,
  // mas sem login só a Landing abre: não há tela que o mostre.
  test('após o logout, offline, só a Landing abre e nenhum dado do catálogo aparece', async ({
    page,
    context,
  }) => {
    await registerViaUi(page);
    await installServiceWorker(page);
    await expect(cards(page)).toHaveCount(20);
    await expect.poll(() => readPersisted(page), { timeout: 10_000 }).toContain('"public"');

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/$/);

    await context.setOffline(true);
    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/\?redirect=%2Fcatalog$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Descubra perfumes pelas suas notas' })
    ).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByText('Malbec Signature')).toHaveCount(0);
  });

  test('visitante offline: a Landing abre pelo shell e as rotas protegidas não mostram dados', async ({
    page,
    context,
  }) => {
    await installServiceWorker(page, '/');
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Descubra perfumes pelas suas notas' })
    ).toBeVisible();
    await expect(page.getByText('Você está navegando offline.')).toBeVisible();

    for (const path of ['/catalog', '/perfumes/malbec-signature', '/collection']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/\?redirect=/);
      await expect(cards(page)).toHaveCount(0);
      await expect(page.getByText('Malbec Signature')).toHaveCount(0);
    }
  });
});
