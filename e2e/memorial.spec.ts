// Memorial em calendário (Fase 19). Dados reais do seed; o Perfume do Dia é semeado por SQL nos
// dias de hoje e dos dois dias anteriores (no fuso do perfil).
import type { Page } from '@playwright/test';
import { expect, stubOpenMeteo, test } from './fixtures.ts';
import { axeViolations, registerViaUi, seedDaily } from './helpers.ts';

const THEME_KEY = 'sillage-theme';

const calendar = (page: Page) => page.getByRole('table', { name: /^Perfumes do mês de / });

test.describe('memorial em calendário', () => {
  test('pelo início: "Ver calendário" abre o mês com os perfumes e cada dia leva ao perfume', async ({
    page,
  }) => {
    const email = await registerViaUi(page);
    seedDaily(email, [{ slug: 'malbec-signature', daysAgo: 0 }]);
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver calendário' }).click();
    await expect(page).toHaveURL(/\/memorial$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Memorial' })).toBeVisible();
    await expect(calendar(page)).toBeVisible();
    // O dia de hoje vem identificado no rótulo do link, não só em cor
    const link = calendar(page).getByRole('link', {
      name: /\(hoje\): Malbec Signature, O Boticário/,
    });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/perfumes\/malbec-signature$/);
  });

  test('navega entre os meses, guarda o mês na URL e não vai ao futuro', async ({ page }) => {
    const email = await registerViaUi(page);
    seedDaily(email, [{ slug: 'malbec-signature', daysAgo: 40 }]);
    await page.goto('/memorial');
    await expect(calendar(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();

    await page.getByRole('button', { name: 'Mês anterior' }).click();
    await expect(page).toHaveURL(/\/memorial\?mes=\d{4}-\d{2}$/);
    const month = new URL(page.url()).searchParams.get('mes') ?? '';
    await expect(page.getByRole('button', { name: 'Próximo mês' })).toBeEnabled();

    // Recarregar mantém o mês; voltar do navegador volta ao mês de hoje
    await page.reload();
    expect(new URL(page.url()).searchParams.get('mes')).toBe(month);
    await page.goBack();
    await expect(page.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();

    await page.goto(`/memorial?mes=${month}`);
    await page.getByRole('button', { name: 'Ir para este mês' }).click();
    await expect(page.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
  });

  test('mês futuro ou inválido na URL volta para o mês de hoje', async ({ page }) => {
    await registerViaUi(page);
    for (const bad of ['9999-12', 'abc', '2026-13']) {
      await page.goto(`/memorial?mes=${bad}`);
      await expect(calendar(page)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
    }
  });

  test('mês sem perfume mostra a grade e o estado vazio com saída para o catálogo', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto('/memorial');
    await expect(calendar(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nenhum perfume neste mês' })).toBeVisible();
    await page.getByRole('link', { name: 'Explorar o catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('o calendário de um usuário não mostra os perfumes de outro (RLS)', async ({
    page,
    browser,
  }) => {
    const email = await registerViaUi(page);
    seedDaily(email, [{ slug: 'malbec-signature', daysAgo: 0 }]);
    await page.goto('/memorial');
    await expect(calendar(page).getByRole('link', { name: /Malbec Signature/ })).toBeVisible();

    const otherContext = await browser.newContext({ baseURL: page.url().split('/memorial')[0] });
    await stubOpenMeteo(otherContext);
    const other = await otherContext.newPage();
    await registerViaUi(other);
    await other.goto('/memorial');
    await expect(other.getByRole('heading', { name: 'Nenhum perfume neste mês' })).toBeVisible();
    await expect(other.getByRole('link', { name: /Malbec Signature/ })).toHaveCount(0);
    await otherContext.close();
  });

  test('sem rolagem horizontal a 360 px e com alvos de toque de pelo menos 44 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const email = await registerViaUi(page);
    seedDaily(email, [{ slug: 'malbec-signature', daysAgo: 0 }]);
    await page.goto('/memorial');
    const link = calendar(page).getByRole('link', { name: /Malbec Signature/ });
    await expect(link).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await link.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(43);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(43);
  });
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1280, height: 900 },
  ]) {
    test(`axe no memorial, tema ${theme}, ${viewport.width} px`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize(viewport);
      const email = await registerViaUi(page);
      seedDaily(email, [
        { slug: 'malbec-signature', daysAgo: 0 },
        { slug: 'bossa', daysAgo: 1 },
      ]);
      await page.goto('/memorial');
      await expect(calendar(page).getByRole('link', { name: /Malbec Signature/ })).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  }
}
