import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const MESSAGES_PAGE_SIZE = 50;
// Konuşma listesini oluştururken en fazla bu kadar son mesaja bakılır
// (tüm tabloyu çekmek yerine) — en aktif konuşmalar zaten en üstte çıkar.
const THREAD_SCAN_LIMIT = 500;

export default function AdminChat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get('user'));
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const bottomRef = useRef(null);
  const firstLoadDone = useRef(false);

  const loadThreads = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('user_id, message, created_at, profiles!chat_messages_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(THREAD_SCAN_LIMIT);

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
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE)
      .then(({ data }) => {
        const ordered = (data ?? []).slice().reverse();
        setMessages(ordered);
        setHasOlder((data ?? []).length === MESSAGES_PAGE_SIZE);
        firstLoadDone.current = true;
      });

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
    if (firstLoadDone.current) {
      bottomRef.current?.scrollIntoView();
      firstLoadDone.current = false;
    }
  }, [messages]);

  const handleLoadOlder = async () => {
    if (messages.length === 0) return;
    setLoadingOlder(true);

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', selectedUserId)
      .lt('created_at', messages[0].created_at)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);

    const older = (data ?? []).slice().reverse();
    setMessages((prev) => [...older, ...prev]);
    setHasOlder((data ?? []).length === MESSAGES_PAGE_SIZE);
    setLoadingOlder(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUserId) return;

    await supabase.from('chat_messages').insert({
      user_id: selectedUserId,
      sender_id: user.id,
      message: text.trim(),
    });

    setText('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
                {hasOlder && (
                  <button className="btn btn-ghost" onClick={handleLoadOlder} disabled={loadingOlder} style={{ marginBottom: '0.75rem' }}>
                    {loadingOlder ? 'Yükleniyor...' : 'Daha eski mesajları göster'}
                  </button>
                )}
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
