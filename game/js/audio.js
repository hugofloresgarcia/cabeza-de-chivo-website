// WebAudio chiptune SFX. The AudioContext is created lazily on the first
// user gesture (iOS requirement) — call unlock() from an input handler.

let ac = null;

export function unlock() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
}

function now() {
  return ac ? ac.currentTime : 0;
}

// Square/saw blip sweeping from->to Hz.
function tone({ type = 'square', from = 440, to = 440, dur = 0.1, vol = 0.18, delay = 0 }) {
  if (!ac) return;
  const t0 = now() + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// White-noise burst through a sweeping lowpass.
function noise({ dur = 0.12, vol = 0.2, from = 3000, to = 400, delay = 0 }) {
  if (!ac) return;
  const t0 = now() + delay;
  const len = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  hit() {
    noise({ dur: 0.1, vol: 0.3, from: 2500, to: 300 });
    tone({ type: 'square', from: 160, to: 60, dur: 0.12, vol: 0.22 });
  },
  block() {
    tone({ type: 'square', from: 700, to: 500, dur: 0.06, vol: 0.12 });
    noise({ dur: 0.05, vol: 0.1, from: 5000, to: 2000 });
  },
  whoosh() {
    noise({ dur: 0.08, vol: 0.07, from: 1200, to: 4000 });
  },
  jump() {
    tone({ type: 'square', from: 220, to: 520, dur: 0.12, vol: 0.1 });
  },
  special() {
    tone({ type: 'square', from: 330, to: 330, dur: 0.06, vol: 0.12 });
    tone({ type: 'square', from: 440, to: 440, dur: 0.06, vol: 0.12, delay: 0.06 });
    tone({ type: 'square', from: 660, to: 660, dur: 0.1, vol: 0.12, delay: 0.12 });
  },
  ko() {
    tone({ type: 'sawtooth', from: 400, to: 50, dur: 0.7, vol: 0.25 });
    noise({ dur: 0.5, vol: 0.25, from: 3000, to: 100 });
  },
  announcer() {
    // descending doom sting
    tone({ type: 'sawtooth', from: 110, to: 110, dur: 0.25, vol: 0.2 });
    tone({ type: 'sawtooth', from: 82, to: 82, dur: 0.35, vol: 0.2, delay: 0.22 });
  },
  select() {
    tone({ type: 'square', from: 880, to: 1100, dur: 0.07, vol: 0.1 });
  },
  finishHim() {
    tone({ type: 'sawtooth', from: 65, to: 62, dur: 0.9, vol: 0.3 });
    noise({ dur: 0.6, vol: 0.12, from: 800, to: 100 });
  },
};

// ---- MUSIC SLOT ----------------------------------------------------------
// To add fight music later, drop a track in /assets/audio/ and call
// playMusic('/assets/audio/your-track.mp3') from the fight scene.
// (e.g. the existing /assets/audio/chivo-delay.mp3)
let musicEl = null;
export function playMusic(url) {
  stopMusic();
  musicEl = new Audio(url);
  musicEl.loop = true;
  musicEl.volume = 0.5;
  musicEl.play().catch(() => {});
}
export function stopMusic() {
  if (musicEl) {
    musicEl.pause();
    musicEl = null;
  }
}
