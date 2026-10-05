// Dados reais do seed (supabase/seed.sql): Amyi 2.15 (Amyi), Caipi d'Argent (Condé Parfum)
// e Irish Green Man (In The Box). Nada aqui é inventado.
import { expect, test } from '@playwright/test';
import { cardTitle, cards, closeFilters, openFilters, pickNote } from './helpers.ts';

const AMYI = 'Amyi 2.15';
const CAIPI = "Caipi d'Argent";
const IRISH = 'Irish Green Man';

test.describe('catálogo', () => {
  test('/ redireciona para /catalog e a página tem título', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Catálogo' })).toBeVisible();
    // <title> do React 19, sem biblioteca, no build de produção
    await expect(page).toHaveTitle('Catálogo · Sillage');
  });

  test('sem filtros lista os 3 perfumes do seed', async ({ page }) => {
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(3);
    await expect(page.getByText('3 perfumes')).toBeVisible();
  });

  test('buscar "conde" (sem acento) encontra o Caipi d\'Argent', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByRole('searchbox', { name: 'Buscar perfumes ou marcas' }).fill('conde');
    await expect(cards(page)).toHaveCount(1);
    await expect(cardTitle(page, CAIPI)).toBeVisible();
    await expect(page).toHaveURL(/q=conde/);
  });

  test("nota bergamota + posição topo = Amyi 2.15 e Caipi d'Argent", async ({ page, isMobile }) => {
    await page.goto('/catalog');
    const filters = await openFilters(page, isMobile);
    await pickNote(filters, 'berg', /Bergamota/);
    await filters.getByRole('button', { name: 'Topo' }).click();
    await closeFilters(page, isMobile);

    await expect(cards(page)).toHaveCount(2);
    await expect(cardTitle(page, AMYI)).toBeVisible();
    await expect(cardTitle(page, CAIPI)).toBeVisible();
    await expect(cardTitle(page, IRISH)).toHaveCount(0);
    await expect(page).toHaveURL(/notes=bergamota/);
    await expect(page).toHaveURL(/pos=top/);
  });

  test("lima + bergamota (AND) = só o Caipi d'Argent", async ({ page, isMobile }) => {
    await page.goto('/catalog');
    const filters = await openFilters(page, isMobile);
    await pickNote(filters, 'lima', /^Lima/);
    await pickNote(filters, 'berg', /Bergamota/);
    await closeFilters(page, isMobile);

    await expect(cards(page)).toHaveCount(1);
    await expect(cardTitle(page, CAIPI)).toBeVisible();
  });

  test('bergamota no coração = estado vazio, com saída pelo "Limpar filtros"', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/catalog');
    const filters = await openFilters(page, isMobile);
    await pickNote(filters, 'berg', /Bergamota/);
    await filters.getByRole('button', { name: 'Coração' }).click();
    await closeFilters(page, isMobile);

    await expect(page.getByRole('heading', { name: 'Nenhum perfume encontrado' })).toBeVisible();
    await expect(cards(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Limpar filtros' }).first().click();
    await expect(cards(page)).toHaveCount(3);
  });

  test('recarregar uma URL com filtros restaura o painel e os resultados', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/catalog?notes=bergamota&pos=top&families=citrus');

    const check = async () => {
      await expect(cards(page)).toHaveCount(2);
      await expect(
        page.getByRole('button', { name: 'Remover filtro: Nota: Bergamota' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Remover filtro: Posição: Topo' })
      ).toBeVisible();
      const filters = await openFilters(page, isMobile);
      await expect(filters.getByRole('button', { name: 'Topo' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(filters.getByRole('button', { name: 'Cítrico' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(filters.getByRole('group', { name: 'Notas escolhidas' })).toContainText(
        'Bergamota'
      );
      await closeFilters(page, isMobile);
    };

    await check();
    await page.reload();
    await check();
  });

  test('chip removível tira só aquele filtro', async ({ page }) => {
    await page.goto('/catalog?notes=bergamota&pos=top&families=citrus');
    await page.getByRole('button', { name: 'Remover filtro: Posição: Topo' }).click();
    await expect(page).not.toHaveURL(/pos=/);
    await expect(page).toHaveURL(/notes=bergamota/);
    await expect(page).toHaveURL(/families=citrus/);
  });

  test('valores inválidos na URL caem nos padrões sem quebrar', async ({ page }) => {
    await page.goto('/catalog?sort=zzz&page=-3&notes=..%2Fetc&families=bogus&ymin=abc');
    await expect(cards(page)).toHaveCount(3);
    await expect(page.getByLabel('Ordenar por')).toHaveValue('newest');
  });

  test('página além do total mostra o vazio com "Ir para a página 1"', async ({ page }) => {
    await page.goto('/catalog?page=9');
    await expect(page.getByRole('heading', { name: 'Essa página não existe' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir para a página 1' }).click();
    await expect(cards(page)).toHaveCount(3);
    await expect(page).not.toHaveURL(/page=/);
  });

  test('ordenar por nome (A a Z) reordena e grava na URL', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByLabel('Ordenar por').selectOption('name_asc');
    await expect(page).toHaveURL(/sort=name_asc/);
    await expect(cards(page).first().getByRole('heading', { level: 2 })).toHaveText(AMYI);
  });

  test('rota desconhecida mostra o 404 amigável', async ({ page }) => {
    await page.goto('/nao-existe');
    await expect(page.getByRole('heading', { name: 'Não encontramos essa página' })).toBeVisible();
    await page.getByRole('link', { name: 'Ir para o catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('Coleção e Perfume do Dia aparecem desabilitados ("em breve"); Perfil é link', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(
      page.getByRole('link', { name: /^Perfil/ }).locator('visible=true')
    ).toHaveAttribute('href', '/profile');
    for (const name of ['Coleção, em breve', 'Perfume do Dia, em breve']) {
      const item = page.getByRole('link', { name }).locator('visible=true');
      await expect(item).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
