import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCompetition } from '../hooks/useCompetition';
import { useMyParticipant } from '../hooks/useMyParticipant';
import { useCurrentQuestion } from '../hooks/useCurrentQuestion';

export default function CompetitionRoom() {
  const { competitionId } = useParams();
  const { competition, loading: loadingCompetition } = useCompetition(competitionId);
  const { participant, loading: loadingParticipant } = useMyParticipant(competitionId);
  const question = useCurrentQuestion(competition?.current_question_id);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const advanceCalledForQuestion = useRef(null);
  const autoStartCalled = useRef(false);
  const revealCalled = useRef(false);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(null);

  // Yarışma henüz başlamadıysa, zamanı gelince otomatik başlat
  useEffect(() => {
    if (competition?.status !== 'scheduled') {
      autoStartCalled.current = false;
      return;
    }

    const tryStart = () => {
      if (new Date(competition.start_time).getTime() <= Date.now() && !autoStartCalled.current) {
        autoStartCalled.current = true;
        supabase.rpc('auto_start_competition', { p_competition_id: competitionId }).finally(() => {
          autoStartCalled.current = false;
        });
      }
    };

    tryStart();
    const interval = setInterval(tryStart, 2000);
    return () => clearInterval(interval);
  }, [competition, competitionId]);

  // Yarışma aktif ama ilk soru henüz açılmadıysa: 100 saniyelik hazırlık geri sayımı
  useEffect(() => {
    if (competition?.status !== 'active' || competition?.current_question_id || !competition?.first_question_reveal_at) {
      setLobbySecondsLeft(null);
      return;
    }

    const revealAt = new Date(competition.first_question_reveal_at).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((revealAt - Date.now()) / 1000));
      setLobbySecondsLeft(remaining);

      if (remaining === 0 && !revealCalled.current) {
        revealCalled.current = true;
        supabase.rpc('reveal_first_question', { p_competition_id: competitionId }).finally(() => {
          revealCalled.current = false;
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [competition, competitionId]);

  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    setAnswerError('');
  }, [question?.id]);

  useEffect(() => {
    if (!question?.question_ends_at) {
      setSecondsLeft(null);
      return;
    }

    const endsAt = new Date(question.question_ends_at).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0 && advanceCalledForQuestion.current !== question.id) {
        advanceCalledForQuestion.current = question.id;
        supabase.rpc('advance_competition', { p_competition_id: competitionId });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [question, competitionId]);

  const handleAnswer = async (option) => {
    if (hasAnswered || secondsLeft === 0) return;
    setSelectedOption(option);
    setHasAnswered(true);
    setAnswerError('');

    const { error } = await supabase.rpc('submit_answer', {
      p_question_id: question.id,
      p_selected_option: option,
    });

    if (error) {
      setAnswerError(error.message);
      setHasAnswered(false);
      setSelectedOption(null);
    }
  };

  if (loadingCompetition || loadingParticipant) {
    return (
      <div className="stage">
        <p className="muted">Yükleniyor...</p>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="stage">
        <h2>Bu yarışmaya katılmadınız</h2>
      </div>
    );
  }

  if (participant.is_eliminated) {
    return (
      <div className="stage">
        <div className="stage-countdown is-urgent" style={{ fontSize: '2.5rem' }}>
          Elendiniz
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Bir sonraki yarışmada tekrar deneyebilirsiniz.
        </p>
      </div>
    );
  }

  if (competition.status === 'scheduled') {
    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Yarışma henüz başlamadı. Başlangıç:{' '}
          {new Date(competition.start_time).toLocaleString('tr-TR')}
        </p>
      </div>
    );
  }

  if (competition.status === 'awaiting_tiebreak') {
    return (
      <div className="stage">
        <h1>Ek soru bekleniyor</h1>
        <p className="muted" style={{ marginTop: '1rem', maxWidth: '28rem' }}>
          Son soruda birden fazla kişi hayatta kaldı. Yeni bir eleme sorusu geliyor, lütfen
          bekleyin.
        </p>
      </div>
    );
  }

  if (competition.status === 'finished') {
    return (
      <div className="stage">
        <div className="gold-text font-display" style={{ fontSize: '3rem' }}>
          Yarışma bitti
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Tebrikler, hayatta kaldınız! Sonuçlar yakında ekrana yansıyacak.
        </p>
      </div>
    );
  }

  if (competition.status === 'active' && !question && lobbySecondsLeft !== null) {
    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '0.5rem' }}>İlk soru birazdan geliyor, hazır olun!</p>
        <div className="stage-countdown" style={{ marginTop: '1.5rem' }}>{lobbySecondsLeft}</div>
      </div>
    );
  }

  if (competition.status === 'active' && question) {
    return (
      <div className="stage">
        <p className="muted">
          {competition.title} · Soru {question.order_index}
        </p>

        <div className={`stage-countdown ${secondsLeft <= 3 ? 'is-urgent' : ''}`}>
          {secondsLeft ?? '...'}
        </div>

        <h1 className="stage-question">{question.text}</h1>

        <div className="option-grid">
          {['a', 'b', 'c', 'd'].map((opt) => (
            <button
              key={opt}
              className={`option-btn ${selectedOption === opt ? 'is-selected' : ''}`}
              onClick={() => handleAnswer(opt)}
              disabled={hasAnswered || secondsLeft === 0}
            >
              <span className="option-letter">{opt.toUpperCase()}</span>
              {question[`option_${opt}`]}
            </button>
          ))}
        </div>

        {hasAnswered && !answerError && (
          <p className="status-banner is-success">Cevabınız alındı, sonraki soru bekleniyor...</p>
        )}
        {answerError && <p className="status-banner is-error">{answerError}</p>}
      </div>
    );
  }

  return (
    <div className="stage">
      <p className="muted">Yükleniyor...</p>
    </div>
  );
}
