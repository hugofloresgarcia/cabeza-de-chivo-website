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

// Square/saw blip sweeping from->to Hz. Optional sine-LFO pitch wobble
// (wobbleHz / wobbleDepth) gives everything a little dub-siren character.
function tone({
  type = 'square', from = 440, to = 440, dur = 0.1, vol = 0.18, delay = 0,
  wobbleHz = 0, wobbleDepth = 0,
}) {
  if (!ac) return;
  const t0 = now() + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  if (wobbleHz > 0) {
    const lfo = ac.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(wobbleHz, t0);
    const depth = ac.createGain();
    depth.gain.setValueAtTime(wobbleDepth, t0);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.02);
  }
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
function sirenSweep(lo, hi, dur = 1.2, vol = 0.15) {
  if (!ac) return;
  const t0 = now();
  const osc = ac.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime((lo + hi) / 2, t0);
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(dur < 0.5 ? 8 : 3.2, t0);
  const lfoDepth = ac.createGain();
  lfoDepth.gain.setValueAtTime((hi - lo) / 2, t0);
  lfo.connect(lfoDepth).connect(osc.frequency);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
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
    tone({ type: 'square', from: 220, to: 520, dur: 0.13, vol: 0.1, wobbleHz: 11, wobbleDepth: 26 });
  },
  special() {
    tone({ type: 'square', from: 330, to: 330, dur: 0.06, vol: 0.12 });
    tone({ type: 'square', from: 440, to: 440, dur: 0.06, vol: 0.12, delay: 0.06 });
    tone({ type: 'square', from: 660, to: 660, dur: 0.1, vol: 0.12, delay: 0.12 });
  },
  ko() {
    // dying siren: wobbling fall with a dub echo
    tone({ type: 'sawtooth', from: 400, to: 50, dur: 0.8, vol: 0.25, wobbleHz: 6, wobbleDepth: 45 });
    tone({ type: 'sawtooth', from: 300, to: 45, dur: 0.6, vol: 0.1, delay: 0.3, wobbleHz: 6, wobbleDepth: 30 });
    noise({ dur: 0.5, vol: 0.25, from: 3000, to: 100 });
  },
  announcer() {
    // descending doom sting with dub-delay echoes
    tone({ type: 'sawtooth', from: 110, to: 110, dur: 0.25, vol: 0.2, wobbleHz: 5, wobbleDepth: 7 });
    tone({ type: 'sawtooth', from: 82, to: 82, dur: 0.35, vol: 0.2, delay: 0.22, wobbleHz: 5, wobbleDepth: 6 });
    tone({ type: 'sawtooth', from: 82, to: 82, dur: 0.3, vol: 0.08, delay: 0.62, wobbleHz: 5, wobbleDepth: 6 });
    tone({ type: 'sawtooth', from: 82, to: 82, dur: 0.25, vol: 0.03, delay: 1.0, wobbleHz: 5, wobbleDepth: 6 });
  },
  select() {
    tone({ type: 'square', from: 880, to: 1100, dur: 0.08, vol: 0.1, wobbleHz: 14, wobbleDepth: 40 });
  },
  finishHim() {
    tone({ type: 'sawtooth', from: 65, to: 62, dur: 1.1, vol: 0.3, wobbleHz: 2.5, wobbleDepth: 5 });
    tone({ type: 'sine', from: 33, to: 31, dur: 1.1, vol: 0.25 });
    noise({ dur: 0.6, vol: 0.12, from: 800, to: 100 });
  },

  // ---- spooky boss voices ----
  bossTelegraph() {
    // low wobbling growl under every windup
    tone({ type: 'sawtooth', from: 55, to: 50, dur: 0.45, vol: 0.16, wobbleHz: 3.5, wobbleDepth: 9 });
    tone({ type: 'sine', from: 37, to: 34, dur: 0.45, vol: 0.14 });
  },
  bleat() {
    // dissonant goat scream: two saws a half-step apart, warbling down
    tone({ type: 'sawtooth', from: 460, to: 360, dur: 0.4, vol: 0.12, wobbleHz: 9, wobbleDepth: 30 });
    tone({ type: 'sawtooth', from: 488, to: 380, dur: 0.4, vol: 0.1, wobbleHz: 8, wobbleDepth: 26 });
    noise({ dur: 0.25, vol: 0.06, from: 2400, to: 900 });
  },
  teleport() {
    // shimmer up, moan down
    noise({ dur: 0.3, vol: 0.1, from: 300, to: 7000 });
    tone({ type: 'sine', from: 1300, to: 280, dur: 0.35, vol: 0.1, wobbleHz: 7, wobbleDepth: 80 });
  },
  fireRain() {
    // deep rumble with a sparkle on top
    tone({ type: 'sawtooth', from: 42, to: 38, dur: 0.8, vol: 0.22, wobbleHz: 2, wobbleDepth: 5 });
    noise({ dur: 0.7, vol: 0.14, from: 500, to: 80 });
    tone({ type: 'square', from: 1800, to: 2400, dur: 0.12, vol: 0.05, delay: 0.1, wobbleHz: 12, wobbleDepth: 120 });
    tone({ type: 'square', from: 2100, to: 2700, dur: 0.12, vol: 0.04, delay: 0.3, wobbleHz: 12, wobbleDepth: 120 });
  },

  // per-move boss telegraphs & strikes — all dissonant and wobbly
  goatSwipe() {
    // minor-second shimmer sliding down over a low groan
    tone({ type: 'sawtooth', from: 220, to: 170, dur: 0.35, vol: 0.09, wobbleHz: 8, wobbleDepth: 28 });
    tone({ type: 'sawtooth', from: 233, to: 180, dur: 0.35, vol: 0.07, wobbleHz: 7, wobbleDepth: 24 });
    tone({ type: 'sine', from: 46, to: 42, dur: 0.4, vol: 0.14 });
  },
  swipeStrike() {
    noise({ dur: 0.12, vol: 0.2, from: 4000, to: 600 });
    tone({ type: 'square', from: 140, to: 70, dur: 0.12, vol: 0.15, wobbleHz: 20, wobbleDepth: 30 });
  },
  goatRam() {
    // hoof stomps under a rising wobbling growl
    for (let i = 0; i < 3; i++) {
      tone({ type: 'sine', from: 70, to: 40, dur: 0.09, vol: 0.22, delay: i * 0.14 });
    }
    tone({ type: 'sawtooth', from: 45, to: 85, dur: 0.55, vol: 0.18, delay: 0.1, wobbleHz: 4.5, wobbleDepth: 12 });
    noise({ dur: 0.5, vol: 0.08, from: 300, to: 60, delay: 0.15 });
  },
  bleatWind() {
    // eerie detuned inhale before the scream
    tone({ type: 'sawtooth', from: 300, to: 430, dur: 0.3, vol: 0.06, wobbleHz: 6, wobbleDepth: 30 });
    tone({ type: 'sawtooth', from: 318, to: 455, dur: 0.3, vol: 0.05, wobbleHz: 6, wobbleDepth: 26 });
  },
  devilTrident() {
    // metallic scrape sliding down, growl underneath
    tone({ type: 'sawtooth', from: 1180, to: 520, dur: 0.4, vol: 0.06, wobbleHz: 10, wobbleDepth: 60 });
    tone({ type: 'sawtooth', from: 1208, to: 540, dur: 0.4, vol: 0.05, wobbleHz: 9, wobbleDepth: 55 });
    tone({ type: 'sawtooth', from: 52, to: 47, dur: 0.45, vol: 0.15, wobbleHz: 3, wobbleDepth: 8 });
  },
  tridentStrike() {
    noise({ dur: 0.1, vol: 0.22, from: 6000, to: 1500 });
    tone({ type: 'square', from: 800, to: 1600, dur: 0.08, vol: 0.07, wobbleHz: 30, wobbleDepth: 200 });
  },
  devilRam() {
    // heavier stomps, deeper roar
    for (let i = 0; i < 3; i++) {
      tone({ type: 'sine', from: 60, to: 34, dur: 0.1, vol: 0.24, delay: i * 0.16 });
    }
    tone({ type: 'sawtooth', from: 36, to: 66, dur: 0.6, vol: 0.2, wobbleHz: 3.5, wobbleDepth: 9 });
    noise({ dur: 0.6, vol: 0.1, from: 250, to: 50, delay: 0.1 });
  },
};

// ---- musical combat ------------------------------------------------------
// Latin minor harmony: there is always an ACTIVE chord, either i (Am) or
// V (E major). The attack buttons are pitched to the active chord —
// punch=root, kick=third, block=fifth — so attacking arpeggiates it.
// Landing the P,K,B combo triggers the special, which plays the full
// chord in the character's own synth patch, then moves the harmony on.

// Each fighter has a patch: 'organ' (Vee), 'saw' (Hugo), 'square'
// (Andres), 'siren' (Chase: short siren blips, no chords), 'drums'
// (Alex: pitched drum hits, special is a little fill).

function patchNote(patch, f, { dur = 0.1, vol = 0.1, delay = 0 } = {}) {
  switch (patch) {
    case 'saw':
      tone({ type: 'sawtooth', from: f, to: f, dur, vol, delay });
      break;
    case 'square': // Andres: bass register, always with a sub-octave sine
      tone({ type: 'square', from: f, to: f, dur, vol, delay });
      tone({ type: 'sine', from: f / 2, to: f / 2, dur: dur * 1.3, vol: vol * 1.3, delay });
      break;
    case 'organ':
      tone({ type: 'square', from: f, to: f, dur: dur * 1.6, vol: vol * 0.8, delay });
      tone({ type: 'sine', from: f * 2, to: f * 2, dur: dur * 1.6, vol: vol * 0.5, delay });
      tone({ type: 'sine', from: f * 3, to: f * 3, dur: dur * 1.6, vol: vol * 0.25, delay });
      break;
    default:
      tone({ type: 'square', from: f, to: f, dur, vol, delay });
  }
}

function drumHit(degree) {
  if (degree === 'root') {        // kick
    tone({ type: 'sine', from: 120, to: 45, dur: 0.12, vol: 0.3 });
  } else if (degree === 'third') { // snare
    noise({ dur: 0.08, vol: 0.22, from: 1800, to: 700 });
    tone({ type: 'triangle', from: 220, to: 180, dur: 0.05, vol: 0.1 });
  } else {                         // hat
    noise({ dur: 0.04, vol: 0.16, from: 8000, to: 6000 });
  }
}

const DEGREE_INDEX = { root: 0, third: 1, fifth: 2 };

// One pitched blip for an attack button press.
export function buttonNote(patch, degree) {
  if (!ac) return;
  if (patch === 'drums') return drumHit(degree);
  const ch = CHORDS[lastChord];
  const f = ch.triad[DEGREE_INDEX[degree]];
  if (patch === 'siren') return sirenSweep(f * 1.9, f * 2.1, 0.16, 0.1);
  if (patch === 'square') return patchNote(patch, f / 2, { dur: 0.13, vol: 0.16 }); // bass
  patchNote(patch, f * 2, { dur: 0.09, vol: 0.09 });
}

// The combo landed: play the active chord in the character's patch
// (or a siren sweep / drum fill), then advance the harmony.
export function specialSound(patch) {
  const ch = CHORDS[lastChord];
  if (patch === 'drums') {
    // little fill: kick kick snare, kick snare-snare
    const fill = ['root', 'root', 'third', 'root', 'third', 'third'];
    fill.forEach((d, i) => setTimeout(() => drumHit(d), i * 90));
  } else if (patch === 'siren') {
    sirenSweep(ch.siren[0], ch.siren[1]);
  } else if (patch === 'square') {
    // bass chord: triad an octave down over a deep root sub
    for (const f of ch.triad) {
      patchNote('square', f / 2, { dur: 0.5, vol: 0.11 });
    }
    tone({ type: 'sine', from: ch.bass, to: ch.bass, dur: 0.65, vol: 0.3 });
  } else {
    for (const f of ch.triad) {
      patchNote(patch, f, { dur: 0.45, vol: 0.1 });
      patchNote(patch, f * 2, { dur: 0.45, vol: 0.04 });
    }
  }
  pickChord();
}

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
