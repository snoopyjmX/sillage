import { test as base, expect, type BrowserContext } from '@playwright/test';

// A Home chama o Open-Meteo. Os testes NUNCA falam com a rede real: todo contexto nasce com
// respostas padrão (São Paulo, 25 °C). Um page.route do teste tem precedência sobre este padrão.
export const stubOpenMeteo = async (context: BrowserContext): Promise<void> => {
  await context.route('**://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            country: 'Brasil',
            country_code: 'BR',
            latitude: -23.5475,
            longitude: -46.63611,
            timezone: 'America/Sao_Paulo',
          },
        ],
      },
    })
  );
  await context.route('**://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: { current: { temperature_2m: 25, relative_humidity_2m: 55, weather_code: 1 } },
    })
  );
};

export const test = base.extend({
  context: async ({ context }, provide) => {
    await stubOpenMeteo(context);
    await provide(context);
  },
});

export { expect };
