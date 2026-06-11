// Unified virtual pad: keyboard (arrows/WASD + Z X C V or J K L ;)
// and DOM touch controls both write into the same `pad` object.
// `held` = currently down; `pressed` = went down since last consume (edge).

export const pad = {
  left:    { held: false, pressed: false },
  right:   { held: false, pressed: false },
  up:      { held: false, pressed: false },
  down:    { held: false, pressed: false },
  punch:   { held: false, pressed: false },
  kick:    { held: false, pressed: false },
  block:   { held: false, pressed: false },
  special: { held: false, pressed: false },
};

export let anyPressed = false;

const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
  z: 'punch', x: 'kick', c: 'block', v: 'special',
  j: 'punch', k: 'kick', l: 'block', ';': 'special',
};

function press(name) {
  const b = pad[name];
  if (!b.held) b.pressed = true;
  b.held = true;
  anyPressed = true;
}

function release(name) {
  pad[name].held = false;
}

// Called once per logic tick after entities have read input.
export function consumePressed() {
  for (const name in pad) pad[name].pressed = false;
  anyPressed = false;
}

const gestureCallbacks = [];
// Register a callback for the first user gesture (audio unlock).
export function onFirstGesture(cb) {
  gestureCallbacks.push(cb);
}
function fireGesture() {
  while (gestureCallbacks.length) gestureCallbacks.shift()();
}

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.key] ?? KEYMAP[e.key.toLowerCase?.()];
    fireGesture();
    if (!name) return;
    e.preventDefault();
    press(name);
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.key] ?? KEYMAP[e.key.toLowerCase?.()];
    if (!name) return;
    release(name);
  });

  initTouch();
}

// ---- Touch controls ----
// Buttons are DOM elements; multi-touch tracked per-identifier so the
// player can hold a direction and tap attacks simultaneously.

const TOUCH_LAYOUT = {
  // d-pad cross (grid-area = button name, see game.css)
  left: [
    { name: 'up',    label: '▲' },
    { name: 'left',  label: '◀' },
    { name: 'right', label: '▶' },
    { name: 'down',  label: '▼' },
  ],
  // action buttons use game-icons.net icons (CC BY 3.0)
  right: [
    { name: 'punch',   icon: '/game/icons/punch.svg' },
    { name: 'kick',    icon: '/game/icons/kick.svg' },
    { name: 'block',   icon: '/game/icons/block.svg' },
    { name: 'special', icon: '/game/icons/special.svg' },
  ],
};

function initTouch() {
  if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return;

  const zones = { left: document.getElementById('touch-left'), right: document.getElementById('touch-right') };
  if (!zones.left || !zones.right) return;

  const buttons = []; // { el, name }
  for (const side of ['left', 'right']) {
    zones[side].classList.add('touch-zone', `touch-${side}`, 'touch-active');
    for (const def of TOUCH_LAYOUT[side]) {
      const el = document.createElement('div');
      el.className = `touch-btn touch-btn-${def.name}`;
      if (side === 'left') el.style.gridArea = def.name;
      if (def.icon) {
        const img = document.createElement('img');
        img.src = def.icon;
        img.alt = def.name;
        el.appendChild(img);
      } else {
        el.textContent = def.label;
      }
      zones[side].appendChild(el);
      buttons.push({ el, name: def.name });
    }
  }

  // touchId -> button name currently held by that finger
  const touchOwner = new Map();

  function buttonAt(x, y) {
    for (const b of buttons) {
      const r = b.el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return b;
    }
    return null;
  }

  function handleTouches(e) {
    e.preventDefault();
    if (e.type === 'touchstart') fireGesture();

    for (const t of e.changedTouches) {
      const prev = touchOwner.get(t.identifier);
      if (e.type === 'touchend' || e.type === 'touchcancel') {
        if (prev) { release(prev); setActive(prev, false); }
        touchOwner.delete(t.identifier);
        continue;
      }
      const b = buttonAt(t.clientX, t.clientY);
      const name = b ? b.name : null;
      if (prev === name) continue;
      if (prev) { release(prev); setActive(prev, false); }
      if (name) { press(name); setActive(name, true); }
      if (name) touchOwner.set(t.identifier, name); else touchOwner.delete(t.identifier);
    }
  }

  function setActive(name, on) {
    const b = buttons.find((x) => x.name === name);
    if (b) b.el.classList.toggle('active', on);
  }

  const root = document.getElementById('game-root');
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    root.addEventListener(type, handleTouches, { passive: false });
  }
}
