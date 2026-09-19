// Arka planda yavaşça yükselen küçük inci/baloncuk parçacıkları.
// Tamamen dekoratif, tıklanabilirliği engellememesi için pointer-events kapalı.
const PARTICLES = Array.from({ length: 14 }).map((_, i) => ({
  id: i,
  left: Math.round((i * 137.5) % 100), // altın oran dağılımı, düzgün yayılım için
  size: 6 + ((i * 7) % 14),
  duration: 14 + ((i * 5) % 10),
  delay: (i * 1.3) % 12,
}));

export default function FloatingParticles() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '-40px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(255,213,0,0.35))',
            animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-115vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
