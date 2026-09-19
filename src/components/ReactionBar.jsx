import { useState } from 'react';

const EMOJIS = ['👍', '🔥', '😮'];

// Not: Bu tepkiler sadece kendi ekranınızda anlık bir görsel efekt —
// diğer katılımcı/izleyicilere yayınlanmıyor (bunun için ayrı bir
// canlı yayın altyapısı gerekir). Şimdilik herkesin kendi ekranında
// eğlenceli bir dokunuş.
export default function ReactionBar() {
  const [floaters, setFloaters] = useState([]);

  const handleReact = (emoji, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFloaters((prev) => [...prev, { id, emoji, x: rect.left + rect.width / 2 }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 1700);
  };

  return (
    <>
      <div className="reaction-bar">
        {EMOJIS.map((emoji) => (
          <button key={emoji} className="reaction-btn" onClick={(e) => handleReact(emoji, e)}>
            {emoji}
          </button>
        ))}
      </div>
      {floaters.map((f) => (
        <div key={f.id} className="floating-reaction" style={{ left: f.x, bottom: '5rem' }}>
          {f.emoji}
        </div>
      ))}
    </>
  );
}
