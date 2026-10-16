import { CloudSun, Share2, Sparkles } from 'lucide-react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { CropCard } from '../components/CropCard';
import { FeatureCallout } from '../components/FeatureCallout';
import { mix, useEnter, useSpan, useWindow } from '../components/motion';
import { SceneTitle } from '../components/SceneTitle';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { softSpring } from '../tokens';

const MEDIA = { left: 700, top: 190, width: 1100 } as const;

// Cena 2 (6–15 s): Home diária, clima em tempo real, Sugestão do Dia e o card SOTD 9:16
export const Scene2Home = () => {
  const frame = useCurrentFrame();
  const browserIn = useEnter(6, softSpring);
  const zoomIn = useSpan(40, 150);
  const zoomOut = useSpan(200, 270);
  const toSuggestion = useSpan(300, 380);
  const darkIn = useSpan(250, 300);
  const cardIn = useEnter(330, softSpring);
  const cardVisible = useWindow(330, 100_000, 1);
  const bob = Math.sin((frame - 330) / 34) * 6;

  // Zoom na WeatherBar, volta e desce para a Sugestão do Dia
  const zoom = mix(1, 1.4, zoomIn) - (mix(1, 1.4, zoomIn) - 1) * zoomOut;
  const scroll = mix(0, 520, toSuggestion);

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={0} />
      <SceneTitle
        kicker="01 · Home diária"
        title="O perfume certo para o clima de hoje."
        body="Clima em tempo real, Sugestão do Dia do catálogo ou do seu armário e o Perfume do Dia pronto para compartilhar."
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
          src="03-home-light-desktop.png"
          url="sillage.app"
          width={MEDIA.width}
          zoom={zoom}
          focus={{ x: 70, y: 150 }}
          style={{ left: MEDIA.left, top: MEDIA.top }}
        />
        <BrowserFrame
          src="04-home-dark-desktop.png"
          url="sillage.app"
          width={MEDIA.width}
          scroll={scroll}
          dark
          style={{ left: MEDIA.left, top: MEDIA.top, opacity: darkIn }}
        />
      </div>

      <CropCard
        src="05-sotd-share-dialog.png"
        crop={{ x: 500, y: 132, w: 280, h: 488 }}
        width={330}
        style={{
          left: 1500,
          top: 230,
          opacity: cardIn * cardVisible,
          transform: `translateX(${mix(260, 0, cardIn)}px) translateY(${bob}px) rotate(${mix(8, 2.5, cardIn)}deg)`,
        }}
      />

      <FeatureCallout
        icon={CloudSun}
        title="Clima em tempo real"
        caption="22 °C em São Paulo · famílias recomendadas para hoje"
        at={70}
        until={250}
        style={{ left: 760, top: 860 }}
      />
      <FeatureCallout
        icon={Sparkles}
        title="Sugestão do Dia"
        caption="Do catálogo ou do seu armário, com fixação e rastro"
        at={265}
        until={420}
        style={{ left: 760, top: 860 }}
      />
      <FeatureCallout
        icon={Share2}
        title="Compartilhar dia"
        caption="Card 9:16 para os stories, gerado no aparelho"
        at={410}
        style={{ left: 1080, top: 860 }}
      />
    </AbsoluteFill>
  );
};
