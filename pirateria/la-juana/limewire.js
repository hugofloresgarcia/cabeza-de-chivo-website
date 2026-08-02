// the FREE DOWNLOAD button — a loving recreation of 2003.
// clicking it runs a fake gnutella download (peers, leechers, 14.4kbps,
// one stall) in a little terminal, then triggers the real mp3 download.
// slightly annoying on purpose:
// sometimes the button dodges your first click. jaja casi.

(function () {
  const btn = document.getElementById('dl');
  const term = document.getElementById('dl-term');
  const real = document.getElementById('dl-real');
  if (!btn || !term || !real) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINES = [
    'conectando a la red gnutella...',
    'buscando peers... encontrados: 2 seeds, 47 leechers',
    'connecting to xX_chivo_fan_2003_Xx @ 14.4kbps...',
    'verificando integridad del archivo... ✅ (confía)',
    'descargando la_juana.mp3 ...',
  ];
  const STALL = '!!! STALLED — reintentando...';
  const DONE = '✳ listo. gracias por piratear con cabeza de chivo ✳';
  const BUY = 'anda comprá el vinilo cabrón!!!';

  // the spirits in the machine — each haunts the log once, at a random moment
  const SPOOKS = [
    'cabron detectado!! 🐐😈',
    'jue puta!!',
    'hoy te aparece la llorona... 😭',
  ];

  let dodged = false;
  let running = false;

  function bar(pct) {
    const n = 18;
    const full = Math.round((pct / 100) * n);
    return '[' + '#'.repeat(full) + '-'.repeat(n - full) + '] ' + pct + '%';
  }

  btn.addEventListener('click', function () {
    if (running) return;

    // the dodge: once per visit, ~35% of first clicks just... miss
    if (!dodged && !reduceMotion && Math.random() < 0.35) {
      dodged = true;
      const dx = (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 40);
      btn.style.transform = 'translate(' + dx + 'px, ' + (Math.random() * 14 - 7) + 'px)';
      const was = btn.textContent;
      btn.textContent = 'jaja casi';
      setTimeout(function () {
        btn.style.transform = '';
        btn.textContent = was;
      }, 700);
      return;
    }

    running = true;
    btn.setAttribute('aria-disabled', 'true');
    term.hidden = false;
    const log = [];
    let li = 0;
    let pct = 0;
    let stalled = false;
    const spooks = SPOOKS.slice().sort(function () { return Math.random() - 0.5; });

    function render(progressLine) {
      term.textContent = log.concat(progressLine ? [progressLine] : []).join('\n');
    }

    // a spook echoes 2-3 times when it appears, like the signal is looping
    function pushSpook(s) {
      const times = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < times; i++) log.push(s);
    }
    function maybeSpook(chance) {
      if (spooks.length && Math.random() < chance) pushSpook(spooks.shift());
    }

    // phase 1: the status lines roll in
    const lineTimer = setInterval(function () {
      log.push('>> ' + LINES[li]);
      maybeSpook(0.25);
      render();
      li += 1;
      if (li >= LINES.length) {
        clearInterval(lineTimer);
        crawl();
      }
    }, reduceMotion ? 220 : 620);

    // phase 2: the progress bar crawls, jitters, stalls once near the middle
    function crawl() {
      const tick = setInterval(function () {
        if (!stalled && pct > 40 && pct < 60 && Math.random() < 0.12) {
          stalled = true;
          log.push(STALL);
          pct = Math.max(0, pct - (2 + Math.floor(Math.random() * 4)));
          render(bar(pct));
          return;
        }
        pct = Math.min(100, pct + 2 + Math.floor(Math.random() * 7));
        maybeSpook(0.14);
        render(bar(pct));
        if (pct >= 100) {
          clearInterval(tick);
          log.push(bar(100));
          while (spooks.length) pushSpook(spooks.shift()); // no ghost left behind
          log.push(DONE);
          log.push(BUY);
          render();
          real.click(); // the actual, honest download
          btn.textContent = '⬇ DOWNLOAD AGAIN ⬇ ✅✅ (free forever)';
          btn.removeAttribute('aria-disabled');
          running = false;
        }
      }, reduceMotion ? 90 : 260);
    }
  });
})();
