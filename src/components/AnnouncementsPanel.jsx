import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AnnouncementsPanel() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('order_index')
      .then(({ data }) => setItems(data ?? []));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="announcements-strip">
      {items.map((item, i) => (
        <div key={item.id} className="announcement-note" style={{ transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)` }}>
          <div className="announcement-pin">📌</div>
          {item.title && <div className="announcement-title">{item.title}</div>}
          <div className="announcement-content">{item.content}</div>
        </div>
      ))}
    </div>
  );
}
