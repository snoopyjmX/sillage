// Comparador (Fase 18B). Dados reais do seed: Malbec Signature e Bossa. Só dados públicos, o clima
// de hoje e o DNA de quem olha; sem duelos (D13).
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { axeViolations, registerViaUi, seedDaily } from './helpers.ts';

const URL = '/compare?a=malbec-signature&b=bossa';
const THEME_KEY = 'sillage-theme';

const row = (page: Page, name: string) => page.getByRole('region', { name, exact: true });

test.describe('comparador', () => {
  test.beforeEach(async ({ page }) => {
    await registerViaUi(page);
  });

  test('pelo detalhe: "Comparar com…" busca, escolhe e abre a comparação lado a lado', async ({
    page,
  }) => {
    await page.goto('/perfumes/malbec-signature');
    await page.getByRole('button', { name: 'Comparar com…' }).click();
    const dialog = page.getByRole('dialog', { name: 'Escolher perfume' });
    await dialog.getByRole('searchbox').fill('bossa');
    const results = dialog.getByRole('list', { name: 'Resultados' });
    await expect(results.getByRole('button', { name: /Malbec Signature/ })).toHaveCount(0);
    await results.getByRole('button', { name: /Bossa/ }).first().click();

    await expect(page).toHaveURL(/\/compare\?a=malbec-signature&b=bossa$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Malbec Signature' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Bossa' })).toBeVisible();
    for (const title of [
      'Pirâmide',
      'Famílias',
      'Fixação e rastro',
      'Clima de hoje',
      'Melhor preço',
      'Combina com você?',
    ]) {
      await expect(row(page, title)).toBeVisible();
    }
    // Cada célula é do seu perfume
    await expect(
      row(page, 'Pirâmide').getByRole('group', { name: 'Malbec Signature' }).getByText('Vetiver')
    ).toBeVisible();
  });

  test('o link é compartilhável: abre direto a mesma comparação e recarregar mantém', async ({
    page,
  }) => {
    await page.goto(URL);
    await expect(row(page, 'Pirâmide')).toBeVisible();
    await page.reload();
    await expect(row(page, 'Pirâmide')).toBeVisible();
    await page.getByRole('link', { name: 'Ver detalhes de Bossa' }).click();
    await expect(page).toHaveURL(/\/perfumes\/bossa$/);
  });

  test('"Trocar" muda só um lado e guarda na URL', async ({ page }) => {
    await page.goto(URL);
    await page.getByRole('button', { name: 'Trocar o segundo perfume' }).click();
    const dialog = page.getByRole('dialog', { name: 'Escolher perfume' });
    await dialog.getByRole('searchbox').fill('malbec');
    await dialog
      .getByRole('list', { name: 'Resultados' })
      .getByRole('button', { name: /Malbec Black/ })
      .click();
    await expect(page).toHaveURL(/\/compare\?a=malbec-signature&b=malbec-black$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Malbec Black' })).toBeVisible();
  });

  test('sem escolha, dois lados vazios; slug inválido ou igual não quebra a página', async ({
    page,
  }) => {
    await page.goto('/compare');
    await expect(page.getByRole('button', { name: 'Escolher perfume' })).toHaveCount(2);

    await page.goto('/compare?a=..%2F..%2Fetc&b=bossa');
    await expect(page.getByRole('heading', { level: 2, name: 'Bossa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Escolher perfume' })).toHaveCount(1);

    await page.goto('/compare?a=bossa&b=bossa');
    await expect(page.getByText('Escolha dois perfumes diferentes para comparar.')).toBeVisible();

    await page.goto('/compare?a=malbec-signature&b=nao-existe-xyz');
    await expect(page.getByText('Não encontramos o que você procurou.')).toBeVisible();
    await expect(row(page, 'Pirâmide')).toHaveCount(0);
  });
});

test('a afinidade da comparação usa o DNA de quem olha e some do outro usuário (RLS)', async ({
  page,
  browser,
}) => {
  const email = await registerViaUi(page);
  seedDaily(email, [
    { slug: 'apoena', daysAgo: 1 },
    { slug: 'boemia', daysAgo: 2 },
    { slug: 'gigi', daysAgo: 3 },
  ]);
  await page.goto(URL);
  await expect(
    row(page, 'Combina com você?')
      .getByText(/^Afinidade/)
      .first()
  ).toBeVisible();

  const otherContext = await browser.newContext({ baseURL: page.url().split('/compare')[0] });
  const other = await otherContext.newPage();
  await registerViaUi(other);
  await other.goto(URL);
  await expect(
    other
      .getByRole('region', { name: 'Combina com você?', exact: true })
      .getByText('Seu DNA ainda está se formando')
      .first()
  ).toBeVisible();
  await expect(
    other.getByRole('region', { name: 'Combina com você?', exact: true }).getByText(/^Afinidade/)
  ).toHaveCount(0);
  await otherContext.close();
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1280, height: 900 },
  ]) {
    test(`axe no comparador, tema ${theme}, ${viewport.width} px`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize(viewport);
      await registerViaUi(page);
      await page.goto(URL);
      await expect(row(page, 'Combina com você?')).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);

      await page.getByRole('button', { name: 'Trocar o segundo perfume' }).click();
      const dialog = page.getByRole('dialog', { name: 'Escolher perfume' });
      await dialog.getByRole('searchbox').fill('bo');
      await expect(dialog.getByRole('list', { name: 'Resultados' })).toBeVisible();
      await expect(dialog).toHaveCSS('opacity', '1');
      expect(await axeViolations(page)).toEqual([]);
    });
  }
}

test('sem rolagem horizontal a 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await registerViaUi(page);
  await page.goto(URL);
  await expect(row(page, 'Pirâmide')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
