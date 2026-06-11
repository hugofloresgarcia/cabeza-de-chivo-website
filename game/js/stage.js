// Mictlan hellscape background. Static scenery is pre-rendered once per
// stage; only fire particles and the papel picado banner animate live.

import { W, H, FLOOR_Y } from './constants.js';

const VARIANTS = {
  goat: {
    sky: ['#1a0b12', '#2a0e16', '#3a1119', '#511822'],
    horizon: '#7a2a18',
    pyramid: '#120609',
    floor: '#241318',
    floorLine: '#3c1f26',
    lava: '#ff6a33',
    emitters: [36, 200],
  },
  devil: {
    sky: ['#0e0418', '#22081f', '#3a0c24', '#5c1128'],
    horizon: '#a03318',
    pyramid: '#0a030c',
    floor: '#1d0e16',
    floorLine: '#38161f',
    lava: '#ff4422',
    emitters: [26, 90, 150, 214],
  },
};

function buildStatic(v) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // banded sky
  const bandH = Math.ceil(FLOOR_Y / v.sky.length / 2);
  for (let y = 0; y < FLOOR_Y; y += bandH) {
    const i = Math.min(v.sky.length - 1, Math.floor((y / FLOOR_Y) * v.sky.length));
    ctx.fillStyle = v.sky[i];
    ctx.fillRect(0, y, W, bandH);
  }
  // horizon glow
  ctx.fillStyle = v.horizon;
  ctx.fillRect(0, FLOOR_Y - 26, W, 26);
  ctx.fillStyle = v.sky[v.sky.length - 1];
  for (let x = 0; x < W; x += 8) {
    ctx.fillRect(x + (Math.floor(x / 8) % 2) * 4, FLOOR_Y - 26, 4, 4);
  }

  // skull moon
  ctx.fillStyle = '#d8cbb8';
  ctx.fillRect(176, 42, 22, 18);
  ctx.fillRect(180, 60, 14, 6);
  ctx.fillStyle = '#1a0b12';
  ctx.fillRect(180, 48, 5, 6);
  ctx.fillRect(189, 48, 5, 6);
  ctx.fillRect(184, 62, 2, 4);
  ctx.fillRect(188, 62, 2, 4);

  // step pyramids (Mictlan silhouettes)
  ctx.fillStyle = v.pyramid;
  const pyramid = (cx, baseY, size) => {
    for (let i = 0; i < 4; i++) {
      const w = size - i * (size / 4);
      ctx.fillRect(cx - w / 2, baseY - (i + 1) * 7, w, 7);
    }
  };
  pyramid(60, FLOOR_Y - 8, 90);
  pyramid(160, FLOOR_Y - 8, 56);
  pyramid(225, FLOOR_Y - 8, 66);

  // floor
  ctx.fillStyle = v.floor;
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  ctx.fillStyle = v.floorLine;
  ctx.fillRect(0, FLOOR_Y, W, 2);
  // floor tiles
  for (let x = 0; x < W; x += 24) {
    ctx.fillRect(x, FLOOR_Y + 8, 1, H - FLOOR_Y);
  }
  // lava cracks
  ctx.fillStyle = v.lava;
  for (let x = 10; x < W; x += 46) {
    ctx.fillRect(x, FLOOR_Y + 6, 8, 1);
    ctx.fillRect(x + 6, FLOOR_Y + 10, 6, 1);
    ctx.fillRect(x + 2, FLOOR_Y + 14, 9, 1);
  }

  // scattered bones and little skulls along the back of the floor
  for (let x = 14; x < W; x += 42) {
    ctx.fillStyle = '#cfc4ae';
    ctx.fillRect(x, FLOOR_Y - 4, 5, 4);       // skull
    ctx.fillRect(x + 1, FLOOR_Y, 3, 1);       // jaw
    ctx.fillStyle = '#1a0b12';
    ctx.fillRect(x + 1, FLOOR_Y - 3, 1, 1);   // eye sockets
    ctx.fillRect(x + 3, FLOOR_Y - 3, 1, 1);
    ctx.fillStyle = '#b8ac96';
    ctx.fillRect(x + 9, FLOOR_Y - 2, 8, 1);   // long bone
    ctx.fillRect(x + 8, FLOOR_Y - 3, 2, 2);
    ctx.fillRect(x + 16, FLOOR_Y - 3, 2, 2);
  }

  // carved stone glyph face recessed into the big pyramid
  ctx.fillStyle = '#1d0d12';
  ctx.fillRect(58, FLOOR_Y - 27, 24, 16);
  ctx.fillStyle = '#2e151c';
  ctx.fillRect(60, FLOOR_Y - 25, 20, 12);
  ctx.fillStyle = '#1d0d12';
  ctx.fillRect(63, FLOOR_Y - 21, 4, 3);       // eye holes (glow drawn live)
  ctx.fillRect(73, FLOOR_Y - 21, 4, 3);
  ctx.fillRect(67, FLOOR_Y - 16, 6, 2);       // mouth

  // candles on small ledges at the edges
  for (const cx of [10, W - 14]) {
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(cx - 3, FLOOR_Y - 22, 12, 3);
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(cx, FLOOR_Y - 30, 3, 8);
    ctx.fillRect(cx + 5, FLOOR_Y - 27, 3, 5);
  }

  return canvas;
}

// Pairs of eyes that blink open in the dark (Scooby-Doo style).
const EYE_SPOTS = [
  { x: 64, y: FLOOR_Y - 20, offset: 0 },   // inside the pyramid glyph face
  { x: 158, y: FLOOR_Y - 18, offset: 140 },
  { x: 222, y: FLOOR_Y - 16, offset: 260 },
  { x: 110, y: FLOOR_Y - 14, offset: 330 },
];

export class Stage {
  constructor(id) {
    this.id = id;
    this.v = VARIANTS[id] ?? VARIANTS.goat;
    this.static = buildStatic(this.v);
    this.t = 0;
    this.flames = [];
    this.bat = null;
    // slow drifting fog wisps
    this.fog = Array.from({ length: 4 }, (_, i) => ({
      x: i * 70, y: FLOOR_Y - 92 + i * 16, w: 50 + i * 14, speed: 0.08 + i * 0.04,
    }));
  }

  update() {
    this.t++;
    // brazier/candle flames + lava sparks
    if (this.t % 3 === 0 && this.flames.length < 40) {
      const ex = this.v.emitters[Math.floor(Math.random() * this.v.emitters.length)];
      this.flames.push({
        x: ex + (Math.random() - 0.5) * 8,
        y: FLOOR_Y + 4,
        vy: -(0.3 + Math.random() * 0.5),
        life: 20 + Math.random() * 25,
        max: 45,
      });
    }
    for (const f of this.flames) {
      f.y += f.vy;
      f.x += (Math.random() - 0.5) * 0.6;
      f.life--;
    }
    this.flames = this.flames.filter((f) => f.life > 0);

    for (const w of this.fog) {
      w.x += w.speed;
      if (w.x - w.w > W) w.x = -w.w;
    }

    // the occasional bat crossing the sky
    if (!this.bat && Math.random() < 0.003) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.bat = { x: dir === 1 ? -8 : W + 8, y: 46 + Math.random() * 40, dir, t: 0 };
    }
    if (this.bat) {
      this.bat.t++;
      this.bat.x += this.bat.dir * 1.3;
      this.bat.y += Math.sin(this.bat.t / 5) * 0.8;
      if (this.bat.x < -12 || this.bat.x > W + 12) this.bat = null;
    }
  }

  draw(ctx) {
    ctx.drawImage(this.static, 0, 0);

    // fog wisps drifting through the ruins
    ctx.fillStyle = 'rgba(122, 96, 134, 0.16)';
    for (const w of this.fog) {
      ctx.fillRect(Math.round(w.x), w.y, w.w, 7);
      ctx.fillRect(Math.round(w.x) + 8, w.y - 3, w.w - 20, 3);
    }

    // blinking eyes in the shadows
    for (const e of EYE_SPOTS) {
      const phase = (this.t + e.offset) % 420;
      if (phase > 150) continue;        // hidden most of the time
      if (phase % 50 > 44) continue;    // quick blink
      ctx.fillStyle = e.offset % 2 === 0 ? '#ff1d42' : '#edf060';
      ctx.fillRect(e.x, e.y, 2, 2);
      ctx.fillRect(e.x + 6, e.y, 2, 2);
    }

    // bat silhouette, wings alternating
    if (this.bat) {
      const bx = Math.round(this.bat.x);
      const by = Math.round(this.bat.y);
      ctx.fillStyle = '#0a0306';
      ctx.fillRect(bx - 1, by, 3, 2);
      const up = Math.floor(this.bat.t / 4) % 2 === 0;
      ctx.fillRect(bx - 5, up ? by - 2 : by + 1, 4, 2);
      ctx.fillRect(bx + 2, up ? by - 2 : by + 1, 4, 2);
    }

    // rising flames
    for (const f of this.flames) {
      const frac = f.life / f.max;
      ctx.fillStyle = frac > 0.6 ? '#edf060' : frac > 0.3 ? '#ff6a33' : '#ff1d42';
      const s = frac > 0.5 ? 3 : 2;
      ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s);
    }
  }
}
