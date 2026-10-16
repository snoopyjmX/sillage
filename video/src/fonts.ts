import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

const FACES = [
  '500 64px Fraunces',
  '600 64px Fraunces',
  '400 24px Inter',
  '500 24px Inter',
  '600 24px Inter',
];

// Segura o render até as fontes do @fontsource carregarem: nenhum frame sai com a fonte reserva
export const useFontsReady = (): void => {
  const [handle] = useState(() => delayRender('Carregando Fraunces e Inter'));
  useEffect(() => {
    Promise.all(FACES.map((face) => document.fonts.load(face)))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};
