import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function SurveyCard({ question, userAnswer, onAnswered }) {
  const { user } = useAuth();
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showResults = !!userAnswer;

  useEffect(() => {
    if (!showResults) return;
    supabase
      .from('survey_results')
      .select('*')
      .eq('question_id', question.id)
      .then(({ data }) => setResults(data ?? []));
  }, [showResults, question.id]);

  const totalVotes = results?.reduce((sum, r) => sum + r.vote_count, 0) ?? 0;
  const votesFor = (opt) => results?.find((r) => r.selected_option === opt)?.vote_count ?? 0;
  const percentFor = (opt) => (totalVotes === 0 ? 0 : Math.round((votesFor(opt) / totalVotes) * 100));

  const handleVote = async (opt) => {
    setSubmitting(true);
    const { error } = await supabase
      .from('survey_answers')
      .insert({ question_id: question.id, user_id: user.id, selected_option: opt });
    setSubmitting(false);
    if (!error) onAnswered(question.id, opt);
  };

  return (
    <div className="form-panel" style={{ marginTop: '1.5rem' }}>
      <h2>{question.text}</h2>
      <div className="stack" style={{ marginTop: '1rem' }}>
        {['a', 'b', 'c', 'd'].map((opt) => (
          <button
            key={opt}
            className={`option-btn ${userAnswer === opt ? 'is-selected' : ''}`}
            onClick={() => handleVote(opt)}
            disabled={showResults || submitting}
            style={{ textAlign: 'left', position: 'relative' }}
          >
            <span className="option-letter">{opt.toUpperCase()}</span>
            {question[`option_${opt}`]}
            {showResults && (
              <span className="gold-text" style={{ float: 'right' }}>
                %{percentFor(opt)}
              </span>
            )}
          </button>
        ))}
      </div>
      {showResults && <p className="muted" style={{ marginTop: '0.75rem' }}>{totalVotes} kişi oy verdi</p>}
    </div>
  );
}

function SurveyTab() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [myAnswers, setMyAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: qs } = await supabase
        .from('survey_questions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: answers } = await supabase
        .from('survey_answers')
        .select('question_id, selected_option')
        .eq('user_id', user.id);

      setQuestions(qs ?? []);
      setMyAnswers(Object.fromEntries((answers ?? []).map((a) => [a.question_id, a.selected_option])));
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAnswered = (questionId, option) => {
    setMyAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  return (
    <div>
      <p className="muted" style={{ marginTop: '1rem' }}>Görüşünüzü paylaşın, sonuçları hemen görün.</p>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

      {!loading && questions.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Şu an aktif bir anket yok.
        </div>
      )}

      {questions.map((q) => (
        <SurveyCard
          key={q.id}
          question={q}
          userAnswer={myAnswers[q.id]}
          onAnswered={handleAnswered}
        />
      ))}
    </div>
  );
}

function ChatTab() {
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
    <div>
      <p className="muted" style={{ marginTop: '1rem' }}>Sorularınızı doğrudan bize yazabilirsiniz.</p>

      <div className="chat-window" style={{ marginTop: '1rem' }}>
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

export default function Chat() {
  const [tab, setTab] = useState('chat');

  return (
    <div className="page">
      <h1>💬 Sohbet & Anket</h1>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button
          className={tab === 'chat' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setTab('chat')}
        >
          💬 SOHBET
        </button>
        <button
          className={tab === 'survey' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setTab('survey')}
        >
          📊 ANKET
        </button>
      </div>

      {tab === 'chat' ? <ChatTab /> : <SurveyTab />}
    </div>
  );
}
