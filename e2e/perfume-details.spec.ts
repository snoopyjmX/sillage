// Dados reais do seed (supabase/seed.sql): Malbec Signature tem pirâmide completa
// (topo: bergamota e acorde vínico; coração: lavanda e cardamomo; fundo: musgo de carvalho,
// patchouli, âmbar e vetiver). O seed não traz foto, então o hero usa o placeholder.
import { expect, test, type Page } from '@playwright/test';
import { axeViolations, cards } from './helpers.ts';

const URL = '/perfumes/malbec-signature';
const THEME_KEY = 'sillage-theme';

const layer = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}`) });
const note = (page: Page, name: string) =>
  page.getByRole('link', { name: new RegExp(`^${name}:`) });

test.describe('detalhes do perfume', () => {
  test('slug existente mostra hero, marca, nome, concentração e a pirâmide', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
    await expect(page).toHaveTitle('Malbec Signature · O Boticário · Sillage');
    await expect(page.getByText('O Boticário', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('EDC', { exact: true }).first()).toBeVisible();
    // Sem foto no seed: placeholder (com foto, seria uma <img> com alt)
    await expect(page.locator('[data-slot="perfume-placeholder"], main img').first()).toBeVisible();
    await expect(page.getByRole('group', { name: 'Pirâmide olfativa' })).toBeVisible();
    for (const name of ['Topo', 'Coração', 'Fundo']) await expect(layer(page, name)).toBeVisible();
  });

  test('camadas na ordem Topo, Coração, Fundo e estado inicial por tamanho de tela', async ({
    page,
    isMobile,
  }) => {
    await page.goto(URL);
    const buttons = page.getByRole('group', { name: 'Pirâmide olfativa' }).getByRole('button');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toContainText('Topo');
    await expect(buttons.nth(1)).toContainText('Coração');
    await expect(buttons.nth(2)).toContainText('Fundo');

    // celular: só o Topo aberto; desktop: todas abertas
    await expect(layer(page, 'Topo')).toHaveAttribute('aria-expanded', 'true');
    const others = isMobile ? 'false' : 'true';
    await expect(layer(page, 'Coração')).toHaveAttribute('aria-expanded', others);
    await expect(layer(page, 'Fundo')).toHaveAttribute('aria-expanded', others);
  });

  test('clicar na camada abre e fecha, e as notas aparecem e somem', async ({ page, isMobile }) => {
    await page.goto(URL);
    const base = layer(page, 'Fundo');
    if (isMobile) {
      await expect(note(page, 'Vetiver')).toBeHidden();
      await base.click();
    }
    await expect(base).toHaveAttribute('aria-expanded', 'true');
    for (const name of ['Musgo de carvalho', 'Patchouli', 'Âmbar', 'Vetiver']) {
      await expect(note(page, name)).toBeVisible();
    }

    await base.click();
    await expect(base).toHaveAttribute('aria-expanded', 'false');
    await expect(note(page, 'Vetiver')).toBeHidden();
    // As outras camadas não são afetadas
    await expect(note(page, 'Bergamota')).toBeVisible();
  });

  test('teclado: Enter e Espaço alternam a camada e o foco fica visível', async ({ page }) => {
    await page.goto(URL);
    const top = layer(page, 'Topo');
    await top.focus();
    // Foco por teclado (não por script) é o que ativa :focus-visible
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(top).toBeFocused();
    await expect(top).toHaveCSS('outline-style', 'solid');

    await page.keyboard.press('Enter');
    await expect(top).toHaveAttribute('aria-expanded', 'false');
    await expect(note(page, 'Bergamota')).toBeHidden();
    await page.keyboard.press('Space');
    await expect(top).toHaveAttribute('aria-expanded', 'true');
    await expect(note(page, 'Bergamota')).toBeVisible();
  });

  test('tocar numa nota leva ao catálogo filtrado por nota e posição', async ({ page }) => {
    await page.goto(URL);
    await note(page, 'Bergamota').click();
    await expect(page).toHaveURL(/\/catalog\?notes=bergamota&pos=top$/);
    await expect(cards(page).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Malbec Signature' })).toBeVisible();
  });

  test('visitante que clica em "Adicionar à Coleção" vai para o login e volta aos detalhes', async ({
    page,
  }) => {
    await page.goto(URL);
    // A seção de similares também tem botões de coleção: o do perfume da página vem primeiro
    const cta = page.getByRole('button', { name: /Adicionar à Coleção/ }).first();
    await expect(cta).toBeEnabled();
    await cta.click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfumes%2F/);
  });

  test('a rota do card do catálogo abre os detalhes e o voltar leva ao catálogo', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await page.getByRole('link', { name: /Malbec Signature/ }).click();
    await expect(page).toHaveURL(URL);
    await expect(page.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('mostra o melhor preço com link externo seguro para a loja', async ({ page }) => {
    await page.goto(URL);
    const offer = page.getByRole('region', { name: 'Melhor preço encontrado' });
    await expect(offer).toBeVisible();
    await expect(offer).toContainText(/R\$\s249,00\sna O Boticário/);
    const link = offer.getByRole('link', { name: /Ver na loja/ });
    await expect(link).toHaveAttribute('href', 'https://www.boticario.com.br');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('perfume sem oferta (Black, da Phytoderm) omite a seção de preço', async ({ page }) => {
    await page.goto('/perfumes/black');
    await expect(page.getByRole('heading', { level: 1, name: 'Black' })).toBeVisible();
    await expect(page.getByText('Melhor preço encontrado')).toHaveCount(0);
  });

  test('slug inexistente mostra "Perfume não encontrado", sem tela branca', async ({ page }) => {
    await page.goto('/perfumes/nao-existe-xyz');
    await expect(
      page.getByRole('heading', { name: 'Perfume não encontrado' }).first()
    ).toBeVisible();
    await expect(page).toHaveTitle('Perfume não encontrado · Sillage');
    await expect(page.getByRole('banner')).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Voltar ao catálogo' }).last().click();
    await expect(page).toHaveURL(/\/catalog$/);
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe a 360 px, tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize({ width: 360, height: 780 });
    });

    test('detalhes com a pirâmide aberta (contraste das notas e aria-expanded)', async ({
      page,
    }) => {
      await page.goto(URL);
      for (const name of ['Coração', 'Fundo']) {
        await layer(page, name).click();
        await expect(layer(page, name)).toHaveAttribute('aria-expanded', 'true');
      }
      await expect(note(page, 'Vetiver')).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });

    test('detalhes com a pirâmide fechada', async ({ page }) => {
      await page.goto(URL);
      await layer(page, 'Topo').click();
      await expect(layer(page, 'Topo')).toHaveAttribute('aria-expanded', 'false');
      expect(await axeViolations(page)).toEqual([]);
    });

    test('perfume não encontrado', async ({ page }) => {
      await page.goto('/perfumes/nao-existe-xyz');
      await expect(
        page.getByRole('heading', { name: 'Perfume não encontrado' }).first()
      ).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  });
}

test('axe no desktop (1280 px) com a pirâmide inteira aberta', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await expect(layer(page, 'Fundo')).toHaveAttribute('aria-expanded', 'true');
  expect(await axeViolations(page)).toEqual([]);
});

// Roda sem reducedMotion: a animação de altura e o stagger não podem travar o toque nem deixar
// as camadas num estado errado ao alternar rápido.
test.describe('com animação ligada', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('alternar várias vezes seguidas termina no estado esperado', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(URL);
    const heart = layer(page, 'Coração');
    for (let i = 0; i < 4; i += 1) await heart.click();
    await expect(heart).toHaveAttribute('aria-expanded', 'false');
    await heart.click();
    await expect(note(page, 'Lavanda')).toBeVisible();
    await expect(note(page, 'Lavanda')).toBeEnabled();
  });
});
