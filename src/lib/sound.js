// Gerçek bir alkış ses dosyamız olmadığı için, Web Audio API ile
// basit ama duyulabilir bir "başarı/alkış" sesi sentezliyoruz.
// İleride gerçek bir alkış kaydı (mp3) eklenirse bu fonksiyon
// kolayca değiştirilebilir.
export function playApplauseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.6;

    // Kısa "gürültü patlaması" (alkış hissi) + birkaç kısa "tık" darbesi
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

// Süre dolduğunda çalınan "gong" sesi — gerçek bir gong kaydımız
// olmadığı için, alçak frekanslı, uzun sönümlü bir ton karışımıyla
// sentezliyoruz (temel frekans + birkaç harmonik).
export function playGongSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const duration = 2.2;
    const fundamentals = [110, 174, 233, 275]; // gong benzeri, uyumsuz harmonikler

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
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

// Son 3 saniyede çalınan, saniye azaldıkça perdesi yükselen "tik" sesi
// (gerilim hissi için).
export function playCountdownTick(secondsLeft) {
  const freq = secondsLeft === 3 ? 500 : secondsLeft === 2 ? 620 : 760;
  playTickSound(freq);
}

// Telefon titreşimi — doğru/yanlış cevaba göre farklı desen.
// iOS Safari bu API'yi desteklemiyor, orada sessizce hiçbir şey olmaz.
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

// Yarışma başlarken (ilk soru gelince) çalınan kısa, heyecan verici
// bir "başlıyoruz" müzik motifi — yükselen 4 nota.
export function playStartJingle() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [392, 494, 587, 784]; // Sol-Si-Re-Sol, yükselen ve umut verici
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

// Ekranlar arası geçişte (yeni soru gelince) çalınan kısa "whoosh" sesi.
export function playWhooshSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
