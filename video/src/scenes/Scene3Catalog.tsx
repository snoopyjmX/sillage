import { HeartHandshake, Search, Triangle } from 'lucide-react';
import { AbsoluteFill } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { CropCard } from '../components/CropCard';
import { FeatureCallout } from '../components/FeatureCallout';
import { mix, useEnter, useSpan } from '../components/motion';
import { Pill } from '../components/Pill';
import { SceneTitle } from '../components/SceneTitle';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { families, familyForeground, softSpring } from '../tokens';

const MEDIA = { left: 700, top: 190, width: 1100 } as const;

// Cena 3 (15–25 s): Catálogo com as 10 famílias, Detalhes com a Pirâmide Olfativa e a Afinidade
export const Scene3Catalog = () => {
  const browserIn = useEnter(6, softSpring);
  const catalogPan = useSpan(40, 260);
  const toDetail = useSpan(270, 320);
  const toPyramid = useSpan(330, 420);
  const toAffinity = useSpan(470, 540);
  const affinityIn = useEnter(500, softSpring);

  const detailScroll = mix(0, 640, toPyramid) + (1330 - 640) * toAffinity;

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={0} />
      <SceneTitle
        kicker="02 · Catálogo e detalhes"
        title="Uma enciclopédia que se lê como revista."
        body="Busca sem acentos com unaccent + pg_trgm e filtros por nota, marca e família olfativa."
      />
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 690,
          width: 540,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {Object.values(families).map((family, index) => (
          <Pill
            key={family.label}
            background={family.bg}
            color={familyForeground}
            at={60 + index * 7}
          >
            {family.label}
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
          src="06-catalog-light-desktop.png"
          url="sillage.app/catalog?families=woody,oriental"
          width={MEDIA.width}
          zoom={mix(1, 1.12, catalogPan)}
          focus={{ x: 760, y: 420 }}
          style={{ left: MEDIA.left, top: MEDIA.top }}
        />
        <BrowserFrame
          src="07-perfume-detail-pyramid.png"
          url="sillage.app/perfumes/malbec-black"
          width={MEDIA.width}
          scroll={detailScroll}
          style={{ left: MEDIA.left, top: MEDIA.top, opacity: toDetail }}
        />
      </div>

      <CropCard
        src="08-perfume-affinity.png"
        crop={{ x: 330, y: 84, w: 620, h: 240 }}
        width={560}
        style={{
          left: 1300,
          top: 640,
          opacity: affinityIn,
          transform: `translateY(${mix(120, 0, affinityIn)}px) scale(${mix(0.9, 1, affinityIn)})`,
        }}
      />

      <FeatureCallout
        icon={Search}
        title="Busca sem acentos"
        caption="“bonissimo” encontra “Boníssimo”"
        at={50}
        until={290}
        style={{ left: 760, top: 860 }}
      />
      <FeatureCallout
        icon={Triangle}
        title="Pirâmide olfativa"
        caption="Topo, Coração e Fundo, com a barra de famílias"
        at={350}
        until={500}
        style={{ left: 760, top: 860 }}
      />
      <FeatureCallout
        icon={HeartHandshake}
        title="Combina com você?"
        caption="Afinidade alta, explicada pelo seu DNA"
        at={520}
        style={{ left: 740, top: 900 }}
      />
    </AbsoluteFill>
  );
};
