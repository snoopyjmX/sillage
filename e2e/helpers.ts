import { AxeBuilder } from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

// Links de navegação: na barra (desktop) ou no menu hambúrguer, que o celular precisa abrir antes.
export const openNav = async (page: Page, isMobile: boolean): Promise<Locator> => {
  if (!isMobile) return page.getByRole('navigation', { name: 'Principal' });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await menu.waitFor();
  return menu;
};

// No desktop os filtros são um painel lateral; no celular, uma gaveta aberta por um botão.
export const openFilters = async (page: Page, isMobile: boolean): Promise<Locator> => {
  if (!isMobile) return page.getByRole('complementary', { name: 'Filtros' });
  await page.getByRole('button', { name: /^Filtros/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Filtros' });
  await drawer.waitFor();
  return drawer;
};

export const closeFilters = async (page: Page, isMobile: boolean): Promise<void> => {
  if (!isMobile) return;
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Filtros' }).waitFor({ state: 'hidden' });
};

// Escolhe uma nota no combobox (digita, clica na opção).
export const pickNote = async (filters: Locator, typed: string, optionName: RegExp) => {
  const combobox = filters.getByRole('combobox', { name: 'Buscar nota' });
  await combobox.fill(typed);
  await filters.getByRole('option', { name: optionName }).click();
};

export const cards = (page: Page): Locator => page.getByRole('article');
export const cardTitle = (page: Page, name: string): Locator =>
  page.getByRole('heading', { level: 2, name });

// Varredura axe com as regras WCAG 2.x A/AA; devolve só o que importa para a mensagem de falha.
export const axeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }));
};

// Cada teste cria o próprio usuário (e-mail com UUID) e roda em paralelo com os demais.
export const uniqueEmail = (): string => `e2e-${randomUUID()}@exemplo.com`;

// Cadastra pela interface; o app já entra na conta e vai para a Home.
export const registerViaUi = async (page: Page, email = uniqueEmail()): Promise<string> => {
  await page.goto('/register');
  await page.getByLabel('Nome').fill('Ana E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('Sillage2026x');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL(/\/$/);
  return email;
};

// `daily_perfumes` só aceita escrita pela função set_daily_perfume (e só para hoje), então o
// histórico de dias anteriores é semeado como dono do banco (o mesmo container do `db:start`).
// `daysAgo` 0 = hoje no fuso do perfil, a conta que a função e o app fazem.
const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? 'supabase_db_sillage';

export interface DailySeed {
  slug: string;
  daysAgo: number;
}

// Executa SQL como dono do banco (container do `db:start`), para preparar ou limpar dados de teste
export const runSql = (sql: string): void => {
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      DB_CONTAINER,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql }
  );
};

// Lê SQL como dono do banco e devolve a saída pura (uma linha por resultado, sem cabeçalho)
const querySql = (sql: string): string =>
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      DB_CONTAINER,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql, encoding: 'utf8' }
  ).trim();

export interface SimilarPerfume {
  name: string;
  slug: string;
}

// Fragrâncias parecidas de um perfume, como o banco as ordena (get_similar_perfumes é a regra RN09):
// o teste compara a tela com esta lista, não com uma ordem copiada de um seed antigo
export const similarPerfumes = (slug: string, limit = 6): SimilarPerfume[] =>
  JSON.parse(
    querySql(`
    select coalesce(json_agg(json_build_object('name', s.name, 'slug', s.slug)), '[]')
    from public.get_similar_perfumes((select id from public.perfumes where slug = '${slug}'), ${Number(limit)}) s`)
  ) as SimilarPerfume[];

// Fatos do catálogo lidos do banco, para os testes não fixarem números de um seed antigo. Cada
// valor usa a mesma regra da busca (ver supabase/migrations/*search_perfumes*).
// Tamanho da página do catálogo (src/schemas/catalogSearch.ts). Não importamos de src/ aqui porque
// o tsconfig do E2E não resolve o alias '@/'.
export const PAGE_SIZE = 24;

// Malbec Signature não cabe mais na primeira página do catálogo (o seed cresceu): os testes que
// precisam dele entram pela busca
export const CATALOG_MALBEC = '/catalog?q=Malbec%20Signature';

export interface CatalogFacts {
  total: number;
  brandNames: string[];
  boticario: number;
  granado: number;
  bergamotTop: number;
  bergamotTopCitrus: number;
  bergamotHeart: number;
  limaoAndBergamot: string[];
  firstByName: string;
}

export const catalogFacts = (): CatalogFacts =>
  JSON.parse(
    querySql(`
    select json_build_object(
      'total', (select count(*) from public.perfumes),
      'brandNames', (select coalesce(json_agg(b.name order by b.name), '[]') from public.brands b
                     where exists (select 1 from public.perfumes p where p.brand_id = b.id)),
      'boticario', (select count(*) from public.perfumes p join public.brands b on b.id = p.brand_id
                    where b.name = 'O Boticário'),
      'granado', (select count(*) from public.perfumes p join public.brands b on b.id = p.brand_id
                  where b.name = 'Granado'),
      'bergamotTop', (select count(*) from public.perfumes p where exists (
                        select 1 from public.perfume_notes pn join public.notes n on n.id = pn.note_id
                        where pn.perfume_id = p.id and n.slug = 'bergamota' and pn.position = 'top')),
      'bergamotTopCitrus', (select count(*) from public.perfumes p where exists (
                        select 1 from public.perfume_notes pn join public.notes n on n.id = pn.note_id
                        where pn.perfume_id = p.id and n.slug = 'bergamota' and pn.position = 'top')
                      and exists (select 1 from public.perfume_notes pn join public.notes n on n.id = pn.note_id
                        where pn.perfume_id = p.id and n.family = 'citrus')),
      'bergamotHeart', (select count(*) from public.perfumes p where exists (
                        select 1 from public.perfume_notes pn join public.notes n on n.id = pn.note_id
                        where pn.perfume_id = p.id and n.slug = 'bergamota' and pn.position = 'heart')),
      'limaoAndBergamot', (select coalesce(json_agg(p.name order by p.name), '[]') from public.perfumes p
                  where exists (select 1 from public.perfume_notes pn join public.notes n on n.id = pn.note_id
                        where pn.perfume_id = p.id and n.slug = 'limao-siciliano')
                    and exists (select 1 from public.perfume_notes pn join public.notes n on n.id = pn.note_id
                        where pn.perfume_id = p.id and n.slug = 'bergamota')),
      'firstByName', (select p.name from public.perfumes p order by p.search_name asc limit 1)
    )`)
  ) as CatalogFacts;

export const seedDaily = (email: string, entries: DailySeed[]): void => {
  const values = entries
    .map(
      ({ slug, daysAgo }) =>
        `((select id from public.perfumes where slug = '${slug}'), ${Number(daysAgo)})`
    )
    .join(', ');
  runSql(`
    insert into public.daily_perfumes (user_id, perfume_id, date)
    select u.id, v.perfume_id, (now() at time zone p.timezone)::date - v.days_ago
    from auth.users u
    join public.profiles p on p.id = u.id
    cross join (values ${values}) as v (perfume_id, days_ago)
    where u.email = '${email.replaceAll("'", "''")}'`);
};

// Apaga as avaliações de um perfume (isolamento entre execuções: os testes de avaliação usam um
// perfume por projeto do Playwright e comparam médias e contagens exatas)
export const clearReviews = (perfumeSlug: string): void =>
  runSql(
    `delete from public.perfume_reviews where perfume_id = (select id from public.perfumes where slug = '${perfumeSlug}')`
  );

// `collection_items` aceita escrita do dono pela API, mas semear por SQL é mais rápido e não
// depende da interface do catálogo: dá ao usuário `owned` perfumes "Tenho" e `wanted` "Quero".
export const seedCollection = (email: string, owned: number, wanted: number): void =>
  runSql(`
    insert into public.collection_items (user_id, perfume_id, status)
    select u.id, p.id, case when p.rn <= ${Number(owned)} then 'owned'::public.collection_status
                            else 'wanted'::public.collection_status end
    from auth.users u
    cross join (
      select id, row_number() over (order by slug) as rn from public.perfumes
      order by slug limit ${Number(owned) + Number(wanted)}
    ) p
    where u.email = '${email.replaceAll("'", "''")}'`);

// Põe um perfume (pelo slug) na coleção do usuário como "Tenho"
export const addOwned = (email: string, perfumeSlug: string): void =>
  runSql(`
    insert into public.collection_items (user_id, perfume_id, status)
    select u.id, p.id, 'owned'::public.collection_status
    from auth.users u, public.perfumes p
    where u.email = '${email.replaceAll("'", "''")}' and p.slug = '${perfumeSlug.replaceAll("'", "''")}'
    on conflict (user_id, perfume_id) do update set status = 'owned'`);
