/** Kararlı 32-bit hash — aynı anahtar her istemcide aynı gecikmeyi üretir. */
export function hashString(value) {
  const text = String(value ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Bin kişilik odada herkesin aynı RPC'yi aynı milisaniyede çağırmasını önler.
 * Temizlik fonksiyonu döner.
 */
export function scheduleCoordinatedCall(key, fn, { spreadMs = 2500, fallbackMs = 4000 } = {}) {
  const slot = hashString(key) % 1000;
  const delay = slot < 12 ? slot * 80 : fallbackMs + (slot % 50) * 40;
  const spread = hashString(`${key}:spread`) % Math.max(1, spreadMs);
  const wait = slot < 12 ? delay : Math.min(delay, fallbackMs + spread);
  const timer = setTimeout(fn, wait);
  return () => clearTimeout(timer);
}

export function isStatsReporter(key) {
  return hashString(`${key}:stats`) % 48 === 0;
}

export function getCoordinatorKey(userId) {
  if (userId) return userId;
  if (typeof sessionStorage === 'undefined') return 'anon';
  const stored = sessionStorage.getItem('birinci-coord-id');
  if (stored) return stored;
  const created = crypto.randomUUID();
  sessionStorage.setItem('birinci-coord-id', created);
  return created;
}
