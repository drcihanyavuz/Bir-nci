import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import AnnouncementsPanel from '../components/AnnouncementsPanel';

const APP_URL = 'https://birincim.vercel.app';

export default function Dashboard() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleInvite = async () => {
    const shareText = `BirİNCİ'de canlı bilgi yarışmasına katıl, birinci ol! ${APP_URL}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: APP_URL });
      } catch {
        // kullanıcı paylaşımı iptal etti, bir şey yapmaya gerek yok
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <AnnouncementsPanel />

      {profile && !profile.approved_at && (
        <div className="status-banner is-error" style={{ marginBottom: '1.5rem' }}>
          Üyeliğiniz yönetici onayı bekliyor. Onaylandığında yarışmalara katılabilirsiniz.
        </div>
      )}

      <div className="panel-grid">
        <Link to="/competitions" className="panel-btn">
          🏆 Yarışmaya katıl
        </Link>
        <Link to="/buy-inci" className="panel-btn">
          💎 İnci al
        </Link>
        <Link to="/yarismayi-ogrenelim" className="panel-btn">
          📖 Yarışmayı Öğrenelim
        </Link>
        <Link to="/leaderboard" className="panel-btn">
          🏅 Liderlik Tablosu
        </Link>
        <Link to="/results" className="panel-btn">
          📜 Geçmiş yarışmalar
        </Link>
        <Link to="/spectate" className="panel-btn">
          👀 Yarışmayı İzle
        </Link>
        <Link to="/chat" className="panel-btn">
          💬 Sohbet
        </Link>
        <button className="panel-btn" onClick={handleInvite}>
          📨 Davet et
        </button>
        <Link to="/profile" className="panel-btn">
          👤 Profilim
        </Link>
        <button className="panel-btn" onClick={handleSignOut}>
          🚪 Çıkış
        </button>
      </div>
    </div>
  );
}
