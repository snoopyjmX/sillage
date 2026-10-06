// O Nez (Edge Function nez-ai) é SEMPRE mockado com page.route: o E2E nunca chama o Gemini
// (sem timeout, sem gastar tokens). Dados reais do seed: Amyi 2.15 divide notas com
// Caipi d'Argent e com Irish Green Man, então a seção de similaridade tem conteúdo.
import { expect, test, type Page, type Route } from '@playwright/test';
import { axeViolations, registerViaUi } from './helpers.ts';

const URL = '/perfumes/amyi-2-15';
const NEZ_ROUTE = '**/functions/v1/nez-ai';
const ANSWER =
  'Para as noites frias, deixe a baunilha envolver o patchouli: um abraço âmbar, quente e sereno.';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

interface NezCall {
  authorization: string | undefined;
  body: {
    question?: string;
    context?: string;
    history?: { role: string; text: string }[];
  };
}

// Intercepta o Nez e registra o que o front mandou
const mockNez = async (page: Page, respond: (route: Route) => Promise<void>) => {
  const calls: NezCall[] = [];
  await page.route(NEZ_ROUTE, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    calls.push({
      authorization: request.headers()['authorization'],
      body: request.postDataJSON() as NezCall['body'],
    });
    await respond(route);
  });
  return calls;
};

const okReply = (route: Route) =>
  route.fulfill({ status: 200, headers: CORS, json: { text: ANSWER } });

const openNez = async (page: Page) => {
  await page.getByRole('button', { name: 'Nez' }).click();
  const drawer = page.getByRole('dialog', { name: 'Nez, seu Mestre Perfumista' });
  await expect(drawer).toBeVisible();
  return drawer;
};

test.describe('Nez, o mestre perfumista', () => {
  test('visitante não vê o botão do Nez', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole('heading', { level: 1, name: 'Amyi 2.15' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nez' })).toHaveCount(0);
  });

  test('abre o drawer, envia a pergunta com o perfume como contexto e mostra a resposta digitada', async ({
    page,
  }) => {
    const calls = await mockNez(page, okReply);
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByLabel('Sua pergunta ao Nez').fill('O que combina com uma noite fria?');
    await drawer.getByRole('button', { name: 'Perguntar' }).click();

    // A animação é só visual (aria-hidden); o texto completo está sempre para leitores de tela
    const typing = drawer.locator('[data-slot="typing-animation"]');
    await expect(typing).toContainText(ANSWER);
    await expect(drawer.getByText('O que combina com uma noite fria?').first()).toBeVisible();

    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call?.authorization).toMatch(/^Bearer .+/);
    expect(call?.body.question).toBe('O que combina com uma noite fria?');
    expect(call?.body.context).toContain('Amyi 2.15');
    expect(call?.body.context).toContain('Baunilha');
    expect(await axeViolations(page)).toEqual([]);
  });

  test('conversa em sequência: mantém o histórico, manda as mensagens anteriores e só digita a última', async ({
    page,
  }) => {
    let n = 0;
    const calls = await mockNez(page, async (route) => {
      n += 1;
      await route.fulfill({
        status: 200,
        headers: CORS,
        json: { text: `Resposta número ${n} do Nez.` },
      });
    });
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    const input = drawer.getByLabel('Sua pergunta ao Nez');
    await input.fill('Primeira pergunta');
    await drawer.getByRole('button', { name: 'Perguntar' }).click();
    await expect(drawer.getByText('Resposta número 1 do Nez.').first()).toBeVisible();

    await input.fill('Segunda pergunta');
    await drawer.getByRole('button', { name: 'Perguntar' }).click();
    await expect(drawer.getByText('Resposta número 2 do Nez.').first()).toBeVisible();

    const log = drawer.getByRole('log', { name: 'Conversa com o Nez' });
    await expect(log).toContainText('Primeira pergunta');
    await expect(log).toContainText('Resposta número 1 do Nez.');
    await expect(log).toContainText('Segunda pergunta');
    // Só a resposta mais recente usa a digitação; a antiga é texto estático
    await expect(log.locator('[data-slot="typing-animation"]')).toHaveCount(1);

    expect(calls[0]?.body.history ?? []).toEqual([]);
    expect(calls[1]?.body.history).toEqual([
      { role: 'user', text: 'Primeira pergunta' },
      { role: 'assistant', text: 'Resposta número 1 do Nez.' },
    ]);
  });

  test('com animação ligada a resposta é digitada até o fim', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await mockNez(page, okReply);
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByLabel('Sua pergunta ao Nez').fill('Algo amadeirado?');
    await drawer.getByRole('button', { name: 'Perguntar' }).click();

    await expect(drawer.locator('[data-slot="typing-animation"] [aria-hidden]')).toContainText(
      ANSWER,
      { timeout: 15_000 }
    );
  });

  test('mostra o carregamento e depois a resposta; Esc fecha e devolve o foco ao botão', async ({
    page,
  }) => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await mockNez(page, async (route) => {
      await gate;
      await okReply(route);
    });
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByLabel('Sua pergunta ao Nez').fill('Algo floral?');
    await drawer.getByRole('button', { name: 'Perguntar' }).click();
    await expect(drawer.getByRole('status', { name: 'O Nez está pensando' })).toBeVisible();
    release();
    await expect(drawer.locator('[data-slot="typing-animation"]')).toContainText(ANSWER);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('button', { name: 'Nez' })).toBeFocused();
  });

  test('falha do servidor mostra mensagem amigável (nunca a crua) e tentar de novo funciona', async ({
    page,
  }) => {
    let attempt = 0;
    await mockNez(page, async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.fulfill({ status: 502, headers: CORS, json: { error: 'upstream_failed' } });
        return;
      }
      await okReply(route);
    });
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByLabel('Sua pergunta ao Nez').fill('Algo cítrico?');
    await drawer.getByRole('button', { name: 'Perguntar' }).click();
    const alert = drawer.getByRole('alert');
    await expect(alert).toContainText('O Nez não conseguiu responder agora');
    await expect(alert).not.toContainText('upstream_failed');

    await alert.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(drawer.locator('[data-slot="typing-animation"]')).toContainText(ANSWER);
  });
});

test.describe('similaridade (RN09)', () => {
  test('a página de detalhes mostra "Fragrâncias com a mesma alma" sem o próprio perfume', async ({
    page,
  }) => {
    await page.goto(URL);
    const section = page.getByRole('region', { name: 'Fragrâncias com a mesma alma' });
    await expect(section).toBeVisible();

    const list = section.getByRole('list', { name: 'Fragrâncias parecidas' });
    await expect(list.getByRole('heading', { level: 2, name: "Caipi d'Argent" })).toBeVisible();
    await expect(list.getByRole('heading', { level: 2, name: 'Amyi 2.15' })).toHaveCount(0);

    // No seed, o único perfume que divide notas com a Amyi é o Caipi
    await expect(list.getByRole('heading', { level: 2 })).toHaveCount(1);

    await list.getByRole('link', { name: /Caipi d'Argent/ }).click();
    await expect(page).toHaveURL(/\/perfumes\/caipi-d-argent$/);
  });

  test('ordena por notas em comum: da página do Caipi, Amyi (2) vem antes de Irish Green Man (1)', async ({
    page,
  }) => {
    await page.goto('/perfumes/caipi-d-argent');
    const list = page.getByRole('list', { name: 'Fragrâncias parecidas' });
    await expect(list.getByRole('heading', { level: 2 })).toHaveCount(2);
    expect(await list.getByRole('heading', { level: 2 }).allTextContents()).toEqual([
      'Amyi 2.15',
      'Irish Green Man',
    ]);
  });
});
