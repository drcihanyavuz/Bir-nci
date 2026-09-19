// Tüm ses efektleri TEK bir paylaşılan AudioContext üzerinden çalışır.
// Önceki sürümde her ses çalma çağrısı kendi AudioContext'ini
// oluşturup hiç kapatmıyordu — bu, uzun bir yarışmada (özellikle son
// 3 saniye "tik" sesi her soruda tekrarlandığı için) onlarca açık
// ses motoru birikmesine ve genel bir yavaşlamaya yol açıyordu.
// Artık tek motor oluşturulup tekrar tekrar kullanılıyor.
let sharedCtx = null;

function getAudioContext() {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Tarayıcılar, kullanıcı etkileşimi olmadan başlayan ses motorlarını
  // otomatik "askıya" alabiliyor — her çalmadan önce devam ettirmeyi deneriz.
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

// Gerçek bir alkış ses dosyamız olmadığı için, Web Audio API ile
// basit ama duyulabilir bir "başarı/alkış" sesi sentezliyoruz.
export function playApplauseSound() {
  try {
    const ctx = getAudioContext();
    const duration = 0.6;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.pow(1 - i / bufferSize, 2);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.7;

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch {
    // Ses çalınamazsa sessizce geç, uygulamayı bozmasın
  }
}

// Süre dolduğunda çalınan "gong" sesi.
export function playGongSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = 2.2;
    const fundamentals = [110, 174, 233, 275];

    fundamentals.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const peak = i === 0 ? 0.5 : 0.5 / (i + 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    });
  } catch {
    // Ses çalınamazsa sessizce geç
  }
}

// Şık seçildiğinde çalınan hafif "tık" sesi.
export function playTickSound(frequency = 700) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // sessizce geç
  }
}

// Son 3 saniyede çalınan, saniye azaldıkça perdesi yükselen "tik" sesi.
export function playCountdownTick(secondsLeft) {
  const freq = secondsLeft === 3 ? 500 : secondsLeft === 2 ? 620 : 760;
  playTickSound(freq);
}

// Telefon titreşimi — doğru/yanlış cevaba göre farklı desen.
export function vibrateCorrect() {
  try {
    navigator.vibrate?.(120);
  } catch {
    // desteklenmiyorsa sessizce geç
  }
}

export function vibrateWrong() {
  try {
    navigator.vibrate?.([60, 50, 60, 50, 60]);
  } catch {
    // desteklenmiyorsa sessizce geç
  }
}

// Yarışma başlarken (ilk soru gelince) çalınan kısa "başlıyoruz" motifi.
export function playStartJingle() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => {
      const start = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // sessizce geç
  }
}

// Ekranlar arası geçişte çalınan kısa "whoosh" sesi.
export function playWhooshSound() {
  try {
    const ctx = getAudioContext();
    const duration = 0.35;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch {
    // sessizce geç
  }
}
