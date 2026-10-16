import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { mix, useEnter } from '../components/motion';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { Wordmark } from '../components/Wordmark';
import { font, light } from '../tokens';

const STACK = 'React 19 · TypeScript · Tailwind 4 · Supabase · PostgreSQL RLS · PWA · Gemini';

// Cena 7 (49–54 s): frase assinatura, wordmark, stack no rodapé e fade-out junto com a música
export const Scene7Closing = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lineOne = useEnter(20);
  const lineTwo = useEnter(55);
  const mark = useEnter(100);
  const stack = useEnter(130);
  const fadeOut = interpolate(frame, [durationInFrames - 70, durationInFrames - 4], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={0} />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          opacity: fadeOut,
        }}
      >
        <h1
          style={{
            margin: 0,
            textAlign: 'center',
            fontFamily: font.heading,
            fontWeight: 600,
            fontSize: 88,
            lineHeight: 1.12,
            letterSpacing: -1.2,
            color: light.foreground,
          }}
        >
          <span
            style={{
              display: 'block',
              opacity: lineOne,
              transform: `translateY(${mix(26, 0, lineOne)}px)`,
            }}
          >
            Todo perfume deixa um rastro.
          </span>
          <span
            style={{
              display: 'block',
              color: light.primary,
              opacity: lineTwo,
              transform: `translateY(${mix(26, 0, lineTwo)}px)`,
            }}
          >
            O seu começa aqui.
          </span>
        </h1>
        <div
          style={{
            marginTop: 80,
            opacity: mark,
            transform: `scale(${mix(0.92, 1, mark)})`,
          }}
        >
          <Wordmark size={72} />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 80,
          textAlign: 'center',
          fontFamily: font.sans,
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: 0.6,
          color: light.textSecondary,
          opacity: stack * fadeOut,
        }}
      >
        {STACK}
      </div>
    </AbsoluteFill>
  );
};
