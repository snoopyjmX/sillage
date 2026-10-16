// Configuração do Remotion CLI (studio e render). Saída: H.264 de alta qualidade para o LinkedIn.
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);

// Opcional: reaproveita um Chrome Headless Shell já instalado (ex.: o do Playwright da raiz) em vez
// de baixar outro. Ex.: REMOTION_BROWSER_EXECUTABLE=".../chrome-headless-shell.exe" npm run render
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
if (browserExecutable) Config.setBrowserExecutable(browserExecutable);
