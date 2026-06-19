// Photo carousel behaviour. Initialises every [data-carousel] on the page.
// Idempotent: safe if loaded more than once and only inits each carousel once.
(function () {
  function initCarousel(c) {
    if (c.dataset.ready) return;
    c.dataset.ready = '1';

    var slides = c.querySelectorAll('.carousel-slide');
    var thumbs = c.querySelectorAll('.carousel-thumb');
    var cur = c.querySelector('[data-current]');
    var i = 0;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      thumbs.forEach(function (t, k) { t.classList.toggle('is-active', k === i); });
      if (cur) cur.textContent = i + 1;
      if (thumbs[i]) thumbs[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }

    var prev = c.querySelector('[data-prev]');
    var next = c.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    thumbs.forEach(function (t) { t.addEventListener('click', function () { show(+t.dataset.goto); }); });

    c.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    });

    var x0 = null;
    c.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    c.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
  }

  function initAll() { document.querySelectorAll('[data-carousel]').forEach(initCarousel); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
