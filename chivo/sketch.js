let shape;
let bgColor;
let sound;
let modelScale = 2;
let modelRadius = 100; // approximate clickable radius

function preload() {
  shape = loadModel('/assets/chivo.obj', true);
  sound = loadSound('/assets/audio/chivo-delay.wav');
}

function setup() {
  createCanvas(windowWidth, 600, WEBGL).parent("sketch"); // 600px tall, adjust as needed
  describe('A spinning goat. Click or tap to play a sound.');
  bgColor = color("#211a1e");
}


function color_vary(clr, amt) {
  let h = hue(clr);
  let s = saturation(clr);
  let b = brightness(clr);
  return color(
    h + random(-amt, amt), 
    s + random(-amt, amt), 
    b + random(-amt, amt)
  );
}

function draw() {
  background(bgColor);
  // orbitControl();

  rotateY(frameCount * 0.01);
  rotateX(frameCount * 0.01);

  scale(modelScale);
  model(shape);
}

// Handle mouse or touch interaction
function mousePressed() {
    // Convert screen click to normalized device coordinates
    let x = (mouseX / width - 0.5) * 2;
    let y = (mouseY / height - 0.5) * -2;

    // Approximate if we're near the model center (origin in WEBGL mode)
    // You could enhance this by projecting 3D coordinates to screen space, but this works for a centered object.
    let dx = mouseX - width / 2;
    let dy = mouseY - height / 2;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < modelRadius * modelScale) {
      sound.play();
    }
}
