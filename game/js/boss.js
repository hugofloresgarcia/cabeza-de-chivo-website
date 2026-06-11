// Boss: AI-driven fighter with its own named move set, telegraphed attacks
// and difficulty scaling. Reuses Fighter's physics/boxes/receiveHit.

import { Fighter, aabb } from './fighter.js';
import { FLOOR_Y, ARENA_PAD, W, WALK_SPEED, diff } from './constants.js';

const WALL_STUN = 34;

export class Boss extends Fighter {
  constructor(def, x, facing) {
    const d = diff();
    super({
      id: def.id,
      name: def.name,
      anims: null, // assigned by caller after buildAnims
      stats: { ...def.stats, hp: Math.round(def.stats.hp * d.bossHp) },
      special: null,
      x,
      facing,
      isBoss: true,
      size: def.size,
    });
    this.def = def;
    this.moves = def.moves;
    this.aiDef = def.ai;
    this.move = null;        // current move name while in 'attack'
    this.decisionCd = 40;
    this.walkDir = 0;
    this.walkTicks = 0;
    this.hitsInARow = 0;
    this.armored = false;
    this.dizzyTicks = 0;
  }

  // ---- attack data (telegraph counts as extra startup) ----
  currentAttack() {
    if (this.state !== 'attack' || !this.move) return null;
    const m = this.moves[this.move];
    const d = diff();
    return {
      ...m,
      dmg: Math.round(m.dmg * d.bossDmg),
      startup: Math.round(m.telegraph * d.telegraph) + m.startup,
      unblockable: false,
    };
  }

  inTelegraph() {
    if (this.state !== 'attack' || !this.move) return false;
    return this.t < Math.round(this.moves[this.move].telegraph * diff().telegraph);
  }

  update(ctrl, opp, world) {
    this.t++;
    this.animTime++;
    if (this.hitFlash > 0) this.hitFlash--;
    this.vx = 0;
    this.armored = false;

    if (this.frozen) {
      this.physics();
      return;
    }

    switch (this.state) {
      case 'idle':
        this.facing = opp.x >= this.x ? 1 : -1;
        if (--this.decisionCd <= 0) this.decide(opp);
        break;

      case 'walk': {
        this.facing = opp.x >= this.x ? 1 : -1;
        this.vx = this.walkDir * WALK_SPEED * this.stats.speed;
        if (--this.walkTicks <= 0) this.toIdle(8);
        break;
      }

      case 'attack':
        this.attackTick(opp, world);
        break;

      case 'hitstun':
        if (this.t >= this.stunTicks) this.toIdle(10);
        break;

      case 'knockdown':
        if (this.grounded && this.vy >= 0 && this.t > 5) {
          if (this.lieTicks === undefined) this.lieTicks = 0;
          if (++this.lieTicks >= 36) {
            this.lieTicks = undefined;
            this.setState('getup');
          }
        }
        break;

      case 'getup':
        if (this.t >= 16) this.toIdle(14);
        break;

      case 'stunned': // bounced off the wall after a whiffed ram
        if (this.t >= WALL_STUN) this.toIdle(20);
        break;

      case 'dizzy':
      case 'ko':
        break;
    }

    this.physics();
  }

  toIdle(cd) {
    this.move = null;
    this.setState('idle');
    this.decisionCd = cd;
  }

  decide(opp) {
    const dist = Math.abs(opp.x - this.x);
    const band = dist < this.aiDef.near ? 'near' : dist < this.aiDef.mid ? 'mid' : 'far';
    const d = diff();

    // Aggression scales attack weights up, passive options down.
    const options = this.aiDef.weights[band].map(([action, w]) => {
      const passive = action === 'wait' || action === 'retreat';
      return [action, passive ? w / d.aggression : w * d.aggression];
    });

    const total = options.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    let pick = options[0][0];
    for (const [action, w] of options) {
      r -= w;
      if (r <= 0) { pick = action; break; }
    }

    const [min, max] = this.aiDef.decision;
    const delay = Math.round((min + Math.random() * (max - min)) / d.aggression);

    if (pick === 'wait') {
      this.decisionCd = delay;
    } else if (pick === 'approach' || pick === 'retreat') {
      this.walkDir = (pick === 'approach' ? 1 : -1) * this.facing;
      this.walkTicks = 22 + Math.random() * 24;
      this.setState('walk');
    } else {
      this.move = pick;
      this.setState('attack');
    }
  }

  attackTick(opp, world) {
    const m = this.moves[this.move];
    const a = this.currentAttack();
    const phase = this.attackPhase();

    if (m.armor && phase <= 1) this.armored = true;

    if (phase === 1) {
      if (m.motion === 'ram') {
        this.vx = this.facing * m.speed;
        // wall bounce: whiffing into the arena edge leaves the boss open
        const half = this.size.w / 2;
        if (this.x <= ARENA_PAD + half + 1 || this.x >= W - ARENA_PAD - half - 1) {
          this.move = null;
          this.setState('stunned');
          world?.sfx?.block?.();
          world?.addSpark?.(this.x, this.y - 30, 'big');
          return;
        }
        if (this.hasHit) { // connected: stop charging
          this.t = a.startup + a.active; // jump to recovery
        }
      }
      if (!this.hasSpawned) {
        this.hasSpawned = true;
        if (m.proj) world?.spawnProjectile?.(this, { dmg: a.dmg, proj: m.proj });
        if (m.hazard === 'fireRain') world?.spawnFireRain?.(this, a.dmg);
        if (m.motion === 'teleport') this.teleportBehind(opp, world);
      }
    }

    if (phase === 3) {
      this.hasSpawned = false;
      this.toIdle(6);
    }
  }

  teleportBehind(opp, world) {
    const behind = opp.x - opp.facing * 34;
    const half = this.size.w / 2;
    this.x = Math.max(ARENA_PAD + half, Math.min(W - ARENA_PAD - half, behind));
    this.facing = opp.x >= this.x ? 1 : -1;
    world?.sfx?.special?.();
  }

  receiveHit(attack, dir, attackerPower, world) {
    if (this.invulnerable) return false;

    // Anti-cheese: after eating 4 hits in a row, shrug off the next one.
    if (this.armored || this.hitsInARow >= 4) {
      this.hitsInARow = 0;
      const dmg = Math.max(1, Math.round(attack.dmg * attackerPower * 0.5));
      this.health = Math.max(0, this.health - dmg);
      this.hitFlash = 4;
      world?.sfx?.block?.();
      world?.addSpark?.(this.x, this.y - 30, 'block');
      if (this.health <= 0 && this.state !== 'dizzy') this.setState('dizzy');
      return true;
    }

    this.hitsInARow++;
    const wasHit = super.receiveHit(attack, dir, attackerPower, world);
    if (wasHit && this.state === 'hitstun') {
      this.move = null;
      this.stunTicks = attack.hitstun ?? 16;
    }
    if (wasHit && (this.state === 'knockdown' || this.state === 'dizzy')) this.move = null;
    return wasHit;
  }

  animFor(state) {
    if (state === 'attack' && this.move) {
      const m = this.moves[this.move];
      return this.anims[this.inTelegraph() ? m.windAnim : m.anim] ?? this.anims.idle;
    }
    const map = {
      idle: 'idle', walk: 'walk', hitstun: 'hit', stunned: 'hit', dizzy: 'hit',
      knockdown: 'ko', getup: 'hit', ko: 'ko',
    };
    return this.anims[map[state] ?? 'idle'] ?? this.anims.idle;
  }

  frameIndex(anim) {
    if (this.state === 'knockdown' || this.state === 'ko') {
      return this.grounded && this.t > 5 ? anim.frames.length - 1 : 0;
    }
    const i = Math.floor((this.animTime * anim.fps) / 60);
    return anim.loop === false ? Math.min(i, anim.frames.length - 1) : i % anim.frames.length;
  }

  draw(ctx) {
    // telegraph flash: blink while winding up
    if (this.inTelegraph() && this.t % 8 < 4) {
      ctx.globalAlpha = 0.45;
      super.draw(ctx);
      ctx.globalAlpha = 1;
      return;
    }
    super.draw(ctx);
  }
}

// Falling fire column hazard (devil's fireRain).
export class FireColumn {
  constructor(x, dmg) {
    this.x = x;
    this.dmg = dmg;
    this.warn = 40;
    this.active = 22;
    this.alive = true;
    this.hasHit = false;
    this.t = 0;
  }

  update(targets, world) {
    this.t++;
    if (this.warn > 0) {
      this.warn--;
      return;
    }
    if (this.active <= 0) {
      this.alive = false;
      return;
    }
    this.active--;
    if (this.hasHit) return;
    const box = { x: this.x - 6, y: 0, w: 12, h: FLOOR_Y };
    for (const target of targets) {
      if (target.isBoss || target.invulnerable) continue;
      if (aabb(box, target.hurtbox())) {
        this.hasHit = true;
        target.receiveHit({ dmg: this.dmg, hitstun: 20, knockback: 1, knockdown: true }, 1, 1, world);
      }
    }
  }

  draw(ctx) {
    if (this.warn > 0) {
      // floor marker
      if (this.t % 8 < 4) {
        ctx.fillStyle = '#ff1d42';
        ctx.fillRect(this.x - 7, FLOOR_Y - 2, 14, 2);
      }
      return;
    }
    // pixel fire pillar
    for (let y = 0; y < FLOOR_Y; y += 4) {
      const w = 6 + ((y + this.t * 3) % 8);
      ctx.fillStyle = (y + this.t) % 12 < 6 ? '#ff6a33' : '#edf060';
      ctx.fillRect(this.x - w / 2, y, w, 4);
    }
  }
}
