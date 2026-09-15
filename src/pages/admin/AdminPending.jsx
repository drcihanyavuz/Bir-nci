import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPending() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, created_at')
      .is('approved_at', null)
      .order('created_at');
    setPending(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (userId) => {
    setBusyId(userId);
    setError('');
    const { error } = await supabase.rpc('admin_approve_member', { p_user_id: userId });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  const handleReject = async (userId, name) => {
    if (!window.confirm(`${name || 'Bu başvuruyu'} reddetmek (hesabı silmek) istediğinize emin misiniz?`)) {
      return;
    }

    setBusyId(userId);
    setError('');
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { target_user_id: userId },
    });
    setBusyId(null);

    if (error || data?.error) {
      setError(data?.error || error.message);
      return;
    }
    load();
  };

  if (loading) return <div className="page">Yükleniyor...</div>;

  return (
    <div className="page">
      <h1>Bekleyen işlemler</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Onay bekleyen üyelik başvuruları
      </p>

      {error && <p className="status-banner is-error" style={{ marginTop: '1rem' }}>{error}</p>}

      {pending.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Bekleyen üyelik başvurusu yok.
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {pending.map((u) => (
          <div className="form-panel" key={u.id} style={{ marginTop: '1rem' }}>
            <div>
              <strong>{u.full_name || 'İsimsiz'}</strong>
              <div className="muted" style={{ fontSize: '0.85rem' }}>{u.email}</div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>Telefon: {u.phone || '—'}</div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                Başvuru: {new Date(u.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => handleApprove(u.id)} disabled={busyId === u.id}>
                Onayla
              </button>
              <button className="btn btn-ghost" onClick={() => handleReject(u.id, u.full_name)} disabled={busyId === u.id}>
                Reddet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
