import { useEffect, useState } from 'react';

const WELCOME_TEXT =
  'Aramıza hoşgeldiniz. Seni gördüğüme çok sevindim. Ben İnci Boncuk. Bu yarışmanın sunucusuyum. Haydi yarışalım ve kazanalım.';

export default function Mascot() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 400);

    // Tarayıcı sesli okuma (Web Speech API) ile karşılama mesajını oku
    if ('speechSynthesis' in window) {
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(WELCOME_TEXT);
        utterance.lang = 'tr-TR';
        utterance.pitch = 1.3;
        utterance.rate = 1;

        const voices = window.speechSynthesis.getVoices();
        const turkishFemale =
          voices.find((v) => v.lang.startsWith('tr') && /female|kadın/i.test(v.name)) ||
          voices.find((v) => v.lang.startsWith('tr'));
        if (turkishFemale) utterance.voice = turkishFemale;

        window.speechSynthesis.speak(utterance);
      };

      // Bazı tarayıcılarda ses listesi asenkron yükleniyor
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
      {showBubble && (
        <div className="mascot-bubble">
          Aramıza hoşgeldiniz! Ben İnci Boncuk, bu yarışmanın sunucusuyum. Haydi yarışalım ve
          kazanalım! ✨
        </div>
      )}
    </div>
  );
}
