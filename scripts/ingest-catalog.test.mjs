// @vitest-environment node
// Ingest em lote do catálogo: parser do backlog, seleção, duplicatas, foto e pós-processamento.
// Sem rede real e sem Gemini: o servidor HTTP é local e a busca é injetada.
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pickImage } from './download-images.mjs';
import {
  applyImagePaths,
  buildItemPrompt,
  captureImage,
  extractOgImage,
  isDailyQuota,
  loadKnownPerfumes,
  markDone,
  nextMigrationTimestamp,
  normalizePerfumers,
  officialUrlOf,
  parseBacklog,
  parseCatalogArgs,
  parseItemResponse,
  parseJsonItems,
  parseKnownPerfumes,
  parseListLine,
  selectItems,
} from './ingest-catalog.mjs';

const BACKLOG = `# Catálogo

## 🌟 Prioridade 1: Lote

### 1. Nostalgia (Granado)

- **Marca:** Granado (Linha Vintage)
- **Concentração:** \`edp\` (Deo Parfum)
- **Link Oficial:** \`https://www.granado.com.br/nostalgia\`

---

## 🌿 1. Perfumaria Nacional

### Granado & Phebo (3 perfumes)

- [ ] Nostalgia, Granado
- [x] Boemia, Granado _(No seed atual)_
- [ ] Bergamota & Flor de Laranjeira, Granado

### O Boticário (1 perfumes)

- [ ] Malbec Black, O Boticário

## 🏛️ 2. Marcas Nacionais de Contratipos e Inspiração

### In The Box (1 perfumes)

- [ ] Inspirado, In The Box
`;

describe('parseListLine', () => {
  it('lê item pendente, marcado e com marcador de seed', () => {
    expect(parseListLine('- [ ] Nostalgia, Granado')).toEqual({
      checked: false,
      name: 'Nostalgia',
      brand: 'Granado',
    });
    expect(parseListLine('- [x] Boemia, Granado _(No seed atual)_')).toEqual({
      checked: true,
      name: 'Boemia',
      brand: 'Granado',
    });
  });

  it('ignora o que não é item', () => {
    expect(parseListLine('### Granado')).toBeNull();
    expect(parseListLine('- [ ] sem marca')).toBeNull();
  });
});

describe('parseBacklog', () => {
  const items = parseBacklog(BACKLOG);

  it('pula os já marcados [x]', () => {
    expect(items.some((i) => i.name === 'Boemia')).toBe(false);
  });

  it('a ficha vence o item de lista do mesmo perfume', () => {
    const nostalgia = items.filter((i) => i.name === 'Nostalgia');
    expect(nostalgia).toHaveLength(1);
    expect(nostalgia[0].sheet).toContain('Concentração');
    expect(nostalgia[0]).toMatchObject({ section: 'prioridade', brand: 'Granado' });
  });

  it('guarda seção e grupo; marca com & e acento permanece inteira', () => {
    expect(items.find((i) => i.name === 'Bergamota & Flor de Laranjeira')).toMatchObject({
      section: 'nacional',
      group: 'granado-phebo',
      sheet: null,
    });
    expect(items.find((i) => i.name === 'Malbec Black')).toMatchObject({
      brand: 'O Boticário',
      group: 'o-boticario',
    });
    expect(items.find((i) => i.name === 'Inspirado')?.section).toBe('contratipos');
  });

  it('o corpo da ficha não vaza para a próxima seção', () => {
    expect(items.find((i) => i.name === 'Nostalgia').sheet).not.toContain('Perfumaria');
  });
});

describe('parseCatalogArgs / selectItems', () => {
  it('aceita seções e grupos repetidos', () => {
    const { options } = parseCatalogArgs([
      '--section',
      'prioridade',
      '--group',
      'Granado & Phebo',
      '--limit',
      '45',
      '--dry-run',
    ]);
    expect(options).toMatchObject({
      sections: ['prioridade'],
      groups: ['granado-phebo'],
      limit: 45,
      dryRun: true,
      name: 'lote',
    });
  });

  it.each([
    ['sem seleção', []],
    ['seção desconhecida', ['--section', 'xyz']],
    ['limit não numérico', ['--section', 'global', '--limit', 'dez']],
    ['limit zero', ['--section', 'global', '--limit', '0']],
    ['opção desconhecida', ['--tudo']],
    ['valor ausente', ['--group']],
    ['name inválido', ['--section', 'global', '--name', 'Lote 1']],
    ['dois pós-processamentos', ['--apply-images', 'a', '--mark-done', 'b']],
  ])('recusa %s', (_label, argv) => {
    expect(parseCatalogArgs(argv).error).toEqual(expect.any(String));
  });

  it('pós-processamento dispensa seleção', () => {
    expect(parseCatalogArgs(['--mark-done', 'lote.json']).options.markDone).toBe('lote.json');
  });

  it('seleciona a soma de seção e grupo e aplica o limite', () => {
    const items = parseBacklog(BACKLOG);
    const all = selectItems(items, {
      sections: ['prioridade'],
      groups: ['granado-phebo'],
      limit: null,
    });
    expect(all.map((i) => i.name)).toEqual(['Nostalgia', 'Bergamota & Flor de Laranjeira']);
    expect(selectItems(items, { sections: ['nacional'], groups: [], limit: 1 })).toHaveLength(1);
  });
});

describe('duplicatas', () => {
  const sql = [
    'insert into public.perfumes (slug, brand_id, name) select v.slug, b.id from (values',
    "  ('bossa', 'granado', 'Bossa', 2020, 'unisex', 'edc',",
    "   'Colônia cítrica.', 'granado/bossa.02001cd9.webp'),",
    "  ('ekos-alma', 'natura', 'Ekos Alma', null, 'unisex', 'edp',",
    "   'Breu.', 'natura/ekos-alma.x.webp')",
    ') as v (slug) on conflict do nothing;',
    "insert into public.notes values ('oud', 'Oud', 'woody');",
  ].join('\n');

  it('lê os slugs do seed sem confundir notas', () => {
    const known = parseKnownPerfumes(sql);
    expect(known.get('bossa')).toBe('granado');
    expect(known.get('ekos-alma')).toBe('natura');
    expect(known.has('oud')).toBe(false);
  });

  it('lê os slugs das migrations geradas pelo ingest', () => {
    const generated =
      "select 'nostalgia', b.id, 'Nostalgia'\nfrom public.brands b where b.slug = 'granado'\non conflict (slug) do nothing;";
    expect(parseKnownPerfumes(generated).get('nostalgia')).toBe('granado');
  });

  it('loadKnownPerfumes junta seed e migrations _ingest_', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'known-'));
    try {
      await writeFile(join(dir, 'seed.sql'), sql);
      await mkdir(join(dir, 'mig'));
      await writeFile(
        join(dir, 'mig', '20261021120000_ingest_x.sql'),
        "select 'carioca', b.id from public.brands b where b.slug = 'granado'"
      );
      await writeFile(
        join(dir, 'mig', '20261021130000_outra.sql'),
        "select 'zzz', b.id from public.brands b where b.slug = 'x'"
      );
      const known = await loadKnownPerfumes({
        seedFile: join(dir, 'seed.sql'),
        migrationsDir: join(dir, 'mig'),
      });
      expect([...known.keys()].sort()).toEqual(['bossa', 'carioca', 'ekos-alma']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('normalizePerfumers', () => {
  it('descarta autoria de marca e mantém pessoas na ordem', () => {
    expect(normalizePerfumers(['Casa Granado'], 'Granado')).toEqual([]);
    expect(normalizePerfumers(['Granado'], 'Granado')).toEqual([]);
    expect(
      normalizePerfumers(['Verônica Kato', 'Casa Natura', 'Pierre-Constantin Guéros'], 'Natura')
    ).toEqual(['Verônica Kato', 'Pierre-Constantin Guéros']);
  });
});

describe('nextMigrationTimestamp', () => {
  const now = new Date('2026-10-15T10:00:00Z');

  it('usa o relógio quando ele está à frente', () => {
    expect(nextMigrationTimestamp(['20261014120000_a.sql'], now)).toBe('20261015100000');
  });

  it('fica 1 s depois da última migration quando o relógio está atrás', () => {
    expect(nextMigrationTimestamp(['20261020120000_a.sql', '20261019120000_b.sql'], now)).toBe(
      '20261020120001'
    );
    expect(nextMigrationTimestamp(['20261231235959_a.sql'], now)).toBe('20270101000000');
  });

  it('sem migrations, usa o relógio', () => {
    expect(nextMigrationTimestamp([], now)).toBe('20261015100000');
  });
});

describe('prompt e resposta do Gemini', () => {
  const item = { brand: 'Granado', name: 'Nostalgia', sheet: '**Concentração:** edp' };
  const response = (overrides = {}) =>
    JSON.stringify({
      name: 'Nostalgia (Vintage)',
      brand: 'Granado (Linha Vintage)',
      releaseYear: 2022,
      concentration: 'edp',
      gender: 'unisex',
      perfumers: ['Jasmine Liu', 'Casa Granado'],
      description: 'Elegante.',
      notes: [{ name: 'Rosa', family: 'floral', position: 'heart', description: 'Floral.' }],
      imageUrl: 'https://cdn.exemplo.com/nostalgia.jpg',
      ...overrides,
    });

  it('o prompt fixa marca e nome e usa a ficha como fonte', () => {
    const prompt = buildItemPrompt(item);
    expect(prompt).toContain('"Granado"');
    expect(prompt).toContain('<fonte>');
    expect(prompt).toContain('Deo Parfum');
  });

  it('marca e nome do backlog mandam; perfumista institucional sai', () => {
    const { data, imageUrl } = parseItemResponse(response(), item);
    expect(data).toMatchObject({ brand: 'Granado', name: 'Nostalgia', perfumers: ['Jasmine Liu'] });
    expect(imageUrl).toBe('https://cdn.exemplo.com/nostalgia.jpg');
  });

  it('imageUrl que não é http(s) vira null', () => {
    expect(
      parseItemResponse(response({ imageUrl: 'javascript:alert(1)' }), item).imageUrl
    ).toBeNull();
  });

  it('recusa JSON inválido e concentração não confirmada', () => {
    expect(() => parseItemResponse('não é json', item)).toThrow(/JSON/);
    expect(() => parseItemResponse(response({ concentration: null }), item)).toThrow(
      /Concentração/
    );
  });

  it('lê o link oficial da ficha', () => {
    expect(officialUrlOf('- **Link Oficial:** `https://www.granado.com.br/x`')).toBe(
      'https://www.granado.com.br/x'
    );
    expect(officialUrlOf(null)).toBeNull();
  });
});

describe('pickImage (importado do download-images)', () => {
  it('prefere fonte confiável; sem ela só aceita com loose; ignora banco de imagens', () => {
    const urls = [
      'https://shutterstock.com/a.jpg',
      'https://blog.exemplo.com/b.jpg',
      'https://www.belezanaweb.com.br/c.jpg',
    ];
    expect(pickImage(urls, { loose: false })).toMatchObject({ trusted: true });
    expect(() => pickImage(urls.slice(0, 2), { loose: false })).toThrow(/confiável/);
    expect(pickImage(urls.slice(0, 2), { loose: true })).toMatchObject({
      url: 'https://blog.exemplo.com/b.jpg',
      trusted: false,
    });
    expect(() => pickImage(['https://shutterstock.com/a.jpg'], { loose: true })).toThrow(/bancos/);
  });
});

describe('extractOgImage', () => {
  it('resolve URL relativa e aceita a ordem dos atributos', () => {
    expect(
      extractOgImage('<meta property="og:image" content="/img/f.jpg">', 'https://loja.com/p/x')
    ).toBe('https://loja.com/img/f.jpg');
    expect(
      extractOgImage(
        '<meta content="https://c.com/f.png" property="og:image"/>',
        'https://loja.com'
      )
    ).toBe('https://c.com/f.png');
    expect(extractOgImage('<html></html>', 'https://loja.com')).toBeNull();
  });
});

describe('captureImage (servidor local e pasta temporária)', () => {
  let server;
  let base;
  let dir;
  const slugs = { brandSlug: 'granado', perfumeSlug: 'nostalgia' };
  const target = { name: 'Nostalgia', brand: 'Granado', imageUrl: null, officialUrl: null };

  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === '/ok.jpg') {
        res.writeHead(200, { 'content-type': 'image/jpeg' });
        res.end(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
      } else if (req.url === '/pagina') {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(`<meta property="og:image" content="${base}/ok.jpg">`);
      } else {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end('<html>não é imagem</html>');
      }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(() => server.close());

  const fresh = async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = await mkdtemp(join(tmpdir(), 'capture-'));
    return dir;
  };

  it('usa a URL do Gemini quando ela é uma imagem', async () => {
    const result = await captureImage({ ...target, imageUrl: `${base}/ok.jpg` }, slugs, {
      dir: await fresh(),
    });
    expect(result.source).toBe('gemini');
    expect((await readFile(result.file)).length).toBe(4);
    await rm(dir, { recursive: true, force: true });
  });

  it('URL do Gemini que não é imagem cai no og:image da página oficial', async () => {
    const result = await captureImage(
      { ...target, imageUrl: `${base}/falsa`, officialUrl: `${base}/pagina` },
      slugs,
      { dir: await fresh() }
    );
    expect(result.source).toBe('og:image');
    await rm(dir, { recursive: true, force: true });
  });

  it('sem nada utilizável, cai na busca (só fontes confiáveis)', async () => {
    const search = async () => [`${base}/ok.jpg`];
    // 127.0.0.1 não é fonte confiável: sem loose, a busca é recusada antes de qualquer download
    await expect(captureImage(target, slugs, { dir: await fresh(), search })).rejects.toThrow(
      /Sem foto utilizável/
    );
    const loose = await captureImage(target, slugs, { dir: await fresh(), search, loose: true });
    expect(loose.source).toBe('busca');
    await rm(dir, { recursive: true, force: true });
  });

  it('tudo falhando devolve o motivo de cada tentativa', async () => {
    const search = async () => {
      throw new Error('bloqueado');
    };
    await expect(
      captureImage({ ...target, imageUrl: `${base}/falsa` }, slugs, { dir: await fresh(), search })
    ).rejects.toThrow(/gemini:.*busca: bloqueado/);
    await rm(dir, { recursive: true, force: true });
  });

  it('reaproveita a foto que já está em raw-images', async () => {
    const root = await fresh();
    await mkdir(join(root, 'granado'));
    await writeFile(join(root, 'granado', 'nostalgia.png'), 'x');
    const result = await captureImage(target, slugs, { dir: root });
    expect(result.source).toBe('raw-images');
    await rm(dir, { recursive: true, force: true });
  });
});

describe('applyImagePaths / markDone', () => {
  it('troca o image_path provisório pelo com hash, só onde há foto processada', () => {
    const sql = "values ('granado/nostalgia.webp'), ('granado/carioca.webp')";
    const { sql: out, applied } = applyImagePaths(sql, {
      nostalgia: 'granado/nostalgia.a1b2c3d4.webp',
    });
    expect(out).toBe("values ('granado/nostalgia.a1b2c3d4.webp'), ('granado/carioca.webp')");
    expect(applied).toEqual(['granado/nostalgia.a1b2c3d4.webp']);
  });

  it('marca [x] só nos itens do lote, sem tocar nos demais', () => {
    const { markdown, marked } = markDone(BACKLOG, [{ brand: 'Granado', name: 'Nostalgia' }]);
    expect(marked).toBe(1);
    expect(markdown).toContain('- [x] Nostalgia, Granado');
    expect(markdown).toContain('- [ ] Malbec Black, O Boticário');
    expect(markdown).toContain('- [x] Boemia, Granado _(No seed atual)_');
  });
});

describe('isDailyQuota', () => {
  it('só a cota diária pára o lote; 503 e limite por minuto seguem com retentativa', () => {
    expect(
      isDailyQuota(new Error('quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier'))
    ).toBe(true);
    expect(isDailyQuota(new Error('503 UNAVAILABLE'))).toBe(false);
    expect(isDailyQuota(new Error('GenerateRequestsPerMinutePerProjectPerModel'))).toBe(false);
  });
});

describe('--from-json (registros curados, sem Gemini)', () => {
  it('aceita --from-json sozinho e recusa combinações', () => {
    expect(parseCatalogArgs(['--from-json', 'a.json']).options.fromJson).toBe('a.json');
    expect(parseCatalogArgs(['--from-json', 'a.json', '--section', 'global']).error).toEqual(
      expect.any(String)
    );
    expect(parseCatalogArgs(['--from-json', 'a.json', '--mark-done', 'b']).error).toEqual(
      expect.any(String)
    );
    expect(parseCatalogArgs(['--from-json']).error).toEqual(expect.any(String));
  });

  it('recusa JSON inválido, lista vazia e registro sem marca ou nome', () => {
    expect(() => parseJsonItems('não é json')).toThrow(/JSON/);
    expect(() => parseJsonItems('[]')).toThrow(/lista/);
    expect(() => parseJsonItems('[{"name":"X"}]')).toThrow(/Registro 1/);
  });

  it('o JSON da Prioridade 1 passa pelo mesmo schema do Gemini e não repete perfume', async () => {
    const file = new URL('./catalog-data/prioridade-1.json', import.meta.url);
    const items = parseJsonItems(await readFile(file, 'utf8'));
    expect(items).toHaveLength(8);
    const slugs = new Set();
    for (const item of items) {
      const { data } = parseItemResponse(JSON.stringify(item.record), item);
      expect(data.notes.length).toBeGreaterThanOrEqual(9);
      expect(item.officialUrl).toMatch(/^https:///);
      slugs.add(`${data.brand}/${data.name}`);
    }
    expect(slugs.size).toBe(8);
  });
});
