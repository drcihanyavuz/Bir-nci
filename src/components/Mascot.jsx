import { useEffect, useState } from 'react';

const WELCOME_TEXT =
  'Aramıza hoşgeldiniz. Seni gördüğüme çok sevindim. Ben İnci Boncuk. Bu yarışmanın sunucusuyum. Haydi yarışalım ve kazanalım.';

const GREETED_KEY = 'birinci_mascot_greeted';

export default function Mascot() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 400);

    // Sadece uygulama açılışında bir kez konuşsun — aynı oturumda
    // tekrar bu sayfaya gelince tekrar seslendirme yapmasın.
    const alreadyGreeted = sessionStorage.getItem(GREETED_KEY);

    if (!alreadyGreeted && 'speechSynthesis' in window) {
      sessionStorage.setItem(GREETED_KEY, '1');

      const speak = () => {
        window.speechSynthesis.cancel(); // olası çakışan/kuyruklu sesleri temizle

        const utterance = new SpeechSynthesisUtterance(WELCOME_TEXT);
        utterance.lang = 'tr-TR';
        utterance.pitch = 1.9; // daha ince, çocuksu bir ton
        utterance.rate = 0.85; // daha yavaş, nazik bir okuma
        utterance.volume = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const turkishVoice =
          voices.find((v) => v.lang.startsWith('tr') && /female|kadın|yelda|filiz/i.test(v.name)) ||
          voices.find((v) => v.lang.startsWith('tr'));
        if (turkishVoice) utterance.voice = turkishVoice;

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        speak();
      } else {
        window.speechSynthesis.onvoiceschanged = speak;
      }
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mascot-wrap">
      <img src="/mascot/inci-boncuk.jpeg" alt="İnci Boncuk" className="mascot-image" />
      <div className="mascot-shadow" />
      {showBubble && (
        <div className="mascot-bubble">
          Aramıza hoşgeldiniz! Ben İnci Boncuk, bu yarışmanın sunucusuyum. Haydi yarışalım ve
          kazanalım! ✨
        </div>
      )}
    </div>
  );
}
