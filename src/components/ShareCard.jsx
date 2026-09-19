import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const MEDALS = { 1: '👑', 2: '🥈', 3: '🥉' };
const RANK_LABEL = { 1: 'BİRİNCİ', 2: 'İKİNCİ', 3: 'ÜÇÜNCÜ' };

export default function ShareCard({ rank, fullName, prize, competitionTitle }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async () => {
    setSharing(true);
    setError('');
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'birinci-kazandim.png', { type: 'image/png' });
        const shareText = `BirİNCİ Bilgi Yarışması'nda ${RANK_LABEL[rank].toLowerCase()} oldum! 🎉`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'BirİNCİ', text: shareText });
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'birinci-kazandim.png';
          link.click();
        }
        setSharing(false);
      }, 'image/png');
    } catch (err) {
      setSharing(false);
      setError('Görsel oluşturulamadı, tekrar deneyin.');
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      <div
        ref={cardRef}
        style={{
          width: '300px',
          margin: '0 auto',
          background: 'radial-gradient(ellipse at top, #ffe3ec 0%, #ffd6e2 55%, #ffc9db 100%)',
          borderRadius: '18px',
          padding: '2rem 1.5rem',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        <div style={{ fontSize: '3rem' }}>{MEDALS[rank]}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '1.6rem', color: '#1e3a8a', marginTop: '0.5rem' }}>
          {RANK_LABEL[rank]} OLDUM!
        </div>
        <div style={{ marginTop: '0.75rem', fontWeight: 700, color: '#1e3a8a', fontSize: '1.05rem' }}>{fullName}</div>
        {competitionTitle && (
          <div style={{ marginTop: '0.3rem', fontSize: '0.85rem', color: '#7a5f70' }}>{competitionTitle}</div>
        )}
        {prize && (
          <div style={{ marginTop: '0.75rem', display: 'inline-block', background: '#ffd500', color: '#1e3a8a', fontWeight: 800, padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.95rem' }}>
            {prize}
          </div>
        )}
        <div style={{ marginTop: '1.25rem', fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '1.1rem', color: '#1e3a8a' }}>
          Bir<span style={{ color: '#d9722e' }}>İ</span>NCİ
        </div>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#7a5f70', textTransform: 'uppercase' }}>
          Bilgi Yarışması
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleShare} disabled={sharing} style={{ marginTop: '1rem' }}>
        {sharing ? 'Hazırlanıyor...' : '📤 Kazandığını Paylaş'}
      </button>
      {error && <p className="status-banner is-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
