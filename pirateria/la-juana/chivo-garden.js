// floating "buy the vinyl" chip for "la juana" — cabeza de chivo.
// a single clickable chip drifting around the viewport. while the song plays
// it drifts at full speed and bobs with the loudness (window.__gardenLevel,
// set by player.js); paused = near-still. photo changes can teleport it —
// hard cuts everywhere, per the band.

(function () {
  const garden = document.getElementById('garden');
  if (!garden) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const masks = [];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function level() { return window.__gardenLevel || 0; }
  function playing() { return !!window.__gardenPlaying; }

  // a single drifting "buy the vinyl" chip — the one popup ad we actually mean.
  {
    const el = document.createElement('a');
    el.href = '/store/';
    el.className = 'float-buy';
    el.textContent = 'buy the vinyl »';
    garden.appendChild(el);
    masks.push({
      el: el,
      size: 150, // wrap margin; roughly the chip width
      x: rnd(0, window.innerWidth * 0.8),
      y: rnd(0, window.innerHeight * 0.8),
      vx: rnd(6, 14) * (Math.random() < 0.5 ? -1 : 1),
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
