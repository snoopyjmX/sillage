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
    // O fuso vem automático do navegador; para escolher à mão, desliga a detecção
    await form.getByRole('checkbox', { name: 'Detectar fuso horário automaticamente' }).uncheck();
    await form.getByLabel('Fuso horário', { exact: true }).fill('America/Recife');
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

    await form.getByRole('checkbox', { name: 'Detectar fuso horário automaticamente' }).uncheck();
    await form.getByLabel('Fuso horário', { exact: true }).fill('Marte/Olympus');
    await form.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(form.getByText(/Fuso horário inválido/)).toBeVisible();

    await form.getByLabel('Fuso horário', { exact: true }).fill('America/Sao_Paulo');
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
    // O resumo e o DNA vazio oferecem a mesma saída: a do resumo vem primeiro
    await page.getByRole('link', { name: 'Explorar o catálogo' }).first().click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('DNA olfativo: com 3 ou mais perfumes mostra famílias, notas e a base do cálculo', async ({
    page,
  }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 3, 0);
    seedDaily(email, [{ slug: 'malbec-signature', daysAgo: 1 }]);
    await page.goto('/profile');
    const dna = page.getByRole('region', { name: 'Seu DNA olfativo' });
    await expect(dna.getByRole('list', { name: 'Famílias olfativas' })).toBeVisible();
    const notes = dna.getByRole('list', { name: 'Notas que mais aparecem' });
    await expect(notes).toBeVisible();
    await expect(dna.getByText(/^Baseado em \d+ perfumes? e 1 dia no memorial\.$/)).toBeVisible();
    await notes.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/catalog\?notes=/);
  });

  test('DNA olfativo: outro usuário sem perfumes vê o progresso e nada do seu DNA (RLS)', async ({
    page,
    browser,
  }) => {
    const email = await registerViaUi(page);
    seedCollection(email, 3, 0);
    await page.goto('/profile');
    await expect(page.getByRole('list', { name: 'Famílias olfativas' })).toBeVisible();

    const otherContext = await browser.newContext({ baseURL: page.url().split('/profile')[0] });
    await stubOpenMeteo(otherContext);
    const other = await otherContext.newPage();
    await registerViaUi(other, uniqueEmail());
    await other.goto('/profile');
    await expect(
      other.getByRole('heading', { name: 'Faltam 3 perfumes para o seu DNA aparecer' })
    ).toBeVisible();
    await expect(other.getByRole('list', { name: 'Famílias olfativas' })).toHaveCount(0);
    await otherContext.close();
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

  test('exclusão: só liga ao digitar EXCLUIR, chama a função e volta deslogado para a Home', async ({
    page,
  }) => {
    // A Edge Function é sempre mockada: o E2E nunca apaga um usuário de verdade
    const calls: string[] = [];
    await page.route('**/functions/v1/delete-account', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
          },
        });
        return;
      }
      calls.push(route.request().headers()['authorization'] ?? '');
      await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Zona de perigo' })).toBeVisible();

    await page.getByRole('button', { name: 'Excluir conta' }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir a sua conta?' });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Excluir conta definitivamente' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Digite EXCLUIR para confirmar').fill('EXCLUIR');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page).toHaveURL('/');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch(/^Bearer /);
    await page.goto('/profile');
    await expect(page).toHaveURL(/redirect=%2Fprofile/);
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
      seedCollection(email, 3, 1);
      await page.goto('/profile');
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      await expect(stat(page, 'Tenho')).toContainText('3');
      await expect(page.getByRole('list', { name: 'Famílias olfativas' })).toBeVisible();
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
