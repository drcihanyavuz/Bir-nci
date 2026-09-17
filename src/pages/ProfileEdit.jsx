import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { enablePushNotifications } from '../lib/push';

export default function ProfileEdit() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (!window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz; inci bakiyeniz, geçmiş katılımlarınız ve mesajlarınız da silinecektir.')) {
      return;
    }
    if (!window.confirm('Son bir kez soruyoruz: hesabınızı silmek istediğinizden kesinlikle emin misiniz?')) {
      return;
    }

    setDeleting(true);
    setDeleteError('');

    const { data, error } = await supabase.functions.invoke('delete-account');

    if (error || data?.error) {
      setDeleting(false);
      setDeleteError(data?.error || error.message);
      return;
    }

    await signOut();
    navigate('/');
  };

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

      <div className="form-panel" style={{ marginTop: '1.5rem' }}>
        <h2>Tehlikeli bölge</h2>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.
        </p>
        {deleteError && <p className="status-banner is-error" style={{ marginTop: '0.5rem' }}>{deleteError}</p>}
        <button className="btn btn-ghost" onClick={handleDeleteAccount} disabled={deleting} style={{ marginTop: '0.75rem' }}>
          {deleting ? 'Siliniyor...' : 'Hesabımı Sil'}
        </button>
      </div>
    </div>
  );
}
