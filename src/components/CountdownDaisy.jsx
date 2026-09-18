// Papatya şeklinde geri sayım — toplam süre kadar beyaz yaprak,
// saat yönünde birer birer kayboluyor. Ortadaki sarı alanda kırmızı
// rakamla kalan saniye gösteriliyor.
export default function CountdownDaisy({ secondsLeft, totalSeconds, size = 190 }) {
  const total = Math.max(1, totalSeconds ?? 1);
  const remaining = Math.max(0, secondsLeft ?? 0);
  const removed = total - remaining; // saat yönünde şu ana kadar kaybolan yaprak sayısı

  const cx = 100;
  const cy = 100;
  const centerRadius = 34;
  const petalLength = 46;
  const petalWidth = 20;
  const petalDistance = centerRadius + petalLength / 2 - 8;

  const petals = Array.from({ length: total }, (_, i) => {
    const angle = (360 / total) * i; // 0° = saat 12 yönü, pozitif = saat yönü
    const visible = i >= removed;
    return (
      <g
        key={i}
        transform={`rotate(${angle} ${cx} ${cy})`}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <ellipse
          cx={cx}
          cy={cy - petalDistance}
          rx={petalWidth / 2}
          ry={petalLength / 2}
          fill="url(#daisyPetalGradient)"
          stroke="#f0ead8"
          strokeWidth="1"
        />
      </g>
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ display: 'block', margin: '0 auto', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.18))' }}
    >
      <defs>
        <radialGradient id="daisyPetalGradient" cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f4f1e6" />
        </radialGradient>
        <radialGradient id="daisyCenterGradient" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="1" stopColor="#f6b93b" />
        </radialGradient>
      </defs>

      {petals}

      <circle cx={cx} cy={cy} r={centerRadius} fill="url(#daisyCenterGradient)" stroke="#e0a52e" strokeWidth="1.5" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Fraunces', serif"
        fontWeight="700"
        fontSize="30"
        fill="#c62828"
      >
        {remaining}
      </text>
    </svg>
  );
}
