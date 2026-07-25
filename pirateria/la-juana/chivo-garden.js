// floating masks for "la juana" — cabeza de chivo.
// no p5, no drawing: real copies of the mask cutout (favicon.png) drifting
// around the viewport like calcomanías. while the song plays they drift at
// full speed and bob with the loudness (window.__gardenLevel, set by
// player.js); paused = near-still. photo changes teleport a few of them —
// hard cuts everywhere, per the band.

(function () {
  const garden = document.getElementById('garden');
  if (!garden) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const N = 12;
  const SRC = 'mask-float.png'; // the mask cutout, background keyed out
  const masks = [];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function level() { return window.__gardenLevel || 0; }
  function playing() { return !!window.__gardenPlaying; }

  for (let i = 0; i < N; i++) {
    const el = document.createElement('img');
    el.src = SRC;
    el.alt = '';
    el.draggable = false;
    const size = rnd(14, 44);
    el.style.width = size + 'px';
    garden.appendChild(el);
    masks.push({
      el: el,
      size: size,
      x: rnd(-60, window.innerWidth),
      y: rnd(-60, window.innerHeight),
      vx: rnd(8, 26) * (Math.random() < 0.5 ? -1 : 1),   // px/s
      vy: rnd(5, 18) * (Math.random() < 0.5 ? -1 : 1),
      rot: rnd(-14, 14),
      rotAmp: rnd(4, 12),
      bobAmp: rnd(3, 9),
      freq: rnd(0.4, 1.1),
      phase: rnd(0, Math.PI * 2),
      flip: Math.random() < 0.5 ? -1 : 1,                // some face the other way
    });
  }

  // 2-3 drifting "buy the vinyl" chips — the one popup ad we actually mean.
  // they ride the same physics as the masks but stay clickable.
  const BUY_TEXTS = ['buy the vinyl »', '◆ BUY THE VINYL ◆', 'compra el vinilo »'];
  const nBuy = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < nBuy; i++) {
    const el = document.createElement('a');
    el.href = '/store/';
    el.className = 'float-buy';
    el.textContent = BUY_TEXTS[i % BUY_TEXTS.length];
    garden.appendChild(el);
    masks.push({
      el: el,
      size: 150, // wrap margin; roughly the chip width
      x: rnd(0, window.innerWidth * 0.8),
      y: rnd(0, window.innerHeight * 0.8),
      vx: rnd(6, 14) * (Math.random() < 0.5 ? -1 : 1), // a touch slower than the masks
      vy: rnd(4, 10) * (Math.random() < 0.5 ? -1 : 1),
      rot: rnd(-8, 8),
      rotAmp: rnd(2, 6),
      bobAmp: rnd(2, 6),
      freq: rnd(0.3, 0.8),
      phase: rnd(0, Math.PI * 2),
      flip: 1, // text never mirrors
    });
  }

  function place(m, t) {
    const wob = Math.sin(t * m.freq + m.phase);
    const lv = level();
    const bob = reduceMotion ? 0 : wob * m.bobAmp * (1 + 1.5 * lv);
    const tilt = m.rot + (reduceMotion ? 0 : wob * m.rotAmp * (1 + lv));
    m.el.style.transform =
      'translate(' + m.x.toFixed(1) + 'px, ' + (m.y + bob).toFixed(1) + 'px) ' +
      'rotate(' + tilt.toFixed(1) + 'deg) scaleX(' + m.flip + ')';
  }

  // hard-cut teleport for a few masks on each photo change
  window.addEventListener('photochange', function () {
    masks.forEach(function (m) {
      if (Math.random() < 0.3) {
        m.x = rnd(-60, window.innerWidth);
        m.y = rnd(-60, window.innerHeight);
        m.rot = rnd(-14, 14);
        m.flip = Math.random() < 0.5 ? -1 : 1;
        place(m, last / 1000);
      }
    });
  });

  let last = performance.now();

  function frame(now) {
    if (!reduceMotion) requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const speed = playing() ? (1 + 2.2 * level()) : 0.15;
    const W = window.innerWidth, H = window.innerHeight;
    for (const m of masks) {
      m.x += m.vx * dt * speed;
      m.y += m.vy * dt * speed;
      // wrap around the edges with a margin so they never pop mid-screen
      if (m.x > W + m.size) m.x = -m.size;
      if (m.x < -m.size * 2) m.x = W + m.size * 0.5;
      if (m.y > H + m.size) m.y = -m.size;
      if (m.y < -m.size * 2) m.y = H + m.size * 0.5;
      place(m, now / 1000);
    }
  }

  masks.forEach(function (m) { place(m, 0); });
  if (!reduceMotion) requestAnimationFrame(frame);
})();
