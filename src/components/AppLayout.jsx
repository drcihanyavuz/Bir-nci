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
          ⌂ Anasayfa
        </Link>
        {user && <span className="user-chip">{profile?.full_name ?? ''}</span>}
      </div>
      {children}
    </div>
  );
}
