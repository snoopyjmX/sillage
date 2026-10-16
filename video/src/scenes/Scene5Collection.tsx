import { CalendarDays, Gift, Library } from 'lucide-react';
import { AbsoluteFill } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { CropCard } from '../components/CropCard';
import { FeatureCallout } from '../components/FeatureCallout';
import { mix, useEnter, useSpan } from '../components/motion';
import { Pill } from '../components/Pill';
import { SceneTitle } from '../components/SceneTitle';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { light, softSpring } from '../tokens';

const MEDIA = { left: 700, top: 190, width: 1100 } as const;
const FORMATS = ['Frasco 100 ml', 'Decant 10 ml', 'Amostra 2 ml'];

// Cena 5 (34–43 s): Coleção com formatos, Memorial (calendário ⇄ varal) e a Retrospectiva anual
export const Scene5Collection = () => {
  const browserIn = useEnter(6, softSpring);
  const toCalendar = useSpan(180, 225);
  const toLine = useSpan(320, 365);
  const recapIn = useEnter(390, softSpring);

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={0} />
      <SceneTitle
        kicker="04 · Coleção e Memorial"
        title="Seu acervo, seus dias, seu ano."
        body="Tenho e Quero com formato e volume, o Memorial em calendário ou em varal de polaroids e a Retrospectiva anual."
      />
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 720,
          width: 540,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {FORMATS.map((label, index) => (
          <Pill key={label} background={light.accent} color={light.primary} at={50 + index * 10}>
            {label}
          </Pill>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: browserIn,
          transform: `translateY(${mix(80, 0, browserIn)}px)`,
        }}
      >
        <BrowserFrame
          src="12-collection-owned.png"
          url="sillage.app/collection"
          width={MEDIA.width}
          style={{ left: MEDIA.left, top: MEDIA.top }}
        />
        <BrowserFrame
          src="13-memorial-calendar.png"
          url="sillage.app/memorial"
          width={MEDIA.width}
          style={{ left: MEDIA.left, top: MEDIA.top, opacity: toCalendar }}
        />
        <BrowserFrame
          src="14-memorial-varal.png"
          url="sillage.app/memorial?vista=varal"
          width={MEDIA.width}
          style={{ left: MEDIA.left, top: MEDIA.top, opacity: toLine }}
        />
      </div>

      <CropCard
        src="15-recap-slide.png"
        crop={{ x: 300, y: 270, w: 680, h: 460 }}
        width={520}
        style={{
          left: 1330,
          top: 600,
          opacity: recapIn,
          transform: `translateY(${mix(140, 0, recapIn)}px) rotate(${mix(-7, -2.5, recapIn)}deg)`,
        }}
      />

      <FeatureCallout
        icon={Library}
        title="Coleção com formatos"
        caption="Frasco, decant ou amostra, com o volume"
        at={40}
        until={200}
        style={{ left: 760, top: 860 }}
      />
      <FeatureCallout
        icon={CalendarDays}
        title="Memorial"
        caption="Calendário do mês ⇄ varal de memórias"
        at={215}
        until={400}
        style={{ left: 760, top: 860 }}
      />
      <FeatureCallout
        icon={Gift}
        title="Seu ano em perfumes"
        caption="Retrospectiva em cinco lâminas"
        at={420}
        style={{ left: 760, top: 900 }}
      />
    </AbsoluteFill>
  );
};
