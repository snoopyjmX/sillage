// Folhas de estilo importadas só pelo efeito (fontes do @fontsource)
declare module '*.css';

// remotion.config.ts roda no Node: só a leitura de variáveis de ambiente é usada
declare const process: { env: Record<string, string | undefined> };
