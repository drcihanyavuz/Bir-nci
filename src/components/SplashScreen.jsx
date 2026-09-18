export default function SplashScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #ffe3ec 0%, #ffd6e2 55%, #ffc9db 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '420px',
          maxWidth: '80vw',
          height: '420px',
          maxHeight: '80vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      <img
        src="/icon-symbol.png"
        alt="BirİNCİ"
        style={{
          width: '280px',
          maxWidth: '76vw',
          position: 'relative',
          zIndex: 2,
          filter: 'drop-shadow(0 16px 18px rgba(120,40,80,0.18))',
        }}
      />

      <div style={{ marginTop: '1.75rem', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(2.6rem, 13vw, 4.8rem)', fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap' }}>
          Bir<span style={{ color: '#d9722e' }}>İ</span>NCİ
        </div>
        <div style={{ width: '92px', height: '8px', background: '#ffd500', borderRadius: '4px', margin: '0.6rem auto 0.85rem' }} />
        <div style={{ fontSize: 'clamp(1rem, 4.2vw, 1.6rem)', letterSpacing: '0.2em', color: '#7a5f70', textTransform: 'uppercase' }}>
          Bilgi Yarışması
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '3.5rem', fontSize: '0.75rem', color: '#a67892' }}>
        Yükleniyor…
      </div>
    </div>
  );
}
