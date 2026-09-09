import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <div>
      <div className="app-topbar">
        <Link to="/" className="home-link">
          <img src="/icons/icon-192.png" alt="" style={{ width: '22px', height: '22px', verticalAlign: 'middle', marginRight: '0.3rem' }} />
          Anasayfa
        </Link>
        {user && (
          <span className="user-chip" style={{ textAlign: 'right' }}>
            <div>{profile?.full_name ?? ''}</div>
            <div className="muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>
              Hazine : {profile?.inci_balance ?? '...'}
            </div>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
