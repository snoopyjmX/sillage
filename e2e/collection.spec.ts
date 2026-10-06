import type { Locator, Page } from '@playwright/test';
import { expect, stubOpenMeteo, test } from './fixtures.ts';
import { axeViolations, cardTitle, cards, openNav, registerViaUi } from './helpers.ts';

const THEME_KEY = 'sillage-theme';
const NAME = 'Malbec Signature';

const card = (page: Page, name = NAME): Locator =>
  cards(page).filter({ has: cardTitle(page, name) });
const toggleIn = (scope: Locator): Locator =>
  scope.getByRole('button', { name: /Adicionar à Coleção|Tenho|Quero/ });
// Botão da própria página do perfume: a página também lista parecidos, cada um com o seu botão,
// então o escopo "main" é ambíguo. O nome acessível traz o nome do perfume ("Adicionar à Coleção : X").
const pageToggle = (page: Page, name = NAME): Locator =>
  page.getByRole('button', { name: new RegExp(`^Adicionar à Coleção\\s*:\\s*${name}$`) });

// Escolhe "Tenho" ou "Quero" no menu do card e espera o toast confirmar a gravação.
const choose = async (page: Page, scope: Locator, option: 'Tenho' | 'Quero', name = NAME) => {
  await toggleIn(scope).click();
  await page.getByRole('menuitemradio', { name: option }).click();
  await expect(page.getByText(`${name} foi para “${option}”.`)).toBeVisible();
  // Menu anterior ainda saindo (animação de saída) confundiria o próximo clique
  await expect(page.getByRole('menu')).toHaveCount(0);
};

test.describe('coleção', () => {
  test('visitante que tenta adicionar vai para o login com ?redirect= da página', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(card(page)).toBeVisible();
    await toggleIn(card(page)).click();

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcatalog$/);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('visitante em /collection também cai no login com ?redirect=', async ({ page }) => {
    await page.goto('/collection');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcollection$/);
  });

  test('logado adiciona como "Quero": toast, botão atualizado e item na aba Quero', async ({
    page,
    isMobile,
  }) => {
    await registerViaUi(page);
    await page.goto('/catalog');
    await choose(page, card(page), 'Quero');

    await expect(toggleIn(card(page))).toHaveText(/Quero/);

    await (await openNav(page, isMobile)).getByRole('link', { name: 'Coleção' }).click();
    await expect(page).toHaveURL(/\/collection$/);
    await expect(page.getByRole('tab', { name: 'Tenho (0)' })).toBeVisible();
    await page.getByRole('tab', { name: 'Quero (1)' }).click();
    await expect(card(page)).toBeVisible();
  });

  test('trocar de "Quero" para "Tenho" move o item de aba e mantém uma linha só (RN02)', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto('/catalog');
    await choose(page, card(page), 'Quero');

    await page.goto('/collection');
    await page.getByRole('tab', { name: 'Quero (1)' }).click();
    await choose(page, card(page), 'Tenho');

    // Saiu da primeira aba…
    await expect(page.getByRole('tab', { name: 'Quero (0)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nenhum perfume em “Quero”' })).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    // …e foi para a segunda
    await page.getByRole('tab', { name: 'Tenho (1)' }).click();
    await expect(card(page)).toBeVisible();
    await expect(toggleIn(card(page))).toHaveText(/Tenho/);

    // Persistiu no banco: depois de recarregar, o mesmo estado e nenhuma duplicata
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Tenho (1)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Quero (0)' })).toBeVisible();
  });

  test('remover o único item mostra "Sua coleção está vazia", com saída para o catálogo', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto(`/perfumes/malbec-signature`);
    await pageToggle(page).click();
    await page.getByRole('menuitemradio', { name: 'Tenho' }).click();
    await expect(page.getByText(`${NAME} foi para “Tenho”.`)).toBeVisible();

    await page.goto('/collection');
    await expect(card(page)).toBeVisible();
    await toggleIn(card(page)).click();
    await page.getByRole('menuitem', { name: 'Remover da coleção' }).click();
    await expect(page.getByText(`${NAME} saiu da sua coleção.`)).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Sua coleção está vazia' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tenho (0)' })).toBeVisible();
    await page.getByRole('link', { name: 'Explorar o catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
    // Remover também vale no banco
    await page.goto('/collection');
    await expect(page.getByRole('heading', { name: 'Sua coleção está vazia' })).toBeVisible();
  });

  test('a coleção de um usuário não aparece para outro (RLS)', async ({ page, browser }) => {
    await registerViaUi(page);
    await page.goto('/catalog');
    await choose(page, card(page), 'Tenho');

    // Contexto novo = outro navegador, sem a sessão do primeiro
    const otherContext = await browser.newContext({ baseURL: page.url().split('/catalog')[0] });
    await stubOpenMeteo(otherContext);
    const other = await otherContext.newPage();
    await registerViaUi(other);
    await other.goto('/collection');
    await expect(other.getByRole('heading', { name: 'Sua coleção está vazia' })).toBeVisible();
    await otherContext.close();
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe na coleção, tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
    });

    test('abas Tenho e Quero com itens, e o menu do toggle aberto', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await registerViaUi(page);
      await page.goto('/catalog');
      await choose(page, card(page), 'Tenho');
      await choose(page, card(page, 'Boníssimo'), 'Quero', 'Boníssimo');

      await page.goto('/collection');
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      await expect(card(page)).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);

      await page.getByRole('tab', { name: 'Quero (1)' }).click();
      await expect(card(page, 'Boníssimo')).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);

      await toggleIn(card(page, 'Boníssimo')).click();
      await expect(page.getByRole('menu')).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });

    test('estado vazio', async ({ page }) => {
      await registerViaUi(page);
      await page.goto('/collection');
      await expect(page.getByRole('heading', { name: 'Sua coleção está vazia' })).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  });
}
