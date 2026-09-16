import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Mascot from '../components/Mascot';

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!targetDate) {
      setRemaining(null);
      return undefined;
    }

    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return remaining;
}

const steps = [
  { number: '01', title: 'Ücretsiz üye ol', text: 'Kısa bir kayıtla BirİNCİ topluluğuna katıl.' },
  { number: '02', title: 'Canlı yarışmaya katıl', text: 'Yarışma başladığında yerini al ve heyecana ortak ol.' },
  { number: '03', title: 'Bilgini göster', text: 'Soruları hızlı ve doğru cevapla, puanını yükselt.' },
];

const features = [
  { title: 'Canlı rekabet', text: 'Her soru, zirveye bir adım daha yaklaşman için yeni bir fırsat.' },
  { title: 'Adil puanlama', text: 'Doğru cevapların ve hızınla sıralamadaki yerini belirle.' },
  { title: 'Topluluk ruhu', text: 'Yarışmayı izle, sonuçları keşfet ve diğer bilgi tutkunlarıyla buluş.' },
];

export default function PublicLanding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [nextCompetition, setNextCompetition] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const countdown = useCountdown(nextCompetition?.start_time);

  useEffect(() => {
    if (loading || !user) return;
    supabase.from('profiles').select('is_admin').eq('id', user.id).single().then(({ data }) => {
      navigate(data?.is_admin ? '/admin' : '/dashboard');
    });
  }, [loading, user, navigate]);

  useEffect(() => {
    supabase.from('competitions').select('title, start_time').eq('status', 'scheduled').order('start_time').limit(1)
      .then(({ data }) => setNextCompetition(data?.[0] ?? null));
    supabase.from('public_leaderboard').select('user_id, full_name, points').order('points', { ascending: false }).limit(3)
      .then(({ data }) => setLeaders((data ?? []).filter((leader) => leader.full_name)));
  }, []);

  if (loading || user) return null;

  return (
    <main className="landing-page">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <nav className="landing-nav" aria-label="Ana menü">
        <Link to="/" className="landing-brand">
          <img src="/icons/icon-192.png" alt="" />
          <span>Bir<span>İNCİ</span></span>
        </Link>
        <div className="landing-nav-links">
          <Link to="/yarismayi-ogrenelim">Nasıl oynanır?</Link>
          <Link to="/results">Sonuçlar</Link>
          <Link to="/leaderboard">Liderlik tablosu</Link>
          <Link to="/contact">İletişim</Link>
        </div>
        <div className="landing-auth-links">
          <Link to="/login" className="landing-login">Giriş yap</Link>
          <Link to="/signup" className="landing-nav-cta">Üye ol</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Canlı bilgi yarışması</p>
          <h1>Bilgini göster,<br /><em>zirveye çık.</em></h1>
          <p className="hero-description">BirİNCİ, bilgini ve hızını test edebileceğin canlı yarışma deneyimi. Soruları cevapla, puanını topla ve liderlik tablosunda yerini al.</p>
          <div className="hero-actions">
            <Link to="/signup" className="landing-primary-btn">Hemen üye ol <span aria-hidden="true">→</span></Link>
            <Link to="/yarismayi-ogrenelim" className="landing-secondary-btn">Nasıl oynanır?</Link>
          </div>
          <div className="hero-proof"><span className="proof-line" /> <span>Bilgi. Hız. Heyecan.</span></div>
        </div>
        <div className="hero-art" aria-label="BirİNCİ maskotu">
          <div className="hero-glow" />
          <div className="hero-ring hero-ring-one" />
          <div className="hero-ring hero-ring-two" />
          <div className="hero-badge">BİLGİ<br /><strong>+</strong><br />HEYECAN</div>
          <Mascot />
          <div className="hero-score-card"><span className="score-label">ZİRVEYE GİDEN YOL</span><strong>1</strong><span className="score-caption">Doğru cevapla başlar</span></div>
        </div>
      </section>

      <section className="competition-banner">
        <div className="status-icon"><span /></div>
        <div className="competition-copy">
          <span className="section-kicker">Sıradaki yarışma</span>
          <h2>{nextCompetition ? nextCompetition.title : 'Yeni yarışma yakında'}</h2>
          <p>{nextCompetition ? 'Hazırlan, canlı rekabet başlıyor.' : 'Takvime yeni yarışma eklendiğinde ilk sen haberdar ol.'}</p>
        </div>
        {nextCompetition && countdown ? (
          <div className="countdown-values" aria-label="Yarışmaya kalan süre">
            {[[countdown.days, 'gün'], [countdown.hours, 'saat'], [countdown.minutes, 'dak'], [countdown.seconds, 'sn']].map(([value, label]) => <div key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}
          </div>
        ) : <Link to="/spectate" className="banner-link">Geçmiş yarışmaları keşfet <span>→</span></Link>}
      </section>

      <section className="landing-section steps-section">
        <div className="section-heading"><span className="section-kicker">Üç adımda</span><h2>Yarışmaya hazır mısın?</h2><p>BirİNCİ’de yerini almak sandığından çok daha kolay.</p></div>
        <div className="steps-grid">{steps.map((step) => <article className="step-card" key={step.number}><span className="step-number">{step.number}</span><div className="step-arrow">↗</div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>

      <section className="landing-section feature-section">
        <div className="feature-intro"><span className="section-kicker">Neden BirİNCİ?</span><h2>Sadece bir yarışma değil, bir meydan okuma.</h2><p>Her soruda yeni bir heyecan, her doğru cevapta zirveye biraz daha yakınsın.</p><Link to="/yarismayi-ogrenelim" className="text-link">BirİNCİ’yi keşfet <span>→</span></Link></div>
        <div className="features-list">{features.map((feature, index) => <article className="feature-row" key={feature.title}><span className="feature-index">0{index + 1}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div><span className="feature-mark">+</span></article>)}</div>
      </section>

      <section className="landing-section leaderboard-preview">
        <div className="leaderboard-head"><div><span className="section-kicker">Zirvedekiler</span><h2>Liderlik tablosu</h2></div><Link to="/leaderboard" className="text-link">Tümünü gör <span>→</span></Link></div>
        <div className="leaders-table">{leaders.length ? leaders.map((leader, index) => <div className="leader-row" key={leader.user_id ?? `${leader.full_name}-${index}`}><span className={`leader-rank rank-${index + 1}`}>{index + 1}</span><span className="leader-name">{leader.full_name || 'İsimsiz üye'}</span><strong>{leader.points ?? 0} <small>puan</small></strong></div>) : <div className="leader-empty">İlk yarışmanın lideri sen olabilirsin.</div>}</div>
      </section>

      <section className="landing-cta"><div><span className="section-kicker">Sıra sende</span><h2>Zirvede yerin hazır mı?</h2><p>Bilgine güveniyorsan, BirİNCİ topluluğuna katıl.</p></div><Link to="/signup" className="landing-primary-btn">Hemen üye ol <span>→</span></Link></section>

      <footer className="landing-footer"><Link to="/" className="landing-brand"><img src="/icons/icon-192.png" alt="" /><span>Bir<span>İNCİ</span></span></Link><div><Link to="/kvkk">KVKK</Link><Link to="/kullanim-kosullari">Kullanım koşulları</Link><Link to="/contact">İletişim</Link></div><p>© {new Date().getFullYear()} BirİNCİ Bilgi Yarışması</p></footer>
    </main>
  );
}
