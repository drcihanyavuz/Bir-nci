import { useEffect, useRef, useState } from 'react';

// Bir sayı değiştiğinde, eski değerden yeni değere doğru yumuşakça
// "sayarak" geçiş yapar (örn. inci bakiyesi değişince).
export function useCountUp(value, duration = 700) {
  const [displayValue, setDisplayValue] = useState(value ?? 0);
  const fromRef = useRef(value ?? 0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (value === null || value === undefined) return;

    const from = fromRef.current;
    const to = value;

    if (from === to) return;

    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return displayValue;
}
