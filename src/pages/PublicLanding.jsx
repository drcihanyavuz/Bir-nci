import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Mascot from '../components/Mascot';
import AnnouncementsPanel from '../components/AnnouncementsPanel';
import InstallBanner from '../components/InstallBanner';

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!targetDate) return;

    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return remaining;
}

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function PublicLanding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [nextCompetition, setNextCompetition] = useState(null);
  const countdown = useCountdown(nextCompetition?.start_time);
  const [landingMedia, setLandingMedia] = useState(null);

  useEffect(() => {
    supabase
      .from('site_media')
      .select('media_url')
      .eq('placement', 'landing')
      .maybeSingle()
      .then(({ data }) => setLandingMedia(data?.media_url ?? null));
  }, []);

  useEffect(() => {
    if (loading || !user) return;

    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        navigate(data?.is_admin ? '/admin' : '/dashboard');
      });
  }, [loading, user, navigate]);

  useEffect(() => {
    supabase
      .from('competitions')
      .select('title, start_time')
      .eq('status', 'scheduled')
      .order('start_time')
      .limit(1)
      .then(({ data }) => setNextCompetition(data?.[0] ?? null));
  }, []);

  if (loading || user) return null;

  return (
    <div className="landing">
      <InstallBanner />
      <AnnouncementsPanel />
      <Mascot />
      <img src="/logo-full.png" alt="BirİNCİ Bilgi Yarışması" style={{ width: '180px', maxWidth: '70%' }} />

      {landingMedia && (
        isVideoUrl(landingMedia) ? (
          <video src={landingMedia} className="room-media" style={{ marginTop: '1rem', maxHeight: '260px' }} autoPlay muted loop playsInline />
        ) : (
          <img src={landingMedia} alt="" className="room-media" style={{ marginTop: '1rem', maxHeight: '260px' }} />
        )
      )}

      <div className="countdown-block">
        {nextCompetition ? (
          <>
            <p className="muted">{nextCompetition.title} başlıyor</p>
            <div className="stage-countdown">
              {countdown
                ? `${countdown.days}g ${countdown.hours}s ${countdown.minutes}d ${countdown.seconds}sn`
                : '...'}
            </div>
          </>
        ) : (
          <p className="muted">Şu an planlanmış bir yarışma yok.</p>
        )}
      </div>

      <div className="landing-buttons">
        <Link to="/login" className="landing-btn">
          🔑 Giriş yap
        </Link>
        <Link to="/signup" className="landing-btn">
          📝 Üye ol
        </Link>
        <Link to="/yarismayi-ogrenelim" className="landing-btn">
          📖 Yarışmayı Öğrenelim
        </Link>
        <Link to="/results" className="landing-btn">
          🏆 Geçmiş yarışmalar
        </Link>
        <Link to="/leaderboard" className="landing-btn">
          🏅 Liderlik Tablosu
        </Link>
        <Link to="/spectate" className="landing-btn">
          👀 Yarışmayı İzle
        </Link>
        <Link to="/contact" className="landing-btn">
          ✉️ İletişim
        </Link>
      </div>
    </div>
  );
}
