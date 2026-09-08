import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const REMEMBER_KEY = 'birinci_remember_login';

export default function Login() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      const { email: savedEmail, phone: savedPhone } = JSON.parse(saved);
      setEmail(savedEmail ?? '');
      setPhone(savedPhone ?? '');
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { data, error } = await signIn(email, password);

    if (error) {
      setSubmitting(false);
      setError('E-posta veya şifre hatalı.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', data.user.id)
      .single();

    setSubmitting(false);

    if (profile?.phone !== phone) {
      await supabase.auth.signOut();
      setError('Telefon numarası kayıtlı bilgilerinizle uyuşmuyor.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, phone }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    navigate('/dashboard');
  };

  return (
    <div className="page" style={{ maxWidth: '420px', paddingTop: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="wordmark" style={{ fontSize: '1.6rem' }}>
          Bir<em>İNCİ</em>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-panel stack">
        <h2>Giriş yap</h2>

        <label className="field">
          E-posta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }} className="muted">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Beni hatırla
        </label>

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </button>

        <p className="muted" style={{ textAlign: 'center' }}>
          Hesabın yok mu? <Link to="/signup">Kayıt ol</Link>
        </p>
      </form>
    </div>
  );
}
