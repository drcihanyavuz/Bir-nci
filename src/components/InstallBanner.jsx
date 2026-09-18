import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallBanner() {
  const { canInstall, promptInstall, installed, isInAppBrowser } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (installed || dismissed) return null;
  if (!canInstall && !isInAppBrowser) return null;

  return (
    <div
      style={{
        background: 'var(--btn-blue)',
        color: 'var(--pearl)',
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1rem',
        margin: '0 auto 1.25rem',
        maxWidth: '420px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>📲</span>
      <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.4 }}>
        {isInAppBrowser
          ? 'En iyi deneyim için sağ üstteki ⋮ menüsünden "Tarayıcıda Aç"ı seçip uygulamayı yükleyin.'
          : 'BirİNCİ\'yi telefonunuza yükleyip ana ekrandan tek dokunuşla açabilirsiniz.'}
      </div>
      {canInstall && (
        <button className="btn btn-primary" onClick={promptInstall} style={{ whiteSpace: 'nowrap' }}>
          Yükle
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Kapat"
        style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: 'var(--pearl)', cursor: 'pointer' }}
      >
        ✕
      </button>
    </div>
  );
}
