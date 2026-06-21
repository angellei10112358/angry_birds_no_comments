export function createAudio() {
  let ctx = null;
  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      initialized = true;
    } catch (e) {
      return;
    }
  }

  function ensureResumed() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, duration, type, volume) {
    if (!ctx) return;
    ensureResumed();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.2));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (duration || 0.2));
  }

  function playNoise(duration, volume) {
    if (!ctx) return;
    ensureResumed();
    const bufferSize = ctx.sampleRate * (duration || 0.2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.2));
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  function launch() {
    playTone(200, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(300, 0.1, 'sine', 0.2), 50);
  }

  function hit() {
    playTone(150, 0.1, 'square', 0.15);
    playNoise(0.08, 0.1);
  }

  function destroy() {
    playNoise(0.15, 0.2);
    playTone(400, 0.1, 'sine', 0.15);
  }

  function pigDie() {
    playTone(600, 0.1, 'sawtooth', 0.2);
    setTimeout(() => playTone(400, 0.15, 'sawtooth', 0.15), 80);
    playNoise(0.12, 0.15);
  }

  function win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.3, 'sine', 0.25), i * 150);
    });
  }

  function lose() {
    const notes = [400, 350, 300, 200];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 200);
    });
  }

  function star() {
    playTone(880, 0.2, 'sine', 0.2);
  }

  function ability() {
    playTone(500, 0.1, 'square', 0.2);
    playTone(700, 0.1, 'sine', 0.2);
  }

  return { init, launch, hit, destroy, pigDie, win, lose, star, ability };
}
