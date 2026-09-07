import { useEffect, useState } from 'react';
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

export default function Survey() {
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
    <div className="page">
      <h1>Anket</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>Görüşünüzü paylaşın, sonuçları hemen görün.</p>

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
