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

    p.preload = function () {
      if (images.length === 0) {
        preloadAll(p);
      }
    };

    p.setup = function () {
      p.createCanvas(p.windowWidth, imgHeight).parent(containerId);
      recalculatePositions();
    };

    p.windowResized = function () {
      p.resizeCanvas(p.windowWidth, imgHeight);
      recalculatePositions();
    };

    function recalculatePositions() {
      positions = [];
      let totalWidth = 3 * imgWidth + 2 * spacing;
      let startX = (p.width - totalWidth) / 2;
      for (let i = 0; i < 3; i++) {
        let x = startX + i * (imgWidth + spacing);
        positions.push({ x, y: 0, w: imgWidth, h: imgHeight, index: startIndex + i });
      }
      // for (let i = 0; i < 3; i++) {
       
      //   let x = (p.width - (3 * imgWidth + 2 * spacing)) / 2 + i * (imgWidth + spacing);
      //   positions.push({ x, y: 0, w: imgWidth, h: imgHeight, index: startIndex + i });
      // }
    }

    p.draw = function () {
      p.background(0);
      for (let pos of positions) {
        let img = images[pos.index];
        let ratio = img.width / img.height;
        let w = pos.w;
        let h = pos.w / ratio;

        if (h > pos.h) {
          h = pos.h;
          w = pos.h * ratio;
        }

        let offsetX = (pos.w - w) / 2;
        let offsetY = (pos.h - h) / 2;

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
