// Entrega de uma imagem gerada no aparelho: painel de compartilhar do sistema, quando existe, ou
// download. Usado pelo card da retrospectiva (o diálogo do SOTD tem o mesmo fluxo, com prévia).

export const canShareFile = (file: File): boolean =>
  typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

// O aparelho consegue compartilhar uma imagem JPEG? Decide o rótulo do botão antes de gerar o card.
export const canShareImages = (): boolean =>
  canShareFile(new File([], 'sillage.jpg', { type: 'image/jpeg' }));

// Devolve false quando a pessoa só fechou o painel (não é erro)
export const shareFile = async (file: File, title: string): Promise<boolean> => {
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    throw error;
  }
};

export const downloadFile = (file: File): void => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
};
