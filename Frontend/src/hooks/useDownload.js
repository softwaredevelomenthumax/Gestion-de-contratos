import { useState } from 'react';

const useDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('Descargando archivo...');

  const startDownload = (message = 'Descargando archivo...') => {
    setDownloadMessage(message);
    setIsDownloading(true);
  };

  const endDownload = () => {
    setIsDownloading(false);
    setDownloadMessage('Descargando archivo...');
  };

  const downloadWithAnimation = async (downloadFunction, message) => {
    try {
      startDownload(message);
      await downloadFunction();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    } finally {
      // Pequeño delay para que se vea la animación completa
      setTimeout(() => {
        endDownload();
      }, 500);
    }
  };

  return {
    isDownloading,
    downloadMessage,
    startDownload,
    endDownload,
    downloadWithAnimation
  };
};

export default useDownload;
