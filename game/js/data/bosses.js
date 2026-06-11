// Boss data: El Chivo (goat, stage 1) and El Diablo (devil, stage 2).
// Art is authored at half resolution and decoded at scale 2 for a chunkier
// look: goat 24x24 -> 48x48, devil 32x40 -> 64x80. Facing RIGHT.

const P24 = '........................';        // 24 transparent px
const P32 = '................................'; // 32 transparent px

// ---- EL CHIVO -------------------------------------------------------------
// keys: g fur, G dark fur, w horn, e eye, s snout, h hoof
const GOAT_PALETTE = {
  g: '#6b5a4a', G: '#4a3d31', w: '#d8cbb8', e: '#ff1d42', s: '#3a2d24', h: '#221a14',
};

const GOAT_LEGS_A = [
  '......GGGG.GGGG.........',
  '......GGGG.GGGG.........',
  '......GGG....GGG........',
  '......GGG....GGG........',
  '......hhh....hhh........',
  '......hhh....hhh........',
];

const GOAT_LEGS_B = [
  '.....GGG.....GGG........',
  '.....GGG.....GGG........',
  '.....GG.......GG........',
  '.....GG.......GG........',
  '...hhhh.......hhhh......',
  '...hhhh.......hhhh......',
];

const GOAT_HEAD = [
  '......w.......w.........',
  '.....w.........w........',
  '.....w.........w........',
  '.....wgggggggggw........',
  '.....gggggggggg.........',
  '.....gggggggegg.........',
  '.....ggggggggggsss......',
  '......gggggggggsss......',
  '......ggggggggg.........',
  '.......ggggggg..........',
];

const GOAT_BODY_IDLE = [
  '......ggggggggg.........',
  '.....GGgggggggGG........',
  '.....GGgggggggGG........',
  '.....hhgggggghh.........',
  '......ggggggggg.........',
  '......ggggggggg.........',
  '......GGGGGGGGG.........',
  '......GGGGGGGGG.........',
];

const GOAT_BODY_WIND = [
  '....GG.ggggggggg.GG.....',
  '....GGgggggggggggGG.....',
  '....hhgggggggggg.hh.....',
  '......ggggggggg.........',
  '......ggggggggg.........',
  '......ggggggggg.........',
  '......GGGGGGGGG.........',
  '......GGGGGGGGG.........',
];

const GOAT_BODY_SWIPE = [
  '......ggggggggg.........',
  '.....GGgggggggGGGGG.....',
  '.....GGgggggggGGGGGhh...',
  '.....hhggggggg..........',
  '......ggggggggg.........',
  '......ggggggggg.........',
  '......GGGGGGGGG.........',
  '......GGGGGGGGG.........',
];

const GOAT_IDLE_A = [...GOAT_HEAD, ...GOAT_BODY_IDLE.slice(0, 8), ...GOAT_LEGS_A];
const GOAT_IDLE_B = [
  ...GOAT_HEAD.map((r, i) => (i === 0 ? P24 : GOAT_HEAD[i - 1])), // head bob
  ...GOAT_BODY_IDLE.slice(0, 8),
  ...GOAT_LEGS_A,
];
const GOAT_WALK_A = [...GOAT_HEAD, ...GOAT_BODY_IDLE.slice(0, 8), ...GOAT_LEGS_B];

// charge: head lowered, horns forward
const GOAT_CHARGE_A = [
  P24, P24, P24, P24,
  '..........ggggggggww....',
  '.........gggggggggggww..',
  '.........ggggggeggggss..',
  '.........gggggggggggss..',
  '......ggggggggggggg.....',
  '.....GGgggggggggggg.....',
  '.....GGggggggggg........',
  '.....hhggggggggg........',
  '......ggggggggg.........',
  '......ggggggggg.........',
  '......GGGGGGGGG.........',
  '......GGGGGGGGG.........',
  '......GGGGGGGGG.........',
  '......GGGGGGGGG.........',
  ...GOAT_LEGS_B,
];
const GOAT_CHARGE_B = [...GOAT_CHARGE_A.slice(0, 18), ...GOAT_LEGS_A];

// bleat: head thrown up, mouth open
const GOAT_BLEAT = [
  '......ww....ww..........',
  '.....www....www.........',
  '.....ww......ww.........',
  '......ggggggggsss.......',
  '.....gggggggggsss.......',
  '.....gggggggegg.........',
  '.....gggggggggg.........',
  '......ggggggggg.........',
  '......ggggggggg.........',
  '.......ggggggg..........',
  ...GOAT_BODY_WIND,
  ...GOAT_LEGS_A,
];

const GOAT_HIT = GOAT_IDLE_A.map((row) => `..${row.slice(0, 22)}`); // lean back 2px

const GOAT_KO = [
  ...Array(18).fill(P24),
  '...ww...................',
  '..wggggggggGGGGGG.......',
  '.wggeggggggGGGGGGhh.....',
  '..wggggggggGGGGGG.......',
  '...sss..................',
  P24,
];

// ---- EL DIABLO ------------------------------------------------------------
// keys: d red skin, D dark red, k black, w horn, e eye, t trident
const DEVIL_PALETTE = {
  d: '#c22f2f', D: '#8a1f26', k: '#1a1014', w: '#e8d8b0', e: '#edf060', t: '#9a9aa8',
};

const DEVIL_HEAD = [
  '....ww............ww............',
  '...www............www...........',
  '...ww..............ww......t.t.t',
  '...wwwddddddddddwww........t.t.t',
  '...wwddddddddddddww........t.t.t',
  '.....ddeedddddeedd.........t.t.t',
  '.....dddddddddddd..........ttttt',
  '.....dddddddddddd............t..',
  '......dddddddddd.............t..',
  '.......kkkkkkkk..............t..',
  '........kkkkkk...............t..',
];

const DEVIL_TORSO_IDLE = [
  '......ddddddddddddddd........t..',
  '.....DDdddddddddddddDDDD.....t..',
  '.....DDdddddddddddddDDDDDDDDDt..',
  '.....DDdddddddddddddDDD......t..',
  '.....DDddddddddddddd.........t..',
  '.....kkddddddddddddd.........t..',
  '......ddddddddddddd..........t..',
  '......ddddddddddddd..........t..',
  '......ddddddddddddd..........t..',
  '......DDDDDDDDDDDDD..........t..',
  '......DDDDDDDDDDDDD..........t..',
  '......DDDDDDDDDDDDD..........t..',
];

const DEVIL_LEGS = [
  '......DDDD....DDDDD..........t..',
  '......DDDD....DDDD...........t..',
  '......DDD......DDD...........t..',
  '......DDD......DDD...........t..',
  '......DDD......DDD...........t..',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......DDD......DDD..............',
  '......kkk......kkk..............',
  '......kkk......kkk..............',
  '...kkkkkk......kkkkkk...........',
  '..kkkkkkk......kkkkkkkk.........',
];

const DEVIL_LEGS_B = DEVIL_LEGS.map((row) => row.replace(/t/g, '.'));

// trident thrust: shaft horizontal at chest height
const DEVIL_TORSO_THRUST = [
  '......ddddddddddddddd...........',
  '.....DDdddddddddddddDDDD........',
  '.....DDdddddddddddddDDDDDDDD.tt.',
  '.....DDdddddddddddddtttttttttttt',
  '.....DDddddddddddddd.........tt.',
  '.....kkddddddddddddd............',
  '......ddddddddddddd.............',
  '......ddddddddddddd.............',
  '......ddddddddddddd.............',
  '......DDDDDDDDDDDDD.............',
  '......DDDDDDDDDDDDD.............',
  '......DDDDDDDDDDDDD.............',
];

// cast: both arms raised, fire summon
const DEVIL_TORSO_CAST = [
  '...DD.ddddddddddddddd.DD........',
  '...DDddddddddddddddddddDD.......',
  '...kk.ddddddddddddddd.kk........',
  '......ddddddddddddddd...........',
  '......ddddddddddddd.............',
  '......ddddddddddddd.............',
  '......ddddddddddddd.............',
  '......ddddddddddddd.............',
  '......ddddddddddddd.............',
  '......DDDDDDDDDDDDD.............',
  '......DDDDDDDDDDDDD.............',
  '......DDDDDDDDDDDDD.............',
];

const DEVIL_IDLE_A = [...DEVIL_HEAD, ...DEVIL_TORSO_IDLE, ...DEVIL_LEGS];
const DEVIL_IDLE_B = [P32, ...DEVIL_HEAD, ...DEVIL_TORSO_IDLE, ...DEVIL_LEGS.slice(0, 16)];
const DEVIL_THRUST_WIND = [...DEVIL_HEAD, ...DEVIL_TORSO_IDLE, ...DEVIL_LEGS];
const DEVIL_THRUST = [...DEVIL_HEAD.map((r) => r.replace(/t/g, '.')), ...DEVIL_TORSO_THRUST, ...DEVIL_LEGS_B];
const DEVIL_CAST = [...DEVIL_HEAD.map((r) => r.replace(/t/g, '.')), ...DEVIL_TORSO_CAST, ...DEVIL_LEGS_B];
const DEVIL_HIT = DEVIL_IDLE_A.map((row) => `..${row.slice(0, 30)}`);

const DEVIL_KO = [
  ...Array(33).fill(P32),
  '...ww...........................',
  '..wddddddddddDDDDDDDDDD.........',
  '.wddeeddddddddDDDDDDDDDkkk......',
  '..wddddddddddDDDDDDDDDD.........',
  '...kkkk.........................',
  P32, P32,
];

export const BOSSES = {
  goat: {
    id: 'goat',
    name: 'EL CHIVO',
    scale: 2,
    palette: GOAT_PALETTE,
    stats: { speed: 0.8, power: 1.0, hp: 160 },
    size: { w: 22, h: 46, crouchH: 46, airH: 46 },
    introText: 'EL CHIVO TE ESPERA',
    finishText: '¡SE LO LLEVO EL CHIVO!',
    anims: {
      idle: { fps: 3, frames: [GOAT_IDLE_A, GOAT_IDLE_B] },
      walk: { fps: 5, frames: [GOAT_IDLE_A, GOAT_WALK_A] },
      wind: { fps: 1, frames: [[...GOAT_HEAD, ...GOAT_BODY_WIND, ...GOAT_LEGS_A]] },
      swipe: { fps: 1, frames: [[...GOAT_HEAD, ...GOAT_BODY_SWIPE, ...GOAT_LEGS_A]] },
      charge: { fps: 6, frames: [GOAT_CHARGE_A, GOAT_CHARGE_B] },
      bleat: { fps: 1, frames: [GOAT_BLEAT] },
      hit: { fps: 1, frames: [GOAT_HIT] },
      ko: { fps: 1, loop: false, frames: [GOAT_HIT, GOAT_KO] },
    },
    moves: {
      swipe: {
        anim: 'swipe', windAnim: 'wind',
        dmg: 9, telegraph: 18, startup: 6, active: 6, recovery: 20,
        hitstun: 18, knockback: 1.4,
        box: { dx: 8, dy: -34, w: 18, h: 12 },
      },
      ram: {
        anim: 'charge', windAnim: 'wind', motion: 'ram',
        dmg: 12, telegraph: 30, startup: 4, active: 50, recovery: 26,
        hitstun: 0, knockback: 0, knockdown: true, speed: 2.6,
        box: { dx: 2, dy: -30, w: 16, h: 26 },
      },
      bleat: {
        anim: 'bleat', windAnim: 'bleat',
        dmg: 8, telegraph: 20, startup: 4, active: 2, recovery: 30,
        proj: { w: 8, h: 8, speed: 2.0, color: '#ffedfb', orb: true },
      },
    },
    ai: {
      near: 42, mid: 110,
      weights: {
        near: [['swipe', 50], ['retreat', 25], ['wait', 25]],
        mid: [['approach', 45], ['ram', 30], ['wait', 25]],
        far: [['approach', 55], ['bleat', 30], ['wait', 15]],
      },
      decision: [20, 45], // ticks between decisions, scaled by aggression
    },
  },

  devil: {
    id: 'devil',
    name: 'EL DIABLO',
    scale: 2,
    palette: DEVIL_PALETTE,
    stats: { speed: 0.9, power: 1.0, hp: 220 },
    size: { w: 26, h: 76, crouchH: 76, airH: 76 },
    introText: '¡EL DIABLO APARECE!',
    finishText: '¡DE VUELTA AL MICTLAN!',
    anims: {
      idle: { fps: 3, frames: [DEVIL_IDLE_A, DEVIL_IDLE_B] },
      walk: { fps: 4, frames: [DEVIL_IDLE_A, DEVIL_IDLE_B] },
      wind: { fps: 1, frames: [DEVIL_THRUST_WIND] },
      swipe: { fps: 1, frames: [DEVIL_THRUST] },
      charge: { fps: 6, frames: [DEVIL_THRUST, DEVIL_IDLE_A] },
      cast: { fps: 1, frames: [DEVIL_CAST] },
      hit: { fps: 1, frames: [DEVIL_HIT] },
      ko: { fps: 1, loop: false, frames: [DEVIL_HIT, DEVIL_KO] },
    },
    moves: {
      trident: {
        anim: 'swipe', windAnim: 'wind',
        dmg: 12, telegraph: 14, startup: 5, active: 6, recovery: 22,
        hitstun: 20, knockback: 1.8,
        box: { dx: 10, dy: -52, w: 26, h: 10 },
      },
      ram: {
        anim: 'charge', windAnim: 'wind', motion: 'ram', armor: true,
        dmg: 14, telegraph: 24, startup: 4, active: 46, recovery: 24,
        hitstun: 0, knockback: 0, knockdown: true, speed: 2.8,
        box: { dx: 2, dy: -50, w: 20, h: 44 },
      },
      fireRain: {
        anim: 'cast', windAnim: 'cast', hazard: 'fireRain',
        dmg: 10, telegraph: 20, startup: 4, active: 2, recovery: 36,
      },
      teleport: {
        anim: 'cast', windAnim: 'cast', motion: 'teleport',
        dmg: 0, telegraph: 12, startup: 8, active: 2, recovery: 12,
      },
    },
    ai: {
      near: 50, mid: 120,
      weights: {
        near: [['trident', 50], ['retreat', 20], ['fireRain', 15], ['wait', 15]],
        mid: [['approach', 35], ['ram', 25], ['fireRain', 25], ['wait', 15]],
        far: [['approach', 40], ['teleport', 25], ['fireRain', 25], ['wait', 10]],
      },
      decision: [14, 36],
    },
  },
};

// Validation helper (run under node).
export function validateBossArt() {
  const errors = [];
  for (const id in BOSSES) {
    const b = BOSSES[id];
    const w = id === 'goat' ? 24 : 32;
    const h = id === 'goat' ? 24 : 40;
    for (const name in b.anims) {
      b.anims[name].frames.forEach((rows, fi) => {
        if (rows.length !== h) errors.push(`${id}.${name}[${fi}]: ${rows.length} rows (want ${h})`);
        rows.forEach((row, ri) => {
          if (row.length !== w) errors.push(`${id}.${name}[${fi}] row ${ri}: ${row.length} chars (want ${w}): "${row}"`);
        });
      });
    }
  }
  return errors;
}
