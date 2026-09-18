import { useEffect, useState } from 'react';

// Tarayıcının "Ana ekrana ekle / Yükle" isteğini yakalayıp, istediğimiz
// an (kendi butonumuzla) tetikleyebilmemizi sağlar.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Uygulama zaten "ana ekrana eklenmiş" (standalone) modda mı çalışıyor?
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setInstalled(isStandalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  // WhatsApp / Instagram / Messenger gibi uygulama-içi tarayıcıları
  // tespit eder — bu tarayıcılar "Yükle" isteğini hiç tetiklemez.
  const isInAppBrowser = /(WhatsApp|Instagram|FBAN|FBAV|Messenger)/i.test(navigator.userAgent);

  return { canInstall: !!deferredPrompt, promptInstall, installed, isInAppBrowser };
}
