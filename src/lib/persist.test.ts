import { QueryClient } from '@tanstack/react-query';
import { dehydrate } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { shouldPersistQuery } from './persist';

describe('shouldPersistQuery', () => {
  it('persiste só queries públicas com sucesso', () => {
    const client = new QueryClient();
    client.setQueryData(['public', 'perfumes', 'list'], [1]);
    client.setQueryData(['private', 'u1', 'collection'], ['segredo']);
    client.setQueryData(['private', 'u1', 'reviews', 'p1'], { comment: 'x' });
    client.setQueryData(['auth', 'session'], { token: 'x' });
    const state = dehydrate(client, { shouldDehydrateQuery: shouldPersistQuery });
    expect(state.queries.map((query) => query.queryKey)).toEqual([['public', 'perfumes', 'list']]);
  });

  it('não persiste query pública que ainda não deu certo', () => {
    const client = new QueryClient();
    void client.prefetchQuery({
      queryKey: ['public', 'brands'],
      queryFn: () => new Promise(() => {}),
    });
    const state = dehydrate(client, { shouldDehydrateQuery: shouldPersistQuery });
    expect(state.queries).toHaveLength(0);
  });
});
