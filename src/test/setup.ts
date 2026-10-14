import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Com `globals: false` o Testing Library não limpa o DOM sozinho
afterEach(() => cleanup());

// Páginas são lazy: no primeiro teste do arquivo o Vite ainda transforma o módulo (> 1 s). Com a
// suíte inteira em paralelo (55 arquivos) esse import a frio passava de 3 s e dava falha
// intermitente; 8 s dá folga sem esconder travamento de verdade (o testTimeout fica em 15 s). A suíte
// cresceu (mais de 75 arquivos) e voltou a estourar os 5 s no primeiro teste de alguns arquivos.
configure({ asyncUtilTimeout: 8000 });

// O jsdom não implementa <canvas>: o confete vira no-op nos testes
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// O módulo virtual do vite-plugin-pwa não existe fora do Vite: o registro do SW vira no-op
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(() => vi.fn()),
}));

// O jsdom não tem IntersectionObserver (usado pelo `useInView` do motion): tudo conta como visível
class VisibleIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    const entry = { isIntersecting: true, target } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver);

// Nos testes o app parte do caminho normal (lê a sessão no authService simulado), sem o atalho de
// visitante. Esse atalho tem teste próprio (src/lib/sessionHint.test.ts e AuthContext.test.tsx).
vi.mock('@/lib/sessionHint', () => ({ mayHaveSession: vi.fn(() => true) }));
