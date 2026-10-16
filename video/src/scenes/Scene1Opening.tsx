import { ScanFace } from 'lucide-react';
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { FeatureCallout } from '../components/FeatureCallout';
import { mix, useEnter, useSpan } from '../components/motion';
import { PhoneFrame } from '../components/PhoneFrame';
import { SillageAmbientBg } from '../components/SillageAmbientBg';
import { Wordmark } from '../components/Wordmark';
import { dark, font, light, softSpring } from '../tokens';

// Cena 1 (0–6 s): logo editorial, selo e a entrada 2.5D da Landing e do Login, virando para o escuro
export const Scene1Opening = () => {
  const frame = useCurrentFrame();
  const darkness = interpolate(frame, [230, 320], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoIn = useEnter(8);
  const sealIn = useEnter(42);
  const lift = useSpan(140, 215);
  const browserIn = useEnter(160, softSpring);
  const phoneIn = useEnter(195, softSpring);

  const wordColor = interpolateColors(darkness, [0, 1], [light.primary, dark.primary]);
  const sealBg = interpolateColors(darkness, [0, 1], [light.accent, dark.accent]);
  const sealColor = interpolateColors(darkness, [0, 1], [light.foreground, dark.foreground]);

  return (
    <AbsoluteFill>
      <SillageAmbientBg darkness={darkness} />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 34,
          transform: `translateY(${mix(0, -405, lift)}px) scale(${mix(1, 0.46, lift)})`,
        }}
      >
        <div
          style={{
            opacity: logoIn,
            transform: `translateY(${mix(30, 0, logoIn)}px) scale(${mix(0.94, 1, logoIn)})`,
          }}
        >
          <Wordmark size={150} color={wordColor} />
        </div>
        <span
          style={{
            padding: '14px 30px',
            borderRadius: 999,
            background: sealBg,
            color: sealColor,
            fontFamily: font.sans,
            fontWeight: 500,
            fontSize: 30,
            letterSpacing: 0.4,
            opacity: sealIn * (1 - lift),
            transform: `translateY(${mix(20, 0, sealIn)}px)`,
          }}
        >
          Enciclopédia olfativa &amp; Acervo pessoal
        </span>
      </AbsoluteFill>

      <AbsoluteFill style={{ perspective: 2200 }}>
        <BrowserFrame
          src="01-landing-light-desktop.png"
          url="sillage.app"
          width={1120}
          style={{
            left: 170,
            top: 250,
            opacity: browserIn,
            transform: `translateY(${mix(520, 0, browserIn)}px) rotateX(${mix(28, 7, browserIn)}deg) rotateY(${mix(0, 9, browserIn)}deg)`,
            transformOrigin: '50% 100%',
          }}
        />
        <PhoneFrame
          src="02-auth-login-mobile.png"
          width={330}
          style={{
            left: 1420,
            top: 220,
            opacity: phoneIn,
            transform: `translateY(${mix(560, 0, phoneIn)}px) rotateY(${mix(-30, -12, phoneIn)}deg) rotateZ(${mix(4, 1.5, phoneIn)}deg)`,
          }}
        />
      </AbsoluteFill>

      <FeatureCallout
        icon={ScanFace}
        title="Passkey e Face ID"
        caption="Entrar sem senha, com a biometria do aparelho"
        at={290}
        dark
        style={{ left: 1060, top: 900 }}
      />
    </AbsoluteFill>
  );
};
