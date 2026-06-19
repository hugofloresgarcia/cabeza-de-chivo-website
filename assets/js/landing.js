let images = [];

function preloadAll(p) {
  for (let i = 1; i <= 5; i++) {
    images.push(p.loadImage(`/assets/img/photo/masked-polaroids/masked-${i}.jpg`));
  }
  images.push(p.loadImage(`/assets/img/photo/masked-polaroids/the-mask.jpg`));
}

// Shared state for shuffling
let hoveredIndex = -1;

// grit: feedback trails. Instead of hard-clearing each frame, lay down a
// translucent wash so the shuffling polaroids smear and decay (medium smear).
// Disabled under reduced-motion (we hard-clear instead, no trails).
const REDUCE_MOTION =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TRAIL_ALPHA = 45; // lower = longer trails; #211a1e over the canvas

function makeSketch(startIndex, containerId) {
  return function (p) {
    let positions = [];
    let imgWidth = 50;
    let imgHeight = 50;
    let spacing = 0;

    function recalculateSizes() {
      const effectiveWidth = p.width;
      imgWidth = Math.floor(effectiveWidth / (6+1)); // show 6 images with space
      imgHeight = imgWidth; // square images
    }

    function recalculatePositions() {
      positions = [];
      const totalWidth = 6 * imgWidth;
      const startX = (p.width - totalWidth) / 2;
      for (let i = 0; i < 6; i++) {
        let x = startX + i * imgWidth;
        positions.push({ x, y: 0, w: imgWidth, h: imgHeight, index: startIndex + i });
      }
    }

    p.preload = function () {
      if (images.length === 0) {
        preloadAll(p);
      }
    };

    p.setup = function () {
      recalculateSizes();
      p.createCanvas(p.windowWidth, imgHeight).parent(containerId);
      recalculatePositions();

      // Trigger resize again shortly after to account for zoom/layout adjustments.
      // Only resize when the width actually changed — resizeCanvas clears the
      // canvas, which would wipe the feedback trails on every tick otherwise.
      let lastW = p.windowWidth;
      setInterval(() => {
        if (p.windowWidth === lastW) return;
        lastW = p.windowWidth;
        recalculateSizes();
        p.resizeCanvas(p.windowWidth, imgHeight);
        recalculatePositions();
      }, 300); // 100ms is usually enough

      setInterval(() => {
        // flip a coin with 33% skip prob
        if (Math.random() > 0.33) {
          recalculateSizes();
          shuffleImages();
          recalculatePositions();
        }
      }, 300); // 100ms is usually enough
    };

    p.windowResized = function () {
      recalculateSizes();
      p.resizeCanvas(p.windowWidth, imgHeight);
      recalculatePositions();
    };

    p.draw = function () {
      if (REDUCE_MOTION) {
        p.background("#211a1e"); // hard clear, no trails
      } else {
        // translucent wash -> previous frames smear and decay (feedback trail)
        p.noStroke();
        p.fill(33, 26, 30, TRAIL_ALPHA); // #211a1e
        p.rect(0, 0, p.width, p.height);
      }
      for (let pos of positions) {
        const img = images[pos.index];
        const ratio = img.width / img.height;
        let w = pos.w;
        let h = pos.w / ratio;

        if (h > pos.h) {
          h = pos.h;
          w = pos.h * ratio;
        }

        const offsetX = (pos.w - w) / 2;
        const offsetY = (pos.h - h) / 2;
        p.image(img, pos.x + offsetX, pos.y + offsetY, w, h);
      }
    };

    p.mouseMoved = function () {
      for (let pos of positions) {
        if (
          p.mouseX > pos.x &&
          p.mouseX < pos.x + pos.w &&
          p.mouseY > pos.y &&
          p.mouseY < pos.y + pos.h
        ) {
          if (hoveredIndex !== pos.index) {
            shuffleImages();
            hoveredIndex = pos.index;
          }
          return;
        }
      }
      hoveredIndex = -1;
    };

    function shuffleImages() {
      let i = Math.floor(p.random(images.length));
      let j = Math.floor(p.random(images.length));
      if (i !== j) {
        [images[i], images[j]] = [images[j], images[i]];
      }
    }
  };
}

// Create the two sketches
new p5(makeSketch(0, 'top-sketch'));
new p5(makeSketch(0, 'bottom-sketch'));
