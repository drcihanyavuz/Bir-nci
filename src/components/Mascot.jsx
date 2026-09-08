import { useEffect, useState } from 'react';

const GREETED_KEY = 'birinci_mascot_greeted';

export default function Mascot() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 400);

    // Sadece uygulama açılışında bir kez seslendirme yapsın — aynı
    // oturumda tekrar bu sayfaya gelince tekrar çalmasın.
    const alreadyGreeted = sessionStorage.getItem(GREETED_KEY);

    if (!alreadyGreeted) {
      sessionStorage.setItem(GREETED_KEY, '1');
      const audio = new Audio('/mascot/greeting.m4a');
      audio.play().catch(() => {
        // Tarayıcı otomatik ses oynatmayı engellemiş olabilir
        // (kullanıcı etkileşimi olmadan) — sessizce geç, görsel
        // karşılama zaten gösteriliyor.
      });
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mascot-wrap">
      <img src="/mascot/inci-boncuk-nobg.png" alt="İnci Boncuk" className="mascot-image" />
      <div className="mascot-shadow" />
      {showBubble && (
        <div className="mascot-bubble">
          Merhaba hoşgeldiniz! Ben İnci Boncuk, bu yarışmada sana destek olacağım. Hazırsan
          haydi yarışalım ve kazanalım! ✨
        </div>
      )}
    </div>
  );
}
