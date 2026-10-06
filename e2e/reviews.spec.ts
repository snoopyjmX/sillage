import { expect, test, type Locator, type Page } from '@playwright/test';
import { axeViolations, clearReviews, registerViaUi } from './helpers.ts';

const THEME_KEY = 'sillage-theme';

// As avaliações do perfume entram na média e na contagem de todo mundo. Para os números serem
// exatos, cada projeto usa o seu perfume (Desktop e Pixel rodam ao mesmo tempo) e as avaliações
// dele são limpas antes de cada teste. Os testes deste arquivo rodam em sequência.
test.describe.configure({ mode: 'default' });

const perfumeFor = (isMobile: boolean) =>
  isMobile ? { slug: 'bonissimo', name: 'Boníssimo' } : { slug: 'bossa', name: 'Bossa' };

const radioGroup = (scope: Page | Locator, name: string): Locator =>
  scope.getByRole('radiogroup', { name, exact: true });

const sheet = (page: Page): Locator =>
  page.getByRole('dialog', { name: /Avaliar fragrância|Editar avaliação/ });

const openSheet = async (page: Page, buttonName: string): Promise<Locator> => {
  await page.getByRole('button', { name: buttonName }).click();
  const dialog = sheet(page);
  await expect(dialog).toBeVisible();
  return dialog;
};

// Marca o perfume como "Tenho" pelo botão da página (a RN03 exige para poder avaliar)
const ownPerfume = async (page: Page, name: string) => {
  await page
    .getByRole('main')
    .getByRole('button', { name: /Adicionar à Coleção/ })
    .first() // os cards de similares também têm botão; o do perfume da página vem primeiro
    .click();
  await page.getByRole('menuitemradio', { name: 'Tenho' }).click();
  await expect(page.getByText(`${name} foi para “Tenho”.`)).toBeVisible();
  await expect(page.getByRole('menu')).toHaveCount(0);
};

const pick = (dialog: Locator, group: string, stars: number) =>
  radioGroup(dialog, group)
    .getByRole('radio', { name: `${stars} ${stars === 1 ? 'estrela' : 'estrelas'}` })
    .click();

const summaryLine = (page: Page): Locator => page.locator('[data-slot="review-summary"]');

test.beforeEach(({ isMobile }) => {
  clearReviews(perfumeFor(isMobile).slug);
});

test.describe('avaliações', () => {
  test('visitante que clica em "Avaliar fragrância" vai para o login e a página mostra "Ainda sem avaliações"', async ({
    page,
    isMobile,
  }) => {
    const { slug } = perfumeFor(isMobile);
    await page.goto(`/perfumes/${slug}`);
    await expect(page.getByText('Ainda sem avaliações.')).toBeVisible();
    await page.getByRole('button', { name: 'Avaliar fragrância' }).click();
    await expect(page).toHaveURL(new RegExp(`/login\\?redirect=%2Fperfumes%2F${slug}$`));
  });

  test('logado avalia só com o teclado nas estrelas, envia e a média e a contagem atualizam', async ({
    page,
    isMobile,
  }) => {
    const { slug, name } = perfumeFor(isMobile);
    await registerViaUi(page);
    await page.goto(`/perfumes/${slug}`);
    await ownPerfume(page, name);

    const dialog = await openSheet(page, 'Avaliar fragrância');
    await expect(radioGroup(dialog, 'Fixação').getByRole('radio')).toHaveCount(5);

    // Tab até a fixação: só uma estrela do grupo entra na ordem de tabulação
    const focusedGroup = () =>
      page.evaluate(
        () =>
          document.activeElement?.closest('[role="radiogroup"]')?.getAttribute('aria-label') ?? ''
      );
    for (let i = 0; i < 6 && (await focusedGroup()) !== 'Fixação'; i += 1) {
      await page.keyboard.press('Tab');
    }
    expect(await focusedGroup()).toBe('Fixação');
    await expect(
      radioGroup(dialog, 'Fixação').getByRole('radio', { name: '1 estrela' })
    ).toBeFocused();
    // Setas movem e escolhem: 1 -> 4
    for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowRight');
    await expect(
      radioGroup(dialog, 'Fixação').getByRole('radio', { name: '4 estrelas' })
    ).toBeFocused();
    await expect(
      radioGroup(dialog, 'Fixação').getByRole('radio', { name: '4 estrelas' })
    ).toHaveAttribute('aria-checked', 'true');

    // Tab sai da fixação direto para a projeção (uma parada por grupo); End escolhe 5
    await page.keyboard.press('Tab');
    expect(await focusedGroup()).toBe('Projeção');
    await page.keyboard.press('End');
    await expect(
      radioGroup(dialog, 'Projeção').getByRole('radio', { name: '5 estrelas' })
    ).toHaveAttribute('aria-checked', 'true');

    await dialog.getByLabel('Comentário (opcional)').fill('Dura o dia todo e abre bonito.');
    await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();

    await expect(page.getByText('Avaliação enviada.')).toBeVisible();
    await expect(dialog).toBeHidden();

    // Média (4 e 5 -> 4,5) e contagem no hero; a avaliação própria aparece na seção
    await expect(summaryLine(page)).toContainText('1 avaliação');
    await expect(page.getByRole('img', { name: 'Nota média: 4,5 de 5' })).toBeVisible();
    const section = page.getByRole('region', { name: 'Avaliações da comunidade' });
    await expect(section.getByRole('heading', { name: 'Sua avaliação' })).toBeVisible();
    await expect(section.getByText('Dura o dia todo e abre bonito.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar minha avaliação' })).toBeVisible();

    // Persistiu no banco
    await page.reload();
    await expect(summaryLine(page)).toContainText('1 avaliação');
    await expect(page.getByRole('img', { name: 'Nota média: 4,5 de 5' })).toBeVisible();
  });

  test('validação: enviar sem notas mostra os erros e não fecha', async ({ page, isMobile }) => {
    const { slug, name } = perfumeFor(isMobile);
    await registerViaUi(page);
    await page.goto(`/perfumes/${slug}`);
    await ownPerfume(page, name);
    const dialog = await openSheet(page, 'Avaliar fragrância');
    await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
    await expect(dialog.getByText('Escolha a nota de fixação de 1 a 5 estrelas.')).toBeVisible();
    await expect(dialog.getByText('Escolha a nota de projeção de 1 a 5 estrelas.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('sem o perfume em "Tenho" (RN03) o envio é recusado com mensagem clara e nada muda', async ({
    page,
    isMobile,
  }) => {
    const { slug } = perfumeFor(isMobile);
    await registerViaUi(page);
    await page.goto(`/perfumes/${slug}`);
    const dialog = await openSheet(page, 'Avaliar fragrância');
    await pick(dialog, 'Fixação', 5);
    await pick(dialog, 'Projeção', 5);
    await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();

    await expect(page.getByText(/Para avaliar, coloque o perfume em “Tenho”/)).toBeVisible();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(page.getByText('Ainda sem avaliações.')).toBeVisible();
  });

  test('edita a própria avaliação e depois a remove', async ({ page, isMobile }) => {
    const { slug, name } = perfumeFor(isMobile);
    await registerViaUi(page);
    await page.goto(`/perfumes/${slug}`);
    await ownPerfume(page, name);

    let dialog = await openSheet(page, 'Avaliar fragrância');
    await pick(dialog, 'Fixação', 2);
    await pick(dialog, 'Projeção', 3);
    await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
    await expect(page.getByText('Avaliação enviada.')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Nota média: 2,5 de 5' })).toBeVisible();

    // Edição: abre preenchido, muda para 5 e 5; a contagem continua em 1 (RN04)
    dialog = await openSheet(page, 'Editar minha avaliação');
    await expect(
      radioGroup(dialog, 'Fixação').getByRole('radio', { name: '2 estrelas' })
    ).toHaveAttribute('aria-checked', 'true');
    await pick(dialog, 'Fixação', 5);
    await pick(dialog, 'Projeção', 5);
    await dialog.getByLabel('Comentário (opcional)').fill('Mudei de ideia.');
    await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Avaliação atualizada.')).toBeVisible();
    await expect(summaryLine(page)).toContainText('1 avaliação');
    await expect(page.getByRole('img', { name: 'Nota média: 5,0 de 5' })).toBeVisible();
    await expect(page.getByText('Mudei de ideia.')).toBeVisible();

    // Remoção: pede confirmação
    dialog = await openSheet(page, 'Editar minha avaliação');
    await dialog.getByRole('button', { name: 'Remover minha avaliação' }).click();
    await dialog.getByRole('button', { name: 'Sim, remover' }).click();
    await expect(page.getByText('Avaliação removida.')).toBeVisible();
    await expect(page.getByText('Ainda sem avaliações.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avaliar fragrância' })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Ainda sem avaliações.')).toBeVisible();
  });

  test('outras pessoas (e visitantes) veem a avaliação com o nome do autor, sem poder alterá-la', async ({
    page,
    browser,
    isMobile,
  }) => {
    const { slug, name } = perfumeFor(isMobile);
    await registerViaUi(page);
    await page.goto(`/perfumes/${slug}`);
    await ownPerfume(page, name);
    const dialog = await openSheet(page, 'Avaliar fragrância');
    await pick(dialog, 'Fixação', 4);
    await pick(dialog, 'Projeção', 4);
    await dialog.getByLabel('Comentário (opcional)').fill('Recomendo!');
    await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
    await expect(page.getByText('Avaliação enviada.')).toBeVisible();

    const baseURL = new URL(page.url()).origin;
    const checkAs = async (other: Page) => {
      await other.goto(`/perfumes/${slug}`);
      const section = other.getByRole('region', { name: 'Avaliações da comunidade' });
      await expect(section.getByRole('heading', { name: 'Ana E2E' })).toBeVisible();
      await expect(section.getByText('Recomendo!')).toBeVisible();
      await expect(section.getByRole('heading', { name: 'Sua avaliação' })).toHaveCount(0);
      await expect(other.getByRole('button', { name: 'Editar minha avaliação' })).toHaveCount(0);
      await expect(other.getByRole('button', { name: 'Remover minha avaliação' })).toHaveCount(0);
      await expect(summaryLine(other)).toContainText('1 avaliação');
    };

    const visitorContext = await browser.newContext({ baseURL });
    await checkAs(await visitorContext.newPage());
    await visitorContext.close();

    const otherContext = await browser.newContext({ baseURL });
    const other = await otherContext.newPage();
    await registerViaUi(other);
    await checkAs(other);
    await otherContext.close();
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe com o formulário aberto a 360 px, tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key as string, value as string),
        [THEME_KEY, theme]
      );
      await page.setViewportSize({ width: 360, height: 780 });
    });

    test('bottom-sheet aberto: rádios de 44 px, sem violações (vazio, com erros e preenchido)', async ({
      page,
      isMobile,
    }) => {
      const { slug, name } = perfumeFor(isMobile);
      await registerViaUi(page);
      await page.goto(`/perfumes/${slug}`);
      await ownPerfume(page, name);
      const dialog = await openSheet(page, 'Avaliar fragrância');
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      // Bottom-sheet no celular: ancorado embaixo, não centralizado
      await expect(dialog).toHaveAttribute('data-slot', 'drawer-content');

      // Cada estrela tem pelo menos 44x44 px
      const radios = dialog.getByRole('radio');
      await expect(radios).toHaveCount(10);
      for (const radio of await radios.all()) {
        const box = await radio.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
      expect(await axeViolations(page)).toEqual([]);

      await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
      await expect(dialog.getByText('Escolha a nota de fixação de 1 a 5 estrelas.')).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);

      await pick(dialog, 'Fixação', 3);
      await pick(dialog, 'Projeção', 4);
      await dialog.getByLabel('Comentário (opcional)').fill('Texto de teste.');
      expect(await axeViolations(page)).toEqual([]);
    });

    test('página com avaliações, sem o formulário', async ({ page, isMobile }) => {
      const { slug, name } = perfumeFor(isMobile);
      await registerViaUi(page);
      await page.goto(`/perfumes/${slug}`);
      await ownPerfume(page, name);
      const dialog = await openSheet(page, 'Avaliar fragrância');
      await pick(dialog, 'Fixação', 5);
      await pick(dialog, 'Projeção', 4);
      await dialog.getByLabel('Comentário (opcional)').fill('Ótimo.');
      await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('heading', { name: 'Sua avaliação' })).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  });
}

test('no desktop o formulário é um Dialog centralizado (e não um bottom-sheet)', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Layout de tela larga');
  const { slug, name } = perfumeFor(isMobile);
  await page.setViewportSize({ width: 1280, height: 800 });
  await registerViaUi(page);
  await page.goto(`/perfumes/${slug}`);
  await ownPerfume(page, name);
  const dialog = await openSheet(page, 'Avaliar fragrância');
  await expect(dialog).toHaveAttribute('data-slot', 'dialog-content');
  expect(await axeViolations(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Avaliar fragrância' })).toBeFocused();
});
