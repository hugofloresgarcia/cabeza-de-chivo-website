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

// ---- shared harmony: A minor, i (Am) and V (E major) ----
const CHORDS = {
  i: {
    bass: 55,                          // A1
    power: [110, 164.8, 220],          // A2 E3 A3
    triad: [220, 261.6, 329.6],        // A3 C4 E4
    siren: [440, 659.3],               // A4 <-> E5
  },
  V: {
    bass: 41.2,                        // E1
    power: [82.4, 123.5, 164.8],       // E2 B2 E3
    triad: [164.8, 207.7, 246.9],      // E3 G#3 B3
    siren: [329.6, 493.9],             // E4 <-> B4
  },
};

// A continuous siren: square wave whose pitch is swept between lo and hi
// by a sine LFO, decaying away like a dub delay tail.
function sirenSweep(lo, hi) {
  if (!ac) return;
  const t0 = now();
  const dur = 1.2;
  const osc = ac.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime((lo + hi) / 2, t0);
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(3.2, t0);
  const lfoDepth = ac.createGain();
  lfoDepth.gain.setValueAtTime((hi - lo) / 2, t0);
  lfo.connect(lfoDepth).connect(osc.frequency);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, t0);
  gain.gain.exponentialRampToValueAtTime(0.002, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  lfo.start(t0);
  osc.stop(t0 + dur + 0.05);
  lfo.stop(t0 + dur + 0.05);
}

let lastChord = 'V';
function pickChord() {
  // a V wants to resolve home; from i it's a coin flip
  const goI = lastChord === 'V' ? Math.random() < 0.7 : Math.random() < 0.5;
  lastChord = goI ? 'i' : 'V';
  return CHORDS[lastChord];
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

  // ---- instrument-themed special casts (each one a musical phrase) ----
  sticks() { // Alex: drumstick count-off, 1-2-3-4
    for (let i = 0; i < 4; i++) {
      noise({ dur: 0.03, vol: 0.28, from: 4200 + i * 300, to: 3200, delay: i * 0.11 });
    }
  },
  // Latin minor harmony: every special cast plays material from EITHER
  // the i chord (Am) or the V chord (E major). The chord is chosen per
  // cast — after a V it usually resolves to i — so mashing specials
  // comps a loose i-V montuno instead of the same lick every time.
  bassdrop() { // Andres: bass tumbao on the chord (root-fifth-root-octave)
    const ch = pickChord();
    const r = ch.bass;
    const riff = [[r, 0], [r * 1.5, 0.12], [r, 0.24], [r * 2, 0.4]];
    for (const [f, d] of riff) {
      tone({ type: 'sawtooth', from: f, to: f, dur: 0.14, vol: 0.26, delay: d });
      tone({ type: 'square', from: f * 2, to: f * 2, dur: 0.14, vol: 0.08, delay: d });
    }
  },
  siren() { // Chase: dub siren — one oscillator, LFO wobbling the pitch
    const ch = pickChord();
    const [lo, hi] = ch.siren;
    sirenSweep(lo, hi);
  },
  organ() { // Vee: sustained organ stab on the chord
    const ch = pickChord();
    for (const f of ch.triad) {
      tone({ type: 'square', from: f, to: f, dur: 0.5, vol: 0.08 });
      tone({ type: 'sawtooth', from: f * 2, to: f * 2, dur: 0.5, vol: 0.04 });
    }
  },
  feedback() { // Hugo: power chord stab on the chord into noise feedback
    const ch = pickChord();
    for (const f of ch.power) {
      tone({ type: 'sawtooth', from: f, to: f, dur: 0.35, vol: 0.13 });
    }
    noise({ dur: 0.35, vol: 0.14, from: 600, to: 5000, delay: 0.08 });
    tone({ type: 'sawtooth', from: 1200, to: 2600, dur: 0.3, vol: 0.06, delay: 0.12 });
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
