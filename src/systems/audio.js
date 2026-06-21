let audioCtx = null;
let initialized = false;

function init() {
  if (initialized) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  initialized = true;
}

function resume() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume = 0.08) {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

function playLaunch() {
  playTone(300, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(500, 0.1, 'sine', 0.1), 50);
}

function playHit() {
  playNoise(0.1, 0.1);
  playTone(200, 0.08, 'square', 0.08);
}

function playBreak() {
  playNoise(0.15, 0.12);
  playTone(400, 0.12, 'triangle', 0.1);
  setTimeout(() => playTone(250, 0.1, 'triangle', 0.08), 60);
}

function playPigDeath() {
  playTone(600, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(400, 0.15, 'sine', 0.1), 80);
  setTimeout(() => playTone(200, 0.2, 'sine', 0.08), 160);
}

function playExplosion() {
  playNoise(0.4, 0.2);
  playTone(80, 0.3, 'sawtooth', 0.15);
}

function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'sine', 0.12), i * 150);
  });
}

function playLose() {
  const notes = [400, 350, 300, 200];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'sine', 0.1), i * 200);
  });
}

export { init, resume, playLaunch, playHit, playBreak, playPigDeath, playExplosion, playWin, playLose };
