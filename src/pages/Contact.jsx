import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await supabase.from('contact_messages').insert({
      user_id: user?.id ?? null,
      sender_name: senderName,
      sender_email: senderEmail,
      message,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="stage">
        <h1>Mesajınız iletildi</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          En kısa sürede size dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '480px' }}>
      <h1>İletişim</h1>
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

        {error && <p className="status-banner is-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </form>
    </div>
  );
}
