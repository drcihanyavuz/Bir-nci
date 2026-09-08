import { useEffect } from 'react';

const GREETED_KEY = 'birinci_mascot_greeted';

export default function Mascot() {
  useEffect(() => {
    const alreadyGreeted = sessionStorage.getItem(GREETED_KEY);

    if (!alreadyGreeted) {
      sessionStorage.setItem(GREETED_KEY, '1');
      const audio = new Audio('/mascot/greeting.m4a');
      audio.play().catch(() => {
        // Tarayıcı otomatik ses oynatmayı engellemiş olabilir — sessizce geç.
      });
    }
  }, []);

  return (
    <div className="mascot-wrap">
      <img src="/mascot/inci-boncuk-nobg.png" alt="İnci Boncuk" className="mascot-image" />
      <div className="mascot-shadow" />
    </div>
  );
}
