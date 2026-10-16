import { Scale, Sparkles } from 'lucide-react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { CropCard } from '../components/CropCard';
import { FeatureCallout } from '../components/FeatureCallout';
import { mix, useEnter, useSpan } from '../components/motion';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneTitle } from '../components/SceneTitle';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { softSpring } from '../tokens';

const MEDIA = { left: 700, top: 190, width: 1000 } as const;

// Cena 4 (25–34 s): Comparador no desktop e em 360 px; a gaveta do Nez com a Trilha de Descoberta
export const Scene4Compare = () => {
  const frame = useCurrentFrame();
  const browserIn = useEnter(6, softSpring);
  const phoneIn = useEnter(40, softSpring);
  const phoneScroll = useSpan(80, 260);
  const phoneOut = useSpan(270, 320);
  const toNez = useSpan(280, 330);
  const drawerIn = useEnter(300, softSpring);
  const bob = Math.sin((frame - 300) / 40) * 5;

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={1} />
      <SceneTitle
        dark
        kicker="03 · Comparador e Nez IA"
        title="Lado a lado. E um perfumista de bolso."
        body="Compare pirâmide, famílias e clima. O Nez, com Gemini, guia a escolha: clima + ocasião + DNA → três perfumes reais, validados no servidor."
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: browserIn,
          transform: `translateY(${mix(80, 0, browserIn)}px)`,
        }}
      >
        <BrowserFrame
          src="09-compare-desktop.png"
          url="sillage.app/compare?a=malbec-signature&b=bossa"
          width={MEDIA.width}
          dark
          style={{ left: MEDIA.left, top: MEDIA.top }}
        />
        <BrowserFrame
          src="11-nez-discovery-drawer.png"
          url="sillage.app/perfumes/malbec-black"
          width={MEDIA.width}
          dark
          style={{ left: MEDIA.left, top: MEDIA.top, opacity: toNez }}
        />
      </div>

      <PhoneFrame
        src="10-compare-mobile.png"
        width={290}
        scroll={mix(0, 520, phoneScroll)}
        style={{
          left: 1540,
          top: 300,
          opacity: phoneIn * (1 - phoneOut),
          transform: `translateY(${mix(500, 0, phoneIn) + phoneOut * 160}px) rotate(${mix(6, 2, phoneIn)}deg)`,
        }}
      />

      <CropCard
        src="11-nez-discovery-drawer.png"
        crop={{ x: 896, y: 0, w: 384, h: 800 }}
        width={400}
        dark
        style={{
          left: 1430,
          top: 110,
          opacity: drawerIn,
          transform: `translateX(${mix(520, 0, drawerIn)}px) translateY(${bob}px)`,
        }}
      />

      <FeatureCallout
        icon={Scale}
        title="Comparador lado a lado"
        caption="Desktop e celular, da pirâmide ao clima ideal"
        at={60}
        until={290}
        dark
        style={{ left: 760, top: 880 }}
      />
      <FeatureCallout
        icon={Sparkles}
        title="Nez · IA com Gemini"
        caption="Trilha guiada → 3 perfumes reais do catálogo"
        at={340}
        dark
        style={{ left: 760, top: 880 }}
      />
    </AbsoluteFill>
  );
};
