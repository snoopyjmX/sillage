import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Com `globals: false` o Testing Library não limpa o DOM sozinho
afterEach(() => cleanup());
