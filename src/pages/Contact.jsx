import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // bot tuzağı — insanlar bunu görmez/doldurmaz
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Bot tuzağı doluysa (gerçek kullanıcılar bu alanı hiç görmez) sessizce geç
    if (website.trim() !== '') {
      setSent(true);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('contact_messages').insert({
      user_id: user?.id ?? null,
      sender_name: senderName,
      sender_email: senderEmail,
      message,
    });

    setSubmitting(false);

    if (error) {
      setError(
        error.message.includes('Çok fazla mesaj')
          ? error.message
          : 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.'
      );
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="stage">
        <h1>✅ Mesajınız iletildi</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          En kısa sürede size dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '480px' }}>
      <h1>✉️ İletişim</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Bir sorunuz mu var? Bize buradan yazın.
      </p>

      <form onSubmit={handleSubmit} className="form-panel stack" style={{ marginTop: '1.5rem' }}>
        <label className="field">
          Adınız
          <input value={senderName} onChange={(e) => setSenderName(e.target.value)} required />
        </label>

        <label className="field">
          E-posta
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          Mesajınız
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
        </label>

        {/* Bot tuzağı: gerçek kullanıcılar görmez, botlar genelde doldurur */}
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label>
            Web siteniz
            <input
              type="text"
              tabIndex="-1"
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </form>
    </div>
  );
}
