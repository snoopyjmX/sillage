import { Database, Fingerprint, Palette, WifiOff, type LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { mix, useEnter, useSpan } from '../components/motion';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { dark, font, radius, shadow, softSpring } from '../tokens';

interface BentoItem {
  icon: LucideIcon;
  title: string;
  lead: string;
  tags: string[];
}

const BENTO: BentoItem[] = [
  {
    icon: Database,
    title: 'PostgreSQL + RLS + pgTAP',
    lead: 'Privacidade garantida no banco: cada linha só responde a auth.uid(), e as policies são testadas com pgTAP.',
    tags: ['Supabase', 'RLS estrita', 'pgTAP'],
  },
  {
    icon: WifiOff,
    title: 'PWA Offline-First',
    lead: "Cache segregado: ['public'] persiste em IndexedDB, ['private'] fica só em memória.",
    tags: ['Workbox', 'IndexedDB'],
  },
  {
    icon: Palette,
    title: 'Design System & QA',
    lead: '100% tokens com contraste WCAG AA, testado a cada mudança.',
    tags: ['React 19', 'TS Strict', 'Tailwind 4', 'Vitest', 'Playwright + axe'],
  },
];

const BentoCard = ({ item, at, style }: { item: BentoItem; at: number; style: CSSProperties }) => {
  const enter = useEnter(at, softSpring);
  const Icon = item.icon;
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 32,
        borderRadius: radius.xxl,
        background: 'rgba(24, 30, 26, 0.78)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${dark.border}`,
        boxShadow: shadow.stageDark,
        opacity: enter,
        transform: `translateY(${mix(60, 0, enter)}px) scale(${mix(0.96, 1, enter)})`,
        ...style,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: radius.lg,
          background: dark.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={30} color={dark.primary} strokeWidth={1.75} />
      </div>
      <span
        style={{ fontFamily: font.heading, fontWeight: 600, fontSize: 34, color: dark.foreground }}
      >
        {item.title}
      </span>
      <span
        style={{ fontFamily: font.sans, fontSize: 21, lineHeight: 1.45, color: dark.textSecondary }}
      >
        {item.lead}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
        {item.tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(134, 201, 162, 0.16)',
              color: dark.primary,
              fontFamily: font.sans,
              fontWeight: 500,
              fontSize: 17,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

// Cena 6 (43–49 s): Perfil com DNA olfativo e Passkeys, ao lado do bento de engenharia
export const Scene6Engineering = () => {
  const titleIn = useEnter(4);
  const browserIn = useEnter(14, softSpring);
  const pan = useSpan(60, 300);
  const [first, second, third] = BENTO;

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={1} />
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 80,
          width: 840,
          opacity: titleIn,
          transform: `translateY(${mix(20, 0, titleIn)}px)`,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 999,
            background: dark.accent,
            color: dark.primary,
            fontFamily: font.sans,
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
          }}
        >
          05 · Perfil e engenharia
        </span>
        <h2
          style={{
            margin: '18px 0 0',
            fontFamily: font.heading,
            fontWeight: 600,
            fontSize: 56,
            lineHeight: 1.06,
            color: dark.foreground,
          }}
        >
          Seu DNA olfativo, protegido de ponta a ponta.
        </h2>
      </div>

      <BrowserFrame
        src="16-profile-dna-passkeys.png"
        url="sillage.app/profile"
        width={840}
        scroll={mix(380, 1110, pan)}
        style={{
          left: 100,
          top: 330,
          opacity: browserIn,
          transform: `translateY(${mix(80, 0, browserIn)}px)`,
        }}
      />

      {first && (
        <BentoCard item={first} at={40} style={{ left: 1000, top: 110, width: 820, height: 330 }} />
      )}
      {second && (
        <BentoCard
          item={second}
          at={70}
          style={{ left: 1000, top: 470, width: 395, height: 420 }}
        />
      )}
      {third && (
        <BentoCard
          item={third}
          at={100}
          style={{ left: 1425, top: 470, width: 395, height: 420 }}
        />
      )}

      <FeatureCallout
        icon={Fingerprint}
        title="DNA olfativo e Passkeys"
        caption="Famílias e notas do seu acervo · login WebAuthn"
        at={150}
        dark
        style={{ left: 150, top: 930 }}
      />
    </AbsoluteFill>
  );
};
