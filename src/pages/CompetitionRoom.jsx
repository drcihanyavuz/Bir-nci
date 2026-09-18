import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCompetition } from '../hooks/useCompetition';
import { useMyParticipant } from '../hooks/useMyParticipant';
import { useCurrentQuestion } from '../hooks/useCurrentQuestion';
import { playGongSound } from '../lib/sound';
import { burstConfetti } from '../lib/confetti';
import DaisyCountdown from '../components/DaisyCountdown';

const REVEAL_DURATION_SECONDS = 20;

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function CompetitionRoom() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
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

  const advanceInFlight = useRef(false);
  const autoStartCalled = useRef(false);
  const revealCalled = useRef(false);
  const revealFetchedForQuestion = useRef(null);
  const gongPlayedForQuestion = useRef(null);
  const confettiPlayedForQuestion = useRef(null);
  const correctRowRef = useRef(null);
  const [results, setResults] = useState(null);
  const finishedConfettiPlayed = useRef(false);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(null);

  // Aktif katılımcı sayısını her yeni soruda tazele
  useEffect(() => {
    if (!competitionId) return;
    supabase
      .rpc('get_active_participant_count', { p_competition_id: competitionId })
      .then(({ data }) => setActiveCount(data));
  }, [competitionId, question?.id]);

  // Yarışma henüz başlamadıysa (scheduled), kota durumunu göstermek
  // için katılımcı sayısını birkaç saniyede bir tazele.
  useEffect(() => {
    if (competition?.status !== 'scheduled' || !competitionId) return;
    const refresh = () => {
      supabase
        .rpc('get_active_participant_count', { p_competition_id: competitionId })
        .then(({ data }) => setActiveCount(data));
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [competition?.status, competitionId]);

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
        // Süre dolar dolmaz gong sesi (bir kez)
        if (gongPlayedForQuestion.current !== question.id) {
          gongPlayedForQuestion.current = question.id;
          playGongSound();
        }

        // Sonuçları çek — saat kayması yüzünden ilk deneme başarısız
        // olursa (sunucu "süre henüz dolmadı" derse), bir sonraki
        // saniyede tekrar dene. Sadece BAŞARILI olunca tekrar denemeyi durdur.
        if (revealFetchedForQuestion.current !== question.id) {
          supabase.rpc('get_question_reveal', { p_question_id: question.id }).then(({ data, error }) => {
            if (data && !error) {
              revealFetchedForQuestion.current = question.id;
              setRevealData(data);
            }
          });
        }

        // Süre dolduktan REVEAL_DURATION_SECONDS sonra sıradaki soruya geç
        const secondsSinceEnd = Math.round((Date.now() - endsAt) / 1000);
        const remainingReveal = Math.max(0, REVEAL_DURATION_SECONDS - secondsSinceEnd);
        setRevealCountdown(remainingReveal);

        // Süre dolduktan REVEAL_DURATION_SECONDS sonra sıradaki soruya geç.
        // Saat kayması yüzünden çağrı "henüz sırası değil" deyip hiçbir şey
        // yapmadan dönebilir — bu yüzden soru gerçekten değişene kadar
        // (advanceInFlight bayrağı serbest kalınca) her saniye tekrar deniyoruz.
        if (remainingReveal === 0 && !advanceInFlight.current) {
          advanceInFlight.current = true;
          supabase.rpc('advance_competition', { p_competition_id: competitionId }).finally(() => {
            advanceInFlight.current = false;
          });
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [question, competitionId]);

  // Sonuçlar açıklanınca, doğru şıkkın üzerinde konfeti patlat
  useEffect(() => {
    if (revealData && confettiPlayedForQuestion.current !== question?.id) {
      confettiPlayedForQuestion.current = question?.id;
      requestAnimationFrame(() => {
        const rect = correctRowRef.current?.getBoundingClientRect();
        if (rect) {
          burstConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        } else {
          burstConfetti();
        }
      });
    }
  }, [revealData, question?.id]);

  // Yarışma bitince ilk 3'ü çek ve konfeti patlat
  useEffect(() => {
    if (competition?.status !== 'finished') return;

    supabase
      .from('public_results')
      .select('*')
      .eq('competition_id', competitionId)
      .order('rank')
      .then(({ data }) => {
        setResults(data ?? []);
        if (!finishedConfettiPlayed.current) {
          finishedConfettiPlayed.current = true;
          burstConfetti();
          setTimeout(() => burstConfetti({ x: window.innerWidth * 0.25, y: window.innerHeight * 0.35 }), 300);
          setTimeout(() => burstConfetti({ x: window.innerWidth * 0.75, y: window.innerHeight * 0.35 }), 600);
        }
      });
  }, [competition?.status, competitionId]);

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
        <p className="muted" style={{ marginTop: '1rem' }}>
          Yarışmayı izlemeye devam edebilir ya da çıkabilirsiniz.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            YARIŞMADAN AYRIL
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/spectate/${competitionId}`)}>
            İZLEMEYE DEVAM ET
          </button>
        </div>
      </div>
    );
  }

  if (competition.status === 'scheduled') {
    const startTimePassed = new Date(competition.start_time).getTime() <= Date.now();
    const quorumNeeded = Math.ceil(competition.max_participants * 0.5);
    const quorumMet = (activeCount ?? 0) >= quorumNeeded;

    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        {startTimePassed && !quorumMet ? (
          <>
            <p className="status-banner is-error" style={{ marginTop: '1rem', fontWeight: 700 }}>
              YARIŞMANIN BAŞLAMASI İÇİN %50 ÇOĞUNLUK BEKLENMEKTEDİR.
            </p>
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              {activeCount ?? '...'} / {quorumNeeded} kişi (gerekli asgari katılım)
            </p>
          </>
        ) : (
          <p className="muted" style={{ marginTop: '1rem' }}>
            Yarışma henüz başlamadı. Başlangıç: {new Date(competition.start_time).toLocaleString('tr-TR')}
          </p>
        )}
      </div>
    );
  }

  if (competition.status === 'cancelled') {
    return (
      <div className="stage">
        <h1>Bu yarışma iptal edildi</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Ödediğiniz inci, hesabınıza otomatik olarak iade edildi.
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
        <div className="gold-text font-display" style={{ fontSize: '2.5rem' }}>🎉 Yarışma bitti! 🎉</div>

        {!results && <p className="muted" style={{ marginTop: '1rem' }}>Sonuçlar hesaplanıyor...</p>}

        {results && results.length === 0 && (
          <p className="muted" style={{ marginTop: '1rem' }}>Bu yarışmada bir kazanan belirlenemedi.</p>
        )}

        {results && results.length > 0 && (
          <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '28rem' }}>
            {results.map((r) => {
              const medal = r.rank === 1 ? '👑' : r.rank === 2 ? '🥈' : '🥉';
              return (
                <div className="results-row" key={r.rank}>
                  <span className="rank-badge">{medal} {r.rank}.</span>
                  <span style={{ flex: 1 }}>{r.full_name}</span>
                  {r.prize && <span className="gold-text">{r.prize}</span>}
                </div>
              );
            })}
          </div>
        )}
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
          <div className="room-topbar-item room-topbar-item-big">
            <span className="label">Soru</span>
            <span className="value">{question.order_index}</span>
          </div>
          <div className="room-topbar-item">
            <span className="label">Yarışan</span>
            <span className="value">{activeCount ?? '...'}</span>
          </div>
        </div>

        <DaisyCountdown
          total={isRevealing ? REVEAL_DURATION_SECONDS : (question.time_limit_seconds || 15)}
          remaining={isRevealing ? revealCountdown : (secondsLeft ?? 0)}
        />
        {isRevealing && (
          <p style={{ textAlign: 'center', marginTop: '-0.75rem', fontWeight: 700, letterSpacing: '0.03em' }}>
            SIRADAKİ SORU GELİYOR
          </p>
        )}

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
                <div
                  key={opt}
                  ref={isCorrect ? correctRowRef : null}
                  className={`reveal-row ${isCorrect ? 'is-correct' : ''}`}
                >
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
