import { expect, test, type Page } from '@playwright/test';

const ogTitle = (page: Page) => page.locator('meta[property="og:title"]');

test.describe('seo', () => {
  test('home, catálogo e detalhe trocam título e og:title a cada rota', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Sillage');
    await expect(ogTitle(page)).toHaveAttribute('content', 'Sillage');

    await page.goto('/catalog');
    await expect(page).toHaveTitle('Catálogo — Sillage');
    await expect(ogTitle(page)).toHaveAttribute('content', 'Catálogo — Sillage');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');

    await page.goto('/perfumes/malbec-signature');
    await expect(page).toHaveTitle('Malbec Signature · O Boticário — Sillage');
    await expect(ogTitle(page)).toHaveAttribute(
      'content',
      'Malbec Signature · O Boticário — Sillage'
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      /\/perfumes\/malbec-signature$/
    );
  });

  test('navegação no cliente atualiza os metadados sem recarregar', async ({ page }) => {
    await page.goto('/catalog');
    await expect(ogTitle(page)).toHaveAttribute('content', 'Catálogo — Sillage');
    await page
      .getByRole('link', { name: /Malbec Signature/ })
      .first()
      .click();
    await expect(page).toHaveTitle('Malbec Signature · O Boticário — Sillage');
    await expect(ogTitle(page)).toHaveAttribute(
      'content',
      'Malbec Signature · O Boticário — Sillage'
    );
  });

  test('imagem de compartilhamento é uma URL absoluta e o card é summary_large_image', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https?:\/\/.+\/pwa-512x512\.png$/
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
  });
});
