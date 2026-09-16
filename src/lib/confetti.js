// Basit, dışa bağımlılık gerektirmeyen konfeti efekti.
// origin: {x, y} (viewport piksel koordinatı) — verilmezse ekranın
// üst ortasından patlar.
const COLORS = ['#ffd500', '#8b5cf6', '#d21f1f', '#1e3a8a', '#2f8f6f', '#ff8fab'];

export function burstConfetti(origin) {
  try {
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 3;
    const count = 36;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 6;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const angle = Math.random() * 2 * Math.PI;
      const distance = 60 + Math.random() * 120;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 40;
      const rotate = Math.random() * 720 - 360;
      const duration = 700 + Math.random() * 500;

      el.style.position = 'fixed';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${size}px`;
      el.style.height = `${size * 0.6}px`;
      el.style.background = color;
      el.style.borderRadius = '2px';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '9999';
      el.style.opacity = '1';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.transition = `transform ${duration}ms cubic-bezier(.2,.7,.3,1), opacity ${duration}ms ease-out`;

      document.body.appendChild(el);

      requestAnimationFrame(() => {
        el.style.transform = `translate(${dx - size / 2}px, ${dy - size / 2}px) rotate(${rotate}deg)`;
        el.style.opacity = '0';
      });

      setTimeout(() => el.remove(), duration + 100);
    }
  } catch {
    // Konfeti çalışmazsa sessizce geç
  }
}
