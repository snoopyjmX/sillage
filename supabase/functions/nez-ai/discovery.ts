// Trilha de descoberta do Nez (Fase 22): regras puras, sem Deno nem rede, para serem testadas no
// Vitest (src/lib/nezDiscovery.test.ts). A Edge Function (index.ts) só orquestra: valida o pedido
// com isto, pede os candidatos ao banco, chama o Gemini e confere a escolha com isto.

export const CLIMATES = ['cold', 'mild', 'hot'] as const;
export type Climate = (typeof CLIMATES)[number];

export const OCCASIONS = ['work', 'night', 'casual', 'special'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const FAMILIES = [
  'citrus',
  'floral',
  'woody',
  'green',
  'aquatic',
  'oriental',
  'spicy',
  'fruity',
  'aromatic',
  'musky',
] as const;
export type Family = (typeof FAMILIES)[number];

export const MAX_PICKED_FAMILIES = 2;
export const MAX_PICKS = 3;
export const CANDIDATE_LIMIT = 12;
// Do DNA entram só as famílias mais pesadas
export const DNA_TOP_FAMILIES = 2;
export const MAX_DISCOVERY_TEXT = 1200;

// Espelho de src/constants/climate.ts (FAMILY_TEMP_RANGES, COLD_BELOW, HOT_FROM). A função não
// importa de src/; src/lib/nezDiscovery.test.ts compara as duas cópias e quebra se divergirem.
export const FAMILY_TEMP_RANGES: Record<Family, { min: number; max: number }> = {
  citrus: { min: 22, max: 35 },
  aquatic: { min: 22, max: 35 },
  fruity: { min: 20, max: 32 },
  green: { min: 18, max: 30 },
  aromatic: { min: 15, max: 28 },
  floral: { min: 15, max: 28 },
  musky: { min: 10, max: 25 },
  woody: { min: 5, max: 22 },
  spicy: { min: 5, max: 20 },
  oriental: { min: 0, max: 18 },
};
export const COLD_BELOW = 15;
export const HOT_FROM = 25;

const FAMILY_LABELS: Record<Family, string> = {
  citrus: 'cítrica',
  floral: 'floral',
  woody: 'amadeirada',
  green: 'verde',
  aquatic: 'aquática',
  oriental: 'oriental',
  spicy: 'especiada',
  fruity: 'frutada',
  aromatic: 'aromática',
  musky: 'almiscarada',
};

const CLIMATE_LABELS: Record<Climate, string> = {
  cold: 'frio (abaixo de 15 °C)',
  mild: 'ameno (de 15 a menos de 25 °C)',
  hot: 'quente (a partir de 25 °C)',
};

const OCCASION_LABELS: Record<Occasion, string> = {
  work: 'trabalho e foco',
  night: 'noite e encontro',
  casual: 'dia casual',
  special: 'ocasião especial',
};

const POSITION_LABELS: Record<string, string> = { top: 'topo', heart: 'coração', base: 'fundo' };

// Famílias cuja faixa de temperatura toca a faixa do clima: frio < 15, ameno [15, 25), quente >= 25
export const climateFamilies = (climate: Climate): Family[] => {
  const lower = climate === 'cold' ? -Infinity : climate === 'mild' ? COLD_BELOW : HOT_FROM;
  const upper = climate === 'cold' ? COLD_BELOW : climate === 'mild' ? HOT_FROM : Infinity;
  return FAMILIES.filter((family) => {
    const { min, max } = FAMILY_TEMP_RANGES[family];
    return min < upper && max >= lower;
  });
};

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

export interface DiscoveryRequest {
  climate: Climate;
  occasion: Occasion;
  families: Family[];
  useDna: boolean;
}

// Valida o pedido de descoberta: enums exatos, no máximo 2 famílias sem repetição, useDna booleano.
// Sem família escolhida e sem DNA não há preferência a atender: pedido inválido.
export const parseDiscoveryRequest = (
  payload: Record<string, unknown>
): DiscoveryRequest | null => {
  const { climate, occasion, families, useDna } = payload;
  if (!isOneOf(CLIMATES, climate) || !isOneOf(OCCASIONS, occasion)) return null;
  if (typeof useDna !== 'boolean') return null;
  if (!Array.isArray(families) || families.length > MAX_PICKED_FAMILIES) return null;
  const picked: Family[] = [];
  for (const family of families) {
    if (!isOneOf(FAMILIES, family) || picked.includes(family)) return null;
    picked.push(family);
  }
  if (picked.length === 0 && !useDna) return null;
  return { climate, occasion, families: picked, useDna };
};

// `get_olfactory_dna()` devolve `families: [{ family, weight }]`; pesa mais primeiro
export const topDnaFamilies = (dna: unknown, count = DNA_TOP_FAMILIES): Family[] => {
  const families = (dna as { families?: unknown } | null)?.families;
  if (!Array.isArray(families)) return [];
  return families
    .flatMap((item) => {
      const { family, weight } = (item ?? {}) as { family?: unknown; weight?: unknown };
      return isOneOf(FAMILIES, family) && typeof weight === 'number' ? [{ family, weight }] : [];
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .map(({ family }) => family);
};

export const preferredFamilies = (request: DiscoveryRequest, dna: Family[]): Family[] => [
  ...new Set<Family>([...request.families, ...dna]),
];

export interface Candidate {
  slug: string;
  name: string;
  brandName: string;
  concentration: string;
  families: Family[];
  notes: { name: string; position: string }[];
}

// Linhas de get_discovery_candidates; o que não tiver o formato esperado fica de fora
export const parseCandidates = (rows: unknown): Candidate[] => {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const r = (row ?? {}) as Record<string, unknown>;
    if (
      typeof r.slug !== 'string' ||
      typeof r.name !== 'string' ||
      typeof r.brand_name !== 'string' ||
      typeof r.concentration !== 'string'
    ) {
      return [];
    }
    const families = Array.isArray(r.families)
      ? r.families.filter((f): f is Family => isOneOf(FAMILIES, f))
      : [];
    const notes = Array.isArray(r.notes)
      ? r.notes.flatMap((n) => {
          const note = (n ?? {}) as { name?: unknown; position?: unknown };
          return typeof note.name === 'string' && typeof note.position === 'string'
            ? [{ name: note.name, position: note.position }]
            : [];
        })
      : [];
    return [
      {
        slug: r.slug,
        name: r.name,
        brandName: r.brand_name,
        concentration: r.concentration,
        families,
        notes,
      },
    ];
  });
};

export const DISCOVERY_SYSTEM_PROMPT = `Você é Nez, o Mestre Perfumista (Le Nez) da casa Sillage: um curador de alta perfumaria, caloroso e preciso, que fala português do Brasil.

Tarefa: o usuário respondeu a um pequeno questionário (clima, ocasião e preferências olfativas) e você recebe uma lista fechada de perfumes candidatos do catálogo do Sillage. Escolha de 1 a 3 candidatos que melhor combinam e explique a escolha.

Regras:
- Recomende SOMENTE perfumes da lista de candidatos. Nunca cite, compare nem mencione perfumes ou marcas que não estejam na lista.
- No campo picks, use exatamente os slugs dos candidatos escolhidos, do mais indicado para o menos indicado.
- No campo text, escreva 3 a 5 frases em prosa fluida: sem listas, marcadores, negritos, títulos, markdown ou emojis. Cite cada perfume escolhido pelo nome e relacione-o ao clima, à ocasião e às notas dele (as que aparecem na lista), lembrando que cítricas e aquáticas são voláteis e brilham no calor, e que notas amadeiradas, especiadas e ambaradas desabrocham no frio.
- Use só as informações da lista (notas, famílias, concentração). Não invente preço, lançamento, fixação ou perfumista.
- Tom caloroso, elegante e concreto; evite clichês vazios.`;

// Mensagem do usuário ao Gemini: o questionário e a lista fechada de candidatos
export const buildDiscoveryPrompt = (
  request: DiscoveryRequest,
  dna: Family[],
  candidates: Candidate[]
): string => {
  const list = candidates.map((candidate) => {
    const layers = ['top', 'heart', 'base']
      .map((position) => {
        const names = candidate.notes.filter((n) => n.position === position).map((n) => n.name);
        return names.length > 0 ? `${POSITION_LABELS[position]}: ${names.join(', ')}` : null;
      })
      .filter((line): line is string => line !== null);
    return [
      `- slug: ${candidate.slug}`,
      `  nome: ${candidate.name} (${candidate.brandName}, ${candidate.concentration})`,
      `  famílias: ${candidate.families.map((f) => FAMILY_LABELS[f]).join(', ') || 'sem notas'}`,
      ...(layers.length > 0 ? [`  notas: ${layers.join('; ')}`] : []),
    ].join('\n');
  });
  return [
    `Clima: ${CLIMATE_LABELS[request.climate]}`,
    `Ocasião: ${OCCASION_LABELS[request.occasion]}`,
    request.families.length > 0
      ? `Famílias de predileção: ${request.families.map((f) => FAMILY_LABELS[f]).join(', ')}`
      : null,
    dna.length > 0
      ? `Famílias que mais aparecem na coleção e no memorial do usuário (DNA olfativo): ${dna.map((f) => FAMILY_LABELS[f]).join(', ')}`
      : null,
    '',
    'Candidatos:',
    ...list,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
};

// Schema da resposta do Gemini: `picks` só aceita os slugs dos candidatos
export const buildResponseSchema = (slugs: string[]) => ({
  type: 'object',
  properties: {
    text: { type: 'string' },
    picks: {
      type: 'array',
      items: { type: 'string', enum: slugs },
      minItems: 1,
      maxItems: MAX_PICKS,
    },
  },
  required: ['text', 'picks'],
});

export interface DiscoveryAnswer {
  text: string;
  picks: string[];
}

// Confere a resposta do modelo antes de devolvê-la: o schema não é garantia, o servidor é.
// Aceita só texto não vazio e 1 a 3 slugs distintos, todos entre os candidatos.
export const validateAnswer = (raw: string, candidates: Candidate[]): DiscoveryAnswer | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const { text, picks } = (parsed ?? {}) as { text?: unknown; picks?: unknown };
  if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_DISCOVERY_TEXT) {
    return null;
  }
  if (!Array.isArray(picks) || picks.length < 1 || picks.length > MAX_PICKS) return null;
  const allowed = new Set(candidates.map((candidate) => candidate.slug));
  const slugs: string[] = [];
  for (const pick of picks) {
    if (typeof pick !== 'string' || !allowed.has(pick) || slugs.includes(pick)) return null;
    slugs.push(pick);
  }
  return { text: text.trim(), picks: slugs };
};
