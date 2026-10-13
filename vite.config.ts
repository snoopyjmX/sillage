/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`${version}-${Date.now()}`),
    __PKG_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Service Worker (docs/PRODUCT.md, Seção 11): shell em precache; imagens públicas do Storage em
    // CacheFirst; Supabase (REST, RPC, Auth, Functions) sempre NetworkOnly, sem dado privado em cache.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Sillage',
        short_name: 'Sillage',
        description: 'Enciclopédia olfativa: catálogo e coleção de perfumaria de nicho.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Iguais ao token `--background` do tema claro (src/styles/tokens.css)
        theme_color: '#f6f4ed',
        background_color: '#f6f4ed',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/storage/v1/object/public/perfume-images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'perfume-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Arte decorativa das telas de auth (WebP em public/auth-art): fora do precache para não
            // inflar a instalação; entra no cache só quando o visitante a vê. Sem ela, o painel
            // mostra a superfície de token.
            urlPattern: ({ url }) => url.pathname.startsWith('/auth-art/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'auth-art',
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => /^\/(rest|auth|functions)\/v1\//.test(url.pathname),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
    // `npm run analyze` gera stats.html (treemap com gzip); fora disso não entra no build
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: process.env.ANALYZE_FILE ?? 'stats.html',
            template: process.env.ANALYZE_TEMPLATE === 'raw-data' ? 'raw-data' : 'treemap',
            gzipSize: true,
          }),
        ]
      : []),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Vendor chunks lógicos: estáveis entre deploys (hash só muda quando a lib muda), cacheáveis
        // pelo Service Worker e com origem legível no treemap. Cada grupo só entra no caminho crítico
        // se o shell o importar; o resto continua carregando sob demanda com as rotas lazy.
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom|scheduler)\//,
              priority: 50,
            },
            {
              name: 'vendor-router',
              test: /node_modules\/(react-router|react-router-dom)\//,
              priority: 40,
            },
            { name: 'vendor-supabase', test: /node_modules\/@supabase\//, priority: 40 },
            { name: 'vendor-query', test: /node_modules\/@tanstack\//, priority: 40 },
            {
              name: 'vendor-forms',
              test: /node_modules\/(zod|react-hook-form|@hookform)\//,
              priority: 40,
            },
            {
              name: 'vendor-radix',
              test: /node_modules\/(@radix-ui\/(?!react-(slot|compose-refs|primitive)\/)|radix-ui|@floating-ui|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-callback-ref|use-sidecar|aria-hidden)\//,
              priority: 30,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    // Padrão de 5 s é curto para o import lazy a frio sob carga (docs/QA.md); 15 s é só a folga
    testTimeout: 15_000,
    // e2e/ é do Playwright (roda com `npm run e2e`), não do Vitest
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
