import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { addOwned, axeViolations, registerViaUi, seedCollection, seedDaily } from './helpers.ts';

// NUNCA rede real: o Open-Meteo é sempre interceptado. Qualquer outra chamada a ele falha o teste.
const GEOCODING = '**://geocoding-api.open-meteo.com/**';
const FORECAST = '**://api.open-meteo.com/**';

const CITY = {
  id: 3448439,
  name: 'São Paulo',
  country: 'Brasil',
  country_code: 'BR',
  latitude: -23.5475,
  longitude: -46.63611,
  timezone: 'America/Sao_Paulo',
};

const mockOpenMeteo = async (page: Page, temperature = 28) => {
  const requests: URL[] = [];
  await page.route(GEOCODING, (route) => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({ json: { results: [CITY] } });
  });
  await page.route(FORECAST, (route) => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({
      json: {
        current: { temperature_2m: temperature, relative_humidity_2m: 61, weather_code: 2 },
      },
    });
  });
  return requests;
};

// O fuso do navegador vira profiles.timezone no cadastro: fixa-o para a cidade ser previsível
test.use({ timezoneId: 'America/Sao_Paulo' });

test.describe('home: clima e sugestão do dia', () => {
  test('mostra cidade, temperatura, frase, umidade e famílias em destaque', async ({ page }) => {
    const requests = await mockOpenMeteo(page, 28);
    await registerViaUi(page);

    const bar = page.getByRole('region', { name: 'Clima de hoje' });
    await expect(bar.getByText('São Paulo, BRASIL')).toBeVisible();
    await expect(bar.getByText('28°C')).toBeVisible();
    await expect(bar.getByText('Parcialmente nublado')).toBeVisible();
    await expect(bar.getByText('Umidade 61%')).toBeVisible();
    await expect(bar.getByText('Projeção ideal para dias quentes')).toBeVisible();
    await expect(
      bar.getByRole('list', { name: 'Famílias em destaque hoje' }).getByRole('listitem')
    ).toHaveCount(3);

    // Só duas chamadas: geocoding e previsão; nada de coordenadas no nosso storage
    expect(requests.some((url) => url.pathname === '/v1/search')).toBe(true);
    const forecast = requests.find((url) => url.pathname === '/v1/forecast');
    expect(forecast?.searchParams.get('current')).toBe(
      'temperature_2m,relative_humidity_2m,weather_code'
    );
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...window.localStorage, ...window.sessionStorage })
    );
    expect(stored).not.toMatch(/-23\.5|-46\.6/);
  });

  test('sugestão do dia com medidores, notas e as duas ações', async ({ page }) => {
    await mockOpenMeteo(page, 28);
    const email = await registerViaUi(page);

    const card = page.getByRole('article', { name: 'Sugestão do dia' });
    await expect(card).toBeVisible();
    await expect(card.getByRole('meter', { name: 'Clima adequado' })).toBeVisible();
    await expect(card.getByText('Fixação')).toBeVisible();
    await expect(card.getByText('Rastro')).toBeVisible();
    await expect(card.getByRole('link', { name: 'Ver detalhes' })).toBeVisible();

    // RN06: só quem está em "Tenho" vira Perfume do Dia
    const slug = (await card.getByRole('link', { name: 'Ver detalhes' }).getAttribute('href'))
      ?.split('/')
      .pop();
    await expect(card.getByRole('button', { name: 'Adicione a Tenho para vestir' })).toBeDisabled();
    addOwned(email, slug ?? '');
    await page.reload();

    await card.getByRole('button', { name: 'Vestir hoje' }).click();
    const highlight = page.getByRole('article', { name: 'Perfume do Dia' });
    await expect(highlight).toBeVisible();
    await expect(card.getByRole('button', { name: 'Você já veste hoje' })).toBeDisabled();
  });

  test('Meu armário: com 3 perfumes em "Tenho" vira o padrão, sugere do "Tenho" e não troca ao vestir', async ({
    page,
  }) => {
    await mockOpenMeteo(page, 28);
    const email = await registerViaUi(page);
    seedCollection(email, 3, 0);
    await page.goto('/');

    const source = page.getByRole('group', { name: 'Origem da sugestão' });
    await expect(source.getByRole('button', { name: 'Meu armário' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    // No armário a coleção já é a escolha: sem filtro de gênero
    await expect(page.getByRole('list', { name: 'Filtrar sugestão por gênero' })).toHaveCount(0);

    const card = page.getByRole('article', { name: 'Sugestão do dia' });
    await expect(card.getByRole('heading', { level: 2 })).toContainText('Do seu armário');
    const name = await card.getByRole('heading', { level: 3 }).textContent();

    // O perfume é do "Tenho": vestir já vem habilitado e a sugestão não muda depois
    await card.getByRole('button', { name: 'Vestir hoje' }).click();
    await expect(card.getByRole('button', { name: 'Você já veste hoje' })).toBeDisabled();
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(name ?? '');

    // A escolha explícita é lembrada
    await source.getByRole('button', { name: 'Catálogo' }).click();
    await expect(page.getByRole('list', { name: 'Filtrar sugestão por gênero' })).toBeVisible();
    await page.reload();
    await expect(source.getByRole('button', { name: 'Catálogo' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('Meu armário: conta sem "Tenho" vê a prateleira vazia, nunca o armário de outra pessoa', async ({
    page,
  }) => {
    await mockOpenMeteo(page, 28);
    await registerViaUi(page);
    await page.evaluate(() => window.localStorage.setItem('sillage-home-source', 'closet'));
    await page.reload();
    await expect(page.getByText('Sua prateleira está vazia')).toBeVisible();
  });

  test('filtro de gênero da sugestão persiste entre recargas', async ({ page }) => {
    await mockOpenMeteo(page, 28);
    await registerViaUi(page);
    const group = page.getByRole('list', { name: 'Filtrar sugestão por gênero' });
    await expect(group.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await group.getByRole('button', { name: 'Unissex' }).click();
    await expect(group.getByRole('button', { name: 'Unissex' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.reload();
    await expect(
      page
        .getByRole('list', { name: 'Filtrar sugestão por gênero' })
        .getByRole('button', { name: 'Unissex' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('a sugestão é estável: recarregar no mesmo dia mantém o mesmo perfume', async ({ page }) => {
    await mockOpenMeteo(page, 28);
    await registerViaUi(page);
    const card = page.getByRole('article', { name: 'Sugestão do dia' });
    const first = await card.getByRole('heading', { level: 3 }).innerText();
    await page.reload();
    await expect(
      page.getByRole('article', { name: 'Sugestão do dia' }).getByRole('heading', { level: 3 })
    ).toHaveText(first);
  });

  test('falha da previsão mostra erro amigável e tenta de novo', async ({ page }) => {
    let healthy = false;
    await page.route(GEOCODING, (route) => route.fulfill({ json: { results: [CITY] } }));
    await page.route(FORECAST, (route) =>
      healthy
        ? route.fulfill({
            json: { current: { temperature_2m: 18, relative_humidity_2m: 70, weather_code: 61 } },
          })
        : route.fulfill({ status: 503, json: { reason: 'indisponível' } })
    );
    await registerViaUi(page);

    const bar = page.getByRole('region', { name: 'Clima de hoje' });
    await expect(
      bar.getByText('Clima indisponível no momento. Tente novamente em instantes.')
    ).toBeVisible();
    // Sem clima, a sugestão cai no catálogo todo e o medidor de clima some
    await expect(
      page.getByRole('article', { name: 'Sugestão do dia' }).getByText('Clima indisponível')
    ).toBeVisible();

    healthy = true;
    await bar.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(bar.getByText('Chuva fraca')).toBeVisible();
    await expect(bar.getByText('Projeção ideal para dias amenos')).toBeVisible();
  });

  test('cidade não resolvida mostra "Clima indisponível" sem chamar a previsão', async ({
    page,
  }) => {
    let forecastCalls = 0;
    await page.route(GEOCODING, (route) => route.fulfill({ json: { generationtime_ms: 0.2 } }));
    await page.route(FORECAST, (route) => {
      forecastCalls += 1;
      return route.abort();
    });
    await registerViaUi(page);
    const bar = page.getByRole('region', { name: 'Clima de hoje' });
    await expect(bar.getByText('Clima indisponível')).toBeVisible();
    expect(forecastCalls).toBe(0);
  });

  test('"Usar minha localização" só age no clique e não grava coordenadas', async ({
    page,
    context,
  }) => {
    const requests = await mockOpenMeteo(page, 12);
    await registerViaUi(page);
    await expect(
      page
        .getByRole('region', { name: 'Clima de hoje' })
        .getByText('28°C')
        .or(page.getByRole('region', { name: 'Clima de hoje' }).getByText('12°C'))
    ).toBeVisible();

    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -22.906847, longitude: -43.172896 });
    await page.getByRole('button', { name: 'Usar minha localização' }).click();

    const bar = page.getByRole('region', { name: 'Clima de hoje' });
    await expect(bar.getByText('Sua localização', { exact: true })).toBeVisible();
    // Coordenadas arredondadas a 2 casas na chamada ao Open-Meteo
    await expect
      .poll(() =>
        requests.some(
          (url) =>
            url.pathname === '/v1/forecast' &&
            url.searchParams.get('latitude') === '-22.91' &&
            url.searchParams.get('longitude') === '-43.17'
        )
      )
      .toBe(true);
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...window.localStorage, ...window.sessionStorage })
    );
    expect(stored).not.toMatch(/-22\.9|-43\.1/);
    const idb = await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      return JSON.stringify(dbs);
    });
    expect(idb).not.toMatch(/-22\.9|-43\.1/);

    // Não há mais "voltar à minha cidade": só o botão de usar a localização
    await expect(page.getByRole('button', { name: 'Voltar à minha cidade' })).toHaveCount(0);
    await expect(bar.getByRole('button', { name: 'Usar minha localização' })).toBeVisible();
  });

  test('negar a localização mostra mensagem amigável', async ({ page, context }) => {
    await mockOpenMeteo(page);
    await context.clearPermissions();
    await registerViaUi(page);
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_ok, fail) =>
        fail?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1 } as GeolocationPositionError);
    });
    await page.reload();
    await page.getByRole('button', { name: 'Usar minha localização' }).click();
    await expect(
      page.getByText('Não foi possível usar a sua localização. Verifique a permissão do navegador.')
    ).toBeVisible();
  });

  test('descobertas: novidades, parecidos e explore por família', async ({ page }) => {
    await mockOpenMeteo(page);
    const email = await registerViaUi(page);
    seedDaily(email, [{ slug: 'malbec-signature', daysAgo: 0 }]);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Novidades no catálogo' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Seu Perfume de hoje', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memorial', exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Parecidos com o seu perfume de hoje' })
    ).toBeVisible();

    const families = page.getByRole('list', { name: 'Famílias olfativas' }).last();
    await families.getByRole('link', { name: /Cítrico/ }).click();
    await expect(page).toHaveURL(/\/catalog\?families=citrus/);
  });

  test('rodapé credita o Open-Meteo com link', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('contentinfo').getByRole('link', {
      name: 'Weather data by Open-Meteo.com',
    });
    await expect(link).toHaveAttribute('href', 'https://open-meteo.com/');
  });
});

for (const viewport of [
  { width: 360, height: 780 },
  { width: 1280, height: 800 },
]) {
  test.describe(`axe na home com clima a ${viewport.width} px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
    });

    test('logado, com clima, sugestão e descobertas', async ({ page }) => {
      await mockOpenMeteo(page);
      await registerViaUi(page);
      await expect(page.getByRole('article', { name: 'Sugestão do dia' })).toBeVisible();
      await expect(
        page.getByRole('region', { name: 'Clima de hoje' }).getByText('28°C')
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Novidades no catálogo' })).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });

    test('logado, com clima indisponível', async ({ page }) => {
      await page.route(GEOCODING, (route) => route.fulfill({ json: {} }));
      await registerViaUi(page);
      await expect(
        page.getByRole('region', { name: 'Clima de hoje' }).getByText('Clima indisponível')
      ).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  });
}

test.describe('home: localização persistente e negação', () => {
  test('permissão concedida: a localização volta sozinha ao recarregar, só com o aviso no storage', async ({
    page,
    context,
  }) => {
    const requests = await mockOpenMeteo(page, 12);
    await registerViaUi(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -22.906847, longitude: -43.172896 });

    const bar = page.getByRole('region', { name: 'Clima de hoje' });
    await page.getByRole('button', { name: 'Usar minha localização' }).click();
    await expect(bar.getByText('Sua localização', { exact: true })).toBeVisible();
    // Só o botão de usar a localização: não há mais "voltar à cidade"
    await expect(page.getByRole('button', { name: /Voltar à minha cidade/i })).toHaveCount(0);

    await page.reload();
    // Sem clique: a Permissions API diz "granted" e a localização é usada direto
    await expect(bar.getByText('Sua localização', { exact: true })).toBeVisible();
    await expect(bar.getByText('12°C')).toBeVisible();
    expect(
      requests.filter(
        (url) =>
          url.pathname === '/v1/forecast' &&
          url.searchParams.get('latitude') === '-22.91' &&
          url.searchParams.get('longitude') === '-43.17'
      ).length
    ).toBeGreaterThan(0);

    // Só o aviso booleano é gravado; coordenadas nunca
    const local = await page.evaluate(() => ({ ...window.localStorage }));
    expect(local['sillage-geo-hint']).toBe('1');
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...window.localStorage, ...window.sessionStorage })
    );
    expect(stored).not.toMatch(/-?22\.9|-?43\.1/);
  });

  test('permissão negada: mensagem em pt-BR, aviso apagado e nenhum pedido novo automático', async ({
    page,
  }) => {
    await mockOpenMeteo(page, 12);
    // Conta as chamadas à geolocalização em cada carregamento da página (a original continua valendo)
    await page.addInitScript(() => {
      const w = window as unknown as { __geoCalls: number };
      w.__geoCalls = 0;
      const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...args) => {
        w.__geoCalls += 1;
        return original(...args);
      };
    });
    await registerViaUi(page);
    // Aviso antigo de uma concessão que o navegador já não honra
    await page.evaluate(() => window.localStorage.setItem('sillage-geo-hint', '1'));

    // Navegador sem permissão em headless: o pedido é negado
    await page.getByRole('button', { name: 'Usar minha localização' }).click();
    const bar = page.getByRole('region', { name: 'Clima de hoje' });
    await expect(
      bar.getByRole('alert').filter({ hasText: 'Não foi possível usar a sua localização' })
    ).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('sillage-geo-hint'))).toBeNull();
    const callsAfterClick = await page.evaluate(
      () => (window as unknown as { __geoCalls: number }).__geoCalls
    );
    expect(callsAfterClick).toBe(1);

    // Recarregar não pede de novo: nenhuma chamada, nenhuma mensagem, cidade do perfil
    await page.reload();
    await expect(bar.getByText('São Paulo, BRASIL')).toBeVisible();
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)
    ).toBe(0);
    await expect(bar.getByRole('alert')).toHaveCount(0);
  });
});
