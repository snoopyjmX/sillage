import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// Os testes rodam contra o BUILD de produção (vite build + vite preview) e contra o Supabase
// local já com o seed (`npm run db:start`). As variáveis VITE_* vêm do .env.local (ou do CI).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    // Fuso fixo: a cidade do clima sai do fuso do perfil, e o CI roda em UTC (sem cidade, sem clima)
    timezoneId: 'America/Sao_Paulo',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
