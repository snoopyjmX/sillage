// "Combina com você?" (Fase 18A) no detalhe do perfume. Dados reais do seed: Malbec Signature
// tem pirâmide completa. A afinidade vem do DNA olfativo (coleção e memorial do usuário).
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { addOwned, axeViolations, registerViaUi, seedCollection, seedDaily } from './helpers.ts';

const URL = '/perfumes/malbec-signature';
const THEME_KEY = 'sillage-theme';

const block = (page: Page) => page.getByRole('region', { name: 'Combina com você?' });

test.describe('combina com você?', () => {
  test('com 3 ou mais perfumes no DNA mostra o rótulo, os motivos e o caminho para o DNA', async ({
    page,
  }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 3, 0);
    await page.goto(URL);

    await expect(page.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
    await expect(block(page).getByText(/^Afinidade (alta|média|baixa)$/)).toBeVisible();
    await expect(block(page).getByRole('list', { name: 'Motivos' })).toBeVisible();
    // Sem porcentagem: o rótulo é honesto sobre o que é uma heurística (D12)
    await expect(block(page)).not.toContainText('%');
    await block(page).getByRole('link', { name: 'Ver o meu DNA olfativo' }).click();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('com poucos perfumes: "Seu DNA ainda está se formando", sem rótulo', async ({ page }) => {
    await registerViaUi(page);
    await page.goto(URL);
    await expect(block(page).getByText('Seu DNA ainda está se formando')).toBeVisible();
    await expect(block(page).getByText(/Faltam 3 perfumes para o seu DNA aparecer/)).toBeVisible();
    await expect(block(page).getByText(/^Afinidade/)).toHaveCount(0);
  });

  test('não aparece para um perfume que a pessoa já tem', async ({ page }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 3, 0);
    addOwned(email, 'malbec-signature');
    await page.goto(URL);
    await expect(page.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
    // A coleção carrega depois do perfume: espera o botão mostrar "Tenho" antes de afirmar a ausência
    await expect(
      page.getByRole('button', { name: /^Tenho\s*:\s*Malbec Signature$/ })
    ).toBeVisible();
    await expect(block(page)).toHaveCount(0);
  });

  test('o DNA de outro usuário não vaza para a afinidade (RLS)', async ({ page, browser }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 3, 0);
    await page.goto(URL);
    await expect(block(page).getByText(/^Afinidade/)).toBeVisible();

    const otherContext = await browser.newContext({ baseURL: page.url().split('/perfumes')[0] });
    const other = await otherContext.newPage();
    await registerViaUi(other);
    await other.goto(URL);
    await expect(
      other.getByRole('region', { name: 'Combina com você?' }).getByText(/^Afinidade/)
    ).toHaveCount(0);
    await expect(other.getByText('Seu DNA ainda está se formando')).toBeVisible();
    await otherContext.close();
  });
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1280, height: 900 },
  ]) {
    test(`axe com a afinidade, tema ${theme}, ${viewport.width} px`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize(viewport);
      const email = await registerViaUi(page);
      seedDaily(email, [
        { slug: 'bossa', daysAgo: 1 },
        { slug: 'bonissimo', daysAgo: 2 },
        { slug: 'apoena', daysAgo: 3 },
      ]);
      await page.goto(URL);
      await expect(block(page).getByText(/^Afinidade/)).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  }
}
