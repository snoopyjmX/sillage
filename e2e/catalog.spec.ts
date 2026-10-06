// Dados reais do seed (supabase/seed.sql): 20 perfumes de 6 marcas (Granado, Natura, O Boticário,
// Avatim, Al Wataniah e Phytoderm). Bergamota só aparece no topo, em 6 perfumes, e nunca no coração.
import { expect, test } from './fixtures.ts';
import { cardTitle, cards, closeFilters, openFilters, openNav, pickNote } from './helpers.ts';

const MALBEC = 'Malbec Signature';
const BOSSA = 'Bossa';
const BONISSIMO = 'Boníssimo';
const SEED_TOTAL = 20;
const BERGAMOT_TOP = 6;

test.describe('catálogo', () => {
  test('a página tem título (<title> do React 19)', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { level: 1, name: 'Catálogo' })).toBeVisible();
    // <title> do React 19, sem biblioteca, no build de produção
    await expect(page).toHaveTitle('Catálogo — Sillage');
  });

  test('sem filtros lista os 20 perfumes do seed', async ({ page }) => {
    await page.goto('/catalog');
    await expect(cards(page)).toHaveCount(SEED_TOTAL);
    await expect(page.getByText(`${SEED_TOTAL} perfumes`)).toBeVisible();
  });

  test('buscar "boticario" (sem acento) encontra só os perfumes d\'O Boticário', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await page.getByRole('searchbox', { name: 'Buscar perfumes ou marcas' }).fill('boticario');
    await expect(cards(page)).toHaveCount(4);
    await expect(cardTitle(page, MALBEC)).toBeVisible();
    await expect(cardTitle(page, BOSSA)).toHaveCount(0);
    await expect(page).toHaveURL(/q=boticario/);
  });

  test('nota bergamota + posição topo = os 6 perfumes com bergamota no topo', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/catalog');
    const filters = await openFilters(page, isMobile);
    await pickNote(filters, 'berg', /Bergamota/);
    await filters.getByRole('button', { name: 'Topo' }).click();
    await closeFilters(page, isMobile);

    await expect(cards(page)).toHaveCount(BERGAMOT_TOP);
    await expect(cardTitle(page, MALBEC)).toBeVisible();
    await expect(cardTitle(page, BOSSA)).toBeVisible();
    await expect(cardTitle(page, BONISSIMO)).toHaveCount(0);
    await expect(page).toHaveURL(/notes=bergamota/);
    await expect(page).toHaveURL(/pos=top/);
  });

  test('limão-siciliano + bergamota (AND) = só a Bossa', async ({ page, isMobile }) => {
    await page.goto('/catalog');
    const filters = await openFilters(page, isMobile);
    await pickNote(filters, 'limão', /^Limão-siciliano/);
    await pickNote(filters, 'berg', /Bergamota/);
    await closeFilters(page, isMobile);

    await expect(cards(page)).toHaveCount(1);
    await expect(cardTitle(page, BOSSA)).toBeVisible();
  });

  test('o filtro de marca lista as 6 marcas do banco e filtra os perfumes reais', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/catalog');
    const filters = await openFilters(page, isMobile);
    const brands = filters.getByRole('group', { name: 'Marca', exact: true });
    for (const name of ['Al Wataniah', 'Avatim', 'Granado', 'Natura', 'O Boticário', 'Phytoderm']) {
      await expect(brands.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await expect(brands.getByRole('button')).toHaveCount(6);

    await brands.getByRole('button', { name: 'Granado', exact: true }).click();
    await closeFilters(page, isMobile);

    await expect(cards(page)).toHaveCount(3);
    await expect(cardTitle(page, BOSSA)).toBeVisible();
    await expect(cardTitle(page, MALBEC)).toHaveCount(0);
    await expect(page).toHaveURL(/brands=granado/);
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
    await expect(cards(page)).toHaveCount(SEED_TOTAL);
  });

  test('recarregar uma URL com filtros restaura o painel e os resultados', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/catalog?notes=bergamota&pos=top&families=citrus');

    const check = async () => {
      await expect(cards(page)).toHaveCount(BERGAMOT_TOP);
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
    await expect(cards(page)).toHaveCount(SEED_TOTAL);
    await expect(page.getByLabel('Ordenar por')).toHaveValue('newest');
  });

  test('página além do total mostra o vazio com "Ir para a página 1"', async ({ page }) => {
    await page.goto('/catalog?page=9');
    await expect(page.getByRole('heading', { name: 'Essa página não existe' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir para a página 1' }).click();
    await expect(cards(page)).toHaveCount(SEED_TOTAL);
    await expect(page).not.toHaveURL(/page=/);
  });

  test('ordenar por nome (A a Z) reordena e grava na URL', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByLabel('Ordenar por').selectOption('name_asc');
    await expect(page).toHaveURL(/sort=name_asc/);
    await expect(cards(page).first().getByRole('heading', { level: 2 })).toHaveText('Apoena');
  });

  test('rota desconhecida mostra o 404 amigável', async ({ page }) => {
    await page.goto('/nao-existe');
    await expect(page.getByRole('heading', { name: 'Não encontramos essa página' })).toBeVisible();
    await page.getByRole('link', { name: 'Ir para o catálogo' }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test('Início, Coleção e Perfil são links da navegação', async ({ page, isMobile }) => {
    await page.goto('/catalog');
    const nav = await openNav(page, isMobile);
    await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Coleção' })).toHaveAttribute('href', '/collection');
    await expect(nav.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/profile');
  });
});
