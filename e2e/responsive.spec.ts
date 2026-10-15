import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { registerViaUi, seedDaily } from './helpers.ts';

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
] as const;

// Nada pode vazar para os lados nem ficar cortado pela borda da viewport
const expectNoHorizontalOverflow = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

const expectInsideViewport = async (page: Page, locator: Locator) => {
  const width = page.viewportSize()?.width ?? 0;
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width);
};

// No mobile o palco fica acima do texto: o frasco (ou o placeholder, sem foto) não pode invadir o título
const expectBottleAboveHeading = async (bottle: Locator, heading: Locator) => {
  const [imgBox, headingBox] = [await bottle.boundingBox(), await heading.boundingBox()];
  expect(imgBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(imgBox!.y + imgBox!.height).toBeLessThanOrEqual(headingBox!.y);
};

for (const viewport of VIEWPORTS) {
  test.describe(`mobile ${viewport.width}px`, () => {
    test.use({ viewport });

    test('Home com Perfume do Dia: sem overflow, card inteiro e Nez fora do Memorial', async ({
      page,
    }) => {
      const email = await registerViaUi(page);
      seedDaily(email, [
        { slug: 'malbec-signature', daysAgo: 0 },
        { slug: 'bossa', daysAgo: 1 },
      ]);
      await page.goto('/');

      const highlight = page.getByRole('article', { name: 'Perfume do Dia' });
      await expect(highlight.getByRole('heading', { name: 'Malbec Signature' })).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await expectInsideViewport(page, highlight);
      await expectInsideViewport(
        page,
        highlight.getByRole('heading', { name: 'Malbec Signature' })
      );
      await expectBottleAboveHeading(
        highlight.locator('[data-slot="perfume-stage"] > *').first(),
        highlight.getByRole('heading', { name: 'Malbec Signature' })
      );
      await expectInsideViewport(page, highlight.getByRole('button', { name: 'Compartilhar dia' }));
      await expectInsideViewport(page, highlight.getByRole('link', { name: /Ver detalhes/ }));

      // Em repouso (topo da página) o Nez não pode cobrir o link do Memorial
      const calendar = page.getByRole('link', { name: 'Ver calendário' });
      await calendar.scrollIntoViewIfNeeded();
      await expectInsideViewport(page, calendar);
      const nez = page.getByRole('button', { name: 'Abrir o Nez' });
      await expect(nez).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      const [nezBox, calendarBox] = [await nez.boundingBox(), await calendar.boundingBox()];
      const overlaps =
        nezBox !== null &&
        calendarBox !== null &&
        nezBox.x < calendarBox.x + calendarBox.width &&
        nezBox.x + nezBox.width > calendarBox.x &&
        nezBox.y < calendarBox.y + calendarBox.height &&
        nezBox.y + nezBox.height > calendarBox.y;
      expect(overlaps).toBe(false);
    });

    test('Home com sugestão do dia: título, notas e botões dentro da viewport', async ({
      page,
    }) => {
      await registerViaUi(page);
      await page.goto('/');

      const suggestion = page.getByRole('article', { name: 'Sugestão do dia' });
      await expect(suggestion).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectInsideViewport(page, suggestion);
      await expectInsideViewport(page, suggestion.getByRole('heading', { level: 3 }));
      await expectBottleAboveHeading(
        suggestion.locator('[data-slot="perfume-stage"] > *').first(),
        suggestion.getByRole('heading', { level: 3 })
      );
      await expectInsideViewport(page, suggestion.getByRole('link', { name: 'Ver detalhes' }));
      await expectInsideViewport(page, suggestion.getByRole('button').first());
    });
  });
}
