import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function AdminChat() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const loadThreads = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('user_id, message, created_at, profiles!chat_messages_user_id_fkey(full_name)')
      .order('created_at', { ascending: false });

    const seen = new Set();
    const list = [];
    for (const row of data ?? []) {
      if (!seen.has(row.user_id)) {
        seen.add(row.user_id);
        list.push({ userId: row.user_id, name: row.profiles?.full_name ?? 'Bilinmeyen üye', lastMessage: row.message });
      }
    }
    setThreads(list);
  };

  useEffect(() => {
    loadThreads();

    const channel = supabase
      .channel('admin-chat-threads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        loadThreads();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;

    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('created_at')
      .then(({ data }) => setMessages(data ?? []));

    const channel = supabase
      .channel(`admin-chat-${selectedUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${selectedUserId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUserId) return;

    await supabase.from('chat_messages').insert({
      user_id: selectedUserId,
      sender_id: user.id,
      message: text.trim(),
    });

    setText('');
  };

  return (
    <div className="page-wide">
      <h1>Üye mesajları</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="chat-thread-list">
          {threads.length === 0 && <p className="muted">Henüz mesaj yok.</p>}
          {threads.map((t) => (
            <button
              key={t.userId}
              className={`chat-thread-item ${selectedUserId === t.userId ? 'is-active' : ''}`}
              onClick={() => setSelectedUserId(t.userId)}
            >
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>{t.lastMessage}</div>
            </button>
          ))}
        </div>

        <div>
          {!selectedUserId && <p className="muted">Cevaplamak için sol taraftan bir üye seçin.</p>}

          {selectedUserId && (
            <>
              <div className="chat-window">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble ${m.sender_id === user.id ? 'is-mine' : 'is-theirs'}`}
                  >
                    {m.message}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form className="chat-input-row" onSubmit={handleSend}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cevabınızı yazın..."
                />
                <button className="btn btn-primary" type="submit">
                  Gönder
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
