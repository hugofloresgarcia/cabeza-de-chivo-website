// el chivo fantasma — encuentra las diferencias… si te da tiempo.
(function () {
  'use strict';

  var IMG_SRC = '/assets/img/fantasma/tienda.jpg';
  var SCREAM_SRC = '/assets/audio/fantasma-scream.mp3';
  var SCARE_MS = 3000;

  // the ghost arrives between 7 and 15 seconds after the images appear
  var params = new URLSearchParams(location.search);
  var SCARE_DELAY = params.has('delay')
    ? parseFloat(params.get('delay')) * 1000
    : 7000 + Math.random() * 8000;

  // differences, in coords normalized to the image (cx, cy, rx, ry + a canvas filter)
  var DIFFS = [
    { cx: 0.368, cy: 0.195, rx: 0.045, ry: 0.075, filter: 'hue-rotate(110deg)' },          // red lantern -> green
    { cx: 0.215, cy: 0.260, rx: 0.048, ry: 0.100, filter: 'hue-rotate(95deg)' },           // pin-up poster recolored
    { cx: 0.045, cy: 0.460, rx: 0.042, ry: 0.058, filter: 'brightness(2.3) saturate(0.6)' }, // old TV turns on
    { cx: 0.494, cy: 0.740, rx: 0.034, ry: 0.048, filter: 'hue-rotate(165deg)' },          // alarm clock orange -> blue
    { cx: 0.870, cy: 0.380, rx: 0.075, ry: 0.095, filter: 'hue-rotate(70deg) saturate(1.6)' }, // straw hat goes green
    { cx: 0.726, cy: 0.740, rx: 0.036, ry: 0.042, filter: 'hue-rotate(180deg)' },          // golden bowl turns blue
    { cx: 0.920, cy: 0.872, rx: 0.052, ry: 0.062, filter: 'hue-rotate(150deg) saturate(2.6) brightness(1.25)' } // porcelain blue -> warm
  ];

  var found = [];
  var audioCtx = null;
  var screamBuf = null;
  var droneNodes = null;
  var scareTimer = null;
  var phase = 'intro';

  var $ = function (id) { return document.getElementById(id); };

  // ---------- image / canvas ----------

  function buildAltered(img) {
    var canvas = $('f-canvas-b');
    var w = img.naturalWidth, h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    DIFFS.forEach(function (d) {
      var off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      var octx = off.getContext('2d');
      octx.filter = d.filter;
      octx.drawImage(img, 0, 0, w, h);
      octx.filter = 'none';

      // soft elliptical mask so the altered patch blends in with no seams
      var cx = d.cx * w, cy = d.cy * h, rx = d.rx * w, ry = d.ry * h;
      octx.globalCompositeOperation = 'destination-in';
      octx.save();
      octx.translate(cx, cy);
      octx.scale(1, ry / rx);
      var g = octx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.7, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      octx.fillStyle = g;
      octx.fillRect(-rx, -cy / (ry / rx), 2 * rx, h / (ry / rx));
      octx.restore();

      ctx.drawImage(off, 0, 0);
    });
  }

  // ---------- clicks ----------

  function onPanelClick(e) {
    if (phase !== 'game') return;
    var panel = e.currentTarget;
    var el = panel.querySelector('img, canvas');
    var rect = el.getBoundingClientRect();
    var nx = (e.clientX - rect.left) / rect.width;
    var ny = (e.clientY - rect.top) / rect.height;

    for (var i = 0; i < DIFFS.length; i++) {
      if (found.indexOf(i) !== -1) continue;
      var d = DIFFS[i];
      var dx = (nx - d.cx) / (d.rx * 1.7);
      var dy = (ny - d.cy) / (d.ry * 1.7);
      if (dx * dx + dy * dy <= 1) {
        found.push(i);
        markDiff(d);
        updateCounter();
        return;
      }
    }
    markMiss(panel, nx, ny);
  }

  function markDiff(d) {
    document.querySelectorAll('.f-marks').forEach(function (layer) {
      var m = document.createElement('div');
      m.className = 'f-mark';
      m.style.left = (d.cx * 100) + '%';
      m.style.top = (d.cy * 100) + '%';
      m.style.width = (d.rx * 2.6 * 100) + '%';
      m.style.height = (d.ry * 2.6 * 100) + '%';
      layer.appendChild(m);
    });
  }

  function markMiss(panel, nx, ny) {
    var layer = panel.querySelector('.f-marks');
    var x = document.createElement('div');
    x.className = 'f-miss';
    x.textContent = '✗';
    x.style.left = (nx * 100) + '%';
    x.style.top = (ny * 100) + '%';
    layer.appendChild(x);
    setTimeout(function () { x.remove(); }, 700);
  }

  function updateCounter() {
    $('f-counter').textContent = 'DIFERENCIAS: ' + found.length + ' / ' + DIFFS.length;
  }

  // ---------- audio ----------

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      fetch(SCREAM_SRC)
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (b) { return audioCtx.decodeAudioData(b); })
        .then(function (buf) { screamBuf = buf; });
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function soundTest() {
    ensureAudio();
    var t = audioCtx.currentTime;
    [660, 880].forEach(function (f, i) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.35);
      g.gain.exponentialRampToValueAtTime(0.4, t + i * 0.35 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.35 + 0.5);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + i * 0.35);
      o.stop(t + i * 0.35 + 0.6);
    });
  }

  // a barely-audible drone while they search; keeps the speakers warm
  function startDrone() {
    if (!audioCtx) return;
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 4);
    var oscs = [55, 55.7].map(function (f) {
      var o = audioCtx.createOscillator();
      o.frequency.value = f;
      o.connect(g);
      o.start();
      return o;
    });
    g.connect(audioCtx.destination);
    droneNodes = { gain: g, oscs: oscs };
  }

  function stopDrone() {
    if (!droneNodes) return;
    droneNodes.oscs.forEach(function (o) { o.stop(); });
    droneNodes.gain.disconnect();
    droneNodes = null;
  }

  function playScream() {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var comp = audioCtx.createDynamicsCompressor();
    comp.connect(audioCtx.destination);

    if (screamBuf) {
      var src = audioCtx.createBufferSource();
      src.buffer = screamBuf;
      var g = audioCtx.createGain();
      g.gain.value = 1.4;
      src.connect(g).connect(comp);
      src.start(t);
    }

    // sub-bass thump under the scream
    var o = audioCtx.createOscillator();
    var og = audioCtx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    og.gain.setValueAtTime(0.9, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(og).connect(comp);
    o.start(t);
    o.stop(t + 0.7);
  }

  // ---------- phases ----------

  function startGame() {
    phase = 'game';
    $('f-intro').classList.add('f-hidden');
    $('f-game').classList.remove('f-hidden');
    startDrone();
    scareTimer = setTimeout(scare, SCARE_DELAY);
  }

  function scare() {
    if (phase !== 'game') return;
    phase = 'scare';
    stopDrone();
    playScream();
    $('f-scare').classList.remove('f-hidden');
    setTimeout(endGame, SCARE_MS);
  }

  function endGame() {
    phase = 'end';
    $('f-scare').classList.add('f-hidden');
    $('f-game').classList.add('f-hidden');
    $('f-end').classList.remove('f-hidden');
    $('f-score').textContent =
      'Encontraste ' + found.length + ' de ' + DIFFS.length +
      ' diferencias antes de que el chivo te encontrara a ti.';
    window.scrollTo(0, 0);
  }

  // ---------- wiring ----------

  document.addEventListener('DOMContentLoaded', function () {
    var img = $('f-img-a');
    var prep = function () { buildAltered(img); };
    if (img.complete && img.naturalWidth) prep();
    else img.addEventListener('load', prep);

    $('f-soundtest').addEventListener('click', function () {
      soundTest();
      $('f-continue').classList.remove('f-hidden');
    });

    $('f-start').addEventListener('click', function (e) {
      e.preventDefault();
      ensureAudio();
      startGame();
    });

    document.querySelectorAll('.f-panel').forEach(function (p) {
      p.addEventListener('click', onPanelClick);
    });

    $('f-share').addEventListener('click', function (e) {
      e.preventDefault();
      var url = location.origin + '/chivo-fantasma';
      var done = function () { e.target.textContent = '¡link copiado!'; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done);
    });

    // dev hooks: ?delay=2 forces an early scare; __FANTASMA pokes at state
    window.__FANTASMA = {
      scare: scare,
      diffs: DIFFS,
      get found() { return found; },
      get phase() { return phase; }
    };
  });
})();
