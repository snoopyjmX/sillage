import type { Page } from '@playwright/test';
import { expect, stubOpenMeteo, test } from './fixtures.ts';
import { axeViolations, registerViaUi, seedCollection, seedDaily, uniqueEmail } from './helpers.ts';

const THEME_KEY = 'sillage-theme';

const stat = (page: Page, label: string) =>
  page.getByRole('term').filter({ hasText: label }).locator('xpath=following-sibling::dd[1]');

test.describe('perfil', () => {
  test('PERMITIDO: edita nome e fuso, vê a mudança e ela persiste depois de recarregar', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Ana E2E', level: 2 })).toBeVisible();

    const form = page.getByRole('form', { name: 'Dados do perfil' });
    await form.getByLabel('Nome').fill('Beatriz Souza');
    await form.getByLabel('Fuso horário').fill('America/Recife');
    await form.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Perfil atualizado.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Beatriz Souza', level: 2 })).toBeVisible();
    await expect(page.getByText('Fuso: America/Recife')).toBeVisible();
    await expect(page.getByText('BS', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Beatriz Souza', level: 2 })).toBeVisible();
    await expect(page.getByText('Fuso: America/Recife')).toBeVisible();
  });

  test('NEGADO: fuso inválido, nome vazio e nome longo são rejeitados e nada muda', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    const form = page.getByRole('form', { name: 'Dados do perfil' });
    await expect(form.getByLabel('Nome')).toHaveValue('Ana E2E');

    await form.getByLabel('Fuso horário').fill('Marte/Olympus');
    await form.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(form.getByText(/Fuso horário inválido/)).toBeVisible();

    await form.getByLabel('Fuso horário').fill('America/Sao_Paulo');
    await form.getByLabel('Nome').fill('   ');
    await form.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(form.getByText('Informe como podemos chamar você.')).toBeVisible();

    // O campo limita a digitação a 60 caracteres (maxLength): o excesso nem entra
    await form.getByLabel('Nome').fill('a'.repeat(80));
    await expect(form.getByLabel('Nome')).toHaveValue('a'.repeat(60));

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Ana E2E', level: 2 })).toBeVisible();
    await expect(page.getByText('Fuso: America/Sao_Paulo')).toBeVisible();
  });

  test('avatar usa as iniciais do nome, com acento', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    const form = page.getByRole('form', { name: 'Dados do perfil' });
    await form.getByLabel('Nome').fill('Álvaro de Éder');
    await form.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('ÁÉ', { exact: true })).toBeVisible();
  });

  test('cartões mostram as contagens reais de Tenho, Quero e memorial', async ({ page }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 2, 1);
    seedDaily(email, [
      { slug: 'malbec-signature', daysAgo: 1 },
      { slug: 'malbec-signature', daysAgo: 2 },
      { slug: 'malbec-signature', daysAgo: 3 },
    ]);
    await page.goto('/profile');
    await expect(stat(page, 'Tenho')).toContainText('2');
    await expect(stat(page, 'Quero')).toContainText('1');
    await expect(stat(page, 'No memorial')).toContainText('3');
  });

  test('sem dados: estado vazio com saída para o catálogo, sem número inventado', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(
      page.getByRole('heading', { name: 'Sua coleção e o memorial ainda estão vazios' })
    ).toBeVisible();
    await expect(page.getByRole('term')).toHaveCount(0);
    await page.getByRole('link', { name: 'Explorar o catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('um usuário não vê os dados de outro (RLS)', async ({ page, browser }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 2, 1);
    await page.goto('/profile');
    await expect(stat(page, 'Tenho')).toContainText('2');

    const otherContext = await browser.newContext({ baseURL: page.url().split('/profile')[0] });
    await stubOpenMeteo(otherContext);
    const other = await otherContext.newPage();
    await registerViaUi(other, uniqueEmail());
    await other.goto('/profile');
    await expect(
      other.getByRole('heading', { name: 'Sua coleção e o memorial ainda estão vazios' })
    ).toBeVisible();
    await expect(other.getByText(email)).toHaveCount(0);
    await otherContext.close();
  });

  test('exclusão: o dialog pede confirmação, a ação está desativada e nada é chamado', async ({
    page,
  }) => {
    // Nenhuma chamada à Edge Function de exclusão (nem à rede real): qualquer uma falha o teste
    const calls: string[] = [];
    await page.route('**/functions/v1/**', (route) => {
      calls.push(route.request().url());
      return route.abort();
    });
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Zona de perigo' })).toBeVisible();

    await page.getByRole('button', { name: 'Excluir conta' }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir a sua conta?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Em breve' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(calls).toEqual([]);
  });
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1280, height: 800 },
  ]) {
    test(`axe em /profile, tema ${theme}, ${viewport.width} px`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize(viewport);
      const email = await registerViaUi(page);
      seedCollection(email, 1, 1);
      await page.goto('/profile');
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      await expect(stat(page, 'Tenho')).toContainText('1');
      expect(await axeViolations(page)).toEqual([]);

      await page.getByRole('button', { name: 'Excluir conta' }).click();
      const dialog = page.getByRole('dialog', { name: 'Excluir a sua conta?' });
      await expect(dialog).toBeVisible();
      // Espera a entrada terminar: axe não deve medir contraste com o dialog ainda translúcido
      await expect(dialog).toHaveCSS('opacity', '1');
      expect(await axeViolations(page)).toEqual([]);
    });
  }
}
