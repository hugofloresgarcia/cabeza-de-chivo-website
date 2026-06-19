// Little spinning "el chivo" in the footer — an instance-mode p5 sketch so it
// won't clash with the page's other p5 sketches. Auto-changes to a random neon
// color every 800ms. No sound. Pauses itself while scrolled out of view.
(function () {
  if (typeof p5 === 'undefined') return;
  var el = document.getElementById('footer-goat');
  if (!el) return;

  var NEON = [
    [255, 20, 147], [255, 255, 0], [57, 255, 20], [0, 255, 255],
    [255, 0, 255], [0, 255, 128], [255, 128, 0], [128, 0, 255]
  ];
  var SIZE = 120;

  new p5(function (p) {
    var shape, tint, fit = 1, lastChange = 0;

    p.preload = function () { shape = p.loadModel('/assets/chivo.obj', true); };

    p.setup = function () {
      p.createCanvas(SIZE, SIZE, p.WEBGL);
      p.noStroke();
      p.frameRate(30);
      tint = p.color(NEON[0][0], NEON[0][1], NEON[0][2]);

      // auto-fit: scale so the model's largest dimension fills ~62% of the canvas
      var vs = (shape && shape.vertices) || [];
      if (vs.length) {
        var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        for (var i = 0; i < vs.length; i++) {
          var v = vs[i];
          lo[0] = Math.min(lo[0], v.x); hi[0] = Math.max(hi[0], v.x);
          lo[1] = Math.min(lo[1], v.y); hi[1] = Math.max(hi[1], v.y);
          lo[2] = Math.min(lo[2], v.z); hi[2] = Math.max(hi[2], v.z);
        }
        var maxDim = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) || 1;
        fit = (SIZE * 0.62) / maxDim;
      }

      // only animate while the goat is on screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { e.isIntersecting ? p.loop() : p.noLoop(); });
        }).observe(el);
      }
    };

    p.draw = function () {
      p.clear();
      if (p.millis() - lastChange > 800) {
        var c = NEON[Math.floor(p.random(NEON.length))];
        tint = p.color(c[0], c[1], c[2]);
        lastChange = p.millis();
      }
      p.rotateY(p.frameCount * 0.03);
      p.rotateX(p.frameCount * 0.012);
      p.scale(fit);
      p.fill(tint);
      p.model(shape);
    };
  }, el);
})();
