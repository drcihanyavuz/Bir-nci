import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCompetition } from '../hooks/useCompetition';
import { useMyParticipant } from '../hooks/useMyParticipant';
import { useCurrentQuestion } from '../hooks/useCurrentQuestion';
import { playApplauseSound } from '../lib/sound';

const REVEAL_DURATION_SECONDS = 5;

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function CompetitionRoom() {
  const { competitionId } = useParams();
  const { competition, loading: loadingCompetition } = useCompetition(competitionId);
  const { participant, loading: loadingParticipant } = useMyParticipant(competitionId);
  const question = useCurrentQuestion(competition?.current_question_id);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [activeCount, setActiveCount] = useState(null);
  const [revealData, setRevealData] = useState(null); // [{option_letter, vote_count, correct_option}]
  const [revealCountdown, setRevealCountdown] = useState(null);

  const advanceCalledForQuestion = useRef(null);
  const autoStartCalled = useRef(false);
  const revealCalled = useRef(false);
  const revealFetchedForQuestion = useRef(null);
  const soundPlayedForQuestion = useRef(null);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(null);

  // Aktif katılımcı sayısını her yeni soruda tazele
  useEffect(() => {
    if (!competitionId) return;
    supabase
      .rpc('get_active_participant_count', { p_competition_id: competitionId })
      .then(({ data }) => setActiveCount(data));
  }, [competitionId, question?.id]);

  // Hazırlık (lobby) ekranındayken katılımcı sayısını birkaç saniyede
  // bir tazele — insanlar bu sırada da katılabiliyor.
  useEffect(() => {
    if (lobbySecondsLeft === null) return;
    const refresh = () => {
      supabase
        .rpc('get_active_participant_count', { p_competition_id: competitionId })
        .then(({ data }) => setActiveCount(data));
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [lobbySecondsLeft !== null, competitionId]);

  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    setAnswerError('');
    setRevealData(null);
    setRevealCountdown(null);
  }, [question?.id]);

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

  // İlk soru için 100 saniyelik hazırlık geri sayımı
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

  // Soru geri sayımı + süre dolunca sonuçları açıklama + gecikmeli advance
  useEffect(() => {
    if (!question?.question_ends_at) {
      setSecondsLeft(null);
      return;
    }

    const endsAt = new Date(question.question_ends_at).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        // Sonuçları bir kez çek
        if (revealFetchedForQuestion.current !== question.id) {
          revealFetchedForQuestion.current = question.id;
          supabase.rpc('get_question_reveal', { p_question_id: question.id }).then(({ data }) => {
            if (data) setRevealData(data);
          });
        }

        // Süre dolduktan REVEAL_DURATION_SECONDS sonra sıradaki soruya geç
        const secondsSinceEnd = Math.round((Date.now() - endsAt) / 1000);
        const remainingReveal = Math.max(0, REVEAL_DURATION_SECONDS - secondsSinceEnd);
        setRevealCountdown(remainingReveal);

        if (remainingReveal === 0 && advanceCalledForQuestion.current !== question.id) {
          advanceCalledForQuestion.current = question.id;
          supabase.rpc('advance_competition', { p_competition_id: competitionId });
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [question, competitionId]);

  // Sonuçlar açıklanınca bir kez alkış sesi çal
  useEffect(() => {
    if (revealData && soundPlayedForQuestion.current !== question?.id) {
      soundPlayedForQuestion.current = question?.id;
      playApplauseSound();
    }
  }, [revealData, question?.id]);

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
    return <div className="stage"><p className="muted">Yükleniyor...</p></div>;
  }

  if (!participant) {
    return <div className="stage"><h2>Bu yarışmaya katılmadınız</h2></div>;
  }

  if (participant.is_eliminated) {
    return (
      <div className="stage">
        <div className="stage-countdown is-urgent" style={{ fontSize: '2.5rem' }}>Elendiniz</div>
        <p className="muted" style={{ marginTop: '1rem' }}>Bir sonraki yarışmada tekrar deneyebilirsiniz.</p>
      </div>
    );
  }

  if (competition.status === 'scheduled') {
    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Yarışma henüz başlamadı. Başlangıç: {new Date(competition.start_time).toLocaleString('tr-TR')}
        </p>
      </div>
    );
  }

  if (competition.status === 'awaiting_tiebreak') {
    return (
      <div className="stage">
        <h1>Ek soru bekleniyor</h1>
        <p className="muted" style={{ marginTop: '1rem', maxWidth: '28rem' }}>
          Son soruda birden fazla kişi hayatta kaldı. Yeni bir eleme sorusu geliyor, lütfen bekleyin.
        </p>
      </div>
    );
  }

  if (competition.status === 'finished') {
    return (
      <div className="stage">
        <div className="gold-text font-display" style={{ fontSize: '3rem' }}>Yarışma bitti</div>
        <p className="muted" style={{ marginTop: '1rem' }}>Tebrikler, hayatta kaldınız! Sonuçlar yakında ekrana yansıyacak.</p>
      </div>
    );
  }

  if (competition.status === 'active' && !question && lobbySecondsLeft !== null) {
    return (
      <div className="stage">
        <div className="room-topbar" style={{ justifyContent: 'center' }}>
          <div className="room-topbar-item">
            <span className="label">Bağlanan</span>
            <span className="value">{activeCount ?? '...'}</span>
          </div>
        </div>

        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '0.5rem' }}>İlk soru birazdan geliyor, hazır olun!</p>

        {competition.lobby_video_url && (
          <video
            src={competition.lobby_video_url}
            className="room-media"
            style={{ marginTop: '1rem' }}
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="stage-countdown" style={{ marginTop: '1.5rem' }}>{lobbySecondsLeft}</div>
      </div>
    );
  }

  if (competition.status === 'active' && question) {
    const isRevealing = !!revealData;
    const voteFor = (opt) => revealData?.find((r) => r.option_letter === opt)?.vote_count ?? 0;
    const totalVotes = revealData?.reduce((s, r) => s + Number(r.vote_count), 0) ?? 0;
    const correctOption = revealData?.[0]?.correct_option;

    return (
      <div className="stage">
        <div className="room-topbar">
          <div className="room-topbar-item">
            <span className="label">Soru</span>
            <span className="value">{question.order_index}</span>
          </div>
          <div className="room-topbar-item">
            <span className="label">Yarışan</span>
            <span className="value">{activeCount ?? '...'}</span>
          </div>
          <div className={`room-topbar-item countdown ${secondsLeft <= 3 && !isRevealing ? 'is-urgent' : ''}`}>
            <span className="label">{isRevealing ? 'Sonraki soru' : 'Süre'}</span>
            <span className="value">{isRevealing ? revealCountdown : (secondsLeft ?? '...')}</span>
          </div>
        </div>

        {question.image_url && (
          isVideoUrl(question.image_url) ? (
            <video src={question.image_url} className="room-media" autoPlay muted loop playsInline />
          ) : (
            <img src={question.image_url} alt="Soru görseli" className="room-media" />
          )
        )}

        <h1 className="stage-question">{question.text}</h1>

        {!isRevealing && (
          <div className="room-options">
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
        )}

        {isRevealing && (
          <div className="room-options">
            {['a', 'b', 'c', 'd'].map((opt) => {
              const votes = voteFor(opt);
              const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
              const isCorrect = correctOption === opt;
              return (
                <div key={opt} className={`reveal-row ${isCorrect ? 'is-correct' : ''}`}>
                  <div className="reveal-fill" style={{ width: `${pct}%` }} />
                  <div className="reveal-content">
                    <span>
                      <span className="option-letter">{opt.toUpperCase()}</span>
                      {question[`option_${opt}`]}
                    </span>
                    <span className="muted">{votes} kişi ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasAnswered && !answerError && !isRevealing && (
          <p className="status-banner is-success">Cevabınız alındı, süre doluyor...</p>
        )}
        {answerError && <p className="status-banner is-error">{answerError}</p>}
      </div>
    );
  }

  return <div className="stage"><p className="muted">Yükleniyor...</p></div>;
}
