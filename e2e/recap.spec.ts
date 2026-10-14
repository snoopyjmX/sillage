// Retrospectiva anual (Fase 23). Aqui a função get_annual_recap NÃO é mockada: o teste semeia o
// Memorial no Supabase local e confere o que a interface mostra, inclusive o isolamento entre
// usuários (RLS). O ano é o de hoje no fuso do perfil (America/Sao_Paulo no cadastro).
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { axeViolations, registerViaUi, seedDaily } from './helpers.ts';

const YEAR = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
}).format(new Date());
const URL = `/recap/${YEAR}`;

// Quando hoje cai nos 7 primeiros dias de janeiro, parte dos dias semeados é do ano anterior
const nearYearStart = (): boolean => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date()
  );
  return today.slice(5) <= '01-08';
};

// 8 dias: Bossa 4, Boemia 3, Gigi 1 (hoje e os 7 anteriores)
const seedEightDays = (email: string) =>
  seedDaily(email, [
    { slug: 'bossa', daysAgo: 0 },
    { slug: 'bossa', daysAgo: 1 },
    { slug: 'boemia', daysAgo: 2 },
    { slug: 'bossa', daysAgo: 3 },
    { slug: 'boemia', daysAgo: 4 },
    { slug: 'bossa', daysAgo: 5 },
    { slug: 'boemia', daysAgo: 6 },
    { slug: 'gigi', daysAgo: 7 },
  ]);

const nextSlide = async (page: Page) => {
  await page.getByRole('button', { name: /Próxima/ }).click();
};

test.describe('retrospectiva anual', () => {
  test.skip(nearYearStart(), 'Nos primeiros dias do ano os dias semeados cruzam a virada');

  test('percorre as 5 lâminas com os números reais do Memorial', async ({ page }) => {
    const email = await registerViaUi(page);
    seedEightDays(email);
    await page.goto(URL);

    await expect(
      page.getByRole('heading', { level: 1, name: `Seu ano em perfumes · ${YEAR}` })
    ).toBeVisible();

    // Lâmina 1: dias
    const slide = page.getByRole('group', { name: /Lâmina \d de 5/ });
    await expect(slide).toHaveAccessibleName('Lâmina 1 de 5');
    await expect(
      slide.getByRole('heading', { name: 'Você vestiu perfume em 8 dias' })
    ).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);

    // Lâmina 2: assinatura (Bossa, 4 dias)
    await nextSlide(page);
    await expect(slide).toHaveAccessibleName('Lâmina 2 de 5');
    await expect(slide.getByRole('link', { name: 'Bossa' })).toHaveAttribute(
      'href',
      '/perfumes/bossa'
    );
    await expect(slide.getByText(/4 dias/)).toBeVisible();

    // Lâmina 3: as quatro estações aparecem, com e sem registros
    await nextSlide(page);
    await expect(slide).toHaveAccessibleName('Lâmina 3 de 5');
    await expect(slide.getByText(/Verão · dezembro a fevereiro/)).toBeVisible();
    await expect(slide.getByText(/Primavera · setembro a novembro/)).toBeVisible();

    // Lâmina 4: nota do ano
    await nextSlide(page);
    await expect(slide).toHaveAccessibleName('Lâmina 4 de 5');
    await expect(
      slide.getByRole('heading', { name: 'A nota que definiu o seu ano' })
    ).toBeVisible();

    // Lâmina 5: encerramento
    await nextSlide(page);
    await expect(slide).toHaveAccessibleName('Lâmina 5 de 5');
    await expect(slide.getByRole('heading', { name: `Seu ${YEAR} em perfumes` })).toBeVisible();
    await expect(page.getByRole('button', { name: /Próxima/ })).toBeDisabled();
    expect(await axeViolations(page)).toEqual([]);
  });

  test('o botão gera o card 9:16 no aparelho e baixa o JPEG', async ({ page }) => {
    // Sem o painel de compartilhar do sistema, o botão baixa o arquivo (o mesmo em qualquer navegador)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    });
    const email = await registerViaUi(page);
    seedEightDays(email);
    await page.goto(URL);
    for (let i = 0; i < 4; i += 1) await nextSlide(page);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Baixar imagem' }).click();
    expect((await download).suggestedFilename()).toBe(`sillage-seu-ano-${YEAR}.jpg`);
  });

  test('a 360 px a lâmina não rola na horizontal', async ({ page }) => {
    const email = await registerViaUi(page);
    seedEightDays(email);
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(URL);
    await expect(page.getByRole('group', { name: 'Lâmina 1 de 5' })).toBeVisible();
    for (let i = 0; i < 4; i += 1) {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await nextSlide(page);
    }
    await expect(page.getByRole('group', { name: 'Lâmina 5 de 5' })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(0);
  });

  test('poucos dias mostram o estado vazio, não as lâminas', async ({ page }) => {
    const email = await registerViaUi(page);
    seedDaily(email, [
      { slug: 'bossa', daysAgo: 0 },
      { slug: 'gigi', daysAgo: 1 },
    ]);
    await page.goto(URL);
    await expect(page.getByText('Seu ano ainda está começando')).toBeVisible();
    await expect(page.getByRole('group', { name: /Lâmina/ })).toHaveCount(0);
  });

  test('um usuário não vê o Memorial do outro (RLS)', async ({ page, browser }) => {
    const email = await registerViaUi(page);
    seedEightDays(email);
    await page.goto(URL);
    await expect(page.getByRole('group', { name: 'Lâmina 1 de 5' })).toBeVisible();

    const otherContext = await browser.newContext({
      baseURL: page.url().replace(/\/recap.*$/, ''),
    });
    const other = await otherContext.newPage();
    await registerViaUi(other);
    await other.goto(URL);
    await expect(other.getByText('Seu ano ainda está começando')).toBeVisible();
    await expect(other.getByRole('group', { name: /Lâmina/ })).toHaveCount(0);
    await otherContext.close();
  });
});

test.describe('retrospectiva: acesso e anos inválidos', () => {
  test('visitante cai na Landing (rota privada)', async ({ page }) => {
    await page.goto(URL);
    await expect(page).toHaveURL(new RegExp(`/\\?redirect=%2Frecap%2F${YEAR}$`));
  });

  test.describe('logado', () => {
    for (const [label, year] of [
      ['anterior a 2026', '2025'],
      ['futuro', String(Number(YEAR) + 1)],
      ['que não é número', 'abc'],
    ] as const) {
      test(`ano ${label} é "não existe"`, async ({ page }) => {
        await registerViaUi(page);
        await page.goto(`/recap/${year}`);
        await expect(
          page.getByRole('heading', { level: 1, name: 'Retrospectiva indisponível' })
        ).toBeVisible();
      });
    }

    test('o Memorial leva à retrospectiva do ano', async ({ page }) => {
      await registerViaUi(page);
      await page.goto('/memorial');
      await page.getByRole('link', { name: 'Seu ano em perfumes' }).click();
      await expect(page).toHaveURL(new RegExp(`/recap/${YEAR}$`));
    });
  });
});
