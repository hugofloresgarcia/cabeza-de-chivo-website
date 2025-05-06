let images = [];

function preloadAll(p) {
  for (let i = 1; i <= 5; i++) {
    images.push(p.loadImage(`/assets/img/photo/masked-polaroids/masked-${i}.jpg`));
  }
  images.push(p.loadImage(`/assets/img/photo/masked-polaroids/the-mask.jpg`));
}

// Shared state for shuffling
let hoveredIndex = -1;

function makeSketch(startIndex, containerId) {
  return function (p) {
    let positions = [];
    let imgWidth = 200;
    let imgHeight = 200;
    let spacing = 0;

    function recalculateSizes() {
      const effectiveWidth = p.width;
      imgWidth = Math.floor(effectiveWidth / 4); // show 3 images with space
      imgHeight = imgWidth; // square images
    }

    function recalculatePositions() {
      positions = [];
      const totalWidth = 3 * imgWidth;
      const startX = (p.width - totalWidth) / 2;
      for (let i = 0; i < 3; i++) {
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
    
      // Trigger resize again shortly after to account for zoom/layout adjustments
      setTimeout(() => {
        recalculateSizes();
        p.resizeCanvas(p.windowWidth, imgHeight);
        recalculatePositions();
      }, 100); // 100ms is usually enough
    };

    p.windowResized = function () {
      recalculateSizes();
      p.resizeCanvas(p.windowWidth, imgHeight);
      recalculatePositions();
    };

    p.draw = function () {
      p.background("#211a1e");
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
new p5(makeSketch(3, 'bottom-sketch'));
