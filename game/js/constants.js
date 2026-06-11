// LA PELEA DEL CHIVO — shared constants & balance tables.

// Square aspect: phones are width-bound, so a narrower canvas means
// bigger pixels on screen (less squinting), and square fills a portrait
// layout nicely.
export const W = 240;
export const H = 240;
export const TICKS_PER_SEC = 60;
export const TICK_MS = 1000 / TICKS_PER_SEC;

export const FLOOR_Y = 210;          // y of the ground line in world px
export const ARENA_PAD = 8;          // fighters clamp inside [pad, W-pad]

// Site palette (mirrors assets/css/style.css :root)
export const PALETTE = {
  red: '#ff1d42',
  orange: '#edf060',
  mint: '#57A773',
  paper: '#ffedfb',
  blue: '#63a9ff',
  pink: '#E86A92',
  bg: '#211a1e',
  black: '#000000',
  white: '#ffffff',
};

// Physics — jump is deliberately springy: apex ~62px, about twice a
// fighter's height
export const GRAVITY = 0.2;
export const JUMP_VY = -5.0;
export const WALK_SPEED = 1.0;       // px/tick, scaled by character speed stat

// Round rules
export const ROUND_SECONDS = 60;
export const FINISH_HIM_SECONDS = 10;
export const SPECIAL_COOLDOWN = 90;  // ticks
export const CHIP_DAMAGE = 0.10;     // fraction of damage taken while blocking

// Normal attacks: damage + frame data in ticks
export const MOVES = {
  punch:       { dmg: 6, startup: 5, active: 4, recovery: 8,  hitstun: 14, knockback: 0.6 },
  kick:        { dmg: 9, startup: 8, active: 4, recovery: 14, hitstun: 20, knockback: 1.6 },
  crouchPunch: { dmg: 5, startup: 4, active: 4, recovery: 8,  hitstun: 12, knockback: 0.4 },
  jumpKick:    { dmg: 8, startup: 5, active: 10, recovery: 4, hitstun: 18, knockback: 1.2 },
};

// Difficulty presets — multipliers over Normal. Chosen on the title screen.
export const DIFFICULTIES = {
  easy:   { label: 'FACIL',   bossHp: 0.75, bossDmg: 0.7, telegraph: 1.4, aggression: 0.7 },
  normal: { label: 'NORMAL',  bossHp: 1.0,  bossDmg: 1.0, telegraph: 1.0, aggression: 1.0 },
  hard:   { label: 'DIFICIL', bossHp: 1.3,  bossDmg: 1.3, telegraph: 0.7, aggression: 1.4 },
};

// Mutable game-wide settings (written by the title scene)
export const settings = {
  difficulty: 'normal',
};

export function diff() {
  return DIFFICULTIES[settings.difficulty];
}

export const DEBUG = new URLSearchParams(location.search).has('debug');
export const QUERY = new URLSearchParams(location.search);
