// Gate de acesso (docs/PRODUCT.md, Seção 7): só Landing, login, cadastro e recuperação de senha
// são públicos. É um gate de INTERFACE: o banco continua com leitura pública (RLS inalterada).
import { expect, test, type Page } from '@playwright/test';
import { axeViolations, registerViaUi, uniqueEmail } from './helpers.ts';

const PASSWORD = 'Sillage2026x';
const THEME_KEY = 'sillage-theme';
const LANDING_TITLE = 'Descubra perfumes pelas suas notas';
const landingTitle = (page: Page) => page.getByRole('heading', { level: 1, name: LANDING_TITLE });

// Nenhuma consulta ao catálogo pode sair da Landing nem das rotas negadas
const trackCatalogRequests = (page: Page): string[] => {
  const hits: string[] = [];
  page.on('request', (request) => {
    if (/\/rest\/v1\/(perfumes|rpc|notes|brands)/.test(request.url())) hits.push(request.url());
  });
  return hits;
};

const DENIED = [
  { path: '/catalog', label: 'catálogo' },
  { path: '/perfumes/malbec-signature', label: 'detalhes de perfume existente' },
  { path: '/perfumes/nao-existe-xyz', label: 'detalhes de perfume inexistente' },
  { path: '/collection', label: 'coleção' },
  { path: '/compare?a=malbec-signature&b=bossa', label: 'comparador' },
  { path: '/profile', label: 'perfil' },
  { path: '/rota-inventada', label: 'rota inventada (404)' },
] as const;

test.describe('NEGADO: visitante em rota protegida', () => {
  for (const { path, label } of DENIED) {
    test(`${label} (${path}) cai na Landing com ?redirect=`, async ({ page }) => {
      const catalogRequests = trackCatalogRequests(page);
      await page.goto(path);
      await expect(page).toHaveURL(
        new RegExp(`/\\?redirect=${encodeURIComponent(path).replaceAll('.', '\\.')}$`)
      );
      await expect(landingTitle(page)).toBeVisible();
      await expect(page.getByRole('article')).toHaveCount(0);
      await expect(page.getByText('Malbec Signature')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Não encontramos essa página' })).toHaveCount(
        0
      );
      expect(catalogRequests).toEqual([]);
    });
  }
});

test.describe('NEGADO: ?redirect= malicioso é descartado', () => {
  for (const evil of ['//evil.com', 'https://evil.com', 'javascript:alert(1)']) {
    test(`Landing não repassa ${evil}`, async ({ page }) => {
      await page.goto(`/?redirect=${encodeURIComponent(evil)}`);
      await expect(landingTitle(page)).toBeVisible();
      const hero = page.locator('#inicio');
      await expect(hero.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
      await expect(hero.getByRole('link', { name: /Criar conta/ })).toHaveAttribute(
        'href',
        '/register'
      );
    });

    test(`depois do cadastro com ?redirect=${evil} o usuário fica no app, em "/"`, async ({
      page,
      baseURL,
    }) => {
      await page.goto(`/register?redirect=${encodeURIComponent(evil)}`);
      await page.getByLabel('Nome').fill('Ana E2E');
      await page.getByLabel('E-mail').fill(uniqueEmail());
      await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
      await page.getByRole('button', { name: 'Criar conta' }).click();
      await page.waitForURL(/\/$/);
      expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? '').origin);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Descubra a fragrância de hoje' })
      ).toBeVisible();
    });
  }
});

test.describe('PERMITIDO: visitante', () => {
  test('abre "/" e vê a Landing, na mesma URL', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(landingTitle(page)).toBeVisible();
    await expect(page.getByText('Enciclopédia olfativa').first()).toBeVisible();
  });

  for (const { path, heading } of [
    { path: '/login', heading: 'Entrar' },
    { path: '/register', heading: 'Criar conta' },
    { path: '/forgot-password', heading: 'Recuperar senha' },
    { path: '/reset-password', heading: 'Link inválido ou expirado' },
  ]) {
    test(`abre ${path} sem ser desviado`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    });
  }

  test('os dois CTAs ficam visíveis: "Criar conta" e "Entrar"', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('#inicio');
    await expect(hero.getByRole('link', { name: /Criar conta/ })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Entrar' })).toBeVisible();
  });

  test('o Entrar da Landing leva o destino original e o login volta a ele', async ({
    page,
    browser,
    baseURL,
  }) => {
    // Conta criada num contexto à parte; o visitante entra depois, no contexto limpo do teste
    const setupContext = await browser.newContext({ baseURL });
    const email = await registerViaUi(await setupContext.newPage());
    await setupContext.close();

    await page.goto('/perfumes/malbec-signature');
    await expect(page).toHaveURL(/\/\?redirect=%2Fperfumes%2Fmalbec-signature$/);
    await page.locator('#inicio').getByRole('link', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfumes%2Fmalbec-signature$/);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/perfumes\/malbec-signature$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
  });
});

test.describe('logado', () => {
  test('em "/" vê a Home, não a Landing', async ({ page }) => {
    await registerViaUi(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Descubra a fragrância de hoje' })
    ).toBeVisible();
    await expect(landingTitle(page)).toHaveCount(0);
  });

  test('NEGADO: em /login e /register volta para "/"', async ({ page }) => {
    await registerViaUi(page);
    for (const path of ['/login', '/register']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('uma rota inventada mostra o 404 amigável (só logado chega nele)', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/rota-inventada');
    await expect(page.getByRole('heading', { name: 'Não encontramos essa página' })).toBeVisible();
  });
});

test.describe('SEO da Landing', () => {
  test('título, descrição e og:title próprios; sem noindex', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Enciclopédia olfativa — Sillage');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Sillage/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Enciclopédia olfativa — Sillage'
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('sitemap lista só "/" e o robots bloqueia as rotas privadas', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap.match(/<loc>/g)).toHaveLength(1);
    expect(sitemap).not.toContain('/catalog');
    const robots = await (await request.get('/robots.txt')).text();
    for (const path of ['/catalog', '/perfumes/', '/collection', '/compare', '/profile']) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
  });
});

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1280, height: 800 },
  ]) {
    test(`axe na Landing a ${viewport.width} px, tema ${theme}`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(landingTitle(page)).toBeVisible();
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      expect(await axeViolations(page)).toEqual([]);
      // Responsivo: sem rolagem horizontal
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    });
  }
}

test.describe('pílula do modo landing', () => {
  test('opera só com teclado: Tab até "Recursos" e Enter leva à seção', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'No celular a navegação é o menu (Drawer)');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const link = page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Recursos' });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#recursos$/);
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('#recursos')).toBeInViewport();
  });

  test('no celular o menu abre, lista as âncoras e fecha ao escolher', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Só o celular tem o menu');
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await menu.getByRole('link', { name: 'Como funciona' }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#como-funciona$/);
  });
});

test.describe('movimento da pirâmide', () => {
  test('reduced motion: as três camadas já aparecem prontas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const layers = page.locator('[data-layer]');
    await expect(layers).toHaveCount(3);
    for (const layer of await layers.all()) {
      await expect(layer).toHaveCSS('opacity', '1');
    }
  });

  test.describe('com animação ligada', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('as camadas terminam visíveis, na ordem Topo, Coração, Fundo', async ({ page }) => {
      await page.goto('/');
      const layers = page.locator('[data-layer]');
      await expect(layers).toHaveCount(3);
      expect(
        await layers.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-layer')))
      ).toEqual(['top', 'heart', 'base']);
      for (const layer of await layers.all()) {
        await expect(layer).toHaveCSS('opacity', '1');
      }
    });
  });
});
