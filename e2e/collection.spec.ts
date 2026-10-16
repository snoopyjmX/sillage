import type { Locator, Page } from '@playwright/test';
import { expect, stubOpenMeteo, test } from './fixtures.ts';
import {
  axeViolations,
  CATALOG_MALBEC,
  cardTitle,
  cards,
  openNav,
  registerViaUi,
} from './helpers.ts';

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
  test('logado adiciona como "Quero": toast, botão atualizado e item na aba Quero', async ({
    page,
    isMobile,
  }) => {
    await registerViaUi(page);
    await page.goto(CATALOG_MALBEC);
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
    await page.goto(CATALOG_MALBEC);
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

  test('formato (RN11): o toast de "Tenho" oferece detalhar, o selo persiste e "Quero" limpa', async ({
    page,
  }) => {
    await registerViaUi(page);
    await page.goto(CATALOG_MALBEC);
    await choose(page, card(page), 'Tenho');

    // D8: marcar "Tenho" não pede nada; o toast só oferece detalhar
    await page.getByRole('button', { name: 'Detalhar formato' }).click();
    const dialog = page.getByRole('dialog', { name: 'Detalhar formato' });
    await dialog.getByRole('radio', { name: 'Decant' }).check({ force: true });
    await dialog.getByRole('button', { name: '10 ml' }).click();
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(`Formato de ${NAME} atualizado.`)).toBeVisible();

    await page.goto('/collection');
    await expect(card(page).getByText('Decant 10 ml')).toBeVisible();
    await page.reload();
    await expect(card(page).getByText('Decant 10 ml')).toBeVisible();

    // Detalhar de novo pelo botão do card: vem preenchido e dá para remover os detalhes
    await card(page)
      .getByRole('button', { name: `Detalhar formato de ${NAME}` })
      .click();
    const again = page.getByRole('dialog', { name: 'Detalhar formato' });
    await expect(again.getByRole('radio', { name: 'Decant' })).toBeChecked();
    await again.getByRole('button', { name: 'Remover detalhes' }).click();
    await expect(page.getByText(`Formato de ${NAME} atualizado.`)).toBeVisible();
    await expect(card(page).getByText(/Decant/)).toHaveCount(0);

    // Detalha de novo e troca para "Quero": o banco limpa formato e volume (RN11)
    await card(page)
      .getByRole('button', { name: `Detalhar formato de ${NAME}` })
      .click();
    const third = page.getByRole('dialog', { name: 'Detalhar formato' });
    await third.getByRole('radio', { name: 'Frasco' }).check({ force: true });
    await third.getByRole('button', { name: '100 ml' }).click();
    await third.getByRole('button', { name: 'Salvar' }).click();
    await expect(card(page).getByText('Frasco 100 ml')).toBeVisible();
    await choose(page, card(page), 'Quero');
    await page.getByRole('tab', { name: 'Tenho (0)' }).click();
    await page.getByRole('tab', { name: 'Quero (1)' }).click();
    await expect(card(page).getByText(/Frasco/)).toHaveCount(0);
    await choose(page, card(page), 'Tenho');
    await page.getByRole('tab', { name: 'Tenho (1)' }).click();
    await expect(card(page)).toBeVisible();
    await expect(card(page).getByText(/Frasco/)).toHaveCount(0);
  });

  test('formato (RN11): o diálogo de detalhar passa no axe', async ({ page }) => {
    await registerViaUi(page);
    await page.goto(CATALOG_MALBEC);
    await choose(page, card(page), 'Tenho');
    await page.goto('/collection');
    await card(page)
      .getByRole('button', { name: `Detalhar formato de ${NAME}` })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Detalhar formato' });
    await dialog.getByRole('radio', { name: 'Amostra' }).check({ force: true });
    await expect(dialog).toHaveCSS('opacity', '1');
    expect(await axeViolations(page)).toEqual([]);
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
    await page.goto(CATALOG_MALBEC);
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
      await page.goto(CATALOG_MALBEC);
      await choose(page, card(page), 'Tenho');
      await page.goto('/catalog?q=Bon%C3%ADssimo');
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
