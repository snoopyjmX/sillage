// O Nez (Edge Function nez-ai) é SEMPRE mockado com page.route: o E2E nunca chama o Gemini
// (sem timeout, sem gastar tokens). Dados reais do seed: Malbec Signature divide notas com
// vários perfumes do catálogo, então a seção de similaridade tem conteúdo.
import type { Page, Route } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { axeViolations, registerViaUi } from './helpers.ts';

const URL = '/perfumes/malbec-signature';
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
  test('visitante não vê o botão do Nez: a página de detalhes cai na Landing (gate)', async ({
    page,
  }) => {
    await page.goto(URL);
    await expect(page).toHaveURL(/\/\?redirect=%2Fperfumes%2Fmalbec-signature$/);
    await expect(page.getByRole('button', { name: 'Nez' })).toHaveCount(0);
  });

  test('logado vê o botão do Nez nos detalhes', async ({ page }) => {
    await registerViaUi(page);
    await page.goto(URL);
    await expect(page.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nez' })).toBeVisible();
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
    expect(call?.body.context).toContain('Malbec Signature');
    expect(call?.body.context).toContain('Vetiver');
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
  test.beforeEach(async ({ page }) => {
    await registerViaUi(page);
  });

  test('a página de detalhes mostra "Fragrâncias com a mesma alma" sem o próprio perfume', async ({
    page,
  }) => {
    await page.goto(URL);
    const section = page.getByRole('region', { name: 'Fragrâncias com a mesma alma' });
    await expect(section).toBeVisible();

    const list = section.getByRole('list', { name: 'Fragrâncias parecidas' });
    const first = 'Essencial Único Masculino';
    await expect(list.getByRole('heading', { level: 2, name: first })).toBeVisible();
    await expect(list.getByRole('heading', { level: 2, name: 'Malbec Signature' })).toHaveCount(0);

    // No seed, 7 perfumes dividem notas com o Malbec Signature; a lista mostra os 6 primeiros
    await expect(list.getByRole('heading', { level: 2 })).toHaveCount(6);

    await list.getByRole('link', { name: new RegExp(first) }).click();
    await expect(page).toHaveURL(/\/perfumes\/essencial-unico-masculino$/);
  });

  test('ordena por notas em comum e desempata pelo nome (da página do Boníssimo)', async ({
    page,
  }) => {
    await page.goto('/perfumes/bonissimo');
    const list = page.getByRole('list', { name: 'Fragrâncias parecidas' });
    await expect(list.getByRole('heading', { level: 2 })).toHaveCount(6);
    // Folha Imperial (4 notas em comum), Attar Al Wesal (3) e depois os de 2 e 1 em ordem alfabética
    expect(await list.getByRole('heading', { level: 2 }).allTextContents()).toEqual([
      'Folha Imperial',
      'Attar Al Wesal',
      'Bossa',
      'Ekos Alma',
      'Malbec Signature',
      'Apoena',
    ]);
  });
});

test.describe('Nez: trilha de descoberta', () => {
  const DISCOVERY_TEXT =
    'Para o seu dia quente, o Malbec Signature abre fresco e termina amadeirado.';

  test('percorre os três passos, manda as escolhas e mostra perfumes reais do catálogo', async ({
    page,
  }) => {
    const calls = await mockNez(page, (route) =>
      route.fulfill({
        status: 200,
        headers: CORS,
        json: { text: DISCOVERY_TEXT, picks: ['malbec-signature'] },
      })
    );
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByRole('button', { name: 'Guiar minha escolha' }).click();

    // Passo 1: com o clima mockado (25 °C) o calor já vem marcado
    await expect(drawer.getByText('Passo 1 de 3')).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Calor tropical' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(await axeViolations(page)).toEqual([]);
    await drawer.getByRole('button', { name: 'Continuar' }).click();

    // Passo 2
    await drawer.getByRole('button', { name: 'Casual, de dia' }).click();
    await drawer.getByRole('button', { name: 'Continuar' }).click();

    // Passo 3: sem família nem DNA o botão fica desligado
    await expect(drawer.getByRole('button', { name: 'Pedir a curadoria' })).toBeDisabled();
    await drawer.getByRole('button', { name: 'Amadeirado' }).click();
    await drawer.getByRole('button', { name: 'Pedir a curadoria' }).click();

    await expect(drawer.locator('[data-slot="typing-animation"]')).toContainText(DISCOVERY_TEXT);
    const card = drawer.getByRole('list', { name: 'Perfumes escolhidos pelo Nez' });
    await expect(card.getByRole('heading', { name: 'Malbec Signature' })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.authorization).toMatch(/^Bearer .+/);
    expect(calls[0]?.body).toEqual({
      mode: 'discovery',
      climate: 'hot',
      occasion: 'casual',
      families: ['woody'],
      useDna: false,
    });

    await card.getByRole('link', { name: 'Ver pirâmide e detalhes' }).click();
    await expect(page).toHaveURL(/\/perfumes\/malbec-signature$/);
    await expect(drawer).toBeHidden();
  });

  test('sem candidatos mostra o estado vazio, sem consultar o catálogo', async ({ page }) => {
    await mockNez(page, (route) =>
      route.fulfill({ status: 200, headers: CORS, json: { text: '', picks: [] } })
    );
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByRole('button', { name: 'Guiar minha escolha' }).click();
    await drawer.getByRole('button', { name: 'Frio intenso' }).click();
    await drawer.getByRole('button', { name: 'Continuar' }).click();
    await drawer.getByRole('button', { name: 'Noite e encontro' }).click();
    await drawer.getByRole('button', { name: 'Continuar' }).click();
    await drawer.getByRole('button', { name: 'Usar o meu DNA olfativo' }).click();
    await drawer.getByRole('button', { name: 'Pedir a curadoria' }).click();

    await expect(drawer.getByText('Nenhum perfume combinou desta vez')).toBeVisible();
    await drawer.getByRole('button', { name: 'Refazer a trilha' }).click();
    await expect(drawer.getByText('Passo 1 de 3')).toBeVisible();
  });

  test('falha do servidor mostra mensagem amigável e dá para tentar de novo', async ({ page }) => {
    let attempt = 0;
    await mockNez(page, async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.fulfill({ status: 502, headers: CORS, json: { error: 'upstream_failed' } });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: CORS,
        json: { text: DISCOVERY_TEXT, picks: ['malbec-signature'] },
      });
    });
    await registerViaUi(page);
    await page.goto(URL);

    const drawer = await openNez(page);
    await drawer.getByRole('button', { name: 'Guiar minha escolha' }).click();
    await drawer.getByRole('button', { name: 'Ameno' }).click();
    await drawer.getByRole('button', { name: 'Continuar' }).click();
    await drawer.getByRole('button', { name: 'Trabalho e foco' }).click();
    await drawer.getByRole('button', { name: 'Continuar' }).click();
    await drawer.getByRole('button', { name: 'Floral' }).click();
    await drawer.getByRole('button', { name: 'Pedir a curadoria' }).click();

    const alert = drawer.getByRole('alert');
    await expect(alert).toContainText('O Nez não conseguiu responder agora');
    await expect(alert).not.toContainText('upstream_failed');
    await alert.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(drawer.getByRole('heading', { name: 'Malbec Signature' })).toBeVisible();
  });
});
