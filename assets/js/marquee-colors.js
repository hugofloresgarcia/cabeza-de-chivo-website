// Add variety to the site's neon accents: on each load, randomly tint the
// ~*~* divider bars and the double-line frames (around images, video, tables,
// cards, the logo) one of yellow / red / teal. The glow (box-shadow) is left
// alone so the grit "neon buzz" animation keeps working.
(function () {
  var palette = ['var(--secondary-orange)', 'var(--primary-red)', '#0d9488']; // yellow, red, teal
  function pick() { return palette[Math.floor(Math.random() * palette.length)]; }

  var FRAMES = [
    '.epk-clip', '.carousel-stage', '.epk-hero', '.epk-bandcamp', '.epk-quote',
    '.store-card', '.ascii-shows', '.epk-shows', '.site-logo img', '.epk-photos img'
  ].join(', ');

  function paint() {
    document.querySelectorAll('.epk-rule, .ascii-shows-border').forEach(function (el) {
      el.style.color = pick();
    });
    document.querySelectorAll(FRAMES).forEach(function (el) {
      el.style.borderColor = pick();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
  else paint();
})();
