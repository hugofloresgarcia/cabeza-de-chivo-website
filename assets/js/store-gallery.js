// Tiny front/back flip gallery for store cards. Inits every
// [data-store-gallery]. Scoped to .store-* classes so it stays clear of the
// full-bleed photo carousel (assets/js/carousel.js). Idempotent.
(function () {
  function init(g) {
    if (g.dataset.ready) return;
    g.dataset.ready = '1';

    var slides = g.querySelectorAll('.store-slide');
    var dots = g.querySelectorAll('.store-gallery__dot');
    if (slides.length < 2) return;
    var i = 0;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    }

    var prev = g.querySelector('[data-prev]');
    var next = g.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); show(i - 1); });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); show(i + 1); });

    var x0 = null;
    g.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    g.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
  }

  function all() { document.querySelectorAll('[data-store-gallery]').forEach(init); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all);
  else all();
})();
