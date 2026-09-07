import { Navigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

export default function AdminRoute({ children }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!profile?.is_admin) {
    // Admin olmayan kullanıcıyı ana sayfaya geri gönder
    return <Navigate to="/" replace />;
  }

  return children;
}
