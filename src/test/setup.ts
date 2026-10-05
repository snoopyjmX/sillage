import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// Com `globals: false` o Testing Library não limpa o DOM sozinho
afterEach(() => cleanup());

// Páginas são lazy: no primeiro teste do arquivo o Vite ainda transforma o módulo (> 1 s)
configure({ asyncUtilTimeout: 3000 });
