let shape;
let bgColor;
let sound;
let modelScale = 2;
let baseRotateSpeed = 0.01;
let extraRotateSpeed = 0;
let fastUntil = 0;

// Preload model & sound
function preload() {
  shape = loadModel('/assets/chivo.obj', true);
  soundFormats('wav');
  sound = loadSound('/assets/audio/chivo-delay.wav');
}

function setup() {
  createCanvas(windowWidth, 600, WEBGL).parent("sketch");
  describe('A spinning goat. Click or tap to play a sound.');
  bgColor = color("#211a1e");
  
  // play as soon as it's ready
  sound.play();
}

// return a random neon-style color from an expanded palette
function randomNeon() {
  const choices = [
    color(255, 20, 147),  // neon pink/red
    color(255, 255, 0),   // neon yellow
    color(57, 255, 20),   // neon green
    color(0, 255, 255),   // neon cyan
    color(255, 0, 255),   // neon magenta
    color(0, 255, 128),   // neon aqua-green
    color(255, 128, 0),   // neon orange
    color(128, 0, 255)    // neon purple
  ];
  return random(choices);
}

function draw() {
  background(bgColor);

  // determine current extra speed
  if (millis() < fastUntil) {
    extraRotateSpeed = 0.2;  // fast spin
  } else {
    extraRotateSpeed = 0;
  }

  // apply rotations
  rotateY(frameCount * (baseRotateSpeed + extraRotateSpeed));
  rotateX(frameCount * (baseRotateSpeed + extraRotateSpeed));

  // scale & color
  scale(modelScale);
  if (modelTint) {
    push();
    fill(modelTint);
    model(shape);
    pop();
  } else {
    model(shape);
  }
}

// track current tint
let modelTint = null;

// on click/tap
function mousePressed() {
  // replay sound
  sound.play();

  // new neon tint from expanded palette
  modelTint = randomNeon();

  // spin fast for 2 seconds
  fastUntil = millis() + 2000;
}
