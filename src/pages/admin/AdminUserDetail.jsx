import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [competitionCount, setCompetitionCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [grantAmount, setGrantAmount] = useState('');
  const [banDays, setBanDays] = useState('');

  const load = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(profileData);

    const { count } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    setCompetitionCount(count ?? 0);

    const { data: leaderboardRow } = await supabase
      .from('public_leaderboard')
      .select('points')
      .eq('user_id', userId)
      .single();
    setPoints(leaderboardRow?.points ?? 0);

    const { data: txData } = await supabase
      .from('inci_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    setTransactions(txData ?? []);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleGrant = async () => {
    const amount = Number(grantAmount);
    if (!amount) return;

    setBusy(true);
    setError('');
    const { error } = await supabase.rpc('admin_grant_inci', { p_user_id: userId, p_amount: amount });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setGrantAmount('');
    load();
  };

  const handleBan = async () => {
    const days = Number(banDays);
    if (!days || days <= 0) return;

    setBusy(true);
    setError('');
    const bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.rpc('admin_set_ban', { p_user_id: userId, p_banned_until: bannedUntil });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setBanDays('');
    load();
  };

  const handleUnban = async () => {
    setBusy(true);
    setError('');
    const { error } = await supabase.rpc('admin_set_ban', { p_user_id: userId, p_banned_until: null });
    setBusy(false);
    if (error) setError(error.message);
    load();
  };

  const handleDelete = async () => {
    if (!window.confirm(`${profile?.full_name || 'Bu üyeyi'} kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    setBusy(true);
    setError('');

    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { target_user_id: userId },
    });

    setBusy(false);

    if (error || data?.error) {
      setError(data?.error || error.message);
      return;
    }

    navigate('/admin/users');
  };

  if (loading) return <div className="page">Yükleniyor...</div>;
  if (!profile) return <div className="page">Üye bulunamadı.</div>;

  const isBanned = profile.banned_until && new Date(profile.banned_until) > new Date();

  return (
    <div className="page">
      <p><Link to="/admin/users">← Üyeler</Link></p>
      <h1>{profile.full_name || 'İsimsiz üye'}</h1>

      <div className="form-panel" style={{ marginTop: '1rem' }}>
        <h2>Profil bilgileri</h2>
        <p className="muted" style={{ marginTop: '0.5rem' }}>E-posta: {profile.email}</p>
        <p className="muted">Telefon: {profile.phone || '—'}</p>
        <p className="muted">İnci bakiyesi: <span className="gold-text">{profile.inci_balance}</span></p>
        <p className="muted">Katıldığı yarışma sayısı: {competitionCount}</p>
        <p className="muted">Liderlik tablosu puanı: {points}</p>
        {isBanned && (
          <p className="status-banner is-error">
            {new Date(profile.banned_until).toLocaleString('tr-TR')} tarihine kadar men edildi
          </p>
        )}

        <Link to={`/admin/chat?user=${profile.id}`} className="btn btn-ghost" style={{ marginTop: '1rem' }}>
          Mesaj Gönder
        </Link>
      </div>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>İnci yükle / düş</h2>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'end' }}>
          <label className="field" style={{ marginBottom: 0 }}>
            Miktar (+/-)
            <input type="number" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={handleGrant} disabled={busy}>
            Uygula
          </button>
        </div>
      </div>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>Yarışmalardan men et</h2>
        {isBanned ? (
          <button className="btn btn-ghost" onClick={handleUnban} disabled={busy} style={{ marginTop: '0.75rem' }}>
            Men'i kaldır
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'end' }}>
            <label className="field" style={{ marginBottom: 0 }}>
              Kaç gün
              <input type="number" min="1" value={banDays} onChange={(e) => setBanDays(e.target.value)} />
            </label>
            <button className="btn btn-ghost" onClick={handleBan} disabled={busy}>
              Men et
            </button>
          </div>
        )}
      </div>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>İnci hareketleri</h2>
        <div style={{ marginTop: '0.75rem' }}>
          {transactions.length === 0 && <p className="muted">Hiç hareket yok.</p>}
          {transactions.map((t) => (
            <div className="list-row" key={t.id}>
              <span>{t.type}</span>
              <span className={t.amount >= 0 ? 'gold-text' : 'muted'}>
                {t.amount >= 0 ? '+' : ''}{t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="status-banner is-error" style={{ marginTop: '1rem' }}>{error}</p>}

      {!profile.is_admin && (
        <button className="btn btn-ghost" onClick={handleDelete} disabled={busy} style={{ marginTop: '2rem' }}>
          Üyeyi Kalıcı Olarak Sil
        </button>
      )}
    </div>
  );
}
