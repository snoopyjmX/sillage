import { Composition } from 'remotion';
import { SillageShowcase } from './SillageShowcase';
import { VIDEO } from './tokens';

export const Root = () => (
  <Composition
    id="SillageShowcase"
    component={SillageShowcase}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
