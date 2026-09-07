import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
        <Link to="/chat" className="panel-btn">
          Sohbet
        </Link>
        <button className="panel-btn" onClick={handleSignOut}>
          Çıkış
        </button>
      </div>
    </div>
  );
}
