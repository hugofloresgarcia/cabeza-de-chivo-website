// LA PELEA DEL CHIVO — entry point.

import { W, H, QUERY } from './constants.js';
import { startLoop } from './loop.js';
import { initInput, onFirstGesture } from './input.js';
import { buildAnims } from './sprites.js';
import { unlock } from './audio.js';
import { CHARS, CHAR_ORDER, charAnimRows } from './data/chars.js';
import { BOSSES } from './data/bosses.js';
import { SceneManager } from './scenes.js';

const canvas = document.getElementById('game-canvas');
canvas.width = W;   // keep the backing store in sync with constants
canvas.height = H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---- Canvas scaling: integer factor when possible, letterboxed ----
function fitCanvas() {
  const stage = document.getElementById('game-stage');
  const availW = stage.clientWidth || window.innerWidth;
  // The stage shrink-wraps the canvas, so measure the real space left in
  // the viewport below it instead of asking the stage for its height.
  // Portrait phones use the Game Boy layout: reserve room for the
  // touch controls under the canvas.
  const gameboy = window.matchMedia('(orientation: portrait) and (max-width: 700px)').matches;
  const reserve = gameboy ? 230 : 16;
  const availH = Math.max(180, window.innerHeight - stage.getBoundingClientRect().top - reserve);
  let scale = Math.min(availW / W, availH / H);
  // Integer scaling for crispness on big screens; below 2x, fractional
  // scaling so phones aren't stuck with a tiny 1x canvas.
  if (scale >= 2) scale = Math.floor(scale);
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', fitCanvas);
fitCanvas();

// ---- Build all sprites once at boot ----
const assets = { chars: {}, bosses: {} };
for (const id of CHAR_ORDER) {
  assets.chars[id] = {
    def: CHARS[id],
    anims: buildAnims(charAnimRows(id), CHARS[id].palette),
  };
}
for (const id in BOSSES) {
  assets.bosses[id] = {
    def: BOSSES[id],
    anims: buildAnims(BOSSES[id].anims, BOSSES[id].palette, BOSSES[id].scale),
  };
}

// ---- Input & audio unlock (iOS needs a user gesture) ----
initInput();
onFirstGesture(unlock);

// ---- Scenes ----
const mgr = new SceneManager(assets);
window.__PELEA = mgr; // dev/debug handle

// Dev shortcut: /game/?char=hugo&stage=devil jumps straight into a fight.
const qChar = QUERY.get('char');
const qStage = QUERY.get('stage');
if (qChar && CHARS[qChar]) {
  mgr.go('fight', { charId: qChar, stage: BOSSES[qStage] ? qStage : 'goat' });
} else {
  mgr.go('title');
}

startLoop(
  () => mgr.update(),
  () => {
    ctx.imageSmoothingEnabled = false;
    mgr.draw(ctx);
  },
);
