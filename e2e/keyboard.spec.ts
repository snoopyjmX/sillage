import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { cards } from './helpers.ts';

const MAX_TABS = 120;

// Aperta Tab até o elemento em foco satisfazer o teste (ou desiste).
const tabUntil = async (page: Page, predicate: string): Promise<boolean> => {
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press('Tab');
    const found = await page.evaluate(
      (selector) => document.activeElement?.matches(selector) ?? false,
      predicate
    );
    if (found) return true;
  }
  return false;
};

test.describe('teclado', () => {
  test('Tab alcança os filtros e os cards', async ({ page, isMobile }) => {
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(20);

    // Filtros: no desktop, um chip dentro do painel; no celular, o botão que abre a gaveta
    const filterTarget = isMobile
      ? 'button[aria-haspopup="dialog"]'
      : 'aside[aria-label="Filtros"] button[aria-pressed]';
    expect(await tabUntil(page, filterTarget), 'foco chegou aos filtros').toBe(true);

    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.getByRole('searchbox', { name: 'Buscar perfumes ou marcas' }).focus();
    expect(await tabUntil(page, 'article a[href^="/perfumes/"]'), 'foco chegou a um card').toBe(
      true
    );
  });

  test('a pílula de navegação se opera só com teclado (Tab e Enter)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'No celular a navegação é o menu (coberto em home.spec)');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    expect(
      await tabUntil(page, 'nav[aria-label="Principal"] a[href="/collection"]'),
      'foco chegou ao link Coleção'
    ).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/collection$/);
    await expect(
      page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Coleção' })
    ).toHaveAttribute('aria-current', 'page');
  });

  test('Esc fecha a gaveta de filtros e devolve o foco ao botão', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'A gaveta só existe no celular; no desktop os filtros são um painel fixo');
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(20);

    const trigger = page.getByRole('button', { name: /^Filtros/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Filtros' });
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('a navbar vira sólida com a gaveta aberta (no máx. 2 vidros)', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Só o celular tem a gaveta de filtros');
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(20);
    const blur = () =>
      page.evaluate(() => {
        const bar = document.querySelector('header.glass-bar');
        return bar ? getComputedStyle(bar).backdropFilter : 'sem-barra';
      });
    expect(await blur()).toContain('blur');

    await page.getByRole('button', { name: /^Filtros/ }).click();
    await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible();
    expect(await blur()).toBe('none');
  });

  test('o combobox de notas funciona só com teclado', async ({ page, isMobile }) => {
    await page.goto('/catalog');
    let scope = page.getByRole('complementary', { name: 'Filtros' });
    if (isMobile) {
      await page.getByRole('button', { name: /^Filtros/ }).click();
      scope = page.getByRole('dialog', { name: 'Filtros' });
    }
    const combobox = scope.getByRole('combobox', { name: 'Buscar nota' });
    await combobox.focus();
    await page.keyboard.type('berg');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/notes=bergamota/);
  });
});
