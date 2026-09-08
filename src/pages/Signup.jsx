import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [welcomeName, setWelcomeName] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (!termsAccepted) {
      setError('Devam etmek için Aydınlatma Metni ve Kullanım Koşullarını onaylamanız gerekiyor.');
      return;
    }

    setSubmitting(true);

    const fullName = `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setSubmitting(false);
      setError(error.message);
      return;
    }

    // Telefon numarasını ve KVKK onay zamanını profile ekle
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ phone, terms_accepted_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    setSubmitting(false);
    setWelcomeName(fullName);

    setTimeout(() => navigate('/dashboard'), 1800);
  };

  if (welcomeName) {
    return (
      <div className="stage">
        <div className="gold-text font-display" style={{ fontSize: '2.25rem' }}>
          ARAMIZA HOŞGELDİN
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '1.2rem' }}>{welcomeName}</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '420px', paddingTop: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="wordmark" style={{ fontSize: '1.6rem' }}>
          Bir<em>İNCİ</em>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-panel stack">
        <h2>Üye ol</h2>

        <label className="field">
          Ad
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>

        <label className="field">
          Soyad
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>

        <label className="field">
          E-posta
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="field">
          Telefon no
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
            required
          />
        </label>

        <label className="field">
          Şifre oluştur
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label className="field">
          Şifre tekrar
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ marginTop: '0.2rem' }}
          />
          <span className="muted">
            <a href="/kvkk" target="_blank" rel="noreferrer">Aydınlatma Metni</a>'ni ve{' '}
            <a href="/kullanim-kosullari" target="_blank" rel="noreferrer">Kullanım Koşulları</a>'nı
            okudum, kabul ediyorum.
          </span>
        </label>

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting || !termsAccepted}>
          {submitting ? 'Kayıt olunuyor...' : 'Üye ol'}
        </button>

        <p className="muted" style={{ textAlign: 'center' }}>
          Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </form>
    </div>
  );
}
