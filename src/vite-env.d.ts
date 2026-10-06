/// <reference types="vite/client" />

// Versão do app (package.json) + instante do build, injetada pelo Vite: é o `buster` do cache persistido
declare const __APP_VERSION__: string;

// Só a versão do package.json (exibida no Footer)
declare const __PKG_VERSION__: string;
