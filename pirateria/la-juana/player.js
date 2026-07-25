// player for "la juana" — cabeza de chivo.
// photo slideshow in the neon frame + IBM Plex Mono transport with a
// palette-cycling waveform. while playing, a WebAudio analyser publishes a
// smoothed loudness to window.__gardenLevel so the mask/star garden
// (chivo-garden.js) and the map (selfsim.js) can dance along.

(function () {
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PALETTE = ['#ff1d42', '#edf060', '#E86A92', '#57A773', '#63a9ff', '#ffedfb'];

  // ---- photos ----

  const PHOTOS = [
    'mask', 'cover',
    'joel-thalia-34', 'joel-thalia-43', 'joel-thalia-48',
    'joel-thalia-54', 'joel-thalia-62',
    'emily-thalia-2959', 'emily-thalia-3112', 'emily-thalia-3311',
  ].map(function (n) { return 'photos/' + n + '.jpg'; });

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  shuffle(PHOTOS);
  // the album art always opens the show; the rest stay shuffled behind it
  const COVER = 'photos/cover.jpg';
  PHOTOS.splice(PHOTOS.indexOf(COVER), 1);
  PHOTOS.unshift(COVER);

  // preload everything so crossfades never flash
  PHOTOS.forEach(function (src) { const im = new Image(); im.src = src; });

  const stage = document.getElementById('stage');
  const layerA = document.getElementById('ph-a');
  const layerB = document.getElementById('ph-b');
  let showing = layerA;
  let idx = -1;
  let lastShown = '';

  // hard cut, no fade: the incoming layer lands on top fully opaque, the old
  // one hides beneath it (two layers only so a not-yet-decoded image never
  // flashes the empty frame)
  function show(src) {
    const back = showing === layerA ? layerB : layerA;
    back.src = src;
    back.style.transition = 'none';
    back.style.transform = 'none';
    back.style.opacity = '1';
    back.style.zIndex = '2';
    showing.style.transition = 'none';
    showing.style.zIndex = '1';
    showing.style.opacity = '0';
    showing = back;
    window.dispatchEvent(new Event('photochange'));
    lastShown = src;
  }

  function advance() {
    idx += 1;
    if (idx >= PHOTOS.length) {
      idx = 0;
      shuffle(PHOTOS);
      if (PHOTOS[0] === lastShown) PHOTOS.push(PHOTOS.shift()); // no repeats across the loop
    }
    show(PHOTOS[idx]);
  }

  advance(); // the album art opens the show

  // photos rotate every 5s, playing or not
  setInterval(advance, 5000);

  stage.addEventListener('click', advance);
  stage.addEventListener('keydown', function (e) {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      advance();
    }
  });

  // ---- transport ----

  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play');
  const seek = document.getElementById('seek');
  const cur = document.getElementById('cur');
  const dur = document.getElementById('dur');
  let scrubbing = false;

  function fmt(s) {
    if (!isFinite(s)) return '–:––';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function setGlyph() {
    playBtn.classList.toggle('playing', !audio.paused);
    playBtn.setAttribute('aria-label', audio.paused ? 'play' : 'pause');
  }

  function syncDuration() {
    if (!isFinite(audio.duration)) return;
    seek.max = audio.duration;
    dur.textContent = fmt(audio.duration);
  }
  audio.addEventListener('loadedmetadata', syncDuration);
  syncDuration(); // in case metadata beat us to it

  playBtn.addEventListener('click', function () {
    if (audio.paused) {
      initAnalyser();
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', function () {
    window.__gardenPlaying = true;
    setGlyph();
  });
  audio.addEventListener('pause', function () {
    window.__gardenPlaying = false;
    setGlyph();
  });
  audio.addEventListener('ended', function () {
    window.__gardenPlaying = false;
    setGlyph();
  });

  audio.addEventListener('timeupdate', function () {
    if (!scrubbing) seek.value = audio.currentTime;
    cur.textContent = fmt(audio.currentTime);
  });

  // all seek paths clamp just shy of the end: landing exactly on duration
  // fires `ended` and silently stops playback mid-scrub.
  function safeTime(t) {
    const d = audio.duration;
    if (!isFinite(d)) return Math.max(0, t);
    return Math.min(Math.max(0, t), Math.max(0, d - 0.25));
  }
  window.__safeSeek = function (t) { audio.currentTime = safeTime(t); };

  // coalesce rapid scrub writes to one currentTime set per frame
  let pendingSeek = null;
  function commitSeek() {
    if (pendingSeek === null) return;
    audio.currentTime = safeTime(pendingSeek);
    pendingSeek = null;
  }

  seek.addEventListener('pointerdown', function () { scrubbing = true; });
  seek.addEventListener('pointerup', function () { scrubbing = false; commitSeek(); });
  // touch scrolls can steal the gesture — never leave scrubbing wedged on
  seek.addEventListener('pointercancel', function () { scrubbing = false; commitSeek(); });
  seek.addEventListener('lostpointercapture', function () { scrubbing = false; });
  seek.addEventListener('input', function () {
    pendingSeek = Number(seek.value);
    cur.textContent = fmt(Number(seek.value));
    requestAnimationFrame(commitSeek);
  });

  // arrows on the seek bar: jump 10s, not one range-step
  seek.addEventListener('keydown', function (e) {
    if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return;
    e.preventDefault();
    const d = e.code === 'ArrowLeft' ? -10 : 10;
    audio.currentTime = safeTime(audio.currentTime + d);
  });

  // space anywhere = play/pause (unless a control already has focus)
  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'button' || tag === 'input' || e.target === stage) return;
    e.preventDefault();
    playBtn.click();
  });

  // ---- waveform (neon palette on the dark box) ----
  // dim bars light up to full color as they're played; a spinning gold
  // asterisk-star rides the waveform as the playhead.

  const waveBox = document.querySelector('.wave');
  const wavecv = document.getElementById('wavecv');
  const wctx = wavecv.getContext('2d');
  let peaks = null;
  let bars = null;
  let cols = null;
  let waveW = 0, waveH = 0;
  let starRot = 0;

  const BAR_W = 3, GAP = 1;

  fetch('waveform.json')
    .then(function (r) { return r.json(); })
    .then(function (a) { peaks = a; sizeWave(); })
    .catch(function () { peaks = null; sizeWave(); }); // no data -> flat bars

  function frac(x) { return x - Math.floor(x); }

  function sizeWave() {
    const rect = waveBox.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    waveW = rect.width; waveH = rect.height;
    wavecv.width = Math.round(waveW * dpr);
    wavecv.height = Math.round(waveH * dpr);
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(10, Math.floor(waveW / (BAR_W + GAP)));
    bars = new Array(n);
    cols = new Array(n);
    for (let i = 0; i < n; i++) {
      if (peaks && peaks.length) {
        const a = Math.floor(i / n * peaks.length);
        const b = Math.max(a + 1, Math.floor((i + 1) / n * peaks.length));
        let mx = 0;
        for (let k = a; k < b; k++) mx = Math.max(mx, peaks[k]);
        bars[i] = Math.max(0.05, mx);
      } else {
        bars[i] = 0.5;
      }
      // deterministic palette cycle with a pseudo-random skip, like the nav
      cols[i] = PALETTE[Math.floor(frac(Math.sin((i + 1) * 127.1) * 43758.5453) * PALETTE.length)];
    }
  }
  window.addEventListener('resize', sizeWave);

  function drawWave() {
    if (!bars) return;
    const lvl = window.__gardenLevel || 0;
    const playing = !audio.paused && !audio.ended;
    const progress = (audio.currentTime || 0) / (audio.duration || 1);
    const px = progress * waveW;
    const y0 = waveH * 0.64;

    wctx.clearRect(0, 0, waveW, waveH);
    for (let i = 0; i < bars.length; i++) {
      const x = i * (BAR_W + GAP);
      const cx = x + BAR_W / 2;
      let k = 1;
      if (playing && !reduceMotion) {
        const d = Math.abs(cx - px);
        if (d < 26) k = 1 + 0.55 * lvl * (1 - d / 26);
      }
      const played = cx <= px;
      wctx.fillStyle = cols[i];
      wctx.globalAlpha = played ? 1 : 0.26;
      const hm = Math.max(2, bars[i] * y0 * 0.94 * k);
      wctx.fillRect(x, y0 - hm, BAR_W, hm);
      // reflection below
      wctx.globalAlpha = played ? 0.4 : 0.12;
      const hr = Math.max(1, bars[i] * (waveH - y0) * 0.8 * k);
      wctx.fillRect(x, y0 + 2, BAR_W, hr);
    }
    wctx.globalAlpha = 1;

    // the asterisk-star playhead
    if (playing && !reduceMotion) starRot += 0.06 * (1 + 2 * lvl);
    const sx = Math.max(8, Math.min(waveW - 8, px));
    wctx.save();
    wctx.translate(sx, y0);
    wctx.rotate(starRot);
    wctx.strokeStyle = '#edf060';
    wctx.lineWidth = 2;
    wctx.lineCap = 'round';
    const R = 7 + (reduceMotion ? 0 : 2.5 * lvl);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      wctx.beginPath();
      wctx.moveTo(Math.cos(a) * R * 0.25, Math.sin(a) * R * 0.25);
      wctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      wctx.stroke();
    }
    wctx.restore();
  }

  (function waveLoop() {
    requestAnimationFrame(waveLoop);
    drawWave();
  })();

  // ---- debug overlay (?debug=1): media element state machine, on screen ----

  if (/[?&]debug=1/.test(location.search)) {
    const box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;background:rgba(17,17,17,.94);' +
      'color:#ffedfb;border:2px solid #edf060;padding:6px;margin:0;font-size:10px;line-height:1.3;' +
      'max-width:80vw;max-height:40vh;overflow:hidden;pointer-events:none;text-align:left;';
    document.body.appendChild(box);
    const lines = [];
    function dbg(msg) {
      const b = [];
      for (let i = 0; i < audio.buffered.length; i++) {
        b.push(audio.buffered.start(i).toFixed(0) + '-' + audio.buffered.end(i).toFixed(0));
      }
      lines.push('[' + (audio.currentTime || 0).toFixed(1) + 's rs=' + audio.readyState +
        ' ns=' + audio.networkState + ' buf=' + (b.join(',') || 'none') + '] ' + msg);
      if (lines.length > 16) lines.shift();
      box.textContent = lines.join('\n');
      console.log('[player-debug]', msg, 'rs=' + audio.readyState, 'ns=' + audio.networkState);
    }
    ['loadstart', 'loadedmetadata', 'durationchange', 'canplay', 'canplaythrough',
     'play', 'playing', 'pause', 'seeking', 'seeked', 'waiting', 'stalled',
     'suspend', 'abort', 'emptied', 'ended', 'error'].forEach(function (ev) {
      audio.addEventListener(ev, function () {
        dbg(ev + (ev === 'error' && audio.error ? ' code=' + audio.error.code : ''));
      });
    });
    dbg('debug overlay on · src=' + audio.currentSrc);
  }

  // ---- loudness -> garden ----

  let analyser = null;
  let data = null;
  let started = false;
  let lvl = 0;

  // iOS: routing the element through WebAudio (createMediaElementSource)
  // puts playback under the ringer/silent switch — audio "plays" but the
  // speaker stays silent. skip the analyser there; the garden still runs
  // at full speed while playing, just without loudness modulation.
  const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function initAnalyser() {
    if (started || IOS) return;
    started = true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      if (ctx.state === 'suspended') ctx.resume();
      data = new Float32Array(analyser.fftSize);
      meter();
    } catch (err) {
      analyser = null; // garden still sways at base speed while playing
    }
  }

  function meter() {
    requestAnimationFrame(meter);
    if (!analyser) return;
    if (audio.paused) {
      lvl *= 0.94; // let it breathe out
    } else if (typeof analyser.getFloatTimeDomainData === 'function') {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const target = Math.min(1, rms * 3.4);
      // fast attack, slow release — reads as "dancing", not flickering
      lvl += (target - lvl) * (target > lvl ? 0.35 : 0.08);
    }
    window.__gardenLevel = lvl;
  }

  // ---- lock screen / media keys ----

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'La Juana',
      artist: 'Cabeza de Chivo',
      artwork: [{ src: 'photos/cover.jpg', sizes: '1400x1400', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', function () { playBtn.click(); });
    navigator.mediaSession.setActionHandler('pause', function () { playBtn.click(); });
    navigator.mediaSession.setActionHandler('seekbackward', function () {
      window.__safeSeek(audio.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler('seekforward', function () {
      window.__safeSeek(audio.currentTime + 10);
    });
  }

  setGlyph();
})();
