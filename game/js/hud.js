// HUD: MK-style health bars, round timer, announcer text, hit sparks,
// screen shake.

import { W, H, PALETTE } from './constants.js';

export class FX {
  constructor() {
    this.sparks = [];
    this.shakeTicks = 0;
  }

  addSpark(x, y, kind = 'hit') {
    const n = kind === 'block' ? 4 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = kind === 'block' ? 0.8 : 1.6;
      this.sparks.push({
        x, y,
        vx: Math.cos(a) * sp * (0.5 + Math.random()),
        vy: Math.sin(a) * sp * (0.5 + Math.random()) - 0.4,
        life: 10 + Math.random() * 8,
        color: kind === 'block' ? PALETTE.blue : (Math.random() < 0.5 ? PALETTE.orange : PALETTE.red),
      });
    }
    if (kind === 'hit') this.shakeTicks = Math.max(this.shakeTicks, 4);
    if (kind === 'big') this.shakeTicks = 14;
  }

  update() {
    if (this.shakeTicks > 0) this.shakeTicks--;
    for (const s of this.sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08;
      s.life--;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }

  shakeOffset() {
    if (this.shakeTicks <= 0) return { x: 0, y: 0 };
    return {
      x: Math.round((Math.random() - 0.5) * 4),
      y: Math.round((Math.random() - 0.5) * 3),
    };
  }

  draw(ctx) {
    for (const s of this.sparks) {
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    }
  }
}

export class Announcer {
  constructor() {
    this.queue = [];
    this.current = null;
    this.t = 0;
  }

  say(text, { ticks = 90, size = 18, color = PALETTE.orange, flash = false, sub = null } = {}) {
    this.queue.push({ text, ticks, size, color, flash, sub });
  }

  // A sticky message stays until cleared (e.g. FINISH HIM!).
  stick(text, opts = {}) {
    this.clear();
    this.current = { text, ticks: Infinity, size: 18, color: PALETTE.red, flash: true, sub: null, ...opts };
    this.t = 0;
  }

  clear() {
    this.queue.length = 0;
    this.current = null;
  }

  get busy() {
    return this.current !== null || this.queue.length > 0;
  }

  update() {
    if (!this.current && this.queue.length) {
      this.current = this.queue.shift();
      this.t = 0;
    }
    if (this.current) {
      this.t++;
      if (this.t >= this.current.ticks) this.current = null;
    }
  }

  draw(ctx) {
    const c = this.current;
    if (!c) return;
    if (c.flash && Math.floor(this.t / 8) % 2 === 1) return;
    const y = Math.round(H * 0.45);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `bold ${c.size}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = PALETTE.black;
    ctx.fillText(c.text, W / 2 + 1, y + 1);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, W / 2, y);
    if (c.sub) {
      ctx.font = 'bold 8px "IBM Plex Mono", monospace';
      ctx.fillStyle = PALETTE.paper;
      ctx.fillText(c.sub, W / 2, y + 14);
    }
    ctx.restore();
  }
}

const BAR_W = 88;
const BAR_H = 9;

export class HealthBars {
  constructor(left, right) {
    this.left = left;   // fighters
    this.right = right;
    this.ghostL = 1;    // displayed fraction trailing actual damage
    this.ghostR = 1;
  }

  update() {
    const fl = this.left.health / this.left.maxHealth;
    const fr = this.right.health / this.right.maxHealth;
    this.ghostL = Math.max(fl, this.ghostL - 0.004);
    this.ghostR = Math.max(fr, this.ghostR - 0.004);
  }

  drawOne(ctx, fighter, ghost, x, mirror) {
    const frac = Math.max(0, fighter.health / fighter.maxHealth);
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(x - 1, 7, BAR_W + 2, BAR_H + 2);
    ctx.fillStyle = '#5a0f1d';
    ctx.fillRect(x, 8, BAR_W, BAR_H);
    // ghost (recent damage trail)
    ctx.fillStyle = PALETTE.paper;
    const gw = Math.round(BAR_W * ghost);
    ctx.fillRect(mirror ? x + BAR_W - gw : x, 8, gw, BAR_H);
    // current health
    ctx.fillStyle = frac > 0.3 ? PALETTE.mint : PALETTE.red;
    const w = Math.round(BAR_W * frac);
    ctx.fillRect(mirror ? x + BAR_W - w : x, 8, w, BAR_H);

    ctx.font = 'bold 7px "IBM Plex Mono", monospace';
    ctx.fillStyle = PALETTE.orange;
    ctx.textAlign = mirror ? 'right' : 'left';
    ctx.fillText(fighter.name, mirror ? x + BAR_W : x, 24);
  }

  draw(ctx) {
    this.drawOne(ctx, this.left, this.ghostL, 8, false);
    this.drawOne(ctx, this.right, this.ghostR, W - 8 - BAR_W, true);
  }
}

export function drawTimer(ctx, seconds) {
  ctx.font = 'bold 12px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.black;
  ctx.fillText(String(seconds).padStart(2, '0'), W / 2 + 1, 18 + 1);
  ctx.fillStyle = seconds <= 10 ? PALETTE.red : PALETTE.paper;
  ctx.fillText(String(seconds).padStart(2, '0'), W / 2, 18);
}
