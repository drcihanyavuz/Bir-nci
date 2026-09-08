import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <h1>İletişim mesajları</h1>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

      {!loading && messages.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Henüz gelen bir mesaj yok.
        </div>
      )}

      {messages.map((m) => (
        <div className="form-panel" key={m.id} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{m.sender_name}</strong>
            <span className="muted">{new Date(m.created_at).toLocaleString('tr-TR')}</span>
          </div>
          <p className="muted" style={{ marginTop: '0.25rem' }}>{m.sender_email}</p>
          <p style={{ marginTop: '0.5rem' }}>{m.message}</p>
        </div>
      ))}
    </div>
  );
}
