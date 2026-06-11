// Band-member fighter data: shared pixel-art base body (24x32, facing
// RIGHT) composed from parts, plus per-character palette remaps, overlay
// patches, stats and specials.
//
// Palette keys: s skin, S skin shadow, h hair, e eye, c shirt, C sleeve,
// p pants, b boots — plus per-character extras (H hat, r beard, m mustache,
// D accent). In patches, '_' erases to transparent, '.' leaves the base.

import { applyPatches } from '../sprites.js';

const PAD = '........................'; // 24 transparent px

function blank(n) {
  return Array(n).fill(PAD);
}

// ---- Head (rows 0-7) ----
const HEAD = [
  '........hhhhhhh.........',
  '.......hhhhhhhhh........',
  '.......hhsssssss........',
  '.......hsssssess........',
  '.......hssssssss........',
  '........sssssss.........',
  '.........sssss..........',
  '..........sss...........',
];

const HEAD_HIT = [
  '......hhhhhhh...........',
  '.....hhhhhhhhh..........',
  '.....hhsssssss..........',
  '.....hsssssess..........',
  '.....hssssssss..........',
  '......sssssss...........',
  '.......sssss............',
  '.........sss............',
];

// ---- Torsos (rows 8-17) ----
const T_IDLE_A = [
  '......ccccccccc.........',
  '.....CCcccccccCC........',
  '.....CCcccccccCC........',
  '.....CCcccccccCC........',
  '.....sscccccccss........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

const T_IDLE_B = [
  '......ccccccccc.........',
  '......ccccccccc.........',
  '.....CCcccccccCC........',
  '.....CCcccccccCC........',
  '.....CCcccccccCC........',
  '.....sscccccccss........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

const T_WIND = [
  '......ccccccccc.........',
  '.....CCcccccccc.........',
  '.....CCcccccccc.........',
  '.....CCccccccccss.......',
  '.....sscccccccc.........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

const T_EXT = [
  '......ccccccccc.........',
  '.....CCcccccccCCCCCss...',
  '.....CCcccccccCCCCCss...',
  '.....CCccccccc..........',
  '.....ssccccccc..........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

const T_BLOCK = [
  '......ccccccccc.........',
  '.....CCcccccccss........',
  '.....CCcccccccss........',
  '.....CCcccccccss........',
  '.....CCcccccccss........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

const T_CAST = [
  '......ccccccccc.........',
  '.....ccccccccccCCCCss...',
  '.....ccccccccccCCCCss...',
  '.....ccccccccccCCCCss...',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

const T_HIT = [
  '......ccccccccc.........',
  '...CCCccccccccc.........',
  '...CCCccccccccc.........',
  '...ssccccccccc..........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
  '......ppppppppp.........',
];

// ---- Legs (rows 18-31) ----
const L_STAND = [
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......ppp...ppp.........',
  '......bbb...bbb.........',
  '......bbb...bbb.........',
  '......bbb...bbbbb.......',
  '......bbb...bbbbb.......',
];

const L_WALK1 = [
  '......ppppppppp.........',
  '.....pppp...pppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....ppp.....ppp........',
  '.....bbb.....bbb........',
  '.....bbb.....bbb........',
  '....bbbb.....bbbbb......',
  '....bbbb.....bbbbb......',
];

const L_WALK3 = [
  '......ppppppppp.........',
  '......ppppppppp.........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......ppp.ppp..........',
  '.......bbb.bbb..........',
  '.......bbb.bbb..........',
  '.......bbb.bbbbb........',
  '.......bbb.bbbbb........',
];

const L_JUMP = [
  '......ppppppppp.........',
  '......ppppppppp.........',
  '.....pppppppppp.........',
  '.....pppppppppp.........',
  '......bbb...bbbb........',
  PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD,
];

const L_KICK_WIND = [
  '......ppppppppp.........',
  '......ppp..ppppp........',
  '......ppp....ppp........',
  '......ppp....bbb........',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......bbb...............',
  '......bbb...............',
  '......bbbbb.............',
  '......bbbbb.............',
];

const L_KICK_EXT = [
  '......ppppppppp.........',
  '......pppppppppppppppp..',
  '......ppp..pppppppppbb..',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......ppp...............',
  '......bbb...............',
  '......bbb...............',
  '......bbbbb.............',
  '......bbbbb.............',
];

// ---- Full custom bodies ----
const CROUCH_BODY = [
  '......ccccccccc.........',
  '.....CCcccccccss........',
  '.....CCcccccccss........',
  '.....sscccccccss........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '....pppppppppppp........',
  '....pppppppppppp........',
  '....ppp......ppp........',
  '....ppp......ppp........',
  '....ppp......ppp........',
  '....ppp......ppp........',
  '....bbb......bbbb.......',
  '....bbb......bbbb.......',
];

const CROUCH_PUNCH_BODY = [
  '......cccccccccCCCss....',
  '.....CCccccccc..........',
  '.....ssccccccc..........',
  '......ccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '....pppppppppppp........',
  '....pppppppppppp........',
  '....ppp......ppp........',
  '....ppp......ppp........',
  '....ppp......ppp........',
  '....ppp......ppp........',
  '....bbb......bbbb.......',
  '....bbb......bbbb.......',
];

const JUMPKICK_BODY = [
  '......ccccccccc.........',
  '...CCcccccccccc.........',
  '...sscccccccccc.........',
  '......ccccccccc.........',
  '......ppppppppp.........',
  '......ppppppppppppppp...',
  '......ppp..ppppppppbb...',
  '......ppp...............',
  '......bbb...............',
  '......bbb...............',
  PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD, PAD,
];

const KO_DOWN = [
  ...blank(28),
  '..hhh.cccccccccpppppp...',
  '.hsss.cccccccccppppppbb.',
  '..hhh.cccccccccpppppp...',
  PAD,
];

// Patch part rows (head/torso/legs) for one character, then compose frames.
// body options: shorten (rows removed from the legs, character stays
// bottom-anchored), legPatches (e.g. a dress drawn over the legs —
// skipped for kick frames so the kicking leg stays visible).
function buildFrames(patches = {}, body = {}) {
  const { shorten = 0, legPatches = null } = body;
  const patch = (part, list) => (list ? applyPatches(part, list) : part);
  const head = patch(HEAD, patches.head);
  // The hit head is the normal head art shifted 2px left, so reuse the
  // head patches shifted unless the character overrides them.
  const headHit = patches.headHit
    ? applyPatches(HEAD_HIT, patches.headHit)
    : patches.head
      ? applyPatches(HEAD_HIT, shiftPatches(patches.head, -2))
      : HEAD_HIT;
  const torso = (t) => patch(t, patches.torso);

  const compose = (...parts) => [].concat(...parts);

  // Standard frame = head + torso + legs, optionally shortened/dressed.
  const legsPart = (part, dress) => {
    let rows = shorten ? [...part.slice(0, 2), ...part.slice(2 + shorten)] : part;
    if (legPatches && dress) rows = applyPatches(rows, legPatches);
    return rows;
  };
  const std = (h, t, l, dress = true) => {
    const f = compose(h, t, legsPart(l, dress));
    return shorten ? [...blank(shorten), ...f] : f;
  };

  return {
    idle: {
      fps: 3,
      frames: [
        std(head, torso(T_IDLE_A), L_STAND),
        std(head, torso(T_IDLE_B), L_STAND),
      ],
    },
    walk: {
      fps: 8,
      frames: [
        std(head, torso(T_IDLE_A), L_WALK1),
        std(head, torso(T_IDLE_A), L_STAND),
        std(head, torso(T_IDLE_A), L_WALK3),
        std(head, torso(T_IDLE_A), L_STAND),
      ],
    },
    jump: { fps: 1, frames: [std(head, torso(T_IDLE_A), L_JUMP)] },
    crouch: { fps: 1, frames: [compose(blank(10), head, CROUCH_BODY)] },
    punch: {
      fps: 1, // attack anims are driven by move phase, not fps
      frames: [
        std(head, torso(T_WIND), L_STAND),
        std(head, torso(T_EXT), L_STAND),
        std(head, torso(T_WIND), L_STAND),
      ],
    },
    kick: {
      fps: 1,
      frames: [
        std(head, torso(T_IDLE_A), L_KICK_WIND, false),
        std(head, torso(T_IDLE_A), L_KICK_EXT, false),
        std(head, torso(T_IDLE_A), L_KICK_WIND, false),
      ],
    },
    crouchPunch: {
      fps: 1,
      frames: [
        compose(blank(10), head, CROUCH_BODY),
        compose(blank(10), head, CROUCH_PUNCH_BODY),
        compose(blank(10), head, CROUCH_BODY),
      ],
    },
    jumpKick: { fps: 1, frames: [compose(head, JUMPKICK_BODY)] },
    block: { fps: 1, frames: [std(head, torso(T_BLOCK), L_STAND)] },
    special: { fps: 1, frames: [std(head, torso(T_CAST), L_STAND)] },
    hit: { fps: 1, frames: [std(headHit, torso(T_HIT), L_STAND)] },
    ko: {
      fps: 1,
      loop: false,
      frames: [std(headHit, torso(T_HIT), L_WALK1), KO_DOWN],
    },
    win: { fps: 1, frames: [std(head, torso(T_CAST), L_STAND)] },
  };
}

function shiftPatches(patches, dx) {
  return patches.map((p) => ({ ...p, x: p.x + dx }));
}

// ---- The five band members ----
export const CHARS = {
  alex: {
    name: 'ALEX',
    role: 'bateria',
    stats: { speed: 1.15, power: 0.95, hp: 90 },
    special: {
      type: 'projectile', label: '¡PALOS!', patch: 'drums',
      dmg: 12, startup: 12, recovery: 18,
      proj: { w: 10, h: 3, speed: 2.5, color: '#d9a866', spin: true },
    },
    palette: { // all black fit
      s: '#e8c39e', S: '#caa07c', h: '#5a3a22', e: '#1a1a1a',
      c: '#2b2b30', C: '#1a1a1e', p: '#1d1d22', b: '#000000',
      H: '#161310',
    },
    patches: {
      head: [
        { x: 5, y: 0, rows: ['...HHHHHH..'] },
        { x: 5, y: 1, rows: ['..HHHHHHHH.'] },
        { x: 5, y: 2, rows: ['HHHHHHHHHHH'] },
      ],
    },
  },
  andres: {
    name: 'ANDRES',
    role: 'bajo',
    stats: { speed: 1.0, power: 1.05, hp: 100 },
    special: {
      type: 'shockwave', label: '¡BAJEO!', patch: 'square',
      dmg: 13, startup: 16, recovery: 24,
      proj: { w: 14, h: 10, speed: 1.8, range: 100, knockdown: true, color: '#57A773', ground: true },
    },
    palette: {
      s: '#ecc9a3', S: '#cfa87f', h: '#ecc9a3', e: '#1a1a1a',
      c: '#57A773', C: '#3f7d56', p: '#33312f', b: '#1a1a1a',
      r: '#b3402a',
    },
    patches: {
      head: [
        { x: 8, y: 0, rows: ['_______'] },
        { x: 7, y: 1, rows: ['_________'] },
        { x: 7, y: 2, rows: ['ss'] },
        { x: 7, y: 3, rows: ['s'] },
        { x: 7, y: 4, rows: ['s'] },
        { x: 8, y: 5, rows: ['rrrrrrr'] },
        { x: 9, y: 6, rows: ['rrrrr'] },
      ],
    },
  },
  chase: {
    name: 'CHASE',
    role: 'percusion / dub siren',
    stats: { speed: 0.85, power: 1.2, hp: 115 },
    special: {
      type: 'grab', label: 'DUB SIREN', patch: 'siren',
      dmg: 14, startup: 10, recovery: 28, range: 20, unblockable: true, knockdown: true,
    },
    palette: {
      s: '#c98850', S: '#a96d3c', h: '#151515', e: '#1a1a1a',
      c: '#63a9ff', C: '#477fcc', p: '#3c3c44', b: '#1a1a1a',
    },
    patches: {
      torso: [
        { x: 4, y: 1, rows: ['c', 'c', 'c', 'c'] },
        { x: 17, y: 1, rows: ['c', 'c', 'c', 'c'] },
      ],
    },
  },
  vee: {
    name: 'VEE',
    role: 'organo',
    stats: { speed: 0.9, power: 1.0, hp: 105 },
    special: {
      type: 'projectile', label: '¡ORGANAZO!', patch: 'organ',
      dmg: 13, startup: 16, recovery: 22,
      proj: { w: 9, h: 9, speed: 1.2, color: '#edf060', orb: true },
    },
    palette: {
      s: '#a86a3d', S: '#8a5530', h: '#6e6e6e', e: '#1a1a1a',
      c: '#c2452e', C: '#edf060', p: '#7a5c40', b: '#3a2c1c',
      H: '#5a3215', D: '#edf060', d: '#c2452e', F: '#63a9ff',
    },
    patches: {
      head: [
        { x: 8, y: 0, rows: ['HHHHHHH'] },
        { x: 7, y: 1, rows: ['HDHDHDHDH'] },
      ],
      // the dress pattern runs from the shoulders all the way down
      // (x7-13 is the body core in every torso variant; arms stay clear)
      torso: [
        { x: 7, y: 0, rows: [
          'ddddddd',
          'dDdFdDd',
          'ddddddd',
          'dFdDdFd',
          'ddddddd',
          'dDdFdDd',
          'ddddddd',
          'dFdDdFd',
          'ddddddd',
          'dDdFdDd',
        ] },
      ],
    },
    body: {
      shorten: 4, // Vee is the short one
      legPatches: [
        // dress with colorful woven pattern, flaring toward the hem
        { x: 4, y: 0, rows: [
          '.ddddddddddddd.',
          '.dDdFdDdFdDdFd.',
          '.ddddddddddddd.',
          'dFdDdFdDdFdDdFd',
          'ddddddddddddddd',
          'DdFdDdFdDdFdDdF',
        ] },
      ],
    },
  },
  hugo: {
    name: 'HUGO',
    role: 'guitarra / noise',
    stats: { speed: 1.2, power: 0.9, hp: 90 },
    special: {
      type: 'lunge', label: '¡FEEDBACK!', patch: 'saw',
      dmg: 10, startup: 6, lungeSpeed: 4, lungeTicks: 12, recovery: 16,
    },
    palette: {
      s: '#b5814f', S: '#96683c', h: '#181818', e: '#1a1a1a',
      c: '#E86A92', C: '#bf4f74', p: '#1d1d22', b: '#1a1a1a',
      m: '#181818',
    },
    patches: {
      head: [
        { x: 10, y: 5, rows: ['mmmm'] },
      ],
    },
  },
};

export const CHAR_ORDER = ['alex', 'andres', 'chase', 'vee', 'hugo'];

// Returns rows-based anims for a character, ready for buildAnims().
export function charAnimRows(id) {
  return buildFrames(CHARS[id].patches, CHARS[id].body ?? {});
}

// Validation helper (run under node): every row must be 24 chars.
export function validateArt() {
  const errors = [];
  for (const id of CHAR_ORDER) {
    const anims = charAnimRows(id);
    for (const name in anims) {
      anims[name].frames.forEach((rows, fi) => {
        if (rows.length !== 32) {
          errors.push(`${id}.${name}[${fi}]: ${rows.length} rows (want 32)`);
        }
        rows.forEach((row, ri) => {
          if (row.length !== 24) {
            errors.push(`${id}.${name}[${fi}] row ${ri}: ${row.length} chars (want 24): "${row}"`);
          }
        });
      });
    }
  }
  return errors;
}
