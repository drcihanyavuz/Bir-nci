import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const APP_URL = 'https://birincim.vercel.app';

export default function AdminDashboard() {
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
        // paylaşım iptal edildi
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <h1>Admin paneli</h1>

      <div className="panel-grid">
        <Link to="/admin/competitions/new" className="panel-btn">
          Yarışma oluştur
        </Link>
        <Link to="/admin/packages" className="panel-btn">
          İnci ayarları
        </Link>
        <Link to="/admin/survey" className="panel-btn">
          Anket yönetimi
        </Link>
        <Link to="/admin/past-competitions" className="panel-btn">
          Geçmiş yarışmalar
        </Link>
        <Link to="/admin/contact-messages" className="panel-btn">
          Mesajlar
        </Link>
        <Link to="/admin/chat" className="panel-btn">
          Sohbet
        </Link>
        <button className="panel-btn" onClick={handleInvite}>
          Davet et
        </button>
        <button className="panel-btn" onClick={handleSignOut}>
          Çıkış
        </button>
      </div>

      <p style={{ marginTop: '2rem' }}>
        <Link to="/admin/tiebreak" className="muted">Ek soru bekleyen yarışmalar</Link>
      </p>
    </div>
  );
}
