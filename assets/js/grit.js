// grit: proximity flicker. Moving the cursor near a glow frame makes it buzz
// like a tube reacting to your hand. Ambient .neon-buzz keeps running; this
// layers a stronger .neon-zap on whatever you're near. Self-gating: only runs
// on .grit pages, and respects reduced-motion.
(function () {
  if (!document.body || !document.body.classList.contains("grit")) return;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  // same set of glow frames the ambient buzz targets
  var SELECTOR = [
    ".ascii-shows", ".store-card", ".epk-card", ".epk-clip", ".epk-shows",
    ".epk-quote", ".epk-photos img", ".epk-hero", ".epk-bandcamp",
    ".carousel-stage", ".epk-photo-teaser img"
  ].join(",");
  // Hysteresis: fire when the cursor crosses ENTER, don't re-arm until it has
  // pulled back past EXIT. Keeps edge jitter from re-triggering the burst.
  var ENTER = 130;
  var EXIT = 180;

  var items = [];
  var near = new Set(); // elements the cursor is currently "in range" of
  function collect() {
    items = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  }

  // one-shot burst: the .zap animation is finite (~1s) and removes itself on
  // animationend, so holding the cursor nearby does NOT keep it flickering.
  function zap(el) {
    el.classList.remove("zap");
    void el.offsetWidth; // reflow so the animation restarts if .zap lingered
    el.classList.add("zap");
  }
  document.addEventListener("animationend", function (e) {
    if (e.animationName === "neon-zap") e.target.classList.remove("zap");
  });

  var mx = -1, my = -1, ticking = false;
  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  function update() {
    ticking = false;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -EXIT || r.top > window.innerHeight + EXIT) {
        near.delete(el);
        continue;
      }
      // distance from the cursor to the element's rectangle (0 if inside)
      var dx = mx < r.left ? r.left - mx : mx > r.right ? mx - r.right : 0;
      var dy = my < r.top ? r.top - my : my > r.bottom ? my - r.bottom : 0;
      var dist2 = dx * dx + dy * dy;
      if (near.has(el)) {
        if (dist2 > EXIT * EXIT) near.delete(el); // pulled away: re-arm
      } else if (dist2 < ENTER * ENTER) {
        near.add(el); // just entered range: one burst
        zap(el);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", collect);
  } else {
    collect();
  }
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("resize", collect);
})();
