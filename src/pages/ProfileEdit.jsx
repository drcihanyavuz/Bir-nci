import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { enablePushNotifications } from '../lib/push';

export default function ProfileEdit() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  const handleEnablePush = async () => {
    setPushMessage('');
    try {
      await enablePushNotifications(user.id);
      setPushMessage('Bildirimler açıldı!');
    } catch (err) {
      setPushMessage(err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setFullName(data?.full_name ?? '');
        setPhone(data?.phone ?? '');
        setLoading(false);
      });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
  };

  if (loading) return <div className="page">Yükleniyor...</div>;

  return (
    <div className="page" style={{ maxWidth: '420px' }}>
      <h1>Profilim</h1>

      <form onSubmit={handleSubmit} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
        <label className="field">
          Ad Soyad
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>

        <label className="field">
          Telefon no
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>

        {error && <p className="status-banner is-error">{error}</p>}
        {saved && <p className="status-banner is-success">Bilgileriniz güncellendi.</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>Bildirimler</h2>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Yarışma başlamadan önce telefonunuza hatırlatma bildirimi alın.
        </p>
        <button className="btn btn-ghost" onClick={handleEnablePush} style={{ marginTop: '0.75rem' }}>
          Bildirimleri Aç
        </button>
        {pushMessage && <p className="muted" style={{ marginTop: '0.5rem' }}>{pushMessage}</p>}
      </div>
    </div>
  );
}
