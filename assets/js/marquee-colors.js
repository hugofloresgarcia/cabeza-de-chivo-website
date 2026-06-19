// Add variety to the ~*~* divider/border bars: paint each one either the
// site red or teal (#0d9488), chosen at random on each load.
(function () {
  var colors = ['var(--primary-red)', '#0d9488'];
  function paint() {
    document.querySelectorAll('.epk-rule, .ascii-shows-border').forEach(function (el) {
      el.style.color = colors[Math.random() < 0.5 ? 0 : 1];
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
  else paint();
})();
