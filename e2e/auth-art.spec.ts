import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { expect, test } from './fixtures.ts';

// Telas de autenticação (14F): arte decorativa no painel de marca a partir de md, logo no topo do
// formulário e contraste da frase nos dois temas. Visitante: nenhum teste precisa de conta.
const SCREENS = [
  { path: '/login', heading: 'Entrar' },
  { path: '/register', heading: 'Criar conta' },
  { path: '/forgot-password', heading: 'Recuperar senha' },
  // Sem sessão de recuperação: estado "link inválido"
  { path: '/reset-password', heading: 'Link inválido ou expirado' },
] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [360, 768, 1280] as const;
const THEME_KEY = 'sillage-theme';
const ART_PATH = '/auth-art/';
const MD_WIDTH = 768;

const useTheme = async (page: Page, theme: (typeof THEMES)[number]) =>
  page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [THEME_KEY, theme]
  );

const luminance = ([r, g, b]: number[]): number => {
  const [lr, lg, lb] = [r, g, b].map((value) => {
    const c = (value ?? 0) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (lr ?? 0) + 0.7152 * (lg ?? 0) + 0.0722 * (lb ?? 0);
};

const contrast = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test.describe(`auth, tema ${theme}, ${width} px`, () => {
      test.use({ viewport: { width, height: 800 } });

      for (const { path, heading } of SCREENS) {
        test(`axe sem violações em ${path}`, async ({ page }) => {
          await useTheme(page, theme);
          await page.goto(path);
          await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
          await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);

          // Logo acima do formulário, em todos os tamanhos
          const logo = page.getByRole('main').getByRole('link', { name: 'Sillage' });
          await expect(logo).toBeVisible();
          const logoBox = await logo.boundingBox();
          const headingBox = await page.getByRole('heading', { level: 1 }).boundingBox();
          expect(logoBox && headingBox && logoBox.y + logoBox.height <= headingBox.y).toBe(true);
          expect(logoBox?.height).toBeGreaterThanOrEqual(44);

          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(
            results.violations.map((violation) => ({
              id: violation.id,
              nodes: violation.nodes.map((node) => node.target.join(' ')),
            }))
          ).toEqual([]);
        });
      }

      if (width >= MD_WIDTH) {
        // O axe não mede contraste sobre imagem (marca "revisar"): aqui o pior pixel sob a frase
        // e a assinatura, medido no screenshot sem o texto, tem de bater 4,5:1 contra a cor do texto.
        test('contraste da frase sobre a arte: pior pixel >= 4,5:1', async ({ page }) => {
          await useTheme(page, theme);
          await page.goto('/login');
          const figure = page.locator('[data-slot="auth-brand-panel"] figure');
          await expect(figure).toBeVisible();
          await expect(page.locator('[data-slot="auth-art"]')).toBeVisible();
          // Espera a arte decodificar antes de medir
          await page.waitForFunction(() => {
            const img = document.querySelector<HTMLImageElement>('[data-slot="auth-art"]');
            return img?.complete === true && img.naturalWidth > 0;
          });

          const textColor = await figure.evaluate((el) => getComputedStyle(el).color);
          const [r, g, b] = (textColor.match(/\d+(\.\d+)?/g) ?? []).map(Number);
          const box = await figure.boundingBox();
          expect(box).not.toBeNull();
          await figure.evaluate((el) => (el.style.visibility = 'hidden'));
          const shot = await page.screenshot({ clip: box as NonNullable<typeof box> });
          const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({
            resolveWithObject: true,
          });

          const textLum = luminance([r ?? 0, g ?? 0, b ?? 0]);
          let worst = Infinity;
          for (let i = 0; i < data.length; i += info.channels) {
            worst = Math.min(
              worst,
              contrast(textLum, luminance([data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0]))
            );
          }
          expect(worst).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }
}

test.describe('requisição da arte', () => {
  test('a 360 px a imagem NÃO é requisitada', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const requested: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(ART_PATH)) requested.push(request.url());
    });
    for (const { path, heading } of SCREENS) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    }
    await page.waitForLoadState('networkidle');
    expect(requested).toEqual([]);
    await expect(page.locator('[data-slot="auth-art"]')).toHaveCount(0);
  });

  test('a 1280 px a imagem é requisitada, do próprio site, em WebP', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const requested: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'image') requested.push(request.url());
    });
    await page.goto('/login');
    await expect(page.locator('[data-slot="auth-art"]')).toBeVisible();
    await page.waitForLoadState('networkidle');

    const art = requested.filter((url) => url.includes(ART_PATH));
    expect(art).toHaveLength(1);
    expect(art[0]).toMatch(/\.webp$/);
    // Nenhuma imagem sai do site (sem CDN)
    expect(requested.every((url) => url.startsWith(baseURL as string))).toBe(true);
    const img = page.locator('[data-slot="auth-art"]');
    await expect(img).toHaveAttribute('alt', '');
    await expect(img).toHaveAttribute('aria-hidden', 'true');
  });

  test('sem a imagem (offline sem cache) a frase continua legível sobre a superfície de token', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route(`**${ART_PATH}**`, (route) => route.abort());
    await page.goto('/login');
    await expect(page.locator('[data-slot="auth-art"]')).toHaveCount(1);
    const quote = page.locator('[data-slot="auth-brand-panel"] blockquote');
    await expect(quote).toBeVisible();
    await expect(quote).toContainText('Todo perfume deixa um rastro. O seu começa aqui.');
    const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(results.violations).toEqual([]);
  });
});
