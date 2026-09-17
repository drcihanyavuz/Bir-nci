import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AnnouncementsPanel() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('order_index')
      .then(({ data }) => setItems(data ?? []));
  }, []);

  // Birkaç saniyede bir otomatik sıradakine geç
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index];
  const goPrev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div className="announcements-wrap">
      <div className="announcement-note-single">
        <div className="announcement-pin">📌</div>
        {current.title && <div className="announcement-title">{current.title}</div>}
        <div className="announcement-content">{current.content}</div>
      </div>

      {items.length > 1 && (
        <div className="announcement-nav">
          <button className="btn btn-ghost" onClick={goPrev} aria-label="Önceki">‹</button>
          <span className="muted">{index + 1} / {items.length}</span>
          <button className="btn btn-ghost" onClick={goNext} aria-label="Sonraki">›</button>
        </div>
      )}
    </div>
  );
}
