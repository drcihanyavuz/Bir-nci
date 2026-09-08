import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  if (done) {
    return (
      <div className="stage">
        <h1>Şifreniz güncellendi</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>Yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '420px', paddingTop: '4rem' }}>
      <form onSubmit={handleSubmit} className="form-panel stack">
        <h2>Yeni şifre belirle</h2>

        <label className="field">
          Yeni şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label className="field">
          Yeni şifre (tekrar)
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Güncelleniyor...' : 'Şifreyi güncelle'}
        </button>
      </form>
    </div>
  );
}
