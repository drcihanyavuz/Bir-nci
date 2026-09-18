// Papatya şeklinde geri sayım. `total` = geri sayımın başladığı
// saniye (= yaprak sayısı), `remaining` = kalan saniye. Süre
// azaldıkça yapraklar saat yönünde (12 hizasından başlayarak)
// teker teker solup küçülerek kayboluyor.
export default function DaisyCountdown({ total, remaining, size = 180 }) {
  const safeTotal = Math.max(1, total || 1);
  const safeRemaining = Math.max(0, remaining ?? 0);

  const cx = size / 2;
  const cy = size / 2;
  const centerR = size * 0.2;
  const petalDistance = size * 0.315;
  const petalW = size * 0.115;
  const petalH = size * 0.24;

  const goneCount = Math.max(0, safeTotal - safeRemaining);

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="daisy-center" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="1" stopColor="#ffc700" />
          </radialGradient>
          <filter id="daisy-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.18" />
          </filter>
        </defs>

        {Array.from({ length: safeTotal }).map((_, i) => {
          const angle = (360 / safeTotal) * i;
          const isGone = i < goneCount;
          return (
            <g key={i} transform={`rotate(${angle} ${cx} ${cy})`}>
              <ellipse
                cx={cx}
                cy={cy - petalDistance}
                rx={petalW / 2}
                ry={petalH / 2}
                fill="#ffffff"
                stroke="#f1e7d2"
                strokeWidth="1"
                filter="url(#daisy-shadow)"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transition: 'opacity 0.55s ease, transform 0.55s cubic-bezier(.4,0,.2,1)',
                  opacity: isGone ? 0 : 1,
                  transform: isGone ? 'scale(0.15) rotate(25deg)' : 'scale(1) rotate(0deg)',
                }}
              />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={centerR} fill="url(#daisy-center)" stroke="#e0a800" strokeWidth="1" />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Fraunces', serif",
          fontWeight: 700,
          fontSize: size * 0.22,
          color: '#c81e1e',
          textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          pointerEvents: 'none',
        }}
      >
        {safeRemaining}
      </div>
    </div>
  );
}
