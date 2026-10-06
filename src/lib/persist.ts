// Persistência do cache do TanStack Query (docs/PRODUCT.md, Seção 11). Regra inegociável: só
// queries ['public', ...] com status de sucesso vão para o IndexedDB; ['private', userId, ...] nunca.
import type { Query } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';

export const PERSIST_KEY = 'sillage-query-cache';
export const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
// Mudou a versão do app: o cache persistido antigo é descartado
export const PERSIST_BUSTER = __APP_VERSION__;

export const shouldPersistQuery = (query: Pick<Query, 'queryKey' | 'state'>): boolean =>
  query.queryKey[0] === 'public' && query.state.status === 'success';

export const createIdbPersister = (key: string = PERSIST_KEY): Persister => ({
  persistClient: (client: PersistedClient) => set(key, client),
  restoreClient: () => get<PersistedClient>(key),
  removeClient: () => del(key),
});
