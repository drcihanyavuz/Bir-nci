import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .then(({ data }) => setMessages(data ?? []));

    const channel = supabase
      .channel(`chat-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      sender_id: user.id,
      message: text.trim(),
    });

    setText('');
    setSending(false);
  };

  return (
    <div className="page">
      <h1>Sohbet</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>Sorularınızı doğrudan bize yazabilirsiniz.</p>

      <div className="chat-window" style={{ marginTop: '1.5rem' }}>
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
          placeholder="Mesajınızı yazın..."
        />
        <button className="btn btn-primary" type="submit" disabled={sending}>
          Gönder
        </button>
      </form>
    </div>
  );
}
