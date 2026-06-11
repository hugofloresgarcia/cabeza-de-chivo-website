// Scene manager + all screens.
// Flow: TITLE -> SELECT -> VS(goat) -> FIGHT(goat) -> TRANSITION
//       -> VS(devil) -> FIGHT(devil) -> VICTORY | GAMEOVER (continue).

import {
  W, H, PALETTE, FLOOR_Y, ROUND_SECONDS, FINISH_HIM_SECONDS,
  DIFFICULTIES, settings,
} from './constants.js';
import { pad, consumePressed } from './input.js';
import { Fighter, Projectile, tryHit, resolvePush } from './fighter.js';
import { Boss, FireColumn } from './boss.js';
import { Stage } from './stage.js';
import { FX, Announcer, HealthBars, drawTimer } from './hud.js';
import { sfx, buttonNote, specialSound } from './audio.js';
import { CHARS, CHAR_ORDER } from './data/chars.js';

const FONT = '"IBM Plex Mono", monospace';
const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function anyAttackPressed() {
  return pad.punch.pressed || pad.kick.pressed || pad.block.pressed || pad.special.pressed;
}

function text(ctx, str, x, y, { size = 8, color = PALETTE.paper, align = 'center', bold = true } = {}) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

export class SceneManager {
  constructor(assets) {
    this.assets = assets; // { chars: {id:{def,anims}}, bosses: {id:{def,anims}} }
    this.scenes = {
      title: new TitleScene(this),
      select: new SelectScene(this),
      vs: new VsScene(this),
      fight: new FightScene(this),
      transition: new TransitionScene(this),
      victory: new VictoryScene(this),
      gameover: new GameOverScene(this),
    };
    this.current = null;
  }

  go(name, params = {}) {
    this.current = this.scenes[name];
    this.current.enter(params);
  }

  update() {
    this.current?.update();
    consumePressed();
  }

  draw(ctx) {
    this.current?.draw(ctx);
  }
}

// ---------------------------------------------------------------- TITLE ----
const DIFF_ORDER = ['easy', 'normal', 'hard'];

class TitleScene {
  constructor(mgr) { this.mgr = mgr; }

  enter() {
    this.t = 0;
    this.diffIndex = DIFF_ORDER.indexOf(settings.difficulty);
    this.flames = [];
  }

  update() {
    this.t++;
    if (pad.left.pressed) { this.diffIndex = (this.diffIndex + 2) % 3; sfx.select(); }
    if (pad.right.pressed) { this.diffIndex = (this.diffIndex + 1) % 3; sfx.select(); }
    settings.difficulty = DIFF_ORDER[this.diffIndex];
    if (anyAttackPressed() || pad.up.pressed) {
      sfx.announcer();
      this.mgr.go('select');
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#12060c';
    ctx.fillRect(0, 0, W, H);

    // ember backdrop
    if (this.t % 4 === 0 && this.flames.length < 30) {
      this.flames.push({ x: Math.random() * W, y: H + 2, vy: -0.4 - Math.random() * 0.6, life: 90 });
    }
    for (const f of this.flames) { f.y += f.vy; f.life--; }
    this.flames = this.flames.filter((f) => f.life > 0);
    for (const f of this.flames) {
      ctx.fillStyle = f.life > 45 ? '#ff6a33' : '#5a1a22';
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
    }

    text(ctx, 'LA PELEA', W / 2, 72, { size: 24, color: PALETTE.red });
    text(ctx, 'DEL CHIVO', W / 2, 98, { size: 24, color: PALETTE.red });
    text(ctx, 'CABEZA DE CHIVO presenta', W / 2, 40, { size: 8, color: PALETTE.pink });

    const diffLabel = DIFFICULTIES[DIFF_ORDER[this.diffIndex]].label;
    text(ctx, `< ${diffLabel} >`, W / 2, 134, { size: 12, color: PALETTE.orange });

    // controls help — the special is the J,K,L arpeggio combo
    if (IS_TOUCH) {
      text(ctx, 'especial: golpe, patada,', W / 2, 160, { size: 8, color: PALETTE.blue });
      text(ctx, 'escudo seguidos', W / 2, 172, { size: 8, color: PALETTE.blue });
    } else {
      text(ctx, 'WASD o flechas: mover/saltar', W / 2, 160, { size: 7, color: PALETTE.blue });
      text(ctx, 'J punch · K kick · L block', W / 2, 172, { size: 7, color: PALETTE.blue });
      text(ctx, 'especial: J,K,L seguidos (arpegio)', W / 2, 184, { size: 7, color: PALETTE.orange });
    }

    if (Math.floor(this.t / 30) % 2 === 0) {
      text(ctx, IS_TOUCH ? 'TOCA PARA EMPEZAR' : 'PRESS ATTACK', W / 2, 206, { size: 10, color: PALETTE.paper });
    }
  }
}

// --------------------------------------------------------------- SELECT ----
class SelectScene {
  constructor(mgr) { this.mgr = mgr; }

  enter() {
    this.cursor = 0;
    this.t = 0;
  }

  update() {
    this.t++;
    if (pad.left.pressed) { this.cursor = (this.cursor + 4) % 5; sfx.select(); }
    if (pad.right.pressed) { this.cursor = (this.cursor + 1) % 5; sfx.select(); }
    if (anyAttackPressed()) {
      sfx.announcer();
      this.mgr.go('vs', { charId: CHAR_ORDER[this.cursor], stage: 'goat' });
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#12060c';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'ELIGE TU LUCHADOR', W / 2, 20, { size: 11, color: PALETTE.orange });

    const boxW = 38, boxH = 42, gap = 8;
    const totalW = 5 * boxW + 4 * gap;
    const x0 = (W - totalW) / 2;

    CHAR_ORDER.forEach((id, i) => {
      const { def, anims } = this.mgr.assets.chars[id];
      const x = x0 + i * (boxW + gap);
      const y = 34;
      const selected = i === this.cursor;

      ctx.fillStyle = selected ? '#5a2230' : '#33181f';
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeStyle = selected && Math.floor(this.t / 8) % 2 === 0 ? PALETTE.orange : PALETTE.red;
      ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);

      // face crop from idle frame, scaled 3x
      const frame = anims.idle.frames[0];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frame, 6, 0, 12, 13, x + 1, y + 3, 36, 39);

      text(ctx, def.name, x + boxW / 2, y + boxH + 10, {
        size: 7, color: selected ? PALETTE.orange : PALETTE.paper,
      });
    });

    // selected character: preview + stats
    const sel = this.mgr.assets.chars[CHAR_ORDER[this.cursor]];
    const previewAnim = sel.anims.idle;
    const fi = Math.floor((this.t * previewAnim.fps) / 60) % previewAnim.frames.length;
    ctx.drawImage(previewAnim.frames[fi], 32, 120, 54, 72);

    text(ctx, sel.def.name, 104, 136, { size: 12, color: PALETTE.orange, align: 'left' });
    text(ctx, sel.def.role, 104, 148, { size: 7, color: PALETTE.pink, align: 'left' });
    text(ctx, `especial: ${sel.def.special.label}`, 104, 160, { size: 7, color: PALETTE.blue, align: 'left' });

    const stats = sel.def.stats;
    const bars = [
      ['VEL', stats.speed / 1.2], ['POW', stats.power / 1.2], ['VIDA', stats.hp / 115],
    ];
    bars.forEach(([label, frac], i) => {
      const y = 170 + i * 11;
      text(ctx, label, 104, y + 6, { size: 6, color: PALETTE.paper, align: 'left' });
      ctx.fillStyle = '#3a1119';
      ctx.fillRect(136, y, 64, 6);
      ctx.fillStyle = PALETTE.mint;
      ctx.fillRect(136, y, Math.round(64 * Math.min(1, frac)), 6);
    });
  }
}

// ------------------------------------------------------------------- VS ----
class VsScene {
  constructor(mgr) { this.mgr = mgr; }

  enter({ charId, stage }) {
    this.charId = charId;
    this.stage = stage;
    this.t = 0;
  }

  update() {
    if (++this.t > 140 || anyAttackPressed()) {
      this.mgr.go('fight', { charId: this.charId, stage: this.stage });
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#12060c';
    ctx.fillRect(0, 0, W, H);

    const char = this.mgr.assets.chars[this.charId];
    const boss = this.mgr.assets.bosses[this.stage];

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(char.anims.idle.frames[0], 26, 70, 48, 64);
    const bossFrame = boss.anims.idle.frames[0];
    ctx.drawImage(bossFrame, W - 16 - bossFrame.width, 160 - bossFrame.height,
      bossFrame.width, bossFrame.height);

    text(ctx, char.def.name, 50, 156, { size: 10, color: PALETTE.orange });
    text(ctx, boss.def.name, 184, 156, { size: 10, color: PALETTE.red });
    if (Math.floor(this.t / 10) % 2 === 0) {
      text(ctx, 'VS', W / 2, 110, { size: 22, color: PALETTE.paper });
    }
    text(ctx, boss.def.introText, W / 2, 196, { size: 8, color: PALETTE.pink });
  }
}

// ---------------------------------------------------------------- FIGHT ----
class FightScene {
  constructor(mgr) { this.mgr = mgr; }

  enter({ charId, stage }) {
    const assets = this.mgr.assets;
    this.charId = charId;
    this.stageId = stage;

    const char = assets.chars[charId];
    this.player = new Fighter({
      id: charId,
      name: char.def.name,
      anims: char.anims,
      stats: char.def.stats,
      special: char.def.special,
      x: 55,
      facing: 1,
    });

    const bossAsset = assets.bosses[stage];
    this.boss = new Boss(bossAsset.def, 185, -1);
    this.boss.anims = bossAsset.anims;

    this.stage = new Stage(stage);
    this.fx = new FX();
    this.announcer = new Announcer();
    this.bars = new HealthBars(this.player, this.boss);

    this.projectiles = [];
    this.hazards = [];

    this.world = {
      sfx,
      note: (patch, degree) => buttonNote(patch, degree),
      special: (patch) => specialSound(patch),
      addSpark: (x, y, kind) => this.fx.addSpark(x, y, kind),
      spawnProjectile: (owner, sp) => this.projectiles.push(new Projectile(owner, sp)),
      spawnFireRain: (owner, dmg) => {
        const px = this.player.x;
        for (const x of [px, px - 40, px + 40]) {
          if (x > 4 && x < W - 4) this.hazards.push(new FireColumn(x, dmg));
        }
        sfx.fireRain();
      },
    };

    this.t = 0;
    this.timerTicks = ROUND_SECONDS * 60;
    this.phase = 'intro'; // intro | fight | finishHim | done
    this.finishTicks = 0;
    this.doneTicks = 0;
    this.slowmo = 0;
    this.flash = 0;

    this.player.frozen = true;
    this.boss.frozen = true;
    this.announcer.say(stage === 'goat' ? 'ROUND 1' : 'ROUND FINAL', { ticks: 70, size: 16 });
    this.announcer.say('¡PELEA!', { ticks: 45, size: 22, color: PALETTE.red });
    sfx.announcer();
  }

  update() {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.t % 2 === 0) return; // half-speed world
    }

    this.stage.update();
    this.fx.update();
    this.announcer.update();
    this.bars.update();

    if (this.phase === 'intro') {
      // unfreeze once the ROUND text gives way to ¡PELEA!
      if (this.t >= 70) {
        this.player.frozen = false;
        this.boss.frozen = false;
        this.phase = 'fight';
      }
      return;
    }

    // fighters
    this.player.update(pad, this.boss, this.world);
    const nullPad = NULL_PAD;
    this.boss.update(nullPad, this.player, this.world);
    resolvePush(this.player, this.boss);
    tryHit(this.player, this.boss, this.world);
    tryHit(this.boss, this.player, this.world);

    for (const p of this.projectiles) p.update([this.player, this.boss], this.world);
    this.projectiles = this.projectiles.filter((p) => p.alive);
    for (const hz of this.hazards) hz.update([this.player], this.world);
    this.hazards = this.hazards.filter((hz) => hz.alive);

    if (this.phase === 'fight') {
      if (--this.timerTicks <= 0) return this.timeout();

      if (this.boss.state === 'dizzy') {
        this.phase = 'finishHim';
        this.finishTicks = FINISH_HIM_SECONDS * 60;
        this.announcer.stick('FINISH HIM!', { size: 20 });
        sfx.finishHim();
        return;
      }
      if (this.player.state === 'ko' && this.player.health <= 0) {
        this.phase = 'done';
        this.outcome = 'lose';
        this.announcer.clear();
        this.announcer.say('K.O.', { ticks: 90, size: 24, color: PALETTE.red });
        sfx.ko();
      }
    } else if (this.phase === 'finishHim') {
      if (this.boss.state === 'ko') {
        // the finishing blow landed
        this.phase = 'done';
        this.outcome = 'win';
        this.announcer.clear();
        this.announcer.say(this.boss.def.finishText, { ticks: 140, size: 12, color: PALETTE.orange });
        this.slowmo = 60;
        this.flash = 10;
        this.fx.addSpark(this.boss.x, this.boss.y - 30, 'big');
        sfx.ko();
      } else if (--this.finishTicks <= 0) {
        // window expired: boss collapses anyway
        this.boss.setState('ko');
      }
    } else if (this.phase === 'done') {
      if (++this.doneTicks > 160) {
        if (this.outcome === 'win') {
          if (this.stageId === 'goat') this.mgr.go('transition', { charId: this.charId });
          else this.mgr.go('victory', { charId: this.charId });
        } else {
          this.mgr.go('gameover', { charId: this.charId, stage: this.stageId });
        }
      }
    }
  }

  timeout() {
    const pf = this.player.health / this.player.maxHealth;
    const bf = this.boss.health / this.boss.maxHealth;
    this.phase = 'done';
    if (pf >= bf) {
      this.outcome = 'win';
      this.boss.setState('ko');
      this.announcer.say('TIEMPO', { ticks: 90, size: 16 });
    } else {
      this.outcome = 'lose';
      this.player.setState('ko');
      this.announcer.say('TIEMPO', { ticks: 90, size: 16, color: PALETTE.red });
    }
  }

  draw(ctx) {
    const shake = this.fx.shakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    this.stage.draw(ctx);
    for (const hz of this.hazards) hz.draw(ctx);

    // draw boss first so the player reads in front
    this.boss.draw(ctx);
    this.player.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
    this.fx.draw(ctx);

    ctx.restore();

    this.bars.draw(ctx);
    drawTimer(ctx, Math.max(0, Math.ceil(this.timerTicks / 60)));
    this.announcer.draw(ctx);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash / 12})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.phase === 'fight' && this.player.specialCd > 0) {
      ctx.fillStyle = PALETTE.blue;
      ctx.fillRect(8, 26, Math.round(40 * (1 - this.player.specialCd / 90)), 2);
    }
  }
}

const NULL_PAD = Object.fromEntries(
  ['left', 'right', 'up', 'down', 'punch', 'kick', 'block', 'special']
    .map((k) => [k, { held: false, pressed: false }]),
);

// ----------------------------------------------------------- TRANSITION ----
class TransitionScene {
  constructor(mgr) { this.mgr = mgr; }

  enter({ charId }) {
    this.charId = charId;
    this.t = 0;
    sfx.finishHim();
  }

  update() {
    if (++this.t > 180) this.mgr.go('vs', { charId: this.charId, stage: 'devil' });
  }

  draw(ctx) {
    ctx.fillStyle = '#0a030c';
    ctx.fillRect(0, 0, W, H);
    // rising flames wall
    for (let x = 0; x < W; x += 6) {
      const hgt = 20 + Math.abs(Math.sin(x * 0.7 + this.t / 8)) * 30 + this.t / 3;
      ctx.fillStyle = (x + this.t) % 12 < 6 ? '#ff6a33' : '#ff1d42';
      ctx.fillRect(x, H - hgt, 4, hgt);
    }
    if (this.t > 50 && Math.floor(this.t / 12) % 2 === 0) {
      text(ctx, '¡EL DIABLO APARECE!', W / 2, 104, { size: 12, color: PALETTE.red });
    }
  }
}

// -------------------------------------------------------------- VICTORY ----
class VictoryScene {
  constructor(mgr) { this.mgr = mgr; }

  enter({ charId }) {
    this.charId = charId;
    this.t = 0;
    this.confetti = [];
    for (let i = 0; i < 60; i++) {
      this.confetti.push({
        x: Math.random() * W, y: -Math.random() * H,
        vy: 0.4 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.4,
        color: [PALETTE.pink, PALETTE.orange, PALETTE.blue, PALETTE.mint][i % 4],
      });
    }
  }

  update() {
    this.t++;
    for (const c of this.confetti) {
      c.y += c.vy;
      c.x += c.vx + Math.sin((this.t + c.y) / 20) * 0.3;
      if (c.y > H) c.y = -4;
    }
    if (this.t > 90 && anyAttackPressed()) this.mgr.go('title');
  }

  draw(ctx) {
    ctx.fillStyle = '#12060c';
    ctx.fillRect(0, 0, W, H);

    const char = this.mgr.assets.chars[this.charId];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(char.anims.win.frames[0], W / 2 - 24, 96, 48, 64);

    for (const c of this.confetti) {
      ctx.fillStyle = c.color;
      ctx.fillRect(Math.round(c.x), Math.round(c.y), 2, 3);
    }

    text(ctx, '¡GANASTE!', W / 2, 56, { size: 20, color: PALETTE.orange });
    text(ctx, `${char.def.name} salvo al mictlan`, W / 2, 74, { size: 8, color: PALETTE.pink });
    if (Math.floor(this.t / 30) % 2 === 0 && this.t > 90) {
      text(ctx, 'TOCA PARA SEGUIR', W / 2, 204, { size: 8, color: PALETTE.paper });
    }
  }
}

// ------------------------------------------------------------- GAMEOVER ----
class GameOverScene {
  constructor(mgr) { this.mgr = mgr; }

  enter({ charId, stage }) {
    this.charId = charId;
    this.stage = stage;
    this.count = 9;
    this.t = 0;
  }

  update() {
    this.t++;
    if (this.t % 60 === 0) {
      this.count--;
      sfx.select();
      if (this.count < 0) return this.mgr.go('title');
    }
    if (anyAttackPressed()) {
      sfx.announcer();
      this.mgr.go('vs', { charId: this.charId, stage: this.stage });
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#0a0306';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'GAME OVER', W / 2, 84, { size: 20, color: PALETTE.red });
    text(ctx, '¿CONTINUAR?', W / 2, 120, { size: 12, color: PALETTE.paper });
    text(ctx, String(Math.max(0, this.count)), W / 2, 152, { size: 24, color: PALETTE.orange });
  }
}
