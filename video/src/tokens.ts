// Espelho de src/styles/tokens.css do app (fonte da verdade). O vídeo usa só estes nomes.
export const light = {
  background: '#F6F4ED',
  surface: '#FFFFFF',
  foreground: '#17231C',
  textSecondary: '#4C5B52',
  textMuted: '#5F6D64',
  primary: '#36694C',
  primaryForeground: '#FFFFFF',
  secondary: '#EEEBE2',
  accent: '#E4EBE0',
  border: 'rgba(0, 0, 0, 0.08)',
} as const;

export const dark = {
  background: '#0F1411',
  surface: '#181E1A',
  foreground: '#EEF3EC',
  textSecondary: '#B4C0B7',
  textMuted: '#8E9C93',
  primary: '#86C9A2',
  primaryForeground: '#08150F',
  secondary: '#202823',
  accent: '#223028',
  border: 'rgba(255, 255, 255, 0.1)',
} as const;

export type Palette = { [K in keyof typeof light]: string };

export const families = {
  citrus: { label: 'Cítrico', bg: '#F6EE9A' },
  floral: { label: 'Floral', bg: '#F8CFE0' },
  woody: { label: 'Amadeirado', bg: '#E6CDB0' },
  green: { label: 'Verde', bg: '#CDE8B8' },
  aquatic: { label: 'Aquático', bg: '#BFE2F2' },
  oriental: { label: 'Oriental', bg: '#F5C98F' },
  spicy: { label: 'Especiado', bg: '#F4B9A6' },
  fruity: { label: 'Frutado', bg: '#FBC3B8' },
  aromatic: { label: 'Aromático', bg: '#D8D2F0' },
  musky: { label: 'Almiscarado', bg: '#E4DAD2' },
} as const;

export const familyForeground = '#1F1B18';

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28 } as const;

export const shadow = {
  card: '0 1px 3px rgba(23, 35, 28, 0.06), 0 4px 12px rgba(23, 35, 28, 0.04)',
  floating: '0 8px 24px rgba(23, 35, 28, 0.08)',
  modal: '0 16px 48px rgba(23, 35, 28, 0.12)',
  // Versão "cinema" da elevação modal: o mesmo tom, mais difusa para a escala 1080p
  stage: '0 40px 120px rgba(23, 35, 28, 0.22), 0 12px 32px rgba(23, 35, 28, 0.12)',
  stageDark: '0 40px 120px rgba(0, 0, 0, 0.55), 0 12px 32px rgba(0, 0, 0, 0.35)',
} as const;

export const font = {
  heading: "'Fraunces', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
} as const;

// Mola padrão: sem quique, assentamento calmo (equivalente ao motion "calm" do app)
export const calmSpring = { damping: 200, mass: 1, stiffness: 100 } as const;
export const softSpring = { damping: 26, mass: 1, stiffness: 90 } as const;

export const VIDEO = { width: 1920, height: 1080, fps: 60, durationInFrames: 3240 } as const;
