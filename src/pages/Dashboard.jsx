import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const APP_URL = 'https://birincim.vercel.app';

export default function Dashboard() {
  const { signOut } = useAuth();
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
      <h1>Ne yapmak istersin?</h1>

      <div className="panel-grid">
        <Link to="/competitions" className="panel-btn">
          Yarışmaya katıl
        </Link>
        <Link to="/buy-inci" className="panel-btn">
          İnci al
        </Link>
        <Link to="/survey" className="panel-btn">
          Anket
        </Link>
        <Link to="/leaderboard" className="panel-btn">
          Liderlik Tablosu
        </Link>
        <Link to="/chat" className="panel-btn">
          Sohbet
        </Link>
        <button className="panel-btn" onClick={handleInvite}>
          Davet et
        </button>
        <Link to="/profile" className="panel-btn">
          Profilim
        </Link>
        <button className="panel-btn" onClick={handleSignOut}>
          Çıkış
        </button>
      </div>
    </div>
  );
}
