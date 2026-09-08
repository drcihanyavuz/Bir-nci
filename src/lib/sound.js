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
