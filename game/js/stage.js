// Mictlan hellscape background. Static scenery is pre-rendered once per
// stage; only fire particles and the papel picado banner animate live.

import { W, H, FLOOR_Y, PALETTE } from './constants.js';

const VARIANTS = {
  goat: {
    sky: ['#1a0b12', '#2a0e16', '#3a1119', '#511822'],
    horizon: '#7a2a18',
    pyramid: '#120609',
    floor: '#241318',
    floorLine: '#3c1f26',
    lava: '#ff6a33',
    emitters: [40, 280],
  },
  devil: {
    sky: ['#0e0418', '#22081f', '#3a0c24', '#5c1128'],
    horizon: '#a03318',
    pyramid: '#0a030c',
    floor: '#1d0e16',
    floorLine: '#38161f',
    lava: '#ff4422',
    emitters: [30, 110, 210, 290],
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
  ctx.fillRect(250, 38, 22, 18);
  ctx.fillRect(254, 56, 14, 6);
  ctx.fillStyle = '#1a0b12';
  ctx.fillRect(254, 44, 5, 6);
  ctx.fillRect(263, 44, 5, 6);
  ctx.fillRect(258, 58, 2, 4);
  ctx.fillRect(262, 58, 2, 4);

  // step pyramids (Mictlan silhouettes)
  ctx.fillStyle = v.pyramid;
  const pyramid = (cx, baseY, size) => {
    for (let i = 0; i < 4; i++) {
      const w = size - i * (size / 4);
      ctx.fillRect(cx - w / 2, baseY - (i + 1) * 7, w, 7);
    }
  };
  pyramid(70, FLOOR_Y - 8, 90);
  pyramid(220, FLOOR_Y - 8, 60);
  pyramid(305, FLOOR_Y - 8, 70);

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

  // marigold (cempasúchil) clumps along the back of the floor
  for (let x = 6; x < W; x += 28) {
    ctx.fillStyle = '#2c5a2a';
    ctx.fillRect(x + 1, FLOOR_Y - 3, 2, 3);
    ctx.fillStyle = '#f6a623';
    ctx.fillRect(x, FLOOR_Y - 6, 4, 4);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(x + 1, FLOOR_Y - 5, 2, 2);
  }

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

export class Stage {
  constructor(id) {
    this.id = id;
    this.v = VARIANTS[id] ?? VARIANTS.goat;
    this.static = buildStatic(this.v);
    this.t = 0;
    this.flames = [];
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
  }

  draw(ctx) {
    ctx.drawImage(this.static, 0, 0);

    // rising flames
    for (const f of this.flames) {
      const frac = f.life / f.max;
      ctx.fillStyle = frac > 0.6 ? '#edf060' : frac > 0.3 ? '#ff6a33' : '#ff1d42';
      const s = frac > 0.5 ? 3 : 2;
      ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s);
    }

    // papel picado banner (animated wave) under the HUD
    const colors = [PALETTE.pink, PALETTE.orange, PALETTE.blue, PALETTE.mint];
    for (let i = 0; i < 16; i++) {
      const x = i * 20 + 4;
      const wave = Math.round(Math.sin(this.t / 40 + i * 0.8) * 2);
      const y = 30 + wave;
      ctx.fillStyle = '#555';
      ctx.fillRect(x, y - 1, 20, 1);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x + 3, y, 12, 7);
      ctx.fillRect(x + 5, y + 7, 8, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 6, y + 2, 2, 2);
      ctx.fillRect(x + 10, y + 2, 2, 2);
    }
  }
}
