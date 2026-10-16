import { fade } from '@remotion/transitions/fade';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { AbsoluteFill, Audio, interpolate, staticFile } from 'remotion';
import { useFontsReady } from './fonts';
import { Scene1Opening } from './scenes/Scene1Opening';
import { Scene2Home } from './scenes/Scene2Home';
import { Scene3Catalog } from './scenes/Scene3Catalog';
import { Scene4Compare } from './scenes/Scene4Compare';
import { Scene5Collection } from './scenes/Scene5Collection';
import { Scene6Engineering } from './scenes/Scene6Engineering';
import { Scene7Closing } from './scenes/Scene7Closing';
import { light, VIDEO } from './tokens';

// Cross-fade entre cenas. Cada cena (menos a última) ganha a duração da transição, para que os
// cortes caiam nos segundos do roteiro e o total feche em 3240 frames.
const TRANSITION = 30;
const SCENES = [
  { id: 'abertura', frames: 360, Component: Scene1Opening },
  { id: 'home', frames: 540, Component: Scene2Home },
  { id: 'catalogo', frames: 600, Component: Scene3Catalog },
  { id: 'comparador-nez', frames: 540, Component: Scene4Compare },
  { id: 'colecao-memorial', frames: 540, Component: Scene5Collection },
  { id: 'engenharia', frames: 360, Component: Scene6Engineering },
  { id: 'encerramento', frames: 300, Component: Scene7Closing },
] as const;

const MUSIC_VOLUME = 0.85;
const FADE_IN = 60;
const FADE_OUT = 180;

// Fade-in de 1 s, 0.85 no meio e fade-out de 3 s (51 s → 54 s)
const musicVolume = (frame: number): number =>
  interpolate(
    frame,
    [0, FADE_IN, VIDEO.durationInFrames - FADE_OUT, VIDEO.durationInFrames],
    [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

export const SillageShowcase = () => {
  useFontsReady();
  return (
    <AbsoluteFill style={{ background: light.background }}>
      <Audio src={staticFile('music.mp3')} volume={musicVolume} />
      <TransitionSeries>
        {SCENES.flatMap(({ id, frames, Component }, index) => {
          const last = index === SCENES.length - 1;
          const sequence = (
            <TransitionSeries.Sequence
              key={id}
              durationInFrames={last ? frames : frames + TRANSITION}
            >
              <Component />
            </TransitionSeries.Sequence>
          );
          return last
            ? [sequence]
            : [
                sequence,
                <TransitionSeries.Transition
                  key={`${id}-fade`}
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION })}
                />,
              ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
