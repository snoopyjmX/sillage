import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { catalogFacts, cards, openFilters, PAGE_SIZE, registerViaUi } from './helpers.ts';

const facts = catalogFacts();
const FIRST_PAGE = Math.min(facts.total, PAGE_SIZE);

// O gate libera estas rotas só para quem tem conta: cada teste entra antes de navegar.
test.beforeEach(async ({ page }) => {
  await registerViaUi(page);
});

const THEMES = ['light', 'dark'] as const;
// Mesmo ThemeProvider do app: a chave de localStorage é a do índice (src/lib/theme.ts)
const THEME_KEY = 'sillage-theme';

const scan = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }));
};

for (const theme of THEMES) {
  test.describe(`axe a 360 px, tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize({ width: 360, height: 780 });
    });

    test('catálogo com resultados', async ({ page }) => {
      await page.goto('/catalog');
      await expect(cards(page)).toHaveCount(FIRST_PAGE);
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      expect(await scan(page)).toEqual([]);
    });

    test('gaveta de filtros aberta, com notas e posição', async ({ page }) => {
      await page.goto('/catalog?notes=bergamota&pos=top');
      await expect(cards(page)).toHaveCount(facts.bergamotTop);
      const filters = await openFilters(page, true);
      await filters.getByRole('combobox', { name: 'Buscar nota' }).focus();
      await expect(filters.getByRole('listbox')).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test('estado vazio', async ({ page }) => {
      await page.goto('/catalog?notes=bergamota&pos=heart');
      await expect(page.getByRole('heading', { name: 'Nenhum perfume encontrado' })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test('página 404', async ({ page }) => {
      await page.goto('/nao-existe');
      await expect(
        page.getByRole('heading', { name: 'Não encontramos essa página' })
      ).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });
  });
}

test('axe no desktop (1280 px) com o painel lateral de filtros', async ({ page, isMobile }) => {
  test.skip(isMobile, 'O painel lateral só existe em telas largas');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/catalog?notes=bergamota&pos=top');
  await expect(cards(page)).toHaveCount(facts.bergamotTop);
  await expect(page.getByRole('complementary', { name: 'Filtros' })).toBeVisible();
  expect(await scan(page)).toEqual([]);
});
