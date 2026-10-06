import { expect, test, type Page } from '@playwright/test';
import { axeViolations, registerViaUi, seedDaily } from './helpers.ts';

const THEME_KEY = 'sillage-theme';
const TITLE = 'Descubra a fragrância de hoje';

// Hoje: Malbec Signature. Ontem e anteontem: Bossa e Boníssimo.
const registerWithHistory = async (page: Page) => {
  const email = await registerViaUi(page);
  seedDaily(email, [
    { slug: 'malbec-signature', daysAgo: 0 },
    { slug: 'bossa', daysAgo: 1 },
    { slug: 'bonissimo', daysAgo: 2 },
  ]);
};

// Só define o tema se ainda não houver escolha: o init script roda a cada navegação e, sem isso,
// apagaria o que o próprio teste escolheu pelo botão
const setTheme = (page: Page, theme: 'light' | 'dark') =>
  page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem(key as string) === null) {
        window.localStorage.setItem(key as string, value as string);
      }
    },
    [THEME_KEY, theme]
  );

test.describe('home', () => {
  test('visitante vê o título e o convite para entrar (Perfume do Dia é privado)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Entre para ver o seu Perfume do Dia' })
    ).toBeVisible();
    // O Footer também tem "Criar conta": o convite é o do conteúdo principal
    await expect(
      page.locator('#conteudo').getByRole('link', { name: 'Criar conta' })
    ).toHaveAttribute('href', '/register');
  });

  test('conta nova, sem nada escolhido, vê o estado vazio com saída para o catálogo', async ({
    page,
  }) => {
    await registerViaUi(page);
    await expect(
      page.getByRole('heading', { name: 'Você ainda não escolheu um Perfume do Dia' })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Explorar o catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('mostra o Perfume do Dia em destaque e o histórico dos dias anteriores', async ({
    page,
  }) => {
    await registerWithHistory(page);
    await page.goto('/');

    const highlight = page.getByRole('article', { name: 'Perfume do Dia' });
    await expect(highlight.getByRole('heading', { name: 'Malbec Signature' })).toBeVisible();

    const history = page.getByRole('list', { name: 'Perfumes dos dias anteriores' });
    await expect(history.getByRole('listitem')).toHaveCount(2);
    // Mais recente primeiro, e hoje não se repete no histórico
    await expect(history.getByRole('listitem').first()).toContainText('Bossa');
    await expect(history.getByRole('listitem').last()).toContainText('Boníssimo');
    await expect(history).not.toContainText('Malbec Signature');

    await history.getByRole('link', { name: /Boníssimo/ }).click();
    await expect(page).toHaveURL(/\/perfumes\/bonissimo$/);
  });

  test('o histórico de um usuário não aparece para outro (RLS)', async ({ page, browser }) => {
    await registerWithHistory(page);

    const otherContext = await browser.newContext({ baseURL: page.url().replace(/\/$/, '') });
    const other = await otherContext.newPage();
    await registerViaUi(other);
    await expect(
      other.getByRole('heading', { name: 'Você ainda não escolheu um Perfume do Dia' })
    ).toBeVisible();
    await expect(other.getByText('Bossa')).toHaveCount(0);
    await otherContext.close();
  });
});

test.describe('navbar', () => {
  test('no desktop mostra os links na barra e nenhum botão de menu', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Layout de tela larga');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Principal' });
    for (const name of ['Início', 'Catálogo', 'Coleção', 'Perfil']) {
      await expect(nav.getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeHidden();
    // Logo: imagem da marca (sem inversão de cor) e o nome ao lado
    const brand = page.getByRole('banner').getByRole('link', { name: 'Sillage' });
    await expect(brand.locator('img')).toHaveAttribute('src', '/favicon-32x32.png');
    await expect(brand.locator('img')).not.toHaveClass(/invert/);
    await nav.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('o item da página atual tem aria-current e o rodapé tem a pirâmide olfativa', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Layout de tela larga');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/catalog');
    const nav = page.getByRole('navigation', { name: 'Principal' });
    await expect(nav.getByRole('link', { name: 'Catálogo' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
    const footer = page.getByRole('contentinfo');
    for (const name of ['Topo', 'Coração', 'Fundo']) {
      await expect(footer.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(footer.getByText('Feito por João Marcelo')).toBeVisible();
  });

  test('no celular os links ficam no menu hambúrguer, que fecha ao navegar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeHidden();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    for (const name of ['Início', 'Catálogo', 'Coleção', 'Perfil']) {
      await expect(menu.getByRole('link', { name })).toBeVisible();
    }
    await expect(menu.getByRole('link', { name: 'Entrar' })).toBeVisible();

    await menu.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(menu).toBeHidden();
  });

  test('Esc fecha o menu e devolve o foco ao botão', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Abrir menu' });
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('o botão de tema alterna claro e escuro e lembra a escolha', async ({ page }) => {
    await setTheme(page, 'light');
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Mudar para o tema escuro' }).click();
    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: 'Mudar para o tema claro' })).toBeVisible();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), THEME_KEY)).toBe('dark');

    // A escolha sobrevive à recarga
    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Mudar para o tema claro' }).click();
    await expect(html).not.toHaveClass(/dark/);
  });
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1280, height: 800 },
  ]) {
    test.describe(`axe na home a ${viewport.width} px, tema ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await setTheme(page, theme);
        await page.setViewportSize(viewport);
      });

      test('visitante', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
        await expect(page.getByRole('heading', { name: /^Entre para ver/ })).toBeVisible();
        expect(await axeViolations(page)).toEqual([]);
      });

      test('logado, com Perfume do Dia e histórico', async ({ page }) => {
        await registerWithHistory(page);
        await page.goto('/');
        await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
        await expect(page.getByRole('article', { name: 'Perfume do Dia' })).toBeVisible();
        await expect(
          page.getByRole('list', { name: 'Perfumes dos dias anteriores' })
        ).toBeVisible();
        expect(await axeViolations(page)).toEqual([]);
      });

      test('logado, sem nada escolhido', async ({ page }) => {
        await registerViaUi(page);
        await expect(
          page.getByRole('heading', { name: 'Você ainda não escolheu um Perfume do Dia' })
        ).toBeVisible();
        expect(await axeViolations(page)).toEqual([]);
      });
    });
  }
}

test('axe com o menu hambúrguer aberto (360 px)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
