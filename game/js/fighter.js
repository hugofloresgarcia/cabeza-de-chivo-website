// Fighter: shared state machine for band members and bosses.
// Coordinates: x = horizontal center of the fighter, y = feet position.
// All frame data is in 60Hz ticks. Facing 1 = right, -1 = left.

import {
  MOVES, GRAVITY, JUMP_VY, WALK_SPEED, FLOOR_Y, ARENA_PAD, W,
  SPECIAL_COOLDOWN, CHIP_DAMAGE, DEBUG,
} from './constants.js';

const KNOCKDOWN_LIE = 40;
const GETUP_TICKS = 20;
const COMBO_WINDOW = 90; // ticks allowed between combo presses (1.5s)

export class Fighter {
  constructor({ id, name, anims, stats, special, x, facing, isBoss = false, size }) {
    this.id = id;
    this.name = name;
    this.anims = anims;          // built canvases from sprites.buildAnims
    this.stats = stats;          // { speed, power, hp }
    this.special = special;      // special-move definition or null
    this.isBoss = isBoss;

    this.x = x;
    this.y = FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;

    this.maxHealth = stats.hp;
    this.health = stats.hp;

    this.state = 'idle';
    this.t = 0;                  // ticks in current state
    this.age = 0;                // ticks since spawn (for combo timing)
    this.combo = [];             // recent attack-button presses
    this.animTime = 0;
    this.specialCd = 0;
    this.hasHit = false;         // current attack already connected
    this.hitFlash = 0;
    this.pendingKnockdown = false;
    this.frozen = false;         // scene-controlled (round intro, finish him)

    // Body sizes (pushbox/hurtbox), overridable for bosses.
    this.size = size ?? { w: 12, h: 30, crouchH: 18, airH: 22 };
  }

  get grounded() {
    return this.y >= FLOOR_Y;
  }

  get airborne() {
    return this.state === 'jump' || this.state === 'jumpKick';
  }

  get crouching() {
    return this.state === 'crouch' || this.state === 'crouchPunch';
  }

  get invulnerable() {
    return this.state === 'getup' || this.state === 'knockdown' || this.state === 'ko';
  }

  get attacking() {
    return ['punch', 'kick', 'crouchPunch', 'jumpKick', 'special'].includes(this.state);
  }

  setState(s) {
    this.state = s;
    this.t = 0;
    this.animTime = 0;
    this.hasHit = false;
  }

  // ---- Attack data ----
  currentAttack() {
    switch (this.state) {
      case 'punch':
        return { ...MOVES.punch, box: { dx: 6, dy: -24, w: 12, h: 6 } };
      case 'kick':
        return { ...MOVES.kick, box: { dx: 6, dy: -16, w: 14, h: 7 } };
      case 'crouchPunch':
        return { ...MOVES.crouchPunch, box: { dx: 4, dy: -22, w: 10, h: 12 } };
      case 'jumpKick':
        return { ...MOVES.jumpKick, box: { dx: 4, dy: -16, w: 12, h: 10 } };
      case 'special':
        return this.specialAttack();
      default:
        return null;
    }
  }

  specialAttack() {
    const sp = this.special;
    if (!sp) return null;
    if (sp.type === 'grab') {
      return {
        dmg: sp.dmg, startup: sp.startup, active: 3, recovery: sp.recovery,
        hitstun: 0, knockback: 0, knockdown: true, unblockable: true, bigSpark: true,
        box: { dx: 2, dy: -28, w: sp.range, h: 24 },
      };
    }
    if (sp.type === 'lunge') {
      return {
        dmg: sp.dmg, startup: sp.startup, active: sp.lungeTicks, recovery: sp.recovery,
        hitstun: 22, knockback: 2.0, knockdown: false,
        box: { dx: 1, dy: -28, w: 11, h: 20 },
      };
    }
    // projectile / shockwave: no melee box; spawns at end of startup
    return {
      dmg: sp.dmg, startup: sp.startup, active: 2, recovery: sp.recovery,
      hitstun: 0, knockback: 0, box: null,
    };
  }

  attackPhase() {
    const a = this.currentAttack();
    if (!a) return -1;
    if (this.t < a.startup) return 0;
    if (this.t < a.startup + a.active) return 1;
    if (this.t < a.startup + a.active + a.recovery) return 2;
    return 3;
  }

  // Active hitbox AABB in world coords, or null.
  hitbox() {
    const a = this.currentAttack();
    if (!a || !a.box || this.hasHit || this.attackPhase() !== 1) return null;
    const b = a.box;
    const x0 = this.facing === 1 ? this.x + b.dx : this.x - b.dx - b.w;
    return { x: x0, y: this.y + b.dy, w: b.w, h: b.h, attack: a };
  }

  hurtbox() {
    const s = this.size;
    let h = s.h;
    if (this.crouching) h = s.crouchH;
    else if (!this.grounded) h = s.airH;
    if (this.state === 'knockdown' && this.grounded) h = 8;
    return { x: this.x - s.w / 2, y: this.y - h, w: s.w, h };
  }

  pushbox() {
    const s = this.size;
    const h = this.crouching ? s.crouchH : s.h;
    return { x: this.x - s.w / 2, y: this.y - h, w: s.w, h };
  }

  // ---- Per-tick update. ctrl is a pad-like object. ----
  update(ctrl, opp, world) {
    this.t++;
    this.age++;
    this.animTime++;
    if (this.specialCd > 0) this.specialCd--;
    if (this.hitFlash > 0) this.hitFlash--;
    this.vx = 0;

    if (this.frozen) return;

    // Attack buttons are pitched (punch=root, kick=third, block=fifth of
    // the active chord); playing them in order — the arpeggio — is the
    // combo that triggers the special.
    if (this.special && !this.isBoss) this.trackCombo(ctrl, world);

    // Face the opponent whenever free to do so on the ground.
    if (['idle', 'walkF', 'walkB', 'crouch', 'block'].includes(this.state)) {
      this.facing = opp.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case 'idle':
      case 'walkF':
      case 'walkB':
        this.groundControls(ctrl, world);
        break;

      case 'crouch':
        if (ctrl.punch.pressed || ctrl.kick.pressed) this.setState('crouchPunch');
        else if (!ctrl.down.held) this.setState('idle');
        break;

      case 'block':
        if (!ctrl.block.held) this.setState('idle');
        break;

      case 'jump':
        if (ctrl.kick.pressed || ctrl.punch.pressed) this.setState('jumpKick');
        break;

      case 'punch':
      case 'kick':
      case 'crouchPunch':
      case 'special':
        this.attackUpdate(ctrl, world);
        break;

      case 'jumpKick':
        break; // resolves on landing

      case 'hitstun':
        if (this.t >= this.stunTicks) this.setState('idle');
        break;

      case 'knockdown':
        if (this.grounded && this.vy >= 0 && this.t > 5) {
          if (this.lieTicks === undefined) this.lieTicks = 0;
          if (++this.lieTicks >= KNOCKDOWN_LIE) {
            this.lieTicks = undefined;
            this.setState('getup');
          }
        }
        break;

      case 'getup':
        if (this.t >= GETUP_TICKS) this.setState('idle');
        break;

      case 'ko':
      case 'dizzy':
      case 'win':
        break;
    }

    // Air drift while jumping.
    if (this.airborne && !this.grounded) {
      if (ctrl.left.held) this.vx = -WALK_SPEED * this.stats.speed;
      if (ctrl.right.held) this.vx = WALK_SPEED * this.stats.speed;
      if (this.jumpVx) this.vx = this.jumpVx;
    }

    // Lunge motion (Hugo's special).
    if (this.state === 'special' && this.special?.type === 'lunge' && this.attackPhase() === 1) {
      this.vx = this.facing * this.special.lungeSpeed;
    }

    this.physics();
  }

  // Record pitched presses and fire the special when the arpeggio
  // (punch, kick, block in order) is played.
  trackCombo(ctrl, world) {
    const presses = [
      [ctrl.punch, 'root'], [ctrl.kick, 'third'], [ctrl.block, 'fifth'],
    ];
    for (const [btn, degree] of presses) {
      if (btn.pressed) {
        world?.note?.(this.special.patch, degree);
        this.combo.push({ degree, age: this.age });
        if (this.combo.length > 3) this.combo.shift();
      }
    }

    const [a, b, c] = this.combo;
    const comboLanded = this.combo.length === 3
      && a.degree === 'root' && b.degree === 'third' && c.degree === 'fifth'
      && b.age - a.age <= COMBO_WINDOW && c.age - b.age <= COMBO_WINDOW;
    const canCancel = this.grounded
      && ['idle', 'walkF', 'walkB', 'punch', 'kick', 'block'].includes(this.state);

    if ((comboLanded || ctrl.special.pressed) && this.specialCd === 0 && canCancel) {
      this.combo = [];
      this.specialCd = SPECIAL_COOLDOWN;
      world?.special?.(this.special.patch);
      this.setState('special');
    }
  }

  groundControls(ctrl, world) {
    if (ctrl.block.held) return this.setState('block');
    if (ctrl.down.held) return this.setState('crouch');
    if (ctrl.up.pressed) return this.startJump(ctrl, world);
    if (ctrl.punch.pressed) return this.startAttack('punch', world);
    if (ctrl.kick.pressed) return this.startAttack('kick', world);

    let dir = 0;
    if (ctrl.left.held) dir = -1;
    if (ctrl.right.held) dir = 1;
    if (dir !== 0) {
      this.vx = dir * WALK_SPEED * this.stats.speed;
      this.setStateIfNew(dir === this.facing ? 'walkF' : 'walkB');
    } else {
      this.setStateIfNew('idle');
    }
  }

  setStateIfNew(s) {
    if (this.state !== s) this.setState(s);
  }

  startJump(ctrl, world) {
    this.vy = JUMP_VY;
    this.y -= 0.01; // leave the ground so `grounded` flips
    this.jumpVx = 0;
    if (ctrl.left.held) this.jumpVx = -WALK_SPEED * this.stats.speed;
    if (ctrl.right.held) this.jumpVx = WALK_SPEED * this.stats.speed;
    world?.sfx?.jump?.();
    this.setState('jump');
  }

  startAttack(kind, world) {
    if (!this.special) world?.sfx?.whoosh?.(); // bosses keep the whoosh
    this.setState(kind);
  }

  attackUpdate(ctrl, world) {
    const sp = this.special;
    // Projectile specials spawn at the end of startup.
    if (this.state === 'special' && sp && !this.hasSpawned
        && (sp.type === 'projectile' || sp.type === 'shockwave')
        && this.t === sp.startup) {
      this.hasSpawned = true;
      world?.spawnProjectile?.(this, sp);
    }
    if (this.attackPhase() === 3) {
      this.hasSpawned = false;
      if (this.state === 'crouchPunch' && ctrl.down.held) this.setState('crouch');
      else this.setState('idle');
    }
  }

  physics() {
    if (!this.grounded || this.vy < 0) {
      this.y += this.vy;
      this.vy += GRAVITY;
      if (this.y >= FLOOR_Y) {
        this.y = FLOOR_Y;
        this.vy = 0;
        this.land();
      }
    }
    this.x += this.vx;
    const half = this.size.w / 2;
    this.x = Math.max(ARENA_PAD + half, Math.min(W - ARENA_PAD - half, this.x));
  }

  land() {
    this.jumpVx = 0;
    if (this.state === 'jump' || this.state === 'jumpKick') this.setState('idle');
    if (this.state === 'hitstun') this.setState('idle');
    // knockdown/ko: stay down, handled by state ticks
  }

  // ---- Receiving hits ----
  // attack: data from hitbox().attack (or projectile); dir: pushback direction.
  receiveHit(attack, dir, attackerPower, world) {
    if (this.invulnerable) return false;

    const blocked = this.state === 'block' && !attack.unblockable;
    const dmg = Math.max(1, Math.round(attack.dmg * attackerPower * (blocked ? CHIP_DAMAGE : 1)));
    this.health = Math.max(0, this.health - dmg);

    if (blocked) {
      this.x += dir * 2;
      world?.sfx?.block?.();
      world?.addSpark?.(this.x + dir * -6, this.y - 24, 'block');
      return true;
    }

    this.hitFlash = 6;
    world?.sfx?.hit?.();
    world?.addSpark?.(this.x, this.y - 24, attack.bigSpark ? 'big' : 'hit');

    if (this.health <= 0) {
      // Bosses get staggered for the FINISH HIM window instead of dying;
      // the fight scene promotes dizzy -> ko on the finishing blow.
      if (this.isBoss && this.state !== 'dizzy') {
        this.setState('dizzy');
      } else {
        this.vy = -2.4;
        this.vx = 0;
        this.x += dir * 2;
        this.knockVx = dir * 1.4;
        this.setState('ko');
      }
      return true;
    }

    if (attack.knockdown) {
      this.vy = -2.2;
      this.knockVx = dir * 1.5;
      this.setState('knockdown');
    } else {
      this.stunTicks = attack.hitstun;
      this.x += dir * attack.knockback * 2;
      this.setState('hitstun');
    }
    return true;
  }

  // ---- Render ----
  animFor(state) {
    // Grabs read as a reach, not a cast pose.
    if (state === 'special' && this.special?.type === 'grab') return this.anims.punch;
    const map = {
      idle: 'idle', walkF: 'walk', walkB: 'walk', jump: 'jump', crouch: 'crouch',
      punch: 'punch', kick: 'kick', crouchPunch: 'crouchPunch', jumpKick: 'jumpKick',
      block: 'block', special: 'special', hitstun: 'hit', knockdown: 'ko',
      getup: 'crouch', ko: 'ko', dizzy: 'hit', win: 'win',
    };
    return this.anims[map[state] ?? 'idle'] ?? this.anims.idle;
  }

  frameIndex(anim) {
    // Attacks pick frames by phase: windup / active / recover.
    const grabbing = this.state === 'special' && this.special?.type === 'grab';
    if ((['punch', 'kick', 'crouchPunch'].includes(this.state) || grabbing) && anim.frames.length >= 3) {
      const ph = this.attackPhase();
      return ph <= 0 ? 0 : ph === 1 ? 1 : 2;
    }
    if (this.state === 'knockdown' || this.state === 'ko') {
      return this.grounded && this.t > 5 ? anim.frames.length - 1 : 0;
    }
    const i = Math.floor((this.animTime * anim.fps) / 60);
    return anim.loop === false
      ? Math.min(i, anim.frames.length - 1)
      : i % anim.frames.length;
  }

  draw(ctx) {
    const anim = this.animFor(this.state);
    const frames = this.facing === 1 ? anim.frames : anim.mirrored;
    const frame = frames[this.frameIndex(anim)];
    const dx = Math.floor(this.x - frame.width / 2);
    const dy = Math.floor(this.y - frame.height);

    // Dizzy sway
    const sway = this.state === 'dizzy' ? Math.round(Math.sin(this.animTime / 6) * 2) : 0;

    if (this.hitFlash > 0 && this.hitFlash % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }
    ctx.drawImage(frame, dx + sway, dy);
    ctx.globalAlpha = 1;

    // Andres's head catches fire during his special
    if (this.id === 'andres' && this.state === 'special') {
      const top = dy + 1;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ['#edf060', '#ff6a33', '#ff1d42'][i % 3];
        ctx.fillRect(
          Math.round(this.x - 4 + Math.random() * 9),
          Math.round(top - 1 - Math.random() * 6),
          2, 2 + (i % 2),
        );
      }
    }

    // Chase's dub siren: expanding rings while reaching
    if (this.state === 'special' && this.special?.type === 'grab' && this.attackPhase() <= 1) {
      const r = 5 + (this.t * 1.2) % 16;
      ctx.strokeStyle = 'rgba(99,169,255,0.8)';
      ctx.beginPath();
      ctx.arc(this.x + this.facing * 10, this.y - 26, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(232,106,146,0.5)';
      ctx.beginPath();
      ctx.arc(this.x + this.facing * 10, this.y - 26, r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hugo's feedback lunge leaves a static-noise trail
    if (this.state === 'special' && this.special?.type === 'lunge' && this.attackPhase() === 1) {
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#E86A92';
        ctx.fillRect(
          Math.round(this.x - this.facing * (8 + Math.random() * 18)),
          Math.round(this.y - 28 + Math.random() * 26),
          2, 2,
        );
      }
    }

    if (DEBUG) this.drawBoxes(ctx);
  }

  drawBoxes(ctx) {
    const hb = this.hurtbox();
    ctx.strokeStyle = 'rgba(99,169,255,0.8)';
    ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    const atk = this.hitbox();
    if (atk) {
      ctx.strokeStyle = 'rgba(255,29,66,0.9)';
      ctx.strokeRect(atk.x, atk.y, atk.w, atk.h);
    }
  }
}

// ---- Collision helpers ----
export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Melee hit resolution between two fighters; call once per tick per attacker.
export function tryHit(attacker, defender, world) {
  const hb = attacker.hitbox();
  if (!hb) return;
  if (aabb(hb, defender.hurtbox())) {
    attacker.hasHit = true;
    const dir = defender.x >= attacker.x ? 1 : -1;
    defender.receiveHit(hb.attack, dir, attacker.stats.power, world);
  }
}

// Keep fighters from overlapping: separate pushboxes horizontally.
export function resolvePush(a, b) {
  const pa = a.pushbox();
  const pb = b.pushbox();
  if (!aabb(pa, pb)) return;
  const overlap = Math.min(pa.x + pa.w, pb.x + pb.w) - Math.max(pa.x, pb.x);
  const dir = a.x <= b.x ? 1 : -1;
  a.x -= (dir * overlap) / 2;
  b.x += (dir * overlap) / 2;
  const half = (f) => f.size.w / 2;
  a.x = Math.max(ARENA_PAD + half(a), Math.min(W - ARENA_PAD - half(a), a.x));
  b.x = Math.max(ARENA_PAD + half(b), Math.min(W - ARENA_PAD - half(b), b.x));
}

// ---- Projectiles ----
export class Projectile {
  constructor(owner, sp) {
    const def = sp.proj;
    this.owner = owner;
    this.def = def;
    this.dmg = sp.dmg;
    this.facing = owner.facing;
    this.vx = owner.facing * def.speed;
    this.w = def.w;
    this.h = def.h;
    this.x = owner.x + owner.facing * 14;
    this.y = def.ground ? FLOOR_Y - def.h : owner.y - 26;
    this.traveled = 0;
    this.alive = true;
    this.t = 0;
    this.knockdown = !!def.knockdown;
    this.power = owner.stats.power;
  }

  update(targets, world) {
    this.t++;
    this.x += this.vx;
    this.traveled += Math.abs(this.vx);
    if (this.def.range && this.traveled > this.def.range) this.alive = false;
    if (this.x < -20 || this.x > W + 20) this.alive = false;
    if (!this.alive) return;

    const box = { x: this.x - this.w / 2, y: this.y, w: this.w, h: this.h };
    for (const target of targets) {
      if (target === this.owner || target.invulnerable) continue;
      if (aabb(box, target.hurtbox())) {
        const dir = this.vx >= 0 ? 1 : -1;
        target.receiveHit(
          { dmg: this.dmg, hitstun: 20, knockback: 1.2, knockdown: this.knockdown },
          dir, this.power, world,
        );
        this.alive = false;
        return;
      }
    }
  }

  draw(ctx) {
    const d = this.def;
    ctx.fillStyle = d.color ?? '#ffffff';
    if (d.orb) {
      // pulsing mystic orb
      const r = this.w / 2 + (this.t % 10 < 5 ? 0 : 1);
      ctx.beginPath();
      ctx.arc(this.x, this.y + this.h / 2, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.ground) {
      // shockwave: jagged rising wave
      const hh = this.h * (0.6 + 0.4 * Math.abs(Math.sin(this.t / 4)));
      ctx.fillRect(this.x - this.w / 2, FLOOR_Y - hh, this.w, hh);
    } else if (d.spin) {
      // drumstick: spinning stick
      if (this.t % 8 < 4) {
        ctx.fillRect(this.x - this.w / 2, this.y, this.w, 2);
      } else {
        ctx.fillRect(this.x - 1, this.y - this.w / 2 + 2, 2, this.w);
      }
    } else {
      ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
    }
  }
}
