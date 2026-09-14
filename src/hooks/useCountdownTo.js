import { useEffect, useState } from 'react';

export function useCountdownTo(targetIso) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!targetIso) {
      setSecondsLeft(null);
      return undefined;
    }

    const target = new Date(targetIso).getTime();
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [targetIso]);

  return secondsLeft;
}
